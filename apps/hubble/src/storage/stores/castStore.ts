import * as protobufs from '@farcaster/protobufs';
import { bytesCompare, getFarcasterTime, HubAsyncResult, HubError } from '@farcaster/utils';
import { err, ok, ResultAsync } from 'neverthrow';
import {
  deleteMessageTransaction,
  getAllMessagesBySigner,
  getManyMessages,
  getManyMessagesByFid,
  getMessage,
  getMessagesPruneIterator,
  getNextMessageToPrune,
  makeCastIdKey,
  makeFidKey,
  makeMessagePrimaryKey,
  makeTsHash,
  makeUserKey,
  putMessageTransaction,
} from '~/storage/db/message';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import { FID_BYTES, RootPrefix, TRUE_VALUE, UserPostfix } from '~/storage/db/types';
import SequentialMergeStore, { MAX_QUEUE_SIZE, MERGE_TIMEOUT } from '~/storage/stores/sequentialMergeStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { StorePruneOptions } from '~/storage/stores/types';
import { sleepWhile } from '~/utils/crypto';

const PRUNE_SIZE_LIMIT_DEFAULT = 10_000;
const PRUNE_TIME_LIMIT_DEFAULT = 60 * 60 * 24 * 365; // 1 year

/**
 * Generates unique keys used to store or fetch CastAdd messages in the adds set index
 *
 * @param fid farcaster id of the user who created the cast
 * @param hash hash of the cast
 * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<tsHash?>
 */
const makeCastAddsKey = (fid: number, hash?: Uint8Array): Buffer => {
  return Buffer.concat([makeUserKey(fid), Buffer.from([UserPostfix.CastAdds]), Buffer.from(hash ?? '')]);
};

/**
 * Generates unique keys used to store or fetch CastAdd messages in the removes set index
 *
 * @param fid farcaster id of the user who created the cast
 * @param hash hash of the cast
 * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<tsHash?>
 */
const makeCastRemovesKey = (fid: number, hash?: Uint8Array): Buffer => {
  return Buffer.concat([makeUserKey(fid), Buffer.from([UserPostfix.CastRemoves]), Buffer.from(hash ?? '')]);
};

// TODO: make parentFid and parentHash fixed size
/**
 * Generates unique keys used to store or fetch CastAdd messages in the byParentKey index
 *
 * @param parentFid the fid of the user who created the parent cast
 * @param parentTsHash the timestamp hash of the parent message
 * @param fid the fid of the user who created the cast
 * @param tsHash the timestamp hash of the cast message
 * @returns RocksDB index key of the form <root_prefix>:<parentFid>:<parentTsHash>:<fid?>:<tsHash?>
 */
/** RocksDB key of the form <castsByParent prefix byte, parent fid, parent cast tsHash, fid, cast tsHash> */
const makeCastsByParentKey = (parentId: protobufs.CastId, fid?: number, tsHash?: Uint8Array): Buffer => {
  return Buffer.concat([
    Buffer.from([RootPrefix.CastsByParent]),
    makeCastIdKey(parentId),
    fid ? makeFidKey(fid) : Buffer.from(''),
    Buffer.from(tsHash ?? ''),
  ]);
};

/**
 * Generates unique keys used to store or fetch CastAdd messages in the byParentKey index
 *
 * @param mentionFid the fid of the user who was mentioned in the cast
 * @param fid the fid of the user who created the cast
 * @param tsHash the timestamp hash of the cast message
 * @returns RocksDB index key of the form <root_prefix>:<mentionFid>::<fid?>:<tsHash?>
 */
const makeCastsByMentionKey = (mentionFid: number, fid?: number, tsHash?: Uint8Array): Buffer => {
  return Buffer.concat([
    Buffer.from([RootPrefix.CastsByMention]),
    makeFidKey(mentionFid),
    fid ? makeFidKey(fid) : Buffer.from(''),
    Buffer.from(tsHash ?? ''),
  ]);
};

