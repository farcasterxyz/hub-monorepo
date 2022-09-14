import { Result, ok, err } from 'neverthrow';
import { Cast, CastRemove, CastRecast, CastShort } from '~/types';
import { isCastRemove, isCastRecast, isCastShort } from '~/types/typeguards';
import DB from '~/db';

class CastSet {
  private _db: DB;

  constructor(db: DB) {
    this._db = db;
  }

  async getCast(fid: number, hash: string): Promise<Result<CastShort | CastRecast, string>> {
    try {
      const messageHash = await this._db.castAdds(fid).get(hash);
      const messageResult = await this._db.getMessage(messageHash);
      return messageResult as Result<CastShort | CastRecast, string>;
    } catch (e) {
      return err('cast not found');
    }
  }

  async getCastsByUser(fid: number): Promise<Set<CastShort | CastRecast>> {
    const hashes = await this._db.castAdds(fid).values().all();
    const adds = await this._db.getMessages(hashes);
    return new Set(adds as (CastShort | CastRecast)[]);
  }

  async getAllCastsByUser(fid: number): Promise<Set<Cast>> {
    const hashes = [
      ...(await this._db.castAdds(fid).values().all()),
      ...(await this._db.castRemoves(fid).values().all()),
    ];
    const messages = await this._db.getMessages(hashes);
    return new Set(messages as Cast[]);
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

  /** Used for revoking signers */
  async deleteCast(hash: string): Promise<Result<void, string>> {
    const messageResult = await this._db.getMessage(hash);

    // If message does not exist, no-op
    if (messageResult.isErr()) return ok(undefined);

    const cast = messageResult.value;

    // If cast is CastShort, delete from castShortAddsByTarget index
    if (isCastShort(cast) && cast.data.body.targetUri) {
      await this._db.castShortsByTarget(cast.data.body.targetUri).del(cast.hash);
    }

    // If cast is CastRecast, delete from castRecastAddsByTarget index
    if (isCastRecast(cast)) {
      await this._db.castRecastsByTarget(cast.data.body.targetCastUri).del(cast.hash);
    }

    // Delete from adds db
    await this._db.castAdds(cast.data.fid).del(cast.hash);

    // Delete from messages db
    await this._db.deleteMessage(cast.hash);

    return ok(undefined);
  }

  /**
   * Private Methods
   */

  private async getAddHash(fid: number, hash: string): Promise<Result<string, string>> {
    try {
      const addHash = await this._db.castAdds(fid).get(hash);
      return ok(addHash);
    } catch (e) {
      return err('cast not found');
    }
  }

  private async getRemoveHash(fid: number, hash: string): Promise<Result<string, string>> {
    try {
      const removeHash = await this._db.castRemoves(fid).get(hash);
      return ok(removeHash);
    } catch (e) {
      return err('cast not found');
    }
  }

  private async mergeAdd(cast: CastShort | CastRecast): Promise<Result<void, string>> {
    const { fid } = cast.data;

    // If cast is duplicate, no-op
    const message = await this._db.getMessage(cast.hash);
    if (message.isOk()) return ok(undefined);

    // If cast has already been removed, no-op
    const removeHash = await this.getRemoveHash(fid, cast.hash);
    if (removeHash.isOk()) return ok(undefined);

    // If cast has already been added, no-op
    const addHash = await this.getAddHash(fid, cast.hash);
    if (addHash.isOk()) return ok(undefined);

    // Add cast to messages db
    await this._db.putMessage(cast);

    // Add cast to adds db
    await this._db.castAdds(fid).put(cast.hash, cast.hash);

    // Index CastShort by target
    if (isCastShort(cast) && cast.data.body.targetUri) {
      await this._db.castShortsByTarget(cast.data.body.targetUri).put(cast.hash, cast.hash);
    }

    // Index CastRecast by target
    if (isCastRecast(cast)) {
      await this._db.castRecastsByTarget(cast.data.body.targetCastUri).put(cast.hash, cast.hash);
    }

    return ok(undefined);
  }

  private async mergeRemove(cast: CastRemove): Promise<Result<void, string>> {
    // If cast is duplicate, no-op
    const message = await this._db.getMessage(cast.hash);
    if (message.isOk()) return ok(undefined);

    const { fid } = cast.data;
    const { targetHash } = cast.data.body;

    // If target has already been removed, no-op
    const removeHash = await this.getRemoveHash(fid, targetHash);
    if (removeHash.isOk()) return ok(undefined);

    // If message has been added, drop it from adds set
    const addHash = await this.getAddHash(fid, targetHash);
    if (addHash.isOk()) {
      await this.deleteCast(addHash.value);
    }

    // Add cast to messages db
    await this._db.putMessage(cast);

    // Add cast to removes db
    await this._db.castRemoves(fid).put(targetHash, cast.hash);

    return ok(undefined);
  }

  /**
   * Testing Methods
   */

  async _getAddHashes(fid: number): Promise<Set<string>> {
    const hashes = await this._db.castAdds(fid).values().all();
    return new Set(hashes);
  }

  async _getAdds(fid: number): Promise<Set<CastShort | CastRecast>> {
    return this.getCastsByUser(fid);
  }

  async _getRemoveHashes(fid: number): Promise<Set<string>> {
    const hashes = await this._db.castRemoves(fid).values({}).all();
    return new Set(hashes);
  }

  async _getRemoves(fid: number): Promise<Set<CastRemove>> {
    const hashes = await this._getRemoveHashes(fid);
    const removes = (await this._db.messages.getMany([...hashes])) as any as CastRemove[]; // TODO: fix types
    return new Set(removes);
  }
}

export default CastSet;
