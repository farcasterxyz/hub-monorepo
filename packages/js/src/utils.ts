import * as flatbuffers from '@farcaster/flatbuffers';
import { unionToTargetId } from '@farcaster/flatbuffers';
import {
  bytesToHexString,
  bytesToNumber,
  bytesToUtf8String,
  fromFarcasterTime,
  hexStringToBytes,
  HubError,
  HubResult,
  numberToBytes,
  toTsHash,
  utf8StringToBytes,
  validations,
} from '@farcaster/utils';
import { ByteBuffer } from 'flatbuffers';
import { err, ok, Result } from 'neverthrow';
import * as types from './types';

/* -------------------------------------------------------------------------- */
/*                             Registry Events                                */
/* -------------------------------------------------------------------------- */

export const deserializeNameRegistryEvent = (
  flatbuffer: flatbuffers.NameRegistryEvent
): HubResult<types.NameRegistryEvent> => {
  const deserialized = Result.combine([
    bytesToHexString(flatbuffer.blockHashArray() ?? new Uint8Array()),
    bytesToHexString(flatbuffer.transactionHashArray() ?? new Uint8Array()),
    bytesToHexString(flatbuffer.toArray() ?? new Uint8Array()),
    bytesToHexString(flatbuffer.fromArray() ?? new Uint8Array()),
    bytesToNumber(flatbuffer.expiryArray() ?? new Uint8Array()),
  ]);

  if (deserialized.isErr()) {
    return err(deserialized.error);
  }

  const fname = deserializeFname(flatbuffer.fnameArray() ?? new Uint8Array());
  if (fname.isErr()) {
    return err(fname.error);
  }

  const [blockHash, transactionHash, to, from, expiry] = deserialized.value;
  const blockNumber = flatbuffer.blockNumber();
  const logIndex = flatbuffer.logIndex();
  const type = flatbuffer.type();

  return ok({
    flatbuffer,
    blockHash,
    blockNumber,
    fname: fname.value,
    transactionHash,
    logIndex,
    to,
    type,
    from,
    expiry,
  });
};

export const deserializeIdRegistryEvent = (
  flatbuffer: flatbuffers.IdRegistryEvent
): HubResult<types.IdRegistryEvent> => {
  const deserialized = Result.combine([
    bytesToHexString(flatbuffer.blockHashArray() ?? new Uint8Array()),
    bytesToHexString(flatbuffer.transactionHashArray() ?? new Uint8Array()),
    deserializeFid(flatbuffer.fidArray() ?? new Uint8Array()),
    bytesToHexString(flatbuffer.toArray() ?? new Uint8Array()),
    bytesToHexString(flatbuffer.fromArray() ?? new Uint8Array()),
  ]);

  if (deserialized.isErr()) {
    return err(deserialized.error);
  }

  const blockNumber = flatbuffer.blockNumber();
  const logIndex = flatbuffer.logIndex();
  const type = flatbuffer.type();
  const [blockHash, transactionHash, fid, to, from] = deserialized.value;

  return ok({
    flatbuffer,
    blockHash,
    blockNumber,
    fid,
    transactionHash,
    logIndex,
    to,
    type,
    from,
  });
};

/* -------------------------------------------------------------------------- */
/*                                  Message                                   */
/* -------------------------------------------------------------------------- */

