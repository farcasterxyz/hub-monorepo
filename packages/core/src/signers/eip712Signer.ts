import { SignatureScheme } from "../protobufs";
import { HubAsyncResult } from "../errors";
import { VerificationAddressClaim } from "../verifications";
import { UserNameProofClaim } from "../userNameProof";
import { Signer } from "./signer";
import { KeyGatewayAddMessage } from "../eth/contracts/keyGateway";
import { KeyRegistryRemoveMessage } from "../eth/contracts/keyRegistry";
import { IdGatewayRegisterMessage } from "../eth/contracts/idGateway";
import {
  IdRegistryChangeRecoveryAddressMessage,
  IdRegistryTransferAndChangeRecoveryMessage,
  IdRegistryTransferMessage,
} from "../eth/contracts/idRegistry";
import { SignedKeyRequestMessage } from "../eth/contracts/signedKeyRequestValidator";

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
    claim: VerificationAddressClaim,
    chainId?: number,
  ): HubAsyncResult<Uint8Array>;
  public abstract signUserNameProofClaim(claim: UserNameProofClaim): HubAsyncResult<Uint8Array>;
  public abstract signRegister(message: IdGatewayRegisterMessage): HubAsyncResult<Uint8Array>;
  public abstract signAdd(message: KeyGatewayAddMessage): HubAsyncResult<Uint8Array>;
  public abstract signRemove(message: KeyRegistryRemoveMessage): HubAsyncResult<Uint8Array>;
  public abstract signTransfer(message: IdRegistryTransferMessage): HubAsyncResult<Uint8Array>;
  public abstract signTransferAndChangeRecovery(
    message: IdRegistryTransferAndChangeRecoveryMessage,
  ): HubAsyncResult<Uint8Array>;
  public abstract signChangeRecoveryAddress(
    message: IdRegistryChangeRecoveryAddressMessage,
  ): HubAsyncResult<Uint8Array>;
  public abstract signKeyRequest(message: SignedKeyRequestMessage): HubAsyncResult<Uint8Array>;
  public abstract getSignedKeyRequestMetadata(message: SignedKeyRequestMessage): HubAsyncResult<Uint8Array>;
}
