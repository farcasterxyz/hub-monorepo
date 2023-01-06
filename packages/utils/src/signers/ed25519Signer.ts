import { SignatureScheme } from '@hub/flatbuffers';
import { HubAsyncResult } from '@hub/utils';
import { ed25519 } from '../crypto';
import { Signer } from './signer';

export class Ed25519Signer extends Signer {
  /** 20-byte wallet address */
  public declare readonly signerKey: Uint8Array;

  constructor(privateKey: Uint8Array) {
    super(SignatureScheme.Ed25519, privateKey, ed25519.getPublicKeySync(privateKey));
  }

  /** generates 256-bit signature from an EdDSA key pair */
  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return ed25519.signMessageHash(hash, this.privateKey);
  }
}
