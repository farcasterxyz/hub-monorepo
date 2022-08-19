import { Result, ok, err } from 'neverthrow';
import { Reaction, URI } from '~/types';
import { isReaction } from '~/types/typeguards';
import { hashCompare, sanitizeSigner } from '~/utils';

/**
 * ReactionSet stores and fetches reactions for a Farcaster account.
 *
 * Reactions can be toggled on and off, and they are merged into this data structure such that the
 * latest reaction of a certain type for a target overwrites previous ones. The data structure is
 * implemented as a Last-Write-Wins-Element-Set CRDT.
 */
class ReactionSet {
  private hashToReaction: Map<string, Reaction>;
  private targetToHash: Map<string, string>;

  constructor() {
    this.hashToReaction = new Map();
    this.targetToHash = new Map();
  }

  /** Get a reaction by its targetURI */
  get(targetUri: URI): Reaction | undefined {
    const hash = this.targetToHash.get(targetUri);
    return hash ? this.hashToReaction.get(hash) : undefined;
  }

  // TODO: add query API

  /** Merge a new reaction into the set */
  merge(reaction: Reaction): Result<void, string> {
    if (!isReaction(reaction)) {
      return err('ReactionSet.merge: invalid message format');
    }

    const targetUri = reaction.data.body.targetUri;
    const existingReactionHash = this.targetToHash.get(targetUri);

    if (!existingReactionHash) {
      this.mergeReaction(reaction);
      return ok(undefined);
    }

    const currentReaction = this.hashToReaction.get(existingReactionHash);
    if (!currentReaction) {
      return err('ReactionSet.merge: unexpected state');
    }

    if (currentReaction.data.signedAt > reaction.data.signedAt) return ok(undefined);

    if (currentReaction.data.signedAt < reaction.data.signedAt) {
      this.addOrUpdateReaction(reaction);
      return ok(undefined);
    }

    // If the timestamp is equal, compare the lexicographic order of the hashes
    if (hashCompare(currentReaction.hash, reaction.hash) >= 0) return ok(undefined);

    this.addOrUpdateReaction(reaction);
    return ok(undefined);
  }

  revokeSigner(signer: string): Result<void, string> {
    for (const [key, hash] of this.targetToHash) {
      const reaction = this.hashToReaction.get(hash);
      if (reaction && sanitizeSigner(reaction.signer) === signer) {
        this.hashToReaction.delete(hash);
        this.targetToHash.delete(key);
      }
    }
    return ok(undefined);
  }

  /**
   * Private Methods
   */

  private addOrUpdateReaction(reaction: Reaction): void {
    const prevHash = this.targetToHash.get(reaction.data.body.targetUri);
    if (prevHash) {
      this.hashToReaction.delete(prevHash);
    }
    this.mergeReaction(reaction);
  }

  private mergeReaction(reaction: Reaction): void {
    this.targetToHash.set(reaction.data.body.targetUri, reaction.hash);
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
    this.targetToHash = new Map();
  }
}

export default ReactionSet;
