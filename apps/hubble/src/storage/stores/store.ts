import {
  HashScheme,
  HubAsyncResult,
  HubError,
  HubEventType,
  Message,
  MessageData,
  MessageType,
  SignatureScheme,
  bytesCompare,
  getFarcasterTime,
  isHubError,
} from '@farcaster/hub-nodejs';
import {
  deleteMessageTransaction,
  getMessage,
  getMessagesPageByPrefix,
  getMessagesPruneIterator,
  getNextMessageFromIterator,
  makeMessagePrimaryKey,
  makeTsHash,
  putMessageTransaction,
} from 'storage/db/message.js';
import RocksDB, { Transaction } from '../db/rocksdb.js';
import StoreEventHandler, { HubEventArgs } from './storeEventHandler.js';
import { MERGE_TIMEOUT_DEFAULT, MessagesPage, PageOptions, StorePruneOptions } from './types.js';
import AsyncLock from 'async-lock';
import { UserMessagePostfix } from 'storage/db/types.js';
import { ResultAsync, err, ok } from 'neverthrow';
import { logger } from 'utils/logger.js';

interface ExtractibleHashKey<TData extends Message> {
  data: MessageData | undefined;
  hash: Uint8Array;
  hashScheme: HashScheme;
  signature: Uint8Array;
  signatureScheme: SignatureScheme;
  signer: Uint8Array;
  fid: number;
  makeKey: (data: ExtractibleHashKey<TData>) => Buffer;
  isType: (data: Message) => data is TData;
}

interface ExtractibleBufferKey<TData extends Message> {
  data: MessageData | undefined;
  hash: Uint8Array;
  hashScheme: HashScheme;
  signature: Uint8Array;
  signatureScheme: SignatureScheme;
  signer: Uint8Array;
  fid: number;
  buffer: Uint8Array;
  makeKey: (data: ExtractibleBufferKey<TData>) => Buffer;
  isType: (data: Message) => data is TData;
}

interface ExtractibleTypedTargetKey<TData extends Message> {
  data: MessageData | undefined;
  hash: Uint8Array;
  hashScheme: HashScheme;
  signature: Uint8Array;
  signatureScheme: SignatureScheme;
  signer: Uint8Array;
  fid: number;
  type: string;
  target: any;
  makeKey: (data: ExtractibleTypedTargetKey<TData>) => Buffer;
  isType: (data: Message) => data is TData;
}

type ExtractibleKey<TData extends Message> =
  | ExtractibleHashKey<TData>
  | ExtractibleBufferKey<TData>
  | ExtractibleTypedTargetKey<TData>;

export abstract class Store<TAdd extends ExtractibleKey<TAdd>, TRemove extends ExtractibleKey<TRemove>> {
  private _db: RocksDB;
  private _eventHandler: StoreEventHandler;
  private _pruneSizeLimit: number | undefined;
  private _pruneTimeLimit: number | undefined;
  private _mergeLock: AsyncLock;

  protected PRUNE_SIZE_LIMIT_DEFAULT: number | undefined;
  protected PRUNE_TIME_LIMIT_DEFAULT: number | undefined;

  abstract _postfix: UserMessagePostfix;

  // A very sad typehack required because javascript knows nothing about
  // generic types.
  abstract _addType: TAdd;
  abstract _removeType: TRemove | undefined;
  abstract _addMessageType: MessageType;
  abstract _removeMessageType: MessageType | undefined;

