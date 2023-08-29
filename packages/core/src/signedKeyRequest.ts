import { Hex, decodeAbiParameters, encodeAbiParameters } from "viem";

export type SignedKeyRequest = {
  requestFid: bigint;
  key: Hex;
  deadline: bigint;
};

export const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  name: "Farcaster SignedKeyRequestValidator",
  version: "1",
  chainId: 10,
  verifyingContract: "0x880a0b520732e951c03eb229e27144fdb9b80658", // TODO replace with final contract address
} as const;

export const SIGNED_KEY_REQUEST_VALIDATOR_METADATA_TYPE = [
  { name: "requestFid", type: "uint256" },
  { name: "key", type: "bytes" },
  { name: "deadline", type: "uint256" },
] as const;

const signedKeyRequestAbi = [
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
        name: "sig",
        type: "bytes",
      },
      {
        name: "deadline",
        type: "uint256",
      },
    ],
    name: "SignedKeyRequest",
    type: "tuple",
  },
] as const;

export const encodeSignedKeyRequest = ({
  requestFid,
  requestSigner,
  sig,
  deadline,
}: {
  /** FID of the user adding the key */
  requestFid: bigint;

  /** Custody address of the requesting FID */
  requestSigner: Hex;

  /** SignedKeyRequest signature */
  sig: Hex;

  /** Unix timestamp when the request expires */
  deadline: bigint;
}): Hex => {
  return encodeAbiParameters(signedKeyRequestAbi, [
    {
      requestFid,
      requestSigner,
      sig,
      deadline,
    },
  ]);
};

export const decodeSignedKeyRequest = (data: Hex) => {
  return decodeAbiParameters(signedKeyRequestAbi, data);
};
