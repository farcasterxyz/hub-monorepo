import { SignatureScheme } from '@hub/flatbuffers';
import { HubAsyncResult } from '~/utils/hubErrors';

export interface Signer {
  scheme: SignatureScheme;
  signerKey: string;
  sign(hash: Uint8Array): HubAsyncResult<Uint8Array>;
}
