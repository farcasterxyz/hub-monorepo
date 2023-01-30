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
  makeFidKey,
  makeMessagePrimaryKey,
  makeTsHash,
  makeUserKey,
  putMessageTransaction,
} from '~/storage/db/message';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import { FID_BYTES, RootPrefix, TRUE_VALUE, UserPostfix } from '~/storage/db/types';
import SequentialMergeStore from '~/storage/stores/sequentialMergeStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { StorePruneOptions } from '~/storage/stores/types';

const PRUNE_SIZE_LIMIT_DEFAULT = 250;
const PRUNE_TIME_LIMIT_DEFAULT = 60 * 60 * 24 * 90; // 90 days

/**
 * Generates a unique key used to store a AmpAdd message key in the AmpAdds Set index
 *
 * @param fid farcaster id of the user who created the amp
 * @param targetFid user is being amped
 * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<user?>
 */
export const makeAmpAddsKey = (fid: number, targetFid?: number): Buffer => {
  return Buffer.concat([
    makeUserKey(fid),
    Buffer.from([UserPostfix.AmpAdds]),
    targetFid ? makeFidKey(targetFid) : Buffer.from(''),
  ]);
};

/**
 * Generates a unique key used to store a AmpRemove message key in the AmpRemoves Set index
 *
 * @param fid farcaster id of the user who created the amp
 * @param targetUserFid user who created the amp
 * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<user?>
 */
export const makeAmpRemovesKey = (fid: number, targetFid?: number): Buffer => {
  return Buffer.concat([
    makeUserKey(fid),
    Buffer.from([UserPostfix.AmpRemoves]),
    targetFid ? makeFidKey(targetFid) : Buffer.from(''),
  ]);
};

/**
 * Generates a unique key used to store a AmpAdds Message in the AmpsByUser index
 *
 * @param targetUserFid fid of the user being amped
 * @param fid the fid of the user who created the amp
 * @param tsHash the timestamp hash of the amp message
 * @returns RocksDB index key of the form <root_prefix>:<fid>:<fid?>:<tsHash?>
 */
