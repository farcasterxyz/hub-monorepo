import * as protobufs from '@farcaster/protobufs';
import {
  bytesToHexString,
  hexStringToBytes,
  HubAsyncResult,
  HubResult,
  MessageSigner,
  Signer,
  toFarcasterTime,
  validations,
} from '@farcaster/utils';
import { blake3 } from '@noble/hashes/blake3';
import { err } from 'neverthrow';
import * as types from './types';
import * as utils from './utils';

/** Internal Types  */

type MessageDataOptions = {
  fid: number;
  network: protobufs.FarcasterNetwork;
  /** Unix milliseconds */
  timestamp?: number;
};

type MessageSignerOptions = {
  scheme: types.SignatureScheme;
  signerKeyHex: string;
};

type MessageBody =
  | protobufs.CastAddBody
  | protobufs.CastRemoveBody
  | protobufs.ReactionBody
  | protobufs.VerificationAddEthAddressBody
  | protobufs.VerificationRemoveBody
  | protobufs.SignerAddBody
  | protobufs.SignerRemoveBody
  | protobufs.UserDataBody;

type MessageBodyOptions = {
  castAddBody?: protobufs.CastAddBody | undefined;
  castRemoveBody?: protobufs.CastRemoveBody | undefined;
  reactionBody?: protobufs.ReactionBody | undefined;
  verificationAddEthAddressBody?: protobufs.VerificationAddEthAddressBody | undefined;
  verificationRemoveBody?: protobufs.VerificationRemoveBody | undefined;
  signerAddBody?: protobufs.SignerAddBody | undefined;
  signerRemoveBody?: protobufs.SignerRemoveBody | undefined;
  userDataBody?: protobufs.UserDataBody | undefined;
};

/** Internal Methods */

const buildMakeMessageMethod = <
  TMessageType extends protobufs.MessageType,
  TMessageBody extends MessageBody,
  TBodyJson extends types.MessageBody
>(
  messageType: TMessageType,
  messageBodyKey: keyof MessageBodyOptions,
  serializeBody: (bodyJson: TBodyJson) => HubResult<TMessageBody>
) => {
  return async (
    bodyJson: TBodyJson,
    dataOptions: MessageDataOptions,
    signer: MessageSigner<TMessageType>
  ): HubAsyncResult<types.Message<types.MessageData<TBodyJson, TMessageType>>> => {
    const body = serializeBody(bodyJson);
    if (body.isErr()) {
      return err(body.error);
    }

    const messageData = makeMessageData({ [messageBodyKey]: body.value }, messageType, dataOptions);

    if (messageData.isErr()) {
      return err(messageData.error);
    }

    return makeMessage(messageData.value, signer);
  };
};

const buildMakeMessageDataMethod = <
  TMessageType extends protobufs.MessageType,
  TMessageBody extends MessageBody,
  TBodyJson extends types.MessageBody
>(
  messageType: TMessageType,
  messageBodyKey: keyof MessageBodyOptions,
  serializeBody: (bodyJson: TBodyJson) => HubResult<TMessageBody>
) => {
  return (
    bodyJson: TBodyJson,
    dataOptions: MessageDataOptions
  ): HubResult<types.MessageData<TBodyJson, TMessageType>> => {
    const body = serializeBody(bodyJson);
    if (body.isErr()) {
      return err(body.error);
    }

    const messageData = makeMessageData({ [messageBodyKey]: body.value }, messageType, dataOptions);

    return messageData.andThen(
      (data) => utils.deserializeMessageData(data) as HubResult<types.MessageData<TBodyJson, TMessageType>>
    );
  };
};

const makeMessageData = (
  bodyOptions: MessageBodyOptions,
  messageType: protobufs.MessageType,
  dataOptions: MessageDataOptions
): HubResult<protobufs.MessageData> => {
  const timestamp = toFarcasterTime(dataOptions.timestamp || Date.now());
  if (timestamp.isErr()) {
    return err(timestamp.error);
  }

  const data = protobufs.MessageData.create({
    ...bodyOptions,
    type: messageType,
    timestamp: timestamp.value,
    fid: dataOptions.fid,
    network: dataOptions.network,
  });

  return validations.validateMessageData(data);
};

const makeMessage = async <TMessageData extends types.MessageData>(
  messageData: protobufs.MessageData,
  signer: Signer
): HubAsyncResult<types.Message<TMessageData>> => {
  const dataBytes = protobufs.MessageData.encode(messageData).finish();

  const hash = blake3(dataBytes, { dkLen: 20 });

  const signature = await signer.signMessageHash(hash);
  if (signature.isErr()) {
    return err(signature.error);
  }

  const message = protobufs.Message.create({
    data: messageData,
    hash,
    hashScheme: protobufs.HashScheme.BLAKE3,
    signature: signature.value,
    signatureScheme: signer.scheme,
    signer: signer.signerKey,
  });

  return utils.deserializeMessage(message) as HubResult<types.Message<TMessageData>>;
};

/** Generic Methods */

export const makeMessageHash = async (messageData: types.MessageData): HubAsyncResult<string> => {
  const dataBytes = protobufs.MessageData.encode(messageData._protobuf).finish();
  const hashBytes = blake3(dataBytes, { dkLen: 20 });
  return bytesToHexString(hashBytes);
};

