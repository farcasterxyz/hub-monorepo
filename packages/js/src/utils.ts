import * as protobufs from '@farcaster/protobufs';
import {
  bytesToHexString,
  bytesToUtf8String,
  fromFarcasterTime,
  hexStringToBytes,
  HubError,
  HubResult,
  utf8StringToBytes,
  validations,
} from '@farcaster/utils';
import { err, ok, Result } from 'neverthrow';
import * as types from './types';

/* -------------------------------------------------------------------------- */
/*                           Event Response                                   */
/* -------------------------------------------------------------------------- */

// export const deserializeEventResponse = (protobuf: protobufs.EventResponse): HubResult<types.EventResponse> => {
//   const type = protobuf.type();

//   switch (type) {
//     case protobufs.EventType.MergeMessage:
//     case protobufs.EventType.PruneMessage:
//     case protobufs.EventType.RevokeMessage: {
//       return deserializeMessage(
//         protobufs.Message.getRootAsMessage(new ByteBuffer(protobuf.bytesArray() ?? new Uint8Array()))
//       ).map((message) => {
//         return {
//           flatbuffer: protobuf,
//           type,
//           message,
//         };
//       });
//     }
//     case protobufs.EventType.MergeIdRegistryEvent: {
//       return deserializeIdRegistryEvent(
//         protobufs.IdRegistryEvent.getRootAsIdRegistryEvent(new ByteBuffer(protobuf.bytesArray() ?? new Uint8Array()))
//       ).map((idRegistryEvent) => {
//         return {
//           flatbuffer: protobuf,
//           type,
//           idRegistryEvent,
//         };
//       });
//     }
//     case protobufs.EventType.MergeNameRegistryEvent: {
//       return deserializeNameRegistryEvent(
//         protobufs.NameRegistryEvent.getRootAsNameRegistryEvent(new ByteBuffer(protobuf.bytesArray() ?? new Uint8Array()))
//       ).map((nameRegistryEvent) => {
//         return {
//           flatbuffer: protobuf,
//           type,
//           nameRegistryEvent,
//         };
//       });
//     }
//     default:
//       return err(new HubError('bad_request.invalid_param', `unknown EventType '${type}'`));
//   }
// };

/* -------------------------------------------------------------------------- */
/*                             Registry Events                                */
/* -------------------------------------------------------------------------- */

export const deserializeNameRegistryEvent = (
  protobuf: protobufs.NameRegistryEvent
): HubResult<types.NameRegistryEvent> => {
  const deserialized = Result.combine([
    deserializeBlockHash(protobuf.blockHash),
    deserializeTransactionHash(protobuf.transactionHash),
    deserializeEthAddress(protobuf.to),
    deserializeEthAddress(protobuf.from),
    deserializeFname(protobuf.fname),
  ]);

  if (deserialized.isErr()) {
    return err(deserialized.error);
  }

  const [blockHash, transactionHash, to, from, fname] = deserialized.value;
  const expiry = fromFarcasterTime(protobuf.expiry);
  const { blockNumber, logIndex, type } = protobuf;

  return ok({
    _protobuf: protobuf,
    blockHash,
    blockNumber,
    fname,
    transactionHash,
    logIndex,
    to,
    type,
    from,
    expiry,
  });
};

