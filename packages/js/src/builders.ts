import * as flatbuffers from '@farcaster/flatbuffers';
import {
  HubAsyncResult,
  HubError,
  HubResult,
  MessageSigner,
  Signer,
  toFarcasterTime,
  validations,
} from '@farcaster/utils';
import { blake3 } from '@noble/hashes/blake3';
import { Builder, ByteBuffer } from 'flatbuffers';
import { err, ok } from 'neverthrow';
import * as types from './types';
import * as utils from './utils';

export type MessageDataOptions = {
  fid: number;
  network: flatbuffers.FarcasterNetwork;
  timestamp?: number;
};

type MessageBodyT =
  | flatbuffers.AmpBodyT
  | flatbuffers.CastAddBodyT
  | flatbuffers.CastRemoveBodyT
  | flatbuffers.ReactionBodyT
  | flatbuffers.SignerBodyT
  | flatbuffers.UserDataBodyT
  | flatbuffers.VerificationAddEthAddressBodyT
  | flatbuffers.VerificationRemoveBodyT;

const buildMakeMessage = <
  TMessageType extends flatbuffers.MessageType,
  TMessageBodyT extends MessageBodyT,
  TBodyJson extends types.MessageBody
>(
  messageType: TMessageType,
  messageBody: flatbuffers.MessageBody,
  bodyTFromJson: (bodyJson: TBodyJson) => HubResult<TMessageBodyT>
) => {
  return async (
    bodyJson: TBodyJson,
    dataOptions: MessageDataOptions,
    signer: MessageSigner<TMessageType>
  ): HubAsyncResult<types.Message> => {
    const bodyT = bodyTFromJson(bodyJson);
    if (bodyT.isErr()) {
      return err(bodyT.error);
    }

    const messageData = makeMessageData(messageBody, bodyT.value, messageType, dataOptions);

    if (messageData.isErr()) {
      return err(messageData.error);
    }

    return makeMessage(messageData.value, signer);
  };
};

/** Cast Methods */

export const makeCastAdd = buildMakeMessage(
  flatbuffers.MessageType.CastAdd,
  flatbuffers.MessageBody.CastAddBody,
  utils.serializeCastAddBody
);

export const makeCastRemove = buildMakeMessage(
  flatbuffers.MessageType.CastRemove,
  flatbuffers.MessageBody.CastRemoveBody,
  utils.serializeCastRemoveBody
);

/** Amp Methods */

export const makeReactionAdd = buildMakeMessage(
  flatbuffers.MessageType.ReactionAdd,
  flatbuffers.MessageBody.ReactionBody,
  utils.serializeReactionBody
);

export const makeReactionRemove = buildMakeMessage(
  flatbuffers.MessageType.ReactionRemove,
  flatbuffers.MessageBody.ReactionBody,
  utils.serializeReactionBody
);

/** Amp Methods */

export const makeAmpAdd = buildMakeMessage(
  flatbuffers.MessageType.AmpAdd,
  flatbuffers.MessageBody.AmpBody,
  utils.serializeAmpBody
);

export const makeAmpRemove = buildMakeMessage(
  flatbuffers.MessageType.AmpRemove,
  flatbuffers.MessageBody.AmpBody,
  utils.serializeAmpBody
);

/** Verification Methods */

export const makeVerificationAddEthAddress = buildMakeMessage(
  flatbuffers.MessageType.VerificationAddEthAddress,
  flatbuffers.MessageBody.VerificationAddEthAddressBody,
  utils.serializeVerificationAddEthAddressBody
);

export const makeVerificationRemove = buildMakeMessage(
  flatbuffers.MessageType.VerificationRemove,
  flatbuffers.MessageBody.VerificationRemoveBody,
  utils.serializeVerificationRemoveBody
);

/** Signer Methods */

export const makeSignerAdd = buildMakeMessage(
  flatbuffers.MessageType.SignerAdd,
  flatbuffers.MessageBody.SignerBody,
  utils.serializeSignerBody
);

export const makeSignerRemove = buildMakeMessage(
  flatbuffers.MessageType.SignerRemove,
  flatbuffers.MessageBody.SignerBody,
  utils.serializeSignerBody
);

/** User Data Methods */

export const makeUserDataAdd = buildMakeMessage(
  flatbuffers.MessageType.UserDataAdd,
  flatbuffers.MessageBody.UserDataBody,
  utils.serializeUserDataBody
);

/** Internal methods */

const makeMessageData = (
  bodyType: flatbuffers.MessageBody,
  bodyT: MessageBodyT,
  messageType: flatbuffers.MessageType,
  dataOptions: MessageDataOptions
): HubResult<flatbuffers.MessageData> => {
  const serializedFid = utils.serializeFid(dataOptions.fid);
  if (serializedFid.isErr()) {
    return err(serializedFid.error);
  }

  const timestamp = toFarcasterTime(dataOptions.timestamp || Date.now());

  const dataT = new flatbuffers.MessageDataT(
    bodyType,
    bodyT,
    messageType,
    timestamp,
    Array.from(serializedFid.value),
    dataOptions.network
  );

  const fbb = new Builder(1);
  fbb.finish(dataT.pack(fbb));

  const dataBytes = fbb.asUint8Array();

  const messageData = flatbuffers.MessageData.getRootAsMessageData(new ByteBuffer(dataBytes));

  const validMessageData = validations.validateMessageData(messageData);
  if (validMessageData.isErr()) {
    return err(validMessageData.error);
  }

  return ok(messageData);
};

const makeMessage = async (messageData: flatbuffers.MessageData, signer: Signer): HubAsyncResult<types.Message> => {
  const dataBytes = messageData.bb?.bytes();
  if (!dataBytes) {
    return err(new HubError('bad_request.invalid_param', 'data is missing'));
  }

  const hash = await blake3(dataBytes, { dkLen: 16 });

  const signature = await signer.signMessageHash(hash);
  if (signature.isErr()) {
    return err(signature.error);
  }

  const messageT = new flatbuffers.MessageT(
    Array.from(dataBytes),
    Array.from(hash),
    flatbuffers.HashScheme.Blake3,
    Array.from(signature.value),
    signer.scheme,
    Array.from(signer.signerKey)
  );

  const fbb = new Builder(1);
  fbb.finish(messageT.pack(fbb));

  const flatbuffer = flatbuffers.Message.getRootAsMessage(new ByteBuffer(fbb.asUint8Array()));

  return utils.deserializeMessage(flatbuffer);
};