export const makeMessageWithSignature = async (
  messageData: types.MessageData,
  signerOptions: MessageSignerOptions,
  signature: string
): HubAsyncResult<types.Message> => {
  const dataBytes = protobufs.MessageData.encode(messageData._protobuf).finish();

  const hash = blake3(dataBytes, { dkLen: 20 });

  const signatureBytes = hexStringToBytes(signature);
  if (signatureBytes.isErr()) {
    return err(signatureBytes.error);
  }

  const signerKey = hexStringToBytes(signerOptions.signerKeyHex);
  if (signerKey.isErr()) {
    return err(signerKey.error);
  }

  const message = protobufs.Message.create({
    data: messageData._protobuf,
    hash,
    hashScheme: protobufs.HashScheme.BLAKE3,
    signature: signatureBytes.value,
    signatureScheme: signerOptions.scheme,
    signer: signerKey.value,
  });

  return (await validations.validateMessage(message)).andThen((validMessage) => utils.deserializeMessage(validMessage));
};

/* -------------------------------------------------------------------------- */
/*                                CAST METHODS                                */
/* -------------------------------------------------------------------------- */

export const makeCastAdd = buildMakeMessageMethod(
  protobufs.MessageType.CAST_ADD,
  'castAddBody',
  utils.serializeCastAddBody
);

export const makeCastRemove = buildMakeMessageMethod(
  protobufs.MessageType.CAST_REMOVE,
  'castRemoveBody',
  utils.serializeCastRemoveBody
);

export const makeCastAddData = buildMakeMessageDataMethod(
  protobufs.MessageType.CAST_ADD,
  'castAddBody',
  utils.serializeCastAddBody
);

export const makeCastRemoveData = buildMakeMessageDataMethod(
  protobufs.MessageType.CAST_REMOVE,
  'castRemoveBody',
  utils.serializeCastRemoveBody
);

export const makeReactionAdd = buildMakeMessageMethod(
  protobufs.MessageType.REACTION_ADD,
  'reactionBody',
  utils.serializeReactionBody
);

export const makeReactionRemove = buildMakeMessageMethod(
  protobufs.MessageType.REACTION_REMOVE,
  'reactionBody',
  utils.serializeReactionBody
);

/** @ignore */
export const makeReactionAddData = buildMakeMessageDataMethod(
  protobufs.MessageType.REACTION_ADD,
  'reactionBody',
  utils.serializeReactionBody
);

/** @ignore */
export const makeReactionRemoveData = buildMakeMessageDataMethod(
  protobufs.MessageType.REACTION_REMOVE,
  'reactionBody',
  utils.serializeReactionBody
);

/* -------------------------------------------------------------------------- */
/*                            VERIFICATION METHODS                            */
/* -------------------------------------------------------------------------- */

export const makeVerificationAddEthAddress = buildMakeMessageMethod(
  protobufs.MessageType.VERIFICATION_ADD_ETH_ADDRESS,
  'verificationAddEthAddressBody',
  utils.serializeVerificationAddEthAddressBody
);

export const makeVerificationRemove = buildMakeMessageMethod(
  protobufs.MessageType.VERIFICATION_REMOVE,
  'verificationRemoveBody',
  utils.serializeVerificationRemoveBody
);

export const makeVerificationAddEthAddressData = buildMakeMessageDataMethod(
  protobufs.MessageType.VERIFICATION_ADD_ETH_ADDRESS,
  'verificationAddEthAddressBody',
  utils.serializeVerificationAddEthAddressBody
);

export const makeVerificationRemoveData = buildMakeMessageDataMethod(
  protobufs.MessageType.VERIFICATION_REMOVE,
  'verificationRemoveBody',
  utils.serializeVerificationRemoveBody
);

/* -------------------------------------------------------------------------- */
/*                               SIGNER METHODS                               */
/* -------------------------------------------------------------------------- */

export const makeSignerAdd = buildMakeMessageMethod(
  protobufs.MessageType.SIGNER_ADD,
  'signerAddBody',
  utils.serializeSignerAddBody
);

export const makeSignerRemove = buildMakeMessageMethod(
  protobufs.MessageType.SIGNER_REMOVE,
  'signerRemoveBody',
  utils.serializeSignerRemoveBody
);

export const makeSignerAddData = buildMakeMessageDataMethod(
  protobufs.MessageType.SIGNER_ADD,
  'signerAddBody',
  utils.serializeSignerAddBody
);

export const makeSignerRemoveData = buildMakeMessageDataMethod(
  protobufs.MessageType.SIGNER_REMOVE,
  'signerRemoveBody',
  utils.serializeSignerRemoveBody
);

/** User Data Methods */

export const makeUserDataAdd = buildMakeMessageMethod(
  protobufs.MessageType.USER_DATA_ADD,
  'userDataBody',
  utils.serializeUserDataBody
);

/** @ignore */
export const makeUserDataAddData = buildMakeMessageDataMethod(
  protobufs.MessageType.USER_DATA_ADD,
  'userDataBody',
  utils.serializeUserDataBody
);
