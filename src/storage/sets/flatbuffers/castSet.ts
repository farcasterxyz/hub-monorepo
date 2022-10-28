import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
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

  /** RocksDB key of the form <user prefix byte, fid, cast removes byte, cast hash> */
  static castRemovesKey(fid: Uint8Array, hash?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPrefix.CastRemoves]),
      hash ? Buffer.from(hash) : new Uint8Array(),
    ]);
  }

  /** RocksDB key of the form <user prefix byte, fid, cast adds byte, cast hash> */
  static castAddsKey(fid: Uint8Array, hash?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPrefix.CastAdds]),
      hash ? Buffer.from(hash) : new Uint8Array(),
    ]);
  }

  // TODO: make parentFid and parentHash fixed size
  /** RocksDB key of the form <castsByParent prefix byte, parent fid, parent cast hash, fid, cast hash> */
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

  // TODO: make parentFid and parentHash fixed size
  /** RocksDB key of the form <castsByMention prefix byte, mention fid, fid, cast hash> */
  static caststByMentionKey(mentionFid: Uint8Array, fid?: Uint8Array, hash?: Uint8Array): Buffer {
    const bytes = new Uint8Array(1 + FID_BYTES + (fid ? FID_BYTES : 0) + (hash ? hash.length : 0));
    bytes.set([RootPrefix.CastsByMention], 0);
    bytes.set(mentionFid, 1 + FID_BYTES - mentionFid.length); // pad fid for alignment
    if (fid) {
      bytes.set(fid, 1 + FID_BYTES + FID_BYTES - fid.length); // pad fid for alignment
    }
    if (hash) {
      bytes.set(hash, 1 + FID_BYTES + FID_BYTES);
    }
    return Buffer.from(bytes);
  }

  /** Look up CastAdd message by cast hash */
  async getCastAdd(fid: Uint8Array, hash: Uint8Array): Promise<CastAddModel> {
    const messageTimestampHash = await this._db.get(CastSet.castAddsKey(fid, hash));
    return MessageModel.get<CastAddModel>(this._db, fid, UserPrefix.CastMessage, messageTimestampHash);
  }

  /** Look up CastRemove message by cast hash */
  async getCastRemove(fid: Uint8Array, hash: Uint8Array): Promise<CastRemoveModel> {
    const messageTimestampHash = await this._db.get(CastSet.castRemovesKey(fid, hash));
    return MessageModel.get<CastRemoveModel>(this._db, fid, UserPrefix.CastMessage, messageTimestampHash);
  }

  /** Get all CastAdd messages for an fid */
  async getCastAddsByUser(fid: Uint8Array): Promise<CastAddModel[]> {
    const castAddsPrefix = CastSet.castAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(castAddsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<CastAddModel>(this._db, fid, UserPrefix.CastMessage, messageKeys);
  }

  /** Get all CastRemove messages for an fid */
  async getCastRemovesByUser(fid: Uint8Array): Promise<CastRemoveModel[]> {
    const castRemovesPrefix = CastSet.castRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(castRemovesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<CastRemoveModel>(this._db, fid, UserPrefix.CastMessage, messageKeys);
  }

  /** Get all CastAdd messages for a parent cast (fid and hash) */
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

  /** Get all CastAdd messages for a mention (fid) */
  async getCastsByMention(fid: Uint8Array): Promise<CastAddModel[]> {
    const byMentionPrefix = CastSet.caststByMentionKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(byMentionPrefix, { keyAsBuffer: true, values: false })) {
      const fid = Uint8Array.from(key).subarray(byMentionPrefix.length, byMentionPrefix.length + FID_BYTES);
      const hash = Uint8Array.from(key).subarray(byMentionPrefix.length + FID_BYTES);
      messageKeys.push(MessageModel.primaryKey(fid, UserPrefix.CastMessage, hash));
    }
    return MessageModel.getMany(this._db, messageKeys);
  }

  /** Merge a CastAdd or CastRemove message into the set */
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
    // Start RocksDB transaction
    let tsx = this._db.transaction();

    // Look up the remove timestampHash for this cast
    const castRemoveTimestampHash = await ResultAsync.fromPromise(
      this._db.get(CastSet.castRemovesKey(message.fid(), message.timestampHash())),
      () => undefined
    );

    // If remove timestampHash exists, no-op because this cast has already been removed
    if (castRemoveTimestampHash.isOk()) {
      return undefined;
    }

    // Look up the add timestampHash for this cast
    const castAddTimestampHash = await ResultAsync.fromPromise(
      this._db.get(CastSet.castAddsKey(message.fid(), message.timestampHash())),
      () => undefined
    );

    // If add timestampHash exists, no-op because this cast has already been added
    if (castAddTimestampHash.isOk()) {
      return undefined;
    }

    // Add putCastAdd operations to the RocksDB transaction
    tsx = this.putCastAddTransaction(tsx, message);

    // Commit the RocksDB transaction
    return this._db.commit(tsx);
  }

  private async mergeRemove(message: CastRemoveModel): Promise<void> {
    // Start RocksDB transaction
    let tsx = this._db.transaction();

    // Define cast hash for lookups
    const castHash = message.body().hashArray() ?? new Uint8Array();

    // Look up the remove timestampHash for this cast
    const castRemoveTimestampHash = await ResultAsync.fromPromise(
      this._db.get(CastSet.castRemovesKey(message.fid(), castHash)),
      () => undefined
    );

    if (castRemoveTimestampHash.isOk()) {
      if (bytesCompare(castRemoveTimestampHash.value, message.timestampHash()) >= 0) {
        // If the remove timestampHash exists and has the same or higher order than the new CastRemove
        // timestampHash, no-op because this cast has been removed by a more recent message
        return undefined;
      } else {
        // If the remove timestampHash exists but with a lower order than the new CastRemove
        // timestampHash, retrieve the full CastRemove message and delete it as part of the
        // RocksDB transaction
        const existingRemove = await MessageModel.get<CastRemoveModel>(
          this._db,
          message.fid(),
          UserPrefix.CastMessage,
          castRemoveTimestampHash.value
        );
        tsx = this.deleteCastRemoveTransaction(tsx, existingRemove);
      }
    }

    // Look up the add timestampHash for this cast
    const castAddTimestampHash = await ResultAsync.fromPromise(
      this._db.get(CastSet.castAddsKey(message.fid(), castHash)),
      () => undefined
    );

    // If the add timestampHash exists, retrieve the full CastAdd message and delete it as
    // part of the RocksDB transaction
    if (castAddTimestampHash.isOk()) {
      const existingAdd = await MessageModel.get<CastAddModel>(
        this._db,
        message.fid(),
        UserPrefix.CastMessage,
        castAddTimestampHash.value
      );
      tsx = await this.deleteCastAddTransaction(tsx, existingAdd);
    }

    // Add putCastRemove operations to the RocksDB transaction
    tsx = this.putCastRemoveTransaction(tsx, message);

    // Commit the RocksDB transaction
    return this._db.commit(tsx);
  }

  private putCastAddTransaction(tsx: Transaction, message: CastAddModel): Transaction {
    // Put message and index by signer
    tsx = MessageModel.putTransaction(tsx, message);

    // Put castAdds index
    tsx = tsx.put(CastSet.castAddsKey(message.fid(), message.timestampHash()), Buffer.from(message.timestampHash()));

    // Index by parent
    if (message.body().parent()) {
      tsx = tsx.put(
        CastSet.castsByParentKey(
          message.body().parent()?.fidArray() ?? new Uint8Array(),
          message.body().parent()?.hashArray() ?? new Uint8Array(),
          message.fid(),
          message.timestampHash()
        ),
        TRUE_VALUE
      );
    }

    // Index by mentions
    if (message.body().mentionsLength() > 0) {
      for (let i = 0; i < message.body().mentionsLength(); i++) {
        const mention = message.body().mentions(i);
        tsx = tsx.put(
          CastSet.caststByMentionKey(mention?.fidArray() ?? new Uint8Array(), message.fid(), message.timestampHash()),
          TRUE_VALUE
        );
      }
    }

    return tsx;
  }

  private deleteCastAddTransaction(tsx: Transaction, message: CastAddModel): Transaction {
    // Delete from mentions index
    if (message.body().mentionsLength() > 0) {
      for (let i = 0; i < message.body().mentionsLength(); i++) {
        const mention = message.body().mentions(i);
        tsx = tsx.del(
          CastSet.caststByMentionKey(mention?.fidArray() ?? new Uint8Array(), message.fid(), message.timestampHash())
        );
      }
    }

    // Delete from parent index
    if (message.body().parent()) {
      tsx = tsx.del(
        CastSet.castsByParentKey(
          message.body().parent()?.fidArray() ?? new Uint8Array(),
          message.body().parent()?.hashArray() ?? new Uint8Array(),
          message.fid(),
          message.timestampHash()
        )
      );
    }

    // Delete from castAdds
    tsx = tsx.del(CastSet.castAddsKey(message.fid(), message.timestampHash()));

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }

  private putCastRemoveTransaction(tsx: Transaction, message: CastRemoveModel): Transaction {
    // Add to db
    tsx = MessageModel.putTransaction(tsx, message);

    // Add to cast removes
    tsx = tsx.put(
      CastSet.castRemovesKey(message.fid(), message.body().hashArray() ?? new Uint8Array()),
      Buffer.from(message.timestampHash())
    );

    return tsx;
  }

  private deleteCastRemoveTransaction(tsx: Transaction, message: CastRemoveModel): Transaction {
    // Delete from cast removes
    tsx = tsx.del(CastSet.castRemovesKey(message.fid(), message.body().hashArray() ?? new Uint8Array()));

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }
}

export default CastSet;
