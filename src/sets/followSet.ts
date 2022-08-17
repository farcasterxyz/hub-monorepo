import { Result, ok, err } from 'neverthrow';
import { Follow } from '~/types';
import { isFollow } from '~/types/typeguards';
import { hashCompare, sanitizeSigner } from '~/utils';

/**
 * FollowSet stores and fetches follow actions for a Farcaster ID.
 *
 * TODO: add more info
 */
class FollowSet {
  /** Both maps indexed by targetURI */
  private hashToFollow: Map<string, Follow>;
  private targetToHash: Map<string, string>;

  constructor() {
    this.hashToFollow = new Map();
    this.targetToHash = new Map();
  }

  /** Get a follow by its hash */
  get(hash: string): Follow | undefined {
    return this.hashToFollow.get(hash);
  }

  /** Get hashes of active follows. */
  getHashes(): string[] {
    return Array.from(this.hashToFollow.values())
      .filter((follow) => follow.data.body.active)
      .map((follow) => follow.hash);
  }

  /** Get hashes of all known follows. */
  getAllHashes(): string[] {
    return Array.from(this.hashToFollow.keys());
  }

  /** Merge a new follow into the set */
  merge(follow: Follow): Result<void, string> {
    if (!isFollow(follow)) {
      return err('FollowSet.merge: invalid message format');
    }

    const { targetUri } = follow.data.body;
    const existingFollowHash = this.targetToHash.get(targetUri);

    if (!existingFollowHash) {
      this.mergeFollow(follow);
      return ok(undefined);
    }

    const existingFollow = this.hashToFollow.get(existingFollowHash);
    if (!existingFollow) return err('FollowSet.merge: unexpected state');

    if (existingFollow.data.signedAt > follow.data.signedAt) return ok(undefined);

    if (existingFollow.data.signedAt === follow.data.signedAt) {
      if (
        existingFollow.data.body.active === follow.data.body.active &&
        hashCompare(existingFollow.hash, follow.hash) >= 0
      ) {
        return ok(undefined);
      }

      if (!existingFollow.data.body.active && follow.data.body.active) {
        return ok(undefined);
      }
    }

    this.addOrUpdateFollow(follow);
    return ok(undefined);
  }

  revokeSigner(signer: string): Result<void, string> {
    for (const [target, hash] of this.targetToHash) {
      const follow = this.hashToFollow.get(hash);
      if (follow && sanitizeSigner(follow.signer) === sanitizeSigner(signer)) {
        this.hashToFollow.delete(hash);
        this.targetToHash.delete(target);
      }
    }
    return ok(undefined);
  }

  /**
   * Private Methods
   */

  private addOrUpdateFollow(follow: Follow): void {
    const prevHash = this.targetToHash.get(follow.data.body.targetUri);
    if (prevHash) {
      this.hashToFollow.delete(prevHash);
    }
    this.mergeFollow(follow);
  }

  private mergeFollow(follow: Follow): void {
    this.targetToHash.set(follow.data.body.targetUri, follow.hash);
    this.hashToFollow.set(follow.hash, follow);
  }

  /**
   * Testing Methods
   */

  _getActiveFollows(): Set<Follow> {
    return new Set(Array.from(this.hashToFollow.values()).filter((follow) => follow.data.body.active));
  }

  _getInactiveFollows(): Set<Follow> {
    return new Set(Array.from(this.hashToFollow.values()).filter((follow) => !follow.data.body.active));
  }

  _reset(): void {
    this.hashToFollow = new Map();
    this.targetToHash = new Map();
  }
}

export default FollowSet;
