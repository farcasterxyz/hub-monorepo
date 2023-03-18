import { SignatureScheme } from '@farcaster/protobufs';

export interface Signer {
  readonly scheme: SignatureScheme;

  getSignerKey(): Promise<Uint8Array>;
  signMessageHash(hash: Uint8Array): Promise<Uint8Array>;
}
