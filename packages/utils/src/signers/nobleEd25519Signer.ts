import { ed25519 } from '../crypto';
import { Ed25519Signer } from './ed25519Signer';

export class NobleEd25519Signer extends Ed25519Signer {
  private readonly _privateKey: Uint8Array;

  constructor(privateKey: Uint8Array) {
    super();
    this._privateKey = privateKey;
  }

  public async getSignerKey(): Promise<Uint8Array> {
    const result = await ed25519.getPublicKey(this._privateKey);
    if (result.isErr()) throw result.error;
    return result.value;
  }

  public async signMessageHash(hash: Uint8Array): Promise<Uint8Array> {
    const result = await ed25519.signMessageHash(hash, this._privateKey);
    if (result.isErr()) throw result.error;
    return result.value;
  }
}
