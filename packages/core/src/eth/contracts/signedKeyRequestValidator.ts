import { HubAsyncResult, HubError } from "../../errors";
import { ResultAsync } from "neverthrow";
import { verifyTypedData, bytesToHex } from "viem";

export type SignedKeyRequestMessage = {
  /** FID of user or app requesting key */
  requestFid: bigint;

  /** Bytes of public key */
  key: Uint8Array;

  /** Unix timestamp when this message expires */
  deadline: bigint;
};

export const SIGNED_KEY_REQUEST_VALIDATOR_ADDRESS = "0x00000000FC700472606ED4fA22623Acf62c60553" as const;

export const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  name: "Farcaster SignedKeyRequestValidator",
  version: "1",
  chainId: 10,
  verifyingContract: SIGNED_KEY_REQUEST_VALIDATOR_ADDRESS,
} as const;

export const SIGNED_KEY_REQUEST_TYPE = [
  { name: "requestFid", type: "uint256" },
  { name: "key", type: "bytes" },
  { name: "deadline", type: "uint256" },
] as const;

export const verifyKeyRequest = async (
  message: SignedKeyRequestMessage,
  signature: Uint8Array,
  address: Uint8Array,
): HubAsyncResult<boolean> => {
  const valid = await ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
      types: { SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE },
      primaryType: "SignedKeyRequest",
      message: { ...message, key: bytesToHex(message.key) },
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );

  return valid;
};
