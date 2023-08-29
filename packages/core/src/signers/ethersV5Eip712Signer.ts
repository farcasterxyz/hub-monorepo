import { ResultAsync } from "neverthrow";
import { Eip712Signer } from "./eip712Signer";
import type {
  Signer as EthersAbstractSigner,
  TypedDataSigner as EthersTypedDataSigner,
} from "@ethersproject/abstract-signer";
import { HubAsyncResult, HubError } from "../errors";
import { eip712 } from "../crypto";
import { hexStringToBytes } from "../bytes";
import { VerificationEthAddressClaim } from "../verifications";
import { UserNameProofClaim } from "../userNameProof";
import {
  SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
  SIGNED_KEY_REQUEST_VALIDATOR_METADATA_TYPE,
  SignedKeyRequest,
} from "../signedKeyRequest";

export type TypedDataSigner = EthersAbstractSigner & EthersTypedDataSigner;

export class EthersV5Eip712Signer extends Eip712Signer {
  private readonly _typedDataSigner: TypedDataSigner;

  constructor(typedDataSigner: TypedDataSigner) {
    super();
    this._typedDataSigner = typedDataSigner;
  }

  public async getSignerKey(): HubAsyncResult<Uint8Array> {
    return ResultAsync.fromPromise(
      this._typedDataSigner.getAddress(),
      (e) => new HubError("unknown", e as Error)
    ).andThen(hexStringToBytes);
  }

  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        eip712.EIP_712_FARCASTER_DOMAIN,
        { MessageData: [...eip712.EIP_712_FARCASTER_MESSAGE_DATA] },
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
      this._typedDataSigner._signTypedData(
        eip712.EIP_712_FARCASTER_DOMAIN,
        { VerificationClaim: [...eip712.EIP_712_FARCASTER_VERIFICATION_CLAIM] },
        claim
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signUserNameProofClaim(
    usernameProof: UserNameProofClaim
  ): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        eip712.EIP_712_USERNAME_DOMAIN,
        { UserNameProof: [...eip712.EIP_712_USERNAME_PROOF] },
        usernameProof
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signSignedKeyRequest(
    signedKeyRequest: SignedKeyRequest
  ): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
        { SignedKeyRequest: [...SIGNED_KEY_REQUEST_VALIDATOR_METADATA_TYPE] },
        signedKeyRequest
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error)
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }
}
