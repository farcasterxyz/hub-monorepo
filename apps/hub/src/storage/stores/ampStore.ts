import { MessageType } from '@farcaster/flatbuffers';
import { bytesCompare, getFarcasterTime, HubAsyncResult, HubError } from '@farcaster/utils';
import { err, ok, ResultAsync } from 'neverthrow';
import MessageModel, { FID_BYTES, TRUE_VALUE } from '~/flatbuffers/models/messageModel';
import { isAmpAdd, isAmpRemove } from '~/flatbuffers/models/typeguards';
import { AmpAddModel, AmpRemoveModel, RootPrefix, StorePruneOptions, UserPostfix } from '~/flatbuffers/models/types';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import SequentialMergeStore from '~/storage/stores/sequentialMergeStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';

const PRUNE_SIZE_LIMIT_DEFAULT = 250;
const PRUNE_TIME_LIMIT_DEFAULT = 60 * 60 * 24 * 90; // 90 days

/**
 * Amp Store persists Amp Messages in RocksDB using a two-phase CRDT set to guarantee
 * eventual consistency.
 *
 * A Amp is performed by user and has a target user. It is added with a AmpAdd and removed
 * with a AmpRemove. Amp messages can collide if two messages have the same user fid and
 * target user fid. Collisions between messages are resolved with the following rules:
 *
 * 1. Highest timestamp wins
 * 2. Remove wins over Adds
 * 3. Highest lexicographic hash wins
 *
 * AmpMessages are stored ordinally in RocksDB indexed by a unique key `fid:tsHash` which makes
 * truncating a user's earliest messages easy. Indices are built for the two phase sets
 * (adds, removes) as well as byTargetUser. The key-value entries created by the Amp Store are:
 *
 * 1. fid:tsHash -> amp message
 * 2. fid:set:targetUserFid -> fid:tsHash (Set Index)
 * 3. fid:set:targetUserFid:tsHash -> fid:tsHash (Target User Index)
 */
class AmpStore extends SequentialMergeStore {
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

