import * as protobufs from './protobufs';
import { blake3 } from '@noble/hashes/blake3';
import { err, ok } from 'neverthrow';
import { HubAsyncResult, HubResult } from './errors';
import { Signer } from './signers';
import { getFarcasterTime } from './time';
import * as validations from './validations';

/** Internal Types  */

type MessageDataOptions = Pick<protobufs.MessageData, 'fid' | 'network'> & {
  timestamp?: number; // Farcaster timestamp
};

type MessageSignerOptions = Pick<protobufs.Message, 'signature' | 'signatureScheme' | 'signer'>;

type MessageBodyOptions = Pick<
  protobufs.MessageData,
  | 'castAddBody'
  | 'castRemoveBody'
  | 'reactionBody'
  | 'verificationAddEthAddressBody'
  | 'verificationRemoveBody'
  | 'signerAddBody'
  | 'signerRemoveBody'
  | 'userDataBody'
>;

/** Generic Methods */

const makeMessageData = <TData extends protobufs.MessageData>(
  bodyOptions: MessageBodyOptions,
  messageType: protobufs.MessageType,
  dataOptions: MessageDataOptions
): HubResult<TData> => {
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

  return validations.validateMessageData(data as TData);
};

const makeMessage = async <TMessage extends protobufs.Message>(
  messageData: protobufs.MessageData,
  signer: Signer
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
  signerOptions: MessageSignerOptions
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
  signer: Signer
): HubAsyncResult<protobufs.CastAddMessage> => {
  const data = makeCastAddData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeCastRemove = async (
  body: protobufs.CastRemoveBody,
  dataOptions: MessageDataOptions,
  signer: Signer
): HubAsyncResult<protobufs.CastRemoveMessage> => {
  const data = makeCastRemoveData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeCastAddData = (
  body: protobufs.CastAddBody,
  dataOptions: MessageDataOptions
): HubResult<protobufs.CastAddData> => {
  return makeMessageData({ castAddBody: body }, protobufs.MessageType.CAST_ADD, dataOptions);
};

export const makeCastRemoveData = (
  body: protobufs.CastRemoveBody,
  dataOptions: MessageDataOptions
): HubResult<protobufs.CastRemoveData> => {
  return makeMessageData({ castRemoveBody: body }, protobufs.MessageType.CAST_REMOVE, dataOptions);
};

/* -------------------------------------------------------------------------- */
/*                             REACTION METHODS                               */
/* -------------------------------------------------------------------------- */

export const makeReactionAdd = async (
  body: protobufs.ReactionBody,
  dataOptions: MessageDataOptions,
  signer: Signer
): HubAsyncResult<protobufs.ReactionAddMessage> => {
  const data = makeReactionAddData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeReactionRemove = async (
  body: protobufs.ReactionBody,
  dataOptions: MessageDataOptions,
  signer: Signer
): HubAsyncResult<protobufs.ReactionRemoveMessage> => {
  const data = makeReactionRemoveData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeReactionAddData = (
  body: protobufs.ReactionBody,
  dataOptions: MessageDataOptions
): HubResult<protobufs.ReactionAddData> => {
  return makeMessageData({ reactionBody: body }, protobufs.MessageType.REACTION_ADD, dataOptions);
};

export const makeReactionRemoveData = (
  body: protobufs.ReactionBody,
  dataOptions: MessageDataOptions
): HubResult<protobufs.ReactionRemoveData> => {
  return makeMessageData({ reactionBody: body }, protobufs.MessageType.REACTION_REMOVE, dataOptions);
};

/* -------------------------------------------------------------------------- */
/*                            VERIFICATION METHODS                            */
/* -------------------------------------------------------------------------- */

export const makeVerificationAddEthAddress = async (
  body: protobufs.VerificationAddEthAddressBody,
  dataOptions: MessageDataOptions,
  signer: Signer
): HubAsyncResult<protobufs.VerificationAddEthAddressMessage> => {
  const data = makeVerificationAddEthAddressData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeVerificationRemove = async (
  body: protobufs.VerificationRemoveBody,
  dataOptions: MessageDataOptions,
  signer: Signer
): HubAsyncResult<protobufs.VerificationRemoveMessage> => {
  const data = makeVerificationRemoveData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeVerificationAddEthAddressData = (
  body: protobufs.VerificationAddEthAddressBody,
  dataOptions: MessageDataOptions
): HubResult<protobufs.VerificationAddEthAddressData> => {
  return makeMessageData(
    { verificationAddEthAddressBody: body },
    protobufs.MessageType.VERIFICATION_ADD_ETH_ADDRESS,
    dataOptions
  );
};

export const makeVerificationRemoveData = (
  body: protobufs.VerificationRemoveBody,
  dataOptions: MessageDataOptions
): HubResult<protobufs.VerificationRemoveData> => {
  return makeMessageData({ verificationRemoveBody: body }, protobufs.MessageType.VERIFICATION_REMOVE, dataOptions);
};

/* -------------------------------------------------------------------------- */
/*                               SIGNER METHODS                               */
/* -------------------------------------------------------------------------- */

export const makeSignerAdd = async (
  body: protobufs.SignerAddBody,
  dataOptions: MessageDataOptions,
  signer: Signer
): HubAsyncResult<protobufs.SignerAddMessage> => {
  const data = makeSignerAddData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeSignerRemove = async (
  body: protobufs.SignerRemoveBody,
  dataOptions: MessageDataOptions,
  signer: Signer
): HubAsyncResult<protobufs.SignerRemoveMessage> => {
  const data = makeSignerRemoveData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeSignerAddData = (
  body: protobufs.SignerAddBody,
  dataOptions: MessageDataOptions
): HubResult<protobufs.SignerAddData> => {
  return makeMessageData({ signerAddBody: body }, protobufs.MessageType.SIGNER_ADD, dataOptions);
};

export const makeSignerRemoveData = (
  body: protobufs.SignerRemoveBody,
  dataOptions: MessageDataOptions
): HubResult<protobufs.SignerRemoveData> => {
  return makeMessageData({ signerRemoveBody: body }, protobufs.MessageType.SIGNER_REMOVE, dataOptions);
};

/* -------------------------------------------------------------------------- */
/*                             USER DATA METHODS                              */
/* -------------------------------------------------------------------------- */

export const makeUserDataAdd = async (
  body: protobufs.UserDataBody,
  dataOptions: MessageDataOptions,
  signer: Signer
): HubAsyncResult<protobufs.UserDataAddMessage> => {
  const data = makeUserDataAddData(body, dataOptions);
  if (data.isErr()) {
    return err(data.error);
  }
  return makeMessage(data.value, signer);
};

export const makeUserDataAddData = (
  body: protobufs.UserDataBody,
  dataOptions: MessageDataOptions
): HubResult<protobufs.UserDataAddData> => {
  return makeMessageData({ userDataBody: body }, protobufs.MessageType.USER_DATA_ADD, dataOptions);
};
