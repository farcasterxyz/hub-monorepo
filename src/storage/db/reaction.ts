import { ResultAsync } from 'neverthrow';
import MessageDB from '~/storage/db/message';
import { Transaction } from '~/storage/db/rocksdb';
import { MessageType, Reaction, ReactionAdd, ReactionRemove } from '~/types';

/**
 * ReactionDB extends MessageDB and provides methods for getting, putting, and deleting reaction messages
 * from a RocksDB instance.
 *
 * Reactions are stored in this schema:
 * - <extends message schema>
 * - fid!<fid>!reactionAdds!<target>: <ReactionAdd hash>
 * - fid!<fid>!reactionRemoves!<target>: <ReactionRemove hash>
 * - reactionAddsByTarget!<target>!<hash>: <ReactionAdd hash>
 *
 * Note that the ReactionDB implements the constraint that a single target can only exist in either reactionAdds
 * or reactionRemoves. Therefore, _putReactionAdd also deletes the ReactionRemove for the same target and _putReactionRemove
 * also deletes the ReactionAdd for the same target. The ReactionDB does not resolve conflicts between two reaction
 * messages with the same target. The ReactionStore should be used to handle conflicts and decide whether or not to
 * perform a mutation.
 */
class ReactionDB extends MessageDB {
  async getReactionAdd(fid: number, target: string): Promise<ReactionAdd> {
    const messageHash = await this._db.get(this.reactionAddsKey(fid, target));
    return this.getMessage<ReactionAdd>(messageHash);
  }

  async getReactionRemove(fid: number, target: string): Promise<ReactionRemove> {
    const messageHash = await this._db.get(this.reactionRemovesKey(fid, target));
    return this.getMessage<ReactionRemove>(messageHash);
  }

  async getReactionAddsByUser(fid: number): Promise<ReactionAdd[]> {
    const hashes = await this.getMessageHashesByPrefix(this.reactionAddsPrefix(fid));
    return this.getMessages<ReactionAdd>(hashes);
  }

  async getreactionRemovesByUser(fid: number): Promise<ReactionRemove[]> {
    const hashes = await this.getMessageHashesByPrefix(this.reactionRemovesPrefix(fid));
    return this.getMessages<ReactionRemove>(hashes);
  }

  async getReactionAddsByTarget(target: string): Promise<ReactionAdd[]> {
    const hashes = await this.getMessageHashesByPrefix(this.reactionAddsByTargetPrefix(target));
    return this.getMessages<ReactionAdd>(hashes);
  }

  async getAllReactionMessagesByUser(fid: number): Promise<Reaction[]> {
    const prefix = `fid!${fid}!reaction`;
    const hashes = await this.getMessageHashesByPrefix(prefix);
    return this.getMessages<Reaction>(hashes);
  }

  async deleteAllReactionMessagesBySigner(fid: number, signer: string): Promise<void> {
    const tsx = await this._deleteAllReactionMessagesBySigner(this._db.transaction(), fid, signer);
    return this._db.commit(tsx);
  }

  async putReactionAdd(reaction: ReactionAdd): Promise<void> {
    const tsx = await this._putReactionAdd(this._db.transaction(), reaction);
    return this._db.commit(tsx);
  }

  async deleteReactionAdd(fid: number, target: string): Promise<void> {
    const reactionAdd = await this.getReactionAdd(fid, target);
    const tsx = this._deleteReactionAdd(this._db.transaction(), reactionAdd);
    return this._db.commit(tsx);
  }

  async putReactionRemove(reactionRemove: ReactionRemove): Promise<void> {
    const tsx = await this._putReactionRemove(this._db.transaction(), reactionRemove);
    return this._db.commit(tsx);
  }

