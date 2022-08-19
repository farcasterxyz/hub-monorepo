import { Result, ok, err } from 'neverthrow';
import { Follow, URI } from '~/types';
import { isFollow } from '~/types/typeguards';
import { hashCompare, sanitizeSigner } from '~/utils';

/**
 * FollowSet stores and fetches follow actions for a Farcaster ID.
 *
 * The FollowSet is implemented as a modified LWW set. Follow objects are stored in the hashToFollow map,
 * indexed by message hash. Another data structure, targetToHash, stores references from a targetURI (i.e. user URI)
 * to the most recent follow message hash.
 *
 * When two follow messages conflict, the one with the later signedAt timestamp wins. If two messages have the same timestamp,
 * the remove (i.e. where active is false) wins. If two messages have the same active value, the message with the higher
 * lexicographical hash wins.
 */
class FollowSet {
  private hashToFollow: Map<string, Follow>;
  private targetToHash: Map<string, string>;

  constructor() {
    this.hashToFollow = new Map();
    this.targetToHash = new Map();
  }

  /** Get a follow by its target URI */
  get(targetURI: URI): Follow | undefined {
    const hash = this.targetToHash.get(targetURI);
    return hash ? this.hashToFollow.get(hash) : undefined;
  }

  // TODO: add query API

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
