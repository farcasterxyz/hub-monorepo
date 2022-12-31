import { SignatureScheme } from '@hub/flatbuffers';

export interface IMessageSigner {
  scheme: SignatureScheme;
  signerKey: Uint8Array;
  sign(hash: Uint8Array): Promise<Uint8Array>;
}
