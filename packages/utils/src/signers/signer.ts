import { SignatureScheme } from '@hub/flatbuffers';
import { HubAsyncResult } from '../errors';

export abstract class Signer {
  public readonly scheme: SignatureScheme;
  public readonly signerKey: Uint8Array;
  public readonly signerKeyHex: string;
  public readonly privateKey: Uint8Array;

  constructor(scheme: SignatureScheme, privateKey: Uint8Array, signerKey: Uint8Array, signerKeyHex: string) {
    this.scheme = scheme;
    this.privateKey = privateKey;
    this.signerKey = signerKey;
    this.signerKeyHex = signerKeyHex;
  }

  public abstract signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array>;
}
