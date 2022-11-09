import { ResultAsync } from 'neverthrow';
import ReactionDB from '~/storage/db/reaction';
import RocksDB from '~/storage/db/rocksdb';
import { BadRequestError } from '~/utils/errors';
import { Reaction, ReactionAdd, ReactionRemove, URI } from '~/types';
import { isReactionAdd, isReactionRemove } from '~/types/typeguards';
import { hashCompare } from '~/utils/crypto';
import { MessageDBEvents } from '~/storage/db/message';

/**
 * ReactionSet is a modified LWW set that stores and fetches reactions. ReactionAdd and ReactionRemove messages are
 * stored in the ReactionDB.
 *
 * Conflicts between two reaction messages are resolved in this order (see reactionMessageCompare for implementation):
 * 1. Later timestamp wins
 * 2. ReactionRemove > ReactionAdd
 * 3. Higher message hash lexicographic order wins
 */
class ReactionSet {
  private _db: ReactionDB;

  constructor(db: RocksDB) {
    this._db = new ReactionDB(db);
  }

  /** Get a reaction by its targetURI */
  getReaction(fid: number, targetUri: URI): Promise<ReactionAdd> {
    return this._db.getReactionAdd(fid, targetUri);
  }

  async getReactionsByUser(fid: number): Promise<Set<ReactionAdd>> {
    const reactions = await this._db.getReactionAddsByUser(fid);
    return new Set(reactions);
  }

  async getAllReactionMessagesByUser(fid: number): Promise<Set<Reaction>> {
    const messages = await this._db.getAllReactionMessagesByUser(fid);
    return new Set(messages);
  }

  async revokeSigner(fid: number, signer: string): Promise<void> {
    return this._db.deleteAllReactionMessagesBySigner(fid, signer);
  }

  // TODO: add query API

  /** Merge a new message into the set */
  async merge(message: Reaction): Promise<void> {
    if (isReactionAdd(message)) {
      return this.mergeReactionAdd(message);
    }

    if (isReactionRemove(message)) {
      return this.mergeReactionRemove(message);
    }

    throw new BadRequestError('ReactionSet.merge: invalid message format');
  }

  onDBEvent<E extends keyof MessageDBEvents>(event: E, callback: MessageDBEvents[E]) {
    this._db.on(event, callback);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

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

  /** mergeReactionAdd tries to add a ReactionAdd message to the set */
  private async mergeReactionAdd(message: ReactionAdd): Promise<void> {
    const { targetUri } = message.data.body;
    const { fid } = message.data;

    // Check if the target has already been reacted to
    const existingReactionAdd = await ResultAsync.fromPromise(this._db.getReactionAdd(fid, targetUri), () => undefined);
    if (existingReactionAdd.isOk() && this.reactionMessageCompare(message, existingReactionAdd.value) <= 0) {
      return undefined;
    }

    // Check if the target has already had a reaction removed
    const existingReactionRemove = await ResultAsync.fromPromise(
      this._db.getReactionRemove(fid, targetUri),
      () => undefined
    );
    if (existingReactionRemove.isOk() && this.reactionMessageCompare(message, existingReactionRemove.value) <= 0) {
      return undefined;
    }

    // Add the message to adds
    return this._db.putReactionAdd(message);
  }

  /** mergeReactionRemove tries to add a ReactionRemove message to the set */
  private async mergeReactionRemove(message: ReactionRemove): Promise<void> {
    const { targetUri } = message.data.body;
    const { fid } = message.data;

    // Check if the target has already had a reaction removed
    const existingReactionRemove = await ResultAsync.fromPromise(
      this._db.getReactionRemove(fid, targetUri),
      () => undefined
    );
    if (existingReactionRemove.isOk() && this.reactionMessageCompare(message, existingReactionRemove.value) <= 0) {
      return undefined;
    }

    // Check if the target has already been reacted to
    const existingReactionAdd = await ResultAsync.fromPromise(this._db.getReactionAdd(fid, targetUri), () => undefined);
    if (existingReactionAdd.isOk() && this.reactionMessageCompare(message, existingReactionAdd.value) <= 0) {
      return undefined;
    }

    // Add the message to removes
    return this._db.putReactionRemove(message);
  }
}

export default ReactionSet;
