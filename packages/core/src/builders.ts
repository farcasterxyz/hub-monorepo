import * as protobufs from "./protobufs";
import { blake3 } from "@noble/hashes/blake3";
import { err, ok } from "neverthrow";
import { HubAsyncResult } from "./errors";
import { Signer } from "./signers";
import { getFarcasterTime } from "./time";
import * as validations from "./validations";
import { PublicClients, defaultPublicClients } from "./eth/clients";

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
