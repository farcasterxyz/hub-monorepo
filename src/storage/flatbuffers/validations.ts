import { blake2b } from 'ethereum-cryptography/blake2b';
import {
  CastAddModel,
  CastRemoveModel,
  FollowAddModel,
  FollowRemoveModel,
  ReactionAddModel,
  ReactionRemoveModel,
  SignerAddModel,
  SignerRemoveModel,
  UserDataAddModel,
  VerificationAddEthAddressModel,
  VerificationEthAddressClaim,
  VerificationRemoveModel,
} from '~/storage/flatbuffers/types';
import { verifyMessageDataSignature, verifyVerificationEthAddressClaimSignature } from '~/utils/eip712';
import { ValidationError } from '~/utils/errors';
import {
  HashScheme,
  MessageType,
  ReactionType,
  SignatureScheme,
  UserDataType,
} from '~/utils/generated/message_generated';
import * as ed from '@noble/ed25519';
import MessageModel, { FID_BYTES } from '~/storage/flatbuffers/messageModel';
import {
  isCastAdd,
  isCastRemove,
  isFollowAdd,
  isFollowRemove,
  isReactionAdd,
  isReactionRemove,
  isSignerAdd,
  isSignerRemove,
  isUserDataAdd,
  isVerificationAddEthAddress,
  isVerificationRemove,
} from '~/storage/flatbuffers/typeguards';
import { hexlify } from 'ethers/lib/utils';
import { bytesCompare, getFarcasterTime } from '~/storage/flatbuffers/utils';
import { ResultAsync } from 'neverthrow';

/** Number of seconds (10 minutes) that is appropriate for clock skew */
export const ALLOWED_CLOCK_SKEW_SECONDS = 10 * 60;

/** Message types that must be signed by EIP712 signer */
export const EIP712_MESSAGE_TYPES = [MessageType.SignerAdd, MessageType.SignerRemove];

export const validateMessage = async (message: MessageModel): Promise<MessageModel> => {
  // 1. Check that the hashScheme and hash are valid
  if (message.hashScheme() === HashScheme.Blake2b) {
    const computedHash = await blake2b(message.dataBytes(), 4);
    // we have to use bytesCompare, because TypedArrays cannot be compared directly
    if (bytesCompare(message.hash(), computedHash) !== 0) {
      throw new ValidationError('invalid hash');
    }
  } else {
    throw new ValidationError('invalid hashScheme');
  }

  // 2. Check that the signatureScheme and signature are valid
  if (message.signatureScheme() === SignatureScheme.Eip712 && EIP712_MESSAGE_TYPES.includes(message.type())) {
    const verifiedSigner = verifyMessageDataSignature(message.dataBytes(), message.signature());
    if (bytesCompare(verifiedSigner, message.signer()) !== 0) {
      throw new ValidationError('invalid signature');
    }
  } else if (message.signatureScheme() === SignatureScheme.Ed25519 && !EIP712_MESSAGE_TYPES.includes(message.type())) {
    const signatureIsValid = await ResultAsync.fromPromise(
      ed.verify(message.signature(), message.dataBytes(), message.signer()),
      () => undefined
    );
    if (signatureIsValid.isErr() || (signatureIsValid.isOk() && !signatureIsValid.value)) {
      throw new ValidationError('invalid signature');
    }
  } else {
    throw new ValidationError('invalid signatureScheme');
  }

  // 3. Verify that the timestamp is not too far in the future.
  if (message.timestamp() - getFarcasterTime() > ALLOWED_CLOCK_SKEW_SECONDS) {
    throw new ValidationError('timestamp more than 10 mins in the future');
  }

  if (isCastAdd(message)) {
    return validateCastAddMessage(message) as MessageModel;
  } else if (isCastRemove(message)) {
    return validateCastRemoveMessage(message) as MessageModel;
  } else if (isReactionAdd(message) || isReactionRemove(message)) {
    return validateReactionMessage(message) as MessageModel;
  } else if (isVerificationAddEthAddress(message)) {
    return (await validateVerificationAddEthAddressMessage(message)) as MessageModel;
  } else if (isVerificationRemove(message)) {
    return validateVerificationRemoveMessage(message) as MessageModel;
  } else if (isSignerAdd(message) || isSignerRemove(message)) {
    return validateSignerMessage(message) as MessageModel;
  } else if (isFollowAdd(message) || isFollowRemove(message)) {
    return validateFollowMessage(message) as MessageModel;
  } else if (isUserDataAdd(message)) {
    return validateUserDataAddMessage(message) as MessageModel;
  } else {
    throw new ValidationError('unknown message type');
  }
};

export const validateFid = (fid?: Uint8Array | null): Uint8Array => {
  if (!fid || fid.byteLength === 0) {
    throw new ValidationError('fid is missing');
  }

  if (fid.byteLength > FID_BYTES) {
    throw new ValidationError('fid > 32 bytes');
  }

  return fid;
};

