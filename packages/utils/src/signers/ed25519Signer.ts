import { SignatureScheme } from '@farcaster/protobufs';
import { bytesToHexString } from '../bytes';
import { ed25519 } from '../crypto';
import { HubAsyncResult, HubResult } from '../errors';
import { Signer } from './signer';

export class Ed25519Signer implements Signer {
  public readonly scheme = SignatureScheme.SIGNATURE_SCHEME_ED25519;

  /** 20-byte wallet address */
  public readonly signerKey: Uint8Array;
  public readonly signerKeyHex: string;

  private readonly _privateKey: Uint8Array;

  public static fromPrivateKey(privateKey: Uint8Array): HubResult<Ed25519Signer> {
    const signerKey = ed25519.getPublicKeySync(privateKey);
    return bytesToHexString(signerKey).map((signerKeyHex) => {
      return new this(privateKey, signerKey, signerKeyHex);
    });
  }

  constructor(privateKey: Uint8Array, signerKey: Uint8Array, signerKeyHex: string) {
    this._privateKey = privateKey;
    this.signerKey = signerKey;
    this.signerKeyHex = signerKeyHex;
  }

  /** generates 256-bit signature from an EdDSA key pair */
  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return ed25519.signMessageHash(hash, this._privateKey);
  }
}
