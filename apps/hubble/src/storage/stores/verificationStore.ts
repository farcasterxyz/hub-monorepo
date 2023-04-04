import {
  bytesCompare,
  HubAsyncResult,
  HubError,
  HubEventType,
  isHubError,
  isVerificationAddEthAddressMessage,
  isVerificationRemoveMessage,
  Message,
  MessageType,
  VerificationAddEthAddressMessage,
  VerificationRemoveMessage,
} from '@farcaster/hub-nodejs';
import AsyncLock from 'async-lock';
import { err, ok, ResultAsync } from 'neverthrow';
import {
  deleteMessageTransaction,
  getMessage,
  getMessagesPageByPrefix,
  getMessagesPruneIterator,
  getNextMessageFromIterator,
  makeMessagePrimaryKey,
  makeTsHash,
  makeUserKey,
  putMessageTransaction,
} from '~/storage/db/message';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import { UserPostfix } from '~/storage/db/types';
import StoreEventHandler, { HubEventArgs } from '~/storage/stores/storeEventHandler';
import { MERGE_TIMEOUT_DEFAULT, MessagesPage, PageOptions, StorePruneOptions } from '~/storage/stores/types';
import { logger } from '~/utils/logger';

const PRUNE_SIZE_LIMIT_DEFAULT = 50;

/**
 * Generates a unique key used to store a VerificationAdds message key in the VerificationsAdds
 * set index
 *
 * @param fid farcaster id of the user who created the verification
 * @param address Ethereum address being verified
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<address?>
 */
const makeVerificationAddsKey = (fid: number, address?: Uint8Array): Buffer => {
  return Buffer.concat([makeUserKey(fid), Buffer.from([UserPostfix.VerificationAdds]), Buffer.from(address ?? '')]);
};

/**
 * Generates a unique key used to store a VerificationAdd message key in the VerificationRemoves
 * set index
 *
 * @param fid farcaster id of the user who created the verification
 * @param address Ethereum address being verified
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<targetKey?>:<type?>
 */
const makeVerificationRemovesKey = (fid: number, address?: Uint8Array): Buffer => {
  return Buffer.concat([makeUserKey(fid), Buffer.from([UserPostfix.VerificationRemoves]), Buffer.from(address ?? '')]);
};

/**
 * VerificationStore persists VerificationMessages in RocksDB using a two-phase CRDT set to
 * guarantee eventual consistency.
 *
 * A Verification is performed by an fid on a target (e.g. Ethereum address) and may have an
 * ordinality. Verifications are added with type specific messages like VerificationAddEthAddress
 * but are removed with a generic VerificationRemove message that points to the unique id of the
 * Add.
 *
 * Verification messages can collide if two messages have the same user fid and address. Collisions
 *are resolved with Last-Write-Wins + Remove-Wins rules as follows:
 *
 * 1. Highest timestamp wins
 * 2. Remove wins over Adds
 * 3. Highest lexicographic hash wins
 *
 * VerificationAddEthAddress is currently the only supported Verification type today. The key-value
 * entries created by Verification Store are:
 *
 * 1. fid:tsHash -> verification message
 * 2. fid:set:address -> fid:tsHash (Set Index)
 */

