import * as flatbuffers from '@farcaster/flatbuffers';
import { blake3 } from '@noble/hashes/blake3';
import { ByteBuffer } from 'flatbuffers';
import { err, ok, Result } from 'neverthrow';
import { bytesCompare, bytesToUtf8String } from './bytes';
import { ed25519, eip712 } from './crypto';
import { HubAsyncResult, HubError, HubResult } from './errors';
import { getFarcasterTime } from './time';
import { makeVerificationEthAddressClaim } from './verifications';

/** Number of seconds (10 minutes) that is appropriate for clock skew */
export const ALLOWED_CLOCK_SKEW_SECONDS = 10 * 60;

/** Message types that must be signed by EIP712 signer */
export const EIP712_MESSAGE_TYPES = [flatbuffers.MessageType.SignerAdd, flatbuffers.MessageType.SignerRemove];

export const FNAME_REGEX = /^[a-z0-9][a-z0-9-]{0,15}$/;
export const HEX_REGEX = /^(0x)?[0-9A-Fa-f]+$/;

export interface ValidatedCastId extends flatbuffers.CastId {
  fidArray(): Uint8Array;
  tsHashArray(): Uint8Array;
}

export const validateCastId = (castId?: flatbuffers.CastId | null): HubResult<ValidatedCastId> => {
  if (!castId) {
    return err(new HubError('bad_request.validation_failure', 'castId is missing'));
  }
  return Result.combineWithAllErrors([validateFid(castId.fidArray()), validateTsHash(castId.tsHashArray())])
    .map(() => castId as ValidatedCastId)
    .mapErr(
      (errs: HubError[]) => new HubError('bad_request.validation_failure', errs.map((e) => e.message).join(', '))
    );
};

export interface ValidatedUserId extends flatbuffers.UserId {
  fidArray(): Uint8Array;
}

export const validateUserId = (userId?: flatbuffers.UserId | null): HubResult<ValidatedUserId> => {
  if (!userId) {
    return err(new HubError('bad_request.validation_failure', 'userId is missing'));
  }
  return validateFid(userId.fidArray()).map(() => userId as ValidatedUserId);
};

export const validateFid = (fid?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!fid || fid.byteLength === 0) {
    return err(new HubError('bad_request.validation_failure', 'fid is missing'));
  }

  if (fid.byteLength > 32) {
    return err(new HubError('bad_request.validation_failure', 'fid > 32 bytes'));
  }

  if (fid[fid.byteLength - 1] === 0) {
    return err(new HubError('bad_request.validation_failure', 'fid is padded'));
  }

  return ok(fid);
};

export const validateTsHash = (tsHash?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!tsHash || tsHash.byteLength === 0) {
    return err(new HubError('bad_request.validation_failure', 'tsHash is missing'));
  }

  if (tsHash.byteLength !== 20) {
    return err(new HubError('bad_request.validation_failure', 'tsHash must be 20 bytes'));
  }

  return ok(tsHash);
};

export const validateEthAddress = (address?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!address || address.byteLength === 0) {
    return err(new HubError('bad_request.validation_failure', 'address is missing'));
  }

  if (address.byteLength > 20) {
    return err(new HubError('bad_request.validation_failure', 'address > 20 bytes'));
  }

  if (address[address.byteLength - 1] === 0) {
    return err(new HubError('bad_request.validation_failure', 'address is padded'));
  }

  return ok(address);
};

export const validateEthBlockHash = (blockHash?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!blockHash || blockHash.byteLength === 0) {
    return err(new HubError('bad_request.validation_failure', 'blockHash is missing'));
  }

  if (blockHash.byteLength > 32) {
    return err(new HubError('bad_request.validation_failure', 'blockHash > 32 bytes'));
  }

  if (blockHash[blockHash.byteLength - 1] === 0) {
    return err(new HubError('bad_request.validation_failure', 'blockHash is padded'));
  }

  return ok(blockHash);
};

