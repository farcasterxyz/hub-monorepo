import { ResultAsync } from 'neverthrow';
import RocksDB from '~/storage/db/rocksdb';
import { BadRequestError } from '~/utils/errors';
import { ProfileMeta, ProfileMetaType } from '~/types';
import { isProfileMeta } from '~/types/typeguards';
import { hashCompare } from '~/utils/crypto';
import ProfileDB from '../db/profile';

/**
 * ProfileSet is a modified LWW set that stores and fetches follow actions. ProfileMeta messages
 * are stored in the ProfileDB.
 *
 * Conflicts between two messages with the same type and fid are resolved in this order (see
 * profileMessageCompare for implementation):
 * 1. Later timestamp wins
 * 2. Higher message hash lexicographic order wins
 */
class ProfileSet {
  private _db: ProfileDB;

  constructor(db: RocksDB) {
    this._db = new ProfileDB(db);
  }

  /** Get a ProfileMeta message by its fid and type */
  getProfileMeta(fid: number, type: ProfileMetaType): Promise<ProfileMeta> {
    return this._db.getProfileMeta(fid, type);
  }

  async getProfileMetaByUser(fid: number): Promise<Set<ProfileMeta>> {
    const messages = await this._db.getProfileMetaByUser(fid);
    return new Set(messages);
  }

  async revokeSigner(fid: number, signer: string): Promise<void> {
    return this._db.deleteAllProfileMessagesBySigner(fid, signer);
  }

  /** Merge a new message into the set */
  async merge(message: ProfileMeta): Promise<void> {
    if (isProfileMeta(message)) {
      return this.mergeProfileMeta(message);
    }

    throw new BadRequestError('ProfileSet.merge: invalid message format');
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  /**
   * profileMessageCompare returns an order (-1, 0, 1) for two ProfileMeta messages (a and b). If a occurs before
   * b, return -1. If a occurs after b, return 1. If a and b cannot be ordered (i.e. they are the same
   * message), return 0.
   */
  private profileMessageCompare(a: ProfileMeta, b: ProfileMeta): number {
    // If they are the same message, return 0
    if (a.hash === b.hash) return 0;

    // Compare signedAt timestamps
    if (a.data.signedAt > b.data.signedAt) {
      return 1;
    } else if (a.data.signedAt < b.data.signedAt) {
      return -1;
    }

    // Compare lexicographical order of hash
    return hashCompare(a.hash, b.hash);
  }

  /** mergeFollowAdd tries to add a FollowAdd message to the set */
  private async mergeProfileMeta(message: ProfileMeta): Promise<void> {
    const { type } = message.data.body;
    const { fid } = message.data;

    // Check if a value already exists for the type
    const existingMeta = await ResultAsync.fromPromise(this._db.getProfileMeta(fid, type), () => undefined);
    if (existingMeta.isOk() && this.profileMessageCompare(message, existingMeta.value) <= 0) {
      return undefined;
    }

    // Add the message to the db
    return this._db.putProfileMeta(message);
  }
}

export default ProfileSet;
