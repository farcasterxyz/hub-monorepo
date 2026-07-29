import { Result, ResultAsync, err, ok } from "neverthrow";
import { bytesToHex, decodeAbiParameters, encodeAbiParameters, verifyTypedData } from "viem";
import { bytesToHexString, hexStringToBytes } from "./bytes";
import { HubAsyncResult, HubError, HubResult } from "./errors";
import * as protobufs from "./protobufs";

/**
 * Gasless (off-chain) signers, a.k.a. FIP-272 KEY_ADD / KEY_REMOVE.
 *
 * A gasless key is registered by submitting a `KEY_ADD` message to a snapchain node rather than by
 * sending a transaction to the onchain KeyRegistry. Authorization comes from an EIP-712 signature
 * by the fid's custody address, so the flow costs no gas and confirms in about a second.
 *
 * These live on snapchain's own EIP-712 domain, which is NOT the onchain
 * `Farcaster SignedKeyRequestValidator` domain used by the key gateway flow. The
 * `SignedKeyRequest` struct name is shared with the onchain flow for tooling continuity, but the
 * domain differs and carries no `verifyingContract` — nothing verifies these onchain. `chainId` is
 * cosmetic; wallets display it. Signing the wrong domain produces a signature snapchain rejects, so
 * the onchain helpers (`signKeyRequest`, `getSignedKeyRequestMetadata`) are not interchangeable
 * with the gasless ones (`signGaslessKeyRequest`, `getGaslessSignedKeyRequestMetadata`).
 */

/** The single EIP-712 domain shared by KeyAdd, KeyRemove and the gasless SignedKeyRequest. */
export const GASLESS_KEY_EIP_712_DOMAIN = {
  name: "Farcaster KeyAdd",
  version: "1",
  chainId: 1,
} as const;

export const GASLESS_KEY_ADD_TYPE = [
  { name: "fid", type: "uint256" },
  { name: "key", type: "bytes" },
  { name: "keyType", type: "uint32" },
  { name: "scopes", type: "uint32[]" },
  { name: "ttl", type: "uint32" },
  { name: "nonce", type: "uint32" },
  { name: "deadline", type: "uint256" },
] as const;

export const GASLESS_KEY_REMOVE_TYPE = [
  { name: "fid", type: "uint256" },
  { name: "key", type: "bytes" },
  { name: "nonce", type: "uint32" },
  { name: "deadline", type: "uint256" },
] as const;

export const GASLESS_SIGNED_KEY_REQUEST_TYPE = [
  { name: "requestFid", type: "uint256" },
  { name: "key", type: "bytes" },
  { name: "deadline", type: "uint256" },
] as const;

export const GASLESS_KEY_ADD_EIP_712_TYPES = {
  domain: GASLESS_KEY_EIP_712_DOMAIN,
  types: { KeyAdd: GASLESS_KEY_ADD_TYPE },
} as const;

export const GASLESS_KEY_REMOVE_EIP_712_TYPES = {
  domain: GASLESS_KEY_EIP_712_DOMAIN,
  types: { KeyRemove: GASLESS_KEY_REMOVE_TYPE },
} as const;

export const GASLESS_SIGNED_KEY_REQUEST_EIP_712_TYPES = {
  domain: GASLESS_KEY_EIP_712_DOMAIN,
  types: { SignedKeyRequest: GASLESS_SIGNED_KEY_REQUEST_TYPE },
} as const;

/** ABI of the metadata blob carried in `KeyAddBody.metadata`. Same layout as the onchain struct. */
export const GASLESS_SIGNED_KEY_REQUEST_METADATA_ABI = [
  {
    type: "tuple",
    name: "SignedKeyRequestMetadata",
    components: [
      { name: "requestFid", type: "uint256" },
      { name: "requestSigner", type: "address" },
      { name: "signature", type: "bytes" },
      { name: "deadline", type: "uint256" },
    ],
  },
] as const;

/** The only key type defined by the FIP. */
export const KEY_TYPE_ED25519 = 1;

/** The only `KeyAddBody.metadataType` snapchain accepts. */
export const METADATA_TYPE_SIGNED_KEY_REQUEST = 1;

/** `KeyRemoveBody.signatureType`: EIP-712 signature from the fid's custody address. */
export const KEY_REMOVE_SIGNATURE_TYPE_CUSTODY = 1;

/** `KeyRemoveBody.signatureType`: the key revokes itself via the message envelope signature. */
export const KEY_REMOVE_SIGNATURE_TYPE_SELF = 2;

/** Longest sliding TTL a KEY_ADD may request, in seconds. */
export const MAX_KEY_TTL_SECONDS = 90 * 24 * 60 * 60;

/** Longest `KeyAddBody.scopes` list accepted. Scopes are a set, so longer implies duplicates. */
export const MAX_KEY_ADD_SCOPES = 16;

/** Cap on active gasless keys per fid. Onchain signers are counted separately. */
export const MAX_GASLESS_KEYS_PER_FID = 1000;

/**
 * Message types a gasless key may be scoped to sign.
 *
 * KEY_ADD and KEY_REMOVE are deliberately absent — a signer must never be able to mint or revoke
 * another signer. Message types with no merge path on any network are absent for the same reason
 * snapchain denies them: admitting one is a deliberate, separately-gated decision.
 */