export const makeAmpsByTargetFidKey = (targetFid: number, fid?: number, tsHash?: Uint8Array): Buffer => {
  return Buffer.concat([
    Buffer.from([RootPrefix.AmpsByUser]),
    makeFidKey(targetFid),
    fid ? makeFidKey(fid) : Buffer.from(''),
    Buffer.from(tsHash ?? ''),
  ]);
};

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

  /** Look up AmpAdd message by target user */
  async getAmpAdd(fid: number, targetFid: number): Promise<protobufs.AmpAddMessage> {
    const addsKey = makeAmpAddsKey(fid, targetFid);
    const messageTsHash = await this._db.get(addsKey);
    return getMessage(this._db, fid, UserPostfix.AmpMessage, messageTsHash);
  }

  /** Look up AmpRemove message by target user */
  async getAmpRemove(fid: number, targetFid: number): Promise<protobufs.AmpRemoveMessage> {
    const removesKey = makeAmpRemovesKey(fid, targetFid);
    const messageTsHash = await this._db.get(removesKey);
    return getMessage(this._db, fid, UserPostfix.AmpMessage, messageTsHash);
  }

  /** Get all AmpAdd messages for an fid */
  async getAmpAddsByFid(fid: number): Promise<protobufs.AmpAddMessage[]> {
    const addsPrefix = makeAmpAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return getManyMessagesByFid(this._db, fid, UserPostfix.AmpMessage, messageKeys);
  }

  /** Get all AmpRemove messages for an fid */
  async getAmpRemovesByFid(fid: number): Promise<protobufs.AmpRemoveMessage[]> {
    const removesPrefix = makeAmpRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(removesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return getManyMessagesByFid(this._db, fid, UserPostfix.AmpMessage, messageKeys);
  }

  /** Get all AmpAdd messages for a user */
  async getAmpsByTargetFid(targetFid: number): Promise<protobufs.AmpAddMessage[]> {
    const byTargetFidPrefix = makeAmpsByTargetFidKey(targetFid);
    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(byTargetFidPrefix, { keyAsBuffer: true, values: false })) {
      const fid = Number((key as Buffer).readBigUint64BE(byTargetFidPrefix.length));
      const tsHash = Uint8Array.from(key).subarray(byTargetFidPrefix.length + FID_BYTES);
      messageKeys.push(makeMessagePrimaryKey(fid, UserPostfix.AmpMessage, tsHash));
    }
    return getManyMessages(this._db, messageKeys);
  }

  /** Merges a AmpAdd or AmpRemove message into the AmpStore */
  async merge(message: protobufs.Message): Promise<void> {
    if (!protobufs.isAmpAddMessage(message) && !protobufs.isAmpRemoveMessage(message)) {
      throw new HubError('bad_request.validation_failure', 'invalid amp message');
    }

    const mergeResult = await this.mergeSequential(message);
    if (mergeResult.isErr()) {
      throw mergeResult.error;
    }

    return mergeResult.value;
  }

  async revokeMessagesBySigner(fid: number, signer: Uint8Array): HubAsyncResult<void> {
    // Get all AmpAdd messages signed by signer
    const ampAdds = await getAllMessagesBySigner<protobufs.AmpAddMessage>(
      this._db,
      fid,
      signer,
      protobufs.MessageType.MESSAGE_TYPE_AMP_ADD
    );

    // Get all AmpRemove messages signed by signer
    const ampRemoves = await getAllMessagesBySigner<protobufs.AmpRemoveMessage>(
      this._db,
      fid,
      signer,
      protobufs.MessageType.MESSAGE_TYPE_AMP_REMOVE
    );

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

  async pruneMessages(fid: number): HubAsyncResult<void> {
    // Count number of AmpAdd and AmpRemove messages for this fid
    // TODO: persist this count to avoid having to retrieve it with each call
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.AmpMessage);
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
    const messageToPrune: (protobufs.AmpAddMessage | protobufs.AmpRemoveMessage)[] = [];

    // Create a rocksdb transaction to include all the mutations
    let pruneTsx = this._db.transaction();

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = getMessagesPruneIterator(this._db, fid, UserPostfix.AmpMessage);

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
      if (protobufs.isAmpAddMessage(message)) {
        pruneTsx = this.deleteAmpAddTransaction(pruneTsx, message);
      } else if (protobufs.isAmpRemoveMessage(message)) {
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

  protected async mergeFromSequentialQueue(message: protobufs.Message): Promise<void> {
    if (protobufs.isAmpAddMessage(message)) {
      return this.mergeAdd(message);
    } else if (protobufs.isAmpRemoveMessage(message)) {
      return this.mergeRemove(message);
    } else {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: protobufs.AmpAddMessage): Promise<void> {
    const mergeConflicts = await this.getMergeConflicts(message);

    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add ops to store the message by messageKey and index the the messageKey by set
    txn = this.putAmpAddTransaction(txn, message);

    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message, mergeConflicts.value);

    return undefined;
  }

  private async mergeRemove(message: protobufs.AmpRemoveMessage): Promise<void> {
    const mergeConflicts = await this.getMergeConflicts(message);

    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add ops to store the message by messageKey and index the the messageKey by set
    txn = this.putAmpRemoveTransaction(txn, message);

    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message, mergeConflicts.value);

    return undefined;
  }

  private ampMessageCompare(
    aType: protobufs.MessageType.MESSAGE_TYPE_AMP_ADD | protobufs.MessageType.MESSAGE_TYPE_AMP_REMOVE,
    aTsHash: Uint8Array,
    bType: protobufs.MessageType.MESSAGE_TYPE_AMP_ADD | protobufs.MessageType.MESSAGE_TYPE_AMP_REMOVE,
    bTsHash: Uint8Array
  ): number {
    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    // Compare message types to enforce that RemoveWins in case of LWW ties.
    if (
      aType === protobufs.MessageType.MESSAGE_TYPE_AMP_REMOVE &&
      bType === protobufs.MessageType.MESSAGE_TYPE_AMP_ADD
    ) {
      return 1;
    } else if (
      aType === protobufs.MessageType.MESSAGE_TYPE_AMP_ADD &&
      bType === protobufs.MessageType.MESSAGE_TYPE_AMP_REMOVE
    ) {
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
  private async getMergeConflicts(
    message: protobufs.AmpAddMessage | protobufs.AmpRemoveMessage
  ): HubAsyncResult<(protobufs.AmpAddMessage | protobufs.AmpRemoveMessage)[]> {
    const conflicts: (protobufs.AmpAddMessage | protobufs.AmpRemoveMessage)[] = [];
    const targetFid = message.data.ampBody.targetFid;

    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Look up the remove tsHash for this amp
    const ampRemoveTsHash = await ResultAsync.fromPromise(
      this._db.get(makeAmpRemovesKey(message.data.fid, targetFid)),
      () => undefined
    );

    if (ampRemoveTsHash.isOk()) {
      const removeCompare = this.ampMessageCompare(
        protobufs.MessageType.MESSAGE_TYPE_AMP_REMOVE,
        ampRemoveTsHash.value,
        message.data.type,
        tsHash.value
      );
      if (removeCompare > 0) {
        return err(new HubError('bad_request.conflict', 'message conflicts with a more recent AmpRemove'));
      } else if (removeCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing remove has a lower order than the new message, retrieve the full
        // AmpRemove message and delete it as part of the RocksDB transaction
        const existingRemove = await getMessage<protobufs.AmpRemoveMessage>(
          this._db,
          message.data.fid,
          UserPostfix.AmpMessage,
          ampRemoveTsHash.value
        );
        conflicts.push(existingRemove);
      }
    }

    // Look up the add tsHash for this amp
    const ampAddTsHash = await ResultAsync.fromPromise(
      this._db.get(makeAmpAddsKey(message.data.fid, targetFid)),
      () => undefined
    );

    if (ampAddTsHash.isOk()) {
      const addCompare = this.ampMessageCompare(
        protobufs.MessageType.MESSAGE_TYPE_AMP_ADD,
        ampAddTsHash.value,
        message.data.type,
        tsHash.value
      );
      if (addCompare > 0) {
        return err(new HubError('bad_request.conflict', 'message conflicts with a more recent AmpAdd'));
      } else if (addCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // AmpAdd message and delete it as part of the RocksDB transaction
        const existingAdd = await getMessage<protobufs.AmpAddMessage>(
          this._db,
          message.data.fid,
          UserPostfix.AmpMessage,
          ampAddTsHash.value
        );

        conflicts.push(existingAdd);
      }
    }

    return ok(conflicts);
  }

  private deleteManyTransaction(
    txn: Transaction,
    messages: (protobufs.AmpAddMessage | protobufs.AmpRemoveMessage)[]
  ): Transaction {
    for (const message of messages) {
      if (protobufs.isAmpAddMessage(message)) {
        txn = this.deleteAmpAddTransaction(txn, message);
      } else if (protobufs.isAmpRemoveMessage(message)) {
        txn = this.deleteAmpRemoveTransaction(txn, message);
      }
    }
    return txn;
  }

  /* Builds a RocksDB transaction to insert a AmpAdd message and construct its indices */
  private putAmpAddTransaction(txn: Transaction, message: protobufs.AmpAddMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Puts the message into the database
    txn = putMessageTransaction(txn, message);

    // Puts the message key into the AmpAdds set index
    txn = txn.put(makeAmpAddsKey(message.data.fid, message.data.ampBody.targetFid), Buffer.from(tsHash.value));

    // Puts the message key into the byTargetUser index
    txn = txn.put(makeAmpsByTargetFidKey(message.data.ampBody.targetFid, message.data.fid, tsHash.value), TRUE_VALUE);

    return txn;
  }

  /* Builds a RocksDB transaction to remove a AmpAdd message and delete its indices */
  private deleteAmpAddTransaction(txn: Transaction, message: protobufs.AmpAddMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Delete the message key from the byTargetUser index
    txn = txn.del(makeAmpsByTargetFidKey(message.data.ampBody.targetFid, message.data.fid, tsHash.value));

    // Delete the message key from the AmpAdds set index
    txn = txn.del(makeAmpAddsKey(message.data.fid, message.data.ampBody.targetFid));

    // Delete message
    return deleteMessageTransaction(txn, message);
  }

  /* Builds a RocksDB transaction to insert a AmpRemove message and construct its indices */
  private putAmpRemoveTransaction(txn: Transaction, message: protobufs.AmpRemoveMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Puts the message
    txn = putMessageTransaction(txn, message);

    // Puts the message key into the AmpRemoves set index
    txn = txn.put(makeAmpRemovesKey(message.data.fid, message.data.ampBody.targetFid), Buffer.from(tsHash.value));

    return txn;
  }

  /* Builds a RocksDB transaction to remove a AmpRemove message and delete its indices */
  private deleteAmpRemoveTransaction(txn: Transaction, message: protobufs.AmpRemoveMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Delete the message key from the AmpRemoves set index
    txn = txn.del(makeAmpRemovesKey(message.data.fid, message.data.ampBody.targetFid));

    // Delete the message
    return deleteMessageTransaction(txn, message);
  }
}

export default AmpStore;
