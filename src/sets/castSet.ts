import { ResultAsync } from 'neverthrow';
import { Cast, CastRemove, CastRecast, CastShort } from '~/types';
import { isCastRemove, isCastRecast, isCastShort } from '~/types/typeguards';
import CastDB from '~/db/cast';
import RocksDB from '~/db/rocksdb';
import { BadRequestError } from '~/errors';
import { hashCompare } from '~/utils';

/**
 * CastSet is a modified LWW set that stores and fetches casts. CastShort, CastRecast, and CastRemove messages
 * are stored in the CastDB.
 *
 * Conflicts between two cast messages are resolved in this order (see castMessageCompare for implementation):
 * 1. Later timestamp wins
 * 2. CastRemove > (CastShort, CastRecast)
 * 3. Higher message hash lexicographic order wins
 */
class CastSet {
  private _db: CastDB;

  constructor(db: RocksDB) {
    this._db = new CastDB(db);
  }

  getCast(fid: number, hash: string): Promise<CastShort | CastRecast> {
    return this._db.getCastAdd(fid, hash);
  }

  async getCastsByUser(fid: number): Promise<Set<CastShort | CastRecast>> {
    const casts = await this._db.getCastAddsByUser(fid);
    return new Set(casts);
  }

  async getAllCastMessagesByUser(fid: number): Promise<Set<Cast>> {
    const casts = await this._db.getAllCastMessagesByUser(fid);
    return new Set(casts);
  }

  async revokeSigner(fid: number, signer: string): Promise<void> {
    return this._db.deleteAllCastMessagesBySigner(fid, signer);
  }

  async merge(cast: Cast): Promise<void> {
    if (isCastRemove(cast)) {
      return this.mergeRemove(cast);
    }

    if (isCastRecast(cast) || isCastShort(cast)) {
      return this.mergeAdd(cast);
    }

    throw new BadRequestError('CastSet.merge: invalid message format');
  }

  /**
   * Private Methods
   */

  private castMessageCompare(a: Cast, b: Cast): number {
    // If they are the same message, return 0
    if (a.hash === b.hash) return 0;

    // Compare signedAt timestamps
    if (a.data.signedAt > b.data.signedAt) {
      return 1;
    } else if (a.data.signedAt < b.data.signedAt) {
      return -1;
    }

    // Compare message types (ReactionRemove > ReactionAdd)
    if (isCastRemove(a) && (isCastShort(b) || isCastRecast(b))) {
      return 1;
    } else if ((isCastShort(a) || isCastRecast(a)) && isCastRemove(b)) {
      return -1;
    }

    // Compare lexicographical order of hash
    return hashCompare(a.hash, b.hash);
  }

  private async mergeAdd(cast: CastShort | CastRecast): Promise<void> {
    const { fid } = cast.data;

    // If cast has already been removed, no-op
    const existingRemove = await ResultAsync.fromPromise(this._db.getCastRemove(fid, cast.hash), () => undefined);
    if (existingRemove.isOk() && this.castMessageCompare(cast, existingRemove.value) <= 0) {
      return undefined;
    }

    // If cast has already been added, no-op
    const existingAdd = await ResultAsync.fromPromise(this._db.getCastAdd(fid, cast.hash), () => undefined);
    if (existingAdd.isOk() && this.castMessageCompare(cast, existingAdd.value) <= 0) {
      return undefined;
    }

    return this._db.putCastAdd(cast);
  }

  private async mergeRemove(cast: CastRemove): Promise<void> {
    const { fid } = cast.data;
    const { targetHash } = cast.data.body;

    // If target has already been removed, no-op
    const existingRemove = await ResultAsync.fromPromise(this._db.getCastRemove(fid, targetHash), () => undefined);
    if (existingRemove.isOk() && this.castMessageCompare(cast, existingRemove.value) <= 0) {
      return undefined;
    }

    // If target has been added later, no-op
    const existingAdd = await ResultAsync.fromPromise(this._db.getCastAdd(fid, targetHash), () => undefined);
    if (existingAdd.isOk() && this.castMessageCompare(cast, existingAdd.value) <= 0) {
      return undefined;
    }

    return this._db.putCastRemove(cast);
  }
}

export default CastSet;
