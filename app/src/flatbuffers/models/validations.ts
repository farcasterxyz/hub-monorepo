import { bytesCompare, bytesToHexString } from '@hub/bytes';
import { HubAsyncResult, HubError, HubResult } from '@hub/errors';
import * as message_generated from '@hub/flatbuffers';
import * as ed from '@noble/ed25519';
import { blake3 } from '@noble/hashes/blake3';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import { bytesToBigNumber } from '~/eth/utils';
import MessageModel, { FID_BYTES } from '~/flatbuffers/models/messageModel';
import * as typeguards from '~/flatbuffers/models/typeguards';
import * as types from '~/flatbuffers/models/types';
import { verifyMessageHashSignature, verifyVerificationEthAddressClaimSignature } from '~/flatbuffers/utils/eip712';
import { getFarcasterTime } from '~/flatbuffers/utils/time';

/** Number of seconds (10 minutes) that is appropriate for clock skew */
export const ALLOWED_CLOCK_SKEW_SECONDS = 10 * 60;

/** Message types that must be signed by EIP712 signer */
export const EIP712_MESSAGE_TYPES = [
  message_generated.MessageType.SignerAdd,
  message_generated.MessageType.SignerRemove,
];

export const validateMessage = async (message: MessageModel): HubAsyncResult<MessageModel> => {
  // 1. Check that the hashScheme and hash are valid
  if (message.hashScheme() === message_generated.HashScheme.Blake3) {
    const computedHash = blake3(message.dataBytes(), { dkLen: 16 });
    // we have to use bytesCompare, because TypedArrays cannot be compared directly
    if (bytesCompare(message.hash(), computedHash) !== 0) {
      return err(new HubError('bad_request.validation_failure', 'invalid hash'));
    }
  } else {
    return err(new HubError('bad_request.validation_failure', 'invalid hashScheme'));
  }

  // 2. Check that the signatureScheme and signature are valid
  if (
    message.signatureScheme() === message_generated.SignatureScheme.Eip712 &&
    EIP712_MESSAGE_TYPES.includes(message.type())
  ) {
    const verifiedSigner = verifyMessageHashSignature(message.hash(), message.signature());
    if (verifiedSigner.isErr()) {
      return err(verifiedSigner.error);
    }
    if (bytesCompare(verifiedSigner.value, message.signer()) !== 0) {
      return err(new HubError('bad_request.validation_failure', 'signature does not match signer'));
    }
  } else if (
    message.signatureScheme() === message_generated.SignatureScheme.Ed25519 &&
    !EIP712_MESSAGE_TYPES.includes(message.type())
  ) {
    const signatureIsValid = await ResultAsync.fromPromise(
      ed.verify(message.signature(), message.hash(), message.signer()),
      () => undefined
    );
    if (signatureIsValid.isErr() || (signatureIsValid.isOk() && !signatureIsValid.value)) {
      return err(new HubError('bad_request.validation_failure', 'invalid signature'));
    }
  } else {
    return err(new HubError('bad_request.validation_failure', 'invalid signatureScheme'));
  }

  // 3. Verify that the timestamp is not too far in the future.
  if (message.timestamp() - getFarcasterTime() > ALLOWED_CLOCK_SKEW_SECONDS) {
    return err(new HubError('bad_request.validation_failure', 'timestamp more than 10 mins in the future'));
  }

  if (typeguards.isCastAdd(message)) {
    return validateCastAddMessage(message);
  } else if (typeguards.isCastRemove(message)) {
    return validateCastRemoveMessage(message);
  } else if (typeguards.isReactionAdd(message) || typeguards.isReactionRemove(message)) {
    return validateReactionMessage(message);
  } else if (typeguards.isVerificationAddEthAddress(message)) {
    return await validateVerificationAddEthAddressMessage(message);
  } else if (typeguards.isVerificationRemove(message)) {
    return validateVerificationRemoveMessage(message);
  } else if (typeguards.isSignerAdd(message) || typeguards.isSignerRemove(message)) {
    return validateSignerMessage(message);
  } else if (typeguards.isAmpAdd(message) || typeguards.isAmpRemove(message)) {
    return validateAmpMessage(message);
  } else if (typeguards.isUserDataAdd(message)) {
    return validateUserDataAddMessage(message);
  } else {
    return err(new HubError('bad_request.validation_failure', 'unknown message type'));
  }
};

