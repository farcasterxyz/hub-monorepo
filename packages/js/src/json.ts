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

export const fidToJson = (fid: Uint8Array): HubResult<number> => {
  return validations.validateFid(fid).andThen((fid) => bytesToNumber(fid));
};

export const fidFromJson = (fid: number): HubResult<Uint8Array> => {
  return numberToBytes(fid).andThen((fid) => validations.validateFid(fid));
};

export const ethAddressToJson = (ethAddress: Uint8Array): HubResult<string> => {
  return validations.validateEthAddress(ethAddress).andThen((ethAddress) => bytesToHexString(ethAddress, { size: 40 }));
};

export const ethAddressFromJson = (ethAddress: string): HubResult<Uint8Array> => {
  return hexStringToBytes(ethAddress).andThen((ethAddress) => validations.validateEthAddress(ethAddress));
};

export const ed25519PublicKeyToJson = (publicKey: Uint8Array): HubResult<string> => {
  return validations
    .validateEd25519PublicKey(publicKey)
    .andThen((publicKey) => bytesToHexString(publicKey, { size: 64 }));
};

export const ed25519PublicKeyFromJson = (publicKey: string): HubResult<Uint8Array> => {
  return hexStringToBytes(publicKey).andThen((publicKey) => validations.validateEd25519PublicKey(publicKey));
};

export const tsHashToJson = (tsHash: Uint8Array): HubResult<string> => {
  return validations.validateTsHash(tsHash).andThen((tsHash) => bytesToHexString(tsHash, { size: 40 }));
};

export const tsHashFromJson = (tsHash: string): HubResult<Uint8Array> => {
  return hexStringToBytes(tsHash).andThen((tsHash) => validations.validateTsHash(tsHash));
};

export const castIdToJson = (fbb: flatbuffers.CastId): HubResult<types.CastId> => {
  const jsonValues = Result.combine([
    fidToJson(fbb.fidArray() ?? new Uint8Array()),
    tsHashToJson(fbb.tsHashArray() ?? new Uint8Array()),
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

// TODO: castIdFromJson

export const messageDataToJson = (fbb: flatbuffers.MessageData): HubResult<types.MessageData> => {
  const timestamp = fromFarcasterTime(fbb.timestamp());

  const fid = fidToJson(fbb.fidArray() ?? new Uint8Array());
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
    bodyResult = castAddBodyToJson(fbb.body(new flatbuffers.CastAddBody()));
  } else if (fbb.bodyType() === flatbuffers.MessageBody.CastRemoveBody) {
    bodyResult = castRemoveBodyToJson(fbb.body(new flatbuffers.CastRemoveBody()));
  } else if (fbb.bodyType() === flatbuffers.MessageBody.AmpBody) {
    bodyResult = ampBodyToJson(fbb.body(new flatbuffers.AmpBody()));
  } else if (fbb.bodyType() === flatbuffers.MessageBody.ReactionBody) {
    bodyResult = reactionBodyToJson(fbb.body(new flatbuffers.ReactionBody()));
  } else if (fbb.bodyType() === flatbuffers.MessageBody.SignerBody) {
    bodyResult = signerBodyToJson(fbb.body(new flatbuffers.SignerBody()));
  } else if (fbb.bodyType() === flatbuffers.MessageBody.UserDataBody) {
    bodyResult = userDataBodyToJson(fbb.body(new flatbuffers.UserDataBody()));
  } else if (fbb.bodyType() === flatbuffers.MessageBody.VerificationAddEthAddressBody) {
    bodyResult = verificationAddEthAddressBodyToJson(fbb.body(new flatbuffers.VerificationAddEthAddressBody()));
  } else if (fbb.bodyType() === flatbuffers.MessageBody.VerificationRemoveBody) {
    bodyResult = verificationRemoveBodyToJson(fbb.body(new flatbuffers.VerificationRemoveBody()));
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

export const castAddBodyToJson = (fbb: flatbuffers.CastAddBody): HubResult<types.CastAddBody> => {
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

// TODO: castAddBodyFromJson

export const castRemoveBodyToJson = (fbb: flatbuffers.CastRemoveBody): HubResult<types.CastRemoveBody> => {
  const targetTsHash = bytesToHexString(fbb.targetTsHashArray() ?? new Uint8Array());

  if (targetTsHash.isErr()) {
    return err(targetTsHash.error);
  }

  return ok({ targetTsHash: targetTsHash.value });
};

// TODO: castRemoveBodyFromJson

export const ampBodyToJson = (fbb: flatbuffers.AmpBody): HubResult<types.AmpBody> => {
  const fid = fidToJson(fbb.user()?.fidArray() ?? new Uint8Array());
  if (fid.isErr()) {
    return err(fid.error);
  }

  return ok({ user: fid.value });
};

// TODO: ampBodyFromJson

export const verificationAddEthAddressBodyToJson = (
  fbb: flatbuffers.VerificationAddEthAddressBody
): HubResult<types.VerificationAddEthAddressBody> => {
  const validBody = validations.validateVerificationAddEthAddressBody(fbb);
  if (validBody.isErr()) {
    return err(validBody.error);
  }

  const jsonValues = Result.combine([
    ethAddressToJson(fbb.addressArray() as Uint8Array),
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

export const verificationRemoveBodyToJson = (
  fbb: flatbuffers.VerificationRemoveBody
): HubResult<types.VerificationRemoveBody> => {
  const addressJson = ethAddressToJson(fbb.addressArray() ?? new Uint8Array());
  if (addressJson.isErr()) {
    return err(addressJson.error);
  }

  return ok({
    address: addressJson.value,
  });
};

// TODO: verificationRemoveBodyFromJson

export const signerBodyToJson = (fbb: flatbuffers.SignerBody): HubResult<types.SignerBody> => {
  const signerJson = ed25519PublicKeyToJson(fbb.signerArray() ?? new Uint8Array());
  if (signerJson.isErr()) {
    return err(signerJson.error);
  }

  return ok({
    signer: signerJson.value,
  });
};

// TODO: signerBodyFromJson

export const userDataBodyToJson = (fbb: flatbuffers.UserDataBody): HubResult<types.UserDataBody> => {
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

export const reactionBodyToJson = (fbb: flatbuffers.ReactionBody): HubResult<types.ReactionBody> => {
  // TODO: check targetType
  const targetJson = castIdToJson(fbb.target(new flatbuffers.CastId()));
  if (targetJson.isErr()) {
    return err(targetJson.error);
  }

  return ok({
    target: targetJson.value,
    type: fbb.type(),
  });
};

// TODO: reactionBodyFromJson
