import { ok } from 'neverthrow';
import { ed25519 } from '@noble/curves/ed25519';
import { HubAsyncResult } from '../errors';
import { Ed25519Signer } from './ed25519Signer';

export class NobleEd25519Signer extends Ed25519Signer {
  private readonly _privateKey: Uint8Array;

  constructor(privateKey: Uint8Array) {
    super();
    this._privateKey = privateKey;
  }

  public async getSignerKey(): HubAsyncResult<Uint8Array> {
    return ok(ed25519.getPublicKey(this._privateKey));
  }

  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return ok(ed25519.sign(hash, this._privateKey));
  }
}
