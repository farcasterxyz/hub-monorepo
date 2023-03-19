import { SignatureScheme } from '@farcaster/protobufs';
import { HubAsyncResult } from '../errors';

export interface Signer {
  readonly scheme: SignatureScheme;

  getSignerKey(): HubAsyncResult<Uint8Array>;
  signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array>;
}
