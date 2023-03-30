import * as protobufs from '@farcaster/protobufs';
import { blake3 } from '@noble/hashes/blake3';
import { err, ok, Result } from 'neverthrow';
import { bytesCompare, bytesToUtf8String, utf8StringToBytes } from './bytes';
import { ed25519, eip712 } from './crypto';
import { HubAsyncResult, HubError, HubResult } from './errors';
import { getFarcasterTime } from './time';
import { makeVerificationEthAddressClaim } from './verifications';

/** Number of seconds (10 minutes) that is appropriate for clock skew */
export const ALLOWED_CLOCK_SKEW_SECONDS = 10 * 60;

/** Message types that must be signed by EIP712 signer */
export const EIP712_MESSAGE_TYPES = [protobufs.MessageType.SIGNER_ADD, protobufs.MessageType.SIGNER_REMOVE];

export const FNAME_REGEX = /^[a-z0-9][a-z0-9-]{0,15}$/;
export const HEX_REGEX = /^(0x)?[0-9A-Fa-f]+$/;

export const validateMessageHash = (hash?: Uint8Array): HubResult<Uint8Array> => {
  if (!hash || hash.length === 0) {
    return err(new HubError('bad_request.validation_failure', 'hash is missing'));
  }

  if (hash.length !== 20) {
    return err(new HubError('bad_request.validation_failure', 'hash must be 20 bytes'));
  }

  return ok(hash);
};

export const validateCastId = (castId?: protobufs.CastId): HubResult<protobufs.CastId> => {
  if (!castId) {
    return err(new HubError('bad_request.validation_failure', 'castId is missing'));
  }
  return Result.combineWithAllErrors([validateFid(castId.fid), validateMessageHash(castId.hash)])
    .map(() => castId)
    .mapErr(
      (errs: HubError[]) => new HubError('bad_request.validation_failure', errs.map((e) => e.message).join(', '))
    );
};

export const validateFid = (fid?: number | null): HubResult<number> => {
  if (typeof fid !== 'number' || fid === 0) {
    return err(new HubError('bad_request.validation_failure', 'fid is missing'));
  }

  if (fid < 0) {
    return err(new HubError('bad_request.validation_failure', 'fid must be positive'));
  }

  if (!Number.isInteger(fid)) {
    return err(new HubError('bad_request.validation_failure', 'fid must be an integer'));
  }

  return ok(fid);
};

export const validateEthAddress = (address?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!address || address.length === 0) {
    return err(new HubError('bad_request.validation_failure', 'address is missing'));
  }

  if (address.length !== 20) {
    return err(new HubError('bad_request.validation_failure', 'address must be 20 bytes'));
  }

  return ok(address);
};

export const validateEthBlockHash = (blockHash?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!blockHash || blockHash.length === 0) {
    return err(new HubError('bad_request.validation_failure', 'blockHash is missing'));
  }

  if (blockHash.length !== 32) {
    return err(new HubError('bad_request.validation_failure', 'blockHash must be 32 bytes'));
  }

  return ok(blockHash);
};

export const validateEd25519PublicKey = (publicKey?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!publicKey || publicKey.length === 0) {
    return err(new HubError('bad_request.validation_failure', 'publicKey is missing'));
  }

  if (publicKey.length !== 32) {
    return err(new HubError('bad_request.validation_failure', 'publicKey must be 32 bytes'));
  }

  return ok(publicKey);
};

