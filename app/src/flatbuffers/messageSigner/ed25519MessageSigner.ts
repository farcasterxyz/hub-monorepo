import { SignatureScheme } from '@hub/flatbuffers';
import * as ed from '@noble/ed25519';
import { arrayify } from 'ethers/lib/utils';
import { IMessageSigner } from './types';

class Ed25519MessageSigner implements IMessageSigner {
  /** 32-byte public key */
  public signerKey: Uint8Array;
  public scheme = SignatureScheme.Ed25519;

  private privateKey: Uint8Array;

  constructor(privateKey: Uint8Array, signerKey: string) {
    this.privateKey = privateKey;
    this.signerKey = arrayify(signerKey);
  }

  /** generates 256-bit signature from an EdDSA key pair */
  public sign(hash: Uint8Array): Promise<Uint8Array> {
    return ed.sign(new Uint8Array(hash), this.privateKey);
  }
}

export default Ed25519MessageSigner;
