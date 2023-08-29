import { ResultAsync } from "neverthrow";
import type { Signer } from "ethers";
import { HubAsyncResult, HubError } from "../errors";
import { VerificationEthAddressClaim } from "../verifications";
import { UserNameProofClaim } from "../userNameProof";
import { Eip712Signer } from "./eip712Signer";
import { hexStringToBytes } from "../bytes";
import {
  EIP_712_FARCASTER_DOMAIN,
  EIP_712_FARCASTER_MESSAGE_DATA,
  EIP_712_FARCASTER_VERIFICATION_CLAIM,
  EIP_712_USERNAME_DOMAIN,
  EIP_712_USERNAME_PROOF,
} from "../crypto/eip712";
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

export type MinimalEthersSigner = Pick<Signer, "signTypedData" | "getAddress">;

export class EthersEip712Signer extends Eip712Signer {
  private readonly _ethersSigner: MinimalEthersSigner;

  constructor(signer: MinimalEthersSigner) {
    super();
    this._ethersSigner = signer;
  }

  public async getSignerKey(): HubAsyncResult<Uint8Array> {
    return ResultAsync.fromPromise(
      this._ethersSigner.getAddress(),
      (e) => new HubError("unknown", e as Error)
    ).andThen(hexStringToBytes);
  }

  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(
        EIP_712_FARCASTER_DOMAIN,
        { MessageData: [...EIP_712_FARCASTER_MESSAGE_DATA] },
        { hash }
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error)
    );

    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signVerificationEthAddressClaim(
    claim: VerificationEthAddressClaim
  ): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(
        EIP_712_FARCASTER_DOMAIN,
        { VerificationClaim: [...EIP_712_FARCASTER_VERIFICATION_CLAIM] },
        claim
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error)
    );

    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signUserNameProofClaim(
    userNameProof: UserNameProofClaim
  ): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(
        EIP_712_USERNAME_DOMAIN,
        { UserNameProof: [...EIP_712_USERNAME_PROOF] },
        userNameProof
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error)
    );

    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signIdRegister(
    register: IdRegisterEip712
  ): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(
        ID_REGISTRY_EIP_712_DOMAIN,
        { Register: [...ID_REGISTRY_REGISTER_TYPE] },
        register
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signIdTransfer(
    transfer: IdTransferEip712
  ): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(
        ID_REGISTRY_EIP_712_DOMAIN,
        { Transfer: [...ID_REGISTRY_TRANSFER_TYPE] },
        transfer
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signSignedKeyRequest(
    signedKeyRequest: SignedKeyRequestEip712
  ): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(
        SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
        { SignedKeyRequest: [...SIGNED_KEY_REQUEST_VALIDATOR_METADATA_TYPE] },
        signedKeyRequest
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error)
    );

    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }
}
