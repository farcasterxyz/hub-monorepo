import * as protobufs from "./protobufs";
import { Protocol, UserNameType } from "./protobufs";
import { blake3 } from "@noble/hashes/blake3";
import { err, ok, Result } from "neverthrow";
import { bytesToUtf8String, utf8StringToBytes } from "./bytes";
import { ed25519, eip712 } from "./crypto";
import { HubAsyncResult, HubError, HubResult } from "./errors";
import { fromFarcasterTime, getFarcasterTime, toFarcasterTime } from "./time";
import {
  makeVerificationAddressClaim,
  recreateSolanaClaimMessage,
  VerificationAddressClaimSolana,
} from "./verifications";
import { defaultPublicClients, PublicClients } from "./eth/clients";
import { createRequire } from "module";
import { normalize } from "viem/ens";
const require = createRequire(import.meta.url);
const addon = require("./addon/index.node");

/** Number of seconds (10 minutes) that is appropriate for clock skew */
export const ALLOWED_CLOCK_SKEW_SECONDS = 10 * 60;

export const FNAME_REGEX = /^[a-z0-9][a-z0-9-]{0,15}$/;
export const HEX_REGEX = /^(0x)?[0-9A-Fa-f]+$/;
export const TWITTER_REGEX = /^[a-z0-9_]{0,15}$/;
export const GITHUB_REGEX = /^[a-z\d](?:[a-z\d]|-(?!-)){0,38}$/i;

export const USERNAME_MAX_LENGTH = 25;

export const EMBEDS_V1_CUTOFF = 73612800; // 5/3/23 00:00 UTC

/**
 * CPU intensive validation methods that are used during validations. By default, we use
 * pure JS implementations for compatibility, but we can also use native implementations if available.
 */
export type ValidationMethods = {
  ed25519_verify: (signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array) => Promise<boolean>;
  ed25519_signMessageHash: (hash: Uint8Array, signingKey: Uint8Array) => Promise<Uint8Array>;
  blake3_20: (message: Uint8Array) => Uint8Array;
};

/**
 * Pure JS implementations. These are used by default, but can be overridden by native implementations.
 */
const pureJSValidationMethods: ValidationMethods = {
  ed25519_verify: async (s: Uint8Array, m: Uint8Array, p: Uint8Array) =>
    (await ed25519.verifyMessageHashSignature(s, m, p)).unwrapOr(false),
  ed25519_signMessageHash: async (h: Uint8Array, s: Uint8Array) =>
    (await ed25519.signMessageHash(h, s)).unwrapOr(new Uint8Array([])),
  blake3_20: (message: Uint8Array) => blake3(message, { dkLen: 20 }),
};

export const createMessageHash = async (
  message?: Uint8Array,
  hashScheme?: protobufs.HashScheme,
  validationMethods: ValidationMethods = pureJSValidationMethods,
): HubAsyncResult<Uint8Array> => {
  if (!message || message.length === 0) {
    return err(new HubError("bad_request.validation_failure", "hash is missing"));
  }

  if (hashScheme !== protobufs.HashScheme.BLAKE3) {
    return err(new HubError("bad_request.validation_failure", "unsupported hash scheme"));
  }

  return ok(validationMethods.blake3_20(message));
};

export const signMessageHash = async (
  hash?: Uint8Array,
  signingKey?: Uint8Array,
  validationMethods: ValidationMethods = pureJSValidationMethods,
): HubAsyncResult<Uint8Array> => {
  if (!hash || hash.length === 0) {
    return err(new HubError("bad_request.validation_failure", "hash is missing"));
  }

  if (!signingKey || signingKey.length !== 64) {
    return err(new HubError("bad_request.validation_failure", "signingKey is invalid"));
  }

  return ok(await validationMethods.ed25519_signMessageHash(hash, signingKey));
};

export const verifySignedMessageHash = async (
  hash?: Uint8Array,
  signature?: Uint8Array,
  signer?: Uint8Array,
  validationMethods: ValidationMethods = pureJSValidationMethods,
): HubAsyncResult<boolean> => {
  if (!hash || hash.length === 0) {
    return err(new HubError("bad_request.validation_failure", "hash is missing"));
  }

  if (!signature || signature.length !== 64) {
    return err(new HubError("bad_request.validation_failure", "signature is invalid"));
  }

  if (!signer || signer.length !== 32) {
    return err(new HubError("bad_request.validation_failure", "signer is invalid"));
  }

  return ok(await validationMethods.ed25519_verify(signature, hash, signer));
};

