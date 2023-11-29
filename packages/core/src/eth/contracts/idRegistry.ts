import { HubAsyncResult, HubError } from "../../errors";
import { ResultAsync } from "neverthrow";
import { verifyTypedData, bytesToHex } from "viem";

export type IdRegistryTransferMessage = {
  /** FID to transfer */
  fid: bigint;

  /** Transfer recipient address */
  to: `0x${string}`;

  /** IdRegistry nonce for signer address */
  nonce: bigint;

  /** Unix timestamp when this message expires */
  deadline: bigint;
};

export type IdRegistryTransferAndChangeRecoveryMessage = {
  /** FID to transfer */
  fid: bigint;

  /** Transfer recipient address */
  to: `0x${string}`;

  /** New recovery address */
  recovery: `0x${string}`;

  /** IdRegistry nonce for signer address */
  nonce: bigint;

  /** Unix timestamp when this message expires */
  deadline: bigint;
};

export type IdRegistryChangeRecoveryAddressMessage = {
  /** FID to change */
  fid: bigint;

  /** Previous recovery address */
  from: `0x${string}`;

  /** New recovery address */
  to: `0x${string}`;

  /** IdRegistry nonce for signer address */
  nonce: bigint;

  /** Unix timestamp when this message expires */
  deadline: bigint;
};

export const ID_REGISTRY_ADDRESS = "0x00000000Fc6c5F01Fc30151999387Bb99A9f489b" as const;

export const ID_REGISTRY_EIP_712_DOMAIN = {
  name: "Farcaster IdRegistry",
  version: "1",
  chainId: 10,
  verifyingContract: ID_REGISTRY_ADDRESS,
} as const;

export const ID_REGISTRY_TRANSFER_TYPE = [
  { name: "fid", type: "uint256" },
  { name: "to", type: "address" },
  { name: "nonce", type: "uint256" },
  { name: "deadline", type: "uint256" },
] as const;

export const ID_REGISTRY_TRANSFER_AND_CHANGE_RECOVERY_TYPE = [
  { name: "fid", type: "uint256" },
  { name: "to", type: "address" },
  { name: "recovery", type: "address" },
  { name: "nonce", type: "uint256" },
  { name: "deadline", type: "uint256" },
] as const;

export const ID_REGISTRY_CHANGE_RECOVERY_ADDRESS_TYPE = [
  { name: "fid", type: "uint256" },
  { name: "from", type: "address" },
  { name: "to", type: "address" },
  { name: "nonce", type: "uint256" },
  { name: "deadline", type: "uint256" },
] as const;

export const ID_REGISTRY_EIP_712_TYPES = {
  domain: ID_REGISTRY_EIP_712_DOMAIN,
  types: {
    Transfer: ID_REGISTRY_TRANSFER_TYPE,
    TransferAndChangeRecovery: ID_REGISTRY_TRANSFER_AND_CHANGE_RECOVERY_TYPE,
    ChangeRecoveryAddress: ID_REGISTRY_CHANGE_RECOVERY_ADDRESS_TYPE,
  },
} as const;

export const verifyTransfer = async (
  message: IdRegistryTransferMessage,
  signature: Uint8Array,
  address: Uint8Array,
): HubAsyncResult<boolean> => {
  const valid = await ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      domain: ID_REGISTRY_EIP_712_DOMAIN,
      types: { Transfer: ID_REGISTRY_TRANSFER_TYPE },
      primaryType: "Transfer",
      message,
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );

  return valid;
};

export const verifyTransferAndChangeRecovery = async (
  message: IdRegistryTransferAndChangeRecoveryMessage,
  signature: Uint8Array,
  address: Uint8Array,
): HubAsyncResult<boolean> => {
  const valid = await ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      domain: ID_REGISTRY_EIP_712_DOMAIN,
      types: { TransferAndChangeRecovery: ID_REGISTRY_TRANSFER_AND_CHANGE_RECOVERY_TYPE },
      primaryType: "TransferAndChangeRecovery",
      message,
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );

  return valid;
};

export const verifyChangeRecoveryAddress = async (
  message: IdRegistryChangeRecoveryAddressMessage,
  signature: Uint8Array,
  address: Uint8Array,
): HubAsyncResult<boolean> => {
  const valid = await ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      domain: ID_REGISTRY_EIP_712_DOMAIN,
      types: { ChangeRecoveryAddress: ID_REGISTRY_CHANGE_RECOVERY_ADDRESS_TYPE },
      primaryType: "ChangeRecoveryAddress",
      message,
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );

  return valid;
};