/**
 * CastStore persists Cast messages in RocksDB using a two-phase CRDT set to guarantee eventual
 * consistency.
 *
 * A Cast is created by a user and contains 320 characters of text and upto two embedded URLs.
 * Casts are added to the Store with a CastAdd and removed with a CastRemove. A CastAdd can be
 * a child to another CastAdd or arbitrary URI.
 *
 * Cast Messages collide if their tsHash (for CastAdds) or targetTsHash (for CastRemoves) are the
 * same for the same fid. Two CastAdds can never collide since any change to message content is
 * guaranteed to result in a unique hash value. CastRemoves can collide with CastAdds and with
 * each other, and such cases are handled with Remove-Wins and Last-Write-Wins rules as follows:
 *
 * 1. Remove wins over Adds
 * 2. Highest timestamp wins
 * 3. Highest lexicographic hash wins
 *
 * CastMessages are stored ordinally in RocksDB indexed by a unique key `fid:tsHash` which makes
 * truncating a user's earliest messages easy. Indices are built to lookup cast adds in the adds
 * set, cast removes in the removes set, cast adds that are the children of a cast add, and cast
 * adds that mention a specific user. The key-value entries created are:
 *
 * 1. fid:tsHash -> cast message
 * 2. fid:set:tsHash -> fid:tsHash (Add Set Index)
 * 3. fid:set:targetTsHash -> fid:tsHash (Remove Set Index)
 * 4. parentFid:parentTsHash:fid:tsHash -> fid:tsHash (Child Set Index)
 * 5. mentionFid:fid:tsHash -> fid:tsHash (Mentions Set Index)
 */
class CastStore extends SequentialMergeStore {
  private _db: RocksDB;
  private _eventHandler: StoreEventHandler;
  private _pruneSizeLimit: number;
  private _pruneTimeLimit: number;

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    super();

