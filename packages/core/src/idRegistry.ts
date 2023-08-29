import { Hex } from "viem";

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
  verifyingContract: "0x880a0b520732e951c03eb229e27144fdb9b80658", // TODO replace with final contract address
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