export const validateMessageHash = (hash?: Uint8Array): HubResult<Uint8Array> => {
  if (!hash || hash.length === 0) {
    return err(new HubError("bad_request.validation_failure", "hash is missing"));
  }

  if (hash.length !== 20) {
    return err(new HubError("bad_request.validation_failure", "hash must be 20 bytes"));
  }

  return ok(hash);
};

// Expected format is [geo:<lat>,<long>}]
export const validateUserLocation = (location: string) => {
  try {
    if (typeof location !== "string") {
      return err(new HubError("bad_request.validation_failure", "Location must be a string"));
    }

    const isValid = addon.validateUserLocation(location);

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    return ok(location);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", (error as { message: string }).message));
  }
};

export const validateCastId = (castId?: protobufs.CastId): HubResult<protobufs.CastId> => {
  if (!castId) {
    return err(new HubError("bad_request.validation_failure", "castId is missing"));
  }
  return Result.combineWithAllErrors([validateFid(castId.fid), validateMessageHash(castId.hash)])
    .map(() => castId)
    .mapErr(
      (errs: HubError[]) => new HubError("bad_request.validation_failure", errs.map((e) => e.message).join(", ")),
    );
};

export const validateFid = (fid?: number | null): HubResult<number> => {
  if (typeof fid !== "number" || fid === 0) {
    return err(new HubError("bad_request.validation_failure", "fid is missing"));
  }

  if (fid < 0) {
    return err(new HubError("bad_request.validation_failure", "fid must be positive"));
  }

  if (!Number.isInteger(fid)) {
    return err(new HubError("bad_request.validation_failure", "fid must be an integer"));
  }

  return ok(fid);
};

export const validateSolAddress = (address?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!address || address.length === 0) {
    return err(new HubError("bad_request.validation_failure", "solana address is missing"));
  }

  if (address.length !== 32) {
    return err(new HubError("bad_request.validation_failure", "solana address must be 32 bytes"));
  }

  return ok(address);
};

export const validateSolBlockHash = (blockHash?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!blockHash || blockHash.length === 0) {
    return err(new HubError("bad_request.validation_failure", "blockHash is missing"));
  }

  if (blockHash.length !== 32) {
    return err(new HubError("bad_request.validation_failure", "blockHash must be 32 bytes"));
  }

  return ok(blockHash);
};

export const validateEthAddress = (address?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!address || address.length === 0) {
    return err(new HubError("bad_request.validation_failure", "Ethereum address is missing"));
  }

  if (address.length !== 20) {
    return err(new HubError("bad_request.validation_failure", "Ethereum address must be 20 bytes"));
  }

  return ok(address);
};

export const validateEthBlockHash = (blockHash?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!blockHash || blockHash.length === 0) {
    return err(new HubError("bad_request.validation_failure", "blockHash is missing"));
  }

  if (blockHash.length !== 32) {
    return err(new HubError("bad_request.validation_failure", "blockHash must be 32 bytes"));
  }

  return ok(blockHash);
};

export const validateEd25519PublicKey = (publicKey?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!publicKey || publicKey.length === 0) {
    return err(new HubError("bad_request.validation_failure", "publicKey is missing"));
  }

  if (publicKey.length !== 32) {
    return err(new HubError("bad_request.validation_failure", "publicKey must be 32 bytes"));
  }

  return ok(publicKey);
};

export const validateFarcasterTime = (farcasterTime: number) => {
  // Roundtrip the farcasterTime and bubble any errors up to catch invalid farcaster time inputs.
  const unixTime = fromFarcasterTime(farcasterTime);
  if (unixTime.isErr()) {
    return err(unixTime.error);
  }

  const rtFarcasterTime = toFarcasterTime(unixTime.value);

  if (rtFarcasterTime.isErr()) {
    return err(rtFarcasterTime.error);
  }

  return ok(rtFarcasterTime.value);
};

