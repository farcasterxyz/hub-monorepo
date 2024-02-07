import { ResultAsync, err } from "neverthrow";
import { Eip712Signer } from "./eip712Signer";
import type {
  Signer as EthersAbstractSigner,
  TypedDataSigner as EthersTypedDataSigner,
} from "@ethersproject/abstract-signer";
import { HubAsyncResult, HubError } from "../errors";
import { eip712 } from "../crypto";
import { bytesToHexString, hexStringToBytes } from "../bytes";
import { VerificationAddressClaim } from "../verifications";
import { UserNameProofClaim } from "../userNameProof";
import {
  ID_GATEWAY_EIP_712_DOMAIN,
  ID_GATEWAY_REGISTER_TYPE,
  IdGatewayRegisterMessage,
} from "../eth/contracts/idGateway";
import {
  KeyRegistryRemoveMessage,
  KEY_REGISTRY_EIP_712_DOMAIN,
  KEY_REGISTRY_REMOVE_TYPE,
} from "../eth/contracts/keyRegistry";
import {
  ID_REGISTRY_CHANGE_RECOVERY_ADDRESS_TYPE,
  ID_REGISTRY_EIP_712_DOMAIN,
  ID_REGISTRY_TRANSFER_AND_CHANGE_RECOVERY_TYPE,
  ID_REGISTRY_TRANSFER_TYPE,
  IdRegistryChangeRecoveryAddressMessage,
  IdRegistryTransferAndChangeRecoveryMessage,
  IdRegistryTransferMessage,
} from "../eth/contracts/idRegistry";
import { KeyGatewayAddMessage, KEY_GATEWAY_EIP_712_DOMAIN, KEY_GATEWAY_ADD_TYPE } from "../eth/contracts/keyGateway";
import {
  SIGNED_KEY_REQUEST_TYPE,
  SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
  SignedKeyRequestMessage,
} from "../eth/contracts/signedKeyRequestValidator";
import { encodeAbiParameters } from "viem";

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

  public async signVerificationEthAddressClaim(
    claim: VerificationAddressClaim,
    chainId = 0,
  ): HubAsyncResult<Uint8Array> {
    const domain = chainId === 0 ? eip712.EIP_712_FARCASTER_DOMAIN : { ...eip712.EIP_712_FARCASTER_DOMAIN, chainId };
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        domain,
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

  public async signRegister(message: IdGatewayRegisterMessage): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        ID_GATEWAY_EIP_712_DOMAIN,
        { Register: [...ID_GATEWAY_REGISTER_TYPE] },
        message,
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signTransfer(message: IdRegistryTransferMessage): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        ID_REGISTRY_EIP_712_DOMAIN,
        { Transfer: [...ID_REGISTRY_TRANSFER_TYPE] },
        message,
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signTransferAndChangeRecovery(
    message: IdRegistryTransferAndChangeRecoveryMessage,
  ): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        ID_REGISTRY_EIP_712_DOMAIN,
        { TransferAndChangeRecovery: [...ID_REGISTRY_TRANSFER_AND_CHANGE_RECOVERY_TYPE] },
        message,
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signChangeRecoveryAddress(message: IdRegistryChangeRecoveryAddressMessage): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        ID_REGISTRY_EIP_712_DOMAIN,
        { ChangeRecoveryAddress: [...ID_REGISTRY_CHANGE_RECOVERY_ADDRESS_TYPE] },
        message,
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signAdd(message: KeyGatewayAddMessage): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(KEY_GATEWAY_EIP_712_DOMAIN, { Add: [...KEY_GATEWAY_ADD_TYPE] }, message),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signRemove(message: KeyRegistryRemoveMessage): HubAsyncResult<Uint8Array> {
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

  public async signKeyRequest(message: SignedKeyRequestMessage): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._typedDataSigner._signTypedData(
        SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
        { SignedKeyRequest: [...SIGNED_KEY_REQUEST_TYPE] },
        message,
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async getSignedKeyRequestMetadata(message: SignedKeyRequestMessage): HubAsyncResult<Uint8Array> {
    const signatureBytes = await this.signKeyRequest(message);
    if (signatureBytes.isErr()) {
      return err(signatureBytes.error);
    }

    const signature = bytesToHexString(signatureBytes.value);
    if (signature.isErr()) {
      return err(signature.error);
    }

    const signerAddressBytes = await this.getSignerKey();
    if (signerAddressBytes.isErr()) {
      return err(signerAddressBytes.error);
    }

    const signerAddress = bytesToHexString(signerAddressBytes.value);
    if (signerAddress.isErr()) {
      return err(signerAddress.error);
    }

    const metadataStruct = {
      requestFid: message.requestFid,
      requestSigner: signerAddress.value,
      signature: signature.value,
      deadline: message.deadline,
    };
    const encodedStruct = encodeAbiParameters(
      [
        {
          components: [
            {
              name: "requestFid",
              type: "uint256",
            },
            {
              name: "requestSigner",
              type: "address",
            },
            {
              name: "signature",
              type: "bytes",
            },
            {
              name: "deadline",
              type: "uint256",
            },
          ],
          name: "SignedKeyRequestMetadata",
          type: "tuple",
        },
      ],
      [metadataStruct],
    );
    return hexStringToBytes(encodedStruct);
  }
}