export const validateMessage = async (message: protobufs.Message): HubAsyncResult<protobufs.Message> => {
  // 1. Check the message data
  const data = message.data;
  if (!data) {
    return err(new HubError('bad_request.validation_failure', 'data is missing'));
  }
  const validData = validateMessageData(data);
  if (validData.isErr()) {
    return err(validData.error);
  }

  // 2. Check that the hashScheme and hash are valid
  const hash = message.hash;
  if (!hash) {
    return err(new HubError('bad_request.validation_failure', 'hash is missing'));
  }

  const dataBytes = protobufs.MessageData.encode(data).finish();
  if (message.hashScheme === protobufs.HashScheme.BLAKE3) {
    const computedHash = blake3(dataBytes, { dkLen: 20 });
    // we have to use bytesCompare, because TypedArrays cannot be compared directly
    if (bytesCompare(hash, computedHash) !== 0) {
      return err(new HubError('bad_request.validation_failure', 'invalid hash'));
    }
  } else {
    return err(new HubError('bad_request.validation_failure', 'invalid hashScheme'));
  }

  // 2. Check that the signatureScheme and signature are valid
  const signature = message.signature;
  if (!signature) {
    return err(new HubError('bad_request.validation_failure', 'signature is missing'));
  }

  const signer = message.signer;
  if (!signer) {
    return err(new HubError('bad_request.validation_failure', 'signer is missing'));
  }

  const eip712SignerRequired = EIP712_MESSAGE_TYPES.includes(data.type);
  if (message.signatureScheme === protobufs.SignatureScheme.EIP712 && eip712SignerRequired) {
    const verifiedSigner = eip712.verifyMessageHashSignature(hash, signature);
    if (verifiedSigner.isErr()) {
      return err(verifiedSigner.error);
    }
    if (bytesCompare(verifiedSigner.value, signer) !== 0) {
      return err(new HubError('bad_request.validation_failure', 'signature does not match signer'));
    }
  } else if (message.signatureScheme === protobufs.SignatureScheme.ED25519 && !eip712SignerRequired) {
    const signatureIsValid = await ed25519.verifyMessageHashSignature(signature, hash, signer);
    if (signatureIsValid.isErr() || (signatureIsValid.isOk() && !signatureIsValid.value)) {
      return err(new HubError('bad_request.validation_failure', 'invalid signature'));
    }
  } else {
    return err(new HubError('bad_request.validation_failure', 'invalid signatureScheme'));
  }

  return ok(message);
};

export const validateMessageData = <T extends protobufs.MessageData>(data: T): HubResult<T> => {
  // 1. Validate fid
  const validFid = validateFid(data.fid);
  if (validFid.isErr()) {
    return err(validFid.error);
  }

  const farcasterTime = getFarcasterTime();
  if (farcasterTime.isErr()) {
    return err(farcasterTime.error);
  }

  // 2. Validate timestamp
  if (data.timestamp - farcasterTime.value > ALLOWED_CLOCK_SKEW_SECONDS) {
    return err(new HubError('bad_request.validation_failure', 'timestamp more than 10 mins in the future'));
  }

  // 3. Validate network
  const validNetwork = validateNetwork(data.network);
  if (validNetwork.isErr()) {
    return err(validNetwork.error);
  }

  // 4. Validate type
  const validType = validateMessageType(data.type);
  if (validType.isErr()) {
    return err(validType.error);
  }

  // 5. Validate body
  let bodyResult: HubResult<any>;
  if (validType.value === protobufs.MessageType.CAST_ADD && !!data.castAddBody) {
    bodyResult = validateCastAddBody(data.castAddBody);
  } else if (validType.value === protobufs.MessageType.CAST_REMOVE && !!data.castRemoveBody) {
    bodyResult = validateCastRemoveBody(data.castRemoveBody);
  } else if (
    (validType.value === protobufs.MessageType.REACTION_ADD ||
      validType.value === protobufs.MessageType.REACTION_REMOVE) &&
    !!data.reactionBody
  ) {
    bodyResult = validateReactionBody(data.reactionBody);
  } else if (validType.value === protobufs.MessageType.SIGNER_ADD && !!data.signerAddBody) {
    bodyResult = validateSignerAddBody(data.signerAddBody);
  } else if (validType.value === protobufs.MessageType.SIGNER_REMOVE && !!data.signerRemoveBody) {
    bodyResult = validateSignerRemoveBody(data.signerRemoveBody);
  } else if (validType.value === protobufs.MessageType.USER_DATA_ADD && !!data.userDataBody) {
    bodyResult = validateUserDataAddBody(data.userDataBody);
  } else if (
    validType.value === protobufs.MessageType.VERIFICATION_ADD_ETH_ADDRESS &&
    !!data.verificationAddEthAddressBody
  ) {
    // Special check for verification claim
    bodyResult = validateVerificationAddEthAddressBody(data.verificationAddEthAddressBody).andThen((body) => {
      return validateVerificationAddEthAddressSignature(body, validFid.value, validNetwork.value);
    });
  } else if (validType.value === protobufs.MessageType.VERIFICATION_REMOVE && !!data.verificationRemoveBody) {
    bodyResult = validateVerificationRemoveBody(data.verificationRemoveBody);
  } else {
    return err(new HubError('bad_request.invalid_param', 'bodyType is invalid'));
  }

  if (bodyResult.isErr()) {
    return err(bodyResult.error);
  }

  return ok(data);
};

