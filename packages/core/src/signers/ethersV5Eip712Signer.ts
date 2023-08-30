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
  SignedKeyRequestEip712,
} from "../signedKeyRequest";
import {
  ID_REGISTRY_EIP_712_DOMAIN,
  ID_REGISTRY_REGISTER_TYPE,
  ID_REGISTRY_TRANSFER_TYPE,
  IdRegisterEip712,
  IdTransferEip712,
} from "../idRegistry";
import {
  KEY_REGISTRY_ADD_TYPE,
  KEY_REGISTRY_EIP_712_DOMAIN,
  KEY_REGISTRY_REMOVE_TYPE,
  KeyAddEip712,
  KeyRemoveEip712,
} from "../keyRegistry";

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
      (e) => new HubError("unknown", e as Error),
    ).andThen(hexStringToBytes);
  }

  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        eip712.EIP_712_FARCASTER_DOMAIN,
        { MessageData: [...eip712.EIP_712_FARCASTER_MESSAGE_DATA] },
        { hash },
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signVerificationEthAddressClaim(claim: VerificationEthAddressClaim): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        eip712.EIP_712_FARCASTER_DOMAIN,
        { VerificationClaim: [...eip712.EIP_712_FARCASTER_VERIFICATION_CLAIM] },
        claim,
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signUserNameProofClaim(usernameProof: UserNameProofClaim): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        eip712.EIP_712_USERNAME_DOMAIN,
        { UserNameProof: [...eip712.EIP_712_USERNAME_PROOF] },
        usernameProof,
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signIdRegister(register: IdRegisterEip712): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        ID_REGISTRY_EIP_712_DOMAIN,
        { Register: [...ID_REGISTRY_REGISTER_TYPE] },
        register,
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signIdTransfer(transfer: IdTransferEip712): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        ID_REGISTRY_EIP_712_DOMAIN,
        { Transfer: [...ID_REGISTRY_TRANSFER_TYPE] },
        transfer,
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signKeyAdd(message: KeyAddEip712): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(KEY_REGISTRY_EIP_712_DOMAIN, { Add: [...KEY_REGISTRY_ADD_TYPE] }, message),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signKeyRemove(message: KeyRemoveEip712): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        KEY_REGISTRY_EIP_712_DOMAIN,
        { Remove: [...KEY_REGISTRY_REMOVE_TYPE] },
        message,
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signSignedKeyRequest(signedKeyRequest: SignedKeyRequestEip712): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
        { SignedKeyRequest: [...SIGNED_KEY_REQUEST_VALIDATOR_METADATA_TYPE] },
        signedKeyRequest,
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }
}