export const validateEd25519PublicKey = (publicKey?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!publicKey || publicKey.byteLength === 0) {
    return err(new HubError('bad_request.validation_failure', 'publicKey is missing'));
  }

  if (publicKey.byteLength > 32) {
    return err(new HubError('bad_request.validation_failure', 'publicKey > 32 bytes'));
  }

  if (publicKey[publicKey.byteLength - 1] === 0) {
    return err(new HubError('bad_request.validation_failure', 'publicKey is padded'));
  }

  return ok(publicKey);
};

export const validateMessage = async (message: flatbuffers.Message): HubAsyncResult<flatbuffers.Message> => {
  // 1. Check the message data
  const dataBytes = message.dataArray();
  if (!dataBytes) {
    return err(new HubError('bad_request.validation_failure', 'data is missing'));
  }
  const data = flatbuffers.MessageData.getRootAsMessageData(new ByteBuffer(dataBytes));
  const validData = validateMessageData(data);
  if (validData.isErr()) {
    return err(validData.error);
  }

  // 2. Check that the hashScheme and hash are valid
  const hash = message.hashArray();
  if (!hash) {
    return err(new HubError('bad_request.validation_failure', 'hash is missing'));
  }

  if (message.hashScheme() === flatbuffers.HashScheme.Blake3) {
    const computedHash = blake3(dataBytes, { dkLen: 16 });
    // we have to use bytesCompare, because TypedArrays cannot be compared directly
    if (bytesCompare(hash, computedHash) !== 0) {
      return err(new HubError('bad_request.validation_failure', 'invalid hash'));
    }
  } else {
    return err(new HubError('bad_request.validation_failure', 'invalid hashScheme'));
  }

  // 2. Check that the signatureScheme and signature are valid
  const signature = message.signatureArray();
  if (!signature) {
    return err(new HubError('bad_request.validation_failure', 'signature is missing'));
  }

  const signer = message.signerArray();
  if (!signer) {
    return err(new HubError('bad_request.validation_failure', 'signer is missing'));
  }

  const eip712SignerRequired = EIP712_MESSAGE_TYPES.includes(data.type() as flatbuffers.MessageType);
  if (message.signatureScheme() === flatbuffers.SignatureScheme.Eip712 && eip712SignerRequired) {
    const verifiedSigner = eip712.verifyMessageHashSignature(hash, signature);
    if (verifiedSigner.isErr()) {
      return err(verifiedSigner.error);
    }
    if (bytesCompare(verifiedSigner.value, signer) !== 0) {
      return err(new HubError('bad_request.validation_failure', 'signature does not match signer'));
    }
  } else if (message.signatureScheme() === flatbuffers.SignatureScheme.Ed25519 && !eip712SignerRequired) {
    const signatureIsValid = await ed25519.verifyMessageHashSignature(signature, hash, signer);
    if (signatureIsValid.isErr() || (signatureIsValid.isOk() && !signatureIsValid.value)) {
      return err(new HubError('bad_request.validation_failure', 'invalid signature'));
    }
  } else {
    return err(new HubError('bad_request.validation_failure', 'invalid signatureScheme'));
  }

  return ok(message);
};

