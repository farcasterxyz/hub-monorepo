import { Result, ok, err } from 'neverthrow';
import { Verification, VerificationAdd, VerificationRemove } from '~/types';
import { isVerificationAdd, isVerificationRemove } from '~/types/typeguards';

class VerificationsSet {
  private _adds: Map<string, VerificationAdd>;
  private _deletes: Map<string, VerificationRemove>;

  constructor() {
    this._adds = new Map();
    this._deletes = new Map();
  }

  /** Get a cast by its hash */
  get(hash: string): VerificationAdd | VerificationRemove | undefined {
    return this._adds.get(hash) || this._deletes.get(hash);
  }

  /** Get hashes of all active verifications */
  getHashes(): string[] {
    return Array.from(this._adds.keys());
  }

  /** Get hashes of all verifications */
  getAllHashes(): string[] {
    const keys = this.getHashes();
    keys.push(...Array.from(this._deletes.keys()));
    return keys;
  }

  merge(message: Verification): Result<void, string> {
    if (isVerificationRemove(message)) {
      return this.delete(message);
    }

    if (isVerificationAdd(message)) {
      return this.add(message);
    }

    return err('VerificationsSet.merge: invalid message format');
  }

  /**
   * Private Methods
   */

  private add(message: VerificationAdd): Result<void, string> {
    if (!isVerificationAdd(message)) {
      return err('VerificationsSet.add: invalid message format');
    }

    if (this._deletes.get(message.hash)) {
      return err('VerificationsSet.add: verification was deleted');
    }

    if (this._adds.get(message.hash)) {
      return err('VerificationsSet.add: verification is already added');
    }

    this._adds.set(message.hash, message);
    return ok(undefined);
  }

  private delete(message: VerificationRemove): Result<void, string> {
    if (!isVerificationRemove(message)) {
      return err('VerificationsSet.delete: invalid message format');
    }

    const { verificationClaimHash } = message.data.body;
    if (this._deletes.get(verificationClaimHash)) {
      return err('VerificationsSet.delete: verification is already deleted');
    }

    if (this._adds.get(verificationClaimHash)) {
      this._adds.delete(verificationClaimHash);
    }

    this._deletes.set(verificationClaimHash, message);
    return ok(undefined);
  }

  /**
   * Testing Methods
   */

  _getAdds(): VerificationAdd[] {
    return Array.from(this._adds.values());
  }

  _getDeletes(): VerificationRemove[] {
    return Array.from(this._deletes.values());
  }

  _reset(): void {
    this._adds = new Map();
    this._deletes = new Map();
  }
}

export default VerificationsSet;
