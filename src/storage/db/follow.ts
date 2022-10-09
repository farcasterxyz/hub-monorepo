import { ResultAsync } from 'neverthrow';
import { Transaction } from '~/storage/db/rocksdb';
import { Follow, FollowAdd, FollowRemove, MessageType } from '~/types';
import MessageDB from '~/storage/db/message';

/**
 * FollowDB extends MessageDB and provides methods for getting, putting, and deleting follow messages
 * from a RocksDB instance.
 *
 * Follows are stored in this schema:
 * - <extends message schema>
 * - fid!<fid>!followAdds!<target>: <FollowAdd hash>
 * - fid!<fid>!followRemoves!<target>: <FollowRemove hash>
 * - followAddsByTarget!<target>!<hash>: <FollowAdd hash>
 *
 * Note that the FollowDB implements the constraint that a single target can only exist in either followAdds
 * or followRemoves. Therefore, _putFollowAdd also deletes the FollowRemove for the same target and _putFollowRemove
 * also deletes the FollowAdd for the same target. The FollowDB does not resolve conflicts between two follow
 * messages with the same target. The FollowSet should be used to handle conflicts and decide whether or not to
 * perform a mutation.
 */
class FollowDB extends MessageDB {
  async getFollowAdd(fid: number, target: string): Promise<FollowAdd> {
    const messageHash = await this._db.get(this.followAddsKey(fid, target));
    return this.getMessage<FollowAdd>(messageHash);
  }

  async getFollowRemove(fid: number, target: string): Promise<FollowRemove> {
    const messageHash = await this._db.get(this.followRemovesKey(fid, target));
    return this.getMessage<FollowRemove>(messageHash);
  }

  async getFollowAddsByUser(fid: number): Promise<FollowAdd[]> {
    const hashes = await this.getMessageHashesByPrefix(this.followAddsPrefix(fid));
    return this.getMessages<FollowAdd>(hashes);
  }

  async getFollowRemovesByUser(fid: number): Promise<FollowRemove[]> {
    const hashes = await this.getMessageHashesByPrefix(this.followRemovesPrefix(fid));
    return this.getMessages<FollowRemove>(hashes);
  }

  async getFollowAddsByTarget(target: string): Promise<FollowAdd[]> {
    const hashes = await this.getMessageHashesByPrefix(this.followAddsByTargetPrefix(target));
    return this.getMessages<FollowAdd>(hashes);
  }

  async getAllFollowMessagesByUser(fid: number): Promise<Follow[]> {
    const prefix = `fid!${fid}!follow`;
    const hashes = await this.getMessageHashesByPrefix(prefix);
    return this.getMessages<Follow>(hashes);
  }

  async deleteAllFollowMessagesBySigner(fid: number, signer: string): Promise<void> {
    const tsx = await this._deleteAllFollowMessagesBySigner(this._db.transaction(), fid, signer);
    return this._db.commit(tsx);
  }

  async putFollowAdd(follow: FollowAdd): Promise<void> {
    const tsx = await this._putFollowAdd(this._db.transaction(), follow);
    return this._db.commit(tsx);
  }

  async deleteFollowAdd(fid: number, target: string): Promise<void> {
    const followAdd = await this.getFollowAdd(fid, target);
    const tsx = this._deleteFollowAdd(this._db.transaction(), followAdd);
    return this._db.commit(tsx);
  }

  async putFollowRemove(followRemove: FollowRemove): Promise<void> {
    const tsx = await this._putFollowRemove(this._db.transaction(), followRemove);
    return this._db.commit(tsx);
  }

  async deleteFollowRemove(fid: number, target: string): Promise<void> {
    const followRemove = await this.getFollowRemove(fid, target);
    const tsx = this._deleteFollowRemove(this._db.transaction(), followRemove);
    return this._db.commit(tsx);
  }

  /** Private key methods */

  private followAddsPrefix(fid: number) {
    return `fid!${fid}!followAdds!`;
  }

  private followAddsKey(fid: number, target: string) {
    return this.followAddsPrefix(fid) + target;
  }

  private followRemovesPrefix(fid: number) {
    return `fid!${fid}!followRemoves!`;
  }

  private followRemovesKey(fid: number, target: string) {
    return this.followRemovesPrefix(fid) + target;
  }

  private followAddsByTargetPrefix(target: string) {
    return `followAddsByTarget!${target}!`;
  }

  private followAddsByTargetKey(target: string, hash: string) {
    return this.followAddsByTargetPrefix(target) + hash;
  }

  /** Private transaction methods */

  private async _putFollowAdd(tsx: Transaction, follow: FollowAdd): Promise<Transaction> {
    tsx = this._putMessage(tsx, follow);

    // Add to followAdds
    tsx.put(this.followAddsKey(follow.data.fid, follow.data.body.targetUri), follow.hash);

    // Delete from followRemoves
    const followRemove = await ResultAsync.fromPromise(
      this.getFollowRemove(follow.data.fid, follow.data.body.targetUri),
      () => undefined
    );
    if (followRemove.isOk()) {
      tsx = this._deleteFollowRemove(tsx, followRemove.value);
    }

    // Index by target

    tsx = tsx.put(this.followAddsByTargetKey(follow.data.body.targetUri, follow.hash), follow.hash);

    return tsx;
  }

  private _deleteFollowAdd(tsx: Transaction, follow: FollowAdd): Transaction {
    // Delete from followAdds
    tsx = tsx.del(this.followAddsKey(follow.data.fid, follow.data.body.targetUri));

    // Delete from followAddsByTarget index
    tsx = tsx.del(this.followAddsByTargetKey(follow.data.body.targetUri, follow.hash));

    // Delete message
    return this._deleteMessage(tsx, follow);
  }

  private async _putFollowRemove(tsx: Transaction, followRemove: FollowRemove): Promise<Transaction> {
    tsx = this._putMessage(tsx, followRemove);

    const followAdd = await ResultAsync.fromPromise(
      this.getFollowAdd(followRemove.data.fid, followRemove.data.body.targetUri),
      () => undefined
    );
    if (followAdd.isOk()) {
      tsx = tsx.del(this.followAddsKey(followRemove.data.fid, followRemove.data.body.targetUri));
    }

    // Add to followRemoves
    return tsx.put(this.followRemovesKey(followRemove.data.fid, followRemove.data.body.targetUri), followRemove.hash);
  }

  private _deleteFollowRemove(tsx: Transaction, followRemove: FollowRemove): Transaction {
    tsx = tsx.del(this.followRemovesKey(followRemove.data.fid, followRemove.data.body.targetUri));
    return this._deleteMessage(tsx, followRemove);
  }

  private async _deleteAllFollowMessagesBySigner(tsx: Transaction, fid: number, signer: string): Promise<Transaction> {
    const followAdds = await this.getMessagesBySigner<FollowAdd>(fid, signer, MessageType.FollowAdd);
    for (const followAdd of followAdds) {
      tsx = this._deleteFollowAdd(tsx, followAdd);
    }
    const followRemoves = await this.getMessagesBySigner<FollowRemove>(fid, signer, MessageType.FollowRemove);
    for (const followRemove of followRemoves) {
      tsx = this._deleteFollowRemove(tsx, followRemove);
    }
    return tsx;
  }
}

export default FollowDB;
