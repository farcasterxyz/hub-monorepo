import { SignatureScheme } from '@hub/flatbuffers';
import { HubAsyncResult } from '~/utils/hubErrors';

export interface IMessageSigner {
  scheme: SignatureScheme;
  signerKey: Uint8Array;
  sign(hash: Uint8Array): HubAsyncResult<Uint8Array>;
}
