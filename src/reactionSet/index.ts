import { Result, ok, err } from 'neverthrow';
import { Message, ReactionMessageBody } from '~/types';
import { isReaction } from '~/types/typeguards';
import { hashCompare } from '~/utils';

class ReactionSet {
  private hashToReaction: Map<string, Message<ReactionMessageBody>>;
  private keyToHash: Map<string, string>;

  constructor() {
    this.hashToReaction = new Map();
    this.keyToHash = new Map();
  }

  get(hash: string): Message<ReactionMessageBody> | undefined {
    return this.hashToReaction.get(hash);
  }

  getHashes(): string[] {
    return Array.from(this.hashToReaction.keys());
  }

  merge(reaction: Message<ReactionMessageBody>): Result<void, string> {
    if (!isReaction(reaction)) {
      return err('ReactionSet.merge: invalid reaction');
    }

    const targetUri = reaction.data.body.targetUri;
    const existingReactionHash = this.keyToHash.get(targetUri);

    if (!existingReactionHash) {
      this.addReaction(reaction);
      return ok(undefined);
    }

    const existingReaction = this.hashToReaction.get(existingReactionHash);
    if (!existingReaction) {
      return err('ReactionSet.merge: unexpected state');
    }

    if (existingReaction.data.signedAt > reaction.data.signedAt) {
      return err('ReactionSet.merge: newer reaction was present');
    }

    if (existingReaction.data.signedAt < reaction.data.signedAt) {
      this.updateReaction(reaction);
      return ok(undefined);
    }

    // If the timestamp is equal, compare the lexicographic order of the hashes.
    const hashCmp = hashCompare(existingReaction.hash, reaction.hash);
    if (hashCmp < 0) {
      this.updateReaction(reaction);
      return ok(undefined);
    } else if (hashCmp >= 1) {
      return err('ReactionSet.merge: newer reaction was present (lexicographic tiebreaker)');
    } else {
      return err('ReactionSet.merge: duplicate reaction');
    }
  }

  private updateReaction(reaction: Message<ReactionMessageBody>): void {
    const prevHash = this.keyToHash.get(reaction.data.body.targetUri);
    if (prevHash) {
      this.hashToReaction.delete(prevHash);
    }
    this.addReaction(reaction);
  }

  private addReaction(reaction: Message<ReactionMessageBody>): void {
    this.keyToHash.set(reaction.data.body.targetUri, reaction.hash);
    this.hashToReaction.set(reaction.hash, reaction);
  }

  // Testing Only Methods
  _getActiveReactions(): Message<any>[] {
    return Array.from(this.hashToReaction.values()).filter((reaction) => reaction.data.body.active);
  }

  _getInactiveReactions(): Message<any>[] {
    return Array.from(this.hashToReaction.values()).filter((reaction) => !reaction.data.body.active);
  }
  _reset(): void {
    this.hashToReaction = new Map();
    this.keyToHash = new Map();
  }
}

export default ReactionSet;
