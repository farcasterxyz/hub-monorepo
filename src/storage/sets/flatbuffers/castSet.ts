import RocksDB from '~/storage/db/binaryrocksdb';
import { BadRequestError } from '~/utils/errors';
import MessageModel, { FID_BYTES, TRUE_VALUE } from '~/storage/flatbuffers/model';
import { ResultAsync } from 'neverthrow';
import { CastAddModel, CastRemoveModel, RootPrefix, UserPrefix } from '~/storage/flatbuffers/types';
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

  static castsByParentKey(parentFid: Uint8Array, parentHash: Uint8Array, fid?: Uint8Array, hash?: Uint8Array): Buffer {
    const bytes = new Uint8Array(1 + FID_BYTES + parentHash.length + (fid ? FID_BYTES : 0) + (hash ? hash.length : 0));
    bytes.set([RootPrefix.CastsByParent], 0);
    bytes.set(parentFid, 1 + FID_BYTES - parentFid.length); // pad fid for alignment
    bytes.set(parentHash, 1 + FID_BYTES);
    if (fid) {
      bytes.set(fid, 1 + FID_BYTES + parentHash.length + FID_BYTES - fid.length); // pad fid for alignment
    }
    if (hash) {
      bytes.set(hash, 1 + FID_BYTES + parentHash.length + FID_BYTES);
    }
    return Buffer.from(bytes);
  }

  static caststByMentionKey(): Buffer {
    // TODO
    return Buffer.from('');
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

  async getCastsByParent(fid: Uint8Array, hash: Uint8Array): Promise<CastAddModel[]> {
    const byParentPrefix = CastSet.castsByParentKey(fid, hash);
    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(byParentPrefix, { keyAsBuffer: true, values: false })) {
      const fid = Uint8Array.from(key).subarray(byParentPrefix.length, byParentPrefix.length + FID_BYTES);
      const hash = Uint8Array.from(key).subarray(byParentPrefix.length + FID_BYTES);
      messageKeys.push(MessageModel.primaryKey(fid, UserPrefix.CastMessage, hash));
    }
    return MessageModel.getMany(this._db, messageKeys);
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
    const castRemovesValue = await ResultAsync.fromPromise(
      this._db.get(CastSet.castRemovesKey(message.fid(), message.timestampHash())),
      () => undefined
    );
    if (castRemovesValue.isOk()) {
      return undefined;
    }

    // If cast has already been added, no-op
    const castAddsValue = await ResultAsync.fromPromise(
      this._db.get(CastSet.castAddsKey(message.fid(), message.timestampHash())),
      () => undefined
    );
    if (castAddsValue.isOk()) {
      return undefined;
    }

    // Put message and index by signer
    tsx = message.buildPutTransaction(tsx);

    // Put castAdds index
    tsx = tsx.put(CastSet.castAddsKey(message.fid(), message.timestampHash()), Buffer.from(message.timestampHash()));

    // Index by parent
    if (message.body().parent()) {
      tsx = tsx.put(
        CastSet.castsByParentKey(
          message.body().parent()?.fidArray() || new Uint8Array(),
          message.body().parent()?.hashArray() || new Uint8Array(),
          message.fid(),
          message.timestampHash()
        ),
        TRUE_VALUE
      );
    }

    // Index by mentions
    if (message.body().mentionsLength() > 0) {
      for (let i = 0; i < message.body().mentionsLength(); i++) {
        // TODO
      }
    }

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

    // If target has been added, delete it
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
