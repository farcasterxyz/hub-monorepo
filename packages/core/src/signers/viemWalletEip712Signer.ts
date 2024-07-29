import { ResultAsync, err } from "neverthrow";
import { bytesToHex, encodeAbiParameters } from "viem/utils";
import { bytesToHexString, hexStringToBytes } from "../bytes";
import {
  EIP_712_FARCASTER_VERIFICATION_CLAIM,
  EIP_712_FARCASTER_DOMAIN,
  MESSAGE_DATA_EIP_712_TYPES,
  USERNAME_PROOF_EIP_712_TYPES,
} from "../crypto/eip712";
import { HubAsyncResult, HubError } from "../errors";
import { VerificationAddressClaim } from "../verifications";
import { UserNameProofClaim } from "../userNameProof";
import { Eip712Signer } from "./eip712Signer";
import { ID_GATEWAY_EIP_712_TYPES, IdGatewayRegisterMessage } from "../eth/contracts/idGateway";
import { KeyRegistryRemoveMessage, KEY_REGISTRY_EIP_712_TYPES } from "../eth/contracts/keyRegistry";
import {
  IdRegistryTransferMessage,
  IdRegistryTransferAndChangeRecoveryMessage,
  IdRegistryChangeRecoveryAddressMessage,
  ID_REGISTRY_EIP_712_TYPES,
} from "../eth/contracts/idRegistry";
import { KEY_GATEWAY_EIP_712_TYPES, KeyGatewayAddMessage } from "../eth/contracts/keyGateway";
import {
  SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_TYPES,
  SignedKeyRequestMessage,
} from "../eth/contracts/signedKeyRequestValidator";
import type { SignTypedDataParameters, WalletClient } from "viem";
import { signTypedData } from "viem/actions";

export class ViemWalletEip712Signer extends Eip712Signer {
  private readonly _viemWalletClient: WalletClient;

  constructor(viemWalletClient: WalletClient) {
    super();
    this._viemWalletClient = viemWalletClient;
  }

  public async getSignerKey(): HubAsyncResult<Uint8Array> {
    const address = this._viemWalletClient.account?.address;
    if (!address) {
      return err(new HubError("unavailable", "wallet not connected"));
    }
    return ResultAsync.fromPromise(Promise.resolve(address), (e) => new HubError("unknown", e as Error)).andThen(
      hexStringToBytes,
    );
  }

  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    return this._signTypedData({
      ...MESSAGE_DATA_EIP_712_TYPES,
      primaryType: "MessageData",
      message: {
        hash: bytesToHex(hash),
      },
    });
  }

  public async signVerificationEthAddressClaim(
    claim: VerificationAddressClaim,
    chainId = 0,
  ): HubAsyncResult<Uint8Array> {
    const domain = chainId === 0 ? EIP_712_FARCASTER_DOMAIN : { ...EIP_712_FARCASTER_DOMAIN, chainId };
    return this._signTypedData({
      domain,
      types: { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM },
      primaryType: "VerificationClaim",
      message: claim,
    });
  }

  public async signUserNameProofClaim(userNameProof: UserNameProofClaim): HubAsyncResult<Uint8Array> {
    return this._signTypedData({
      ...USERNAME_PROOF_EIP_712_TYPES,
      primaryType: "UserNameProof",
      message: userNameProof,
    });
  }

  public async signRegister(message: IdGatewayRegisterMessage): HubAsyncResult<Uint8Array> {
    return this._signTypedData({
      ...ID_GATEWAY_EIP_712_TYPES,
      primaryType: "Register",
      message,
    });
  }

  public async signTransfer(message: IdRegistryTransferMessage): HubAsyncResult<Uint8Array> {
    return this._signTypedData({
      ...ID_REGISTRY_EIP_712_TYPES,
      primaryType: "Transfer",
      message,
    });
  }

  public async signTransferAndChangeRecovery(
    message: IdRegistryTransferAndChangeRecoveryMessage,
  ): HubAsyncResult<Uint8Array> {
    return this._signTypedData({
      ...ID_REGISTRY_EIP_712_TYPES,
      primaryType: "TransferAndChangeRecovery",
      message,
    });
  }

  public async signChangeRecoveryAddress(message: IdRegistryChangeRecoveryAddressMessage): HubAsyncResult<Uint8Array> {
    return this._signTypedData({
      ...ID_REGISTRY_EIP_712_TYPES,
      primaryType: "ChangeRecoveryAddress",
      message,
    });
  }

  public async signAdd(message: KeyGatewayAddMessage): HubAsyncResult<Uint8Array> {
    return this._signTypedData({
      ...KEY_GATEWAY_EIP_712_TYPES,
      primaryType: "Add",
      message: { ...message, key: bytesToHex(message.key) },
    });
  }

  public async signRemove(message: KeyRegistryRemoveMessage): HubAsyncResult<Uint8Array> {
    return this._signTypedData({
      ...KEY_REGISTRY_EIP_712_TYPES,
      primaryType: "Remove",
      message: { ...message, key: bytesToHex(message.key) },
    });
  }

  public async signKeyRequest(message: SignedKeyRequestMessage): HubAsyncResult<Uint8Array> {
    return this._signTypedData({
      ...SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_TYPES,
      primaryType: "SignedKeyRequest",
      message: { ...message, key: bytesToHex(message.key) },
    });
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

  private async _signTypedData(params: Omit<SignTypedDataParameters, "account">): HubAsyncResult<Uint8Array> {
    const account = this._viemWalletClient.account;
    if (!account) {
      return err(new HubError("unavailable", "wallet not connected"));
    }
    const hexSignature = await ResultAsync.fromPromise(
      signTypedData(this._viemWalletClient, { ...params, account }),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }
}
