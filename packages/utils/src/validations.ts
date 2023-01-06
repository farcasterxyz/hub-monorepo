import * as flatbuffers from '@hub/flatbuffers';
import {
  bytesCompare,
  bytesToBigNumber,
  bytesToHexString,
  eip712,
  HubAsyncResult,
  HubError,
  HubResult,
  VerificationEthAddressClaim,
} from '@hub/utils';
import { err, ok, Result } from 'neverthrow';

/** Number of seconds (10 minutes) that is appropriate for clock skew */
export const ALLOWED_CLOCK_SKEW_SECONDS = 10 * 60;

/** Message types that must be signed by EIP712 signer */
export const EIP712_MESSAGE_TYPES = [flatbuffers.MessageType.SignerAdd, flatbuffers.MessageType.SignerRemove];

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

export const validateCastRemoveMessage = (message: types.CastRemoveModel): HubResult<types.CastRemoveModel> => {
  return validateTsHash(message.body().targetTsHashArray()).map(() => message);
};

export const validateReactionType = (type: number): HubResult<flatbuffers.ReactionType> => {
  if (!Object.values(flatbuffers.ReactionType).includes(type)) {
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

  return validateCastId(message.body().target(new flatbuffers.CastId())).map(() => message);
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

  const reconstructedClaim: VerificationEthAddressClaim = {
    fid: fidBigNumber.value,
    address: addressHex.value,
    network: message.network(),
    blockHash: blockHashHex.value,
  };

  const recoveredAddress = eip712.verifyVerificationEthAddressClaimSignature(
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
  if (message.body().type() === flatbuffers.UserDataType.Pfp) {
    if (value && value.length > 256) {
      return err(new HubError('bad_request.validation_failure', 'pfp value > 256'));
    }
  } else if (message.body().type() === flatbuffers.UserDataType.Display) {
    if (value && value.length > 32) {
      return err(new HubError('bad_request.validation_failure', 'display value > 32'));
    }
  } else if (message.body().type() === flatbuffers.UserDataType.Bio) {
    if (value && value.length > 256) {
      return err(new HubError('bad_request.validation_failure', 'bio value > 256'));
    }
  } else if (message.body().type() === flatbuffers.UserDataType.Location) {
    if (value && value.length > 32) {
      return err(new HubError('bad_request.validation_failure', 'location value > 32'));
    }
  } else if (message.body().type() === flatbuffers.UserDataType.Url) {
    if (value && value.length > 256) {
      return err(new HubError('bad_request.validation_failure', 'url value > 256'));
    }
  } else if (message.body().type() === flatbuffers.UserDataType.Fname) {
    // TODO: Validate fname characteristics
    if (value && value.length > 32) {
      return err(new HubError('bad_request.validation_failure', 'fname value > 32'));
    }
  } else {
    return err(new HubError('bad_request.validation_failure', 'invalid user data type'));
  }

  return ok(message);
};
