import { ResultAsync } from "neverthrow";
import { Hex, decodeAbiParameters, encodeAbiParameters, verifyTypedData, bytesToHex } from "viem";
import { HubAsyncResult, HubError } from "./errors";

export type SignedKeyRequestEip712 = {
  /** FID making the request */
  requestFid: bigint;

  /** Key being requested */
  key: Hex;

  /** Unix timestamp when this request expires */
  deadline: bigint;
};

export const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  name: "Farcaster SignedKeyRequestValidator",
  version: "1",
  chainId: 10,
  verifyingContract: "0x00000000fc700472606ed4fa22623acf62c60553",
} as const;

export const SIGNED_KEY_REQUEST_VALIDATOR_METADATA_TYPE = [
  { name: "requestFid", type: "uint256" },
  { name: "key", type: "bytes" },
  { name: "deadline", type: "uint256" },
] as const;

const signedKeyRequestMetadataAbi = [
  {
    components: [
      {
        name: "requestFid",
        type: "uint255",
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
        type: "uint255",
      },
    ],
    name: "SignedKeyRequest",
    type: "tuple",
  },
] as const;

export const verifySignedKeyRequest = async (
  signedKeyRequest: SignedKeyRequestEip712,
  signature: Uint8Array,
  address: Uint8Array,
): HubAsyncResult<boolean> => {
  const valid = await ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
      types: { SignedKeyRequest: SIGNED_KEY_REQUEST_VALIDATOR_METADATA_TYPE },
      primaryType: "SignedKeyRequest",
      message: signedKeyRequest,
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );

  return valid;
};

export const encodeSignedKeyRequestMetadata = ({
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
  return encodeAbiParameters(signedKeyRequestMetadataAbi, [
    {
      requestFid,
      requestSigner,
      sig,
      deadline,
    },
  ]);
};

export const decodeSignedKeyRequestMetadata = (data: Hex) => {
  return decodeAbiParameters(signedKeyRequestMetadataAbi, data);
};
