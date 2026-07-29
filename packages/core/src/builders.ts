import * as protobufs from "./protobufs";
import { blake3 } from "@noble/hashes/blake3";
import { err, ok } from "neverthrow";
import { HubAsyncResult, HubResult } from "./errors";
import { Eip712Signer, Signer } from "./signers";
import { getFarcasterTime } from "./time";
import * as validations from "./validations";
import { PublicClients, defaultPublicClients } from "./eth/clients";
import {
  KEY_REMOVE_SIGNATURE_TYPE_CUSTODY,
  KEY_REMOVE_SIGNATURE_TYPE_SELF,
  KEY_TYPE_ED25519,
  METADATA_TYPE_SIGNED_KEY_REQUEST,
} from "./gaslessKeys";

/** Internal Types  */

type MessageDataOptions = Pick<protobufs.MessageData, "fid" | "network"> & {
  timestamp?: number; // Farcaster timestamp
};

type MessageSignerOptions = Pick<protobufs.Message, "signature" | "signatureScheme" | "signer">;

type MessageBodyOptions = Pick<
  protobufs.MessageData,
  | "castAddBody"
  | "castRemoveBody"
  | "reactionBody"
  | "verificationAddAddressBody"
  | "verificationRemoveBody"
  | "userDataBody"
  | "linkBody"
  | "linkCompactStateBody"
  | "usernameProofBody"
  | "frameActionBody"
  | "lendStorageBody"
  | "keyAddBody"
  | "keyRemoveBody"
>;

/** Generic Methods */

const makeMessageData = async <TData extends protobufs.MessageData>(
  bodyOptions: MessageBodyOptions,
  messageType: protobufs.MessageType,
  dataOptions: MessageDataOptions,
  publicClients: PublicClients = defaultPublicClients,
): HubAsyncResult<TData> => {
  if (!dataOptions.timestamp) {
    getFarcasterTime().map((timestamp) => {
      dataOptions.timestamp = timestamp;
    });
  }

  const data = protobufs.MessageData.create({
    ...bodyOptions,
    type: messageType,
    ...dataOptions,
  });

  return validations.validateMessageData(data as TData, publicClients);
};

export const makeMessage = async <TMessage extends protobufs.Message>(
  messageData: protobufs.MessageData,
  signer: Signer,
): HubAsyncResult<TMessage> => {
  const dataBytes = protobufs.MessageData.encode(messageData).finish();

  const hash = blake3(dataBytes, { dkLen: 20 });

  const signature = await signer.signMessageHash(hash);
  if (signature.isErr()) return err(signature.error);

  const signerKey = await signer.getSignerKey();
  if (signerKey.isErr()) return err(signerKey.error);

  const message = protobufs.Message.create({
    data: messageData,
    dataBytes: dataBytes, // Messages for snapchain must use dataBytes because of serialization differences between js and rust
    hash,
    hashScheme: protobufs.HashScheme.BLAKE3,
    signature: signature.value,
    signatureScheme: signer.scheme,
    signer: signerKey.value,
  });

  return ok(message as TMessage);
};

export const makeMessageHash = async (messageData: protobufs.MessageData): HubAsyncResult<Uint8Array> => {
  const dataBytes = protobufs.MessageData.encode(messageData).finish();
  return ok(blake3(dataBytes, { dkLen: 20 }));
};

export const makeMessageWithSignature = async (
  messageData: protobufs.MessageData,
  signerOptions: MessageSignerOptions,
): HubAsyncResult<protobufs.Message> => {
  const dataBytes = protobufs.MessageData.encode(messageData).finish();

  const hash = blake3(dataBytes, { dkLen: 20 });

  const message = protobufs.Message.create({
    data: messageData,
    dataBytes: dataBytes,
    hash,
    hashScheme: protobufs.HashScheme.BLAKE3,
    ...signerOptions,
  });

  return validations.validateMessage(message);
};

