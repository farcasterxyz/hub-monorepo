import { SignatureScheme } from '@hub/flatbuffers';
import { HubAsyncResult } from '~/utils/hubErrors';
import { hexStringToBytes } from '../utils/bytes';
import { signMessageHash } from '../utils/ed25519';
import { IMessageSigner } from './types';

class Ed25519MessageSigner implements IMessageSigner {
  /** 32-byte public key */
  public signerKey: Uint8Array;
  public scheme = SignatureScheme.Ed25519;

  private privateKey: Uint8Array;

  constructor(privateKey: Uint8Array, signerKey: string) {
    this.privateKey = privateKey;
    this.signerKey = hexStringToBytes(signerKey)._unsafeUnwrap();
  }

  /** generates 256-bit signature from an EdDSA key pair */
  public async sign(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return signMessageHash(hash, this.privateKey);
  }
}

export default Ed25519MessageSigner;
