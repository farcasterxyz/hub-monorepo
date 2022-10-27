import RocksDB from '~/storage/db/binaryrocksdb';
import { BadRequestError } from '~/utils/errors';
import MessageModel from '~/storage/flatbuffers/model';
import { ResultAsync } from 'neverthrow';
import { CastAddModel, CastRemoveModel, UserPrefix } from '~/storage/flatbuffers/types';
import { isCastAdd, isCastRemove } from '~/storage/flatbuffers/typeguards';
import { bytesCompare } from '~/storage/flatbuffers/utils';

class CastSet {
  private _db: RocksDB;

  constructor(db: RocksDB) {
    this._db = db;
  }

  static castRemovesKey(fid: Uint8Array, hash?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPrefix.CastRemoves]),
      hash ? Buffer.from(hash) : new Uint8Array(),
    ]);
  }

  static castAddsKey(fid: Uint8Array, hash?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPrefix.CastAdds]),
      hash ? Buffer.from(hash) : new Uint8Array(),
    ]);
  }

  async getCastAdd(fid: Uint8Array, hash: Uint8Array): Promise<CastAddModel> {
    const messageKey = await this._db.get(CastSet.castAddsKey(fid, hash));
    return MessageModel.get<CastAddModel>(this._db, fid, UserPrefix.CastMessage, messageKey);
  }

  async getCastRemove(fid: Uint8Array, hash: Uint8Array): Promise<CastRemoveModel> {
    const messageKey = await this._db.get(CastSet.castRemovesKey(fid, hash));
    return MessageModel.get<CastRemoveModel>(this._db, fid, UserPrefix.CastMessage, messageKey);
  }

  async getCastAddsByUser(fid: Uint8Array): Promise<CastAddModel[]> {
    const castAddsPrefix = CastSet.castAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(castAddsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<CastAddModel>(this._db, fid, UserPrefix.CastMessage, messageKeys);
  }

  async getCastRemovesByUser(fid: Uint8Array): Promise<CastRemoveModel[]> {
    const castRemovesPrefix = CastSet.castRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(castRemovesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<CastRemoveModel>(this._db, fid, UserPrefix.CastMessage, messageKeys);
  }

  /* Merge a Cast into the CastSet */
  async merge(message: MessageModel): Promise<void> {
    if (isCastRemove(message)) {
      return this.mergeRemove(message);
    }

    if (isCastAdd(message)) {
      return this.mergeAdd(message);
    }

    throw new BadRequestError('invalid message type');
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: CastAddModel): Promise<void> {
    // Start rocksdb transaction
    let tsx = this._db.transaction();

    // If cast has already been removed, no-op
    const removeMessageOrder = await ResultAsync.fromPromise(
      this._db.get(CastSet.castRemovesKey(message.fid(), message.timestampHash())),
      () => undefined
    );
    if (removeMessageOrder.isOk()) {
      return undefined;
    }

    // If cast has already been added, no-op
    const addMessageOrder = await ResultAsync.fromPromise(
      this._db.get(CastSet.castAddsKey(message.fid(), message.timestampHash())),
      () => undefined
    );
    if (addMessageOrder.isOk()) {
      return undefined;
    }

    // Add to db
    tsx = message.buildPutTransaction(tsx);

    // Add to cast adds (fid!<fid>!castAdds!<cast ID> : <message timestamp hash>)
    tsx = tsx.put(CastSet.castAddsKey(message.fid(), message.timestampHash()), Buffer.from(message.timestampHash()));

    // return this._db.putCastAdd(cast);
    return this._db.commit(tsx);
  }

  private async mergeRemove(message: CastRemoveModel): Promise<void> {
    // Start rocksdb transaction
    let tsx = this._db.transaction();

    // Init cast index
    const castHash = message.body().hashArray() || new Uint8Array();

    // If target has already been removed, no-op
    const removeMessageOrder = await ResultAsync.fromPromise(
      this._db.get(CastSet.castRemovesKey(message.fid(), castHash)),
      () => undefined
    );
    if (removeMessageOrder.isOk()) {
      if (bytesCompare(removeMessageOrder.value, message.timestampHash()) > 0) {
        // No-op if existing remove timestamp hash wins
        return undefined;
      } else {
        // Otherwise delete the existing remove as part of the tsx
        tsx = tsx.del(MessageModel.primaryKey(message.fid(), UserPrefix.CastMessage, removeMessageOrder.value));
      }
    }

    // If target has been added later, no-op
    const addsKey = CastSet.castAddsKey(message.fid(), castHash);
    const addMessageOrder = await ResultAsync.fromPromise(this._db.get(addsKey), () => undefined);
    if (addMessageOrder.isOk()) {
      const messageKey = MessageModel.primaryKey(message.fid(), UserPrefix.CastMessage, addMessageOrder.value);
      tsx = tsx.del(addsKey).del(messageKey);
    }

    // Add to db
    tsx = message.buildPutTransaction(tsx);

    // Add to cast removes
    tsx = tsx.put(CastSet.castRemovesKey(message.fid(), castHash), Buffer.from(message.timestampHash()));

    return this._db.commit(tsx);
  }
}

export default CastSet;
