import { SignatureScheme } from '@hub/flatbuffers';
import * as ed from '@noble/ed25519';
import { ok } from 'neverthrow';
import { HubAsyncResult } from '~/utils/hubErrors';
import { hexStringToBytes } from '../utils/bytes';
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
    const signature = await ed.sign(new Uint8Array(hash), this.privateKey);
    return ok(signature);
  }
}

export default Ed25519MessageSigner;
