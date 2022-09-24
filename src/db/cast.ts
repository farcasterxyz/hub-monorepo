import { ResultAsync } from 'neverthrow';
import { Transaction } from '~/db/rocksdb';
import { Cast, CastRecast, CastRemove, CastShort } from '~/types';
import { isCastRecast, isCastShort } from '~/types/typeguards';
import MessageDB from '~/db/message';

class CastDB extends MessageDB {
  async getCastAdd(fid: number, hash: string): Promise<CastShort | CastRecast> {
    const messageHash = await this._db.get(this.castAddsKey(fid, hash));
    return this.getMessage<CastShort | CastRecast>(messageHash);
  }

  async getCastRemove(fid: number, hash: string): Promise<CastRemove> {
    const messageHash = await this._db.get(this.castRemovesKey(fid, hash));
    return this.getMessage<CastRemove>(messageHash);
  }

  async getCastAddsByUser(fid: number): Promise<(CastShort | CastRecast)[]> {
    const hashes = await this.getMessageHashesByPrefix(this.castAddsKey(fid));
    return this.getMessages<CastShort | CastRecast>(hashes);
  }

  async getCastRemovesByUser(fid: number): Promise<CastRemove[]> {
    const hashes = await this.getMessageHashesByPrefix(this.castRemovesKey(fid));
    return this.getMessages<CastRemove>(hashes);
  }

  async getCastShortsByTarget(target: string): Promise<CastShort[]> {
    const hashes = await this.getMessageHashesByPrefix(this.castShortsByTargetKey(target));
    return this.getMessages<CastShort>(hashes);
  }

  async getCastRecastsByTarget(target: string): Promise<CastRecast[]> {
    const hashes = await this.getMessageHashesByPrefix(this.castRecastsByTargetKey(target));
    return this.getMessages<CastRecast>(hashes);
  }

  async getAllCastMessagesByUser(fid: number): Promise<Cast[]> {
    const prefix = `fid!${fid}!cast`;
    const hashes = await this.getMessageHashesByPrefix(prefix);
    return this.getMessages<Cast>(hashes);
  }

  async putCastAdd(cast: CastShort | CastRecast): Promise<void> {
    const tsx = await this._putCastAdd(this._db.transaction(), cast);
    return this._db.commit(tsx);
  }

  async deleteCastAdd(fid: number, hash: string): Promise<void> {
    const castAdd = await this.getCastAdd(fid, hash);
    const tsx = this._deleteCastAdd(this._db.transaction(), castAdd);
    return this._db.commit(tsx);
  }

  async putCastRemove(cast: CastRemove): Promise<void> {
    const tsx = await this._putCastRemove(this._db.transaction(), cast);
    return this._db.commit(tsx);
  }

  async deleteCastRemove(fid: number, hash: string): Promise<void> {
    const castRemove = await this.getCastRemove(fid, hash);
    const tsx = this._deleteCastRemove(this._db.transaction(), castRemove);
    return this._db.commit(tsx);
  }

  /** Private key methods */

  private castAddsKey(fid: number, hash?: string) {
    return `fid!${fid}!castAdds!${hash ?? ''}`;
  }

  private castRemovesKey(fid: number, hash?: string) {
    return `fid!${fid}!castRemoves!${hash ?? ''}`;
  }

  private castShortsByTargetKey(target: string, hash?: string) {
    return `castShortsByTarget!${target}!${hash ?? ''}`;
  }

  private castRecastsByTargetKey(target: string, hash?: string) {
    return `castRecastsByTarget!${target}!${hash ?? ''}`;
  }

  /** Private transaction methods */

  private async _putCastAdd(tsx: Transaction, cast: CastShort | CastRecast): Promise<Transaction> {
    tsx = this._putMessage(tsx, cast);

    // Add castAdds
    tsx.put(this.castAddsKey(cast.data.fid, cast.hash), cast.hash);

    // Del castRemoves
    const castRemove = await ResultAsync.fromPromise(this.getCastRemove(cast.data.fid, cast.hash), () => undefined);
    if (castRemove.isOk()) {
      tsx = this._deleteCastRemove(tsx, castRemove.value);
    }

    // Index CastShort by target
    if (isCastShort(cast) && cast.data.body.targetUri) {
      tsx = tsx.put(this.castShortsByTargetKey(cast.data.body.targetUri, cast.hash), cast.hash);
    }

    // Index CastRecast by target
    if (isCastRecast(cast)) {
      tsx = tsx.put(this.castRecastsByTargetKey(cast.data.body.targetCastUri, cast.hash), cast.hash);
    }

    return tsx;
  }

  private _deleteCastAdd(tsx: Transaction, cast: CastShort | CastRecast): Transaction {
    tsx = tsx.del(this.castAddsKey(cast.data.fid, cast.hash));

    // If cast is CastShort, delete from castShortAddsByTarget index
    if (isCastShort(cast) && cast.data.body.targetUri) {
      tsx = tsx.del(this.castShortsByTargetKey(cast.data.body.targetUri, cast.hash));
    }

    // If cast is CastRecast, delete from castRecastAddsByTarget index
    if (isCastRecast(cast)) {
      tsx = tsx.del(this.castRecastsByTargetKey(cast.data.body.targetCastUri, cast.hash));
    }

    return this._deleteMessage(tsx, cast);
  }

  private async _putCastRemove(tsx: Transaction, castRemove: CastRemove): Promise<Transaction> {
    tsx = this._putMessage(tsx, castRemove);

    const castAdd = await ResultAsync.fromPromise(
      this.getCastAdd(castRemove.data.fid, castRemove.data.body.targetHash),
      () => undefined
    );
    if (castAdd.isOk()) {
      tsx = tsx.del(this.castAddsKey(castRemove.data.fid, castRemove.data.body.targetHash));
    }

    // Add to castRemoves
    return tsx.put(this.castRemovesKey(castRemove.data.fid, castRemove.data.body.targetHash), castRemove.hash);
  }

  private _deleteCastRemove(tsx: Transaction, castRemove: CastRemove): Transaction {
    tsx = tsx.del(this.castRemovesKey(castRemove.data.fid, castRemove.data.body.targetHash));
    return this._deleteMessage(tsx, castRemove);
  }
}

export default CastDB;
