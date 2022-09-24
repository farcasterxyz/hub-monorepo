import { ResultAsync } from 'neverthrow';
import { Cast, CastRemove, CastRecast, CastShort } from '~/types';
import { isCastRemove, isCastRecast, isCastShort } from '~/types/typeguards';
import CastDB from '~/db/cast';
import RocksDB from '~/db/rocksdb';

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

  async merge(cast: Cast): Promise<void> {
    if (isCastRemove(cast)) {
      return this.mergeRemove(cast);
    }

    if (isCastRecast(cast) || isCastShort(cast)) {
      return this.mergeAdd(cast);
    }

    throw new Error('CastSet.merge: invalid message format');
  }

  /**
   * Private Methods
   */

  private async mergeAdd(cast: CastShort | CastRecast): Promise<void> {
    const { fid } = cast.data;

    // If cast has already been removed, no-op
    const existingRemove = await ResultAsync.fromPromise(this._db.getCastRemove(fid, cast.hash), () => undefined);
    if (existingRemove.isOk()) return undefined;

    // If cast has already been added, no-op
    const existingAdd = await ResultAsync.fromPromise(this._db.getCastAdd(fid, cast.hash), () => undefined);
    if (existingAdd.isOk()) return undefined;

    return this._db.putCastAdd(cast);
  }

  private async mergeRemove(cast: CastRemove): Promise<void> {
    const { fid } = cast.data;
    const { targetHash } = cast.data.body;

    // If target has already been removed, no-op
    const existingRemove = await ResultAsync.fromPromise(this._db.getCastRemove(fid, targetHash), () => undefined);
    // TODO: keep the later CastRemove
    if (existingRemove.isOk()) return undefined;

    return this._db.putCastRemove(cast);
  }
}

export default CastSet;
