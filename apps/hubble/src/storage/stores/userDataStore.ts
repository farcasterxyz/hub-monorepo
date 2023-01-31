import * as protobufs from '@farcaster/protobufs';
import { bytesCompare, HubAsyncResult, HubError } from '@farcaster/utils';
import { err, ok, ResultAsync } from 'neverthrow';
import { getIdRegistryEventByCustodyAddress } from '~/storage/db/idRegistryEvent';
import {
  deleteMessageTransaction,
  getAllMessagesBySigner,
  getManyMessagesByFid,
  getMessage,
  getMessagesPruneIterator,
  getNextMessageToPrune,
  makeMessagePrimaryKey,
  makeTsHash,
  makeUserKey,
  putMessageTransaction,
} from '~/storage/db/message';
import { getNameRegistryEvent, putNameRegistryEventTransaction } from '~/storage/db/nameRegistryEvent';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import { UserPostfix } from '~/storage/db/types';
import SequentialMergeStore from '~/storage/stores/sequentialMergeStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { StorePruneOptions } from '~/storage/stores/types';
import { eventCompare } from '~/storage/stores/utils';

const PRUNE_SIZE_LIMIT_DEFAULT = 100;

/**
 * Generates unique keys used to store or fetch UserDataAdd messages in the UserDataAdd set index
 *
 * @param fid farcaster id of the user who created the message
 * @param dataType type of data being added
 * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<dataType?>
 */
const makeUserDataAddsKey = (fid: number, dataType?: protobufs.UserDataType): Buffer => {
  return Buffer.concat([
    makeUserKey(fid),
    Buffer.from([UserPostfix.UserDataAdds]),
    dataType ? Buffer.from([dataType]) : Buffer.from(''),
  ]);
};

/**
 * UserDataStore persists UserData messages in RocksDB using a grow-only CRDT set to guarantee
 * eventual consistency.
 *
 * A UserData entry is a key-value pair where the key can be one of a few defined types. They are
 * added and updated with UserDataAdd messages. They cannot be deleted but can be reset to a null
 * value with another UserData add message. UserDataAdd messages collide if the dataType is
 * identical for the same user. Collisions are handled with LWW rules as follows:
 *
 * 1. Highest timestamp wins
 * 2. Highest lexicographic hash wins
 *
 * UserData messages are stored ordinally in RocksDB indexed by a unique key `fid:tsHash` which
 * makes truncating a user's earliest messages easy. Indices are built to look up user data entries
 * in each user's add set. The key value entries created are:
 *
 * 1. fid:tsHash -> cast message
 * 2. fid:set:datatype -> fid:tsHash (adds set index)
 */
class UserDataStore extends SequentialMergeStore {
  private _db: RocksDB;
  private _eventHandler: StoreEventHandler;
  private _pruneSizeLimit: number;

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    super();

