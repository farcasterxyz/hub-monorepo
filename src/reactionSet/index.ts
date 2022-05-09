import { Result, ok, err } from 'neverthrow';
import { Message, ReactionMessageBody } from '~/types';
import { isReaction } from '~/types/typeguards';
import { hashCompare } from '~/utils';

class ReactionSet {
  private _reactions: Map<string, Message<ReactionMessageBody>>;

  constructor() {
    this._reactions = new Map();
  }

  get(uri: string): Message<ReactionMessageBody> | undefined {
    return this._reactions.get(uri);
  }

  getUris(): string[] {
    return Array.from(this._reactions.keys());
  }

  merge(reaction: Message<ReactionMessageBody>): Result<void, string> {
    if (!isReaction(reaction)) {
      return err('ReactionSet.merge: invalid reaction');
    }

    const targetUri = reaction.data.body.targetUri;
    const existingReaction = this._reactions.get(targetUri);

    if (!existingReaction) {
      this._reactions.set(targetUri, reaction);
      return ok(undefined);
    }

    if (existingReaction.data.signedAt > reaction.data.signedAt) {
      return err('ReactionSet.merge: newer reaction was present');
    }

    if (existingReaction.data.signedAt < reaction.data.signedAt) {
      this._reactions.set(targetUri, reaction);
      return ok(undefined);
    }

    // If the timestamp is equal, compare the lexicographic order of the hashes.
    const hashCmp = hashCompare(existingReaction.hash, reaction.hash);
    if (hashCmp < 0) {
      this._reactions.set(targetUri, reaction);
      return ok(undefined);
    } else if (hashCmp >= 1) {
      return err('ReactionSet.merge: newer reaction was present (lexicographic tiebreaker)');
    } else {
      return err('ReactionSet.merge: duplicate reaction');
    }
  }

  _getActiveReactions(): Message<any>[] {
    return Array.from(this._reactions.values()).filter((reaction) => reaction.data.body.active);
  }

  _getInactiveReactions(): Message<any>[] {
    return Array.from(this._reactions.values()).filter((reaction) => !reaction.data.body.active);
  }
  _reset(): void {
    this._reactions = new Map();
  }
}

export default ReactionSet;