export const validateVerificationAddEthAddressSignature = (
  body: protobufs.VerificationAddEthAddressBody,
  fid: number,
  network: protobufs.FarcasterNetwork
): HubResult<Uint8Array> => {
  const reconstructedClaim = makeVerificationEthAddressClaim(fid, body.address, network, body.blockHash);
  if (reconstructedClaim.isErr()) {
    return err(reconstructedClaim.error);
  }

  const recoveredAddress = eip712
    .verifyVerificationEthAddressClaimSignature(reconstructedClaim.value, body.ethSignature)
    .mapErr(() => new HubError('bad_request.validation_failure', 'invalid ethSignature'));

  if (recoveredAddress.isErr()) {
    return err(recoveredAddress.error);
  }

  if (bytesCompare(recoveredAddress.value, body.address ?? new Uint8Array()) !== 0) {
    return err(new HubError('bad_request.validation_failure', 'ethSignature does not match address'));
  }

  return ok(body.ethSignature);
};

export const validateCastAddBody = (body: protobufs.CastAddBody): HubResult<protobufs.CastAddBody> => {
  const text = body.text;
  if (text === undefined || text === null) {
    return err(new HubError('bad_request.validation_failure', 'text is missing'));
  }

  const textUtf8BytesResult = utf8StringToBytes(text);
  if (textUtf8BytesResult.isErr()) {
    return err(new HubError('bad_request.invalid_param', 'text must be encodable as utf8'));
  }
  const textBytes = textUtf8BytesResult.value;

  if (textBytes.length > 320) {
    return err(new HubError('bad_request.validation_failure', 'text > 320 bytes'));
  }

  if (body.embeds.length > 2) {
    return err(new HubError('bad_request.validation_failure', 'embeds > 2'));
  }

  if (body.mentions.length > 10) {
    return err(new HubError('bad_request.validation_failure', 'mentions > 10'));
  }

  if (body.mentions.length !== body.mentionsPositions.length) {
    return err(new HubError('bad_request.validation_failure', 'mentions and mentionsPositions must match'));
  }

  for (let i = 0; i < body.embeds.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const embed = body.embeds[i];
    if (typeof embed !== 'string') {
      return err(new HubError('bad_request.validation_failure', 'embeds must be strings'));
    }

    const embedUtf8BytesResult = utf8StringToBytes(embed);
    if (embedUtf8BytesResult.isErr()) {
      return err(new HubError('bad_request.invalid_param', 'embed must be encodable as utf8'));
    }
    const embedBytes = embedUtf8BytesResult.value;

    if (embedBytes.length < 1) {
      return err(new HubError('bad_request.invalid_param', 'embed < 1 byte'));
    }

    if (embedBytes.length > 256) {
      return err(new HubError('bad_request.invalid_param', 'embed > 256 bytes'));
    }
  }

  for (let i = 0; i < body.mentions.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    const mention = validateFid(body.mentions[i]);
    if (mention.isErr()) {
      return err(mention.error);
    }
    // eslint-disable-next-line security/detect-object-injection
    const position = body.mentionsPositions[i];
    if (typeof position !== 'number' || !Number.isInteger(position)) {
      return err(new HubError('bad_request.validation_failure', 'mentionsPositions must be integers'));
    }
    if (position < 0 || position > textBytes.length) {
      return err(new HubError('bad_request.validation_failure', 'mentionsPositions must be a position in text'));
    }
    if (i > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const prevPosition = body.mentionsPositions[i - 1]!;
      if (position < prevPosition) {
        return err(
          new HubError('bad_request.validation_failure', 'mentionsPositions must be sorted in ascending order')
        );
      }
    }
  }

  if (body.parentCastId) {
    const validateParent = validateCastId(body.parentCastId);
    if (validateParent.isErr()) {
      return err(validateParent.error);
    }
  }

  return ok(body);
};

export const validateCastRemoveBody = (body: protobufs.CastRemoveBody): HubResult<protobufs.CastRemoveBody> => {
  return validateMessageHash(body.targetHash).map(() => body);
};

export const validateReactionType = (type: number): HubResult<protobufs.ReactionType> => {
  if (!Object.values(protobufs.ReactionType).includes(type)) {
    return err(new HubError('bad_request.validation_failure', 'invalid reaction type'));
  }

  return ok(type);
};