export const validateMessage = async (
  message: protobufs.Message,
  validationMethods: ValidationMethods = pureJSValidationMethods,
  publicClients: PublicClients = defaultPublicClients,
): HubAsyncResult<protobufs.Message> => {
  try {
    let dataBytes;
    let data;
    if (!message.data && !message.dataBytes) {
      return err(new HubError("bad_request.validation_failure", "Invalid message"));
    }
    if (!message.data) {
      dataBytes = message.dataBytes;

      if (!dataBytes) {
        return err(new HubError("bad_request.validation_failure", "Invalid message"));
      }

      data = protobufs.MessageData.decode(dataBytes);
    } else {
      data = message.data;
      dataBytes = protobufs.MessageData.encode(message.data).finish();
    }

    const encodedMessage = protobufs.Message.encode(
      protobufs.Message.create({
        dataBytes: dataBytes,
        hash: message.hash,
        hashScheme: message.hashScheme,
        signature: message.signature,
        signatureScheme: message.signatureScheme,
        signer: message.signer,
      }),
    ).finish();

    const isValid = addon.validateMessage(Buffer.from(encodedMessage), message.data?.network);

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    // Specific case from original validateMessage -> validateMessageData flow.
    // We retain this because snapchain delegates validation requiring rpcs to
    // ingestion rather than p2p validation:
    if (data.type === protobufs.MessageType.VERIFICATION_ADD_ETH_ADDRESS && !!data.verificationAddAddressBody) {
      const result = await validateVerificationAddAddressBody(
        data.verificationAddAddressBody,
        data.fid,
        data.network,
        publicClients,
      );

      if (result.isErr()) {
        return err(new HubError("bad_request.validation_failure", "Invalid message"));
      }
    }

    return ok(message);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", (error as { message: string }).message));
  }
};

export const validateMessageData = async <T extends protobufs.MessageData>(
  data: T,
  publicClients: PublicClients = defaultPublicClients,
): HubAsyncResult<T> => {
  // 1. Validate fid
  const validFid = validateFid(data.fid);
  if (validFid.isErr()) {
    return err(validFid.error);
  }

  const farcasterTime = getFarcasterTime();
  if (farcasterTime.isErr()) {
    return err(farcasterTime.error);
  }

  // 2. Validate timestamp
  if (data.timestamp - farcasterTime.value > ALLOWED_CLOCK_SKEW_SECONDS) {
    return err(new HubError("bad_request.validation_failure", "timestamp more than 10 mins in the future"));
  }

  // 3. Validate network
  const validNetwork = validateNetwork(data.network);
  if (validNetwork.isErr()) {
    return err(validNetwork.error);
  }

  // 4. Validate type
  const validType = validateMessageType(data.type);
  if (validType.isErr()) {
    return err(validType.error);
  }

  // 5. Validate that only one body is set
  const bodySet = Object.keys(data)
    .filter((k) => k.endsWith("Body"))
    // @ts-ignore: the compiler doesn't like us indexing into data with a string (k), but that's exactly what we want to do
    .map((k) => (data[k] !== undefined ? 1 : 0))
    .reduce((s: number, c: number) => s + c, 0);
  if (bodySet !== 1) {
    return err(new HubError("bad_request.validation_failure", "only one body can be set"));
  }

  // 6. Validate body
  // biome-ignore lint/suspicious/noExplicitAny: legacy from eslint migration
  let bodyResult: HubResult<any>;
  if (validType.value === protobufs.MessageType.CAST_ADD && !!data.castAddBody) {
    // Allow usage of embedsDeprecated if timestamp is before cut-off
    const allowEmbedsDeprecated = data.timestamp < EMBEDS_V1_CUTOFF;
    bodyResult = validateCastAddBody(data.castAddBody, allowEmbedsDeprecated);
  } else if (validType.value === protobufs.MessageType.CAST_REMOVE && !!data.castRemoveBody) {
    bodyResult = validateCastRemoveBody(data.castRemoveBody);
  } else if (
    (validType.value === protobufs.MessageType.REACTION_ADD ||
      validType.value === protobufs.MessageType.REACTION_REMOVE) &&
    !!data.reactionBody
  ) {
    bodyResult = validateReactionBody(data.reactionBody);
  } else if (validType.value === protobufs.MessageType.LINK_COMPACT_STATE && !!data.linkCompactStateBody) {
    bodyResult = validateLinkCompactStateBody(data.linkCompactStateBody);
  } else if (
    (validType.value === protobufs.MessageType.LINK_ADD || validType.value === protobufs.MessageType.LINK_REMOVE) &&
    !!data.linkBody
  ) {
    bodyResult = validateLinkBody(data.linkBody);
  } else if (validType.value === protobufs.MessageType.USER_DATA_ADD && !!data.userDataBody) {
    bodyResult = validateUserDataAddBody(data.userDataBody);
  } else if (
    validType.value === protobufs.MessageType.VERIFICATION_ADD_ETH_ADDRESS &&
    !!data.verificationAddAddressBody
  ) {
    bodyResult = await validateVerificationAddAddressBody(
      data.verificationAddAddressBody,
      validFid.value,
      validNetwork.value,
      publicClients,
    );
  } else if (validType.value === protobufs.MessageType.VERIFICATION_REMOVE && !!data.verificationRemoveBody) {
    bodyResult = validateVerificationRemoveBody(data.verificationRemoveBody);
  } else if (validType.value === protobufs.MessageType.USERNAME_PROOF && !!data.usernameProofBody) {
    bodyResult = validateUsernameProofBody(data.usernameProofBody, data);
  } else if (validType.value === protobufs.MessageType.FRAME_ACTION && !!data.frameActionBody) {
    bodyResult = validateFrameActionBody(data.frameActionBody);
  } else {
    return err(new HubError("bad_request.invalid_param", "bodyType is invalid"));
  }

  if (bodyResult.isErr()) {
    return err(bodyResult.error);
  }

  return ok(data);
};