export const deserializeIdRegistryEvent = (protobuf: protobufs.IdRegistryEvent): HubResult<types.IdRegistryEvent> => {
  const deserialized = Result.combine([
    deserializeBlockHash(protobuf.blockHash),
    deserializeTransactionHash(protobuf.transactionHash),
    deserializeEthAddress(protobuf.to),
    deserializeEthAddress(protobuf.from),
  ]);

  if (deserialized.isErr()) {
    return err(deserialized.error);
  }

  const [blockHash, transactionHash, to, from] = deserialized.value;
  const { blockNumber, fid, logIndex, type } = protobuf;

  return ok({
    _protobuf: protobuf,
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

export const deserializeMessage = (protobuf: protobufs.Message): HubResult<types.Message> => {
  if (!protobuf.data) {
    return err(new HubError('bad_request.invalid_param', 'message data is missing'));
  }
  const isEip712Signer = validations.EIP712_MESSAGE_TYPES.includes(protobuf.data.type);
  const deserialized = Result.combine([
    deserializeMessageData(protobuf.data),
    deserializeMessageHash(protobuf.hash),
    isEip712Signer ? deserializeEip712Signature(protobuf.signature) : deserializeEd25519Signature(protobuf.signature),
    isEip712Signer ? deserializeEthAddress(protobuf.signer) : deserializeEd25519PublicKey(protobuf.signer),
  ]);
  if (deserialized.isErr()) {
    return err(deserialized.error);
  }

  const [data, hash, signature, signer] = deserialized.value;

  return ok({
    _protobuf: protobuf,
    data,
    hash,
    hashScheme: protobuf.hashScheme,
    signature,
    signatureScheme: protobuf.signatureScheme,
    signer,
  });
};

export const deserializeMessageData = (protobuf: protobufs.MessageData): HubResult<types.MessageData> => {
  const timestamp = fromFarcasterTime(protobuf.timestamp);

  if (!Object.values(protobufs.MessageType).includes(protobuf.type)) {
    return err(new HubError('bad_request.invalid_param', 'type is invalid'));
  }

  let bodyResult: HubResult<types.MessageBody>;
  if (protobuf.castAddBody) {
    bodyResult = deserializeCastAddBody(protobuf.castAddBody);
  } else if (protobuf.castRemoveBody) {
    bodyResult = deserializeCastRemoveBody(protobuf.castRemoveBody);
  } else if (protobuf.ampBody) {
    bodyResult = deserializeAmpBody(protobuf.ampBody);
  } else if (protobuf.reactionBody) {
    bodyResult = deserializeReactionBody(protobuf.reactionBody);
  } else if (protobuf.signerBody) {
    bodyResult = deserializeSignerBody(protobuf.signerBody);
  } else if (protobuf.userDataBody) {
    bodyResult = deserializeUserDataBody(protobuf.userDataBody);
  } else if (protobuf.verificationAddEthAddressBody) {
    bodyResult = deserializeVerificationAddEthAddressBody(protobuf.verificationAddEthAddressBody);
  } else if (protobuf.verificationRemoveBody) {
    bodyResult = deserializeVerificationRemoveBody(protobuf.verificationRemoveBody);
  } else {
    return err(new HubError('bad_request.invalid_param', 'body is invalid'));
  }

  if (bodyResult.isErr()) {
    return err(bodyResult.error);
  }

  return ok({
    _protobuf: protobuf,
    body: bodyResult.value,
    type: protobuf.type,
    timestamp,
    fid: protobuf.fid,
    network: protobuf.network,
  });
};

/* -------------------------------------------------------------------------- */
/*                               Message Body                                 */
/* -------------------------------------------------------------------------- */

export const deserializeCastAddBody = (protobuf: protobufs.CastAddBody): HubResult<types.CastAddBody> => {
  const parent = protobuf.parentCastId !== undefined ? deserializeCastId(protobuf.parentCastId) : ok(undefined);
  if (parent.isErr()) {
    return err(parent.error);
  }

  return ok({
    text: protobuf.text,
    embeds: protobuf.embeds,
    mentions: protobuf.mentions,
    parent: parent.value,
  });
};

export const serializeCastAddBody = (body: types.CastAddBody): HubResult<protobufs.CastAddBody> => {
  const parent = body.parent !== undefined ? serializeCastId(body.parent) : ok(undefined);
  if (parent.isErr()) {
    return err(parent.error);
  }

  return ok(
    protobufs.CastAddBody.create({
      embeds: body.embeds ?? [],
      mentions: body.mentions ?? [],
      parentCastId: parent.value,
      text: body.text,
    })
  );
};

export const deserializeCastRemoveBody = (protobuf: protobufs.CastRemoveBody): HubResult<types.CastRemoveBody> => {
  const targetHash = deserializeMessageHash(protobuf.targetHash);
  if (targetHash.isErr()) {
    return err(targetHash.error);
  }

  return ok({ targetHash: targetHash.value });
};

export const serializeCastRemoveBody = (body: types.CastRemoveBody): HubResult<protobufs.CastRemoveBody> => {
  const targetHash = serializeMessageHash(body.targetHash);
  if (targetHash.isErr()) {
    return err(targetHash.error);
  }

  return ok(protobufs.CastRemoveBody.create({ targetHash: targetHash.value }));
};

export const deserializeVerificationAddEthAddressBody = (
  protobuf: protobufs.VerificationAddEthAddressBody
): HubResult<types.VerificationAddEthAddressBody> => {
  const jsonValues = Result.combine([
    deserializeEthAddress(protobuf.address),
    deserializeEip712Signature(protobuf.ethSignature),
    deserializeBlockHash(protobuf.blockHash),
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

export const deserializeAmpBody = (protobuf: protobufs.AmpBody): HubResult<types.AmpBody> => {
  return ok({ targetFid: protobuf.targetFid });
};

export const serializeAmpBody = (body: types.AmpBody): HubResult<protobufs.AmpBody> => {
  return validations.validateAmpBody({ targetFid: body.targetFid });
};

export const deserializeSignerBody = (protobuf: protobufs.SignerBody): HubResult<types.SignerBody> => {
  const signerJson = deserializeEd25519PublicKey(protobuf.signer);
  if (signerJson.isErr()) {
    return err(signerJson.error);
  }

  return ok({
    signer: signerJson.value,
  });
};

export const serializeSignerBody = (body: types.SignerBody): HubResult<protobufs.SignerBody> => {
  const signer = serializeEd25519PublicKey(body.signer);
  if (signer.isErr()) {
    return err(signer.error);
  }

  return ok(protobufs.SignerBody.create({ signer: signer.value }));
};

export const serializeVerificationAddEthAddressBody = (
  body: types.VerificationAddEthAddressBody
): HubResult<protobufs.VerificationAddEthAddressBody> => {
  return Result.combine([
    serializeEthAddress(body.address),
    serializeEip712Signature(body.ethSignature),
    serializeBlockHash(body.blockHash),
  ]).map((values) => {
    const [address, ethSignature, blockHash] = values;

    return protobufs.VerificationAddEthAddressBody.create({
      address,
      ethSignature,
      blockHash,
    });
  });
};

export const deserializeVerificationRemoveBody = (
  protobuf: protobufs.VerificationRemoveBody
): HubResult<types.VerificationRemoveBody> => {
  return deserializeEthAddress(protobuf.address).map((address) => {
    return {
      address,
    };
  });
};

export const serializeVerificationRemoveBody = (
  body: types.VerificationRemoveBody
): HubResult<protobufs.VerificationRemoveBody> => {
  return serializeEthAddress(body.address).map((address) => {
    return protobufs.VerificationRemoveBody.create({ address });
  });
};

export const deserializeUserDataBody = (protobuf: protobufs.UserDataBody): HubResult<types.UserDataBody> => {
  return ok({
    type: protobuf.type,
    value: protobuf.value,
  });
};

export const serializeUserDataBody = (body: types.UserDataBody): HubResult<protobufs.UserDataBody> => {
  return ok(protobufs.UserDataBody.create(body));
};

export const deserializeReactionBody = (protobuf: protobufs.ReactionBody): HubResult<types.ReactionBody> => {
  const targetJson = protobuf.targetCastId
    ? deserializeCastId(protobuf.targetCastId)
    : err(new HubError('bad_request.invalid_param', 'target is missing'));
  if (targetJson.isErr()) {
    return err(targetJson.error);
  }

  return ok({
    target: targetJson.value,
    type: protobuf.type,
  });
};

export const serializeReactionBody = (body: types.ReactionBody): HubResult<protobufs.ReactionBody> => {
  return serializeCastId(body.target)
    .map((targetCastId) => {
      return protobufs.ReactionBody.create({ targetCastId, type: body.type });
    })
    .andThen((body) => validations.validateReactionBody(body));
};

export const deserializeCastId = (protobuf: protobufs.CastId): HubResult<types.CastId> => {
  const hash = deserializeMessageHash(protobuf.hash);
  if (hash.isErr()) {
    return err(hash.error);
  }

  return ok({
    fid: protobuf.fid,
    hash: hash.value,
  });
};

export const serializeCastId = (castId: types.CastId): HubResult<protobufs.CastId> => {
  const hash = hexStringToBytes(castId.hash);
  if (hash.isErr()) {
    return err(hash.error);
  }

  return ok(protobufs.CastId.create({ fid: castId.fid, hash: hash.value }));
};

/* -------------------------------------------------------------------------- */
/* .                               Scalars                                    */
/* -------------------------------------------------------------------------- */

/**
 * Deserialize a block hash from a byte array to hex string.
 */
export const deserializeBlockHash = (bytes: Uint8Array): HubResult<string> => {
  return bytesToHexString(bytes);
};

/**
 * Serializes a block hash from a hex string to byte array.
 */
export const serializeBlockHash = (hash: string): HubResult<Uint8Array> => {
  return validations.validateBlockHashHex(hash).andThen(hexStringToBytes);
};

/**
 * Deserialize a transaction hash from a byte array to hex string.
 */
export const deserializeTransactionHash = (bytes: Uint8Array): HubResult<string> => {
  return bytesToHexString(bytes);
};

/**
 * Deserialize an EIP-712 signature from a byte array to hex string.
 */
export const deserializeEip712Signature = (bytes: Uint8Array): HubResult<string> => {
  return bytesToHexString(bytes);
};

/**
 * Serializes an EIP-712 from a hex string to byte array.
 */
export const serializeEip712Signature = (hash: string): HubResult<Uint8Array> => {
  return validations.validateEip712SignatureHex(hash).andThen(hexStringToBytes);
};

/**
 * Deserialize an Ed25519 signature from a byte array to hex string.
 */
export const deserializeEd25519Signature = (bytes: Uint8Array): HubResult<string> => {
  return bytesToHexString(bytes).andThen(validations.validateEd25519ignatureHex);
};

/**
 * Deserialize a message hash from a byte array to hex string.
 */
export const deserializeMessageHash = (bytes: Uint8Array): HubResult<string> => {
  return bytesToHexString(bytes);
};

export const serializeMessageHash = (hash: string): HubResult<Uint8Array> => {
  return hexStringToBytes(hash);
};

export const deserializeFname = (fname: Uint8Array): HubResult<string> => {
  return bytesToUtf8String(fname).andThen(validations.validateFname);
};

export const serializeFname = (fname: string): HubResult<Uint8Array> => {
  return validations.validateFname(fname).andThen(utf8StringToBytes);
};

export const deserializeEthAddress = (ethAddress: Uint8Array): HubResult<string> => {
  return validations.validateEthAddress(ethAddress).andThen((ethAddress) => bytesToHexString(ethAddress));
};

export const serializeEthAddress = (ethAddress: string): HubResult<Uint8Array> => {
  return validations
    .validateEthAddressHex(ethAddress)
    .andThen(hexStringToBytes)
    .andThen(validations.validateEthAddress);
};

export const deserializeEd25519PublicKey = (publicKey: Uint8Array): HubResult<string> => {
  return validations.validateEd25519PublicKey(publicKey).andThen((publicKey) => bytesToHexString(publicKey));
};

export const serializeEd25519PublicKey = (publicKey: string): HubResult<Uint8Array> => {
  return validations
    .validateEd25519PublicKeyHex(publicKey)
    .andThen(hexStringToBytes)
    .andThen(validations.validateEd25519PublicKey);
};