export const deserializeMessage = (flatbuffer: flatbuffers.Message): HubResult<types.Message> => {
  const messageData = flatbuffers.MessageData.getRootAsMessageData(
    new ByteBuffer(flatbuffer.dataArray() ?? new Uint8Array())
  );

  const isEip712Signer = validations.EIP712_MESSAGE_TYPES.includes(messageData.type() ?? 0);
  const deserialized = Result.combine([
    deserializeMessageData(messageData),
    bytesToHexString(flatbuffer.hashArray() ?? new Uint8Array(), { size: 32 }),
    bytesToHexString(flatbuffer.signatureArray() ?? new Uint8Array(), { size: isEip712Signer ? 130 : 128 }),
    isEip712Signer
      ? deserializeEthAddress(flatbuffer.signerArray() ?? new Uint8Array())
      : deserializeEd25519PublicKey(flatbuffer.signerArray() ?? new Uint8Array()),
  ]);
  if (deserialized.isErr()) {
    return err(deserialized.error);
  }

  const tsHash = toTsHash(messageData.timestamp(), flatbuffer.hashArray() ?? new Uint8Array()).andThen((tsHashBytes) =>
    bytesToHexString(tsHashBytes, { size: 40 })
  );
  if (tsHash.isErr()) {
    return err(tsHash.error);
  }

  const [data, hash, signature, signer] = deserialized.value;

  return ok({
    flatbuffer,
    data,
    hash,
    hashScheme: flatbuffer.hashScheme(),
    signature,
    signatureScheme: flatbuffer.signatureScheme(),
    signer,
    tsHash: tsHash.value,
  });
};

export const deserializeMessageData = (fbb: flatbuffers.MessageData): HubResult<types.MessageData> => {
  const timestamp = fromFarcasterTime(fbb.timestamp());

  const fid = deserializeFid(fbb.fidArray() ?? new Uint8Array());
  if (fid.isErr()) {
    return err(fid.error);
  }

  const type = fbb.type();
  if (!type) {
    return err(new HubError('bad_request.invalid_param', 'type is missing'));
  }

  if (!Object.values(flatbuffers.MessageType).includes(type)) {
    return err(new HubError('bad_request.invalid_param', 'type is invalid'));
  }

  let bodyResult: HubResult<types.MessageBody>;
  if (fbb.bodyType() === flatbuffers.MessageBody.CastAddBody) {
    bodyResult = deserializeCastAddBody(fbb.body(new flatbuffers.CastAddBody()));
  } else if (fbb.bodyType() === flatbuffers.MessageBody.CastRemoveBody) {
    bodyResult = deserializeCastRemoveBody(fbb.body(new flatbuffers.CastRemoveBody()));
  } else if (fbb.bodyType() === flatbuffers.MessageBody.AmpBody) {
    bodyResult = deserializeAmpBody(fbb.body(new flatbuffers.AmpBody()));
  } else if (fbb.bodyType() === flatbuffers.MessageBody.ReactionBody) {
    bodyResult = deserializeReactionBody(fbb.body(new flatbuffers.ReactionBody()));
  } else if (fbb.bodyType() === flatbuffers.MessageBody.SignerBody) {
    bodyResult = deserializeSignerBody(fbb.body(new flatbuffers.SignerBody()));
  } else if (fbb.bodyType() === flatbuffers.MessageBody.UserDataBody) {
    bodyResult = deserializeUserDataBody(fbb.body(new flatbuffers.UserDataBody()));
  } else if (fbb.bodyType() === flatbuffers.MessageBody.VerificationAddEthAddressBody) {
    bodyResult = deserializeVerificationAddEthAddressBody(fbb.body(new flatbuffers.VerificationAddEthAddressBody()));
  } else if (fbb.bodyType() === flatbuffers.MessageBody.VerificationRemoveBody) {
    bodyResult = deserializeVerificationRemoveBody(fbb.body(new flatbuffers.VerificationRemoveBody()));
  } else {
    return err(new HubError('bad_request.invalid_param', 'bodyType is invalid'));
  }

  if (bodyResult.isErr()) {
    return err(bodyResult.error);
  }

  return ok({
    flatbuffer: fbb,
    body: bodyResult.value,
    type,
    timestamp,
    fid: fid.value,
    network: fbb.network(),
  });
};

/* -------------------------------------------------------------------------- */
/*                               Message Body                                 */
/* -------------------------------------------------------------------------- */

