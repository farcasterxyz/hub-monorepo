import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { ResultAsync, ok } from 'neverthrow';
import { UserDataAddModel, UserPostfix } from '~/storage/flatbuffers/types';
import { isUserDataAdd } from '~/storage/flatbuffers/typeguards';
import { bytesCompare } from '~/storage/flatbuffers/utils';
import { MessageType, UserDataType } from '~/utils/generated/message_generated';
import { HubAsyncResult, HubError } from '~/utils/hubErrors';
import StoreEventHandler from '~/storage/sets/flatbuffers/storeEventHandler';
import NameRegistryEventModel from '~/storage/flatbuffers/nameRegistryEventModel';
import { eventCompare } from '~/utils/contractEvent';
import { NameRegistryEventType } from '~/utils/generated/nameregistry_generated';
import IdRegistryEventModel from '~/storage/flatbuffers/idRegistryEventModel';

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
class UserDataStore {
  private _db: RocksDB;
  private _eventHandler: StoreEventHandler;

  constructor(db: RocksDB, eventHandler: StoreEventHandler) {
    this._db = db;
    this._eventHandler = eventHandler;
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

    // TODO: When there is a NameRegistryEvent, we need to check if we need to revoke UserDataAdd messages that
    // reference the fname
    if (event.type() === NameRegistryEventType.NameRegistryTransfer) {
      txn = await this.revokeMessagesByNameRegistryEvent(txn, event);
    }

    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeNameRegistryEvent', event);
  }

  /** Merges a UserDataAdd message into the set */
  async merge(message: MessageModel): Promise<void> {
    if (isUserDataAdd(message)) {
      if (message.body().type() == UserDataType.Fname) {
        // For fname messages, check if the user actually owns the fname.
        const fname = new TextEncoder().encode(message.body().value() ?? '');

        // Users are allowed to set fname = '' to remove their fname, so check to see if fname is set
        // before validating the custody address
        if (fname && fname.length > 0) {
          const fid = message.fid();

          // The custody address of the fid and fname must be the same
          const fidCustodyAddress = await IdRegistryEventModel.get(this._db, fid).then((event) => event?.to());
          const fnameCustodyAddress = await NameRegistryEventModel.get(this._db, fname).then((event) => event?.to());

          if (bytesCompare(fidCustodyAddress, fnameCustodyAddress) !== 0) {
            throw new HubError(
              'bad_request.validation_failure',
              'fname custody address does not match fid custody address'
            );
          }
        }
      }
      return this.mergeDataAdd(message);
    }

    throw new HubError('bad_request.validation_failure', 'invalid message type');
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

  private async revokeMessagesByNameRegistryEvent(
    tsx: Transaction,
    event: NameRegistryEventModel
  ): Promise<Transaction> {
    const fname = event.fname();
    const prevFname = event.from();

    // Get the previous owner's UserNameAdd and delete it
    {
      // TODO: Find a way to get the fid given the `from` field of the NameRegistryEvent
      // and delete the user's fname data
      // const prevMsg = await this.getUserDataAdd(from, UserDataType.Fname);
      // tsx = this.deleteUserDataAddTransaction(tsx, prevMsg);
    }

    return tsx;
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
