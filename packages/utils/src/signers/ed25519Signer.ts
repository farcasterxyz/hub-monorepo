import { SignatureScheme } from '@hub/flatbuffers';
import { bytesToHexString } from '../bytes';
import { ed25519 } from '../crypto';
import { HubAsyncResult } from '../errors';
import { Signer } from './signer';

export class Ed25519Signer extends Signer {
  /** 32-byte public key */
  public declare readonly signerKey: Uint8Array;
  public readonly privateKey: Uint8Array;

  constructor(privateKey: Uint8Array) {
    const publicKeyBytes = ed25519.getPublicKeySync(privateKey);
    const publicKeyHex = bytesToHexString(publicKeyBytes, { size: 64 });
    if (publicKeyHex.isErr()) {
      throw publicKeyHex.error;
    }
    super(SignatureScheme.Ed25519, publicKeyBytes, publicKeyHex.value);
    this.privateKey = privateKey;
  }

  /** generates 256-bit signature from an EdDSA key pair */
  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return ed25519.signMessageHash(hash, this.privateKey);
  }
}