export interface ValidatedCastId extends message_generated.CastId {
  fidArray(): Uint8Array;
  tsHashArray(): Uint8Array;
}

export const validateCastId = (castId?: message_generated.CastId | null): HubResult<ValidatedCastId> => {
  if (!castId) {
    return err(new HubError('bad_request.validation_failure', 'castId is missing'));
  }
  return Result.combineWithAllErrors([validateFid(castId.fidArray()), validateTsHash(castId.tsHashArray())])
    .map(() => castId as ValidatedCastId)
    .mapErr(
      (errs: HubError[]) => new HubError('bad_request.validation_failure', errs.map((e) => e.message).join(', '))
    );
};

export interface ValidatedUserId extends message_generated.UserId {
  fidArray(): Uint8Array;
}

export const validateUserId = (userId?: message_generated.UserId | null): HubResult<ValidatedUserId> => {
  if (!userId) {
    return err(new HubError('bad_request.validation_failure', 'userId is missing'));
  }
  return validateFid(userId.fidArray()).map(() => userId as ValidatedUserId);
};

export const validateFid = (fid?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!fid || fid.byteLength === 0) {
    return err(new HubError('bad_request.validation_failure', 'fid is missing'));
  }

  if (fid.byteLength > FID_BYTES) {
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

  if (address.byteLength !== 20) {
    return err(new HubError('bad_request.validation_failure', 'address must be 20 bytes'));
  }

  return ok(address);
};

export const validateEthBlockHash = (blockHash?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!blockHash || blockHash.byteLength === 0) {
    return err(new HubError('bad_request.validation_failure', 'blockHash is missing'));
  }

  if (blockHash.byteLength !== 32) {
    return err(new HubError('bad_request.validation_failure', 'blockHash must be 32 bytes'));
  }

  return ok(blockHash);
};

export const validateEd25519PublicKey = (publicKey?: Uint8Array | null): HubResult<Uint8Array> => {
  if (!publicKey || publicKey.byteLength === 0) {
    return err(new HubError('bad_request.validation_failure', 'publicKey is missing'));
  }

  if (publicKey.byteLength !== 32) {
    return err(new HubError('bad_request.validation_failure', 'publicKey must be 32 bytes'));
  }

  return ok(publicKey);
};

export const validateCastAddMessage = (message: types.CastAddModel): HubResult<types.CastAddModel> => {
  const text = message.body().text();
  if (!text) {
    return err(new HubError('bad_request.validation_failure', 'text is missing'));
  }

  if (text.length > 320) {
    return err(new HubError('bad_request.validation_failure', 'text > 320 chars'));
  }

  if (message.body().embedsLength() > 2) {
    return err(new HubError('bad_request.validation_failure', 'embeds > 2'));
  }

  if (message.body().mentionsLength() > 5) {
    return err(new HubError('bad_request.validation_failure', 'mentions > 5'));
  }

  if (message.body().parentType() === message_generated.TargetId.CastId) {
    const parent = message.body().parent(new message_generated.CastId()) as message_generated.CastId;
    return validateCastId(parent).map(() => message);
  }

  return ok(message);
};

export const validateCastRemoveMessage = (message: types.CastRemoveModel): HubResult<types.CastRemoveModel> => {
  return validateTsHash(message.body().targetTsHashArray()).map(() => message);
};

export const validateReactionType = (type: number): HubResult<message_generated.ReactionType> => {
  if (!Object.values(message_generated.ReactionType).includes(type)) {
    return err(new HubError('bad_request.validation_failure', 'invalid reaction type'));
  }

  return ok(type);
};

