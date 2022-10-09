import { ResultAsync } from 'neverthrow';
import FollowDB from '~/storage/db/follow';
import RocksDB from '~/storage/db/rocksdb';
import { BadRequestError } from '~/utils/errors';
import { Follow, FollowAdd, FollowRemove, URI } from '~/types';
import { isFollowAdd, isFollowRemove } from '~/types/typeguards';
import { hashCompare } from '~/utils/utils';

/**
 * FollowSet is a modified LWW set that stores and fetches follow actions. FollowAdd and FollowRemove messages
 * are stored in the FollowDB.
 *
 * Conflicts between two follow messages are resolved in this order (see followMessageCompare for implementation):
 * 1. Later timestamp wins
 * 2. FollowRemove > FollowAdd
 * 3. Higher message hash lexicographic order wins
 */
class FollowSet {
  private _db: FollowDB;

  constructor(db: RocksDB) {
    this._db = new FollowDB(db);
  }

  /** Get a follow add by its target URI */
  getFollow(fid: number, target: URI): Promise<FollowAdd> {
    return this._db.getFollowAdd(fid, target);
  }

  async getFollowsByUser(fid: number): Promise<Set<FollowAdd>> {
    const follows = await this._db.getFollowAddsByUser(fid);
    return new Set(follows);
  }

  async getAllFollowMessagesByUser(fid: number): Promise<Set<Follow>> {
    const messages = await this._db.getAllFollowMessagesByUser(fid);
    return new Set(messages);
  }

  async revokeSigner(fid: number, signer: string): Promise<void> {
    return this._db.deleteAllFollowMessagesBySigner(fid, signer);
  }

  /** Merge a new follow into the set */
  async merge(follow: Follow): Promise<void> {
    if (isFollowAdd(follow)) {
      return this.mergeFollowAdd(follow);
    }

    if (isFollowRemove(follow)) {
      return this.mergeFollowRemove(follow);
    }

    throw new BadRequestError('FollowSet.merge: invalid message format');
  }

  /**
   * Private Methods
   */

  /**
   * followMessageCompare returns an order (-1, 0, 1) for two follow messages (a and b). If a occurs before
   * b, return -1. If a occurs after b, return 1. If a and b cannot be ordered (i.e. they are the same
   * message), return 0.
   */
  private followMessageCompare(a: Follow, b: Follow): number {
    // If they are the same message, return 0
    if (a.hash === b.hash) return 0;

    // Compare signedAt timestamps
    if (a.data.signedAt > b.data.signedAt) {
      return 1;
    } else if (a.data.signedAt < b.data.signedAt) {
      return -1;
    }

    // Compare message types (FollowRemove > FollowAdd)
    if (isFollowRemove(a) && isFollowAdd(b)) {
      return 1;
    } else if (isFollowAdd(a) && isFollowRemove(b)) {
      return -1;
    }

    // Compare lexicographical order of hash
    return hashCompare(a.hash, b.hash);
  }

  /** mergeFollowAdd tries to add a FollowAdd message to the set */
  private async mergeFollowAdd(message: FollowAdd): Promise<void> {
    const { targetUri } = message.data.body;
    const { fid } = message.data;

    // Check if the target has already been followed
    const existingFollowAdd = await ResultAsync.fromPromise(this._db.getFollowAdd(fid, targetUri), () => undefined);
    if (existingFollowAdd.isOk() && this.followMessageCompare(message, existingFollowAdd.value) <= 0) {
      return undefined;
    }

    // Check if the target has already been un-followed
    const existingFollowRemove = await ResultAsync.fromPromise(
      this._db.getFollowRemove(fid, targetUri),
      () => undefined
    );
    if (existingFollowRemove.isOk() && this.followMessageCompare(message, existingFollowRemove.value) <= 0) {
      return undefined;
    }

    // Add the message to the db
    return this._db.putFollowAdd(message);
  }

  /** mergeFollowRemove tries to add a FollowRemove message to the set */
  private async mergeFollowRemove(message: FollowRemove): Promise<void> {
    const { targetUri } = message.data.body;
    const { fid } = message.data;

    // Check if the target has already been un-followed
    const existingFollowRemove = await ResultAsync.fromPromise(
      this._db.getFollowRemove(fid, targetUri),
      () => undefined
    );
    if (existingFollowRemove.isOk() && this.followMessageCompare(message, existingFollowRemove.value) <= 0) {
      return undefined;
    }

    // Check if the target has already been followed
    const existingFollowAdd = await ResultAsync.fromPromise(this._db.getFollowAdd(fid, targetUri), () => undefined);
    if (existingFollowAdd.isOk() && this.followMessageCompare(message, existingFollowAdd.value) <= 0) {
      return undefined;
    }

    // Add the message to the db
    return this._db.putFollowRemove(message);
  }
}

export default FollowSet;
