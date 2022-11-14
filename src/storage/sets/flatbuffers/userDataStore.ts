import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { ResultAsync } from 'neverthrow';
import { UserDataAddModel, UserPostfix } from '~/storage/flatbuffers/types';
import { isUserDataAdd } from '~/storage/flatbuffers/typeguards';
import { bytesCompare } from '~/storage/flatbuffers/utils';
import { UserDataType } from '~/utils/generated/message_generated';
import { HubError } from '~/utils/hubErrors';

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

  constructor(db: RocksDB) {
    this._db = db;
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

  /** Funds all UserDataAdd messages for an fid */
  async getUserDataAddsByUser(fid: Uint8Array): Promise<UserDataAddModel[]> {
    const addsPrefix = UserDataStore.userDataAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<UserDataAddModel>(this._db, fid, UserPostfix.UserDataMessage, messageKeys);
  }

  /** Merges a UserDataAdd message into the set */
  async merge(message: MessageModel): Promise<void> {
    if (isUserDataAdd(message)) {
      return this.mergeAdd(message);
    }

    throw new HubError('bad_request.validation_failure', 'invalid message type');
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: UserDataAddModel): Promise<void> {
    let tsx = await this.resolveMergeConflicts(this._db.transaction(), message);

    // No-op if resolveMergeConflicts did not return a transaction
    if (!tsx) return undefined;

    // Add putUserDataAdd operations to the RocksDB transaction
    tsx = this.putUserDataAddTransaction(tsx, message);

    // Commit the RocksDB transaction
    return this._db.commit(tsx);
  }

  private userDataMessageCompare(aTimestampHash: Uint8Array, bTimestampHash: Uint8Array): number {
    return bytesCompare(aTimestampHash, bTimestampHash);
  }

  private async resolveMergeConflicts(tsx: Transaction, message: UserDataAddModel): Promise<Transaction | undefined> {
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
