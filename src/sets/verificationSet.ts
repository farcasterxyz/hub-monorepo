import { Result, ok, err } from 'neverthrow';
import { Verification, VerificationEthereumAddress, VerificationRemove } from '~/types';
import { isVerificationEthereumAddress, isVerificationRemove } from '~/types/typeguards';
import { hashCompare, sanitizeSigner } from '~/utils';

class VerificationSet {
  /** Both maps indexed by claimHash */
  private _adds: Map<string, VerificationEthereumAddress>;
  private _removes: Map<string, VerificationRemove>;

  constructor() {
    this._adds = new Map();
    this._removes = new Map();
  }

  /** Get a verification by its claimHash */
  get(claimHash: string): Verification | undefined {
    return this._adds.get(claimHash) || this._removes.get(claimHash);
  }

  // TODO: add query API

  merge(message: Verification): Result<void, string> {
    if (isVerificationRemove(message)) {
      return this.remove(message);
    }

    if (isVerificationEthereumAddress(message)) {
      return this.add(message);
    }

    return err('VerificationSet.merge: invalid message format');
  }

  revokeSigner(signer: string): Result<void, string> {
    // Look through adds
    for (const [claimHash, verification] of this._adds) {
      if (sanitizeSigner(verification.signer) === sanitizeSigner(signer)) {
        this._adds.delete(claimHash);
      }
    }

    // Look through removes
    for (const [claimHash, verification] of this._removes) {
      if (sanitizeSigner(verification.signer) === sanitizeSigner(signer)) {
        this._removes.delete(claimHash);
      }
    }

    return ok(undefined);
  }

  getAllMessages(): Set<Verification> {
    return new Set([Array.from(this._adds.values()), Array.from(this._removes.values())].flat());
  }

  /**
   * Private Methods
   */

  private add(message: VerificationEthereumAddress): Result<void, string> {
    const { claimHash } = message.data.body;

    const existingAdd = this._adds.get(claimHash);
    if (existingAdd) {
      if (existingAdd.data.signedAt > message.data.signedAt) return ok(undefined);

      if (existingAdd.data.signedAt === message.data.signedAt && hashCompare(existingAdd.hash, message.hash) >= 0)
        return ok(undefined);
    }

    const existingRemove = this._removes.get(claimHash);
    if (existingRemove) {
      if (existingRemove.data.signedAt >= message.data.signedAt) return ok(undefined);
      this._removes.delete(claimHash);
    }

    this._adds.set(claimHash, message);
    return ok(undefined);
  }

  private remove(message: VerificationRemove): Result<void, string> {
    const { claimHash } = message.data.body;

    const existingRemove = this._removes.get(claimHash);
    if (existingRemove) {
      if (existingRemove.data.signedAt > message.data.signedAt) return ok(undefined);

      if (existingRemove.data.signedAt === message.data.signedAt && hashCompare(existingRemove.hash, message.hash) >= 0)
        return ok(undefined);
    }

    const existingAdd = this._adds.get(claimHash);
    if (existingAdd) {
      if (existingAdd.data.signedAt > message.data.signedAt) return ok(undefined);
      this._adds.delete(claimHash);
    }

    this._removes.set(claimHash, message);
    return ok(undefined);
  }

  /**
   * Testing Methods
   */

  _getAdds(): Set<VerificationEthereumAddress> {
    return new Set([...this._adds.values()]);
  }

  _getRemoves(): Set<VerificationRemove> {
    return new Set([...this._removes.values()]);
  }

  _reset(): void {
    this._adds = new Map();
    this._removes = new Map();
  }
}

export default VerificationSet;
