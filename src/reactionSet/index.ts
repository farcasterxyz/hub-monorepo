import { Result, ok, err } from 'neverthrow';
import { Reaction } from '~/types';
import { isReaction } from '~/types/typeguards';
import { hashCompare } from '~/utils';

/**
 * ReactionSet stores and fetches reactions for a single username.
 *
 * Reactions can be toggled on and off, and they are merged into this data structure such that the
 * latest reaction of a certain type for a target overwrites previous ones. The data structure is
 * implemented as a Last-Write-Wins-Element-Set CRDT.
 */
class ReactionSet {
  private hashToReaction: Map<string, Reaction>;
  private keyToHash: Map<string, string>;

  constructor() {
    this.hashToReaction = new Map();
    this.keyToHash = new Map();
  }

  /** Get a reaction by its hash */
  get(hash: string): Reaction | undefined {
    return this.hashToReaction.get(hash);
  }

  /** Get hashes of active reactions. */
  getHashes(): string[] {
    return Array.from(this.hashToReaction.values())
      .filter((reaction) => reaction.data.body.active)
      .map((reaction) => reaction.hash);
  }

  /** Get hashes of all known reactions. */
  getAllHashes(): string[] {
    return Array.from(this.hashToReaction.keys());
  }

  /** Merge a new reaction into the set */
  merge(reaction: Reaction): Result<void, string> {
    if (!isReaction(reaction)) {
      return err('ReactionSet.merge: invalid reaction');
    }

    const targetUri = reaction.data.body.targetUri;
    const existingReactionHash = this.keyToHash.get(targetUri);

    if (!existingReactionHash) {
      this.mergeReaction(reaction);
      return ok(undefined);
    }

    const currentReaction = this.hashToReaction.get(existingReactionHash);
    if (!currentReaction) {
      return err('ReactionSet.merge: unexpected state');
    }

    if (currentReaction.data.signedAt > reaction.data.signedAt) {
      return err('ReactionSet.merge: newer reaction was present');
    }

    if (currentReaction.data.signedAt < reaction.data.signedAt) {
      this.addOrUpdateReaction(reaction);
      return ok(undefined);
    }

    // If the timestamp is equal, compare the lexicographic order of the hashes.
    const hashCmp = hashCompare(currentReaction.hash, reaction.hash);
    if (hashCmp < 0) {
      this.addOrUpdateReaction(reaction);
      return ok(undefined);
    } else if (hashCmp >= 1) {
      return err('ReactionSet.merge: newer reaction was present (lexicographic tiebreaker)');
    } else {
      return err('ReactionSet.merge: duplicate reaction');
    }
  }

  /**
   * Private Methods
   */

  private addOrUpdateReaction(reaction: Reaction): void {
    const prevHash = this.keyToHash.get(reaction.data.body.targetUri);
    if (prevHash) {
      this.hashToReaction.delete(prevHash);
    }
    this.mergeReaction(reaction);
  }

  private mergeReaction(reaction: Reaction): void {
    this.keyToHash.set(reaction.data.body.targetUri, reaction.hash);
    this.hashToReaction.set(reaction.hash, reaction);
  }

  /**
   * Testing Methods
   */

  _getActiveReactions(): Reaction[] {
    return Array.from(this.hashToReaction.values()).filter((reaction) => reaction.data.body.active);
  }

  _getInactiveReactions(): Reaction[] {
    return Array.from(this.hashToReaction.values()).filter((reaction) => !reaction.data.body.active);
  }

  _reset(): void {
    this.hashToReaction = new Map();
    this.keyToHash = new Map();
  }
}

export default ReactionSet;
