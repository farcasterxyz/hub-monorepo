import * as flatbuffers from '@hub/flatbuffers';
import {
  Ed25519Signer,
  Eip712Signer,
  HubAsyncResult,
  HubError,
  HubResult,
  Signer,
  toFarcasterTime,
  validations,
} from '@hub/utils';
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

/** Cast Methods */

export const makeCastAdd = async (
  body: types.CastAddBody,
  dataOptions: MessageDataOptions,
  signer: Ed25519Signer
): HubAsyncResult<flatbuffers.Message> => {
  const bodyT = utils.serializeCastAddBody(body);
  if (bodyT.isErr()) {
    return err(bodyT.error);
  }

  const messageData = makeMessageData(
    flatbuffers.MessageBody.CastAddBody,
    bodyT.value,
    flatbuffers.MessageType.CastAdd,
    dataOptions
  );
  if (messageData.isErr()) {
    return err(messageData.error);
  }

  return makeMessage(messageData.value, signer);
};

/** Signer Methods */

export const makeSignerAdd = async (
  body: types.SignerBody,
  dataOptions: MessageDataOptions,
  signer: Eip712Signer
): HubAsyncResult<flatbuffers.Message> => {
  const bodyT = utils.serializeSignerBody(body);
  if (bodyT.isErr()) {
    return err(bodyT.error);
  }

  const messageData = makeMessageData(
    flatbuffers.MessageBody.SignerBody,
    bodyT.value,
    flatbuffers.MessageType.SignerAdd,
    dataOptions
  );
  if (messageData.isErr()) {
    return err(messageData.error);
  }

  return makeMessage(messageData.value, signer);
};

export const makeSignerRemove = async (
  body: types.SignerBody,
  dataOptions: MessageDataOptions,
  signer: Eip712Signer
) => {
  const bodyT = utils.serializeSignerBody(body);
  if (bodyT.isErr()) {
    return err(bodyT.error);
  }

  const messageData = makeMessageData(
    flatbuffers.MessageBody.SignerBody,
    bodyT.value,
    flatbuffers.MessageType.SignerRemove,
    dataOptions
  );
  if (messageData.isErr()) {
    return err(messageData.error);
  }

  return makeMessage(messageData.value, signer);
};

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

const makeMessage = async (
  messageData: flatbuffers.MessageData,
  signer: Signer
): HubAsyncResult<flatbuffers.Message> => {
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

  return ok(flatbuffers.Message.getRootAsMessage(new ByteBuffer(fbb.asUint8Array())));
};
