import { MessageType, NameRegistryEventType, UserDataType } from '@farcaster/flatbuffers';
import { bytesCompare, HubAsyncResult, HubError } from '@farcaster/utils';
import { ok, ResultAsync } from 'neverthrow';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import { isUserDataAdd } from '~/flatbuffers/models/typeguards';
import { StorePruneOptions, UserDataAddModel, UserPostfix } from '~/flatbuffers/models/types';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { eventCompare } from '~/utils/contractEvent';
import SequentialMergeStore from './sequentialMergeStore';

const PRUNE_SIZE_LIMIT_DEFAULT = 100;

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
   * Generates unique keys used to store or fetch UserDataAdd messages in the UserDataAdd set index
   *
   * @param fid farcaster id of the user who created the message
   * @param dataType type of data being added
   * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<dataType?>
   */
  static userDataAddsKey(fid: Uint8Array, dataType?: UserDataType): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.UserDataAdds]),
      dataType ? Buffer.from(new Uint16Array([dataType])) : new Uint8Array(),
    ]);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Instance Methods                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Finds a UserDataAdd Message by checking the adds set index
   *
   * @param fid fid of the user who created the user data add
   * @param dataType type of UserData that was added
   * @returns the UserDataAdd Model if it exists, undefined otherwise
   */
  async getUserDataAdd(fid: Uint8Array, dataType: UserDataType): Promise<UserDataAddModel> {
    const messageTimestampHash = await this._db.get(UserDataStore.userDataAddsKey(fid, dataType));
    return MessageModel.get<UserDataAddModel>(this._db, fid, UserPostfix.UserDataMessage, messageTimestampHash);
  }

  /** Finds all UserDataAdd messages for an fid */
  async getUserDataAddsByUser(fid: Uint8Array): Promise<UserDataAddModel[]> {
    const addsPrefix = UserDataStore.userDataAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<UserDataAddModel>(this._db, fid, UserPostfix.UserDataMessage, messageKeys);
  }

  /** Returns the most recent event from the NameEventRegistry contract that affected the fid */
  async getNameRegistryEvent(fname: Uint8Array): Promise<NameRegistryEventModel> {
    return NameRegistryEventModel.get(this._db, fname);
  }

  /**
   * Merges a NameRegistryEvent storing the causally latest event at the key:
   * <name registry root prefix byte, fname>
   */
  async mergeNameRegistryEvent(event: NameRegistryEventModel): Promise<void> {
    const existingEvent = await ResultAsync.fromPromise(this.getNameRegistryEvent(event.fname()), () => undefined);
    if (existingEvent.isOk() && eventCompare(existingEvent.value, event) >= 0) {
      return undefined;
    }

    let txn = this._db.transaction();
    txn.put(event.primaryKey(), event.toBuffer());

    // Record if we need to emit a revoked message
    let revokedMessage: UserDataAddModel | undefined;
    if (event.type() === NameRegistryEventType.NameRegistryTransfer) {
      // When there is a NameRegistryEvent, we need to check if we need to revoke UserDataAdd messages from the
      // previous owner of the name.
      const prevFnameOwnerCustodyAddress = event.from();

      // Get the previous owner's UserNameAdd and delete it
      const prevEvent = await ResultAsync.fromPromise(
        IdRegistryEventModel.getByCustodyAddress(this._db, prevFnameOwnerCustodyAddress),
        () => undefined
      );
      if (prevEvent.isOk()) {
        const fid = prevEvent.value.fid();
        const prevMsg = await ResultAsync.fromPromise(this.getUserDataAdd(fid, UserDataType.Fname), () => undefined);
        if (prevMsg.isOk()) {
          revokedMessage = prevMsg.value;
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
  async merge(message: MessageModel): Promise<void> {
    if (!isUserDataAdd(message)) {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }

    const mergeResult = await this.mergeSequential(message);
    if (mergeResult.isErr()) {
      throw mergeResult.error;
    }

    return mergeResult.value;
  }

  async revokeMessagesBySigner(fid: Uint8Array, signer: Uint8Array): HubAsyncResult<void> {
    // Get all UserDataAdd messages signed by signer
    const userDataAdds = await MessageModel.getAllBySigner<UserDataAddModel>(
      this._db,
      fid,
      signer,
      MessageType.UserDataAdd
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

  async pruneMessages(fid: Uint8Array): HubAsyncResult<void> {
    // Count number of UserDataAdd messages for this fid
    // TODO: persist this count to avoid having to retrieve it with each call
    const prefix = MessageModel.primaryKey(fid, UserPostfix.UserDataMessage);
    let count = 0;
    for await (const [,] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      count = count + 1;
    }

    // Calculate the number of messages that need to be pruned, based on the store's size limit
    let sizeToPrune = count - this._pruneSizeLimit;

    // Keep track of the messages that get pruned so that we can emit pruneMessage events after the transaction settles
    const messageToPrune: UserDataAddModel[] = [];

    // Create a rocksdb transaction to include all the mutations
    let pruneTsx = this._db.transaction();

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = MessageModel.getPruneIterator(this._db, fid, UserPostfix.UserDataMessage);

    const getNextResult = () => ResultAsync.fromPromise(MessageModel.getNextToPrune(pruneIterator), () => undefined);

    // For each message in order, prune it if the store is over the size limit
    let nextMessage = await getNextResult();
    while (nextMessage.isOk() && sizeToPrune > 0) {
      const message = nextMessage.value;

      // Add a delete operation to the transaction depending on the message type
      if (isUserDataAdd(message)) {
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

  protected async mergeFromSequentialQueue(message: MessageModel): Promise<void> {
    if (isUserDataAdd(message)) {
      return this.mergeDataAdd(message);
    } else {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeDataAdd(message: UserDataAddModel): Promise<void> {
    let tsx = await this.resolveUserDataMergeConflicts(this._db.transaction(), message);

    // No-op if resolveMergeConflicts did not return a transaction
    if (!tsx) return undefined;

    // Add putUserDataAdd operations to the RocksDB transaction
    tsx = this.putUserDataAddTransaction(tsx, message);

    // Commit the RocksDB transaction
    await this._db.commit(tsx);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message);
  }

  private userDataMessageCompare(aTimestampHash: Uint8Array, bTimestampHash: Uint8Array): number {
    return bytesCompare(aTimestampHash, bTimestampHash);
  }

  private async resolveUserDataMergeConflicts(
    tsx: Transaction,
    message: UserDataAddModel
  ): Promise<Transaction | undefined> {
    // Look up the current add timestampHash for this dataType
    const addTimestampHash = await ResultAsync.fromPromise(
      this._db.get(UserDataStore.userDataAddsKey(message.fid(), message.body().type())),
      () => undefined
    );

    if (addTimestampHash.isOk()) {
      if (this.userDataMessageCompare(addTimestampHash.value, message.tsHash()) >= 0) {
        // If the existing add has the same or higher order than the new message, no-op
        return undefined;
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // UserDataAdd message and delete it as part of the RocksDB transaction
        const existingAdd = await MessageModel.get<UserDataAddModel>(
          this._db,
          message.fid(),
          UserPostfix.UserDataMessage,
          addTimestampHash.value
        );
        tsx = this.deleteUserDataAddTransaction(tsx, existingAdd);
      }
    }

    return tsx;
  }

  /* Builds a RocksDB transaction to insert a UserDataAdd message and construct its indices */
  private putUserDataAddTransaction(tsx: Transaction, message: UserDataAddModel): Transaction {
    // Puts the message into the database
    tsx = MessageModel.putTransaction(tsx, message);

    // Puts the message key into the adds set index
    tsx = tsx.put(UserDataStore.userDataAddsKey(message.fid(), message.body().type()), Buffer.from(message.tsHash()));

    return tsx;
  }

  /* Builds a RocksDB transaction to remove a UserDataAdd message and delete its indices */
  private deleteUserDataAddTransaction(tsx: Transaction, message: UserDataAddModel): Transaction {
    // Delete message key from userData adds set index
    tsx = tsx.del(UserDataStore.userDataAddsKey(message.fid(), message.body().type()));

    // Delete the message
    return MessageModel.deleteTransaction(tsx, message);
  }
}

export default UserDataStore;
