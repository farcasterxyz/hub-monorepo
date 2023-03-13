import { SignatureScheme } from '@farcaster/protobufs';
import { ok } from 'neverthrow';
import { ed25519 } from '../crypto';
import { HubAsyncResult, HubResult } from '../errors';
import { Signer } from './signer';

export class Ed25519Signer implements Signer {
  /** Signature scheme as defined in protobufs */
  public readonly scheme = SignatureScheme.ED25519;

  /** 32-byte EdDSA public key */
  public readonly signerKey: Uint8Array;

  private readonly _privateKey: Uint8Array;

  public static fromPrivateKey(privateKey: Uint8Array): HubResult<Ed25519Signer> {
    const signerKey = ed25519.getPublicKeySync(privateKey);
    return ok(new this(privateKey, signerKey));
  }

  constructor(privateKey: Uint8Array, signerKey: Uint8Array) {
    this._privateKey = privateKey;
    this.signerKey = signerKey;
  }

  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return ed25519.signMessageHash(hash, this._privateKey);
  }
}