export const validateTsHash = (tsHash?: Uint8Array | null): Uint8Array => {
  if (!tsHash || tsHash.byteLength === 0) {
    throw new ValidationError('tsHash is missing');
  }

  if (tsHash.byteLength !== 8) {
    throw new ValidationError('tsHash must be 8 bytes');
  }

  return tsHash;
};

export const validateEthAddress = (address?: Uint8Array | null): Uint8Array => {
  if (!address || address.byteLength === 0) {
    throw new ValidationError('address is missing');
  }

  if (address.byteLength !== 20) {
    throw new ValidationError('address must be 20 bytes');
  }

  return address;
};

export const validateEthBlockHash = (blockHash?: Uint8Array | null): Uint8Array => {
  if (!blockHash || blockHash.byteLength === 0) {
    throw new ValidationError('block hash is missing');
  }

  if (blockHash.byteLength !== 32) {
    throw new ValidationError('block hash must be 32 bytes');
  }

  return blockHash;
};

export const validateEd25519PublicKey = (publicKey?: Uint8Array | null): Uint8Array => {
  if (!publicKey || publicKey.byteLength === 0) {
    throw new ValidationError('public key is missing');
  }

  if (publicKey.byteLength !== 32) {
    throw new ValidationError('public key must be 32 bytes');
  }

  return publicKey;
};

export const validateCastAddMessage = (message: CastAddModel): CastAddModel => {
  const text = message.body().text();
  if (!text) {
    throw new ValidationError('text is missing');
  }

  if (text.length > 320) {
    throw new ValidationError('text > 320 chars');
  }

  if (message.body().embedsLength() > 2) {
    throw new ValidationError('embeds > 2');
  }

  const parent = message.body().parent();
  if (parent) {
    validateFid(parent.fidArray());
    validateTsHash(parent.tsHashArray());
  }

  if (message.body().mentionsLength() > 5) {
    throw new ValidationError('mentions > 5');
  }

  return message;
};

export const validateCastRemoveMessage = (message: CastRemoveModel): CastRemoveModel => {
  validateTsHash(message.body().targetTsHashArray());

  return message;
};

export const validateReactionMessage = (
  message: ReactionAddModel | ReactionRemoveModel
): ReactionAddModel | ReactionRemoveModel => {
  if (!Object.values(ReactionType).includes(message.body().type())) {
    throw new ValidationError('invalid reaction type');
  }

  validateFid(message.body().cast()?.fidArray());
  validateTsHash(message.body().cast()?.tsHashArray());

  return message;
};

export const validateVerificationAddEthAddressMessage = async (
  message: VerificationAddEthAddressModel
): Promise<VerificationAddEthAddressModel> => {
  const validAddress = validateEthAddress(message.body().addressArray());
  const validBlockHash = validateEthBlockHash(message.body().blockHashArray());

  const reconstructedClaim: VerificationEthAddressClaim = {
    fid: message.fid(),
    address: hexlify(validAddress),
    network: message.network(),
    blockHash: validBlockHash,
  };

  try {
    const recoveredAddress = verifyVerificationEthAddressClaimSignature(
      reconstructedClaim,
      message.body().ethSignatureArray() ?? new Uint8Array()
    );

    if (bytesCompare(recoveredAddress, validAddress) !== 0) {
      throw new ValidationError('eth signature does not match address');
    }
  } catch (e) {
    throw new ValidationError('invalid eth signature');
  }

  return message;
};

export const validateVerificationRemoveMessage = (message: VerificationRemoveModel): VerificationRemoveModel => {
  validateEthAddress(message.body().addressArray());

  return message;
};

export const validateSignerMessage = (
  message: SignerAddModel | SignerRemoveModel
): SignerAddModel | SignerRemoveModel => {
  validateEd25519PublicKey(message.body().signerArray());

  return message;
};

export const validateFollowMessage = (
  message: FollowAddModel | FollowRemoveModel
): FollowAddModel | FollowRemoveModel => {
  validateFid(message.body().user()?.fidArray());

  return message;
};

export const validateUserDataAddMessage = (message: UserDataAddModel): UserDataAddModel => {
  const value = message.body().value();
  if (message.body().type() === UserDataType.Pfp) {
    if (value && value.length > 256) {
      throw new ValidationError('pfp value > 256');
    }
  } else if (message.body().type() === UserDataType.Display) {
    if (value && value.length > 32) {
      throw new ValidationError('display value > 32');
    }
  } else if (message.body().type() === UserDataType.Bio) {
    if (value && value.length > 256) {
      throw new ValidationError('bio value > 256');
    }
  } else if (message.body().type() === UserDataType.Location) {
    if (value && value.length > 32) {
      throw new ValidationError('location value > 32');
    }
  } else if (message.body().type() === UserDataType.Url) {
    if (value && value.length > 256) {
      throw new ValidationError('url value > 256');
    }
  } else {
    throw new ValidationError('invalid user data type');
  }

  return message;
};
