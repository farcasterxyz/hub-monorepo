import { CastId, MessageType } from '@hub/flatbuffers';
import { ok, ResultAsync } from 'neverthrow';
import MessageModel, { FID_BYTES, TRUE_VALUE } from '~/flatbuffers/models/messageModel';
import { isCastAdd, isCastRemove } from '~/flatbuffers/models/typeguards';
import { CastAddModel, CastRemoveModel, RootPrefix, StorePruneOptions, UserPostfix } from '~/flatbuffers/models/types';
import { bytesCompare } from '~/flatbuffers/utils/bytes';
import { getFarcasterTime } from '~/flatbuffers/utils/time';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { HubAsyncResult, HubError } from '~/utils/hubErrors';

const PRUNE_SIZE_LIMIT_DEFAULT = 10_000;
const PRUNE_TIME_LIMIT_DEFAULT = 60 * 60 * 24 * 365; // 1 year

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
class CastStore {
  private _db: RocksDB;
  private _eventHandler: StoreEventHandler;
  private _pruneSizeLimit: number;
  private _pruneTimeLimit: number;

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    this._db = db;
    this._eventHandler = eventHandler;
    this._pruneSizeLimit = options.pruneSizeLimit ?? PRUNE_SIZE_LIMIT_DEFAULT;
    this._pruneTimeLimit = options.pruneTimeLimit ?? PRUNE_TIME_LIMIT_DEFAULT;
  }

  /**
   * Generates unique keys used to store or fetch CastAdd messages in the adds set index
   *
   * @param fid farcaster id of the user who created the cast
   * @param tsHash timestamp hash of the cast
   * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<tsHash?>
   */
  static castAddsKey(fid: Uint8Array, tsHash?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.CastAdds]),
      tsHash ? Buffer.from(tsHash) : new Uint8Array(),
    ]);
  }

  /**
   * Generates unique keys used to store or fetch CastAdd messages in the removes set index
   *
   * @param fid farcaster id of the user who created the cast
   * @param tsHash timestamp hash of the cast
   * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<tsHash?>
   */
  static castRemovesKey(fid: Uint8Array, tsHash?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.CastRemoves]),
      tsHash ? Buffer.from(tsHash) : new Uint8Array(),
    ]);
  }

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
  static castsByParentKey(
    parentFid: Uint8Array,
    parentTsHash: Uint8Array,
    fid?: Uint8Array,
    tsHash?: Uint8Array
  ): Buffer {
    const bytes = new Uint8Array(
      1 + FID_BYTES + parentTsHash.length + (fid ? FID_BYTES : 0) + (tsHash ? tsHash.length : 0)
    );
    bytes.set([RootPrefix.CastsByParent], 0);
    bytes.set(parentFid, 1 + FID_BYTES - parentFid.length); // pad fid for alignment
    bytes.set(parentTsHash, 1 + FID_BYTES);
    if (fid) {
      bytes.set(fid, 1 + FID_BYTES + parentTsHash.length + FID_BYTES - fid.length); // pad fid for alignment
    }
    if (tsHash) {
      bytes.set(tsHash, 1 + FID_BYTES + parentTsHash.length + FID_BYTES);
    }
    return Buffer.from(bytes);
  }

  // TODO: make parentFid and parentTsHash fixed size
  /**
   * Generates unique keys used to store or fetch CastAdd messages in the byParentKey index
   *
   * @param mentionFid the fid of the user who was mentioned in the cast
   * @param fid the fid of the user who created the cast
   * @param tsHash the timestamp hash of the cast message
   * @returns RocksDB index key of the form <root_prefix>:<mentionFid>::<fid?>:<tsHash?>
   */
  static castsByMentionKey(mentionFid: Uint8Array, fid?: Uint8Array, tsHash?: Uint8Array): Buffer {
    const bytes = new Uint8Array(1 + FID_BYTES + (fid ? FID_BYTES : 0) + (tsHash ? tsHash.length : 0));
    bytes.set([RootPrefix.CastsByMention], 0);
    bytes.set(mentionFid, 1 + FID_BYTES - mentionFid.length); // pad fid for alignment
    if (fid) {
      bytes.set(fid, 1 + FID_BYTES + FID_BYTES - fid.length); // pad fid for alignment
    }
    if (tsHash) {
      bytes.set(tsHash, 1 + FID_BYTES + FID_BYTES);
    }
    return Buffer.from(bytes);
  }

  /** Looks up CastAdd message by cast tsHash */
  async getCastAdd(fid: Uint8Array, tsHash: Uint8Array): Promise<CastAddModel> {
    const messageTsHash = await this._db.get(CastStore.castAddsKey(fid, tsHash));
    return MessageModel.get<CastAddModel>(this._db, fid, UserPostfix.CastMessage, messageTsHash);
  }

  /** Looks up CastRemove message by cast tsHash */
  async getCastRemove(fid: Uint8Array, tsHash: Uint8Array): Promise<CastRemoveModel> {
    const messageTsHash = await this._db.get(CastStore.castRemovesKey(fid, tsHash));
    return MessageModel.get<CastRemoveModel>(this._db, fid, UserPostfix.CastMessage, messageTsHash);
  }

  /** Gets all CastAdd messages for an fid */
  async getCastAddsByUser(fid: Uint8Array): Promise<CastAddModel[]> {
    const castAddsPrefix = CastStore.castAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(castAddsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<CastAddModel>(this._db, fid, UserPostfix.CastMessage, messageKeys);
  }

  /** Gets all CastRemove messages for an fid */
  async getCastRemovesByUser(fid: Uint8Array): Promise<CastRemoveModel[]> {
    const castRemovesPrefix = CastStore.castRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(castRemovesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<CastRemoveModel>(this._db, fid, UserPostfix.CastMessage, messageKeys);
  }

  /** Gets all CastAdd messages for a parent cast (fid and tsHash) */
  async getCastsByParent(parentFid: Uint8Array, parentTsHash: Uint8Array): Promise<CastAddModel[]> {
    const byParentPrefix = CastStore.castsByParentKey(parentFid, parentTsHash);
    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(byParentPrefix, { keyAsBuffer: true, values: false })) {
      const fid = Uint8Array.from(key).subarray(byParentPrefix.length, byParentPrefix.length + FID_BYTES);
      const tsHash = Uint8Array.from(key).subarray(byParentPrefix.length + FID_BYTES);
      messageKeys.push(MessageModel.primaryKey(fid, UserPostfix.CastMessage, tsHash));
    }
    return MessageModel.getMany(this._db, messageKeys);
  }

  /** Gets all CastAdd messages for a mention (fid) */
  async getCastsByMention(fid: Uint8Array): Promise<CastAddModel[]> {
    const byMentionPrefix = CastStore.castsByMentionKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(byMentionPrefix, { keyAsBuffer: true, values: false })) {
      const fid = Uint8Array.from(key).subarray(byMentionPrefix.length, byMentionPrefix.length + FID_BYTES);
      const tsHash = Uint8Array.from(key).subarray(byMentionPrefix.length + FID_BYTES);
      messageKeys.push(MessageModel.primaryKey(fid, UserPostfix.CastMessage, tsHash));
    }
    return MessageModel.getMany(this._db, messageKeys);
  }

  /** Merges a CastAdd or CastRemove message into the set */
  async merge(message: MessageModel): Promise<void> {
    if (isCastRemove(message)) {
      return this.mergeRemove(message);
    }

    if (isCastAdd(message)) {
      return this.mergeAdd(message);
    }

    throw new HubError('bad_request.validation_failure', 'invalid message type');
  }

  async revokeMessagesBySigner(fid: Uint8Array, signer: Uint8Array): HubAsyncResult<void> {
    // Get all CastAdd messages signed by signer
    const castAdds = await MessageModel.getAllBySigner<CastAddModel>(this._db, fid, signer, MessageType.CastAdd);

    // Get all CastRemove messages signed by signer
    const castRemoves = await MessageModel.getAllBySigner<CastRemoveModel>(
      this._db,
      fid,
      signer,
      MessageType.CastRemove
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

  async pruneMessages(fid: Uint8Array): HubAsyncResult<void> {
    // Count number of CastAdd and CastRemove messages for this fid
    // TODO: persist this count to avoid having to retrieve it with each call
    const prefix = MessageModel.primaryKey(fid, UserPostfix.CastMessage);
    let count = 0;
    for await (const [,] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      count = count + 1;
    }

    // Calculate the number of messages that need to be pruned, based on the store's size limit
    let sizeToPrune = count - this._pruneSizeLimit;

    // Calculate the timestamp cut-off to prune
    const timestampToPrune = getFarcasterTime() - this._pruneTimeLimit;

    // Keep track of the messages that get pruned so that we can emit pruneMessage events after the transaction settles
    const messageToPrune: (CastAddModel | CastRemoveModel)[] = [];

    // Create a rocksdb transaction to include all the mutations
    let pruneTsx = this._db.transaction();

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = MessageModel.getPruneIterator(this._db, fid, UserPostfix.CastMessage);

    const getNextResult = () => ResultAsync.fromPromise(MessageModel.getNextToPrune(pruneIterator), () => undefined);

    // For each message in order, prune it if the store is over the size limit or the message was signed
    // before the timestamp cut-off
    let nextMessage = await getNextResult();
    while (nextMessage.isOk() && (sizeToPrune > 0 || nextMessage.value.timestamp() < timestampToPrune)) {
      const message = nextMessage.value;

      // Add a delete operation to the transaction depending on the message type
      if (isCastAdd(message)) {
        pruneTsx = this.deleteCastAddTransaction(pruneTsx, message);
      } else if (isCastRemove(message)) {
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

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: CastAddModel): Promise<void> {
    // Start RocksDB transaction
    let tsx = this._db.transaction();

    // Look up the remove tsHash for this cast
    const castRemoveTsHash = await ResultAsync.fromPromise(
      this._db.get(CastStore.castRemovesKey(message.fid(), message.tsHash())),
      () => undefined
    );

    // If remove tsHash exists, no-op because this cast has already been removed
    if (castRemoveTsHash.isOk()) {
      return undefined;
    }

    // Look up the add tsHash for this cast
    const castAddTsHash = await ResultAsync.fromPromise(
      this._db.get(CastStore.castAddsKey(message.fid(), message.tsHash())),
      () => undefined
    );

    // If add tsHash exists, no-op because this cast has already been added
    if (castAddTsHash.isOk()) {
      return undefined;
    }

    // Add putCastAdd operations to the RocksDB transaction
    tsx = this.putCastAddTransaction(tsx, message);

    // Commit the RocksDB transaction
    await this._db.commit(tsx);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message);
  }

  private async mergeRemove(message: CastRemoveModel): Promise<void> {
    // Start RocksDB transaction
    let tsx = this._db.transaction();

    // Define cast hash for lookups
    const removeTargetTsHash = message.body().targetTsHashArray() ?? new Uint8Array();

    // Look up the remove tsHash for this cast
    const castRemoveTsHash = await ResultAsync.fromPromise(
      this._db.get(CastStore.castRemovesKey(message.fid(), removeTargetTsHash)),
      () => undefined
    );

    if (castRemoveTsHash.isOk()) {
      if (bytesCompare(castRemoveTsHash.value, message.tsHash()) >= 0) {
        // If the remove tsHash exists and has the same or higher order than the new CastRemove
        // tsHash, no-op because this cast has been removed by a more recent message
        return undefined;
      } else {
        // If the remove tsHash exists but with a lower order than the new CastRemove
        // tsHash, retrieve the full CastRemove message and delete it as part of the
        // RocksDB transaction
        const existingRemove = await MessageModel.get<CastRemoveModel>(
          this._db,
          message.fid(),
          UserPostfix.CastMessage,
          castRemoveTsHash.value
        );
        tsx = this.deleteCastRemoveTransaction(tsx, existingRemove);
      }
    }

    // Look up the add tsHash for this cast
    const castAddTsHash = await ResultAsync.fromPromise(
      this._db.get(CastStore.castAddsKey(message.fid(), removeTargetTsHash)),
      () => undefined
    );

    // If the add tsHash exists, retrieve the full CastAdd message and delete it as
    // part of the RocksDB transaction
    const removedCastAdds: CastAddModel[] = [];
    if (castAddTsHash.isOk()) {
      const existingAdd = await MessageModel.get<CastAddModel>(
        this._db,
        message.fid(),
        UserPostfix.CastMessage,
        castAddTsHash.value
      );
      tsx = this.deleteCastAddTransaction(tsx, existingAdd);
      removedCastAdds.push(existingAdd);
    }

    // Add putCastRemove operations to the RocksDB transaction
    tsx = this.putCastRemoveTransaction(tsx, message);

    // Commit the RocksDB transaction
    await this._db.commit(tsx);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message);

    // Emit revoke events for each of the removed CastAdd messages
    for (const removedCastAdd of removedCastAdds) {
      this._eventHandler.emit('revokeMessage', removedCastAdd);
    }
  }

  /* Builds a RocksDB transaction to insert a CastAdd message and construct its indices */
  private putCastAddTransaction(tsx: Transaction, message: CastAddModel): Transaction {
    // Put message into the database
    tsx = MessageModel.putTransaction(tsx, message);

    // Puts the message key into the CastAdd set index
    tsx = tsx.put(CastStore.castAddsKey(message.fid(), message.tsHash()), Buffer.from(message.tsHash()));

    // Puts the message key into the ByParent index
    if (message.body().parent(new CastId()) as CastId) {
      tsx = tsx.put(
        CastStore.castsByParentKey(
          (message.body().parent(new CastId()) as CastId)?.fidArray() ?? new Uint8Array(),
          (message.body().parent(new CastId()) as CastId)?.tsHashArray() ?? new Uint8Array(),
          message.fid(),
          message.tsHash()
        ),
        TRUE_VALUE
      );
    }

    // Puts the message key into the ByMentions index
    if (message.body().mentionsLength() > 0) {
      for (let i = 0; i < message.body().mentionsLength(); i++) {
        const mention = message.body().mentions(i);
        tsx = tsx.put(
          CastStore.castsByMentionKey(mention?.fidArray() ?? new Uint8Array(), message.fid(), message.tsHash()),
          TRUE_VALUE
        );
      }
    }

    return tsx;
  }

  /* Builds a RocksDB transaction to remove a CastAdd message and delete its indices */
  private deleteCastAddTransaction(tsx: Transaction, message: CastAddModel): Transaction {
    // Delete the message key from the ByMentions index
    if (message.body().mentionsLength() > 0) {
      for (let i = 0; i < message.body().mentionsLength(); i++) {
        const mention = message.body().mentions(i);
        tsx = tsx.del(
          CastStore.castsByMentionKey(mention?.fidArray() ?? new Uint8Array(), message.fid(), message.tsHash())
        );
      }
    }

    // Delete the message key from the ByParent index
    if (message.body().parent(new CastId()) as CastId) {
      tsx = tsx.del(
        CastStore.castsByParentKey(
          (message.body().parent(new CastId()) as CastId)?.fidArray() ?? new Uint8Array(),
          (message.body().parent(new CastId()) as CastId)?.tsHashArray() ?? new Uint8Array(),
          message.fid(),
          message.tsHash()
        )
      );
    }

    // Delete the message key from the CastAdd set index
    tsx = tsx.del(CastStore.castAddsKey(message.fid(), message.tsHash()));

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }

  /* Builds a RocksDB transaction to insert a CastRemove message and construct its indices */
  private putCastRemoveTransaction(tsx: Transaction, message: CastRemoveModel): Transaction {
    // Puts the message
    tsx = MessageModel.putTransaction(tsx, message);

    // Puts the message key into the CastRemoves set index
    tsx = tsx.put(
      CastStore.castRemovesKey(message.fid(), message.body().targetTsHashArray() ?? new Uint8Array()),
      Buffer.from(message.tsHash())
    );

    return tsx;
  }

  /* Builds a RocksDB transaction to remove a CastRemove message and delete its indices */
  private deleteCastRemoveTransaction(tsx: Transaction, message: CastRemoveModel): Transaction {
    // Deletes the messae key from the CastRemoves set index
    tsx = tsx.del(CastStore.castRemovesKey(message.fid(), message.body().targetTsHashArray() ?? new Uint8Array()));

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }
}

export default CastStore;
