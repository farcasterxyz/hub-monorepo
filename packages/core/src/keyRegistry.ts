import { verifyTypedData } from "viem";
import { ResultAsync } from "neverthrow";
import { Hex, bytesToHex } from "viem";
import { HubAsyncResult, HubError } from "./errors";

export type KeyAddEip712 = {
  /** Address owning the FID to add key for */
  owner: Hex;

  /** Type of key material to add */
  keyType: 1;

  /** Public key material to add */
  key: Hex;

  /** Type of metadata **/
  metadataType: 1;

  /** Additional information about the key request */
  metadata: Hex;

  /** KeyRegistry nonce for owner address */
  nonce: bigint;

  /** Unix timestamp when this message expires */
  deadline: bigint;
};

export type KeyRemoveEip712 = {
  /** Address owning the FID to remove key for */
  owner: Hex;

  /** Public key material to remove */
  key: Hex;

  /** IdRegistry nonce for address */
  nonce: bigint;

  /** Unix timestamp when this message expires */
  deadline: bigint;
};

export const KEY_REGISTRY_EIP_712_DOMAIN = {
  name: "Farcaster KeyRegistry",
  version: "1",
  chainId: 10,
  verifyingContract: "0x00000000fc9e66f1c6d86d750b4af47ff0cc343d",
} as const;

export const KEY_REGISTRY_ADD_TYPE = [
  { name: "owner", type: "address" },
  { name: "keyType", type: "uint32" },
  { name: "key", type: "bytes" },
  { name: "metadataType", type: "uint8" },
  { name: "metadata", type: "bytes" },
  { name: "nonce", type: "uint256" },
  { name: "deadline", type: "uint256" },
] as const;

export const KEY_REGISTRY_REMOVE_TYPE = [
  { name: "owner", type: "address" },
  { name: "key", type: "bytes" },
  { name: "nonce", type: "uint256" },
  { name: "deadline", type: "uint256" },
] as const;

export const verifyKeyAdd = async (
  message: KeyAddEip712,
  signature: Uint8Array,
  address: Uint8Array,
): HubAsyncResult<boolean> => {
  const valid = await ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      domain: KEY_REGISTRY_EIP_712_DOMAIN,
      types: { Add: KEY_REGISTRY_ADD_TYPE },
      primaryType: "Add",
      message,
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );

  return valid;
};

export const verifyKeyRemove = async (
  message: KeyRemoveEip712,
  signature: Uint8Array,
  address: Uint8Array,
): HubAsyncResult<boolean> => {
  const valid = await ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      domain: KEY_REGISTRY_EIP_712_DOMAIN,
      types: { Remove: KEY_REGISTRY_REMOVE_TYPE },
      primaryType: "Remove",
      message,
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );

  return valid;
};
