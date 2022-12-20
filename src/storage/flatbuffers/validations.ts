import * as ed from '@noble/ed25519';
import { blake3 } from '@noble/hashes/blake3';
import { hexlify } from 'ethers/lib/utils';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import MessageModel, { FID_BYTES } from '~/storage/flatbuffers/messageModel';
import {
  isCastAdd,
  isCastRemove,
  isAmpAdd,
  isAmpRemove,
  isReactionAdd,
  isReactionRemove,
  isSignerAdd,
  isSignerRemove,
  isUserDataAdd,
  isVerificationAddEthAddress,
  isVerificationRemove,
} from '~/storage/flatbuffers/typeguards';
import {
  CastAddModel,
  CastRemoveModel,
  AmpAddModel,
  AmpRemoveModel,
  ReactionAddModel,
  ReactionRemoveModel,
  SignerAddModel,
  SignerRemoveModel,
  UserDataAddModel,
  VerificationAddEthAddressModel,
  VerificationEthAddressClaim,
  VerificationRemoveModel,
} from '~/storage/flatbuffers/types';
import { bytesCompare, getFarcasterTime } from '~/storage/flatbuffers/utils';
import { verifyMessageHashSignature, verifyVerificationEthAddressClaimSignature } from '~/utils/eip712';
import {
  CastId,
  HashScheme,
  MessageType,
  ReactionType,
  SignatureScheme,
  UserDataType,
  UserId,
} from '~/utils/generated/message_generated';
import { HubAsyncResult, HubError, HubResult } from '~/utils/hubErrors';

/** Number of seconds (10 minutes) that is appropriate for clock skew */
export const ALLOWED_CLOCK_SKEW_SECONDS = 10 * 60;

/** Message types that must be signed by EIP712 signer */
export const EIP712_MESSAGE_TYPES = [MessageType.SignerAdd, MessageType.SignerRemove];

