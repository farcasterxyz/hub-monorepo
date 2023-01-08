import * as flatbuffers from '@hub/flatbuffers';
import {
  bytesToHexString,
  bytesToNumber,
  fromFarcasterTime,
  hexStringToBytes,
  HubError,
  HubResult,
  numberToBytes,
  validations,
} from '@hub/utils';
import { err, ok, Result } from 'neverthrow';
import * as types from './types';

export const deserializeFid = (fid: Uint8Array): HubResult<number> => {
  return validations.validateFid(fid).andThen((fid) => bytesToNumber(fid));
};

export const serializeFid = (fid: number): HubResult<Uint8Array> => {
  return numberToBytes(fid).andThen((fid) => validations.validateFid(fid));
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

// TODO: serializeCastId

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
    body: bodyResult.value,
    type,
    timestamp,
    fid: fid.value,
    network: fbb.network(),
  });
};

// TODO: messageDataFromJson

export const deserializeCastAddBody = (fbb: flatbuffers.CastAddBody): HubResult<types.CastAddBody> => {
  const validBody = validations.validateCastAddBody(fbb);
  if (validBody.isErr()) {
    return err(validBody.error);
  }

  // TODO: embeds
  // TODO: mentions
  // TODO: parent

  return ok({
    text: fbb.text() as string,
  });
};

export const serializeCastAddBody = (body: types.CastAddBody): HubResult<flatbuffers.CastAddBodyT> => {
  // TODO: embeds
  // TODO: mentions
  // TODO: parent

  return ok(new flatbuffers.CastAddBodyT(undefined, undefined, undefined, undefined, body.text));
};

export const deserializeCastRemoveBody = (fbb: flatbuffers.CastRemoveBody): HubResult<types.CastRemoveBody> => {
  const targetTsHash = bytesToHexString(fbb.targetTsHashArray() ?? new Uint8Array());

  if (targetTsHash.isErr()) {
    return err(targetTsHash.error);
  }

  return ok({ targetTsHash: targetTsHash.value });
};

// TODO: castRemoveBodyFromJson

export const deserializeAmpBody = (fbb: flatbuffers.AmpBody): HubResult<types.AmpBody> => {
  const fid = deserializeFid(fbb.user()?.fidArray() ?? new Uint8Array());
  if (fid.isErr()) {
    return err(fid.error);
  }

  return ok({ user: fid.value });
};

// TODO: ampBodyFromJson

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

// TODO: verificationAddEthAddressBodyFromJson

export const deserializeVerificationRemoveBody = (
  fbb: flatbuffers.VerificationRemoveBody
): HubResult<types.VerificationRemoveBody> => {
  const addressJson = deserializeEthAddress(fbb.addressArray() ?? new Uint8Array());
  if (addressJson.isErr()) {
    return err(addressJson.error);
  }

  return ok({
    address: addressJson.value,
  });
};

// TODO: verificationRemoveBodyFromJson

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

// TODO: signerBodyFromJson

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

// TODO: userDataBodyFromJson

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

// TODO: reactionBodyFromJson