export const deserializeCastAddBody = (fbb: flatbuffers.CastAddBody): HubResult<types.CastAddBody> => {
  const validBody = validations.validateCastAddBody(fbb);
  if (validBody.isErr()) {
    return err(validBody.error);
  }

  const embeds = deserializeEmbeds(fbb.embedsLength(), fbb.embeds.bind(fbb));
  if (embeds.isErr()) {
    return err(embeds.error);
  }

  const mentions = deserializeMentions(fbb.mentionsLength(), fbb.mentions.bind(fbb));
  if (mentions.isErr()) {
    return err(mentions.error);
  }

  const parent = deserializeTarget(fbb.parentType(), fbb.parent.bind(fbb));
  if (parent.isErr()) {
    return err(parent.error);
  }

  return ok({
    text: fbb.text() as string,
    embeds: embeds.value,
    mentions: mentions.value,
    parent: parent.value,
  });
};

export const serializeCastAddBody = (body: types.CastAddBody): HubResult<flatbuffers.CastAddBodyT> => {
  const mentions = serializeMentions(body.mentions);
  if (mentions.isErr()) {
    return err(mentions.error);
  }

  const parent = body.parent !== undefined ? serializeCastId(body.parent) : ok(undefined);
  const parentType = body.parent !== undefined ? flatbuffers.TargetId.CastId : flatbuffers.TargetId.NONE;

  if (parent.isErr()) {
    return err(parent.error);
  }

  return ok(new flatbuffers.CastAddBodyT(body.embeds, mentions.value, parentType, parent.value, body.text));
};

export const deserializeCastRemoveBody = (fbb: flatbuffers.CastRemoveBody): HubResult<types.CastRemoveBody> => {
  const validBody = validations.validateCastRemoveBody(fbb);
  if (validBody.isErr()) {
    return err(validBody.error);
  }

  const targetTsHash = bytesToHexString(fbb.targetTsHashArray() ?? new Uint8Array());

  if (targetTsHash.isErr()) {
    return err(targetTsHash.error);
  }

  return ok({ targetTsHash: targetTsHash.value });
};

export const serializeCastRemoveBody = (body: types.CastRemoveBody): HubResult<flatbuffers.CastRemoveBodyT> => {
  const targetTsHash = hexStringToBytes(body.targetTsHash);

  if (targetTsHash.isErr()) {
    return err(targetTsHash.error);
  }

  return ok(new flatbuffers.CastRemoveBodyT(Array.from(targetTsHash.value)));
};

export const deserializeVerificationAddEthAddressBody = (
  fbb: flatbuffers.VerificationAddEthAddressBody
): HubResult<types.VerificationAddEthAddressBody> => {
  const validBody = validations.validateVerificationAddEthAddressBody(fbb);
  if (validBody.isErr()) {
    return err(validBody.error);
  }

  const jsonValues = Result.combine([
    deserializeEthAddress(fbb.addressArray() as Uint8Array),
    bytesToHexString(fbb.ethSignatureArray() ?? new Uint8Array(), {
      size: 130,
    }),
    bytesToHexString(fbb.blockHashArray() ?? new Uint8Array(), { size: 64 }),
  ]);

  if (jsonValues.isErr()) {
    return err(jsonValues.error);
  }

  const [address, ethSignature, blockHash] = jsonValues.value;

  return ok({
    address,
    ethSignature,
    blockHash,
  });
};

export const deserializeAmpBody = (fbb: flatbuffers.AmpBody): HubResult<types.AmpBody> => {
  return deserializeFid(fbb.user()?.fidArray() ?? new Uint8Array()).map((fid) => {
    return { user: fid };
  });
};

export const serializeAmpBody = (body: types.AmpBody): HubResult<flatbuffers.AmpBodyT> => {
  return serializeFid(body.user).map((fid) => {
    const userT = new flatbuffers.UserIdT(Array.from(fid));
    return new flatbuffers.AmpBodyT(userT);
  });
};

export const deserializeSignerBody = (fbb: flatbuffers.SignerBody): HubResult<types.SignerBody> => {
  const signerJson = deserializeEd25519PublicKey(fbb.signerArray() ?? new Uint8Array());
  if (signerJson.isErr()) {
    return err(signerJson.error);
  }

  return ok({
    signer: signerJson.value,
  });
};

