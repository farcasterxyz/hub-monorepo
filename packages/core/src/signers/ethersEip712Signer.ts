import { ResultAsync, err } from "neverthrow";
import type { Signer } from "ethers";
import { HubAsyncResult, HubError } from "../errors";
import { VerificationAddressClaim } from "../verifications";
import { UserNameProofClaim } from "../userNameProof";
import { Eip712Signer } from "./eip712Signer";
import { bytesToHexString, hexStringToBytes } from "../bytes";
import {
  EIP_712_FARCASTER_DOMAIN,
  EIP_712_FARCASTER_MESSAGE_DATA,
  EIP_712_FARCASTER_VERIFICATION_CLAIM,
  EIP_712_USERNAME_DOMAIN,
  EIP_712_USERNAME_PROOF,
} from "../crypto/eip712";
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
  IdRegistryTransferMessage,
  ID_REGISTRY_EIP_712_DOMAIN,
  ID_REGISTRY_TRANSFER_TYPE,
  ID_REGISTRY_TRANSFER_AND_CHANGE_RECOVERY_TYPE,
  IdRegistryTransferAndChangeRecoveryMessage,
  ID_REGISTRY_CHANGE_RECOVERY_ADDRESS_TYPE,
  IdRegistryChangeRecoveryAddressMessage,
} from "../eth/contracts/idRegistry";
import { KeyGatewayAddMessage, KEY_GATEWAY_EIP_712_DOMAIN, KEY_GATEWAY_ADD_TYPE } from "../eth/contracts/keyGateway";
import {
  SIGNED_KEY_REQUEST_TYPE,
  SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
  SignedKeyRequestMessage,
} from "../eth/contracts/signedKeyRequestValidator";
import { encodeAbiParameters } from "viem";

export type MinimalEthersSigner = Pick<Signer, "signTypedData" | "getAddress">;

export class EthersEip712Signer extends Eip712Signer {
  private readonly _ethersSigner: MinimalEthersSigner;

  constructor(signer: MinimalEthersSigner) {
    super();
    this._ethersSigner = signer;
  }

  public async getSignerKey(): HubAsyncResult<Uint8Array> {
    return ResultAsync.fromPromise(this._ethersSigner.getAddress(), (e) => new HubError("unknown", e as Error)).andThen(
      hexStringToBytes,
    );
  }

  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(
        EIP_712_FARCASTER_DOMAIN,
        { MessageData: [...EIP_712_FARCASTER_MESSAGE_DATA] },
        { hash },
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );

    // Convert hex signature to bytes
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signVerificationEthAddressClaim(
    claim: VerificationAddressClaim,
    chainId = 0,
  ): HubAsyncResult<Uint8Array> {
    const domain = chainId === 0 ? EIP_712_FARCASTER_DOMAIN : { ...EIP_712_FARCASTER_DOMAIN, chainId };
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(domain, { VerificationClaim: [...EIP_712_FARCASTER_VERIFICATION_CLAIM] }, claim),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );

    // Convert hex signature to bytes
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signUserNameProofClaim(userNameProof: UserNameProofClaim): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(
        EIP_712_USERNAME_DOMAIN,
        { UserNameProof: [...EIP_712_USERNAME_PROOF] },
        userNameProof,
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );

    // Convert hex signature to bytes
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signRegister(message: IdGatewayRegisterMessage): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(ID_GATEWAY_EIP_712_DOMAIN, { Register: [...ID_GATEWAY_REGISTER_TYPE] }, message),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signTransfer(message: IdRegistryTransferMessage): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(
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
      this._ethersSigner.signTypedData(
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
      this._ethersSigner.signTypedData(
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
      this._ethersSigner.signTypedData(KEY_GATEWAY_EIP_712_DOMAIN, { Add: [...KEY_GATEWAY_ADD_TYPE] }, message),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signRemove(message: KeyRegistryRemoveMessage): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(KEY_REGISTRY_EIP_712_DOMAIN, { Remove: [...KEY_REGISTRY_REMOVE_TYPE] }, message),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signKeyRequest(message: SignedKeyRequestMessage): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(
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
