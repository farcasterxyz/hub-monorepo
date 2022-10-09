import { ResultAsync } from 'neverthrow';
import { Cast, CastRemove, CastRecast, CastShort } from '~/types';
import { isCastRemove, isCastRecast, isCastShort } from '~/types/typeguards';
import CastDB from '~/storage/db/cast';
import RocksDB from '~/storage/db/rocksdb';
import { BadRequestError } from '~/utils/errors';
import { hashCompare } from '~/utils/utils';

type CastAdd = CastShort | CastRecast;

/**
 * A CRDT that stores and retrieves Cast messages by fid with Remove-Wins and Last-Write-Wins semantics.
 *
 * The CastSet has an add and remove set to track state. Add messages (CastShort, CastRecast) are used to place casts
 * in the add set while remove messages (CastRemove) move them into the delete set. Conflicts between add messages are
 * impossible by design, since any change to the message body results in a new hash which makes the message distinct.
 * Conflicts may arise between add and remove messages or remove and remove messages, which are handled with the
 * following rules:
 *
 * 1. Remove-Wins - a remove message always supersedes an add message
 * 2. Last-Write-Wins - a remove message with a higher timestamp supersedes one with a lower timestamp
 * 3. Lexicographical Ordering - a remove message with a higher hash supersedes one with a lower hash
 *
 * The CastRemove on a CastShort also does not retain the text of the message and instead stores the message hash,
 * which allows permanent deletion of message content.
 */
class CastSet {
  private _db: CastDB;

  constructor(db: RocksDB) {
    this._db = new CastDB(db);
  }

  getCast(fid: number, hash: string): Promise<CastAdd> {
    return this._db.getCastAdd(fid, hash);
  }

  /** Get all Casts in a user's add set */
  async getCastsByUser(fid: number): Promise<Set<CastAdd>> {
    const casts = await this._db.getCastAddsByUser(fid);
    return new Set(casts);
  }

  /* Get all Casts in a user's add and remove sets */
  async getAllCastsByUser(fid: number): Promise<Set<Cast>> {
    const casts = await this._db.getAllCastMessagesByUser(fid);
    return new Set(casts);
  }

  /* Delete all Casts created by a Signer */
  async revokeSigner(fid: number, signer: string): Promise<void> {
    return this._db.deleteAllCastMessagesBySigner(fid, signer);
  }

  /* Merge a Cast into the CastSet */
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

    // 1. Remove-Wins: compare message type (ReactionRemove > ReactionAdd)
    if (isCastRemove(a) && (isCastShort(b) || isCastRecast(b))) {
      return 1;
    } else if ((isCastShort(a) || isCastRecast(a)) && isCastRemove(b)) {
      return -1;
    }

    // 2. Last-Write-Wins: compare signedAt timestamps
    if (a.data.signedAt > b.data.signedAt) {
      return 1;
    } else if (a.data.signedAt < b.data.signedAt) {
      return -1;
    }

    // 3. Tie Breaker: Compare lexicographical order of hash
    return hashCompare(a.hash, b.hash);
  }

  private async mergeAdd(cast: CastAdd): Promise<void> {
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
