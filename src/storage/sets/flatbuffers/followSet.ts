import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import { BadRequestError } from '~/utils/errors';
import MessageModel, { FID_BYTES, TRUE_VALUE } from '~/storage/flatbuffers/messageModel';
import { ResultAsync } from 'neverthrow';
import { FollowAddModel, FollowRemoveModel, RootPrefix, UserPrefix } from '~/storage/flatbuffers/types';
import { isFollowAdd, isFollowRemove } from '~/storage/flatbuffers/typeguards';
import { bytesCompare } from '~/storage/flatbuffers/utils';
import { MessageType } from '~/utils/generated/message_generated';

class FollowSet {
  private _db: RocksDB;

  constructor(db: RocksDB) {
    this._db = db;
  }

  /** RocksDB key of the form <user prefix (1 byte), fid (32 bytes), follow removes key (1 byte), user id (variable bytes)> */
  static followRemovesKey(fid: Uint8Array, user?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPrefix.FollowRemoves]),
      user ? Buffer.from(user) : new Uint8Array(),
    ]);
  }

  /** RocksDB key of the form <user prefix (1 byte), fid (32 bytes), follow adds key (1 byte), user id (variable bytes)> */
  static followAddsKey(fid: Uint8Array, user?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPrefix.FollowAdds]),
      user ? Buffer.from(user) : new Uint8Array(),
    ]);
  }

  /** RocksDB key of the form <followByUser prefix (1 byte), user id (32 bytes), fid (32 bytes), message timestamp hash (8 bytes)> */
  static followsByUserKey(user: Uint8Array, fid?: Uint8Array, hash?: Uint8Array): Buffer {
    const bytes = new Uint8Array(1 + FID_BYTES + (fid ? FID_BYTES : 0) + (hash ? hash.length : 0));
    bytes.set([RootPrefix.FollowsByUser], 0);
    bytes.set(user, 1 + FID_BYTES - user.length); // pad for alignment
    if (fid) {
      bytes.set(fid, 1 + FID_BYTES + FID_BYTES - fid.length); // pad fid for alignment
    }
    if (hash) {
      bytes.set(hash, 1 + FID_BYTES + FID_BYTES);
    }
    return Buffer.from(bytes);
  }

  /** Look up FollowAdd message by user */
  async getFollowAdd(fid: Uint8Array, user: Uint8Array): Promise<FollowAddModel> {
    const messageTimestampHash = await this._db.get(FollowSet.followAddsKey(fid, user));
    return MessageModel.get<FollowAddModel>(this._db, fid, UserPrefix.FollowMessage, messageTimestampHash);
  }

  /** Look up FollowRemove message by user */
  async getFollowRemove(fid: Uint8Array, user: Uint8Array): Promise<FollowRemoveModel> {
    const messageTimestampHash = await this._db.get(FollowSet.followRemovesKey(fid, user));
    return MessageModel.get<FollowRemoveModel>(this._db, fid, UserPrefix.FollowMessage, messageTimestampHash);
  }

  /** Get all FollowAdd messages for an fid */
  async getFollowAddsByUser(fid: Uint8Array): Promise<FollowAddModel[]> {
    const addsPrefix = FollowSet.followAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<FollowAddModel>(this._db, fid, UserPrefix.FollowMessage, messageKeys);
  }

  /** Get all FollowRemove messages for an fid */
  async getFollowRemovesByUser(fid: Uint8Array): Promise<FollowRemoveModel[]> {
    const removesPrefix = FollowSet.followRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(removesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<FollowRemoveModel>(this._db, fid, UserPrefix.FollowMessage, messageKeys);
  }

  /** Get all FollowAdd messages for a user */
  async getFollowsByUser(user: Uint8Array): Promise<FollowAddModel[]> {
    const byUserPrefix = FollowSet.followsByUserKey(user);
    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(byUserPrefix, { keyAsBuffer: true, values: false })) {
      const fid = Uint8Array.from(key).subarray(byUserPrefix.length, byUserPrefix.length + FID_BYTES);
      const timestampHash = Uint8Array.from(key).subarray(byUserPrefix.length + FID_BYTES);
      messageKeys.push(MessageModel.primaryKey(fid, UserPrefix.FollowMessage, timestampHash));
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
    aTimestampHash: Uint8Array,
    bType: MessageType,
    bTimestampHash: Uint8Array
  ): number {
    const timestampHashOrder = bytesCompare(aTimestampHash, bTimestampHash);
    if (timestampHashOrder !== 0) {
      return timestampHashOrder;
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
    // Look up the remove timestampHash for this follow
    const followRemoveTimestampHash = await ResultAsync.fromPromise(
      this._db.get(FollowSet.followRemovesKey(message.fid(), followId)),
      () => undefined
    );

    if (followRemoveTimestampHash.isOk()) {
      if (
        this.followMessageCompare(
          MessageType.FollowRemove,
          followRemoveTimestampHash.value,
          message.type(),
          message.timestampHash()
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
          UserPrefix.FollowMessage,
          followRemoveTimestampHash.value
        );
        tsx = this.deleteFollowRemoveTransaction(tsx, existingRemove);
      }
    }

    // Look up the add timestampHash for this follow
    const followAddTimestampHash = await ResultAsync.fromPromise(
      this._db.get(FollowSet.followAddsKey(message.fid(), followId)),
      () => undefined
    );

    if (followAddTimestampHash.isOk()) {
      if (
        this.followMessageCompare(
          MessageType.FollowAdd,
          followAddTimestampHash.value,
          message.type(),
          message.timestampHash()
        ) >= 0
      ) {
        // If the existing add has the same or higher order than the new message, no-op
        return undefined;
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // FollowAdd message and delete it as part of the RocksDB transaction
        const existingAdd = await MessageModel.get<FollowAddModel>(
          this._db,
          message.fid(),
          UserPrefix.FollowMessage,
          followAddTimestampHash.value
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
      FollowSet.followAddsKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()),
      Buffer.from(message.timestampHash())
    );

    // Index by user
    tsx = tsx.put(
      FollowSet.followsByUserKey(
        message.body().user()?.fidArray() ?? new Uint8Array(),
        message.fid(),
        message.timestampHash()
      ),
      TRUE_VALUE
    );

    return tsx;
  }

  private deleteFollowAddTransaction(tsx: Transaction, message: FollowAddModel): Transaction {
    // Delete from user index
    tsx = tsx.del(
      FollowSet.followsByUserKey(
        message.body().user()?.fidArray() ?? new Uint8Array(),
        message.fid(),
        message.timestampHash()
      )
    );

    // Delete from followAdds
    tsx = tsx.del(FollowSet.followAddsKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()));

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }

  private putFollowRemoveTransaction(tsx: Transaction, message: FollowRemoveModel): Transaction {
    // Add to db
    tsx = MessageModel.putTransaction(tsx, message);

    // Add to followRemoves
    tsx = tsx.put(
      FollowSet.followRemovesKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()),
      Buffer.from(message.timestampHash())
    );

    return tsx;
  }

  private deleteFollowRemoveTransaction(tsx: Transaction, message: FollowRemoveModel): Transaction {
    // Delete from followRemoves
    tsx = tsx.del(FollowSet.followRemovesKey(message.fid(), message.body().user()?.fidArray() ?? new Uint8Array()));

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }
}

export default FollowSet;
