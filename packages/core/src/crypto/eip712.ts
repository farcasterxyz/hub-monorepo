import { bytesToHex, verifyTypedData } from "viem";
import { ResultAsync } from "neverthrow";
import { HubAsyncResult, HubError } from "../errors";
import { VerificationAddressClaim, VerificationAddressClaimEthereum } from "../verifications";
import { UserNameProofClaim } from "../userNameProof";
import { defaultPublicClients, PublicClients } from "../eth/clients";
import { CHAIN_IDS } from "../eth/chains";
import { UserNameType } from "protobufs";

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

export const EIP_712_FARCASTER_VERIFICATION_CLAIM_CHAIN_IDS = [...CHAIN_IDS, 0];

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
} as const;

export const EIP_712_USERNAME_DOMAIN_BASE = {
  name: "Farcaster name verification",
  version: "1",
  chainId: 8453, // Base mainnet
} as const;

export const EIP_712_USERNAME_PROOF = [
  { name: "name", type: "string" },
  { name: "timestamp", type: "uint256" },
  { name: "owner", type: "address" },
] as const;

export const USERNAME_PROOF_EIP_712_TYPES = {
  domain: EIP_712_USERNAME_DOMAIN,
  types: { UserNameProof: EIP_712_USERNAME_PROOF },
} as const;

export const USERNAME_PROOF_EIP_712_TYPES_BASE = {
  domain: {
    ...EIP_712_USERNAME_DOMAIN_BASE,
    chainId: 8453, // Base mainnet
  },
  types: { UserNameProof: EIP_712_USERNAME_PROOF },
} as const;

export const MESSAGE_DATA_EIP_712_TYPES = {
  domain: EIP_712_FARCASTER_DOMAIN,
  types: { MessageData: EIP_712_FARCASTER_MESSAGE_DATA },
} as const;

export const verifyVerificationClaimEOASignature = async (
  claim: VerificationAddressClaim,
  signature: Uint8Array,
  address: Uint8Array,
  chainId: number,
): HubAsyncResult<boolean> => {
  if (chainId !== 0) {
    return ResultAsync.fromPromise(
      Promise.reject(),
      () => new HubError("bad_request.invalid_param", "Invalid chain ID"),
    );
  }
  return ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      domain: EIP_712_FARCASTER_DOMAIN,
      types: { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM },
      primaryType: "VerificationClaim",
      message: claim as VerificationAddressClaimEthereum,
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );
};

export const verifyVerificationClaimContractSignature = async (
  claim: VerificationAddressClaim,
  signature: Uint8Array,
  address: Uint8Array,
  chainId: number,
  publicClients: PublicClients = defaultPublicClients,
): HubAsyncResult<boolean> => {
  const client = publicClients[chainId];
  if (!client) {
    return ResultAsync.fromPromise(
      Promise.reject(),
      () => new HubError("bad_request.invalid_param", `RPC client not provided for chainId ${chainId}`),
    );
  }
  const valid = await ResultAsync.fromPromise(
    client.verifyTypedData({
      address: bytesToHex(address),
      domain: { ...EIP_712_FARCASTER_DOMAIN, chainId },
      types: { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM },
      primaryType: "VerificationClaim",
      message: claim,
      signature,
    }),
    (e) => new HubError("unavailable.network_failure", e as Error),
  );
  return valid;
};

export const verifyVerificationEthAddressClaimSignature = async (
  claim: VerificationAddressClaim,
  signature: Uint8Array,
  address: Uint8Array,
  verificationType = 0,
  chainId = 0,
  publicClients: PublicClients = defaultPublicClients,
): HubAsyncResult<boolean> => {
  if (!EIP_712_FARCASTER_VERIFICATION_CLAIM_CHAIN_IDS.includes(chainId)) {
    return ResultAsync.fromPromise(
      Promise.reject(),
      () => new HubError("bad_request.invalid_param", "Invalid chain ID"),
    );
  }

  if (verificationType === 0) {
    return verifyVerificationClaimEOASignature(claim, signature, address, chainId);
  } else if (verificationType === 1) {
    return verifyVerificationClaimContractSignature(claim, signature, address, chainId, publicClients);
  } else {
    return ResultAsync.fromPromise(
      Promise.reject(),
      () => new HubError("bad_request.invalid_param", "Invalid verification type"),
    );
  }
};

export const verifyUserNameProofClaim = async (
  nameProof: UserNameProofClaim,
  signature: Uint8Array,
  address: Uint8Array,
  type: UserNameType,
): HubAsyncResult<boolean> => {
  const domain = type === UserNameType.USERNAME_TYPE_BASE ? EIP_712_USERNAME_DOMAIN_BASE : EIP_712_USERNAME_DOMAIN;

  return ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      domain,
      types: { UserNameProof: EIP_712_USERNAME_PROOF },
      primaryType: "UserNameProof",
      message: nameProof,
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );
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