    this._db = db;
    this._eventHandler = eventHandler;
    this._pruneSizeLimit = options.pruneSizeLimit ?? PRUNE_SIZE_LIMIT_DEFAULT;
    this._pruneTimeLimit = options.pruneTimeLimit ?? PRUNE_TIME_LIMIT_DEFAULT;
  }

  /** Looks up CastAdd message by cast tsHash */
  async getCastAdd(fid: number, hash: Uint8Array): Promise<protobufs.CastAddMessage> {
    const addsKey = makeCastAddsKey(fid, hash);
    const messageTsHash = await this._db.get(addsKey);
    return getMessage(this._db, fid, UserPostfix.CastMessage, messageTsHash);
  }

  /** Looks up CastRemove message by cast tsHash */
  async getCastRemove(fid: number, hash: Uint8Array): Promise<protobufs.CastRemoveMessage> {
    const removesKey = makeCastRemovesKey(fid, hash);
    const messageTsHash = await this._db.get(removesKey);
    return getMessage(this._db, fid, UserPostfix.CastMessage, messageTsHash);
  }

  /** Gets all CastAdd messages for an fid */
  async getCastAddsByFid(fid: number): Promise<protobufs.CastAddMessage[]> {
    const castAddsPrefix = makeCastAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(castAddsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return getManyMessagesByFid(this._db, fid, UserPostfix.CastMessage, messageKeys);
  }

  /** Gets all CastRemove messages for an fid */
  async getCastRemovesByFid(fid: number): Promise<protobufs.CastRemoveMessage[]> {
    const castRemovesPrefix = makeCastRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(castRemovesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return getManyMessagesByFid(this._db, fid, UserPostfix.CastMessage, messageKeys);
  }

  /** Gets all CastAdd messages for a parent cast (fid and tsHash) */
  async getCastsByParent(parentId: protobufs.CastId): Promise<protobufs.CastAddMessage[]> {
    const byParentPrefix = makeCastsByParentKey(parentId);
    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(byParentPrefix, { keyAsBuffer: true, values: false })) {
      const fid = Number((key as Buffer).readUint32BE(byParentPrefix.length));
      const tsHash = Uint8Array.from(key).subarray(byParentPrefix.length + FID_BYTES);
      const messagePrimaryKey = makeMessagePrimaryKey(fid, UserPostfix.CastMessage, tsHash);
      messageKeys.push(messagePrimaryKey);
    }
    return getManyMessages(this._db, messageKeys);
  }

  /** Gets all CastAdd messages for a mention (fid) */
  async getCastsByMention(mentionFid: number): Promise<protobufs.CastAddMessage[]> {
    const byMentionPrefix = makeCastsByMentionKey(mentionFid);
    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(byMentionPrefix, { keyAsBuffer: true, values: false })) {
      const fid = Number((key as Buffer).readUint32BE(byMentionPrefix.length));
      const tsHash = Uint8Array.from(key).subarray(byMentionPrefix.length + FID_BYTES);
      const messagePrimaryKey = makeMessagePrimaryKey(fid, UserPostfix.CastMessage, tsHash);
      messageKeys.push(messagePrimaryKey);
    }
    return getManyMessages(this._db, messageKeys);
  }

  /** Merges a CastAdd or CastRemove message into the set */
  async merge(message: protobufs.Message): Promise<void> {
    if (!protobufs.isCastAddMessage(message) && !protobufs.isCastRemoveMessage(message)) {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }

    // Block call if message queue is full until timeout.
    // This creates backpressure if the queue is full for anyone that is merging (rpc, sync, gossip)
    // This is to prevent the queue from growing indefinitely and timing out.
    if (this.queueSize() >= MAX_QUEUE_SIZE) {
      await sleepWhile(() => this.queueSize() >= MAX_QUEUE_SIZE, MERGE_TIMEOUT);
    }

    const mergeResult = await this.mergeSequential(message);
    if (mergeResult.isErr()) {
      throw mergeResult.error;
    }

    return mergeResult.value;
  }

  async revokeMessagesBySigner(fid: number, signer: Uint8Array): HubAsyncResult<void> {
    // Get all CastAdd messages signed by signer
    const castAdds = await getAllMessagesBySigner<protobufs.CastAddMessage>(
      this._db,
      fid,
      signer,
      protobufs.MessageType.MESSAGE_TYPE_CAST_ADD
    );

    // Get all CastRemove messages signed by signer
    const castRemoves = await getAllMessagesBySigner<protobufs.CastRemoveMessage>(
      this._db,
      fid,
      signer,
      protobufs.MessageType.MESSAGE_TYPE_CAST_REMOVE
    );

    // Create a rocksdb transaction
    let txn = this._db.transaction();

    // Add a delete operation to the transaction for each CastAdd
    for (const message of castAdds) {
      txn = this.deleteCastAddTransaction(txn, message);
    }

    // Add a delete operation to the transaction for each CastRemove
    for (const message of castRemoves) {
      txn = this.deleteCastRemoveTransaction(txn, message);
    }

    await this._db.commit(txn);

    // Emit a revokeMessage event for each message
    for (const message of [...castAdds, ...castRemoves]) {
      this._eventHandler.emit('revokeMessage', message);
    }

    return ok(undefined);
  }

  async pruneMessages(fid: number): HubAsyncResult<void> {
    // Count number of CastAdd and CastRemove messages for this fid
    // TODO: persist this count to avoid having to retrieve it with each call
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.CastMessage);
    let count = 0;
    for await (const [,] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      count = count + 1;
    }

    // Calculate the number of messages that need to be pruned, based on the store's size limit
    let sizeToPrune = count - this._pruneSizeLimit;

    const farcasterTime = getFarcasterTime();
    if (farcasterTime.isErr()) {
      return err(farcasterTime.error);
    }

    // Calculate the timestamp cut-off to prune
    const timestampToPrune = farcasterTime.value - this._pruneTimeLimit;

    // Keep track of the messages that get pruned so that we can emit pruneMessage events after the transaction settles
    const messageToPrune: (protobufs.CastAddMessage | protobufs.CastRemoveMessage)[] = [];

    // Create a rocksdb transaction to include all the mutations
    let pruneTsx = this._db.transaction();

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = getMessagesPruneIterator(this._db, fid, UserPostfix.CastMessage);

    const getNextResult = () => ResultAsync.fromPromise(getNextMessageToPrune(pruneIterator), () => undefined);

    // For each message in order, prune it if the store is over the size limit or the message was signed
    // before the timestamp cut-off
    let nextMessage = await getNextResult();
    while (
      nextMessage.isOk() &&
      (sizeToPrune > 0 || (nextMessage.value.data && nextMessage.value.data.timestamp < timestampToPrune))
    ) {
      const message = nextMessage.value;

      // Add a delete operation to the transaction depending on the message type
      if (protobufs.isCastAddMessage(message)) {
        pruneTsx = this.deleteCastAddTransaction(pruneTsx, message);
      } else if (protobufs.isCastRemoveMessage(message)) {
        pruneTsx = this.deleteCastRemoveTransaction(pruneTsx, message);
      } else {
        throw new HubError('unknown', 'invalid message type');
      }

      // Store the message in order to emit the pruneMessage event later, decrement the number of messages
      // yet to prune, and try to get the next message from the iterator
      messageToPrune.push(message);
      sizeToPrune = Math.max(0, sizeToPrune - 1);
      nextMessage = await getNextResult();
    }

    if (messageToPrune.length > 0) {
      // Commit the transaction to rocksdb
      await this._db.commit(pruneTsx);

      // For each of the pruned messages, emit a pruneMessage event
      for (const message of messageToPrune) {
        this._eventHandler.emit('pruneMessage', message);
      }
    }

    return ok(undefined);
  }

  protected async mergeFromSequentialQueue(message: protobufs.Message): Promise<void> {
    if (protobufs.isCastAddMessage(message)) {
      return this.mergeAdd(message);
    } else if (protobufs.isCastRemoveMessage(message)) {
      return this.mergeRemove(message);
    } else {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: protobufs.CastAddMessage): Promise<void> {
    // Start RocksDB transaction
    let txn = this._db.transaction();

    // Look up the remove tsHash for this cast
    const castRemoveTsHash = await ResultAsync.fromPromise(
      this._db.get(makeCastRemovesKey(message.data.fid, message.hash)),
      () => undefined
    );

    // If remove tsHash exists, fail because this cast has already been removed
    if (castRemoveTsHash.isOk()) {
      throw new HubError('bad_request.conflict', 'message conflicts with a CastRemove');
    }

    // Look up the add tsHash for this cast
    const castAddTsHash = await ResultAsync.fromPromise(
      this._db.get(makeCastAddsKey(message.data.fid, message.hash)),
      () => undefined
    );

    // If add tsHash exists, no-op because this cast has already been added
    if (castAddTsHash.isOk()) {
      throw new HubError('bad_request.duplicate', 'message has already been merged');
    }

    // Add putCastAdd operations to the RocksDB transaction
    txn = this.putCastAddTransaction(txn, message);

    // Commit the RocksDB transaction
    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message);

    return undefined;
  }

  private async mergeRemove(message: protobufs.CastRemoveMessage): Promise<void> {
    // Define cast hash for lookups
    const removeTargetHash = message.data.castRemoveBody.targetHash;

    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const mergeConflicts: (protobufs.CastAddMessage | protobufs.CastRemoveMessage)[] = [];

    // Start RocksDB transaction
    let txn = this._db.transaction();

    // Look up the remove tsHash for this cast
    const castRemoveTsHash = await ResultAsync.fromPromise(
      this._db.get(makeCastRemovesKey(message.data.fid, removeTargetHash)),
      () => undefined
    );

    if (castRemoveTsHash.isOk()) {
      const removeCompare = bytesCompare(castRemoveTsHash.value, tsHash.value);

      if (removeCompare > 0) {
        throw new HubError('bad_request.conflict', 'message conflicts with a more recent CastRemove');
      } else if (removeCompare === 0) {
        throw new HubError('bad_request.duplicate', 'message has already been merged');
      } else {
        // If the remove tsHash exists but with a lower order than the new CastRemove
        // tsHash, retrieve the full CastRemove message and delete it as part of the
        // RocksDB transaction
        const existingRemove = await getMessage<protobufs.CastRemoveMessage>(
          this._db,
          message.data.fid,
          UserPostfix.CastMessage,
          castRemoveTsHash.value
        );
        txn = this.deleteCastRemoveTransaction(txn, existingRemove);
        mergeConflicts.push(existingRemove);
      }
    }

    // Look up the add tsHash for this cast
    const castAddTsHash = await ResultAsync.fromPromise(
      this._db.get(makeCastAddsKey(message.data.fid, removeTargetHash)),
      () => undefined
    );

    // If the add tsHash exists, retrieve the full CastAdd message and delete it as
    // part of the RocksDB transaction
    if (castAddTsHash.isOk()) {
      const existingAdd = await getMessage<protobufs.CastAddMessage>(
        this._db,
        message.data.fid,
        UserPostfix.CastMessage,
        castAddTsHash.value
      );
      txn = this.deleteCastAddTransaction(txn, existingAdd);
      mergeConflicts.push(existingAdd);
    }

    // Add putCastRemove operations to the RocksDB transaction
    txn = this.putCastRemoveTransaction(txn, message);

    // Commit the RocksDB transaction
    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message, mergeConflicts);
  }

  /* Builds a RocksDB transaction to insert a CastAdd message and construct its indices */
  private putCastAddTransaction(txn: Transaction, message: protobufs.CastAddMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Put message into the database
    txn = putMessageTransaction(txn, message);

    // Puts the message key into the CastAdd set index
    txn = txn.put(makeCastAddsKey(message.data.fid, message.hash), Buffer.from(tsHash.value));

    // Puts the message key into the ByParent index
    if (message.data.castAddBody.parentCastId) {
      txn = txn.put(
        makeCastsByParentKey(message.data.castAddBody.parentCastId, message.data.fid, tsHash.value),
        TRUE_VALUE
      );
    }

    // Puts the message key into the ByMentions index
    for (const mentionFid of message.data.castAddBody.mentions) {
      txn = txn.put(makeCastsByMentionKey(mentionFid, message.data.fid, tsHash.value), TRUE_VALUE);
    }

    return txn;
  }

  /* Builds a RocksDB transaction to remove a CastAdd message and delete its indices */
  private deleteCastAddTransaction(txn: Transaction, message: protobufs.CastAddMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Delete the message key from the ByMentions index
    for (const mentionFid of message.data.castAddBody.mentions) {
      txn = txn.del(makeCastsByMentionKey(mentionFid, message.data.fid, tsHash.value));
    }

    // Delete the message key from the ByParent index
    if (message.data.castAddBody.parentCastId) {
      txn = txn.del(makeCastsByParentKey(message.data.castAddBody.parentCastId, message.data.fid, tsHash.value));
    }

    // Delete the message key from the CastAdd set index
    txn = txn.del(makeCastAddsKey(message.data.fid, message.hash));

    // Delete message
    return deleteMessageTransaction(txn, message);
  }

  /* Builds a RocksDB transaction to insert a CastRemove message and construct its indices */
  private putCastRemoveTransaction(txn: Transaction, message: protobufs.CastRemoveMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Puts the message
    txn = putMessageTransaction(txn, message);

    // Puts the message key into the CastRemoves set index
    const removesKey = makeCastRemovesKey(message.data.fid, message.data.castRemoveBody.targetHash);
    txn = txn.put(removesKey, Buffer.from(tsHash.value));

    return txn;
  }

  /* Builds a RocksDB transaction to remove a CastRemove message and delete its indices */
  private deleteCastRemoveTransaction(txn: Transaction, message: protobufs.CastRemoveMessage): Transaction {
    // Deletes the message key from the CastRemoves set index
    const removesKey = makeCastRemovesKey(message.data.fid, message.data.castRemoveBody.targetHash);
    txn = txn.del(removesKey);

    // Delete message
    return deleteMessageTransaction(txn, message);
  }
}

export default CastStore;
