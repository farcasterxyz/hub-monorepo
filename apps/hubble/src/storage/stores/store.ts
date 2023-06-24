import {
  HubAsyncResult,
  HubError,
  HubEventType,
  Message,
  MessageType,
  bytesCompare,
  getFarcasterTime,
  isHubError,
} from '@farcaster/hub-nodejs';
import {
  deleteMessageTransaction,
  getManyMessages,
  getMessage,
  getMessagesPageByPrefix,
  getMessagesPruneIterator,
  getNextMessageFromIterator,
  getPageIteratorByPrefix,
  makeMessagePrimaryKey,
  makeTsHash,
  putMessageTransaction,
} from '../db/message.js';
import RocksDB, { Iterator, Transaction } from '../db/rocksdb.js';
import StoreEventHandler, { HubEventArgs } from './storeEventHandler.js';
import { MERGE_TIMEOUT_DEFAULT, MessagesPage, PAGE_SIZE_MAX, PageOptions, StorePruneOptions } from './types.js';
import AsyncLock from 'async-lock';
import { TSHASH_LENGTH, UserMessagePostfix } from '../db/types.js';
import { ResultAsync, err, ok } from 'neverthrow';
import { logger } from '../../utils/logger.js';

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

const deepPartialEquals = <T>(partial: DeepPartial<T>, whole: T) => {
  if (typeof partial === 'object') {
    for (const key in partial) {
      // eslint-disable-next-line security/detect-object-injection
      if (partial[key] !== undefined) {
        // eslint-disable-next-line security/detect-object-injection
        if (!deepPartialEquals(partial[key] as any, whole[key as keyof T] as any)) {
          return false;
        }
      }
    }
  } else {
    return partial === whole;
  }

  return true;
};

export abstract class Store<TAdd extends Message, TRemove extends Message> {
  protected _db: RocksDB;
  protected _eventHandler: StoreEventHandler;
  private _pruneSizeLimit: number;
  protected _pruneTimeLimit: number | undefined;
  private _mergeLock: AsyncLock;

  protected PRUNE_SIZE_LIMIT_DEFAULT = 10000;
  protected PRUNE_TIME_LIMIT_DEFAULT: number | undefined;

  abstract _postfix: UserMessagePostfix;

  abstract makeAddKey(data: DeepPartial<TAdd>): Buffer;
  abstract makeRemoveKey(data: DeepPartial<TRemove>): Buffer;
  abstract _isAddType: (message: Message) => message is TAdd;
  abstract _isRemoveType: ((message: Message) => message is TRemove) | undefined;
  abstract _addMessageType: MessageType;
  abstract _removeMessageType: MessageType | undefined;
  abstract findMergeAddConflicts(message: TAdd): HubAsyncResult<void>;
  abstract findMergeRemoveConflicts(message: TRemove): HubAsyncResult<void>;

  async validateAdd(add: TAdd): HubAsyncResult<void> {
    if (!add.data) {
      return err(new HubError('bad_request.invalid_param', 'data null'));
    }

    const tsHash = makeTsHash(add.data.timestamp, add.hash);
    if (tsHash.isErr()) {
      return err(tsHash.error);
    }

    return ok(undefined);
  }

  async validateRemove(remove: TRemove): HubAsyncResult<void> {
    if (!remove.data) {
      return err(new HubError('bad_request.invalid_param', 'data null'));
    }

    const tsHash = makeTsHash(remove.data.timestamp, remove.hash);
    if (tsHash.isErr()) {
      return err(tsHash.error);
    }

    return ok(undefined);
  }