export const validateMessageData = (data: flatbuffers.MessageData): HubResult<flatbuffers.MessageData> => {
  // 1. Validate fid
  const validFid = validateFid(data.fidArray());
  if (validFid.isErr()) {
    return err(validFid.error);
  }

  const farcasterTime = getFarcasterTime();
  if (farcasterTime.isErr()) {
    return err(farcasterTime.error);
  }

  // 2. Validate timestamp
  if (data.timestamp() - farcasterTime.value > ALLOWED_CLOCK_SKEW_SECONDS) {
    return err(new HubError('bad_request.validation_failure', 'timestamp more than 10 mins in the future'));
  }

  // 3. Validate network
  const validNetwork = validateNetwork(data.network() as number);
  if (validNetwork.isErr()) {
    return err(validNetwork.error);
  }

  // 4. Validate type
  if (!data.type()) {
    return err(new HubError('bad_request.validation_failure', 'message type is missing'));
  }

  const validType = validateMessageType(data.type() as number);
  if (validType.isErr()) {
    return err(validType.error);
  }

  // 5. Validate body
  let bodyResult: HubResult<any>;
  if (validType.value === flatbuffers.MessageType.CastAdd && data.bodyType() === flatbuffers.MessageBody.CastAddBody) {
    bodyResult = validateCastAddBody(data.body(new flatbuffers.CastAddBody()));
  } else if (
    validType.value === flatbuffers.MessageType.CastRemove &&
    data.bodyType() === flatbuffers.MessageBody.CastRemoveBody
  ) {
    bodyResult = validateCastRemoveBody(data.body(new flatbuffers.CastRemoveBody()));
  } else if (
    (validType.value === flatbuffers.MessageType.AmpAdd || validType.value === flatbuffers.MessageType.AmpRemove) &&
    data.bodyType() === flatbuffers.MessageBody.AmpBody
  ) {
    bodyResult = validateAmpBody(data.body(new flatbuffers.AmpBody()));
  } else if (
    (validType.value === flatbuffers.MessageType.ReactionAdd ||
      validType.value === flatbuffers.MessageType.ReactionRemove) &&
    data.bodyType() === flatbuffers.MessageBody.ReactionBody
  ) {
    bodyResult = validateReactionBody(data.body(new flatbuffers.ReactionBody()));
  } else if (
    (validType.value === flatbuffers.MessageType.SignerAdd ||
      validType.value === flatbuffers.MessageType.SignerRemove) &&
    data.bodyType() === flatbuffers.MessageBody.SignerBody
  ) {
    bodyResult = validateSignerBody(data.body(new flatbuffers.SignerBody()));
  } else if (
    validType.value === flatbuffers.MessageType.UserDataAdd &&
    data.bodyType() === flatbuffers.MessageBody.UserDataBody
  ) {
    bodyResult = validateUserDataAddBody(data.body(new flatbuffers.UserDataBody()));
  } else if (
    validType.value === flatbuffers.MessageType.VerificationAddEthAddress &&
    data.bodyType() === flatbuffers.MessageBody.VerificationAddEthAddressBody
  ) {
    // Special check for verification claim
    const body = data.body(
      new flatbuffers.VerificationAddEthAddressBody()
    ) as flatbuffers.VerificationAddEthAddressBody;
    bodyResult = validateVerificationAddEthAddressBody(data.body(new flatbuffers.VerificationAddEthAddressBody()));
    if (bodyResult.isOk()) {
      const validVerificationSignature = validateVerificationAddEthAddressSignature(
        body,
        validFid.value,
        validNetwork.value
      );
      if (validVerificationSignature.isErr()) {
        return err(validVerificationSignature.error);
      }
    }
  } else if (
    validType.value === flatbuffers.MessageType.VerificationRemove &&
    data.bodyType() === flatbuffers.MessageBody.VerificationRemoveBody
  ) {
    bodyResult = validateVerificationRemoveBody(data.body(new flatbuffers.VerificationRemoveBody()));
  } else {
    return err(new HubError('bad_request.invalid_param', 'bodyType is invalid'));
  }

  if (bodyResult.isErr()) {
    return err(bodyResult.error);
  }

  return ok(data);
};

export const validateVerificationAddEthAddressSignature = (
  body: flatbuffers.VerificationAddEthAddressBody,
  fid: Uint8Array,
  network: flatbuffers.FarcasterNetwork
): HubResult<Uint8Array> => {
  const reconstructedClaim = makeVerificationEthAddressClaim(
    fid,
    body.addressArray() ?? new Uint8Array(),
    network,
    body.blockHashArray() ?? new Uint8Array()
  );
  if (reconstructedClaim.isErr()) {
    return err(reconstructedClaim.error);
  }

  const recoveredAddress = eip712.verifyVerificationEthAddressClaimSignature(
    reconstructedClaim.value,
    body.ethSignatureArray() ?? new Uint8Array()
  );

  if (recoveredAddress.isErr()) {
    return err(new HubError('bad_request.validation_failure', 'invalid ethSignature'));
  }

  if (bytesCompare(recoveredAddress.value, body.addressArray() ?? new Uint8Array()) !== 0) {
    return err(new HubError('bad_request.validation_failure', 'ethSignature does not match address'));
  }

  return ok(body.ethSignatureArray() ?? new Uint8Array());
};

