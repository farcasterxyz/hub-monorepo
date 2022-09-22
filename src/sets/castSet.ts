import { Result, ok, err } from 'neverthrow';
import { Cast, CastRemove, CastRecast, CastShort } from '~/types';
import { isCastRemove, isCastRecast, isCastShort } from '~/types/typeguards';
import DB from '~/db/farcaster';

class CastSet {
  private _db: DB;

  constructor(db: DB) {
    this._db = db;
  }

  async getCast(fid: number, hash: string): Promise<Result<CastShort | CastRecast, string>> {
    return this._db.getCastAdd(fid, hash);
  }

  async getCastsByUser(fid: number): Promise<Result<Set<CastShort | CastRecast>, string>> {
    const casts = await this._db.getCastAddsByUser(fid);
    if (casts.isErr()) return err(casts.error);
    return ok(new Set(casts.value));
  }

  async merge(cast: Cast): Promise<Result<void, string>> {
    if (isCastRemove(cast)) {
      return await this.mergeRemove(cast);
    }

    if (isCastRecast(cast) || isCastShort(cast)) {
      return await this.mergeAdd(cast);
    }

    return err('CastSet.merge: invalid message format');
  }

  /**
   * Private Methods
   */

  private async mergeAdd(cast: CastShort | CastRecast): Promise<Result<void, string>> {
    const { fid } = cast.data;

    // If cast is duplicate, no-op
    const message = await this._db.getMessage(cast.hash);
    if (message.isOk()) return ok(undefined);

    // If cast has already been removed, no-op
    const existingRemove = await this._db.getCastRemove(fid, cast.hash);
    if (existingRemove.isOk()) return ok(undefined);

    // If cast has already been added, no-op
    const existingAdd = await this._db.getCastAdd(fid, cast.hash);
    if (existingAdd.isOk()) return ok(undefined);

    return this._db.putCastAdd(cast);
  }

  private async mergeRemove(cast: CastRemove): Promise<Result<void, string>> {
    // If cast is duplicate, no-op
    const message = await this._db.getMessage(cast.hash);
    if (message.isOk()) return ok(undefined);

    const { fid } = cast.data;
    const { targetHash } = cast.data.body;

    // If target has already been removed, no-op
    const existingRemove = await this._db.getCastRemove(fid, targetHash);
    if (existingRemove.isOk()) return ok(undefined);

    // If message has been added, drop it from adds set
    const existingAdd = await this._db.getCastAdd(fid, targetHash);
    if (existingAdd.isOk()) {
      await this._db.deleteCastAdd(fid, targetHash);
    }

    return this._db.putCastRemove(cast);
  }

  /**
   * Testing Methods
   */

  // async _getAddHashes(fid: number): Promise<Set<string>> {
  //   const hashes = await this._db.castAdds(fid).values().all();
  //   return new Set(hashes);
  // }

  // async _getAdds(fid: number): Promise<Set<CastShort | CastRecast>> {
  //   return this.getCastsByUser(fid);
  // }

  // async _getRemoveHashes(fid: number): Promise<Set<string>> {
  //   const hashes = await this._db.castRemoves(fid).values({}).all();
  //   return new Set(hashes);
  // }

  // async _getRemoves(fid: number): Promise<Set<CastRemove>> {
  //   const hashes = await this._getRemoveHashes(fid);
  //   const removes = (await this._db.messages.getMany([...hashes])) as any as CastRemove[]; // TODO: fix types
  //   return new Set(removes);
  // }
}

export default CastSet;
