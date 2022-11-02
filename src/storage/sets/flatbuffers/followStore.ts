import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import { BadRequestError } from '~/utils/errors';
import MessageModel, { FID_BYTES, TRUE_VALUE } from '~/storage/flatbuffers/messageModel';
import { ResultAsync } from 'neverthrow';
import { FollowAddModel, FollowRemoveModel, RootPrefix, UserPostfix } from '~/storage/flatbuffers/types';
import { isFollowAdd, isFollowRemove } from '~/storage/flatbuffers/typeguards';
import { bytesCompare } from '~/storage/flatbuffers/utils';
import { MessageType } from '~/utils/generated/message_generated';

class FollowStore {
  private _db: RocksDB;

  constructor(db: RocksDB) {
    this._db = db;
  }

  /** RocksDB key of the form <user prefix (1 byte), fid (32 bytes), follow removes key (1 byte), user id (variable bytes)> */
  static followRemovesKey(fid: Uint8Array, user?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.FollowRemoves]),
      user ? Buffer.from(user) : new Uint8Array(),
    ]);
  }

  /** RocksDB key of the form <user prefix (1 byte), fid (32 bytes), follow adds key (1 byte), user id (variable bytes)> */
  static followAddsKey(fid: Uint8Array, user?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.FollowAdds]),
      user ? Buffer.from(user) : new Uint8Array(),
    ]);
  }

  /** RocksDB key of the form <followByUser prefix (1 byte), user id (32 bytes), fid (32 bytes), message timestamp hash (8 bytes)> */
  static followsByUserKey(user: Uint8Array, fid?: Uint8Array, tsHash?: Uint8Array): Buffer {
    const bytes = new Uint8Array(1 + FID_BYTES + (fid ? FID_BYTES : 0) + (tsHash ? tsHash.length : 0));
    bytes.set([RootPrefix.FollowsByUser], 0);
    bytes.set(user, 1 + FID_BYTES - user.length); // pad for alignment
    if (fid) {
      bytes.set(fid, 1 + FID_BYTES + FID_BYTES - fid.length); // pad fid for alignment
    }
    if (tsHash) {
      bytes.set(tsHash, 1 + FID_BYTES + FID_BYTES);
    }
    return Buffer.from(bytes);
  }

  /** Look up FollowAdd message by user */
  async getFollowAdd(fid: Uint8Array, user: Uint8Array): Promise<FollowAddModel> {
    const messageTsHash = await this._db.get(FollowStore.followAddsKey(fid, user));
    return MessageModel.get<FollowAddModel>(this._db, fid, UserPostfix.FollowMessage, messageTsHash);
  }

  /** Look up FollowRemove message by user */
  async getFollowRemove(fid: Uint8Array, user: Uint8Array): Promise<FollowRemoveModel> {
    const messageTsHash = await this._db.get(FollowStore.followRemovesKey(fid, user));
    return MessageModel.get<FollowRemoveModel>(this._db, fid, UserPostfix.FollowMessage, messageTsHash);
  }

  /** Get all FollowAdd messages for an fid */
  async getFollowAddsByUser(fid: Uint8Array): Promise<FollowAddModel[]> {
    const addsPrefix = FollowStore.followAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<FollowAddModel>(this._db, fid, UserPostfix.FollowMessage, messageKeys);
  }

  /** Get all FollowRemove messages for an fid */
  async getFollowRemovesByUser(fid: Uint8Array): Promise<FollowRemoveModel[]> {
    const removesPrefix = FollowStore.followRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(removesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<FollowRemoveModel>(this._db, fid, UserPostfix.FollowMessage, messageKeys);
  }

  /** Get all FollowAdd messages for a user */
  async getFollowsByUser(user: Uint8Array): Promise<FollowAddModel[]> {
    const byUserPostfix = FollowStore.followsByUserKey(user);
    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(byUserPostfix, { keyAsBuffer: true, values: false })) {
      const fid = Uint8Array.from(key).subarray(byUserPostfix.length, byUserPostfix.length + FID_BYTES);
      const tsHash = Uint8Array.from(key).subarray(byUserPostfix.length + FID_BYTES);
      messageKeys.push(MessageModel.primaryKey(fid, UserPostfix.FollowMessage, tsHash));
    }
    return MessageModel.getMany(this._db, messageKeys);
  }

  /** Merge a FollowAdd or FollowRemove message into the set */
  async merge(message: MessageModel): Promise<void> {
    if (isFollowRemove(message)) {
      return this.mergeRemove(message);
    }

    if (isFollowAdd(message)) {
      return this.mergeAdd(message);
    }

    throw new BadRequestError('invalid message type');
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: FollowAddModel): Promise<void> {
    // Define follow id for lookups
    const followId = message.body().user()?.fidArray() ?? new Uint8Array();

    let tsx = await this.resolveMergeConflicts(this._db.transaction(), followId, message);

    // No-op if resolveMergeConflicts did not return a transaction
    if (!tsx) return undefined;

    // Add putFollowAdd operations to the RocksDB transaction
    tsx = this.putFollowAddTransaction(tsx, message);

    // Commit the RocksDB transaction
    return this._db.commit(tsx);
  }

  private async mergeRemove(message: FollowRemoveModel): Promise<void> {
    // Define follow id for lookups
    const followId = message.body().user()?.fidArray() ?? new Uint8Array();

    let tsx = await this.resolveMergeConflicts(this._db.transaction(), followId, message);

    // No-op if resolveMergeConflicts did not return a transaction
    if (!tsx) return undefined;

    // Add putFollowRemove operations to the RocksDB transaction
    tsx = this.putFollowRemoveTransaction(tsx, message);

    // Commit the RocksDB transaction
    return this._db.commit(tsx);
  }

  private followMessageCompare(
    aType: MessageType,
    aTsHash: Uint8Array,
    bType: MessageType,
    bTsHash: Uint8Array
  ): number {
    const tsHashOrder = bytesCompare(aTsHash, bTsHash);
    if (tsHashOrder !== 0) {
      return tsHashOrder;
    }

    if (aType === MessageType.FollowRemove && bType === MessageType.FollowAdd) {
      return 1;
    } else if (aType === MessageType.FollowAdd && bType === MessageType.FollowRemove) {
      return -1;
    }

    return 0;
  }

  private async resolveMergeConflicts(
    tsx: Transaction,
    followId: Uint8Array,
    message: FollowAddModel | FollowRemoveModel
  ): Promise<Transaction | undefined> {
    // Look up the remove tsHash for this follow
    const followRemoveTsHash = await ResultAsync.fromPromise(
      this._db.get(FollowStore.followRemovesKey(message.fid(), followId)),
      () => undefined
    );

    if (followRemoveTsHash.isOk()) {
      if (
        this.followMessageCompare(
          MessageType.FollowRemove,
          followRemoveTsHash.value,
          message.type(),
          message.tsHash()
        ) >= 0
      ) {
        // If the existing remove has the same or higher order than the new message, no-op
        return undefined;
      } else {
        // If the existing remove has a lower order than the new message, retrieve the full
        // FollowRemove message and delete it as part of the RocksDB transaction
        const existingRemove = await MessageModel.get<FollowRemoveModel>(
          this._db,
          message.fid(),
          UserPostfix.FollowMessage,
          followRemoveTsHash.value
        );
        tsx = this.deleteFollowRemoveTransaction(tsx, existingRemove);
      }
    }

    // Look up the add tsHash for this follow
    const followAddTsHash = await ResultAsync.fromPromise(
      this._db.get(FollowStore.followAddsKey(message.fid(), followId)),
      () => undefined
    );

    if (followAddTsHash.isOk()) {
      if (
        this.followMessageCompare(MessageType.FollowAdd, followAddTsHash.value, message.type(), message.tsHash()) >= 0
      ) {
        // If the existing add has the same or higher order than the new message, no-op
        return undefined;
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // FollowAdd message and delete it as part of the RocksDB transaction
        const existingAdd = await MessageModel.get<FollowAddModel>(
          this._db,
          message.fid(),
          UserPostfix.FollowMessage,
          followAddTsHash.value
        );
        tsx = this.deleteFollowAddTransaction(tsx, existingAdd);
      }
    }

    return tsx;
  }

  private putFollowAddTransaction(tsx: Transaction, message: FollowAddModel): Transaction {
    // Put message and index by signer
    tsx = MessageModel.putTransaction(tsx, message);

    // Put followAdds index
    tsx = tsx.put(
      FollowStore.followAddsKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()),
      Buffer.from(message.tsHash())
    );

    // Index by user
    tsx = tsx.put(
      FollowStore.followsByUserKey(
        message.body().user()?.fidArray() ?? new Uint8Array(),
        message.fid(),
        message.tsHash()
      ),
      TRUE_VALUE
    );

    return tsx;
  }

  private deleteFollowAddTransaction(tsx: Transaction, message: FollowAddModel): Transaction {
    // Delete from user index
    tsx = tsx.del(
      FollowStore.followsByUserKey(
        message.body().user()?.fidArray() ?? new Uint8Array(),
        message.fid(),
        message.tsHash()
      )
    );

    // Delete from followAdds
    tsx = tsx.del(FollowStore.followAddsKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()));

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }

  private putFollowRemoveTransaction(tsx: Transaction, message: FollowRemoveModel): Transaction {
    // Add to db
    tsx = MessageModel.putTransaction(tsx, message);

    // Add to followRemoves
    tsx = tsx.put(
      FollowStore.followRemovesKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()),
      Buffer.from(message.tsHash())
    );

    return tsx;
  }

  private deleteFollowRemoveTransaction(tsx: Transaction, message: FollowRemoveModel): Transaction {
    // Delete from followRemoves
    tsx = tsx.del(FollowStore.followRemovesKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()));

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }
}

export default FollowStore;
