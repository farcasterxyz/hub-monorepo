import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import { BadRequestError } from '~/utils/errors';
import MessageModel from '~/storage/flatbuffers/model';
import { ResultAsync } from 'neverthrow';
import { UserDataAddModel, UserPrefix } from '~/storage/flatbuffers/types';
import { isUserDataAdd } from '~/storage/flatbuffers/typeguards';
import { bytesCompare } from '~/storage/flatbuffers/utils';
import { UserDataType } from '~/utils/generated/message_generated';

class UserDataSet {
  private _db: RocksDB;

  constructor(db: RocksDB) {
    this._db = db;
  }

  /** RocksDB key of the form <user prefix (1 byte), fid (32 bytes), user data adds key (1 byte), user data type (2 bytes)> */
  static userDataAddsKey(fid: Uint8Array, dataType?: UserDataType): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPrefix.UserDataAdds]),
      dataType ? Buffer.from(new Uint16Array([dataType])) : new Uint8Array(),
    ]);
  }

  /** Look up UserDataAdd message by fid and type */
  async getUserDataAdd(fid: Uint8Array, dataType: UserDataType): Promise<UserDataAddModel> {
    const messageTimestampHash = await this._db.get(UserDataSet.userDataAddsKey(fid, dataType));
    return MessageModel.get<UserDataAddModel>(this._db, fid, UserPrefix.UserDataMessage, messageTimestampHash);
  }

  /** Get all UserDataAdd messages for an fid */
  async getUserDataAddsByUser(fid: Uint8Array): Promise<UserDataAddModel[]> {
    const addsPrefix = UserDataSet.userDataAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<UserDataAddModel>(this._db, fid, UserPrefix.UserDataMessage, messageKeys);
  }

  /** Merge a UserDataAdd message into the set */
  async merge(message: MessageModel): Promise<void> {
    if (isUserDataAdd(message)) {
      return this.mergeAdd(message);
    }

    throw new BadRequestError('invalid message type');
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
      this._db.get(UserDataSet.userDataAddsKey(message.fid(), message.body().type())),
      () => undefined
    );

    if (addTimestampHash.isOk()) {
      if (this.userDataMessageCompare(addTimestampHash.value, message.timestampHash()) >= 0) {
        // If the existing add has the same or higher order than the new message, no-op
        return undefined;
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // UserDataAdd message and delete it as part of the RocksDB transaction
        const existingAdd = await MessageModel.get<UserDataAddModel>(
          this._db,
          message.fid(),
          UserPrefix.UserDataMessage,
          addTimestampHash.value
        );
        tsx = this.deleteUserDataAddTransaction(tsx, existingAdd);
      }
    }

    return tsx;
  }

  private putUserDataAddTransaction(tsx: Transaction, message: UserDataAddModel): Transaction {
    // Put message and index by signer
    tsx = MessageModel.putTransaction(tsx, message);

    // Put userDataAdds index
    tsx = tsx.put(
      UserDataSet.userDataAddsKey(message.fid(), message.body().type()),
      Buffer.from(message.timestampHash())
    );

    return tsx;
  }

  private deleteUserDataAddTransaction(tsx: Transaction, message: UserDataAddModel): Transaction {
    // Delete from userDataAdds
    tsx = tsx.del(UserDataSet.userDataAddsKey(message.fid(), message.body().type()));

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }
}

export default UserDataSet;