class VerificationStore {
  private _db: RocksDB;
  private _eventHandler: StoreEventHandler;
  private _pruneSizeLimit: number;
  private _mergeLock: AsyncLock;

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    this._db = db;
    this._eventHandler = eventHandler;
    this._pruneSizeLimit = options.pruneSizeLimit ?? PRUNE_SIZE_LIMIT_DEFAULT;
    this._mergeLock = new AsyncLock();
  }

  /**
   * Finds a VerificationAdds Message by checking the adds-set's index
   *
   * @param fid fid of the user who created the SignerAdd
   * @param address the address being verified
   *
   * @returns the VerificationAddEthAddressModel if it exists, throws HubError otherwise
   */
  async getVerificationAdd(fid: number, address: Uint8Array): Promise<VerificationAddEthAddressMessage> {
    const addsKey = makeVerificationAddsKey(fid, address);
    const messageTsHash = await this._db.get(addsKey);
    return getMessage<VerificationAddEthAddressMessage>(this._db, fid, UserPostfix.VerificationMessage, messageTsHash);
  }

  /**
   * Finds a VerificationsRemove Message by checking the remove-set's index
   *
   * @param fid fid of the user who created the SignerAdd
   * @param address the address being verified
   * @returns the VerificationRemoveEthAddress if it exists, throws HubError otherwise
   */
  async getVerificationRemove(fid: number, address: Uint8Array): Promise<VerificationRemoveMessage> {
    const removesKey = makeVerificationRemovesKey(fid, address);
    const messageTsHash = await this._db.get(removesKey);
    return getMessage<VerificationRemoveMessage>(this._db, fid, UserPostfix.VerificationMessage, messageTsHash);
  }

  /**
   * Finds all VerificationAdds messages for a user
   *
   * @param fid fid of the user who created the signers
   * @returns the VerificationAddEthAddresses if they exists, throws HubError otherwise
   */
  async getVerificationAddsByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<VerificationAddEthAddressMessage>> {
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.VerificationMessage);
    return getMessagesPageByPrefix(this._db, prefix, isVerificationAddEthAddressMessage, pageOptions);
  }

  /**
   * Finds all VerificationRemoves messages for a user
   *
   * @param fid fid of the user who created the signers
   * @returns the VerificationRemoves messages if it exists, throws HubError otherwise
   */
  async getVerificationRemovesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<VerificationRemoveMessage>> {
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.VerificationMessage);
    return getMessagesPageByPrefix(this._db, prefix, isVerificationRemoveMessage, pageOptions);
  }

  async getAllVerificationMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<VerificationAddEthAddressMessage | VerificationRemoveMessage>> {
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.VerificationMessage);
    const filter = (message: Message): message is VerificationAddEthAddressMessage | VerificationRemoveMessage => {
      return isVerificationAddEthAddressMessage(message) || isVerificationRemoveMessage(message);
    };
    return getMessagesPageByPrefix(this._db, prefix, filter, pageOptions);
  }

  /** Merge a VerificationAdd or VerificationRemove message into the VerificationStore */
  async merge(message: Message): Promise<number> {
    if (!isVerificationRemoveMessage(message) && !isVerificationAddEthAddressMessage(message)) {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }

    return this._mergeLock
      .acquire(
        message.data.fid.toString(),
        async () => {
          if (isVerificationAddEthAddressMessage(message)) {
            return this.mergeAdd(message);
          } else if (isVerificationRemoveMessage(message)) {
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
    if (isVerificationAddEthAddressMessage(message)) {
      txn = this.deleteVerificationAddTransaction(txn, message);
    } else if (isVerificationRemoveMessage(message)) {
      txn = this.deleteVerificationRemoveTransaction(txn, message);
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

    const cachedCount = this._eventHandler.getCacheMessageCount(fid, UserPostfix.VerificationMessage);

    // Require storage cache to be synced to prune
    if (cachedCount.isErr()) {
      return err(cachedCount.error);
    }

    // Return immediately if there are no messages to prune
    if (cachedCount.value === 0) {
      return ok(commits);
    }

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = getMessagesPruneIterator(this._db, fid, UserPostfix.VerificationMessage);

    const pruneNextMessage = async (): HubAsyncResult<number | undefined> => {
      const nextMessage = await ResultAsync.fromPromise(getNextMessageFromIterator(pruneIterator), () => undefined);
      if (nextMessage.isErr()) {
        return ok(undefined); // Nothing left to prune
      }

      const count = this._eventHandler.getCacheMessageCount(fid, UserPostfix.VerificationMessage);
      if (count.isErr()) {
        return err(count.error);
      }

      if (count.value <= this._pruneSizeLimit) {
        return ok(undefined);
      }

      let txn = this._db.transaction();

      if (isVerificationAddEthAddressMessage(nextMessage.value)) {
        txn = this.deleteVerificationAddTransaction(txn, nextMessage.value);
      } else if (isVerificationRemoveMessage(nextMessage.value)) {
        txn = this.deleteVerificationRemoveTransaction(txn, nextMessage.value);
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
          logger.error({ errCode: e.errCode }, `error pruning verification message for fid ${fid}: ${e.message}`);
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

  private async mergeAdd(message: VerificationAddEthAddressMessage): Promise<number> {
    // Define address for lookups
    const address = message.data.verificationAddEthAddressBody.address;
    if (!address) {
      throw new HubError('bad_request.validation_failure', 'address was missing');
    }

    const mergeConflicts = await this.getMergeConflicts(address, message);
    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add putVerificationAdd operations to the RocksDB transaction
    txn = this.putVerificationAddTransaction(txn, message);

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

  private async mergeRemove(message: VerificationRemoveMessage): Promise<number> {
    // Define address for lookups
    const address = message.data.verificationRemoveBody.address;
    if (!address) {
      throw new HubError('bad_request.validation_failure', 'address was missing');
    }

    const mergeConflicts = await this.getMergeConflicts(address, message);
    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add putVerificationRemove operations to the RocksDB transaction
    txn = this.putVerificationRemoveTransaction(txn, message);

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

  private verificationMessageCompare(
    aType: MessageType.VERIFICATION_ADD_ETH_ADDRESS | MessageType.VERIFICATION_REMOVE,
    aTsHash: Uint8Array,
    bType: MessageType.VERIFICATION_ADD_ETH_ADDRESS | MessageType.VERIFICATION_REMOVE,
    bTsHash: Uint8Array
  ): number {
    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    if (aType === MessageType.VERIFICATION_REMOVE && bType === MessageType.VERIFICATION_ADD_ETH_ADDRESS) {
      return 1;
    } else if (aType === MessageType.VERIFICATION_ADD_ETH_ADDRESS && bType === MessageType.VERIFICATION_REMOVE) {
      return -1;
    }

    // Compare hashes (last 4 bytes of tsHash) to break ties between messages of the same type and timestamp
    return bytesCompare(aTsHash.subarray(4), bTsHash.subarray(4));
  }

  private async getMergeConflicts(
    address: Uint8Array,
    message: VerificationAddEthAddressMessage | VerificationRemoveMessage
  ): HubAsyncResult<(VerificationAddEthAddressMessage | VerificationRemoveMessage)[]> {
    const conflicts: (VerificationAddEthAddressMessage | VerificationRemoveMessage)[] = [];

    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      return err(tsHash.error);
    }

    // Look up the remove tsHash for this address
    const removeTsHash = await ResultAsync.fromPromise(
      this._db.get(makeVerificationRemovesKey(message.data.fid, address)),
      () => undefined
    );

    if (removeTsHash.isOk()) {
      const removeCompare = this.verificationMessageCompare(
        MessageType.VERIFICATION_REMOVE,
        removeTsHash.value,
        message.data.type,
        tsHash.value
      );
      if (removeCompare > 0) {
        return err(new HubError('bad_request.conflict', 'message conflicts with a more recent VerificationRemove'));
      } else if (removeCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing remove has a lower order than the new message, retrieve the full
        // VerificationRemove message and delete it as part of the RocksDB transaction
        const existingRemove = await getMessage<VerificationRemoveMessage>(
          this._db,
          message.data.fid,
          UserPostfix.VerificationMessage,
          removeTsHash.value
        );
        conflicts.push(existingRemove);
      }
    }

    // Look up the add tsHash for this address
    const addTsHash = await ResultAsync.fromPromise(
      this._db.get(makeVerificationAddsKey(message.data.fid, address)),
      () => undefined
    );

    if (addTsHash.isOk()) {
      const addCompare = this.verificationMessageCompare(
        MessageType.VERIFICATION_ADD_ETH_ADDRESS,
        addTsHash.value,
        message.data.type,
        tsHash.value
      );
      if (addCompare > 0) {
        return err(
          new HubError('bad_request.conflict', 'message conflicts with a more recent VerificationAddEthAddress')
        );
      } else if (addCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // VerificationAdd* message and delete it as part of the RocksDB transaction
        const existingAdd = await getMessage<VerificationAddEthAddressMessage>(
          this._db,
          message.data.fid,
          UserPostfix.VerificationMessage,
          addTsHash.value
        );
        conflicts.push(existingAdd);
      }
    }

    return ok(conflicts);
  }

  private deleteManyTransaction(
    txn: Transaction,
    messages: (VerificationAddEthAddressMessage | VerificationRemoveMessage)[]
  ): Transaction {
    for (const message of messages) {
      if (isVerificationAddEthAddressMessage(message)) {
        txn = this.deleteVerificationAddTransaction(txn, message);
      } else if (isVerificationRemoveMessage(message)) {
        txn = this.deleteVerificationRemoveTransaction(txn, message);
      }
    }
    return txn;
  }

  private putVerificationAddTransaction(txn: Transaction, message: VerificationAddEthAddressMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Put message and index by signer
    txn = putMessageTransaction(txn, message);

    // Put verificationAdds index
    txn = txn.put(
      makeVerificationAddsKey(message.data.fid, message.data.verificationAddEthAddressBody.address),
      Buffer.from(tsHash.value)
    );

    return txn;
  }

  private deleteVerificationAddTransaction(txn: Transaction, message: VerificationAddEthAddressMessage): Transaction {
    // Delete from verificationAdds
    txn = txn.del(makeVerificationAddsKey(message.data.fid, message.data.verificationAddEthAddressBody.address));

    // Delete message
    return deleteMessageTransaction(txn, message);
  }

  private putVerificationRemoveTransaction(txn: Transaction, message: VerificationRemoveMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Add to db
    txn = putMessageTransaction(txn, message);

    // Add to verificationRemoves
    txn = txn.put(
      makeVerificationRemovesKey(message.data.fid, message.data.verificationRemoveBody.address),
      Buffer.from(tsHash.value)
    );

    return txn;
  }

  private deleteVerificationRemoveTransaction(txn: Transaction, message: VerificationRemoveMessage): Transaction {
    // Delete from verificationRemoves
    txn = txn.del(makeVerificationRemovesKey(message.data.fid, message.data.verificationRemoveBody.address));

    // Delete message
    return deleteMessageTransaction(txn, message);
  }
}

export default VerificationStore;