export const serializeSignerBody = (body: types.SignerBody): HubResult<flatbuffers.SignerBodyT> => {
  const signer = serializeEd25519PublicKey(body.signer);
  if (signer.isErr()) {
    return err(signer.error);
  }

  return ok(new flatbuffers.SignerBodyT(Array.from(signer.value)));
};

export const serializeVerificationAddEthAddressBody = (
  body: types.VerificationAddEthAddressBody
): HubResult<flatbuffers.VerificationAddEthAddressBodyT> => {
  return Result.combine([
    serializeEthAddress(body.address),
    hexStringToBytes(body.ethSignature),
    hexStringToBytes(body.blockHash),
  ]).map((values) => {
    const [address, ethSignature, blockHash] = values;

    return new flatbuffers.VerificationAddEthAddressBodyT(
      Array.from(address),
      Array.from(ethSignature),
      Array.from(blockHash)
    );
  });
};

export const deserializeVerificationRemoveBody = (
  fbb: flatbuffers.VerificationRemoveBody
): HubResult<types.VerificationRemoveBody> => {
  return deserializeEthAddress(fbb.addressArray() ?? new Uint8Array()).map((address) => {
    return {
      address,
    };
  });
};

export const serializeVerificationRemoveBody = (
  body: types.VerificationRemoveBody
): HubResult<flatbuffers.VerificationRemoveBodyT> => {
  return serializeEthAddress(body.address).map((address) => {
    return new flatbuffers.VerificationRemoveBodyT(Array.from(address));
  });
};

export const deserializeUserDataBody = (fbb: flatbuffers.UserDataBody): HubResult<types.UserDataBody> => {
  const validUserDataBody = validations.validateUserDataAddBody(fbb);
  if (validUserDataBody.isErr()) {
    return err(validUserDataBody.error);
  }

  return ok({
    type: fbb.type() as flatbuffers.UserDataType,
    value: fbb.value() as string,
  });
};

export const serializeUserDataBody = (body: types.UserDataBody): HubResult<flatbuffers.UserDataBodyT> => {
  return ok(new flatbuffers.UserDataBodyT(body.type, body.value));
};

export const deserializeReactionBody = (fbb: flatbuffers.ReactionBody): HubResult<types.ReactionBody> => {
  // TODO: check targetType
  const targetJson = deserializeCastId(fbb.target(new flatbuffers.CastId()));
  if (targetJson.isErr()) {
    return err(targetJson.error);
  }

  return ok({
    target: targetJson.value,
    type: fbb.type(),
  });
};

export const serializeReactionBody = (body: types.ReactionBody): HubResult<flatbuffers.ReactionBodyT> => {
  return serializeCastId(body.target).map((target) => {
    return new flatbuffers.ReactionBodyT(flatbuffers.TargetId.CastId, target, body.type);
  });
};

/* -------------------------------------------------------------------------- */
/* .                               Other                                      */
/* -------------------------------------------------------------------------- */

export const deserializeFid = (fid: Uint8Array): HubResult<number> => {
  return validations.validateFid(fid).andThen((fid) => bytesToNumber(fid));
};

export const serializeFid = (fid: number): HubResult<Uint8Array> => {
  return numberToBytes(fid).andThen((fid) => validations.validateFid(fid));
};

export const deserializeFname = (fname: Uint8Array): HubResult<string> => {
  return bytesToUtf8String(fname).andThen(validations.validateFname);
};

export const serializeFname = (fname: string): HubResult<Uint8Array> => {
  return validations.validateFname(fname).andThen(utf8StringToBytes);
};

export const deserializeEthAddress = (ethAddress: Uint8Array): HubResult<string> => {
  return validations.validateEthAddress(ethAddress).andThen((ethAddress) => bytesToHexString(ethAddress, { size: 40 }));
};

export const serializeEthAddress = (ethAddress: string): HubResult<Uint8Array> => {
  return hexStringToBytes(ethAddress).andThen((ethAddress) => validations.validateEthAddress(ethAddress));
};