export const ADMISSIBLE_KEY_ADD_SCOPES: readonly protobufs.MessageType[] = [
  protobufs.MessageType.CAST_ADD,
  protobufs.MessageType.CAST_REMOVE,
  protobufs.MessageType.REACTION_ADD,
  protobufs.MessageType.REACTION_REMOVE,
  protobufs.MessageType.LINK_ADD,
  protobufs.MessageType.LINK_REMOVE,
  protobufs.MessageType.LINK_COMPACT_STATE,
  protobufs.MessageType.VERIFICATION_ADD_ETH_ADDRESS,
  protobufs.MessageType.VERIFICATION_REMOVE,
  protobufs.MessageType.USER_DATA_ADD,
  protobufs.MessageType.USERNAME_PROOF,
  protobufs.MessageType.FRAME_ACTION,
  protobufs.MessageType.LEND_STORAGE,
];

/** EIP-712 `KeyAdd` payload: the custody authorization for registering a gasless key. */
export type GaslessKeyAddMessage = {
  /** FID the key is being added to */
  fid: bigint;

  /** Bytes of the Ed25519 public key being added */
  key: Uint8Array;

  /** Key type, currently always 1 (Ed25519) */
  keyType: number;

  /** Message types this key is allowed to sign */
  scopes: number[];

  /** Sliding expiry window in seconds, refreshed on each use */
  ttl: number;

  /** Per-fid user nonce, strictly greater than the fid's current value */
  nonce: number;

  /** Farcaster timestamp after which this authorization is no longer valid */
  deadline: bigint;
};

/** EIP-712 `KeyRemove` payload: the custody authorization for revoking a gasless key. */
export type GaslessKeyRemoveMessage = {
  /** FID the key is being removed from */
  fid: bigint;

  /** Bytes of the Ed25519 public key being removed */
  key: Uint8Array;

  /** Per-fid user nonce, strictly greater than the fid's current value */
  nonce: number;

  /** Farcaster timestamp after which this authorization is no longer valid */
  deadline: bigint;
};

/** EIP-712 `SignedKeyRequest` payload: binds the requesting app's fid to the key. */
export type GaslessSignedKeyRequestMessage = {
  /** FID of the app requesting the key */
  requestFid: bigint;

  /** Bytes of the Ed25519 public key */
  key: Uint8Array;

  /** Farcaster timestamp after which this request is no longer valid */
  deadline: bigint;
};

/** Decoded contents of a `KeyAddBody.metadata` blob. */
export type GaslessSignedKeyRequestMetadata = {
  requestFid: bigint;
  requestSigner: `0x${string}`;
  signature: Uint8Array;
  deadline: bigint;
};

export const encodeGaslessSignedKeyRequestMetadata = (
  metadata: GaslessSignedKeyRequestMetadata,
): HubResult<Uint8Array> => {
  const signature = bytesToHexString(metadata.signature);
  if (signature.isErr()) {
    return err(signature.error);
  }

  const encoded = Result.fromThrowable(
    () =>
      encodeAbiParameters(GASLESS_SIGNED_KEY_REQUEST_METADATA_ABI, [
        {
          requestFid: metadata.requestFid,
          requestSigner: metadata.requestSigner,
          signature: signature.value,
          deadline: metadata.deadline,
        },
      ]),
    (e) => new HubError("bad_request.invalid_param", e as Error),
  )();
  if (encoded.isErr()) {
    return err(encoded.error);
  }

  return hexStringToBytes(encoded.value);
};

export const decodeGaslessSignedKeyRequestMetadata = (
  metadata: Uint8Array,
): HubResult<GaslessSignedKeyRequestMetadata> => {
  const hex = bytesToHexString(metadata);
  if (hex.isErr()) {
    return err(hex.error);
  }

  const decoded = Result.fromThrowable(
    () => decodeAbiParameters(GASLESS_SIGNED_KEY_REQUEST_METADATA_ABI, hex.value),
    (e) => new HubError("bad_request.invalid_param", e as Error),
  )();
  if (decoded.isErr()) {
    return err(decoded.error);
  }

  const struct = decoded.value[0];
  const signature = hexStringToBytes(struct.signature);
  if (signature.isErr()) {
    return err(signature.error);
  }

  return ok({
    requestFid: struct.requestFid,
    requestSigner: struct.requestSigner,
    signature: signature.value,
    deadline: struct.deadline,
  });
};

export const verifyKeyAdd = async (
  message: GaslessKeyAddMessage,
  signature: Uint8Array,
  address: Uint8Array,
): HubAsyncResult<boolean> => {
  return ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      ...GASLESS_KEY_ADD_EIP_712_TYPES,
      primaryType: "KeyAdd",
      message: { ...message, key: bytesToHex(message.key) },
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );
};

export const verifyKeyRemove = async (
  message: GaslessKeyRemoveMessage,
  signature: Uint8Array,
  address: Uint8Array,
): HubAsyncResult<boolean> => {
  return ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      ...GASLESS_KEY_REMOVE_EIP_712_TYPES,
      primaryType: "KeyRemove",
      message: { ...message, key: bytesToHex(message.key) },
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );
};

export const verifyGaslessKeyRequest = async (
  message: GaslessSignedKeyRequestMessage,
  signature: Uint8Array,
  address: Uint8Array,
): HubAsyncResult<boolean> => {
  return ResultAsync.fromPromise(
    verifyTypedData({
      address: bytesToHex(address),
      ...GASLESS_SIGNED_KEY_REQUEST_EIP_712_TYPES,
      primaryType: "SignedKeyRequest",
      message: { ...message, key: bytesToHex(message.key) },
      signature,
    }),
    (e) => new HubError("unknown", e as Error),
  );
};