export const validateVerificationAddSolAddressSignature = async (
  body: protobufs.VerificationAddAddressBody,
  fid: number,
  network: protobufs.FarcasterNetwork,
): HubAsyncResult<Uint8Array> => {
  if (body.claimSignature.length !== 64) {
    return err(new HubError("bad_request.validation_failure", "claimSignature != 64 bytes"));
  }

  const reconstructedClaim = makeVerificationAddressClaim(fid, body.address, network, body.blockHash, body.protocol);

  if (reconstructedClaim.isErr()) {
    return err(reconstructedClaim.error);
  }

  const fullMessage = recreateSolanaClaimMessage(
    reconstructedClaim.value as VerificationAddressClaimSolana,
    body.address,
  );

  const verificationResult = await pureJSValidationMethods.ed25519_verify(
    body.claimSignature,
    fullMessage,
    body.address,
  );
  if (!verificationResult) {
    return err(new HubError("bad_request.validation_failure", "invalid claimSignature"));
  }

  return ok(body.claimSignature);
};

export const validateVerificationAddEthAddressSignature = async (
  body: protobufs.VerificationAddAddressBody,
  fid: number,
  network: protobufs.FarcasterNetwork,
  publicClients: PublicClients = defaultPublicClients,
): HubAsyncResult<Uint8Array> => {
  if (body.claimSignature.length > 2048) {
    return err(new HubError("bad_request.validation_failure", "claimSignature > 2048 bytes"));
  }

  const reconstructedClaim = makeVerificationAddressClaim(
    fid,
    body.address,
    network,
    body.blockHash,
    Protocol.ETHEREUM,
  );
  if (reconstructedClaim.isErr()) {
    return err(reconstructedClaim.error);
  }

  const verificationResult = await eip712.verifyVerificationEthAddressClaimSignature(
    reconstructedClaim.value,
    body.claimSignature,
    body.address,
    body.verificationType,
    body.chainId,
    publicClients,
  );

  if (verificationResult.isErr()) {
    return err(verificationResult.error);
  }

  if (!verificationResult.value) {
    return err(new HubError("bad_request.validation_failure", "invalid claimSignature"));
  }

  return ok(body.claimSignature);
};

export const validateUrl = (url: string): HubResult<string> => {
  if (typeof url !== "string") {
    return err(new HubError("bad_request.validation_failure", "url must be a string"));
  }

  const urlBytesResult = utf8StringToBytes(url);
  if (urlBytesResult.isErr()) {
    return err(new HubError("bad_request.invalid_param", "url must be encodable as utf8"));
  }
  const urlBytes = urlBytesResult.value;

  if (urlBytes.length < 1) {
    return err(new HubError("bad_request.invalid_param", "url < 1 byte"));
  }

  if (urlBytes.length > 256) {
    return err(new HubError("bad_request.invalid_param", "url > 256 bytes"));
  }

  return ok(url);
};

export const validateParent = (parent: protobufs.CastId | string): HubResult<protobufs.CastId | string> => {
  try {
    let encodedParent;

    if (typeof parent === "string") {
      encodedParent = new Uint8Array(Buffer.from(parent, "utf-8"));
    } else {
      encodedParent = protobufs.CastId.encode(parent).finish();
    }

    const isValid = addon.validateParent(Buffer.from(encodedParent));

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    return ok(parent);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", (error as { message: string }).message));
  }
};

