import { verifyTypedData } from "viem";
import { ResultAsync } from "neverthrow";
import { Hex, bytesToHex } from "viem";
import { HubAsyncResult, HubError } from "./errors";

export type IdRegisterEip712 = {
  /** Address to register FID to */
  to: Hex;

  /** Address to use for recovery */
  recovery: Hex;

  /** IdRegistry nonce for address */
  nonce: bigint;

  /** Unix timestamp when this message expires */
  deadline: bigint;
};

export type IdTransferEip712 = {
  /** FID to transfer */
  fid: bigint;

  /** Address to transfer FID to */
  to: Hex;

  /** IdRegistry nonce for address */
  nonce: bigint;

  /** Unix timestamp when this message expires */
  deadline: bigint;
};

export const ID_REGISTRY_EIP_712_DOMAIN = {
  name: "Farcaster IdRegistry",
  version: "1",
  chainId: 10,
  verifyingContract: "0x00000000fcaf86937e41ba038b4fa40baa4b780a",
} as const;

export const ID_REGISTRY_REGISTER_TYPE = [
  { name: "to", type: "address" },
  { name: "recovery", type: "address" },
  { name: "nonce", type: "uint256" },
  { name: "deadline", type: "uint256" },
] as const;

export const ID_REGISTRY_TRANSFER_TYPE = [
  { name: "fid", type: "uint256" },
  { name: "to", type: "address" },
  { name: "nonce", type: "uint256" },
  { name: "deadline", type: "uint256" },
] as const;

export const verifyIdRegister = async (
  message: IdRegisterEip712,
  signature: Uint8Array,
  address: Uint8Array,
): HubAsyncResult<boolean> => {
  const valid = await ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      domain: ID_REGISTRY_EIP_712_DOMAIN,
      types: { Register: ID_REGISTRY_REGISTER_TYPE },
      primaryType: "Register",
      message,
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );

  return valid;
};

export const verifyIdTransfer = async (
  message: IdTransferEip712,
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
