import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import { BadRequestError } from '~/utils/errors';
import MessageModel, { FID_BYTES, TRUE_VALUE } from '~/storage/flatbuffers/messageModel';
import { ResultAsync } from 'neverthrow';
import { CastAddModel, CastRemoveModel, RootPrefix, UserPostfix } from '~/storage/flatbuffers/types';
import { isCastAdd, isCastRemove } from '~/storage/flatbuffers/typeguards';
import { bytesCompare } from '~/storage/flatbuffers/utils';

class CastStore {
  private _db: RocksDB;

  constructor(db: RocksDB) {
    this._db = db;
  }

  /** RocksDB key of the form <user prefix byte, fid, cast removes byte, cast tsHash> */
  static castRemovesKey(fid: Uint8Array, tsHash?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.CastRemoves]),
      tsHash ? Buffer.from(tsHash) : new Uint8Array(),
    ]);
  }

  /** RocksDB key of the form <user prefix byte, fid, cast adds byte, cast tsHash> */
  static castAddsKey(fid: Uint8Array, tsHash?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.CastAdds]),
      tsHash ? Buffer.from(tsHash) : new Uint8Array(),
    ]);
  }

  // TODO: make parentFid and parentHash fixed size
  /** RocksDB key of the form <castsByParent prefix byte, parent fid, parent cast tsHash, fid, cast tsHash> */
  static castsByParentKey(
    parentFid: Uint8Array,
    parentTsHash: Uint8Array,
    fid?: Uint8Array,
    hash?: Uint8Array
  ): Buffer {
    const bytes = new Uint8Array(
      1 + FID_BYTES + parentTsHash.length + (fid ? FID_BYTES : 0) + (hash ? hash.length : 0)
    );
    bytes.set([RootPrefix.CastsByParent], 0);
    bytes.set(parentFid, 1 + FID_BYTES - parentFid.length); // pad fid for alignment
    bytes.set(parentTsHash, 1 + FID_BYTES);
    if (fid) {
      bytes.set(fid, 1 + FID_BYTES + parentTsHash.length + FID_BYTES - fid.length); // pad fid for alignment
    }
    if (hash) {
      bytes.set(hash, 1 + FID_BYTES + parentTsHash.length + FID_BYTES);
    }
    return Buffer.from(bytes);
  }

  // TODO: make parentFid and parentTsHash fixed size
  /** RocksDB key of the form <castsByMention prefix byte, mention fid, fid, cast tsHash> */
  static castsByMentionKey(mentionFid: Uint8Array, fid?: Uint8Array, tsHash?: Uint8Array): Buffer {
    const bytes = new Uint8Array(1 + FID_BYTES + (fid ? FID_BYTES : 0) + (tsHash ? tsHash.length : 0));
    bytes.set([RootPrefix.CastsByMention], 0);
    bytes.set(mentionFid, 1 + FID_BYTES - mentionFid.length); // pad fid for alignment
    if (fid) {
      bytes.set(fid, 1 + FID_BYTES + FID_BYTES - fid.length); // pad fid for alignment
    }
    if (tsHash) {
      bytes.set(tsHash, 1 + FID_BYTES + FID_BYTES);
    }
    return Buffer.from(bytes);
  }

  /** Look up CastAdd message by cast tsHash */
  async getCastAdd(fid: Uint8Array, tsHash: Uint8Array): Promise<CastAddModel> {
    const messageTsHash = await this._db.get(CastStore.castAddsKey(fid, tsHash));
    return MessageModel.get<CastAddModel>(this._db, fid, UserPostfix.CastMessage, messageTsHash);
  }

  /** Look up CastRemove message by cast tsHash */
  async getCastRemove(fid: Uint8Array, tsHash: Uint8Array): Promise<CastRemoveModel> {
    const messageTsHash = await this._db.get(CastStore.castRemovesKey(fid, tsHash));
    return MessageModel.get<CastRemoveModel>(this._db, fid, UserPostfix.CastMessage, messageTsHash);
  }

  /** Get all CastAdd messages for an fid */
  async getCastAddsByUser(fid: Uint8Array): Promise<CastAddModel[]> {
    const castAddsPrefix = CastStore.castAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(castAddsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<CastAddModel>(this._db, fid, UserPostfix.CastMessage, messageKeys);
  }

  /** Get all CastRemove messages for an fid */
  async getCastRemovesByUser(fid: Uint8Array): Promise<CastRemoveModel[]> {
    const castRemovesPrefix = CastStore.castRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(castRemovesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<CastRemoveModel>(this._db, fid, UserPostfix.CastMessage, messageKeys);
  }

  /** Get all CastAdd messages for a parent cast (fid and tsHash) */
  async getCastsByParent(fid: Uint8Array, tsHash: Uint8Array): Promise<CastAddModel[]> {
    const byParentPrefix = CastStore.castsByParentKey(fid, tsHash);
    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(byParentPrefix, { keyAsBuffer: true, values: false })) {
      const fid = Uint8Array.from(key).subarray(byParentPrefix.length, byParentPrefix.length + FID_BYTES);
      const tsHash = Uint8Array.from(key).subarray(byParentPrefix.length + FID_BYTES);
      messageKeys.push(MessageModel.primaryKey(fid, UserPostfix.CastMessage, tsHash));
    }
    return MessageModel.getMany(this._db, messageKeys);
  }

  /** Get all CastAdd messages for a mention (fid) */
  async getCastsByMention(fid: Uint8Array): Promise<CastAddModel[]> {
    const byMentionPrefix = CastStore.castsByMentionKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(byMentionPrefix, { keyAsBuffer: true, values: false })) {
      const fid = Uint8Array.from(key).subarray(byMentionPrefix.length, byMentionPrefix.length + FID_BYTES);
      const tsHash = Uint8Array.from(key).subarray(byMentionPrefix.length + FID_BYTES);
      messageKeys.push(MessageModel.primaryKey(fid, UserPostfix.CastMessage, tsHash));
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

    // Look up the remove tsHash for this cast
    const castRemoveTsHash = await ResultAsync.fromPromise(
      this._db.get(CastStore.castRemovesKey(message.fid(), message.tsHash())),
      () => undefined
    );

    // If remove tsHash exists, no-op because this cast has already been removed
    if (castRemoveTsHash.isOk()) {
      return undefined;
    }

    // Look up the add tsHash for this cast
    const castAddTsHash = await ResultAsync.fromPromise(
      this._db.get(CastStore.castAddsKey(message.fid(), message.tsHash())),
      () => undefined
    );

    // If add tsHash exists, no-op because this cast has already been added
    if (castAddTsHash.isOk()) {
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
    const removeTargetTsHash = message.body().targetTsHashArray() ?? new Uint8Array();

    // Look up the remove tsHash for this cast
    const castRemoveTsHash = await ResultAsync.fromPromise(
      this._db.get(CastStore.castRemovesKey(message.fid(), removeTargetTsHash)),
      () => undefined
    );

    if (castRemoveTsHash.isOk()) {
      if (bytesCompare(castRemoveTsHash.value, message.tsHash()) >= 0) {
        // If the remove tsHash exists and has the same or higher order than the new CastRemove
        // tsHash, no-op because this cast has been removed by a more recent message
        return undefined;
      } else {
        // If the remove tsHash exists but with a lower order than the new CastRemove
        // tsHash, retrieve the full CastRemove message and delete it as part of the
        // RocksDB transaction
        const existingRemove = await MessageModel.get<CastRemoveModel>(
          this._db,
          message.fid(),
          UserPostfix.CastMessage,
          castRemoveTsHash.value
        );
        tsx = this.deleteCastRemoveTransaction(tsx, existingRemove);
      }
    }

    // Look up the add tsHash for this cast
    const castAddTsHash = await ResultAsync.fromPromise(
      this._db.get(CastStore.castAddsKey(message.fid(), removeTargetTsHash)),
      () => undefined
    );

    // If the add tsHash exists, retrieve the full CastAdd message and delete it as
    // part of the RocksDB transaction
    if (castAddTsHash.isOk()) {
      const existingAdd = await MessageModel.get<CastAddModel>(
        this._db,
        message.fid(),
        UserPostfix.CastMessage,
        castAddTsHash.value
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
    tsx = tsx.put(CastStore.castAddsKey(message.fid(), message.tsHash()), Buffer.from(message.tsHash()));

    // Index by parent
    if (message.body().parent()) {
      tsx = tsx.put(
        CastStore.castsByParentKey(
          message.body().parent()?.fidArray() ?? new Uint8Array(),
          message.body().parent()?.tsHashArray() ?? new Uint8Array(),
          message.fid(),
          message.tsHash()
        ),
        TRUE_VALUE
      );
    }

    // Index by mentions
    if (message.body().mentionsLength() > 0) {
      for (let i = 0; i < message.body().mentionsLength(); i++) {
        const mention = message.body().mentions(i);
        tsx = tsx.put(
          CastStore.castsByMentionKey(mention?.fidArray() ?? new Uint8Array(), message.fid(), message.tsHash()),
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
          CastStore.castsByMentionKey(mention?.fidArray() ?? new Uint8Array(), message.fid(), message.tsHash())
        );
      }
    }

    // Delete from parent index
    if (message.body().parent()) {
      tsx = tsx.del(
        CastStore.castsByParentKey(
          message.body().parent()?.fidArray() ?? new Uint8Array(),
          message.body().parent()?.tsHashArray() ?? new Uint8Array(),
          message.fid(),
          message.tsHash()
        )
      );
    }

    // Delete from castAdds
    tsx = tsx.del(CastStore.castAddsKey(message.fid(), message.tsHash()));

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }

  private putCastRemoveTransaction(tsx: Transaction, message: CastRemoveModel): Transaction {
    // Add to db
    tsx = MessageModel.putTransaction(tsx, message);

    // Add to cast removes
    tsx = tsx.put(
      CastStore.castRemovesKey(message.fid(), message.body().targetTsHashArray() ?? new Uint8Array()),
      Buffer.from(message.tsHash())
    );

    return tsx;
  }

  private deleteCastRemoveTransaction(tsx: Transaction, message: CastRemoveModel): Transaction {
    // Delete from cast removes
    tsx = tsx.del(CastStore.castRemovesKey(message.fid(), message.body().targetTsHashArray() ?? new Uint8Array()));

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }
}

export default CastStore;