export const validateEmbed = (embed: protobufs.Embed): HubResult<protobufs.Embed> => {
  try {
    const encodedEmbed = protobufs.Embed.encode(embed).finish();

    const isValid = addon.validateEmbed(Buffer.from(encodedEmbed));

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    return ok(embed);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", (error as { message: string }).message));
  }
};

export const validateCastAddBody = (
  body: protobufs.CastAddBody,
  allowEmbedsDeprecated = false,
): HubResult<protobufs.CastAddBody> => {
  try {
    if (body.text === undefined || body.text === null) {
      return err(new HubError("bad_request.validation_failure", "text is missing"));
    }

    const encodedBody = protobufs.CastAddBody.encode(body).finish();

    const isValid = addon.validateCastAddBody(Buffer.from(encodedBody), allowEmbedsDeprecated);

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    if (body.parentCastId && body.parentUrl) {
      return err(new HubError("bad_request.validation_failure", "cannot use both parentUrl and parentCastId"));
    }

    return ok(body);
  } catch (error) {
    return err(new HubError("bad_request.validation_failure", "Invalid cast add body"));
  }
};

export const validateCastRemoveBody = (body: protobufs.CastRemoveBody): HubResult<protobufs.CastRemoveBody> => {
  try {
    const encodedBody = protobufs.CastRemoveBody.encode(body).finish();

    const isValid = addon.validateCastRemoveBody(Buffer.from(encodedBody));

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    return ok(body);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", "Invalid cast remove body"));
  }
};

export const validateLinkType = (type: string): HubResult<string> => {
  try {
    if (typeof type !== "string") {
      return err(new HubError("bad_request.validation_failure", "link type must be a string"));
    }

    const isValid = addon.validateLinkType(type);

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    return ok(type);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", (error as { message: string }).message));
  }
};

export const validateReactionType = (type: number): HubResult<protobufs.ReactionType> => {
  try {
    if (typeof type !== "number") {
      return err(new HubError("bad_request.validation_failure", "reaction type must be a number"));
    }

    const isValid = addon.validateReactionType(type);

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    return ok(type);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", (error as { message: string }).message));
  }
};

export const validateTarget = (
  target: protobufs.CastId | string | number,
): HubResult<protobufs.CastId | string | number> => {
  if (typeof target === "string") {
    return validateUrl(target);
  } else if (typeof target === "number") {
    return validateFid(target);
  } else {
    return validateCastId(target);
  }
};

export const validateMessageType = (type: number): HubResult<protobufs.MessageType> => {
  try {
    if (typeof type !== "number") {
      return err(new HubError("bad_request.validation_failure", "message type must be a number"));
    }

    const isValid = addon.validateMessageType(type);

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    return ok(type);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", (error as { message: string }).message));
  }
};

export const validateNetwork = (network: number): HubResult<protobufs.FarcasterNetwork> => {
  try {
    if (typeof network !== "number") {
      return err(new HubError("bad_request.validation_failure", "network must be a number"));
    }

    const isValid = addon.validateNetwork(network);

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    return ok(network);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", (error as { message: string }).message));
  }
};

export const validateLinkCompactStateBody = (
  body: protobufs.LinkCompactStateBody,
): HubResult<protobufs.LinkCompactStateBody> => {
  try {
    const encodedBody = protobufs.LinkCompactStateBody.encode(body).finish();

    const isValid = addon.validateLinkCompactStateBody(Buffer.from(encodedBody));

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    return ok(body);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", (error as { message: string }).message));
  }
};

export const validateLinkBody = (body: protobufs.LinkBody): HubResult<protobufs.LinkBody> => {
  try {
    const encodedBody = protobufs.LinkBody.encode(body).finish();

    const isValid = addon.validateLinkBody(Buffer.from(encodedBody));

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    return ok(body);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", (error as { message: string }).message));
  }
};

export const validateReactionBody = (body: protobufs.ReactionBody): HubResult<protobufs.ReactionBody> => {
  try {
    const encodedBody = protobufs.ReactionBody.encode(body).finish();

    const isValid = addon.validateReactionBody(Buffer.from(encodedBody));

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    if (body.targetCastId && body.targetUrl) {
      return err(new HubError("bad_request.validation_failure", "cannot use both targetUrl and targetCastId"));
    }

    return ok(body);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", "Invalid reaction body"));
  }
};