export const validateCastAddBody = (body: flatbuffers.CastAddBody): HubResult<flatbuffers.CastAddBody> => {
  const text = body.text();
  if (!text) {
    return err(new HubError('bad_request.validation_failure', 'text is missing'));
  }

  if (text.length > 320) {
    return err(new HubError('bad_request.validation_failure', 'text > 320 chars'));
  }

  if (body.embedsLength() > 2) {
    return err(new HubError('bad_request.validation_failure', 'embeds > 2'));
  }

  if (body.mentionsLength() > 5) {
    return err(new HubError('bad_request.validation_failure', 'mentions > 5'));
  }

  if (body.parentType() === flatbuffers.TargetId.CastId) {
    const parent = body.parent(new flatbuffers.CastId()) as flatbuffers.CastId;
    const validateParent = validateCastId(parent);
    if (validateParent.isErr()) {
      return err(validateParent.error);
    }
  }

  return ok(body);
};

export const validateCastRemoveBody = (body: flatbuffers.CastRemoveBody): HubResult<flatbuffers.CastRemoveBody> => {
  return validateTsHash(body.targetTsHashArray()).map(() => body);
};

export const validateReactionType = (type: number): HubResult<flatbuffers.ReactionType> => {
  if (!Object.values(flatbuffers.ReactionType).includes(type)) {
    return err(new HubError('bad_request.validation_failure', 'invalid reaction type'));
  }

  return ok(type);
};

export const validateMessageType = (type: number): HubResult<flatbuffers.MessageType> => {
  if (!Object.values(flatbuffers.MessageType).includes(type)) {
    return err(new HubError('bad_request.validation_failure', 'invalid message type'));
  }

  return ok(type);
};

export const validateNetwork = (network: number): HubResult<flatbuffers.FarcasterNetwork> => {
  if (!Object.values(flatbuffers.FarcasterNetwork).includes(network)) {
    return err(new HubError('bad_request.validation_failure', 'invalid network'));
  }

  return ok(network);
};

export const validateReactionBody = (body: flatbuffers.ReactionBody): HubResult<flatbuffers.ReactionBody> => {
  const validatedType = validateReactionType(body.type());
  if (validatedType.isErr()) {
    return err(validatedType.error);
  }

  return validateCastId(body.target(new flatbuffers.CastId())).map(() => body);
};

export const validateVerificationAddEthAddressBody = (
  body: flatbuffers.VerificationAddEthAddressBody
): HubResult<flatbuffers.VerificationAddEthAddressBody> => {
  const validAddress = validateEthAddress(body.addressArray());
  if (validAddress.isErr()) {
    return err(validAddress.error);
  }

  const validBlockHash = validateEthBlockHash(body.blockHashArray());
  if (validBlockHash.isErr()) {
    return err(validBlockHash.error);
  }

  // TODO: validate eth signature

  return ok(body);
};

export const validateVerificationRemoveBody = (
  body: flatbuffers.VerificationRemoveBody
): HubResult<flatbuffers.VerificationRemoveBody> => {
  return validateEthAddress(body.addressArray()).map(() => body);
};

export const validateSignerBody = (body: flatbuffers.SignerBody): HubResult<flatbuffers.SignerBody> => {
  return validateEd25519PublicKey(body.signerArray()).map(() => body);
};

export const validateAmpBody = (body: flatbuffers.AmpBody): HubResult<flatbuffers.AmpBody> => {
  return validateFid(body.user()?.fidArray()).map(() => body);
};

export const validateUserDataType = (type: number): HubResult<flatbuffers.UserDataType> => {
  if (!Object.values(flatbuffers.UserDataType).includes(type)) {
    return err(new HubError('bad_request.validation_failure', 'invalid user data type'));
  }

  return ok(type);
};