export const validateReactionMessage = (
  message: types.ReactionAddModel | types.ReactionRemoveModel
): HubResult<types.ReactionAddModel | types.ReactionRemoveModel> => {
  const validatedType = validateReactionType(message.body().type());
  if (validatedType.isErr()) {
    return err(validatedType.error);
  }

  return validateCastId(message.body().target(new message_generated.CastId())).map(() => message);
};

export const validateVerificationAddEthAddressMessage = async (
  message: types.VerificationAddEthAddressModel
): HubAsyncResult<types.VerificationAddEthAddressModel> => {
  const validAddress = validateEthAddress(message.body().addressArray());
  if (validAddress.isErr()) {
    return err(validAddress.error);
  }

  const validBlockHash = validateEthBlockHash(message.body().blockHashArray());
  if (validBlockHash.isErr()) {
    return err(validBlockHash.error);
  }

  const fidBigNumber = bytesToBigNumber(message.fid());
  if (fidBigNumber.isErr()) {
    return err(fidBigNumber.error);
  }

  const addressHex = bytesToHexString(validAddress.value);
  if (addressHex.isErr()) {
    return err(addressHex.error);
  }

  const blockHashHex = bytesToHexString(validBlockHash.value);
  if (blockHashHex.isErr()) {
    return err(blockHashHex.error);
  }

  const reconstructedClaim: types.VerificationEthAddressClaim = {
    fid: fidBigNumber.value,
    address: addressHex.value,
    network: message.network(),
    blockHash: blockHashHex.value,
  };

  const recoveredAddress = verifyVerificationEthAddressClaimSignature(
    reconstructedClaim,
    message.body().ethSignatureArray() ?? new Uint8Array()
  );

  if (recoveredAddress.isErr()) {
    return err(new HubError('bad_request.validation_failure', 'invalid ethSignature'));
  }

  if (bytesCompare(recoveredAddress.value, validAddress.value) !== 0) {
    return err(new HubError('bad_request.validation_failure', 'ethSignature does not match address'));
  }

  return ok(message);
};

export const validateVerificationRemoveMessage = (
  message: types.VerificationRemoveModel
): HubResult<types.VerificationRemoveModel> => {
  return validateEthAddress(message.body().addressArray()).map(() => message);
};

export const validateSignerMessage = (
  message: types.SignerAddModel | types.SignerRemoveModel
): HubResult<types.SignerAddModel | types.SignerRemoveModel> => {
  return validateEd25519PublicKey(message.body().signerArray()).map(() => message);
};

export const validateAmpMessage = (
  message: types.AmpAddModel | types.AmpRemoveModel
): HubResult<types.AmpAddModel | types.AmpRemoveModel> => {
  return validateFid(message.body().user()?.fidArray()).map(() => message);
};

export const validateUserDataAddMessage = (message: types.UserDataAddModel): HubResult<types.UserDataAddModel> => {
  const value = message.body().value();
  if (message.body().type() === message_generated.UserDataType.Pfp) {
    if (value && value.length > 256) {
      return err(new HubError('bad_request.validation_failure', 'pfp value > 256'));
    }
  } else if (message.body().type() === message_generated.UserDataType.Display) {
    if (value && value.length > 32) {
      return err(new HubError('bad_request.validation_failure', 'display value > 32'));
    }
  } else if (message.body().type() === message_generated.UserDataType.Bio) {
    if (value && value.length > 256) {
      return err(new HubError('bad_request.validation_failure', 'bio value > 256'));
    }
  } else if (message.body().type() === message_generated.UserDataType.Location) {
    if (value && value.length > 32) {
      return err(new HubError('bad_request.validation_failure', 'location value > 32'));
    }
  } else if (message.body().type() === message_generated.UserDataType.Url) {
    if (value && value.length > 256) {
      return err(new HubError('bad_request.validation_failure', 'url value > 256'));
    }
  } else if (message.body().type() === message_generated.UserDataType.Fname) {
    // TODO: Validate fname characteristics
    if (value && value.length > 32) {
      return err(new HubError('bad_request.validation_failure', 'fname value > 32'));
    }
  } else {
    return err(new HubError('bad_request.validation_failure', 'invalid user data type'));
  }

  return ok(message);
};
