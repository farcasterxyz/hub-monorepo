import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import MessageModel, { FID_BYTES, TRUE_VALUE } from '~/storage/flatbuffers/messageModel';
import { ResultAsync, ok } from 'neverthrow';
import {
  FollowAddModel,
  FollowRemoveModel,
  RootPrefix,
  StorePruneOptions,
  UserPostfix,
} from '~/storage/flatbuffers/types';
import { isFollowAdd, isFollowRemove } from '~/storage/flatbuffers/typeguards';
import { bytesCompare } from '~/storage/flatbuffers/utils';
import { MessageType } from '~/utils/generated/message_generated';
import { HubAsyncResult, HubError } from '~/utils/hubErrors';
import StoreEventHandler from '~/storage/sets/flatbuffers/storeEventHandler';

const PRUNE_SIZE_LIMIT_DEFAULT = 5_000;

/**
 * Follow Store persists Follow Messages in RocksDB using a two-phase CRDT set to guarantee
 * eventual consistency.
 *
 * A Follow is performed by user and has a target user. It is added with a FollowAdd and removed
 * with a FollowRemove. Follow messages can collide if two messages have the same user fid and
 * target user fid. Collisions between messages are resolved with the following rules:
 *
 * 1. Highest timestamp wins
 * 2. Remove wins over Adds
 * 3. Highest lexicographic hash wins
 *
 * FollowMessages are stored ordinally in RocksDB indexed by a unique key `fid:tsHash` which makes
 * truncating a user's earliest messages easy. Indices are built for the two phase sets
 * (adds, removes) as well as byTargetUser. The key-value entries created by the Follow Store are:
 *
 * 1. fid:tsHash -> follow message
 * 2. fid:set:targetUserFid -> fid:tsHash (Set Index)
 * 3. fid:set:targetUserFid:tsHash -> fid:tsHash (Target User Index)
 */
