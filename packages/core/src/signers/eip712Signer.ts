import { SignatureScheme } from "../protobufs";
import { HubAsyncResult } from "../errors";
import { VerificationEthAddressClaim } from "../verifications";
import { UserNameProofClaim } from "../userNameProof";
import { SignedKeyRequestEip712 } from "../signedKeyRequest";
import { IdRegisterEip712, IdTransferEip712 } from "../idRegistry";
import { Signer } from "./signer";

/**
 * Extend this class to implement an EIP712 signer.
 */
export abstract class Eip712Signer implements Signer {
  /** Signature scheme as defined in protobufs */
  public readonly scheme = SignatureScheme.EIP712;

  /**
   * Get the 160-bit address in bytes.
   */
  public abstract getSignerKey(): HubAsyncResult<Uint8Array>;
  public abstract signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array>;
  public abstract signVerificationEthAddressClaim(
    claim: VerificationEthAddressClaim
  ): HubAsyncResult<Uint8Array>;
  public abstract signUserNameProofClaim(
    claim: UserNameProofClaim
  ): HubAsyncResult<Uint8Array>;
  public abstract signSignedKeyRequest(
    request: SignedKeyRequestEip712
  ): HubAsyncResult<Uint8Array>;
  public abstract signIdRegister(
    request: IdRegisterEip712
  ): HubAsyncResult<Uint8Array>;
  public abstract signIdTransfer(
    request: IdTransferEip712
  ): HubAsyncResult<Uint8Array>;
}
