import { bytesToHex, verifyTypedData } from "viem";
import { ResultAsync } from "neverthrow";
import { HubAsyncResult, HubError } from "../errors";
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

export const EIP_712_FARCASTER_DOMAIN = {
  name: "Farcaster Verify Ethereum Address",
  version: "2.0.0",
  // fixed salt to minimize collisions
  salt: "0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558",
} as const;

export const EIP_712_FARCASTER_VERIFICATION_CLAIM = [
  {
    name: "fid",
    type: "uint256",
  },
  {
    name: "address",
    type: "address",
  },
  {
    name: "blockHash",
    type: "bytes32",
  },
  {
    name: "network",
    type: "uint8",
  },
] as const;

export const EIP_712_FARCASTER_MESSAGE_DATA = [
  {
    name: "hash",
    type: "bytes",
  },
] as const;

export const EIP_712_USERNAME_DOMAIN = {
  name: "Farcaster name verification",
  version: "1",
  chainId: 1,
  verifyingContract: "0xe3be01d99baa8db9905b33a3ca391238234b79d1", // name registry contract, will be the farcaster ENS CCIP contract later
} as const;

export const EIP_712_USERNAME_PROOF = [
  { name: "name", type: "string" },
  { name: "timestamp", type: "uint256" },
  { name: "owner", type: "address" },
] as const;

export const verifyVerificationEthAddressClaimSignature = async (
  claim: VerificationEthAddressClaim,
  signature: Uint8Array,
  address: Uint8Array,
): HubAsyncResult<boolean> => {
  const valid = await ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      domain: EIP_712_FARCASTER_DOMAIN,
      types: { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM },
      primaryType: "VerificationClaim",
      message: claim,
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );

  return valid;
};

export const verifyUserNameProofClaim = async (
  nameProof: UserNameProofClaim,
  signature: Uint8Array,
  address: Uint8Array,
): HubAsyncResult<boolean> => {
  const valid = await ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      domain: EIP_712_USERNAME_DOMAIN,
      types: { UserNameProof: EIP_712_USERNAME_PROOF },
      primaryType: "UserNameProof",
      message: nameProof,
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );

  return valid;
};

export const verifyMessageHashSignature = async (
  hash: Uint8Array,
  signature: Uint8Array,
  address: Uint8Array,
): HubAsyncResult<boolean> => {
  const valid = await ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      domain: EIP_712_FARCASTER_DOMAIN,
      types: { MessageData: EIP_712_FARCASTER_MESSAGE_DATA },
      primaryType: "MessageData",
      message: { hash: bytesToHex(hash) },
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );

  return valid;
};