  async buildSecondaryIndices(_txn: Transaction, _add: TAdd): HubAsyncResult<void> {
    return ok(undefined);
  }
  async deleteSecondaryIndices(_txn: Transaction, _add: TAdd): HubAsyncResult<void> {
    return ok(undefined);
  }

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    this._db = db;
    this._eventHandler = eventHandler;
    this._pruneSizeLimit = options.pruneSizeLimit ?? this.PRUNE_SIZE_LIMIT_DEFAULT;
    this._pruneTimeLimit = options.pruneTimeLimit ?? this.PRUNE_TIME_LIMIT_DEFAULT;
    this._mergeLock = new AsyncLock();
  }

  /** Looks up TAdd message by tsHash */
  async getAdd(extractible: DeepPartial<TAdd>): Promise<TAdd> {
    if (!extractible.data?.fid) {
      throw new HubError('bad_request.invalid_param', 'fid null');
    }

    const addsKey = this.makeAddKey(extractible);
    const messageTsHash = await this._db.get(addsKey);
    return getMessage(this._db, extractible.data.fid, this._postfix, messageTsHash);
  }

  /** Looks up TRemove message by cast tsHash */
  async getRemove(extractible: DeepPartial<TRemove>): Promise<TRemove> {
    if (!this._isRemoveType) {
      throw new Error('remove type is unsupported for this store');
    }

    if (!extractible.data?.fid) {
      throw new HubError('bad_request.invalid_param', 'fid null');
    }

    const removesKey = this.makeRemoveKey(extractible);
    const messageTsHash = await this._db.get(removesKey);
    return getMessage(this._db, extractible.data.fid, this._postfix, messageTsHash);
  }

  /** Gets all TAdd messages for an fid */
  async getAddsByFid(extractible: DeepPartial<TAdd>, pageOptions: PageOptions = {}): Promise<MessagesPage<TAdd>> {
    if (!extractible.data?.fid) {
      throw new HubError('bad_request.invalid_param', 'fid null');
    }

    const castMessagesPrefix = makeMessagePrimaryKey(extractible.data.fid, this._postfix);
    const filter = (message: Message): message is TAdd => {
      return this._isAddType(message) && deepPartialEquals(extractible, message);
    };
    return getMessagesPageByPrefix(this._db, castMessagesPrefix, filter, pageOptions);
  }

  /** Gets all TRemove messages for an fid */
  async getRemovesByFid(
    extractible: DeepPartial<TRemove>,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<TRemove>> {
    if (!this._isRemoveType) {
      throw new Error('remove type is unsupported for this store');
    }

    if (!extractible.data?.fid) {
      throw new HubError('bad_request.invalid_param', 'fid null');
    }

    const castMessagesPrefix = makeMessagePrimaryKey(extractible.data.fid, this._postfix);
    const filter = (message: Message): message is TRemove => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this._isRemoveType!(message) && deepPartialEquals(extractible, message);
    };
    return getMessagesPageByPrefix(this._db, castMessagesPrefix, filter, pageOptions);
  }

  async getAllMessagesByFid(fid: number, pageOptions: PageOptions = {}): Promise<MessagesPage<TAdd | TRemove>> {
    const prefix = makeMessagePrimaryKey(fid, this._postfix);
    const filter = (message: Message): message is TAdd | TRemove => {
      return this._isAddType(message) || (!!this._isRemoveType && this._isRemoveType(message));
    };
    return getMessagesPageByPrefix(this._db, prefix, filter, pageOptions);
  }

  /** Merges a TAdd or TRemove message into the Store */
  async merge(message: Message): Promise<number> {
    if (!this._isAddType(message) && (!this._isRemoveType || !this._isRemoveType(message))) {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }

    if (!message.data) {
      throw new HubError('bad_request.invalid_param', 'data null');
    }

    return this._mergeLock
      .acquire(
        message.data.fid.toString(),
        async () => {
          const prunableResult = await this._eventHandler.isPrunable(
            message as any,
            this._postfix,
            this._pruneSizeLimit,
            this._pruneTimeLimit
          );
          if (prunableResult.isErr()) {
            throw prunableResult.error;
          } else if (prunableResult.value) {
            throw new HubError('bad_request.prunable', 'message would be pruned');
          }

          if (this._isAddType(message)) {
            return this.mergeAdd(message);
          } else if (this._isRemoveType && this._isRemoveType(message)) {
            return this.mergeRemove(message);
          } else {
            throw new HubError('bad_request.validation_failure', 'invalid message type');
          }
        },
        { timeout: MERGE_TIMEOUT_DEFAULT }
      )
      .catch((e: any) => {
        throw isHubError(e) ? e : new HubError('unavailable.storage_failure', 'merge timed out');
      });
  }

  async revoke(message: Message): HubAsyncResult<number> {
    let txn = this._db.transaction();
    if (this._isAddType(message)) {
      const txnMaybe = await this.deleteAddTransaction(txn, message);
      if (txnMaybe.isErr()) throw txnMaybe.error;
      txn = txnMaybe.value;
    } else if (this._isRemoveType && this._isRemoveType(message)) {
      const txnMaybe = await this.deleteRemoveTransaction(txn, message);
      if (txnMaybe.isErr()) throw txnMaybe.error;
      txn = txnMaybe.value;
    } else {
      return err(new HubError('bad_request.invalid_param', 'invalid message type'));
    }

    return this._eventHandler.commitTransaction(txn, {
      type: HubEventType.REVOKE_MESSAGE,
      revokeMessageBody: { message },
    });
  }

  async pruneMessages(fid: number): HubAsyncResult<number[]> {
    const commits: number[] = [];

    const cachedCount = await this._eventHandler.getCacheMessageCount(fid, this._postfix);

    // Require storage cache to be synced to prune
    if (cachedCount.isErr()) {
      return err(cachedCount.error);
    }

    // Return immediately if there are no messages to prune
    if (cachedCount.value === 0) {
      return ok(commits);
    }

    const farcasterTime = getFarcasterTime();
    if (farcasterTime.isErr()) {
      return err(farcasterTime.error);
    }

    // Calculate the timestamp cut-off to prune
    const timestampToPrune =
      this._pruneTimeLimit === undefined ? undefined : farcasterTime.value - this._pruneTimeLimit;

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = getMessagesPruneIterator(this._db, fid, this._postfix);

    const pruneNextMessage = async (): HubAsyncResult<number | undefined> => {
      const nextMessage = await ResultAsync.fromPromise(getNextMessageFromIterator(pruneIterator), () => undefined);
      if (nextMessage.isErr()) {
        return ok(undefined); // Nothing left to prune
      }

      const count = await this._eventHandler.getCacheMessageCount(fid, this._postfix);
      if (count.isErr()) {
        return err(count.error);
      }

      if (
        count.value <= this._pruneSizeLimit &&
        (timestampToPrune === undefined ||
          (nextMessage.value.data && nextMessage.value.data.timestamp >= timestampToPrune))
      ) {
        return ok(undefined);
      }

      let txn = this._db.transaction();

      if (this._isAddType(nextMessage.value)) {
        const txnMaybe = await this.deleteAddTransaction(txn, nextMessage.value);
        if (txnMaybe.isErr()) throw txnMaybe.error;
        txn = txnMaybe.value;
      } else if (this._isRemoveType && this._isRemoveType(nextMessage.value)) {
        const txnMaybe = await this.deleteRemoveTransaction(txn, nextMessage.value);
        if (txnMaybe.isErr()) throw txnMaybe.error;
        txn = txnMaybe.value;
      } else {
        return err(new HubError('unknown', 'invalid message type'));
      }

      return this._eventHandler.commitTransaction(txn, {
        type: HubEventType.PRUNE_MESSAGE,
        pruneMessageBody: { message: nextMessage.value },
      });
    };

    let pruneResult = await pruneNextMessage();
    while (!(pruneResult.isOk() && pruneResult.value === undefined)) {
      pruneResult.match(
        (commit) => {
          if (commit) {
            commits.push(commit);
          }
        },
        (e) => {
          logger.error({ errCode: e.errCode }, `error pruning message for fid ${fid}: ${e.message}`);
        }
      );

      pruneResult = await pruneNextMessage();
    }

    await pruneIterator.end();

    return ok(commits);
  }

  protected async getBySecondaryIndex(prefix: Buffer, pageOptions: PageOptions = {}): Promise<MessagesPage<TAdd>> {
    const iterator = getPageIteratorByPrefix(this._db, prefix, pageOptions);

    const limit = pageOptions.pageSize || PAGE_SIZE_MAX;

    const messageKeys: Buffer[] = [];

    // Custom method to retrieve message key from key
    const getNextIteratorRecord = async (iterator: Iterator): Promise<[Buffer, Buffer]> => {
      const [key] = await iterator.next();
      const fid = Number((key as Buffer).readUint32BE(prefix.length + TSHASH_LENGTH));
      const tsHash = Uint8Array.from(key as Buffer).subarray(prefix.length, prefix.length + TSHASH_LENGTH);
      const messagePrimaryKey = makeMessagePrimaryKey(fid, this._postfix, tsHash);
      return [key as Buffer, messagePrimaryKey];
    };

    let iteratorFinished = false;
    let lastPageToken: Uint8Array | undefined;
    do {
      const result = await ResultAsync.fromPromise(getNextIteratorRecord(iterator), (e) => e as HubError);
      if (result.isErr()) {
        iteratorFinished = true;
        break;
      }

      const [key, messageKey] = result.value;
      lastPageToken = Uint8Array.from(key.subarray(prefix.length));
      messageKeys.push(messageKey);
    } while (messageKeys.length < limit);

    const messages = await getManyMessages<TAdd>(this._db, messageKeys);

    await iterator.end(); // clear iterator if it has not finished
    if (!iteratorFinished) {
      return { messages, nextPageToken: lastPageToken };
    } else {
      return { messages, nextPageToken: undefined };
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: TAdd): Promise<number> {
    const mergeConflicts = await this.getMergeConflicts(message);
    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = await this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add ops to store the message by messageKey and index the the messageKey by set and by target
    const addTxn = await this.putAddTransaction(txn, message);
    if (addTxn.isErr()) {
      throw addTxn.error;
    }

    txn = addTxn.value;

    const hubEvent: HubEventArgs = {
      type: HubEventType.MERGE_MESSAGE,
      mergeMessageBody: { message, deletedMessages: mergeConflicts.value },
    };

    // Commit the RocksDB transaction
    const result = await this._eventHandler.commitTransaction(txn, hubEvent);
    if (result.isErr()) {
      throw result.error;
    }
    return result.value;
  }

  private async mergeRemove(message: TRemove): Promise<number> {
    const mergeConflicts = await this.getMergeConflicts(message);

    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = await this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add ops to store the message by messageKey and index the the messageKey by set
    const txnRemove = await this.putRemoveTransaction(txn, message);
    if (txnRemove.isErr()) {
      throw txnRemove.error;
    }

    txn = txnRemove.value;

    const hubEvent: HubEventArgs = {
      type: HubEventType.MERGE_MESSAGE,
      mergeMessageBody: { message, deletedMessages: mergeConflicts.value },
    };

    // Commit the RocksDB transaction
    const result = await this._eventHandler.commitTransaction(txn, hubEvent);
    if (result.isErr()) {
      throw result.error;
    }
    return result.value;
  }

  protected messageCompare(aType: MessageType, aTsHash: Uint8Array, bType: MessageType, bTsHash: Uint8Array): number {
    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    // Compare message types to enforce that RemoveWins in case of LWW ties.
    if (aType === this._removeMessageType && bType === this._addMessageType) {
      return 1;
    } else if (aType === this._addMessageType && bType === this._removeMessageType) {
      return -1;
    }

    // Compare hashes (last 4 bytes of tsHash) to break ties between messages of the same type and timestamp
    return bytesCompare(aTsHash.subarray(4), bTsHash.subarray(4));
  }

  /**
   * Determines the RocksDB keys that must be modified to settle merge conflicts as a result of
   * adding a Message to the Store.
   *
   * @returns a RocksDB transaction if keys must be added or removed, undefined otherwise
   */
  private async getMergeConflicts(message: TAdd | TRemove): HubAsyncResult<(TAdd | TRemove)[]> {
    const validateResult = await (this._isAddType(message) ? this.validateAdd(message) : this.validateRemove(message));

    if (validateResult.isErr()) {
      return err(validateResult.error);
    }

    const checkResult = await (this._isAddType(message)
      ? this.findMergeAddConflicts(message)
      : this.findMergeRemoveConflicts(message));

    if (checkResult.isErr()) {
      return err(checkResult.error);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tsHash = makeTsHash(message.data!.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const conflicts: (TAdd | TRemove)[] = [];

    if (this._isRemoveType) {
      // Checks if there is a remove timestamp hash for this
      const removeKey = this.makeRemoveKey(message as any);
      const removeTsHash = await ResultAsync.fromPromise(this._db.get(removeKey), () => undefined);

      if (removeTsHash.isOk()) {
        const removeCompare = this.messageCompare(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this._removeMessageType!,
          new Uint8Array(removeTsHash.value),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          message.data!.type,
          tsHash.value
        );
        if (removeCompare > 0) {
          return err(new HubError('bad_request.conflict', 'message conflicts with a more recent remove'));
        } else if (removeCompare === 0) {
          return err(new HubError('bad_request.duplicate', 'message has already been merged'));
        } else {
          // If the existing remove has a lower order than the new message, retrieve the full
          // TRemove message and delete it as part of the RocksDB transaction
          const existingRemove = await getMessage<TRemove>(
            this._db,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            message.data!.fid,
            this._postfix,
            removeTsHash.value
          );
          conflicts.push(existingRemove);
        }
      }
    }
    // Checks if there is an add timestamp hash for this
    const addKey = this.makeAddKey(message as any);
    const addTsHash = await ResultAsync.fromPromise(this._db.get(addKey), () => undefined);

    if (addTsHash.isOk()) {
      const addCompare = this.messageCompare(
        this._addMessageType,
        new Uint8Array(addTsHash.value),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        message.data!.type,
        tsHash.value
      );
      if (addCompare > 0) {
        return err(new HubError('bad_request.conflict', 'message conflicts with a more recent add'));
      } else if (addCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // TAdd message and delete it as part of the RocksDB transaction
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const existingAdd = await getMessage<TAdd>(this._db, message.data!.fid, this._postfix, addTsHash.value);
        conflicts.push(existingAdd);
      }
    }

    return ok(conflicts);
  }

  private async deleteManyTransaction(txn: Transaction, messages: (TAdd | TRemove)[]): Promise<Transaction> {
    for (const message of messages) {
      if (this._isAddType(message)) {
        const txnMaybe = await this.deleteAddTransaction(txn, message);
        if (txnMaybe.isErr()) throw txnMaybe.error;
        txn = txnMaybe.value;
      } else if (this._isRemoveType && this._isRemoveType(message)) {
        const txnMaybe = await this.deleteRemoveTransaction(txn, message);
        if (txnMaybe.isErr()) throw txnMaybe.error;
        txn = txnMaybe.value;
      }
    }
    return txn;
  }

  /* Builds a RocksDB transaction to insert a TAdd message and construct its indices */
  private async putAddTransaction(txn: Transaction, message: TAdd): HubAsyncResult<Transaction> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tsHash = makeTsHash(message.data!.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Puts the message into the database
    txn = putMessageTransaction(txn, message);

    // Puts the message into the TAdds Set index
    const addsKey = this.makeAddKey(message as any);
    txn = txn.put(addsKey, Buffer.from(tsHash.value));

    const build = await this.buildSecondaryIndices(txn, message);
    if (build.isErr()) {
      return err(build.error);
    }

    return ok(txn);
  }

  /* Builds a RocksDB transaction to remove a TAdd message and delete its indices */
  private async deleteAddTransaction(txn: Transaction, message: TAdd): HubAsyncResult<Transaction> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tsHash = makeTsHash(message.data!.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const build = await this.deleteSecondaryIndices(txn, message);
    if (build.isErr()) {
      return err(build.error);
    }

    // Delete the message key from TAdds Set index
    const addsKey = this.makeAddKey(message as any);
    txn = txn.del(addsKey);

    // Delete the message
    return ok(deleteMessageTransaction(txn, message));
  }

  /* Builds a RocksDB transaction to insert a TRemove message and construct its indices */
  private async putRemoveTransaction(txn: Transaction, message: TRemove): HubAsyncResult<Transaction> {
    if (!this._isRemoveType) {
      throw new Error('remove type is unsupported for this store');
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tsHash = makeTsHash(message.data!.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Puts the message
    txn = putMessageTransaction(txn, message);

    // Puts message key into the TRemoves Set index
    const removesKey = this.makeRemoveKey(message as any);
    txn = txn.put(removesKey, Buffer.from(tsHash.value));

    return ok(txn);
  }

  /* Builds a RocksDB transaction to remove a TRemove message and delete its indices */
  private async deleteRemoveTransaction(txn: Transaction, message: TRemove): HubAsyncResult<Transaction> {
    if (!this._isRemoveType) {
      throw new Error('remove type is unsupported for this store');
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tsHash = makeTsHash(message.data!.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Delete message key from TRemoves Set index
    const removesKey = this.makeRemoveKey(message as any);
    txn = txn.del(removesKey);

    // Delete the message
    return ok(deleteMessageTransaction(txn, message));
  }
}
