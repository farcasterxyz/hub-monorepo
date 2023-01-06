import { SignatureScheme } from '@hub/flatbuffers';
import { bytesToHexString } from '../bytes';
import { HubAsyncResult } from '../errors';

export abstract class Signer {
  public readonly scheme: SignatureScheme;
  public readonly signerKey: Uint8Array;
  public readonly signerKeyHex: string;
  public readonly privateKey: Uint8Array;

  constructor(scheme: SignatureScheme, privateKey: Uint8Array, signerKey: Uint8Array) {
    this.scheme = scheme;
    this.privateKey = privateKey;
    this.signerKey = signerKey;

    const signerKeyHex = bytesToHexString(signerKey);
    if (signerKeyHex.isErr()) {
      throw signerKeyHex.error;
    }
    this.signerKeyHex = signerKeyHex.value;
  }

  public abstract signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array>;
}
