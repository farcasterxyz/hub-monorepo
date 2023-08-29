import { ResultAsync } from "neverthrow";
import { LocalAccount } from "viem/accounts";
import { bytesToHex } from "viem/utils";
import { hexStringToBytes } from "../bytes";
import {
  EIP_712_FARCASTER_MESSAGE_DATA,
  EIP_712_FARCASTER_VERIFICATION_CLAIM,
  EIP_712_FARCASTER_DOMAIN,
  EIP_712_USERNAME_DOMAIN,
  EIP_712_USERNAME_PROOF,
} from "../crypto/eip712";
import { HubAsyncResult, HubError } from "../errors";
import { VerificationEthAddressClaim } from "../verifications";
import { UserNameProofClaim } from "../userNameProof";
import { Eip712Signer } from "./eip712Signer";
import {
  SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
  SIGNED_KEY_REQUEST_VALIDATOR_METADATA_TYPE,
  SignedKeyRequestEip712,
} from "../signedKeyRequest";
import {
  ID_REGISTRY_EIP_712_DOMAIN,
  ID_REGISTRY_REGISTER_TYPE,
  ID_REGISTRY_TRANSFER_TYPE,
  IdRegisterEip712,
  IdTransferEip712,
} from "../idRegistry";

export class ViemLocalEip712Signer extends Eip712Signer {
  private readonly _viemLocalAccount: LocalAccount<string>;

  constructor(viemLocalAccount: LocalAccount<string>) {
    super();
    this._viemLocalAccount = viemLocalAccount;
  }

  public async getSignerKey(): HubAsyncResult<Uint8Array> {
    return ResultAsync.fromPromise(
      Promise.resolve(this._viemLocalAccount.address),
      (e) => new HubError("unknown", e as Error)
    ).andThen(hexStringToBytes);
  }

  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._viemLocalAccount.signTypedData({
        domain: EIP_712_FARCASTER_DOMAIN,
        types: { MessageData: EIP_712_FARCASTER_MESSAGE_DATA },
        primaryType: "MessageData",
        message: {
          hash: bytesToHex(hash),
        },
      }),
      (e) => new HubError("bad_request.invalid_param", e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signVerificationEthAddressClaim(
    claim: VerificationEthAddressClaim
  ): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._viemLocalAccount.signTypedData({
        domain: EIP_712_FARCASTER_DOMAIN,
        types: { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM },
        primaryType: "VerificationClaim",
        message: claim,
      }),
      (e) => new HubError("bad_request.invalid_param", e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signUserNameProofClaim(
    userNameProof: UserNameProofClaim
  ): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._viemLocalAccount.signTypedData({
        domain: EIP_712_USERNAME_DOMAIN,
        types: { UserNameProof: EIP_712_USERNAME_PROOF },
        primaryType: "UserNameProof",
        message: userNameProof,
      }),
      (e) => new HubError("bad_request.invalid_param", e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signIdRegister(
    register: IdRegisterEip712
  ): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._viemLocalAccount.signTypedData({
        domain: ID_REGISTRY_EIP_712_DOMAIN,
        types: { Register: ID_REGISTRY_REGISTER_TYPE },
        primaryType: "Register",
        message: register,
      }),
      (e) => new HubError("bad_request.invalid_param", e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signIdTransfer(
    transfer: IdTransferEip712
  ): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._viemLocalAccount.signTypedData({
        domain: ID_REGISTRY_EIP_712_DOMAIN,
        types: { Transfer: ID_REGISTRY_TRANSFER_TYPE },
        primaryType: "Transfer",
        message: transfer,
      }),
      (e) => new HubError("bad_request.invalid_param", e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signSignedKeyRequest(
    signedKeyRequest: SignedKeyRequestEip712
  ): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._viemLocalAccount.signTypedData({
        domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
        types: { SignedKeyRequest: SIGNED_KEY_REQUEST_VALIDATOR_METADATA_TYPE },
        primaryType: "SignedKeyRequest",
        message: signedKeyRequest,
      }),
      (e) => new HubError("bad_request.invalid_param", e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }
}
