import { SignatureScheme } from '@farcaster/protobufs';
import { VerificationEthAddressClaim } from '../verifications';
import { Signer } from './signer';

/**
 * Extend this class to implement an EIP712 signer.
 */
export abstract class Eip712Signer implements Signer {
  /** Signature scheme as defined in protobufs */
  public readonly scheme = SignatureScheme.EIP712;

  public abstract getSignerKey(): Promise<Uint8Array>;
  public abstract signMessageHash(hash: Uint8Array): Promise<Uint8Array>;
  public abstract signVerificationEthAddressClaim(claim: VerificationEthAddressClaim): Promise<Uint8Array>;
}
