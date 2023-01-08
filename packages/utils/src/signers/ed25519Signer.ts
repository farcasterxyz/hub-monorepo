import { SignatureScheme } from '@hub/flatbuffers';
import { bytesToHexString } from '../bytes';
import { ed25519 } from '../crypto';
import { HubAsyncResult } from '../errors';
import { Signer } from './signer';

export class Ed25519Signer implements Signer {
  public readonly scheme = SignatureScheme.Ed25519;

  /** 20-byte wallet address */
  public readonly signerKey: Uint8Array;
  public readonly signerKeyHex: string;

  private readonly _privateKey: Uint8Array;

  constructor(privateKey: Uint8Array) {
    this._privateKey = privateKey;
    this.signerKey = ed25519.getPublicKeySync(privateKey);

    const publicKeyHex = bytesToHexString(this.signerKey, { size: 64 });
    if (publicKeyHex.isErr()) {
      throw publicKeyHex.error;
    }
    this.signerKeyHex = publicKeyHex.value;
  }

  /** generates 256-bit signature from an EdDSA key pair */
  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return ed25519.signMessageHash(hash, this._privateKey);
  }
}