/* -------------------------------------------------------------------------- */
/*                                CAST METHODS                                */
/* -------------------------------------------------------------------------- */

export const makeCastAdd = async (
  body: protobufs.CastAddBody,
  dataOptions: MessageDataOptions,
  signer: Signer,
): HubAsyncResult<protobufs.CastAddMessage> => {
  const data = await makeCastAddData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeCastRemove = async (
  body: protobufs.CastRemoveBody,
  dataOptions: MessageDataOptions,
  signer: Signer,
): HubAsyncResult<protobufs.CastRemoveMessage> => {
  const data = await makeCastRemoveData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeCastAddData = async (
  body: protobufs.CastAddBody,
  dataOptions: MessageDataOptions,
): HubAsyncResult<protobufs.CastAddData> => {
  return makeMessageData({ castAddBody: body }, protobufs.MessageType.CAST_ADD, dataOptions);
};

export const makeCastRemoveData = (
  body: protobufs.CastRemoveBody,
  dataOptions: MessageDataOptions,
): HubAsyncResult<protobufs.CastRemoveData> => {
  return makeMessageData({ castRemoveBody: body }, protobufs.MessageType.CAST_REMOVE, dataOptions);
};

/* -------------------------------------------------------------------------- */
/*                               LINK METHODS                                 */
/* -------------------------------------------------------------------------- */

export const makeLinkAdd = async (
  body: protobufs.LinkBody,
  dataOptions: MessageDataOptions,
  signer: Signer,
): HubAsyncResult<protobufs.LinkAddMessage> => {
  const data = await makeLinkAddData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeLinkCompactState = async (
  body: protobufs.LinkCompactStateBody,
  dataOptions: MessageDataOptions,
  signer: Signer,
): HubAsyncResult<protobufs.LinkCompactStateMessage> => {
  const data = await makeLinkCompactStateData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeLinkRemove = async (
  body: protobufs.LinkBody,
  dataOptions: MessageDataOptions,
  signer: Signer,
): HubAsyncResult<protobufs.LinkRemoveMessage> => {
  const data = await makeLinkRemoveData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeLinkAddData = (
  body: protobufs.LinkBody,
  dataOptions: MessageDataOptions,
): HubAsyncResult<protobufs.LinkAddData> => {
  return makeMessageData({ linkBody: body }, protobufs.MessageType.LINK_ADD, dataOptions);
};

export const makeLinkCompactStateData = (
  body: protobufs.LinkCompactStateBody,
  dataOptions: MessageDataOptions,
): HubAsyncResult<protobufs.LinkAddData> => {
  return makeMessageData({ linkCompactStateBody: body }, protobufs.MessageType.LINK_COMPACT_STATE, dataOptions);
};

export const makeLinkRemoveData = (
  body: protobufs.LinkBody,
  dataOptions: MessageDataOptions,
): HubAsyncResult<protobufs.LinkRemoveData> => {
  return makeMessageData({ linkBody: body }, protobufs.MessageType.LINK_REMOVE, dataOptions);
};

/* -------------------------------------------------------------------------- */
/*                             REACTION METHODS                               */
/* -------------------------------------------------------------------------- */

export const makeReactionAdd = async (
  body: protobufs.ReactionBody,
  dataOptions: MessageDataOptions,
  signer: Signer,
): HubAsyncResult<protobufs.ReactionAddMessage> => {
  const data = await makeReactionAddData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeReactionRemove = async (
  body: protobufs.ReactionBody,
  dataOptions: MessageDataOptions,
  signer: Signer,
): HubAsyncResult<protobufs.ReactionRemoveMessage> => {
  const data = await makeReactionRemoveData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeReactionAddData = (
  body: protobufs.ReactionBody,
  dataOptions: MessageDataOptions,
): HubAsyncResult<protobufs.ReactionAddData> => {
  return makeMessageData({ reactionBody: body }, protobufs.MessageType.REACTION_ADD, dataOptions);
};

export const makeReactionRemoveData = (
  body: protobufs.ReactionBody,
  dataOptions: MessageDataOptions,
): HubAsyncResult<protobufs.ReactionRemoveData> => {
  return makeMessageData({ reactionBody: body }, protobufs.MessageType.REACTION_REMOVE, dataOptions);
};

/* -------------------------------------------------------------------------- */
/*                            VERIFICATION METHODS                            */
/* -------------------------------------------------------------------------- */

export const makeVerificationAddEthAddress = async (
  body: protobufs.VerificationAddAddressBody,
  dataOptions: MessageDataOptions,
  signer: Signer,
  publicClients: PublicClients = defaultPublicClients,
): HubAsyncResult<protobufs.VerificationAddAddressMessage> => {
  const data = await makeVerificationAddEthAddressData(body, dataOptions, publicClients);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeVerificationRemove = async (
  body: protobufs.VerificationRemoveBody,
  dataOptions: MessageDataOptions,
  signer: Signer,
): HubAsyncResult<protobufs.VerificationRemoveMessage> => {
  const data = await makeVerificationRemoveData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeVerificationAddEthAddressData = (
  body: protobufs.VerificationAddAddressBody,
  dataOptions: MessageDataOptions,
  publicClients: PublicClients = defaultPublicClients,
): HubAsyncResult<protobufs.VerificationAddAddressData> => {
  return makeMessageData(
    { verificationAddAddressBody: body },
    protobufs.MessageType.VERIFICATION_ADD_ETH_ADDRESS,
    dataOptions,
    publicClients,
  );
};

export const makeVerificationRemoveData = (
  body: protobufs.VerificationRemoveBody,
  dataOptions: MessageDataOptions,
): HubAsyncResult<protobufs.VerificationRemoveData> => {
  return makeMessageData({ verificationRemoveBody: body }, protobufs.MessageType.VERIFICATION_REMOVE, dataOptions);
};

/* -------------------------------------------------------------------------- */
/*                             USER DATA METHODS                              */
/* -------------------------------------------------------------------------- */

export const makeUserDataAdd = async (
  body: protobufs.UserDataBody,
  dataOptions: MessageDataOptions,
  signer: Signer,
): HubAsyncResult<protobufs.UserDataAddMessage> => {
  const data = await makeUserDataAddData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeUserDataAddData = (
  body: protobufs.UserDataBody,
  dataOptions: MessageDataOptions,
): HubAsyncResult<protobufs.UserDataAddData> => {
  return makeMessageData({ userDataBody: body }, protobufs.MessageType.USER_DATA_ADD, dataOptions);
};

export const makeUsernameProof = async (
  body: protobufs.UserNameProof,
  dataOptions: MessageDataOptions,
  signer: Signer,
): HubAsyncResult<protobufs.UsernameProofMessage> => {
  const data = await makeUsernameProofData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeUsernameProofData = (
  body: protobufs.UserNameProof,
  dataOptions: MessageDataOptions,
): HubAsyncResult<protobufs.UsernameProofData> => {
  return makeMessageData({ usernameProofBody: body }, protobufs.MessageType.USERNAME_PROOF, dataOptions);
};

export const makeFrameAction = async (
  body: protobufs.FrameActionBody,
  dataOptions: MessageDataOptions,
  signer: Signer,
): HubAsyncResult<protobufs.FrameActionMessage> => {
  const data = await makeFrameActionData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeFrameActionData = (
  body: protobufs.FrameActionBody,
  dataOptions: MessageDataOptions,
): HubAsyncResult<protobufs.FrameActionData> => {
  return makeMessageData({ frameActionBody: body }, protobufs.MessageType.FRAME_ACTION, dataOptions);
};

export const makeLendStorageData = async (
  body: protobufs.LendStorageBody,
  dataOptions: MessageDataOptions,
): HubAsyncResult<protobufs.LendStorageData> => {
  return makeMessageData({ lendStorageBody: body }, protobufs.MessageType.LEND_STORAGE, dataOptions);
};

export const makeLendStorage = async (
  body: protobufs.LendStorageBody,
  dataOptions: MessageDataOptions,
  signer: Signer,
): HubAsyncResult<protobufs.LendStorageMessage> => {
  const data = await makeLendStorageData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

/* -------------------------------------------------------------------------- */
/*                          GASLESS SIGNER METHODS                            */
/* -------------------------------------------------------------------------- */

/**
 * Parameters for a gasless KEY_ADD (FIP-272), before the EIP-712 signatures are attached.
 *
 * `deadline` and any other timestamp here are Farcaster seconds, not Unix seconds — the node
 * compares them against the enclosing message's timestamp.
 */
export type KeyAddBodyOptions = {
  /** FID the key is being added to */
  fid: bigint;

  /** Ed25519 public key to register */
  key: Uint8Array;

  /** Message types this key may sign. Must be non-empty and drawn from ADMISSIBLE_KEY_ADD_SCOPES. */
  scopes: protobufs.MessageType[];

  /** Sliding expiry in seconds, refreshed on each use. Must be > 0 and <= MAX_KEY_TTL_SECONDS. */
  ttl: number;

  /** Per-fid user nonce. Must be strictly greater than the fid's `currentUserNonce`. */
  nonce: number;

  /** Farcaster timestamp after which the authorization expires */
  deadline: number;

  /** FID of the app requesting the key. Defaults to `fid`. */
  requestFid?: bigint;

  /** Defaults to KEY_TYPE_ED25519 (1), the only type snapchain accepts */
  keyType?: number;

  /** Optional: tx hash of the FID registration, for keys added before the registration settles */
  registrationTxHash?: Uint8Array;
};

/**
 * Builds a signed `KeyAddBody`: the SignedKeyRequest metadata from the requesting app, plus the
 * custody authorization over the key, its scopes and its TTL.
 *
 * `custodySigner` must hold the custody address of `options.fid`. `requestSigner` must hold the
 * custody address of `options.requestFid`, and defaults to `custodySigner` for the common case
 * where an fid is adding a key for itself.
 */
export const makeKeyAddBody = async (
  options: KeyAddBodyOptions,
  custodySigner: Eip712Signer,
  requestSigner: Eip712Signer = custodySigner,
): HubAsyncResult<protobufs.KeyAddBody> => {
  const keyType = options.keyType ?? KEY_TYPE_ED25519;
  const requestFid = options.requestFid ?? options.fid;

  const metadata = await requestSigner.getGaslessSignedKeyRequestMetadata({
    requestFid,
    key: options.key,
    deadline: BigInt(options.deadline),
  });
  if (metadata.isErr()) {
    return err(metadata.error);
  }

  const custodySignature = await custodySigner.signKeyAdd({
    fid: options.fid,
    key: options.key,
    keyType,
    scopes: options.scopes,
    ttl: options.ttl,
    nonce: options.nonce,
    deadline: BigInt(options.deadline),
  });
  if (custodySignature.isErr()) {
    return err(custodySignature.error);
  }

  return validations.validateKeyAddBody(
    protobufs.KeyAddBody.create({
      key: options.key,
      keyType,
      custodySignature: custodySignature.value,
      deadline: options.deadline,
      nonce: options.nonce,
      metadata: metadata.value,
      metadataType: METADATA_TYPE_SIGNED_KEY_REQUEST,
      registrationTxHash: options.registrationTxHash ?? new Uint8Array(),
      scopes: options.scopes,
      ttl: options.ttl,
    }),
    // Catch an already-expired deadline at build time rather than on submit. The message has no
    // timestamp yet, so use now — `makeKeyAddData` stamps it within milliseconds of this call.
    getFarcasterTime().unwrapOr(undefined),
  );
};

export type KeyRemoveBodyOptions = {
  /** FID the key is being removed from */
  fid: bigint;

  /** Ed25519 public key to revoke */
  key: Uint8Array;

  /** Nonce. For custody removal this is the user nonce; for self-revocation, the app nonce. */
  nonce: number;

  /** Farcaster timestamp after which the authorization expires */
  deadline: number;
};

/**
 * Builds a `KeyRemoveBody` authorized by the fid's custody address. Consumes the per-fid user
 * nonce, so `options.nonce` must exceed the fid's `currentUserNonce`.
 */
export const makeKeyRemoveBody = async (
  options: KeyRemoveBodyOptions,
  custodySigner: Eip712Signer,
): HubAsyncResult<protobufs.KeyRemoveBody> => {
  const signature = await custodySigner.signKeyRemove({
    fid: options.fid,
    key: options.key,
    nonce: options.nonce,
    deadline: BigInt(options.deadline),
  });
  if (signature.isErr()) {
    return err(signature.error);
  }

  return validations.validateKeyRemoveBody(
    protobufs.KeyRemoveBody.create({
      key: options.key,
      signature: signature.value,
      signatureType: KEY_REMOVE_SIGNATURE_TYPE_CUSTODY,
      deadline: options.deadline,
      nonce: options.nonce,
    }),
  );
};

/**
 * Builds a self-revoking `KeyRemoveBody`, which needs no custody signature: the message envelope
 * is signed by the key being revoked, and the node checks that `message.signer` equals
 * `body.key`. Pass the revoked key's Ed25519 signer to `makeKeyRemove` for this to be accepted.
 *
 * `body.signature` is left empty — the envelope signature is the authorization. Self-revocation
 * consumes the app-nonce namespace scoped to the `requestFid` that registered the key, so
 * `options.nonce` must exceed that requester's entry in `requesterFidNonces`, not the user nonce.
 */
export const makeKeyRemoveBodySelfRevoke = (
  options: Pick<KeyRemoveBodyOptions, "key" | "nonce" | "deadline">,
): HubResult<protobufs.KeyRemoveBody> => {
  return validations.validateKeyRemoveBody(
    protobufs.KeyRemoveBody.create({
      key: options.key,
      signature: new Uint8Array(),
      signatureType: KEY_REMOVE_SIGNATURE_TYPE_SELF,
      deadline: options.deadline,
      nonce: options.nonce,
    }),
  );
};

export const makeKeyAddData = async (
  body: protobufs.KeyAddBody,
  dataOptions: MessageDataOptions,
): HubAsyncResult<protobufs.KeyAddData> => {
  return makeMessageData({ keyAddBody: body }, protobufs.MessageType.KEY_ADD, dataOptions);
};

/**
 * `signer` must be the Ed25519 key being added. The envelope signature is proof of possession,
 * which is why KEY_ADD is exempt from the usual "signer must already be registered" check.
 */
export const makeKeyAdd = async (
  body: protobufs.KeyAddBody,
  dataOptions: MessageDataOptions,
  signer: Signer,
): HubAsyncResult<protobufs.KeyAddMessage> => {
  const data = await makeKeyAddData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeKeyRemoveData = async (
  body: protobufs.KeyRemoveBody,
  dataOptions: MessageDataOptions,
): HubAsyncResult<protobufs.KeyRemoveData> => {
  return makeMessageData({ keyRemoveBody: body }, protobufs.MessageType.KEY_REMOVE, dataOptions);
};

/**
 * For self-revocation (`signatureType` 2), `signer` must be the key being revoked. For custody
 * removal (`signatureType` 1) any Ed25519 signer works, since the custody signature in the body
 * carries the authorization.
 */
export const makeKeyRemove = async (
  body: protobufs.KeyRemoveBody,
  dataOptions: MessageDataOptions,
  signer: Signer,
): HubAsyncResult<protobufs.KeyRemoveMessage> => {
  const data = await makeKeyRemoveData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};
