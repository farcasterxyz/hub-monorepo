import { Result, ok, err } from 'neverthrow';
import { Verification, VerificationAdd, VerificationRemove } from '~/types';
import { isVerificationAdd, isVerificationRemove } from '~/types/typeguards';
import { hashCompare } from '~/utils';

class VerificationSet {
  /** Both maps indexed by claimHash */
  private _adds: Map<string, VerificationAdd>;
  private _removes: Map<string, VerificationRemove>;

  constructor() {
    this._adds = new Map();
    this._removes = new Map();
  }

  /** Get a verification by its claimHash */
  get(claimHash: string): Verification | undefined {
    return this._adds.get(claimHash) || this._removes.get(claimHash);
  }

  /** Get claimHashes of all active verifications */
  getClaimHashes(): string[] {
    return Array.from(this._adds.keys());
  }

  /** Get claimHashes of all verifications (both adds and removes) */
  getAllHashes(): string[] {
    return [...this.getClaimHashes(), ...Array.from(this._removes.keys())];
  }

  /** Helper to get externalAddressURIs that are currently verified */
  getVerifiedExternalAddressURIs(): string[] {
    return Array.from(this._adds.values()).map((message) => message.data.body.externalAddressUri);
  }

  merge(message: Verification): Result<void, string> {
    if (isVerificationRemove(message)) {
      return this.remove(message);
    }

    if (isVerificationAdd(message)) {
      return this.add(message);
    }

    return err('VerificationSet.merge: invalid message format');
  }

  /**
   * Private Methods
   */

  private add(message: VerificationAdd): Result<void, string> {
    const {
      data: {
        body: { claimHash },
        signedAt,
      },
      hash,
    } = message;

    const existingRemove = this._removes.get(claimHash);
    if (existingRemove && existingRemove.data.signedAt >= signedAt) {
      return err('VerificationSet.add: verification is already removed');
    }

    const existingAdd = this._adds.get(claimHash);
    if (existingAdd) {
      if (existingAdd.hash === hash) {
        return err('VerificationSet.add: duplicate message');
      }

      if (existingAdd.data.signedAt > signedAt) {
        return err('VerificationSet.add: verification is already added');
      }

      if (existingAdd.data.signedAt === signedAt && hashCompare(existingAdd.hash, hash) > 0) {
        return err('VerificationSet.add: verification is already added with higher lexicographical hash');
      }
    }

    if (existingRemove) {
      this._removes.delete(claimHash);
    }

    this._adds.set(claimHash, message);
    return ok(undefined);
  }

  // TODO: handle edge cases
  private remove(message: VerificationRemove): Result<void, string> {
    const {
      data: {
        body: { claimHash },
        signedAt,
      },
      hash,
    } = message;

    const existingRemove = this._removes.get(claimHash);
    if (existingRemove) {
      if (existingRemove.hash === hash) {
        return err('VerificationSet.remove: duplicate message');
      }

      if (existingRemove.data.signedAt > signedAt) {
        return err('VerificationSet.remove: verification is already removed');
      }

      if (existingRemove.data.signedAt === signedAt && hashCompare(existingRemove.hash, hash) > 0) {
        return err('VerificationSet.remove: verification is already removed with higher lexiocographical hash');
      }
    }

    const existingAdd = this._adds.get(claimHash);
    if (existingAdd && existingAdd.data.signedAt > signedAt) {
      return err('VerificationSet.remove: verification has already been re-added');
    }

    if (existingAdd) {
      this._adds.delete(claimHash);
    }

    this._removes.set(claimHash, message);
    return ok(undefined);
  }

  /**
   * Testing Methods
   */

  _getAdds(): VerificationAdd[] {
    return Array.from(this._adds.values());
  }

  _getRemoves(): VerificationRemove[] {
    return Array.from(this._removes.values());
  }

  _reset(): void {
    this._adds = new Map();
    this._removes = new Map();
  }
}

export default VerificationSet;
