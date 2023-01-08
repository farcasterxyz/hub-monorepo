import { SignatureScheme } from '@hub/flatbuffers';
import { HubAsyncResult } from '../errors';

export interface Signer {
  readonly scheme: SignatureScheme;
  readonly signerKey: Uint8Array;
  readonly signerKeyHex: string;

  signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array>;
}
