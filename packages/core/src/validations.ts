import * as protobufs from "./protobufs";
import { blake3 } from "@noble/hashes/blake3";
import { err, ok, Result } from "neverthrow";
import { bytesCompare, bytesToUtf8String, utf8StringToBytes } from "./bytes";
import { ed25519, eip712 } from "./crypto";
import { HubAsyncResult, HubError, HubResult } from "./errors";
import { getFarcasterTime, toFarcasterTime } from "./time";
import { makeVerificationAddressClaim } from "./verifications";
import { UserNameType } from "./protobufs";
import { normalize } from "viem/ens";
import { defaultPublicClients, PublicClients } from "./eth/clients";

/** Number of seconds (10 minutes) that is appropriate for clock skew */
export const ALLOWED_CLOCK_SKEW_SECONDS = 10 * 60;

export const FNAME_REGEX = /^[a-z0-9][a-z0-9-]{0,15}$/;
export const HEX_REGEX = /^(0x)?[0-9A-Fa-f]+$/;

export const USERNAME_MAX_LENGTH = 20;

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

export const validateMessage = async (
  message: protobufs.Message,
  validationMethods: ValidationMethods = pureJSValidationMethods,
  publicClients: PublicClients = defaultPublicClients,
): HubAsyncResult<protobufs.Message> => {
  // 1. Check the message data
  const data = message.data;
  if (!data) {
    return err(new HubError("bad_request.validation_failure", "data is missing"));
  }
  const validData = await validateMessageData(data, publicClients);
  if (validData.isErr()) {
    return err(validData.error);
  }

  // The hash to verify the signature against. This is either the hash of the data_bytes, or the hash
  // of the data field encoded using ts-proto protobuf
  const hash = message.hash;
  if (!hash) {
    return err(new HubError("bad_request.validation_failure", "hash is missing"));
  }

  // Computed from the data_bytes if set, otherwise from the data
  let computedHash;

  // 2. If the data_bytes are set, we'll validate signature against that
  if (message.dataBytes && message.dataBytes.length > 0) {
    if (message.dataBytes.length > 1024) {
      return err(new HubError("bad_request.validation_failure", "dataBytes > 1024 bytes"));
    }
    // 2a. Use the databytes as the hash to check the signature against
    computedHash = validationMethods.blake3_20(message.dataBytes);
  } else {
    // 2b. Use the protobuf encoded data as the hash to check the signature against
    computedHash = validationMethods.blake3_20(protobufs.MessageData.encode(data).finish());
  }

  // 3. Check that the hashScheme and hash are valid
  if (message.hashScheme === protobufs.HashScheme.BLAKE3) {
    // we have to use bytesCompare, because TypedArrays cannot be compared directly
    if (bytesCompare(hash, computedHash) !== 0) {
      return err(new HubError("bad_request.validation_failure", "invalid hash"));
    }
  } else {
    return err(new HubError("bad_request.validation_failure", "invalid hashScheme"));
  }

  // 4. Check that the signatureScheme and signature are valid
  const signature = message.signature;
  if (!signature) {
    return err(new HubError("bad_request.validation_failure", "signature is missing"));
  }

  // 5. Check that the signer is valid
  const signer = message.signer;
  if (!signer) {
    return err(new HubError("bad_request.validation_failure", "signer is missing"));
  }

  // 6. Check that the signature is valid
  if (message.signatureScheme === protobufs.SignatureScheme.ED25519) {
    const signatureIsValid = await validationMethods.ed25519_verify(signature, hash, signer);

    if (!signatureIsValid) {
      return err(new HubError("bad_request.validation_failure", "invalid signature"));
    }
  } else {
    return err(new HubError("bad_request.validation_failure", "invalid signatureScheme"));
  }

  return ok(message);
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

  // 5. Validate body
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
  } else if (
    (validType.value === protobufs.MessageType.LINK_ADD || validType.value === protobufs.MessageType.LINK_REMOVE) &&
    !!data.linkBody
  ) {
    bodyResult = validateLinkBody(data.linkBody);
  } else if (validType.value === protobufs.MessageType.USER_DATA_ADD && !!data.userDataBody) {
    bodyResult = validateUserDataAddBody(data.userDataBody);
  } else if (validType.value === protobufs.MessageType.VERIFICATION_ADD_ADDRESS && !!data.verificationAddAddressBody) {
    // Special check for verification claim
    bodyResult = await validateVerificationAddEthAddressBody(
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

export const validateVerificationAddEthAddressSignature = async (
  body: protobufs.VerificationAddAddressBody,
  fid: number,
  network: protobufs.FarcasterNetwork,
  publicClients: PublicClients = defaultPublicClients,
): HubAsyncResult<Uint8Array> => {
  if (body.protocolSignature.length > 256) {
    return err(new HubError("bad_request.validation_failure", "protocolSignature > 256 bytes"));
  }

  const reconstructedClaim = makeVerificationAddressClaim(fid, body.address, network, body.blockHash);
  if (reconstructedClaim.isErr()) {
    return err(reconstructedClaim.error);
  }

  const verificationResult = await eip712.verifyVerificationEthAddressClaimSignature(
    reconstructedClaim.value,
    body.protocolSignature,
    body.address,
    body.verificationType,
    body.chainId,
    publicClients,
  );

  if (verificationResult.isErr()) {
    return err(verificationResult.error);
  }

  if (!verificationResult.value) {
    return err(new HubError("bad_request.validation_failure", "invalid protocolSignature"));
  }

  return ok(body.protocolSignature);
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
  if (typeof parent === "string") {
    return validateUrl(parent);
  } else {
    return validateCastId(parent);
  }
};

export const validateEmbed = (embed: protobufs.Embed): HubResult<protobufs.Embed> => {
  if (embed.url !== undefined) {
    return validateUrl(embed.url).map(() => embed);
  } else if (embed.castId !== undefined) {
    return validateCastId(embed.castId).map(() => embed);
  } else {
    return err(new HubError("bad_request.validation_failure", "embed must have either url or castId"));
  }
};

export const validateCastAddBody = (
  body: protobufs.CastAddBody,
  allowEmbedsDeprecated = false,
): HubResult<protobufs.CastAddBody> => {
  const text = body.text;
  if (text === undefined || text === null) {
    return err(new HubError("bad_request.validation_failure", "text is missing"));
  }

  const textUtf8BytesResult = utf8StringToBytes(text);
  if (textUtf8BytesResult.isErr()) {
    return err(new HubError("bad_request.invalid_param", "text must be encodable as utf8"));
  }
  const textBytes = textUtf8BytesResult.value;

  if (textBytes.length > 320) {
    return err(new HubError("bad_request.validation_failure", "text > 320 bytes"));
  }

  if (body.embeds.length > 2) {
    return err(new HubError("bad_request.validation_failure", "embeds > 2"));
  }

  if (allowEmbedsDeprecated && body.embedsDeprecated.length > 2) {
    return err(new HubError("bad_request.validation_failure", "string embeds > 2"));
  }

  if (!allowEmbedsDeprecated && body.embedsDeprecated.length > 0) {
    return err(new HubError("bad_request.validation_failure", "string embeds have been deprecated"));
  }

  if (body.mentions.length > 10) {
    return err(new HubError("bad_request.validation_failure", "mentions > 10"));
  }

  if (body.mentions.length !== body.mentionsPositions.length) {
    return err(new HubError("bad_request.validation_failure", "mentions and mentionsPositions must match"));
  }

  if (body.embeds.length > 0 && body.embedsDeprecated.length > 0) {
    return err(new HubError("bad_request.validation_failure", "cannot use both embeds and string embeds"));
  }

  if (
    body.text.length === 0 &&
    body.embeds.length === 0 &&
    body.embedsDeprecated.length === 0 &&
    body.mentions.length === 0
  ) {
    return err(new HubError("bad_request.validation_failure", "cast is empty"));
  }

  for (let i = 0; i < body.embeds.length; i++) {
    const embed = body.embeds[i];

    if (embed === undefined) {
      return err(new HubError("bad_request.validation_failure", "embed is missing"));
    }

    const embedIsValid = validateEmbed(embed);
    if (embedIsValid.isErr()) {
      return err(embedIsValid.error);
    }
  }

  for (let i = 0; i < body.embedsDeprecated.length; i++) {
    const embed = body.embedsDeprecated[i];

    if (embed === undefined) {
      return err(new HubError("bad_request.validation_failure", "string embed is missing"));
    }

    const embedIsValid = validateUrl(embed);
    if (embedIsValid.isErr()) {
      return err(embedIsValid.error);
    }
  }

  for (let i = 0; i < body.mentions.length; i++) {
    const mention = validateFid(body.mentions[i]);
    if (mention.isErr()) {
      return err(mention.error);
    }
    const position = body.mentionsPositions[i];
    if (typeof position !== "number" || !Number.isInteger(position)) {
      return err(new HubError("bad_request.validation_failure", "mentionsPositions must be integers"));
    }
    if (position < 0 || position > textBytes.length) {
      return err(new HubError("bad_request.validation_failure", "mentionsPositions must be a position in text"));
    }
    if (i > 0) {
      // biome-ignore lint/style/noNonNullAssertion: not sure why we do this, legacy when migrating from eslint.
      const prevPosition = body.mentionsPositions[i - 1]!;
      if (position < prevPosition) {
        return err(
          new HubError("bad_request.validation_failure", "mentionsPositions must be sorted in ascending order"),
        );
      }
    }
  }

  if (body.parentCastId !== undefined && body.parentUrl !== undefined) {
    return err(new HubError("bad_request.validation_failure", "cannot use both parentUrl and parentCastId"));
  }

  const parent = body.parentCastId ?? body.parentUrl;
  if (parent !== undefined) {
    const validParent = validateParent(parent);
    if (validParent.isErr()) {
      return err(validParent.error);
    }
  }

  return ok(body);
};

export const validateCastRemoveBody = (body: protobufs.CastRemoveBody): HubResult<protobufs.CastRemoveBody> => {
  return validateMessageHash(body.targetHash).map(() => body);
};

export const validateLinkType = (type: string): HubResult<string> => {
  const typeBuffer = Buffer.from(type);
  if (type.length === 0 || typeBuffer.length > 8) {
    return err(new HubError("bad_request.validation_failure", "type must be between 1-8 bytes"));
  }

  return ok(type);
};

export const validateReactionType = (type: number): HubResult<protobufs.ReactionType> => {
  if (!Object.values(protobufs.ReactionType).includes(type)) {
    return err(new HubError("bad_request.validation_failure", "invalid reaction type"));
  }

  return ok(type);
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
  if (!Object.values(protobufs.MessageType).includes(type)) {
    return err(new HubError("bad_request.validation_failure", "invalid message type"));
  }

  return ok(type);
};

export const validateNetwork = (network: number): HubResult<protobufs.FarcasterNetwork> => {
  if (!Object.values(protobufs.FarcasterNetwork).includes(network)) {
    return err(new HubError("bad_request.validation_failure", "invalid network"));
  }

  return ok(network);
};

export const validateLinkBody = (body: protobufs.LinkBody): HubResult<protobufs.LinkBody> => {
  const validatedType = validateLinkType(body.type);
  if (validatedType.isErr()) {
    return err(validatedType.error);
  }

  const target = body.targetFid;
  if (target === undefined) {
    return err(new HubError("bad_request.validation_failure", "target is missing"));
  }

  return validateTarget(target).map(() => body);
};

export const validateReactionBody = (body: protobufs.ReactionBody): HubResult<protobufs.ReactionBody> => {
  const validatedType = validateReactionType(body.type);
  if (validatedType.isErr()) {
    return err(validatedType.error);
  }

  if (body.targetCastId !== undefined && body.targetUrl !== undefined) {
    return err(new HubError("bad_request.validation_failure", "cannot use both targetUrl and targetCastId"));
  }

  const target = body.targetCastId ?? body.targetUrl;
  if (target === undefined) {
    return err(new HubError("bad_request.validation_failure", "target is missing"));
  }

  return validateTarget(target).map(() => body);
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

export const validateVerificationRemoveBody = (
  body: protobufs.VerificationRemoveBody,
): HubResult<protobufs.VerificationRemoveBody> => {
  switch (body.protocol) {
    case protobufs.Protocol.ETHEREUM:
      return validateEthAddress(body.address).map(() => body);
    default:
      return err(new HubError("bad_request.validation_failure", "invalid verification protocol"));
  }
};

export const validateUsernameProofBody = (
  body: protobufs.UserNameProof,
  data: protobufs.MessageData,
): HubResult<protobufs.UserNameProof> => {
  // Gossiped username proofs must only have an ENS type
  if (body.type !== UserNameType.USERNAME_TYPE_ENS_L1) {
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

  if (validateBytesAsString(body.url, 256, true).isErr()) {
    return err(new HubError("bad_request.validation_failure", "invalid url"));
  }
  if (validateBytesAsString(body.inputText, 256).isErr()) {
    return err(new HubError("bad_request.validation_failure", "invalid input text"));
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
  const { type, value } = body;

  const textUtf8BytesResult = utf8StringToBytes(value);
  if (textUtf8BytesResult.isErr()) {
    return err(new HubError("bad_request.invalid_param", "value cannot be encoded as utf8"));
  }

  const valueBytes = textUtf8BytesResult.value;

  switch (type) {
    case protobufs.UserDataType.PFP:
      if (valueBytes.length > 256) {
        return err(new HubError("bad_request.validation_failure", "pfp value > 256"));
      }
      break;
    case protobufs.UserDataType.DISPLAY:
      if (valueBytes.length > 32) {
        return err(new HubError("bad_request.validation_failure", "display value > 32"));
      }
      break;
    case protobufs.UserDataType.BIO:
      if (valueBytes.length > 256) {
        return err(new HubError("bad_request.validation_failure", "bio value > 256"));
      }
      break;
    case protobufs.UserDataType.URL:
      if (valueBytes.length > 256) {
        return err(new HubError("bad_request.validation_failure", "url value > 256"));
      }
      break;
    case protobufs.UserDataType.USERNAME: {
      // Users are allowed to set fname = '' to remove their fname, otherwise we need a valid fname to add
      if (value !== "") {
        const validatedFname = validateFname(value);
        const validatedEnsName = validateEnsName(value);
        // At least one of fname or ensName must be valid
        if (validatedFname.isErr() && validatedEnsName.isErr()) {
          return err(validatedFname.error);
        }
      }
      break;
    }
    default:
      return err(new HubError("bad_request.validation_failure", "invalid user data type"));
  }

  return ok(body);
};

export const validateFname = <T extends string | Uint8Array>(fnameP?: T | null): HubResult<T> => {
  if (fnameP === undefined || fnameP === null || fnameP === "") {
    return err(new HubError("bad_request.validation_failure", "fname is missing"));
  }

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

  if (fname === undefined || fname === null || fname === "") {
    return err(new HubError("bad_request.validation_failure", "fname is missing"));
  }

  // FNAME_MAX_LENGTH - ".eth".length
  if (fname.length > 16) {
    return err(new HubError("bad_request.validation_failure", `fname "${fname}" > 16 characters`));
  }

  const hasValidChars = FNAME_REGEX.test(fname);
  if (hasValidChars === false) {
    return err(new HubError("bad_request.validation_failure", `fname "${fname}" doesn't match ${FNAME_REGEX}`));
  }

  return ok(fnameP);
};

export const validateEnsName = <T extends string | Uint8Array>(ensNameP?: T | null): HubResult<T> => {
  if (ensNameP === undefined || ensNameP === null || ensNameP === "") {
    return err(new HubError("bad_request.validation_failure", "ensName is missing"));
  }

  let ensName;
  if (ensNameP instanceof Uint8Array) {
    const fromBytes = bytesToUtf8String(ensNameP);
    if (fromBytes.isErr()) {
      return err(fromBytes.error);
    }
    ensName = fromBytes.value;
  } else {
    ensName = ensNameP;
  }

  if (ensName === undefined || ensName === null || ensName === "") {
    return err(new HubError("bad_request.validation_failure", "ensName is missing"));
  }

  try {
    normalize(ensName);
  } catch (e) {
    return err(new HubError("bad_request.validation_failure", `ensName "${ensName}" is not a valid ENS name`));
  }

  if (!ensName.endsWith(".eth")) {
    return err(new HubError("bad_request.validation_failure", `ensName "${ensName}" doesn't end with .eth`));
  }

  const nameParts = ensName.split(".");
  if (nameParts[0] === undefined || nameParts.length !== 2) {
    return err(new HubError("bad_request.validation_failure", `ensName "${ensName}" unsupported subdomain`));
  }

  if (ensName.length > USERNAME_MAX_LENGTH) {
    return err(new HubError("bad_request.validation_failure", `ensName "${ensName}" > 20 characters`));
  }

  const hasValidChars = FNAME_REGEX.test(nameParts[0]);
  if (!hasValidChars) {
    return err(new HubError("bad_request.validation_failure", `ensName "${ensName}" doesn't match ${FNAME_REGEX}`));
  }

  return ok(ensNameP);
};