  async deleteReactionRemove(fid: number, target: string): Promise<void> {
    const reactionRemove = await this.getReactionRemove(fid, target);
    const tsx = this._deleteReactionRemove(this._db.transaction(), reactionRemove);
    return this._db.commit(tsx);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Private Key Methods                            */
  /* -------------------------------------------------------------------------- */

  private reactionAddsPrefix(fid: number) {
    return `fid!${fid}!reactionAdds!`;
  }

  private reactionAddsKey(fid: number, target: string) {
    return this.reactionAddsPrefix(fid) + target;
  }

  private reactionRemovesPrefix(fid: number) {
    return `fid!${fid}!reactionRemoves!`;
  }

  private reactionRemovesKey(fid: number, target: string) {
    return this.reactionRemovesPrefix(fid) + target;
  }

  private reactionAddsByTargetPrefix(target: string) {
    return `reactionAddsByTarget!${target}!`;
  }

  private reactionAddsByTargetKey(target: string, hash: string) {
    return this.reactionAddsByTargetPrefix(target) + hash;
  }

  /* -------------------------------------------------------------------------- */
  /*                         Private Transaction Methods                        */
  /* -------------------------------------------------------------------------- */

  private async _putReactionAdd(tsx: Transaction, reaction: ReactionAdd): Promise<Transaction> {
    tsx = this._putMessage(tsx, reaction);

    // Add to ReactionAdds
    tsx.put(this.reactionAddsKey(reaction.data.fid, reaction.data.body.targetUri), reaction.hash);

    // Delete from reactionRemoves
    const reactionRemove = await ResultAsync.fromPromise(
      this.getReactionRemove(reaction.data.fid, reaction.data.body.targetUri),
      () => undefined
    );
    if (reactionRemove.isOk()) {
      tsx = this._deleteReactionRemove(tsx, reactionRemove.value);
    }

    // Index by target
    tsx = tsx.put(this.reactionAddsByTargetKey(reaction.data.body.targetUri, reaction.hash), reaction.hash);

    return tsx;
  }

  private _deleteReactionAdd(tsx: Transaction, reaction: ReactionAdd): Transaction {
    // Delete from ReactionAdds
    tsx = tsx.del(this.reactionAddsKey(reaction.data.fid, reaction.data.body.targetUri));

    // Delete from ReactionAddsByTarget index
    tsx = tsx.del(this.reactionAddsByTargetKey(reaction.data.body.targetUri, reaction.hash));

    // Delete message
    return this._deleteMessage(tsx, reaction);
  }

  private async _putReactionRemove(tsx: Transaction, reactionRemove: ReactionRemove): Promise<Transaction> {
    tsx = this._putMessage(tsx, reactionRemove);

    const ReactionAdd = await ResultAsync.fromPromise(
      this.getReactionAdd(reactionRemove.data.fid, reactionRemove.data.body.targetUri),
      () => undefined
    );
    if (ReactionAdd.isOk()) {
      tsx = tsx.del(this.reactionAddsKey(reactionRemove.data.fid, reactionRemove.data.body.targetUri));
    }

    // Add to reactionRemoves
    return tsx.put(
      this.reactionRemovesKey(reactionRemove.data.fid, reactionRemove.data.body.targetUri),
      reactionRemove.hash
    );
  }

  private _deleteReactionRemove(tsx: Transaction, reactionRemove: ReactionRemove): Transaction {
    tsx = tsx.del(this.reactionRemovesKey(reactionRemove.data.fid, reactionRemove.data.body.targetUri));
    return this._deleteMessage(tsx, reactionRemove);
  }

  private async _deleteAllReactionMessagesBySigner(
    tsx: Transaction,
    fid: number,
    signer: string
  ): Promise<Transaction> {
    const ReactionAdds = await this.getMessagesBySigner<ReactionAdd>(fid, signer, MessageType.ReactionAdd);
    for (const reactionAdd of ReactionAdds) {
      tsx = this._deleteReactionAdd(tsx, reactionAdd);
    }
    const reactionRemoves = await this.getMessagesBySigner<ReactionRemove>(fid, signer, MessageType.ReactionRemove);
    for (const reactionRemove of reactionRemoves) {
      tsx = this._deleteReactionRemove(tsx, reactionRemove);
    }
    return tsx;
  }
}

export default ReactionDB;
