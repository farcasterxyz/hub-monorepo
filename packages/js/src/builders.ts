import * as flatbuffers from '@farcaster/flatbuffers';
import {
  bytesToHexString,
  hexStringToBytes,
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

/** Internal Types  */

type MessageDataOptions = {
  fid: number;
  network: flatbuffers.FarcasterNetwork;
  timestamp?: number;
};

type MessageSignerOptions = {
  scheme: types.SignatureScheme;
  signerKeyHex: string;
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

/** Internal Methods */

const buildMakeMessageMethod = <
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

const buildMakeMessageDataMethod = <
  TMessageType extends flatbuffers.MessageType,
  TMessageBodyT extends MessageBodyT,
  TBodyJson extends types.MessageBody
>(
  messageType: TMessageType,
  messageBody: flatbuffers.MessageBody,
  bodyTFromJson: (bodyJson: TBodyJson) => HubResult<TMessageBodyT>
) => {
  return (
    bodyJson: TBodyJson,
    dataOptions: MessageDataOptions
  ): HubResult<types.MessageData<TBodyJson, TMessageType>> => {
    const bodyT = bodyTFromJson(bodyJson);
    if (bodyT.isErr()) {
      return err(bodyT.error);
    }

    const messageData = makeMessageData(messageBody, bodyT.value, messageType, dataOptions);

    return messageData.andThen(
      (data) => utils.deserializeMessageData(data) as HubResult<types.MessageData<TBodyJson, TMessageType>>
    );
  };
};

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
  if (timestamp.isErr()) {
    return err(timestamp.error);
  }

  const dataT = new flatbuffers.MessageDataT(
    bodyType,
    bodyT,
    messageType,
    timestamp.value,
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

/** Generic Methods */

export const makeMessageHash = async (messageData: types.MessageData): HubAsyncResult<string> => {
  const hashBytes = await blake3(messageData.flatbuffer.bb?.bytes() ?? new Uint8Array(), { dkLen: 16 });
  return bytesToHexString(hashBytes, { size: 32 });
};

export const makeMessageWithSignature = async (
  messageData: types.MessageData,
  signerOptions: MessageSignerOptions,
  signature: string
): HubAsyncResult<types.Message> => {
  const dataBytes = messageData.flatbuffer.bb?.bytes();
  if (!dataBytes) {
    return err(new HubError('bad_request.invalid_param', 'data is missing'));
  }

  const hash = await blake3(dataBytes, { dkLen: 16 });

  const signatureBytes = hexStringToBytes(signature);
  if (signatureBytes.isErr()) {
    return err(signatureBytes.error);
  }

  const signerKey = hexStringToBytes(signerOptions.signerKeyHex);
  if (signerKey.isErr()) {
    return err(signerKey.error);
  }

  const messageT = new flatbuffers.MessageT(
    Array.from(dataBytes),
    Array.from(hash),
    flatbuffers.HashScheme.Blake3,
    Array.from(signatureBytes.value),
    signerOptions.scheme,
    Array.from(signerKey.value)
  );

  const fbb = new Builder(1);
  fbb.finish(messageT.pack(fbb));

  const flatbuffer = flatbuffers.Message.getRootAsMessage(new ByteBuffer(fbb.asUint8Array()));

  const isValid = await validations.validateMessage(flatbuffer);

  return isValid.andThen((validFlatbuffer) => utils.deserializeMessage(validFlatbuffer));
};

/** Cast Methods */

export const makeCastAdd = buildMakeMessageMethod(
  flatbuffers.MessageType.CastAdd,
  flatbuffers.MessageBody.CastAddBody,
  utils.serializeCastAddBody
);

export const makeCastRemove = buildMakeMessageMethod(
  flatbuffers.MessageType.CastRemove,
  flatbuffers.MessageBody.CastRemoveBody,
  utils.serializeCastRemoveBody
);

export const makeCastAddData = buildMakeMessageDataMethod(
  flatbuffers.MessageType.CastAdd,
  flatbuffers.MessageBody.CastAddBody,
  utils.serializeCastAddBody
);

export const makeCastRemoveData = buildMakeMessageDataMethod(
  flatbuffers.MessageType.CastRemove,
  flatbuffers.MessageBody.CastRemoveBody,
  utils.serializeCastRemoveBody
);

/** Amp Methods */

export const makeReactionAdd = buildMakeMessageMethod(
  flatbuffers.MessageType.ReactionAdd,
  flatbuffers.MessageBody.ReactionBody,
  utils.serializeReactionBody
);

export const makeReactionRemove = buildMakeMessageMethod(
  flatbuffers.MessageType.ReactionRemove,
  flatbuffers.MessageBody.ReactionBody,
  utils.serializeReactionBody
);

export const makeReactionAddData = buildMakeMessageDataMethod(
  flatbuffers.MessageType.ReactionAdd,
  flatbuffers.MessageBody.ReactionBody,
  utils.serializeReactionBody
);

export const makeReactionRemoveData = buildMakeMessageDataMethod(
  flatbuffers.MessageType.ReactionRemove,
  flatbuffers.MessageBody.ReactionBody,
  utils.serializeReactionBody
);

/** Amp Methods */

export const makeAmpAdd = buildMakeMessageMethod(
  flatbuffers.MessageType.AmpAdd,
  flatbuffers.MessageBody.AmpBody,
  utils.serializeAmpBody
);

export const makeAmpRemove = buildMakeMessageMethod(
  flatbuffers.MessageType.AmpRemove,
  flatbuffers.MessageBody.AmpBody,
  utils.serializeAmpBody
);

export const makeAmpAddData = buildMakeMessageDataMethod(
  flatbuffers.MessageType.AmpAdd,
  flatbuffers.MessageBody.AmpBody,
  utils.serializeAmpBody
);

export const makeAmpRemoveData = buildMakeMessageDataMethod(
  flatbuffers.MessageType.AmpRemove,
  flatbuffers.MessageBody.AmpBody,
  utils.serializeAmpBody
);

/** Verification Methods */

export const makeVerificationAddEthAddress = buildMakeMessageMethod(
  flatbuffers.MessageType.VerificationAddEthAddress,
  flatbuffers.MessageBody.VerificationAddEthAddressBody,
  utils.serializeVerificationAddEthAddressBody
);

export const makeVerificationRemove = buildMakeMessageMethod(
  flatbuffers.MessageType.VerificationRemove,
  flatbuffers.MessageBody.VerificationRemoveBody,
  utils.serializeVerificationRemoveBody
);

export const makeVerificationAddEthAddressData = buildMakeMessageDataMethod(
  flatbuffers.MessageType.VerificationAddEthAddress,
  flatbuffers.MessageBody.VerificationAddEthAddressBody,
  utils.serializeVerificationAddEthAddressBody
);

export const makeVerificationRemoveData = buildMakeMessageDataMethod(
  flatbuffers.MessageType.VerificationRemove,
  flatbuffers.MessageBody.VerificationRemoveBody,
  utils.serializeVerificationRemoveBody
);

/** Signer Methods */

export const makeSignerAdd = buildMakeMessageMethod(
  flatbuffers.MessageType.SignerAdd,
  flatbuffers.MessageBody.SignerBody,
  utils.serializeSignerBody
);

export const makeSignerRemove = buildMakeMessageMethod(
  flatbuffers.MessageType.SignerRemove,
  flatbuffers.MessageBody.SignerBody,
  utils.serializeSignerBody
);

export const makeSignerAddData = buildMakeMessageDataMethod(
  flatbuffers.MessageType.SignerAdd,
  flatbuffers.MessageBody.SignerBody,
  utils.serializeSignerBody
);

export const makeSignerRemoveData = buildMakeMessageDataMethod(
  flatbuffers.MessageType.SignerRemove,
  flatbuffers.MessageBody.SignerBody,
  utils.serializeSignerBody
);

/** User Data Methods */

export const makeUserDataAdd = buildMakeMessageMethod(
  flatbuffers.MessageType.UserDataAdd,
  flatbuffers.MessageBody.UserDataBody,
  utils.serializeUserDataBody
);

export const makeUserDataAddData = buildMakeMessageDataMethod(
  flatbuffers.MessageType.UserDataAdd,
  flatbuffers.MessageBody.UserDataBody,
  utils.serializeUserDataBody
);
