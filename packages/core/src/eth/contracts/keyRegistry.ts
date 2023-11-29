import { HubAsyncResult, HubError } from "../../errors";
import { ResultAsync } from "neverthrow";
import { verifyTypedData, bytesToHex } from "viem";

export type KeyRegistryRemoveMessage = {
  /** FID owner address */
  owner: `0x${string}`;

  /** Bytes of public key to remove onchain */
  key: Uint8Array;

  /** KeyRegistry nonce for signer address */
  nonce: bigint;

  /** Unix timestamp when this message expires */
  deadline: bigint;
};

export const KEY_REGISTRY_ADDRESS = "0x00000000fc1237824fb747abde0ff18990e59b7e" as const;

export const KEY_REGISTRY_EIP_712_DOMAIN = {
  name: "Farcaster KeyRegistry",
  version: "1",
  chainId: 10,
  verifyingContract: KEY_REGISTRY_ADDRESS,
} as const;

export const KEY_REGISTRY_REMOVE_TYPE = [
  { name: "owner", type: "address" },
  { name: "key", type: "bytes" },
  { name: "nonce", type: "uint256" },
  { name: "deadline", type: "uint256" },
] as const;

export const KEY_REGISTRY_EIP_712_TYPES = {
  domain: KEY_REGISTRY_EIP_712_DOMAIN,
  types: { Remove: KEY_REGISTRY_REMOVE_TYPE },
} as const;

export const verifyRemove = async (
  message: KeyRegistryRemoveMessage,
  signature: Uint8Array,
  address: Uint8Array,
): HubAsyncResult<boolean> => {
  const valid = await ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      domain: KEY_REGISTRY_EIP_712_DOMAIN,
      types: { Remove: KEY_REGISTRY_REMOVE_TYPE },
      primaryType: "Remove",
      message: { ...message, key: bytesToHex(message.key) },
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );

  return valid;
};
