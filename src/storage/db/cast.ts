import { ResultAsync } from 'neverthrow';
import MessageDB from '~/storage/db/message';
import { Transaction } from '~/storage/db/rocksdb';
import { Cast, CastRecast, CastRemove, CastShort, MessageType } from '~/types';
import { isCastRecast, isCastShort } from '~/types/typeguards';

/**
 * CastDB extends MessageDB and provides methods for getting, putting, and deleting cast messages
 * from a RocksDB instance.
 *
 * Casts are stored in this schema:
 * - <extends message schema>
 * - fid!<fid>!castAdds!<cast hash>: <CastShort or CastRecast hash>
 * - fid!<fid>!castRemoves!<cast hash>: <CastRemove hash>
 * - castShortsByParent!<cast hash>!<hash>: <CastShort hash>
 * - castShortsByMention!<fid>!<hash>: <CastShort hash>
 * - castRecastsByTarget!<cast hash>!<hash>: <CastRecast hash>
 *
 * Note that the CastDB implements the constraint that a single cast hash can only exist in either castAdds
 * or castRemoves. Therefore, _putCastAdd also deletes the CastRemove for the same cast hash and _putCastRemove
 * also deletes the CastShort or CastRecast for the same target. The CastDB does not resolve conflicts between two cast
 * messages with the same cast hash. The CastStore should be used to handle conflicts and decide whether or not to
 * perform a mutation.
 */
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
    const hashes = await this.getMessageHashesByPrefix(this.castAddsPrefix(fid));
    return this.getMessages<CastShort | CastRecast>(hashes);
  }

  async getCastRemovesByUser(fid: number): Promise<CastRemove[]> {
    const hashes = await this.getMessageHashesByPrefix(this.castRemovesPrefix(fid));
    return this.getMessages<CastRemove>(hashes);
  }

  async getCastShortsByParent(parent: string): Promise<CastShort[]> {
    const hashes = await this.getMessageHashesByPrefix(this.castShortsByParentPrefix(parent));
    return this.getMessages<CastShort>(hashes);
  }

  async getCastShortsByMention(fid: number): Promise<CastShort[]> {
    const hashes = await this.getMessageHashesByPrefix(this.castShortsByMentionPrefix(fid));
    return this.getMessages<CastShort>(hashes);
  }

  async getCastRecastsByTarget(target: string): Promise<CastRecast[]> {
    const hashes = await this.getMessageHashesByPrefix(this.castRecastsByTargetPrefix(target));
    return this.getMessages<CastRecast>(hashes);
  }

  async getAllCastMessagesByUser(fid: number): Promise<Cast[]> {
    const prefix = `fid!${fid}!cast`;
    const hashes = await this.getMessageHashesByPrefix(prefix);
    return this.getMessages<Cast>(hashes);
  }

  async deleteAllCastMessagesBySigner(fid: number, signer: string): Promise<void> {
    const tsx = await this._deleteAllCastMessagesBySigner(this._db.transaction(), fid, signer);
    return this._db.commit(tsx);
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

  /* -------------------------------------------------------------------------- */
  /*                             Private Key Methods                            */
  /* -------------------------------------------------------------------------- */

  private castAddsPrefix(fid: number) {
    return `fid!${fid}!castAdds!`;
  }

  private castAddsKey(fid: number, hash: string) {
    return this.castAddsPrefix(fid) + hash;
  }

  private castRemovesPrefix(fid: number) {
    return `fid!${fid}!castRemoves!`;
  }

  private castRemovesKey(fid: number, hash: string) {
    return this.castRemovesPrefix(fid) + hash;
  }

  private castShortsByParentPrefix(parent: string) {
    return `castShortsByParent!${parent}!`;
  }

  private castShortsByParentKey(parent: string, hash: string) {
    return this.castShortsByParentPrefix(parent) + hash;
  }

  private castShortsByMentionPrefix(fid: number) {
    return `castShortsByMention!${fid}!`;
  }

  private castShortsByMentionKey(fid: number, hash: string) {
    return this.castShortsByMentionPrefix(fid) + hash;
  }

  private castRecastsByTargetPrefix(target: string) {
    return `castRecastsByTarget!${target}!`;
  }

  private castRecastsByTargetKey(target: string, hash: string) {
    return this.castRecastsByTargetPrefix(target) + hash;
  }

  /* -------------------------------------------------------------------------- */
  /*                         Private Transaction Methods                        */
  /* -------------------------------------------------------------------------- */

  private async _putCastAdd(tsx: Transaction, cast: CastShort | CastRecast): Promise<Transaction> {
    tsx = this._putMessage(tsx, cast);

    // Add castAdds
    tsx.put(this.castAddsKey(cast.data.fid, cast.hash), cast.hash);

    // Del castRemoves
    const castRemove = await ResultAsync.fromPromise(this.getCastRemove(cast.data.fid, cast.hash), () => undefined);
    if (castRemove.isOk()) {
      tsx = this._deleteCastRemove(tsx, castRemove.value);
    }

    // Index CastShort by parent
    if (isCastShort(cast) && cast.data.body.parent) {
      tsx = tsx.put(this.castShortsByParentKey(cast.data.body.parent, cast.hash), cast.hash);
    }

    // Index CastShort by mentions
    if (isCastShort(cast) && cast.data.body.mentions) {
      for (const fid of cast.data.body.mentions) {
        tsx = tsx.put(this.castShortsByMentionKey(fid, cast.hash), cast.hash);
      }
    }

    // Index CastRecast by target
    if (isCastRecast(cast)) {
      tsx = tsx.put(this.castRecastsByTargetKey(cast.data.body.targetCastUri, cast.hash), cast.hash);
    }

    return tsx;
  }

  private _deleteCastAdd(tsx: Transaction, cast: CastShort | CastRecast): Transaction {
    tsx = tsx.del(this.castAddsKey(cast.data.fid, cast.hash));

    // If cast is CastShort, delete from castShortsByParent index
    if (isCastShort(cast) && cast.data.body.parent) {
      tsx = tsx.del(this.castShortsByParentKey(cast.data.body.parent, cast.hash));
    }

    // If cast is CastShort, delete from castShortsByMention index
    if (isCastShort(cast) && cast.data.body.mentions) {
      for (const fid of cast.data.body.mentions) {
        tsx = tsx.del(this.castShortsByMentionKey(fid, cast.hash));
      }
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

  private async _deleteAllCastMessagesBySigner(tsx: Transaction, fid: number, signer: string): Promise<Transaction> {
    const castShorts = await this.getMessagesBySigner<CastShort>(fid, signer, MessageType.CastShort);
    const castRecasts = await this.getMessagesBySigner<CastRecast>(fid, signer, MessageType.CastRecast);
    for (const castAdd of [...castShorts, ...castRecasts]) {
      tsx = this._deleteCastAdd(tsx, castAdd);
    }
    const castRemoves = await this.getMessagesBySigner<CastRemove>(fid, signer, MessageType.CastRemove);
    for (const castRemove of castRemoves) {
      tsx = this._deleteCastRemove(tsx, castRemove);
    }
    return tsx;
  }
}

export default CastDB;
