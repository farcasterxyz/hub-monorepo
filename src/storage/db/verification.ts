import { ResultAsync } from 'neverthrow';
import MessageDB from '~/storage/db/message';
import { Transaction } from '~/storage/db/rocksdb';
import { MessageType, Verification, VerificationEthereumAddress, VerificationRemove } from '~/types';

/**
 * VerificationDB extends MessageDB and provides methods for getting, putting, and deleting reaction messages
 * from a RocksDB instance.
 *
 * Verifications are stored in this schema:
 * - <extends message schema>
 * - fid!<fid>!verificationAdds!<claimHash>: <VerificationEthereumAddress hash>
 * - fid!<fid>!verificationRemoves!<claimHash>: <VerificationRemove hash>
 *
 * Note that the VerificationDB implements the constraint that a single claimHash can only exist in either verificationAdds
 * or verificationRemoves. Therefore, _putVerificationAdd also deletes the VerificationRemove for the same target and
 * _putVerificationRemove also deletes the VerificationEthereumAddress for the same target. The VerificationDB does not resolve
 * conflicts between two verification messages with the same claimHash. The VerificationStore should be used to handle conflicts and
 * decide whether or not to perform a mutation.
 */
class VerificationDB extends MessageDB {
  async getVerificationAdd(fid: number, claimHash: string): Promise<VerificationEthereumAddress> {
    const messageHash = await this._db.get(this.verificationAddsKey(fid, claimHash));
    return this.getMessage<VerificationEthereumAddress>(messageHash);
  }

  async getVerificationRemove(fid: number, claimHash: string): Promise<VerificationRemove> {
    const messageHash = await this._db.get(this.verificationRemovesKey(fid, claimHash));
    return this.getMessage<VerificationRemove>(messageHash);
  }

  async getVerificationAddsByUser(fid: number): Promise<VerificationEthereumAddress[]> {
    const hashes = await this.getMessageHashesByPrefix(this.verificationAddsPrefix(fid));
    return this.getMessages<VerificationEthereumAddress>(hashes);
  }

  async getVerificationRemovesByUser(fid: number): Promise<VerificationRemove[]> {
    const hashes = await this.getMessageHashesByPrefix(this.verificationRemovesPrefix(fid));
    return this.getMessages<VerificationRemove>(hashes);
  }

  async getAllVerificationMessagesByUser(fid: number): Promise<Verification[]> {
    const prefix = `fid!${fid}!verification`;
    const hashes = await this.getMessageHashesByPrefix(prefix);
    return this.getMessages<Verification>(hashes);
  }

  async deleteAllVerificationMessagesBySigner(fid: number, signer: string): Promise<void> {
    const tsx = await this._deleteAllVerificationMessagesBySigner(this._db.transaction(), fid, signer);
    return this._db.commit(tsx);
  }

  async putVerificationAdd(verification: VerificationEthereumAddress): Promise<void> {
    const tsx = await this._putVerificationAdd(this._db.transaction(), verification);
    return this._db.commit(tsx);
  }

  async deleteVerificationAdd(fid: number, claimHash: string): Promise<void> {
    const verificationAdd = await this.getVerificationAdd(fid, claimHash);
    const tsx = this._deleteVerificationAdd(this._db.transaction(), verificationAdd);
    return this._db.commit(tsx);
  }

  async putVerificationRemove(verificationRemove: VerificationRemove): Promise<void> {
    const tsx = await this._putVerificationRemove(this._db.transaction(), verificationRemove);
    return this._db.commit(tsx);
  }

  async deleteVerificationRemove(fid: number, claimHash: string): Promise<void> {
    const verificationRemove = await this.getVerificationRemove(fid, claimHash);
    const tsx = this._deleteVerificationRemove(this._db.transaction(), verificationRemove);
    return this._db.commit(tsx);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Private Key Methods                            */
  /* -------------------------------------------------------------------------- */

  private verificationAddsPrefix(fid: number) {
    return `fid!${fid}!verificationAdds!`;
  }

  private verificationAddsKey(fid: number, claimHash: string) {
    return this.verificationAddsPrefix(fid) + claimHash;
  }

  private verificationRemovesPrefix(fid: number) {
    return `fid!${fid}!verificationRemoves!`;
  }

  private verificationRemovesKey(fid: number, claimHash: string) {
    return this.verificationRemovesPrefix(fid) + claimHash;
  }

  /* -------------------------------------------------------------------------- */
  /*                         Private Transaction Methods                        */
  /* -------------------------------------------------------------------------- */

  private async _putVerificationAdd(tsx: Transaction, verification: VerificationEthereumAddress): Promise<Transaction> {
    tsx = this._putMessage(tsx, verification);

    // Add to verificationAdds
    tsx.put(this.verificationAddsKey(verification.data.fid, verification.data.body.claimHash), verification.hash);

    // Delete from verificationRemoves
    const verificationRemove = await ResultAsync.fromPromise(
      this.getVerificationRemove(verification.data.fid, verification.data.body.claimHash),
      () => undefined
    );
    if (verificationRemove.isOk()) {
      tsx = this._deleteVerificationRemove(tsx, verificationRemove.value);
    }

    return tsx;
  }

  private _deleteVerificationAdd(tsx: Transaction, verification: VerificationEthereumAddress): Transaction {
    // Delete from verificationAdds
    tsx = tsx.del(this.verificationAddsKey(verification.data.fid, verification.data.body.claimHash));

    // Delete message
    return this._deleteMessage(tsx, verification);
  }

  private async _putVerificationRemove(tsx: Transaction, verificationRemove: VerificationRemove): Promise<Transaction> {
    tsx = this._putMessage(tsx, verificationRemove);

    const verificationAdd = await ResultAsync.fromPromise(
      this.getVerificationAdd(verificationRemove.data.fid, verificationRemove.data.body.claimHash),
      () => undefined
    );
    if (verificationAdd.isOk()) {
      tsx = tsx.del(this.verificationAddsKey(verificationRemove.data.fid, verificationRemove.data.body.claimHash));
    }

    // Add to verificationRemoves
    return tsx.put(
      this.verificationRemovesKey(verificationRemove.data.fid, verificationRemove.data.body.claimHash),
      verificationRemove.hash
    );
  }

  private _deleteVerificationRemove(tsx: Transaction, verificationRemove: VerificationRemove): Transaction {
    tsx = tsx.del(this.verificationRemovesKey(verificationRemove.data.fid, verificationRemove.data.body.claimHash));
    return this._deleteMessage(tsx, verificationRemove);
  }

  private async _deleteAllVerificationMessagesBySigner(
    tsx: Transaction,
    fid: number,
    signer: string
  ): Promise<Transaction> {
    const verificationAdds = await this.getMessagesBySigner<VerificationEthereumAddress>(
      fid,
      signer,
      MessageType.VerificationEthereumAddress
    );
    for (const add of verificationAdds) {
      tsx = this._deleteVerificationAdd(tsx, add);
    }
    const verificationRemoves = await this.getMessagesBySigner<VerificationRemove>(
      fid,
      signer,
      MessageType.VerificationRemove
    );
    for (const remove of verificationRemoves) {
      tsx = this._deleteVerificationRemove(tsx, remove);
    }
    return tsx;
  }
}

export default VerificationDB;