export const validateVerificationAddAddressBody = async (
  body: protobufs.VerificationAddAddressBody,
  fid: number,
  network: protobufs.FarcasterNetwork,
  publicClients: PublicClients,
): HubAsyncResult<protobufs.VerificationAddAddressBody> => {
  switch (body.protocol) {
    case protobufs.Protocol.ETHEREUM:
      return await validateVerificationAddEthAddressBody(body, fid, network, publicClients);
    case protobufs.Protocol.SOLANA: {
      return validateVerificationAddSolAddressBody(body, fid, network);
    }
    default:
      return err(new HubError("bad_request.validation_failure", "invalid verification protocol"));
  }
};

export const validateVerificationAddEthAddressBody = async (
  body: protobufs.VerificationAddAddressBody,
  fid: number,
  network: protobufs.FarcasterNetwork,
  publicClients: PublicClients,
): HubAsyncResult<protobufs.VerificationAddAddressBody> => {
  const validAddress = validateEthAddress(body.address);
  if (validAddress.isErr()) {
    return err(validAddress.error);
  }

  const validBlockHash = validateEthBlockHash(body.blockHash);
  if (validBlockHash.isErr()) {
    return err(validBlockHash.error);
  }

  const validSignature = await validateVerificationAddEthAddressSignature(body, fid, network, publicClients);
  if (validSignature.isErr()) {
    return err(validSignature.error);
  }

  return ok(body);
};

export const validateVerificationAddSolAddressBody = async (
  body: protobufs.VerificationAddAddressBody,
  fid: number,
  network: protobufs.FarcasterNetwork,
): HubAsyncResult<protobufs.VerificationAddAddressBody> => {
  if (body.protocol !== protobufs.Protocol.SOLANA) {
    return err(new HubError("bad_request.validation_failure", "invalid verification protocol"));
  }

  if (validateSolAddress(body.address).isErr()) {
    return err(new HubError("bad_request.validation_failure", "solana address must be 32 bytes"));
  }

  if (validateSolBlockHash(body.blockHash).isErr()) {
    return err(new HubError("bad_request.validation_failure", "blockHash must be 32 bytes"));
  }

  const isVerified = await validateVerificationAddSolAddressSignature(body, fid, network);
  if (isVerified.isErr()) {
    return err(isVerified.error);
  }

  return ok(body);
};

export const validateVerificationRemoveBody = (
  body: protobufs.VerificationRemoveBody,
): HubResult<protobufs.VerificationRemoveBody> => {
  switch (body.protocol) {
    case protobufs.Protocol.ETHEREUM:
      return validateEthAddress(body.address).map(() => body);
    case protobufs.Protocol.SOLANA:
      return validateSolAddress(body.address).map(() => body);
    default:
      return err(new HubError("bad_request.validation_failure", "invalid verification protocol"));
  }
};

export const validateUsernameProofBody = (
  body: protobufs.UserNameProof,
  data: protobufs.MessageData,
): HubResult<protobufs.UserNameProof> => {
  // Gossiped username proofs must only have an ENS type
  if (!(body.type === UserNameType.USERNAME_TYPE_ENS_L1 || body.type === UserNameType.USERNAME_TYPE_BASENAME)) {
    return err(new HubError("bad_request.validation_failure", `invalid username type: ${body.type}`));
  }
  const validateName = validateEnsName(body.name);
  if (validateName.isErr()) {
    return err(validateName.error);
  }
  if (body.fid !== data.fid) {
    return err(
      new HubError("bad_request.validation_failure", "fid in username proof does not match fid in message data"),
    );
  }

  // Proof time is in Unix seconds
  const proofFarcasterTimestamp = toFarcasterTime(body.timestamp * 1000);
  if (proofFarcasterTimestamp.isErr()) {
    return err(proofFarcasterTimestamp.error);
  }
  if (proofFarcasterTimestamp.value !== data.timestamp) {
    return err(
      new HubError(
        "bad_request.validation_failure",
        "timestamp in username proof does not match timestamp in message data",
      ),
    );
  }
  return ok(body);
};

