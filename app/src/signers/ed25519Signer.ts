import { SignatureScheme } from '@hub/flatbuffers';
import { getPublicKeySync, signMessageHash } from '~/flatbuffers/utils/ed25519';
import { HubAsyncResult } from '~/utils/hubErrors';
import { Signer } from './signer';

class Ed25519Signer extends Signer {
  /** 20-byte wallet address */
  public declare readonly signerKey: Uint8Array;

  constructor(privateKey: Uint8Array) {
    super(SignatureScheme.Ed25519, privateKey, getPublicKeySync(privateKey));
  }

  /** generates 256-bit signature from an EdDSA key pair */
  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return signMessageHash(hash, this.privateKey);
  }
}

export default Ed25519Signer;