  abstract validateAdd(add: TAdd): HubAsyncResult<void>;
  abstract validateRemove(remove: TRemove): HubAsyncResult<void>;
  abstract buildSecondaryIndices(add: TAdd): HubAsyncResult<void>;
  abstract deleteSecondaryIndices(add: TAdd): HubAsyncResult<void>;

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    this._db = db;
    this._eventHandler = eventHandler;
    this._pruneSizeLimit = options.pruneSizeLimit ?? this.PRUNE_SIZE_LIMIT_DEFAULT;
    this._pruneSizeLimit = options.pruneTimeLimit ?? this.PRUNE_TIME_LIMIT_DEFAULT;
    this._mergeLock = new AsyncLock();
  }

  /** Looks up TAdd message by tsHash */
  async getAdd(data: Partial<ExtractibleKey<TAdd>>): Promise<TAdd> {
    const addsKey = this._addType.makeKey(data as any);
    const messageTsHash = await this._db.get(addsKey);
    return getMessage(this._db, data.fid!, this._postfix, messageTsHash);
  }

  /** Looks up TRemove message by cast tsHash */
  async getRemove(data: Partial<ExtractibleKey<TRemove>>): Promise<TRemove> {
    if (!this._removeType) {
      throw new Error('remove type is unsupported for this store');
    }
    const removesKey = this._removeType.makeKey(data as any);
    const messageTsHash = await this._db.get(removesKey);
    return getMessage(this._db, data.fid!, this._postfix, messageTsHash);
  }

  /** Gets all TAdd messages for an fid */
  async getAddsByFid(data: Partial<ExtractibleKey<TAdd>>, pageOptions: PageOptions = {}): Promise<MessagesPage<TAdd>> {
    const castMessagesPrefix = makeMessagePrimaryKey(data.fid!, this._postfix);
    const filter = (message: Message): message is TAdd => {
      let match = this._addType.isType(message);
      for (const key in Object.keys(data)) {
        // eslint-disable-next-line security/detect-object-injection
        const value = data[key as keyof Partial<ExtractibleKey<TAdd>>];
        if (value) {
          match = match && value === message.data![key as keyof MessageData];
        }
      }

      return true;
    };
    return getMessagesPageByPrefix(this._db, castMessagesPrefix, filter, pageOptions);
  }

  /** Gets all TRemove messages for an fid */
  async getRemovesByFid(
    data: Partial<ExtractibleKey<TAdd>>,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<TRemove>> {
    if (!this._removeType) {
      throw new Error('remove type is unsupported for this store');
    }
    const castMessagesPrefix = makeMessagePrimaryKey(data.fid!, this._postfix);
    const filter = (message: Message): message is TRemove => {
      let match = this._removeType!.isType(message);
      for (const key in Object.keys(data)) {
        // eslint-disable-next-line security/detect-object-injection
        const value = data[key as keyof Partial<ExtractibleKey<TRemove>>];
        if (value) {
          match = match && value === message.data![key as keyof MessageData];
        }
      }

      return true;
    };
    return getMessagesPageByPrefix(this._db, castMessagesPrefix, filter, pageOptions);
  }

  async getAllMessagesByFid(fid: number, pageOptions: PageOptions = {}): Promise<MessagesPage<TAdd | TRemove>> {
    const prefix = makeMessagePrimaryKey(fid, this._postfix);
    const filter = (message: Message): message is TAdd | TRemove => {
      return this._addType.isType(message) || (!!this._removeType && this._removeType.isType(message));
    };
    return getMessagesPageByPrefix(this._db, prefix, filter, pageOptions);
  }

  /** Merges a LinkAdd or LinkRemove message into the LinkStore */
  async merge(message: Message): Promise<number> {
    if (!this._addType.isType(message) && (!this._removeType || !this._removeType.isType(message))) {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }

    return this._mergeLock
      .acquire(
        message.data!.fid.toString(),
        async () => {
          if (this._pruneSizeLimit) {
            const prunableResult = await this._eventHandler.isPrunable(message, this._postfix, this._pruneSizeLimit);
            if (prunableResult.isErr()) {
              throw prunableResult.error;
            } else if (prunableResult.value) {
              throw new HubError('bad_request.prunable', 'message would be pruned');
            }
          }

          if (this._addType.isType(message)) {
            return this.mergeAdd(message);
          } else if (this._removeType && this._removeType.isType(message)) {
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
    if (this._addType.isType(message)) {
      const txnMaybe = await this.deleteAddTransaction(txn, message);
      if (txnMaybe.isErr()) throw txnMaybe.error;
      txn = txnMaybe.value;
    } else if (this._removeType && this._removeType.isType(message)) {
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
    if (!this._pruneSizeLimit && !this._pruneTimeLimit) return ok([]);
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

      if (this._pruneSizeLimit && count.value <= this._pruneSizeLimit) {
        return ok(undefined);
      }

      let txn = this._db.transaction();

      if (this._addType.isType(nextMessage.value)) {
        const txnMaybe = await this.deleteAddTransaction(txn, nextMessage.value);
        if (txnMaybe.isErr()) throw txnMaybe.error;
        txn = txnMaybe.value;
      } else if (this._removeType && this._removeType.isType(nextMessage.value)) {
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
          logger.error({ errCode: e.errCode }, `error pruning link message for fid ${fid}: ${e.message}`);
        }
      );

      pruneResult = await pruneNextMessage();
    }

    await pruneIterator.end();

    return ok(commits);
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

  private messageCompare(aType: MessageType, aTsHash: Uint8Array, bType: MessageType, bTsHash: Uint8Array): number {
    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    // Compare message types to enforce that RemoveWins in case of LWW ties.
    if (aType === this._removeMessageType && bType === this._addMessageType) {
      return 1;
    } else if (aType === this._addMessageType && bType === MessageType.LINK_REMOVE) {
      return -1;
    }

    // Compare hashes (last 4 bytes of tsHash) to break ties between messages of the same type and timestamp
    return bytesCompare(aTsHash.subarray(4), bTsHash.subarray(4));
  }

  /**
   * Determines the RocksDB keys that must be modified to settle merge conflicts as a result of
   * adding a Link to the Store.
   *
   * @returns a RocksDB transaction if keys must be added or removed, undefined otherwise
   */
  private async getMergeConflicts(message: TAdd | TRemove): HubAsyncResult<(TAdd | TRemove)[]> {
    const result = await (this._addType.isType(message) ? this.validateAdd(message) : this.validateRemove(message));

    if (result.isErr()) {
      return err(result.error);
    }

    const tsHash = makeTsHash(message.data!.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const conflicts: (TAdd | TRemove)[] = [];

    if (this._removeType) {
      // Checks if there is a remove timestamp hash for this link
      const removeKey = this._removeType.makeKey(message as any);
      const removeTsHash = await ResultAsync.fromPromise(this._db.get(removeKey), () => undefined);

      if (removeTsHash.isOk()) {
        const removeCompare = this.messageCompare(
          this._removeMessageType!,
          new Uint8Array(removeTsHash.value),
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
            message.data!.fid,
            this._postfix,
            removeTsHash.value
          );
          conflicts.push(existingRemove);
        }
      }
    }

    // Checks if there is an add timestamp hash for this link
    const addKey = this._addType.makeKey(message as any);
    const addTsHash = await ResultAsync.fromPromise(this._db.get(addKey), () => undefined);

    if (addTsHash.isOk()) {
      const addCompare = this.messageCompare(
        this._addMessageType,
        new Uint8Array(addTsHash.value),
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
        const existingAdd = await getMessage<TAdd>(this._db, message.data!.fid, this._postfix, addTsHash.value);
        conflicts.push(existingAdd);
      }
    }

    return ok(conflicts);
  }

  private async deleteManyTransaction(txn: Transaction, messages: (TAdd | TRemove)[]): Promise<Transaction> {
    for (const message of messages) {
      if (this._addType.isType(message)) {
        const txnMaybe = await this.deleteAddTransaction(txn, message);
        if (txnMaybe.isErr()) throw txnMaybe.error;
        txn = txnMaybe.value;
      } else if (this._removeType?.isType(message)) {
        const txnMaybe = await this.deleteRemoveTransaction(txn, message);
        if (txnMaybe.isErr()) throw txnMaybe.error;
        txn = txnMaybe.value;
      }
    }
    return txn;
  }

  /* Builds a RocksDB transaction to insert a TAdd message and construct its indices */
  private async putAddTransaction(txn: Transaction, message: TAdd): HubAsyncResult<Transaction> {
    const tsHash = makeTsHash(message.data!.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const result = await this.validateAdd(message);
    if (result.isErr()) {
      return err(result.error);
    }

    // Puts the message into the database
    txn = putMessageTransaction(txn, message);

    // Puts the message into the TAdds Set index
    const addsKey = this._addType.makeKey(message as any);
    txn = txn.put(addsKey, Buffer.from(tsHash.value));

    const build = await this.buildSecondaryIndices(message);
    if (build.isErr()) {
      return err(build.error);
    }

    return ok(txn);
  }

  /* Builds a RocksDB transaction to remove a TAdd message and delete its indices */
  private async deleteAddTransaction(txn: Transaction, message: TAdd): HubAsyncResult<Transaction> {
    const tsHash = makeTsHash(message.data!.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const result = await this.validateAdd(message);
    if (result.isErr()) {
      return err(result.error);
    }

    const build = await this.deleteSecondaryIndices(message);
    if (build.isErr()) {
      return err(build.error);
    }

    // Delete the message key from TAdds Set index
    const addsKey = this._addType.makeKey(message as any);
    txn = txn.del(addsKey);

    // Delete the message
    return ok(deleteMessageTransaction(txn, message));
  }

  /* Builds a RocksDB transaction to insert a TRemove message and construct its indices */
  private async putRemoveTransaction(txn: Transaction, message: TRemove): HubAsyncResult<Transaction> {
    if (!this._removeType) {
      throw new Error('remove type is unsupported for this store');
    }

    const tsHash = makeTsHash(message.data!.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const result = await this.validateRemove(message);
    if (result.isErr()) {
      return err(result.error);
    }

    // Puts the message
    txn = putMessageTransaction(txn, message);

    // Puts message key into the TRemoves Set index
    const removesKey = this._removeType.makeKey(message as any);
    txn = txn.put(removesKey, Buffer.from(tsHash.value));

    return ok(txn);
  }

  /* Builds a RocksDB transaction to remove a TRemove message and delete its indices */
  private async deleteRemoveTransaction(txn: Transaction, message: TRemove): HubAsyncResult<Transaction> {
    if (!this._removeType) {
      throw new Error('remove type is unsupported for this store');
    }

    const tsHash = makeTsHash(message.data!.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const result = await this.validateRemove(message);
    if (result.isErr()) {
      return err(result.error);
    }

    // Delete message key from TRemoves Set index
    const removesKey = this._removeType.makeKey(message as any);
    txn = txn.del(removesKey);

    // Delete the message
    return ok(deleteMessageTransaction(txn, message));
  }
}