export const validateMessageType = (type: number): HubResult<protobufs.MessageType> => {
  if (!Object.values(protobufs.MessageType).includes(type)) {
    return err(new HubError('bad_request.validation_failure', 'invalid message type'));
  }

  return ok(type);
};

export const validateNetwork = (network: number): HubResult<protobufs.FarcasterNetwork> => {
  if (!Object.values(protobufs.FarcasterNetwork).includes(network)) {
    return err(new HubError('bad_request.validation_failure', 'invalid network'));
  }

  return ok(network);
};

export const validateReactionBody = (body: protobufs.ReactionBody): HubResult<protobufs.ReactionBody> => {
  const validatedType = validateReactionType(body.type);
  if (validatedType.isErr()) {
    return err(validatedType.error);
  }

  return validateCastId(body.targetCastId).map(() => body);
};

export const validateVerificationAddEthAddressBody = (
  body: protobufs.VerificationAddEthAddressBody
): HubResult<protobufs.VerificationAddEthAddressBody> => {
  const validAddress = validateEthAddress(body.address);
  if (validAddress.isErr()) {
    return err(validAddress.error);
  }

  const validBlockHash = validateEthBlockHash(body.blockHash);
  if (validBlockHash.isErr()) {
    return err(validBlockHash.error);
  }

  // TODO: validate eth signature

  return ok(body);
};

export const validateVerificationRemoveBody = (
  body: protobufs.VerificationRemoveBody
): HubResult<protobufs.VerificationRemoveBody> => {
  return validateEthAddress(body.address).map(() => body);
};

export const validateSignerAddBody = (body: protobufs.SignerAddBody): HubResult<protobufs.SignerAddBody> => {
  if (body.name !== undefined) {
    const textUtf8BytesResult = utf8StringToBytes(body.name);
    if (textUtf8BytesResult.isErr()) {
      return err(new HubError('bad_request.invalid_param', 'name cannot be encoded as utf8'));
    }

    if (textUtf8BytesResult.value.length === 0) {
      return err(new HubError('bad_request.validation_failure', 'name cannot be empty string'));
    }

    if (textUtf8BytesResult.value.length > 32) {
      return err(new HubError('bad_request.validation_failure', 'name > 32 bytes'));
    }
  }

  return validateEd25519PublicKey(body.signer).map(() => body);
};

export const validateSignerRemoveBody = (body: protobufs.SignerRemoveBody): HubResult<protobufs.SignerRemoveBody> => {
  return validateEd25519PublicKey(body.signer).map(() => body);
};

export const validateUserDataType = (type: number): HubResult<protobufs.UserDataType> => {
  if (
    !Object.values(protobufs.UserDataType).includes(type) ||
    type === protobufs.UserDataType.NONE ||
    type === protobufs.UserDataType.NONE
  ) {
    return err(new HubError('bad_request.validation_failure', 'invalid user data type'));
  }

  return ok(type);
};

export const validateUserDataAddBody = (body: protobufs.UserDataBody): HubResult<protobufs.UserDataBody> => {
  const { type, value } = body;

  const textUtf8BytesResult = utf8StringToBytes(value);
  if (textUtf8BytesResult.isErr()) {
    return err(new HubError('bad_request.invalid_param', 'value cannot be encoded as utf8'));
  }

  const valueBytes = textUtf8BytesResult.value;

  switch (type) {
    case protobufs.UserDataType.PFP:
      if (valueBytes.length > 256) {
        return err(new HubError('bad_request.validation_failure', 'pfp value > 256'));
      }
      break;
    case protobufs.UserDataType.DISPLAY:
      if (valueBytes.length > 32) {
        return err(new HubError('bad_request.validation_failure', 'display value > 32'));
      }
      break;
    case protobufs.UserDataType.BIO:
      if (valueBytes.length > 256) {
        return err(new HubError('bad_request.validation_failure', 'bio value > 256'));
      }
      break;
    case protobufs.UserDataType.URL:
      if (valueBytes.length > 256) {
        return err(new HubError('bad_request.validation_failure', 'url value > 256'));
      }
      break;
    case protobufs.UserDataType.FNAME: {
      // Users are allowed to set fname = '' to remove their fname, otherwise we need a valid fname to add
      if (value !== '') {
        const validatedFname = validateFname(value);
        if (validatedFname.isErr()) {
          return err(validatedFname.error);
        }
      }
      break;
    }
    default:
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