  /**
   * Generates a unique key used to store a AmpAdd message key in the AmpAdds Set index
   *
   * @param fid farcaster id of the user who created the amp
   * @param targetUserFid user is being amped
   * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<user?>
   */
  static ampAddsKey(fid: Uint8Array, targetUserFid?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.AmpAdds]),
      targetUserFid ? Buffer.from(targetUserFid) : new Uint8Array(),
    ]);
  }

  /**
   * Generates a unique key used to store a AmpRemove message key in the AmpRemoves Set index
   *
   * @param fid farcaster id of the user who created the amp
   * @param targetUserFid user who created the amp
   * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<user?>
   */
  static ampRemovesKey(fid: Uint8Array, targetUserFid?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.AmpRemoves]),
      targetUserFid ? Buffer.from(targetUserFid) : new Uint8Array(),
    ]);
  }

  /**
   * Generates a unique key used to store a AmpAdds Message in the AmpsByUser index
   *
   * @param targetUserFid user who created the amp
   * @param fid the fid of the user who created the amp
   * @param tsHash the timestamp hash of the amp message
   * @returns RocksDB index key of the form <root_prefix>:<fid>:<type?>:<fid?>:<tsHash?>
   */
  static ampsByTargetUserKey(targetUserFid: Uint8Array, fid?: Uint8Array, tsHash?: Uint8Array): Buffer {
    const bytes = new Uint8Array(1 + FID_BYTES + (fid ? FID_BYTES : 0) + (tsHash ? tsHash.length : 0));
    bytes.set([RootPrefix.AmpsByUser], 0);
    bytes.set(targetUserFid, 1 + FID_BYTES - targetUserFid.length); // pad for alignment
    if (fid) {
      bytes.set(fid, 1 + FID_BYTES + FID_BYTES - fid.length); // pad fid for alignment
    }
    if (tsHash) {
      bytes.set(tsHash, 1 + FID_BYTES + FID_BYTES);
    }
    return Buffer.from(bytes);
  }

  /** Look up AmpAdd message by target user */
  async getAmpAdd(fid: Uint8Array, targetUserFid: Uint8Array): Promise<AmpAddModel> {
    const messageTsHash = await this._db.get(AmpStore.ampAddsKey(fid, targetUserFid));
    return MessageModel.get<AmpAddModel>(this._db, fid, UserPostfix.AmpMessage, messageTsHash);
  }

  /** Look up AmpRemove message by target user */
  async getAmpRemove(fid: Uint8Array, targetUserFid: Uint8Array): Promise<AmpRemoveModel> {
    const messageTsHash = await this._db.get(AmpStore.ampRemovesKey(fid, targetUserFid));
    return MessageModel.get<AmpRemoveModel>(this._db, fid, UserPostfix.AmpMessage, messageTsHash);
  }

  /** Get all AmpAdd messages for an fid */
  async getAmpAddsByUser(fid: Uint8Array): Promise<AmpAddModel[]> {
    const addsPrefix = AmpStore.ampAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<AmpAddModel>(this._db, fid, UserPostfix.AmpMessage, messageKeys);
  }

  /** Get all AmpRemove messages for an fid */
  async getAmpRemovesByUser(fid: Uint8Array): Promise<AmpRemoveModel[]> {
    const removesPrefix = AmpStore.ampRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(removesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<AmpRemoveModel>(this._db, fid, UserPostfix.AmpMessage, messageKeys);
  }

  /** Get all AmpAdd messages for a user */
  async getAmpsByTargetUser(fid: Uint8Array): Promise<AmpAddModel[]> {
    const byUserPostfix = AmpStore.ampsByTargetUserKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(byUserPostfix, { keyAsBuffer: true, values: false })) {
      const fid = Uint8Array.from(key).subarray(byUserPostfix.length, byUserPostfix.length + FID_BYTES);
      const tsHash = Uint8Array.from(key).subarray(byUserPostfix.length + FID_BYTES);
      messageKeys.push(MessageModel.primaryKey(fid, UserPostfix.AmpMessage, tsHash));
    }
    return MessageModel.getMany(this._db, messageKeys);
  }

  /** Merges a AmpAdd or AmpRemove message into the AmpStore */
  async merge(message: MessageModel): Promise<void> {
    if (!isAmpRemove(message) && !isAmpAdd(message)) {
      throw new HubError('bad_request.validation_failure', 'invalid amp message');
    }

    const mergeResult = await this.mergeSequential(message);
    if (mergeResult.isErr()) {
      throw mergeResult.error;
    }

    return mergeResult.value;
  }

  async revokeMessagesBySigner(fid: Uint8Array, signer: Uint8Array): HubAsyncResult<void> {
    // Get all AmpAdd messages signed by signer
    const ampAdds = await MessageModel.getAllBySigner<AmpAddModel>(this._db, fid, signer, MessageType.AmpAdd);

    // Get all AmpRemove messages signed by signer
    const ampRemoves = await MessageModel.getAllBySigner<AmpRemoveModel>(this._db, fid, signer, MessageType.AmpRemove);

    // Create a rocksdb transaction
    let txn = this._db.transaction();

    // Add a delete operation to the transaction for each AmpAdd
    for (const message of ampAdds) {
      txn = this.deleteAmpAddTransaction(txn, message);
    }

    // Add a delete operation to the transaction for each AmpRemove
    for (const message of ampRemoves) {
      txn = this.deleteAmpRemoveTransaction(txn, message);
    }

    await this._db.commit(txn);

    // Emit a revokeMessage event for each message
    for (const message of [...ampAdds, ...ampRemoves]) {
      this._eventHandler.emit('revokeMessage', message);
    }

    return ok(undefined);
  }

  async pruneMessages(fid: Uint8Array): HubAsyncResult<void> {
    // Count number of AmpAdd and AmpRemove messages for this fid
    // TODO: persist this count to avoid having to retrieve it with each call
    const prefix = MessageModel.primaryKey(fid, UserPostfix.AmpMessage);
    let count = 0;
    for await (const [,] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      count = count + 1;
    }

    // Calculate the number of messages that need to be pruned, based on the store's size limit
    let sizeToPrune = count - this._pruneSizeLimit;

    // Calculate the timestamp cut-off to prune
    const timestampToPrune = getFarcasterTime() - this._pruneTimeLimit;

    // Keep track of the messages that get pruned so that we can emit pruneMessage events after the transaction settles
    const messageToPrune: (AmpAddModel | AmpRemoveModel)[] = [];

    // Create a rocksdb transaction to include all the mutations
    let pruneTsx = this._db.transaction();

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = MessageModel.getPruneIterator(this._db, fid, UserPostfix.AmpMessage);

    const getNextResult = () => ResultAsync.fromPromise(MessageModel.getNextToPrune(pruneIterator), () => undefined);

    // For each message in order, prune it if the store is over the size limit or the message was signed
    // before the timestamp cut-off
    let nextMessage = await getNextResult();
    while (nextMessage.isOk() && (sizeToPrune > 0 || nextMessage.value.timestamp() < timestampToPrune)) {
      const message = nextMessage.value;

      // Add a delete operation to the transaction depending on the message type
      if (isAmpAdd(message)) {
        pruneTsx = this.deleteAmpAddTransaction(pruneTsx, message);
      } else if (isAmpRemove(message)) {
        pruneTsx = this.deleteAmpRemoveTransaction(pruneTsx, message);
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

  protected async mergeFromSequentialQueue(message: MessageModel): Promise<void> {
    if (isAmpAdd(message)) {
      return this.mergeAdd(message);
    } else if (isAmpRemove(message)) {
      return this.mergeRemove(message);
    } else {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: AmpAddModel): Promise<void> {
    const ampId = message.body().user()?.fidArray() ?? new Uint8Array();

    const txnResult = await this.resolveMergeConflicts(this._db.transaction(), ampId, message);

    if (txnResult.isErr()) {
      throw txnResult.error;
    }

    // Add ops to store the message by messageKey and index the the messageKey by set
    const txn = this.putAmpAddTransaction(txnResult.value, message);

    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message);

    return undefined;
  }

  private async mergeRemove(message: AmpRemoveModel): Promise<void> {
    const ampId = message.body().user()?.fidArray() ?? new Uint8Array();

    const txnResult = await this.resolveMergeConflicts(this._db.transaction(), ampId, message);

    if (txnResult.isErr()) {
      throw txnResult.error;
    }

    // Add ops to store the message by messageKey and index the the messageKey by set
    const txn = this.putAmpRemoveTransaction(txnResult.value, message);

    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message);

    return undefined;
  }

  private ampMessageCompare(
    aType: MessageType.AmpAdd | MessageType.AmpRemove,
    aTsHash: Uint8Array,
    bType: MessageType.AmpAdd | MessageType.AmpRemove,
    bTsHash: Uint8Array
  ): number {
    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    // Compare message types to enforce that RemoveWins in case of LWW ties.
    if (aType === MessageType.AmpRemove && bType === MessageType.AmpAdd) {
      return 1;
    } else if (aType === MessageType.AmpAdd && bType === MessageType.AmpRemove) {
      return -1;
    }

    // Compare hashes (last 4 bytes of tsHash) to break ties between messages of the same type and timestamp
    return bytesCompare(aTsHash.subarray(4), bTsHash.subarray(4));
  }

  /**
   * Determines the RocksDB keys that must be modified to settle merge conflicts as a result of
   * adding a Amp to the Store.
   *
   * @returns a RocksDB transaction if keys must be added or removed, undefined otherwise.
   */
  private async resolveMergeConflicts(
    txn: Transaction,
    ampId: Uint8Array,
    message: AmpAddModel | AmpRemoveModel
  ): HubAsyncResult<Transaction> {
    // Look up the remove tsHash for this amp
    const ampRemoveTsHash = await ResultAsync.fromPromise(
      this._db.get(AmpStore.ampRemovesKey(message.fid(), ampId)),
      () => undefined
    );

    if (ampRemoveTsHash.isOk()) {
      const removeCompare = this.ampMessageCompare(
        MessageType.AmpRemove,
        ampRemoveTsHash.value,
        message.type(),
        message.tsHash()
      );
      if (removeCompare > 0) {
        return err(new HubError('bad_request.conflict', 'message conflicts with a more recent AmpRemove'));
      } else if (removeCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing remove has a lower order than the new message, retrieve the full
        // AmpRemove message and delete it as part of the RocksDB transaction
        const existingRemove = await MessageModel.get<AmpRemoveModel>(
          this._db,
          message.fid(),
          UserPostfix.AmpMessage,
          ampRemoveTsHash.value
        );
        txn = this.deleteAmpRemoveTransaction(txn, existingRemove);
      }
    }

    // Look up the add tsHash for this amp
    const ampAddTsHash = await ResultAsync.fromPromise(
      this._db.get(AmpStore.ampAddsKey(message.fid(), ampId)),
      () => undefined
    );

    if (ampAddTsHash.isOk()) {
      const addCompare = this.ampMessageCompare(
        MessageType.AmpAdd,
        ampAddTsHash.value,
        message.type(),
        message.tsHash()
      );
      if (addCompare > 0) {
        return err(new HubError('bad_request.conflict', 'message conflicts with a more recent AmpAdd'));
      } else if (addCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // AmpAdd message and delete it as part of the RocksDB transaction
        const existingAdd = await MessageModel.get<AmpAddModel>(
          this._db,
          message.fid(),
          UserPostfix.AmpMessage,
          ampAddTsHash.value
        );

        txn = this.deleteAmpAddTransaction(txn, existingAdd);
      }
    }

    return ok(txn);
  }

  /* Builds a RocksDB transaction to insert a AmpAdd message and construct its indices */
  private putAmpAddTransaction(txn: Transaction, message: AmpAddModel): Transaction {
    // Puts the message into the database
    txn = MessageModel.putTransaction(txn, message);

    // Puts the message key into the AmpAdds set index
    txn = txn.put(
      AmpStore.ampAddsKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()),
      Buffer.from(message.tsHash())
    );

    // Puts the message key into the byTargetUser index
    txn = txn.put(
      AmpStore.ampsByTargetUserKey(
        message.body().user()?.fidArray() ?? new Uint8Array(),
        message.fid(),
        message.tsHash()
      ),
      TRUE_VALUE
    );

    return txn;
  }

  /* Builds a RocksDB transaction to remove a AmpAdd message and delete its indices */
  private deleteAmpAddTransaction(txn: Transaction, message: AmpAddModel): Transaction {
    // Delete the message key from the byTargetUser index
    txn = txn.del(
      AmpStore.ampsByTargetUserKey(
        message.body().user()?.fidArray() ?? new Uint8Array(),
        message.fid(),
        message.tsHash()
      )
    );

    // Delete the message key from the AmpAdds set index
    txn = txn.del(AmpStore.ampAddsKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()));

    // Delete message
    return MessageModel.deleteTransaction(txn, message);
  }

  /* Builds a RocksDB transaction to insert a AmpRemove message and construct its indices */
  private putAmpRemoveTransaction(txn: Transaction, message: AmpRemoveModel): Transaction {
    // Puts the message
    txn = MessageModel.putTransaction(txn, message);

    // Puts the message key into the AmpRemoves set index
    txn = txn.put(
      AmpStore.ampRemovesKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()),
      Buffer.from(message.tsHash())
    );

    return txn;
  }

  /* Builds a RocksDB transaction to remove a AmpRemove message and delete its indices */
  private deleteAmpRemoveTransaction(txn: Transaction, message: AmpRemoveModel): Transaction {
    // Delete the message key from the AmpRemoves set index
    txn = txn.del(AmpStore.ampRemovesKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()));

    // Delete the message
    return MessageModel.deleteTransaction(txn, message);
  }
}

export default AmpStore;
