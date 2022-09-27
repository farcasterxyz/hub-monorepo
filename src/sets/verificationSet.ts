import { ResultAsync } from 'neverthrow';
import RocksDB from '~/db/rocksdb';
import VerificationDB from '~/db/verification';
import { BadRequestError } from '~/errors';
import { Verification, VerificationEthereumAddress, VerificationRemove } from '~/types';
import { isVerificationEthereumAddress, isVerificationRemove } from '~/types/typeguards';
import { hashCompare } from '~/utils';

/**
 * VerificationSet is a modified LWW set that stores and fetches verifications. VerificationEthereumAddress and VerificationRemove
 * messages are stored in the VerificationDB.
 *
 * Conflicts between two verification messages are resolved in this order (see verificationMessageCompare for implementation):
 * 1. Later timestamp wins
 * 2. VerificationRemove > VerificationEthereumAddress
 * 3. Higher message hash lexicographic order wins
 */
class VerificationSet {
  private _db: VerificationDB;

  constructor(db: RocksDB) {
    this._db = new VerificationDB(db);
  }

  getVerification(fid: number, claimHash: string): Promise<VerificationEthereumAddress> {
    return this._db.getVerificationAdd(fid, claimHash);
  }

  async getVerificationsByUser(fid: number): Promise<Set<VerificationEthereumAddress>> {
    const verifications = await this._db.getVerificationAddsByUser(fid);
    return new Set(verifications);
  }

  async getAllVerificationMessagesByUser(fid: number): Promise<Set<Verification>> {
    const messages = await this._db.getAllVerificationMessagesByUser(fid);
    return new Set(messages);
  }

  async revokeSigner(fid: number, signer: string): Promise<void> {
    return this._db.deleteAllVerificationMessagesBySigner(fid, signer);
  }

  async merge(message: Verification): Promise<void> {
    if (isVerificationRemove(message)) {
      return this.mergeRemove(message);
    }

    if (isVerificationEthereumAddress(message)) {
      return this.mergeAdd(message);
    }

    throw new BadRequestError('VerificationSet.merge: invalid message format');
  }

  /**
   * Private Methods
   */

  private verificationMessageCompare(a: Verification, b: Verification): number {
    // If they are the same message, return 0
    if (a.hash === b.hash) return 0;

    // Compare signedAt timestamps
    if (a.data.signedAt > b.data.signedAt) {
      return 1;
    } else if (a.data.signedAt < b.data.signedAt) {
      return -1;
    }

    // Compare message types (remove > add)
    if (isVerificationRemove(a) && isVerificationEthereumAddress(b)) {
      return 1;
    } else if (isVerificationEthereumAddress(a) && isVerificationRemove(b)) {
      return -1;
    }

    // Compare lexicographical order of hash
    return hashCompare(a.hash, b.hash);
  }

  private async mergeAdd(message: VerificationEthereumAddress): Promise<void> {
    const { claimHash } = message.data.body;
    const { fid } = message.data;

    const existingAdd = await ResultAsync.fromPromise(this._db.getVerificationAdd(fid, claimHash), () => undefined);
    if (existingAdd.isOk() && this.verificationMessageCompare(message, existingAdd.value) <= 0) {
      return undefined;
    }

    const existingRemove = await ResultAsync.fromPromise(
      this._db.getVerificationRemove(fid, claimHash),
      () => undefined
    );
    if (existingRemove.isOk() && this.verificationMessageCompare(message, existingRemove.value) <= 0) {
      return undefined;
    }

    return this._db.putVerificationAdd(message);
  }

  private async mergeRemove(message: VerificationRemove): Promise<void> {
    const { claimHash } = message.data.body;
    const { fid } = message.data;

    const existingRemove = await ResultAsync.fromPromise(
      this._db.getVerificationRemove(fid, claimHash),
      () => undefined
    );
    if (existingRemove.isOk() && this.verificationMessageCompare(message, existingRemove.value) <= 0) {
      return undefined;
    }

    const existingAdd = await ResultAsync.fromPromise(this._db.getVerificationAdd(fid, claimHash), () => undefined);
    if (existingAdd.isOk() && this.verificationMessageCompare(message, existingAdd.value) <= 0) {
      return undefined;
    }

    return this._db.putVerificationRemove(message);
  }
}

export default VerificationSet;