    this._db = db;
    this._eventHandler = eventHandler;
    this._pruneSizeLimit = options.pruneSizeLimit ?? PRUNE_SIZE_LIMIT_DEFAULT;
  }

  /**
   * Finds a UserDataAdd Message by checking the adds set index
   *
   * @param fid fid of the user who created the user data add
   * @param dataType type of UserData that was added
   * @returns the UserDataAdd Model if it exists, undefined otherwise
   */
  async getUserDataAdd(fid: number, dataType: protobufs.UserDataType): Promise<protobufs.UserDataAddMessage> {
    const addsKey = makeUserDataAddsKey(fid, dataType);
    const messageTsHash = await this._db.get(addsKey);
    return getMessage(this._db, fid, UserPostfix.UserDataMessage, messageTsHash);
  }

  /** Finds all UserDataAdd messages for an fid */
  async getUserDataAddsByFid(fid: number): Promise<protobufs.UserDataAddMessage[]> {
    const addsPrefix = makeUserDataAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return getManyMessagesByFid<protobufs.UserDataAddMessage>(this._db, fid, UserPostfix.UserDataMessage, messageKeys);
  }

  /** Returns the most recent event from the NameEventRegistry contract for an fname */
  async getNameRegistryEvent(fname: Uint8Array): Promise<protobufs.NameRegistryEvent> {
    return getNameRegistryEvent(this._db, fname);
  }

  /**
   * Merges a NameRegistryEvent storing the causally latest event at the key:
   * <name registry root prefix byte, fname>
   */
  async mergeNameRegistryEvent(event: protobufs.NameRegistryEvent): Promise<void> {
    const existingEvent = await ResultAsync.fromPromise(this.getNameRegistryEvent(event.fname), () => undefined);
    if (existingEvent.isOk() && eventCompare(existingEvent.value, event) >= 0) {
      return undefined;
    }

    let txn = this._db.transaction();
    txn = putNameRegistryEventTransaction(txn, event);

    // Record if we need to emit a revoked message
    let revokedMessage: protobufs.UserDataAddMessage | undefined;

    // When there is a NameRegistryEvent, we need to check if we need to revoke UserDataAdd messages from the
    // previous owner of the name.
    if (event.from) {
      // Check to see if the from address has an fid
      const idRegistryEvent = await ResultAsync.fromPromise(
        getIdRegistryEventByCustodyAddress(this._db, event.from),
        () => undefined
      );
      if (idRegistryEvent.isOk()) {
        const fid = idRegistryEvent.value.fid;

        // Check if this fid assigned the fname with a UserDataAdd message
        const fnameAdd = await ResultAsync.fromPromise(
          this.getUserDataAdd(fid, protobufs.UserDataType.USER_DATA_TYPE_FNAME),
          () => undefined
        );
        if (fnameAdd.isOk()) {
          revokedMessage = fnameAdd.value;
          txn = this.deleteUserDataAddTransaction(txn, revokedMessage);
        }
      }
    }

    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeNameRegistryEvent', event);

    // Emit revoke message if needed
    if (revokedMessage) {
      this._eventHandler.emit('revokeMessage', revokedMessage);
    }
  }

  /** Merges a UserDataAdd message into the set */
  async merge(message: protobufs.Message): Promise<void> {
    if (!protobufs.isUserDataAddMessage(message)) {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }

    const mergeResult = await this.mergeSequential(message);
    if (mergeResult.isErr()) {
      throw mergeResult.error;
    }

    return mergeResult.value;
  }

  async revokeMessagesBySigner(fid: number, signer: Uint8Array): HubAsyncResult<void> {
    // Get all UserDataAdd messages signed by signer
    const userDataAdds = await getAllMessagesBySigner<protobufs.UserDataAddMessage>(
      this._db,
      fid,
      signer,
      protobufs.MessageType.MESSAGE_TYPE_USER_DATA_ADD
    );

    // Create a rocksdb transaction
    let txn = this._db.transaction();

    // Add a delete operation to the transaction for each UserDataAdd
    for (const message of userDataAdds) {
      txn = this.deleteUserDataAddTransaction(txn, message);
    }

    await this._db.commit(txn);

    // Emit a revokeMessage event for each message
    for (const message of userDataAdds) {
      this._eventHandler.emit('revokeMessage', message);
    }

    return ok(undefined);
  }

  async pruneMessages(fid: number): HubAsyncResult<void> {
    // Count number of UserDataAdd messages for this fid
    // TODO: persist this count to avoid having to retrieve it with each call
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.UserDataMessage);
    let count = 0;
    for await (const [,] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      count = count + 1;
    }

    // Calculate the number of messages that need to be pruned, based on the store's size limit
    let sizeToPrune = count - this._pruneSizeLimit;

    // Keep track of the messages that get pruned so that we can emit pruneMessage events after the transaction settles
    const messageToPrune: protobufs.UserDataAddMessage[] = [];

    // Create a rocksdb transaction to include all the mutations
    let pruneTsx = this._db.transaction();

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = getMessagesPruneIterator(this._db, fid, UserPostfix.UserDataMessage);

    const getNextResult = () => ResultAsync.fromPromise(getNextMessageToPrune(pruneIterator), () => undefined);

    // For each message in order, prune it if the store is over the size limit
    let nextMessage = await getNextResult();
    while (nextMessage.isOk() && sizeToPrune > 0) {
      const message = nextMessage.value;

      // Add a delete operation to the transaction depending on the message type
      if (protobufs.isUserDataAddMessage(message)) {
        pruneTsx = this.deleteUserDataAddTransaction(pruneTsx, message);
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
    if (protobufs.isUserDataAddMessage(message)) {
      return this.mergeDataAdd(message);
    } else {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeDataAdd(message: protobufs.UserDataAddMessage): Promise<void> {
    const mergeConflicts = await this.getMergeConflicts(message);
    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add putUserDataAdd operations to the RocksDB transaction
    txn = this.putUserDataAddTransaction(txn, message);

    // Commit the RocksDB transaction
    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message, mergeConflicts.value);
  }

  private userDataMessageCompare(aTimestampHash: Uint8Array, bTimestampHash: Uint8Array): number {
    return bytesCompare(aTimestampHash, bTimestampHash);
  }

  private async getMergeConflicts(
    message: protobufs.UserDataAddMessage
  ): HubAsyncResult<protobufs.UserDataAddMessage[]> {
    const conflicts: protobufs.UserDataAddMessage[] = [];

    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Look up the current add timestampHash for this dataType
    const addTimestampHash = await ResultAsync.fromPromise(
      this._db.get(makeUserDataAddsKey(message.data.fid, message.data.userDataBody.type)),
      () => undefined
    );

    if (addTimestampHash.isOk()) {
      const addCompare = this.userDataMessageCompare(addTimestampHash.value, tsHash.value);
      if (addCompare > 0) {
        return err(new HubError('bad_request.conflict', 'message conflicts with a more recent UserDataAdd'));
      } else if (addCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // UserDataAdd message and delete it as part of the RocksDB transaction
        const existingAdd = await getMessage<protobufs.UserDataAddMessage>(
          this._db,
          message.data.fid,
          UserPostfix.UserDataMessage,
          addTimestampHash.value
        );
        conflicts.push(existingAdd);
      }
    }

    return ok(conflicts);
  }

  private deleteManyTransaction(txn: Transaction, messages: protobufs.UserDataAddMessage[]): Transaction {
    for (const message of messages) {
      if (protobufs.isUserDataAddMessage(message)) {
        txn = this.deleteUserDataAddTransaction(txn, message);
      }
    }
    return txn;
  }

  /* Builds a RocksDB transaction to insert a UserDataAdd message and construct its indices */
  private putUserDataAddTransaction(txn: Transaction, message: protobufs.UserDataAddMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Puts the message into the database
    txn = putMessageTransaction(txn, message);

    // Puts the message key into the adds set index
    txn = txn.put(makeUserDataAddsKey(message.data.fid, message.data.userDataBody.type), Buffer.from(tsHash.value));

    return txn;
  }

  /* Builds a RocksDB transaction to remove a UserDataAdd message and delete its indices */
  private deleteUserDataAddTransaction(txn: Transaction, message: protobufs.UserDataAddMessage): Transaction {
    // Delete message key from userData adds set index
    txn = txn.del(makeUserDataAddsKey(message.data.fid, message.data.userDataBody.type));

    // Delete the message
    return deleteMessageTransaction(txn, message);
  }
}

export default UserDataStore;