export const deserializeEd25519PublicKey = (publicKey: Uint8Array): HubResult<string> => {
  return validations
    .validateEd25519PublicKey(publicKey)
    .andThen((publicKey) => bytesToHexString(publicKey, { size: 64 }));
};

export const serializeEd25519PublicKey = (publicKey: string): HubResult<Uint8Array> => {
  return hexStringToBytes(publicKey).andThen((publicKey) => validations.validateEd25519PublicKey(publicKey));
};

export const deserializeTsHash = (tsHash: Uint8Array): HubResult<string> => {
  return validations.validateTsHash(tsHash).andThen((tsHash) => bytesToHexString(tsHash, { size: 40 }));
};

export const serializeTsHash = (tsHash: string): HubResult<Uint8Array> => {
  return hexStringToBytes(tsHash).andThen((tsHash) => validations.validateTsHash(tsHash));
};

export const deserializeCastId = (castId: flatbuffers.CastId): HubResult<types.CastId> => {
  const jsonValues = Result.combine([
    deserializeFid(castId.fidArray() ?? new Uint8Array()),
    deserializeTsHash(castId.tsHashArray() ?? new Uint8Array()),
  ]);
  if (jsonValues.isErr()) {
    return err(jsonValues.error);
  }
  const [fid, tsHash] = jsonValues.value;
  return ok({
    fid,
    tsHash,
  });
};

export const serializeCastId = (castId: types.CastId): HubResult<flatbuffers.CastIdT> => {
  const jsonValues = Result.combine([serializeFid(castId.fid), serializeTsHash(castId.tsHash)]);
  if (jsonValues.isErr()) {
    return err(jsonValues.error);
  }
  const [fid, tsHash] = jsonValues.value;
  return ok(new flatbuffers.CastIdT(Array.from(fid), Array.from(tsHash)));
};

// TODO: deserializeUserId

export const serializeUserId = (userId: number): HubResult<flatbuffers.UserIdT> => {
  return serializeFid(userId).map((fid) => {
    return new flatbuffers.UserIdT(Array.from(fid));
  });
};

export const deserializeEmbeds = (
  length: number,
  accessor: (index: number, obj?: string) => string | null
): HubResult<string[] | undefined> => {
  if (length === 0) {
    return ok(undefined);
  }

  const embeds = [];
  for (let i = 0; i < length; i++) {
    const embed = accessor(i);
    if (embed === null) {
      embeds.push(err(new HubError('bad_request.invalid_param', 'no data found at index')));
    } else {
      embeds.push(ok(embed));
    }
  }

  return Result.combine(embeds);
};

export const deserializeMentions = (
  length: number,
  accessor: (index: number, obj?: flatbuffers.UserId) => flatbuffers.UserId | null
): HubResult<number[] | undefined> => {
  if (length === 0) {
    return ok(undefined);
  }

  const mentions = [];
  for (let i = 0; i < length; i++) {
    const mention = accessor(i);
    if (mention === null) {
      mentions.push(err(new HubError('bad_request.invalid_param', 'no data found at index')));
    } else {
      mentions.push(deserializeFid(mention.fidArray() ?? new Uint8Array()));
    }
  }

  return Result.combine(mentions);
};

export const deserializeTarget = (
  targetId: flatbuffers.TargetId,
  accessor: (obj: flatbuffers.CastId) => flatbuffers.CastId | null
): HubResult<types.CastId | undefined> => {
  const target = unionToTargetId(targetId, accessor);

  if (target === null) {
    return ok(undefined);
  }

  return deserializeCastId(target);
};

const serializeMentions = (mentions: number[] | undefined): HubResult<flatbuffers.UserIdT[] | undefined> => {
  if (!mentions) {
    return ok(undefined);
  }

  return Result.combine(mentions.map((mention) => serializeFid(mention))).map((mentionByteArrays) =>
    mentionByteArrays.map((mentionBytes) => new flatbuffers.UserIdT(Array.from(mentionBytes)))
  );
};
