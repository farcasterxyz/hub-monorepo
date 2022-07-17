import { Result, ok, err } from 'neverthrow';
import { Verification, VerificationAdd, VerificationRemove, URI } from '~/types';
import { isVerificationAdd, isVerificationRemove } from '~/types/typeguards';
import { hashCompare } from '~/utils';

class VerificationsSet {
  /** Both maps indexed by claimHash */
  private _adds: Map<string, VerificationAdd>;
  private _deletes: Map<string, VerificationRemove>;

  constructor() {
    this._adds = new Map();
    this._deletes = new Map();
  }

  /** Get a verification by its claimHash */
  get(claimHash: string): Verification | undefined {
    return this._adds.get(claimHash) || this._deletes.get(claimHash);
  }

  /** Get claimHashes of all active verifications */
  getClaimHashes(): string[] {
    return Array.from(this._adds.keys());
  }

  /** Get claimHashes of all verifications (both added and deleted) */
  getAllHashes(): string[] {
    return [...this.getClaimHashes(), ...Array.from(this._deletes.keys())];
  }

  /** Helper to get externalAddressURIs that are currently verified */
  getVerifiedExternalAddressURIs(): string[] {
    return Array.from(this._adds.values()).map((message) => message.data.body.externalAddressUri);
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

    const {
      data: {
        body: { claimHash },
        signedAt,
      },
      hash,
    } = message;

    const existingRemove = this._deletes.get(claimHash);
    if (existingRemove && existingRemove.data.signedAt >= signedAt) {
      return err('VerificationsSet.add: verification is already deleted');
    }

    const existingAdd = this._adds.get(claimHash);
    if (existingAdd) {
      if (existingAdd.hash === hash) {
        return err('VerificationsSet.add: duplicate message');
      }

      if (existingAdd.data.signedAt > signedAt) {
        return err('VerificationsSet.add: verification is already added');
      }

      if (existingAdd.data.signedAt === signedAt && hashCompare(existingAdd.hash, hash) > 0) {
        return err('VerificationsSet.add: verification is already added with higher lexicographical hash');
      }
    }

    if (existingRemove) {
      this._deletes.delete(claimHash);
    }

    this._adds.set(claimHash, message);
    return ok(undefined);
  }

  // TODO: handle edge cases
  private delete(message: VerificationRemove): Result<void, string> {
    if (!isVerificationRemove(message)) {
      return err('VerificationsSet.delete: invalid message format');
    }

    const {
      data: {
        body: { claimHash },
        signedAt,
      },
      hash,
    } = message;

    const existingRemove = this._deletes.get(claimHash);
    if (existingRemove) {
      if (existingRemove.hash === hash) {
        return err('VerificationsSet.delete: duplicate message');
      }

      if (existingRemove.data.signedAt > signedAt) {
        return err('VerificationsSet.delete: verification is already deleted');
      }

      if (existingRemove.data.signedAt === signedAt && hashCompare(existingRemove.hash, hash) > 0) {
        return err('VerificationsSet.delete: verification is already deleted with higher lexiocographical hash');
      }
    }

    const existingAdd = this._adds.get(claimHash);
    if (existingAdd && existingAdd.data.signedAt > signedAt) {
      return err('VerificationsSet.delete: verification has already been re-added');
    }

    if (existingAdd) {
      this._adds.delete(claimHash);
    }

    this._deletes.set(claimHash, message);
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