export const validateFrameActionBody = (body: protobufs.FrameActionBody): HubResult<protobufs.FrameActionBody> => {
  // url and buttonId are required and must not exceed the length limits. cast id is optional
  if (body.buttonIndex > 5) {
    return err(new HubError("bad_request.validation_failure", "invalid button index"));
  }

  if (validateBytesAsString(body.url, 1024, true).isErr()) {
    return err(new HubError("bad_request.validation_failure", "invalid url"));
  }
  if (validateBytesAsString(body.inputText, 256).isErr()) {
    return err(new HubError("bad_request.validation_failure", "invalid input text"));
  }
  if (validateBytesAsString(body.state, 4096).isErr()) {
    return err(new HubError("bad_request.validation_failure", "invalid state"));
  }
  if (validateBytesAsString(body.transactionId, 256).isErr()) {
    return err(new HubError("bad_request.validation_failure", "invalid transaction ID"));
  }
  if (validateBytesAsString(body.address, 64).isErr()) {
    return err(new HubError("bad_request.validation_failure", "invalid address"));
  }

  if (body.castId !== undefined) {
    const result = validateCastId(body.castId);
    if (result.isErr()) {
      return err(result.error);
    }
  }

  return ok(body);
};

const validateBytesAsString = (byteArray: Uint8Array, maxLength: number, required = false) => {
  if (required && byteArray.length === 0) {
    return err(new HubError("bad_request.validation_failure", "value is required"));
  }
  if (byteArray.length > maxLength) {
    return err(new HubError("bad_request.validation_failure", "value is too long"));
  }
  return ok(byteArray);
};

export const validateUserDataType = (type: number): HubResult<protobufs.UserDataType> => {
  if (
    !Object.values(protobufs.UserDataType).includes(type) ||
    type === protobufs.UserDataType.NONE ||
    type === protobufs.UserDataType.NONE
  ) {
    return err(new HubError("bad_request.validation_failure", "invalid user data type"));
  }

  return ok(type);
};

export const validateUserDataAddBody = (body: protobufs.UserDataBody): HubResult<protobufs.UserDataBody> => {
  try {
    const encodedBody = protobufs.UserDataBody.encode(body).finish();

    const isValid = addon.validateUserDataAddBody(Buffer.from(encodedBody));

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    return ok(body);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", (error as { message: string }).message));
  }
};

export const validateFname = <T extends string | Uint8Array>(fnameP?: T | null): HubResult<T> => {
  if (fnameP === undefined || fnameP === null || fnameP === "") {
    return err(new HubError("bad_request.validation_failure", "fname is missing"));
  }

  try {
    let fname;
    if (fnameP instanceof Uint8Array) {
      const fromBytes = bytesToUtf8String(fnameP);
      if (fromBytes.isErr()) {
        return err(fromBytes.error);
      }
      fname = fromBytes.value;
    } else {
      fname = fnameP;
    }

    const isValid = addon.validateFname(fname);

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    return ok(fnameP);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", (error as { message: string }).message));
  }
};

export const validateEnsName = <T extends string | Uint8Array>(ensNameP?: T | null): HubResult<T> => {
  if (ensNameP === undefined || ensNameP === null || ensNameP === "") {
    return err(new HubError("bad_request.validation_failure", "ensName is missing"));
  }

  let ensName;
  try {
    if (ensNameP instanceof Uint8Array) {
      const fromBytes = bytesToUtf8String(ensNameP);
      if (fromBytes.isErr()) {
        return err(fromBytes.error);
      }
      ensName = fromBytes.value;
    } else {
      ensName = ensNameP;
    }

    normalize(ensName);

    const isValid = addon.validateEnsName(ensName);

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    return ok(ensNameP);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", `ensName \"${ensName}\" is not a valid ENS name`));
  }
};

export const validateTwitterUsername = <T extends string | Uint8Array>(username?: T | null): HubResult<T> => {
  try {
    if (typeof username !== "string") {
      return err(new HubError("bad_request.validation_failure", "Twitter username must be a string"));
    }

    const isValid = addon.validateTwitterUsername(username);

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    return ok(username);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", (error as { message: string }).message));
  }
};

export const validateGithubUsername = <T extends string | Uint8Array>(username?: T | null): HubResult<T> => {
  try {
    if (typeof username !== "string") {
      return err(new HubError("bad_request.validation_failure", "GitHub username must be a string"));
    }

    const isValid = addon.validateGithubUsername(username);

    if (!isValid.ok) {
      return err(new HubError("bad_request.validation_failure", isValid.error));
    }

    return ok(username);
  } catch (error: unknown) {
    return err(new HubError("bad_request.validation_failure", (error as { message: string }).message));
  }
};