export const validateUserDataAddBody = (body: flatbuffers.UserDataBody): HubResult<flatbuffers.UserDataBody> => {
  const value = body.value();
  if (body.type() === flatbuffers.UserDataType.Pfp) {
    if (value && value.length > 256) {
      return err(new HubError('bad_request.validation_failure', 'pfp value > 256'));
    }
  } else if (body.type() === flatbuffers.UserDataType.Display) {
    if (value && value.length > 32) {
      return err(new HubError('bad_request.validation_failure', 'display value > 32'));
    }
  } else if (body.type() === flatbuffers.UserDataType.Bio) {
    if (value && value.length > 256) {
      return err(new HubError('bad_request.validation_failure', 'bio value > 256'));
    }
  } else if (body.type() === flatbuffers.UserDataType.Location) {
    if (value && value.length > 32) {
      return err(new HubError('bad_request.validation_failure', 'location value > 32'));
    }
  } else if (body.type() === flatbuffers.UserDataType.Url) {
    if (value && value.length > 256) {
      return err(new HubError('bad_request.validation_failure', 'url value > 256'));
    }
  } else if (body.type() === flatbuffers.UserDataType.Fname) {
    // Users are allowed to set fname = '' to remove their fname, otherwise we need a valid fname to add
    if (value !== '') {
      const validatedFname = validateFname(value);
      if (validatedFname.isErr()) {
        return err(validatedFname.error);
      }
    }
  } else {
    return err(new HubError('bad_request.validation_failure', 'invalid user data type'));
  }

  return ok(body);
};

export const validateFname = <T extends string | Uint8Array>(fnameP?: T | null): HubResult<T> => {
  if (fnameP === undefined || fnameP === null || fnameP === '') {
    return err(new HubError('bad_request.validation_failure', 'fname is missing'));
  }

  let fname;
  if (fnameP instanceof Uint8Array) {
    const fromBytes = bytesToUtf8String(fnameP);
    if (fromBytes.isErr()) {
      return err(fromBytes.error);
    }
    fname = fromBytes.value;
  } else {
    fname = fnameP;
  }

  if (fname === undefined || fname === null || fname === '') {
    return err(new HubError('bad_request.validation_failure', 'fname is missing'));
  }

  if (fname.length > 16) {
    return err(new HubError('bad_request.validation_failure', `fname "${fname}" > 16 characters`));
  }

  const hasValidChars = FNAME_REGEX.test(fname);
  if (hasValidChars === false) {
    return err(new HubError('bad_request.validation_failure', `fname "${fname}" doesn't match ${FNAME_REGEX}`));
  }

  return ok(fnameP);
};

const buildValidateHex = (length?: number, label?: string) => (hex: string) =>
  validateHexString(hex, label).andThen(() => {
    if (length) {
      return validateHexLength(hex, length, label);
    } else {
      return ok(hex);
    }
  });

const validateHexString = (hex: string, label = 'hex string'): HubResult<string> => {
  const hasValidChars = HEX_REGEX.test(hex);
  if (hasValidChars === false) {
    return err(new HubError('bad_request.validation_failure', `${label} "${hex}" is not valid hex`));
  }

  return ok(hex);
};

const validateHexLength = (hex: string, length: number, label = 'hex string'): HubResult<string> => {
  let value = hex;
  if (value.substring(0, 2) === '0x') {
    value = value.substring(2);
  }

  if (value.length !== length) {
    return err(new HubError('bad_request.validation_failure', `${label} "${hex} is not ${length} characters`));
  }

  return ok(hex);
};

export const validateBlockHashHex = buildValidateHex(64, 'block hash');
export const validateTransactionHashHex = buildValidateHex(64, 'transaction hash');
export const validateEip712SignatureHex = buildValidateHex(130, 'EIP-712 signature');
export const validateEd25519ignatureHex = buildValidateHex(128, 'Ed25519 signature');
export const validateMessageHashHex = buildValidateHex(32, 'message hash');
export const validateEthAddressHex = buildValidateHex(40, 'eth address');
export const validateEd25519PublicKeyHex = buildValidateHex(64, 'Ed25519 public key');
export const validateTsHashHex = buildValidateHex(40, 'ts-hash');
