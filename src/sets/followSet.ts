import { Result, ok, err } from 'neverthrow';
import { Follow, FollowAdd, FollowRemove, URI } from '~/types';
import { isFollowAdd, isFollowRemove } from '~/types/typeguards';
import { hashCompare, sanitizeSigner } from '~/utils';

/**
 * FollowSet stores and fetches follow actions for a Farcaster ID.
 *
 * The FollowSet is implemented as a modified LWW set. FollowAdd messages are stored in the adds map, and FollowRemove
 * messages are stored in the removes map. The adds and removes maps are indexed by targetURI, and a given targetURI can
 * only be in adds or removes at one time.
 *
 * Conflicts between two follow messages are resolved in this order (see followMessageCompare for implementation):
 * 1. Later timestamp wins
 * 2. FollowRemove > FollowAdd
 * 3. Higher message hash lexicographic order wins
 */
class FollowSet {
  private _adds: Map<string, FollowAdd>;
  private _removes: Map<string, FollowRemove>;

  constructor() {
    this._adds = new Map();
    this._removes = new Map();
  }

  /** Get a follow add by its target URI */
  get(targetURI: URI): FollowAdd | undefined {
    return this._adds.get(targetURI);
  }

  // TODO: add query API

  /** Merge a new follow into the set */
  merge(follow: Follow): Result<void, string> {
    if (isFollowAdd(follow)) {
      return this.mergeFollowAdd(follow);
    }

    if (isFollowRemove(follow)) {
      return this.mergeFollowRemove(follow);
    }

    return err('FollowSet.merge: invalid message format');
  }

  revokeSigner(signer: string): Result<void, string> {
    // Check messages in adds and drop if they match the signer
    for (const [target, message] of this._adds) {
      if (sanitizeSigner(message.signer) === sanitizeSigner(signer)) {
        this._adds.delete(target);
      }
    }

    // Check messages in removes and drop if they match the signer
    for (const [target, message] of this._removes) {
      if (sanitizeSigner(message.signer) === sanitizeSigner(signer)) {
        this._removes.delete(target);
      }
    }

    return ok(undefined);
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
  private mergeFollowAdd(message: FollowAdd): Result<void, string> {
    const { targetUri } = message.data.body;

    // Check if the target has already been followed
    const existingFollowAdd = this._adds.get(targetUri);
    if (existingFollowAdd && this.followMessageCompare(message, existingFollowAdd) <= 0) {
      return ok(undefined);
    }

    // Check if the target has already been un-followed
    const existingFollowRemove = this._removes.get(targetUri);
    if (existingFollowRemove) {
      if (this.followMessageCompare(message, existingFollowRemove) <= 0) {
        return ok(undefined);
      }

      // Drop target from removes set
      this._removes.delete(targetUri);
    }

    // Add the message to adds
    this._adds.set(targetUri, message);
    return ok(undefined);
  }

  /** mergeFollowRemove tries to add a FollowRemove message to the set */
  private mergeFollowRemove(message: FollowRemove): Result<void, string> {
    const { targetUri } = message.data.body;

    // Check if the target has already been un-followed
    const existingFollowRemove = this._removes.get(targetUri);
    if (existingFollowRemove && this.followMessageCompare(message, existingFollowRemove) <= 0) {
      return ok(undefined);
    }

    // Check if the target has already been followed
    const existingFollowAdd = this._adds.get(targetUri);
    if (existingFollowAdd) {
      if (this.followMessageCompare(message, existingFollowAdd) <= 0) {
        return ok(undefined);
      }

      // Drop target from adds set
      this._adds.delete(targetUri);
    }

    // Add the message to removes
    this._removes.set(targetUri, message);
    return ok(undefined);
  }

  /**
   * Testing Methods
   */

  _getAdds(): Set<FollowAdd> {
    return new Set([...this._adds.values()]);
  }

  _getRemoves(): Set<FollowRemove> {
    return new Set([...this._removes.values()]);
  }

  _reset(): void {
    this._adds = new Map();
    this._removes = new Map();
  }
}

export default FollowSet;