class FollowStore {
  private _db: RocksDB;
  private _eventHandler: StoreEventHandler;
  private _pruneSizeLimit: number;

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    this._db = db;
    this._eventHandler = eventHandler;
    this._pruneSizeLimit = options.pruneSizeLimit ?? PRUNE_SIZE_LIMIT_DEFAULT;
  }

  /**
   * Generates a unique key used to store a FollowAdd message key in the FollowAdds Set index
   *
   * @param fid farcaster id of the user who created the follow
   * @param targetUserFid user is being followed
   * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<user?>
   */
  static followAddsKey(fid: Uint8Array, targetUserFid?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.FollowAdds]),
      targetUserFid ? Buffer.from(targetUserFid) : new Uint8Array(),
    ]);
  }

  /**
   * Generates a unique key used to store a FollowRemove message key in the FollowRemoves Set index
   *
   * @param fid farcaster id of the user who created the follow
   * @param targetUserFid user who created the follow
   * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<user?>
   */
  static followRemovesKey(fid: Uint8Array, targetUserFid?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.FollowRemoves]),
      targetUserFid ? Buffer.from(targetUserFid) : new Uint8Array(),
    ]);
  }

  /**
   * Generates a unique key used to store a FollowAdds Message in the FollowsByUser index
   *
   * @param targetUserFid user who created the follow
   * @param fid the fid of the user who created the follow
   * @param tsHash the timestamp hash of the follow message
   * @returns RocksDB index key of the form <root_prefix>:<fid>:<type?>:<fid?>:<tsHash?>
   */
  static followsByTargetUserKey(targetUserFid: Uint8Array, fid?: Uint8Array, tsHash?: Uint8Array): Buffer {
    const bytes = new Uint8Array(1 + FID_BYTES + (fid ? FID_BYTES : 0) + (tsHash ? tsHash.length : 0));
    bytes.set([RootPrefix.FollowsByUser], 0);
    bytes.set(targetUserFid, 1 + FID_BYTES - targetUserFid.length); // pad for alignment
    if (fid) {
      bytes.set(fid, 1 + FID_BYTES + FID_BYTES - fid.length); // pad fid for alignment
    }
    if (tsHash) {
      bytes.set(tsHash, 1 + FID_BYTES + FID_BYTES);
    }
    return Buffer.from(bytes);
  }

  /** Look up FollowAdd message by target user */
  async getFollowAdd(fid: Uint8Array, targetUserFid: Uint8Array): Promise<FollowAddModel> {
    const messageTsHash = await this._db.get(FollowStore.followAddsKey(fid, targetUserFid));
    return MessageModel.get<FollowAddModel>(this._db, fid, UserPostfix.FollowMessage, messageTsHash);
  }

  /** Look up FollowRemove message by target user */
  async getFollowRemove(fid: Uint8Array, targetUserFid: Uint8Array): Promise<FollowRemoveModel> {
    const messageTsHash = await this._db.get(FollowStore.followRemovesKey(fid, targetUserFid));
    return MessageModel.get<FollowRemoveModel>(this._db, fid, UserPostfix.FollowMessage, messageTsHash);
  }

  /** Get all FollowAdd messages for an fid */
  async getFollowAddsByUser(fid: Uint8Array): Promise<FollowAddModel[]> {
    const addsPrefix = FollowStore.followAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<FollowAddModel>(this._db, fid, UserPostfix.FollowMessage, messageKeys);
  }

  /** Get all FollowRemove messages for an fid */
  async getFollowRemovesByUser(fid: Uint8Array): Promise<FollowRemoveModel[]> {
    const removesPrefix = FollowStore.followRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(removesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<FollowRemoveModel>(this._db, fid, UserPostfix.FollowMessage, messageKeys);
  }

  /** Get all FollowAdd messages for a user */
  async getFollowsByTargetUser(fid: Uint8Array): Promise<FollowAddModel[]> {
    const byUserPostfix = FollowStore.followsByTargetUserKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(byUserPostfix, { keyAsBuffer: true, values: false })) {
      const fid = Uint8Array.from(key).subarray(byUserPostfix.length, byUserPostfix.length + FID_BYTES);
      const tsHash = Uint8Array.from(key).subarray(byUserPostfix.length + FID_BYTES);
      messageKeys.push(MessageModel.primaryKey(fid, UserPostfix.FollowMessage, tsHash));
    }
    return MessageModel.getMany(this._db, messageKeys);
  }

  /** Merges a FollowAdd or FollowRemove message into the FollowStore */
  async merge(message: MessageModel): Promise<void> {
    if (isFollowRemove(message)) {
      return this.mergeRemove(message);
    }

    if (isFollowAdd(message)) {
      return this.mergeAdd(message);
    }

    throw new HubError('bad_request.validation_failure', 'invalid follow message');
  }

  async revokeMessagesBySigner(fid: Uint8Array, signer: Uint8Array): HubAsyncResult<void> {
    // Get all FollowAdd messages signed by signer
    const followAdds = await MessageModel.getAllBySigner<FollowAddModel>(this._db, fid, signer, MessageType.FollowAdd);

    // Get all FollowRemove messages signed by signer
    const followRemoves = await MessageModel.getAllBySigner<FollowRemoveModel>(
      this._db,
      fid,
      signer,
      MessageType.FollowRemove
    );

    // Create a rocksdb transaction
    let txn = this._db.transaction();

    // Add a delete operation to the transaction for each FollowAdd
    for (const message of followAdds) {
      txn = this.deleteFollowAddTransaction(txn, message);
    }

    // Add a delete operation to the transaction for each FollowRemove
    for (const message of followRemoves) {
      txn = this.deleteFollowRemoveTransaction(txn, message);
    }

    await this._db.commit(txn);

    // Emit a revokeMessage event for each message
    for (const message of [...followAdds, ...followRemoves]) {
      this._eventHandler.emit('revokeMessage', message);
    }

    return ok(undefined);
  }

  async pruneMessages(fid: Uint8Array): HubAsyncResult<void> {
    // Count number of FollowAdd and FollowRemove messages for this fid
    // TODO: persist this count to avoid having to retrieve it with each call
    const prefix = MessageModel.primaryKey(fid, UserPostfix.FollowMessage);
    let count = 0;
    for await (const [,] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      count = count + 1;
    }

    // Calculate the number of messages that need to be pruned, based on the store's size limit
    let sizeToPrune = count - this._pruneSizeLimit;

    // Keep track of the messages that get pruned so that we can emit pruneMessage events after the transaction settles
    const messageToPrune: (FollowAddModel | FollowRemoveModel)[] = [];

    // Create a rocksdb transaction to include all the mutations
    let pruneTsx = this._db.transaction();

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = MessageModel.getPruneIterator(this._db, fid, UserPostfix.FollowMessage);

    const getNextResult = () => ResultAsync.fromPromise(MessageModel.getNextToPrune(pruneIterator), () => undefined);

    // For each message in order, prune it if the store is over the size limit
    let nextMessage = await getNextResult();
    while (nextMessage.isOk() && sizeToPrune > 0) {
      const message = nextMessage.value;

      // Add a delete operation to the transaction depending on the message type
      if (isFollowAdd(message)) {
        pruneTsx = this.deleteFollowAddTransaction(pruneTsx, message);
      } else if (isFollowRemove(message)) {
        pruneTsx = this.deleteFollowRemoveTransaction(pruneTsx, message);
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

  private async mergeAdd(message: FollowAddModel): Promise<void> {
    const followId = message.body().user()?.fidArray() ?? new Uint8Array();

    let tsx = await this.resolveMergeConflicts(this._db.transaction(), followId, message);

    if (!tsx) return undefined; // Assume no-op if txn was not returned

    // Add ops to store the message by messageKey and index the the messageKey by set
    tsx = this.putFollowAddTransaction(tsx, message);

    await this._db.commit(tsx);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message);
  }

  private async mergeRemove(message: FollowRemoveModel): Promise<void> {
    const followId = message.body().user()?.fidArray() ?? new Uint8Array();

    let tsx = await this.resolveMergeConflicts(this._db.transaction(), followId, message);

    if (!tsx) return undefined; // Assume no-op if txn was not returned

    // Add ops to store the message by messageKey and index the the messageKey by set
    tsx = this.putFollowRemoveTransaction(tsx, message);

    await this._db.commit(tsx);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message);
  }

  private followMessageCompare(
    aType: MessageType,
    aTsHash: Uint8Array,
    bType: MessageType,
    bTsHash: Uint8Array
  ): number {
    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    // Compare message types to enforce that RemoveWins in case of LWW ties.
    if (aType === MessageType.FollowRemove && bType === MessageType.FollowAdd) {
      return 1;
    } else if (aType === MessageType.FollowAdd && bType === MessageType.FollowRemove) {
      return -1;
    }

    // Compare hashes (last 4 bytes of tsHash) to break ties between messages of the same type and timestamp
    return bytesCompare(aTsHash.subarray(4), bTsHash.subarray(4));
  }

  /**
   * Determines the RocksDB keys that must be modified to settle merge conflicts as a result of
   * adding a Follow to the Store.
   *
   * @returns a RocksDB transaction if keys must be added or removed, undefined otherwise.
   */
  private async resolveMergeConflicts(
    tsx: Transaction,
    followId: Uint8Array,
    message: FollowAddModel | FollowRemoveModel
  ): Promise<Transaction | undefined> {
    // Look up the remove tsHash for this follow
    const followRemoveTsHash = await ResultAsync.fromPromise(
      this._db.get(FollowStore.followRemovesKey(message.fid(), followId)),
      () => undefined
    );

    if (followRemoveTsHash.isOk()) {
      if (
        this.followMessageCompare(
          MessageType.FollowRemove,
          followRemoveTsHash.value,
          message.type(),
          message.tsHash()
        ) >= 0
      ) {
        // If the existing remove has the same or higher order than the new message, no-op
        return undefined;
      } else {
        // If the existing remove has a lower order than the new message, retrieve the full
        // FollowRemove message and delete it as part of the RocksDB transaction
        const existingRemove = await MessageModel.get<FollowRemoveModel>(
          this._db,
          message.fid(),
          UserPostfix.FollowMessage,
          followRemoveTsHash.value
        );
        tsx = this.deleteFollowRemoveTransaction(tsx, existingRemove);
      }
    }

    // Look up the add tsHash for this follow
    const followAddTsHash = await ResultAsync.fromPromise(
      this._db.get(FollowStore.followAddsKey(message.fid(), followId)),
      () => undefined
    );

    if (followAddTsHash.isOk()) {
      if (
        this.followMessageCompare(MessageType.FollowAdd, followAddTsHash.value, message.type(), message.tsHash()) >= 0
      ) {
        // If the existing add has the same or higher order than the new message, no-op
        return undefined;
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // FollowAdd message and delete it as part of the RocksDB transaction
        const existingAdd = await MessageModel.get<FollowAddModel>(
          this._db,
          message.fid(),
          UserPostfix.FollowMessage,
          followAddTsHash.value
        );
        tsx = this.deleteFollowAddTransaction(tsx, existingAdd);
      }
    }

    return tsx;
  }

  /* Builds a RocksDB transaction to insert a FollowAdd message and construct its indices */
  private putFollowAddTransaction(tsx: Transaction, message: FollowAddModel): Transaction {
    // Puts the message into the database
    tsx = MessageModel.putTransaction(tsx, message);

    // Puts the message key into the FollowAdds set index
    tsx = tsx.put(
      FollowStore.followAddsKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()),
      Buffer.from(message.tsHash())
    );

    // Puts the message key into the byTargetUser index
    tsx = tsx.put(
      FollowStore.followsByTargetUserKey(
        message.body().user()?.fidArray() ?? new Uint8Array(),
        message.fid(),
        message.tsHash()
      ),
      TRUE_VALUE
    );

    return tsx;
  }

  /* Builds a RocksDB transaction to remove a FollowAdd message and delete its indices */
  private deleteFollowAddTransaction(tsx: Transaction, message: FollowAddModel): Transaction {
    // Delete the message key from the byTargetUser index
    tsx = tsx.del(
      FollowStore.followsByTargetUserKey(
        message.body().user()?.fidArray() ?? new Uint8Array(),
        message.fid(),
        message.tsHash()
      )
    );

    // Delete the message key from the FollowAdds set index
    tsx = tsx.del(FollowStore.followAddsKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()));

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }

  /* Builds a RocksDB transaction to insert a FollowRemove message and construct its indices */
  private putFollowRemoveTransaction(tsx: Transaction, message: FollowRemoveModel): Transaction {
    // Puts the message
    tsx = MessageModel.putTransaction(tsx, message);

    // Puts the message key into the FollowRemoves set index
    tsx = tsx.put(
      FollowStore.followRemovesKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()),
      Buffer.from(message.tsHash())
    );

    return tsx;
  }

  /* Builds a RocksDB transaction to remove a FollowRemove message and delete its indices */
  private deleteFollowRemoveTransaction(tsx: Transaction, message: FollowRemoveModel): Transaction {
    // Delete the message key from the FollowRemoves set index
    tsx = tsx.del(FollowStore.followRemovesKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()));

    // Delete the message
    return MessageModel.deleteTransaction(tsx, message);
  }
}

export default FollowStore;
