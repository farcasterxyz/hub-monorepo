import { SignatureScheme } from '@hub/flatbuffers';
import { signMessageHash } from '~/flatbuffers/utils/ed25519';
import { HubAsyncResult } from '~/utils/hubErrors';
import { Signer } from './types';

class Ed25519Signer implements Signer {
  /** 32-byte public key */
  public signerKey: string;
  public scheme = SignatureScheme.Ed25519;
  public privateKey: Uint8Array;

  constructor(privateKey: Uint8Array, signerKey: string) {
    this.privateKey = privateKey;
    this.signerKey = signerKey;
  }

  /** generates 256-bit signature from an EdDSA key pair */
  public async sign(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return signMessageHash(hash, this.privateKey);
  }
}

export default Ed25519Signer;