export const validateMessage = async (message: MessageModel): HubAsyncResult<MessageModel> => {
  // 1. Check that the hashScheme and hash are valid
  if (message.hashScheme() === HashScheme.Blake3) {
    const computedHash = blake3(message.dataBytes(), { dkLen: 16 });
    // we have to use bytesCompare, because TypedArrays cannot be compared directly
    if (bytesCompare(message.hash(), computedHash) !== 0) {
      return err(new HubError('bad_request.validation_failure', 'invalid hash'));
    }
  } else {
    return err(new HubError('bad_request.validation_failure', 'invalid hashScheme'));
  }

  // 2. Check that the signatureScheme and signature are valid
  if (message.signatureScheme() === SignatureScheme.Eip712 && EIP712_MESSAGE_TYPES.includes(message.type())) {
    const verifiedSigner = verifyMessageHashSignature(message.hash(), message.signature());
    if (bytesCompare(verifiedSigner, message.signer()) !== 0) {
      return err(new HubError('bad_request.validation_failure', 'signature does not match signer'));
    }
  } else if (message.signatureScheme() === SignatureScheme.Ed25519 && !EIP712_MESSAGE_TYPES.includes(message.type())) {
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

  if (isCastAdd(message)) {
    return validateCastAddMessage(message);
  } else if (isCastRemove(message)) {
    return validateCastRemoveMessage(message);
  } else if (isReactionAdd(message) || isReactionRemove(message)) {
    return validateReactionMessage(message);
  } else if (isVerificationAddEthAddress(message)) {
    return await validateVerificationAddEthAddressMessage(message);
  } else if (isVerificationRemove(message)) {
    return validateVerificationRemoveMessage(message);
  } else if (isSignerAdd(message) || isSignerRemove(message)) {
    return validateSignerMessage(message);
  } else if (isAmpAdd(message) || isAmpRemove(message)) {
    return validateAmpMessage(message);
  } else if (isUserDataAdd(message)) {
    return validateUserDataAddMessage(message);
  } else {
    return err(new HubError('bad_request.validation_failure', 'unknown message type'));
  }
};

export interface ValidatedCastId extends CastId {
  fidArray(): Uint8Array;
  tsHashArray(): Uint8Array;
}

export const validateCastId = (castId?: CastId | null): HubResult<ValidatedCastId> => {
  if (!castId) {
    return err(new HubError('bad_request.validation_failure', 'castId is missing'));
  }
  return Result.combineWithAllErrors([validateFid(castId.fidArray()), validateTsHash(castId.tsHashArray())])
    .map(() => castId as ValidatedCastId)
    .mapErr(
      (errs: HubError[]) => new HubError('bad_request.validation_failure', errs.map((e) => e.message).join(', '))
    );
};

export interface ValidatedUserId extends UserId {
  fidArray(): Uint8Array;
}

export const validateUserId = (userId?: UserId | null): HubResult<ValidatedUserId> => {
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

export const validateCastAddMessage = (message: CastAddModel): HubResult<CastAddModel> => {
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

  const parent = message.body().parent();
  if (parent) {
    return validateCastId(parent).map(() => message);
  }

  return ok(message);
};

export const validateCastRemoveMessage = (message: CastRemoveModel): HubResult<CastRemoveModel> => {
  return validateTsHash(message.body().targetTsHashArray()).map(() => message);
};

export const validateReactionType = (type: number): HubResult<ReactionType> => {
  if (!Object.values(ReactionType).includes(type)) {
    return err(new HubError('bad_request.validation_failure', 'invalid reaction type'));
  }

  return ok(type);
};

export const validateReactionMessage = (
  message: ReactionAddModel | ReactionRemoveModel
): HubResult<ReactionAddModel | ReactionRemoveModel> => {
  const validatedType = validateReactionType(message.body().type());
  if (validatedType.isErr()) {
    return err(validatedType.error);
  }

  return validateCastId(message.body().cast()).map(() => message);
};

export const validateVerificationAddEthAddressMessage = async (
  message: VerificationAddEthAddressModel
): HubAsyncResult<VerificationAddEthAddressModel> => {
  const validAddress = validateEthAddress(message.body().addressArray());
  if (validAddress.isErr()) {
    return err(validAddress.error);
  }

  const validBlockHash = validateEthBlockHash(message.body().blockHashArray());
  if (validBlockHash.isErr()) {
    return err(validBlockHash.error);
  }

  const reconstructedClaim: VerificationEthAddressClaim = {
    fid: message.fid(),
    address: hexlify(validAddress.value),
    network: message.network(),
    blockHash: validBlockHash.value,
  };

  const recoveredAddress = Result.fromThrowable(verifyVerificationEthAddressClaimSignature)(
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
  message: VerificationRemoveModel
): HubResult<VerificationRemoveModel> => {
  return validateEthAddress(message.body().addressArray()).map(() => message);
};

export const validateSignerMessage = (
  message: SignerAddModel | SignerRemoveModel
): HubResult<SignerAddModel | SignerRemoveModel> => {
  return validateEd25519PublicKey(message.body().signerArray()).map(() => message);
};

export const validateAmpMessage = (message: AmpAddModel | AmpRemoveModel): HubResult<AmpAddModel | AmpRemoveModel> => {
  return validateFid(message.body().user()?.fidArray()).map(() => message);
};

export const validateUserDataAddMessage = (message: UserDataAddModel): HubResult<UserDataAddModel> => {
  const value = message.body().value();
  if (message.body().type() === UserDataType.Pfp) {
    if (value && value.length > 256) {
      return err(new HubError('bad_request.validation_failure', 'pfp value > 256'));
    }
  } else if (message.body().type() === UserDataType.Display) {
    if (value && value.length > 32) {
      return err(new HubError('bad_request.validation_failure', 'display value > 32'));
    }
  } else if (message.body().type() === UserDataType.Bio) {
    if (value && value.length > 256) {
      return err(new HubError('bad_request.validation_failure', 'bio value > 256'));
    }
  } else if (message.body().type() === UserDataType.Location) {
    if (value && value.length > 32) {
      return err(new HubError('bad_request.validation_failure', 'location value > 32'));
    }
  } else if (message.body().type() === UserDataType.Url) {
    if (value && value.length > 256) {
      return err(new HubError('bad_request.validation_failure', 'url value > 256'));
    }
  } else if (message.body().type() === UserDataType.Fname) {
    // TODO: Validate fname characteristics
    if (value && value.length > 32) {
      return err(new HubError('bad_request.validation_failure', 'fname value > 32'));
    }
  } else {
    return err(new HubError('bad_request.validation_failure', 'invalid user data type'));
  }

  return ok(message);
};
