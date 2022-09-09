import { Result, ok, err } from 'neverthrow';
import { Reaction, ReactionAdd, ReactionRemove, URI } from '~/types';
import { isReactionAdd, isReactionRemove } from '~/types/typeguards';
import { hashCompare, sanitizeSigner } from '~/utils';

/**
 * ReactionSet stores and fetches reactions for a Farcaster ID.
 *
 * The ReactionSet is implemented as a modified LWW set. ReactionAdd messages are stored in the adds map, and ReactionRemove
 * messages are stored in the removes map. The adds and removes maps are indexed by targetURI, and a given targetURI can
 * only be in either adds or removes at one time.
 *
 * Conflicts between two reaction messages are resolved in this order (see reactionMessageCompare for implementation):
 * 1. Later timestamp wins
 * 2. ReactionRemove > ReactionAdd
 * 3. Higher message hash lexicographic order wins
 */
class ReactionSet {
  private _adds: Map<string, ReactionAdd>;
  private _removes: Map<string, ReactionRemove>;

  constructor() {
    this._adds = new Map();
    this._removes = new Map();
  }

  /** Get a reaction by its targetURI */
  get(targetUri: URI): ReactionAdd | undefined {
    return this._adds.get(targetUri);
  }

  // TODO: add query API

  /** Merge a new message into the set */
  merge(message: Reaction): Result<void, string> {
    if (isReactionAdd(message)) {
      return this.mergeReactionAdd(message);
    }

    if (isReactionRemove(message)) {
      return this.mergeReactionRemove(message);
    }

    return err('ReactionSet.merge: invalid message format');
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

  getAllMessages(): Set<Reaction> {
    return new Set([Array.from(this._adds.values()), Array.from(this._removes.values())].flat());
  }

  /**
   * Private Methods
   */

  /**
   * reactionMessageCompare returns an order (-1, 0, 1) for two reaction messages (a and b). If a occurs before
   * b, return -1. If a occurs after b, return 1. If a and b cannot be ordered (i.e. they are the same
   * message), return 0.
   */
  private reactionMessageCompare(a: Reaction, b: Reaction): number {
    // If they are the same message, return 0
    if (a.hash === b.hash) return 0;

    // Compare signedAt timestamps
    if (a.data.signedAt > b.data.signedAt) {
      return 1;
    } else if (a.data.signedAt < b.data.signedAt) {
      return -1;
    }

    // Compare message types (ReactionRemove > ReactionAdd)
    if (isReactionRemove(a) && isReactionAdd(b)) {
      return 1;
    } else if (isReactionAdd(a) && isReactionRemove(b)) {
      return -1;
    }

    // Compare lexicographical order of hash
    return hashCompare(a.hash, b.hash);
  }

  /** mergeReactionAdd tries to add a FollowAdd message to the set */
  private mergeReactionAdd(message: ReactionAdd): Result<void, string> {
    const { targetUri } = message.data.body;

    // Check if the target has already been reacted to
    const existingReactionAdd = this._adds.get(targetUri);
    if (existingReactionAdd && this.reactionMessageCompare(message, existingReactionAdd) <= 0) {
      return ok(undefined);
    }

    // Check if the target has already had a reaction removed
    const existingReactionRemove = this._removes.get(targetUri);
    if (existingReactionRemove) {
      if (this.reactionMessageCompare(message, existingReactionRemove) <= 0) {
        return ok(undefined);
      }

      // Drop target from removes set
      this._removes.delete(targetUri);
    }

    // Add the message to adds
    this._adds.set(targetUri, message);
    return ok(undefined);
  }

  /** mergeReactionRemove tries to add a ReactionRemove message to the set */
  private mergeReactionRemove(message: ReactionRemove): Result<void, string> {
    const { targetUri } = message.data.body;

    // Check if the target has already had a reaction removed
    const existingReactionRemove = this._removes.get(targetUri);
    if (existingReactionRemove && this.reactionMessageCompare(message, existingReactionRemove) <= 0) {
      return ok(undefined);
    }

    // Check if the target has already been reacted to
    const existingReactionAdd = this._adds.get(targetUri);
    if (existingReactionAdd) {
      if (this.reactionMessageCompare(message, existingReactionAdd) <= 0) {
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

  _getAdds(): Set<ReactionAdd> {
    return new Set([...this._adds.values()]);
  }

  _getRemoves(): Set<ReactionRemove> {
    return new Set([...this._removes.values()]);
  }

  _reset(): void {
    this._adds = new Map();
    this._removes = new Map();
  }
}

export default ReactionSet;
