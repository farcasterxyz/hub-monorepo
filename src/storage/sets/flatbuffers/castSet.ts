import RocksDB from '~/storage/db/binaryrocksdb';
import { BadRequestError } from '~/utils/errors';
import MessageModel from '~/storage/flatbuffers/model';
import { ResultAsync } from 'neverthrow';
import { CastAddModel, CastRemoveModel, RocksDBPrefix } from '~/storage/flatbuffers/types';
import { isCastAdd, isCastRemove } from '~/storage/flatbuffers/typeguards';
import { bytesCompare } from '~/storage/flatbuffers/utils';

class CastSet {
  private _db: RocksDB;

  constructor(db: RocksDB) {
    this._db = db;
  }

  static castRemovesKey(fid: Uint8Array, hash: Uint8Array): Buffer {
    return Buffer.concat([
      new Uint8Array([RocksDBPrefix.User]),
      fid,
      new Uint8Array([RocksDBPrefix.CastRemoves]),
      hash,
    ]);
  }

  static castAddsKey(fid: Uint8Array, hash: Uint8Array): Buffer {
    return Buffer.concat([new Uint8Array([RocksDBPrefix.User]), fid, new Uint8Array([RocksDBPrefix.CastAdds]), hash]);
  }

  async getCastAdd(fid: Uint8Array, hash: Uint8Array): Promise<CastAddModel> {
    const messageKey = await this._db.get(CastSet.castAddsKey(fid, hash));
    return MessageModel.get<CastAddModel>(this._db, fid, messageKey);
  }

  async getCastRemove(fid: Uint8Array, hash: Uint8Array): Promise<CastRemoveModel> {
    const messageKey = await this._db.get(CastSet.castRemovesKey(fid, hash));
    return MessageModel.get<CastRemoveModel>(this._db, fid, messageKey);
  }

  // /** Get all Casts in a user's add set */
  // async getCastsByUser(fid: number): Promise<Set<CastAdd>> {
  //   const casts = await this._db.getCastAddsByUser(fid);
  //   return new Set(casts);
  // }

  // /* Get all Casts in a user's add and remove sets */
  // async getAllCastsByUser(fid: number): Promise<Set<Cast>> {
  //   const casts = await this._db.getAllCastMessagesByUser(fid);
  //   return new Set(casts);
  // }

  // /* Delete all Casts created by a Signer */
  // async revokeSigner(fid: number, signer: string): Promise<void> {
  //   return this._db.deleteAllCastMessagesBySigner(fid, signer);
  // }

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
    tsx = tsx.put(MessageModel.primaryKey(message.fid(), message.timestampHash()), message.toBuffer());

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
        tsx = tsx.del(MessageModel.primaryKey(message.fid(), removeMessageOrder.value));
      }
    }

    // If target has been added later, no-op
    const addsKey = CastSet.castAddsKey(message.fid(), castHash);
    const addMessageOrder = await ResultAsync.fromPromise(this._db.get(addsKey), () => undefined);
    if (addMessageOrder.isOk()) {
      const messageKey = MessageModel.primaryKey(message.fid(), addMessageOrder.value);
      tsx = tsx.del(addsKey).del(messageKey);
    }

    // Add to db
    tsx = tsx.put(MessageModel.primaryKey(message.fid(), message.timestampHash()), message.toBuffer());

    // Add to cast removes
    tsx = tsx.put(CastSet.castRemovesKey(message.fid(), castHash), Buffer.from(message.timestampHash()));

    return this._db.commit(tsx);
  }
}

export default CastSet;
