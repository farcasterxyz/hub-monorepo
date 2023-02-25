import * as protobufs from '@farcaster/protobufs';
import {
  bytesToHexString,
  hexStringToBytes,
  HubAsyncResult,
  HubResult,
  MessageSigner,
  Signer,
  toFarcasterTime,
  validations,
} from '@farcaster/utils';
import { blake3 } from '@noble/hashes/blake3';
import { err } from 'neverthrow';
import * as types from './types';
import * as utils from './utils';

/** Internal Types  */

type MessageDataOptions = {
  fid: number;
  network: protobufs.FarcasterNetwork;
  timestamp?: number;
};

type MessageSignerOptions = {
  scheme: types.SignatureScheme;
  signerKeyHex: string;
};

type MessageBody =
  | protobufs.CastAddBody
  | protobufs.CastRemoveBody
  | protobufs.ReactionBody
  | protobufs.VerificationAddEthAddressBody
  | protobufs.VerificationRemoveBody
  | protobufs.SignerBody
  | protobufs.UserDataBody;

type MessageBodyOptions = {
  castAddBody?: protobufs.CastAddBody | undefined;
  castRemoveBody?: protobufs.CastRemoveBody | undefined;
  reactionBody?: protobufs.ReactionBody | undefined;
  verificationAddEthAddressBody?: protobufs.VerificationAddEthAddressBody | undefined;
  verificationRemoveBody?: protobufs.VerificationRemoveBody | undefined;
  signerBody?: protobufs.SignerBody | undefined;
  userDataBody?: protobufs.UserDataBody | undefined;
};

/** Internal Methods */

const buildMakeMessageMethod = <
  TMessageType extends protobufs.MessageType,
  TMessageBody extends MessageBody,
  TBodyJson extends types.MessageBody
>(
  messageType: TMessageType,
  messageBodyKey: keyof MessageBodyOptions,
  serializeBody: (bodyJson: TBodyJson) => HubResult<TMessageBody>
) => {
  return async (
    bodyJson: TBodyJson,
    dataOptions: MessageDataOptions,
    signer: MessageSigner<TMessageType>
  ): HubAsyncResult<types.Message<types.MessageData<TBodyJson, TMessageType>>> => {
    const body = serializeBody(bodyJson);
    if (body.isErr()) {
      return err(body.error);
    }

    const messageData = makeMessageData({ [messageBodyKey]: body.value }, messageType, dataOptions);

    if (messageData.isErr()) {
      return err(messageData.error);
    }

    return makeMessage(messageData.value, signer);
  };
};

const buildMakeMessageDataMethod = <
  TMessageType extends protobufs.MessageType,
  TMessageBody extends MessageBody,
  TBodyJson extends types.MessageBody
>(
  messageType: TMessageType,
  messageBodyKey: keyof MessageBodyOptions,
  serializeBody: (bodyJson: TBodyJson) => HubResult<TMessageBody>
) => {
  return (
    bodyJson: TBodyJson,
    dataOptions: MessageDataOptions
  ): HubResult<types.MessageData<TBodyJson, TMessageType>> => {
    const body = serializeBody(bodyJson);
    if (body.isErr()) {
      return err(body.error);
    }

    const messageData = makeMessageData({ [messageBodyKey]: body.value }, messageType, dataOptions);

    return messageData.andThen(
      (data) => utils.deserializeMessageData(data) as HubResult<types.MessageData<TBodyJson, TMessageType>>
    );
  };
};

const makeMessageData = (
  bodyOptions: MessageBodyOptions,
  messageType: protobufs.MessageType,
  dataOptions: MessageDataOptions
): HubResult<protobufs.MessageData> => {
  const timestamp = toFarcasterTime(dataOptions.timestamp || Date.now());
  if (timestamp.isErr()) {
    return err(timestamp.error);
  }

  const data = protobufs.MessageData.create({
    ...bodyOptions,
    type: messageType,
    timestamp: timestamp.value,
    fid: dataOptions.fid,
    network: dataOptions.network,
  });

  return validations.validateMessageData(data);
};

const makeMessage = async <TMessageData extends types.MessageData>(
  messageData: protobufs.MessageData,
  signer: Signer
): HubAsyncResult<types.Message<TMessageData>> => {
  const dataBytes = protobufs.MessageData.encode(messageData).finish();

  const hash = blake3(dataBytes, { dkLen: 20 });

  const signature = await signer.signMessageHash(hash);
  if (signature.isErr()) {
    return err(signature.error);
  }

  const message = protobufs.Message.create({
    data: messageData,
    hash,
    hashScheme: protobufs.HashScheme.HASH_SCHEME_BLAKE3,
    signature: signature.value,
    signatureScheme: signer.scheme,
    signer: signer.signerKey,
  });

  return utils.deserializeMessage(message) as HubResult<types.Message<TMessageData>>;
};

/** Generic Methods */

/**
 * TODO DOCS: description
 *
 * TODO DOCS: usage example, here's the structure:
 * @example
 * ```typescript
 * import { ... } from '@farcaster/js';
 *
 * const client = new Client(...)
 *
 * const message = makeCastAdd(...)
 * await client.submitMessage(message)
 * ```
 *
 * @param ...
 *
 * @returns ...
 */
export const makeMessageHash = async (messageData: types.MessageData): HubAsyncResult<string> => {
  const dataBytes = protobufs.MessageData.encode(messageData._protobuf).finish();
  const hashBytes = blake3(dataBytes, { dkLen: 20 });
  return bytesToHexString(hashBytes);
};

/**
 * TODO DOCS: description
 *
 * TODO DOCS: usage example, here's the structure:
 * @example
 * ```typescript
 * import { ... } from '@farcaster/js';
 *
 * const client = new Client(...)
 *
 * const message = makeCastAdd(...)
 * await client.submitMessage(message)
 * ```
 *
 * @param ...
 *
 * @returns ...
 */
export const makeMessageWithSignature = async (
  messageData: types.MessageData,
  signerOptions: MessageSignerOptions,
  signature: string
): HubAsyncResult<types.Message> => {
  const dataBytes = protobufs.MessageData.encode(messageData._protobuf).finish();

  const hash = blake3(dataBytes, { dkLen: 20 });

  const signatureBytes = hexStringToBytes(signature);
  if (signatureBytes.isErr()) {
    return err(signatureBytes.error);
  }

  const signerKey = hexStringToBytes(signerOptions.signerKeyHex);
  if (signerKey.isErr()) {
    return err(signerKey.error);
  }

  const message = protobufs.Message.create({
    data: messageData._protobuf,
    hash,
    hashScheme: protobufs.HashScheme.HASH_SCHEME_BLAKE3,
    signature: signatureBytes.value,
    signatureScheme: signerOptions.scheme,
    signer: signerKey.value,
  });

  return (await validations.validateMessage(message)).andThen((validMessage) => utils.deserializeMessage(validMessage));
};

/** Cast Methods */

/**
 * Make a message to add a cast
 *
 * @example
 * ```typescript
 * import {
 *   Client,
 *   Ed25519Signer,
 *   makeCastAdd,
 *   makeCastRemove,
 *   types,
 * } from '@farcaster/js';
 * import * as ed from '@noble/ed25519';
 *
 * const rpcUrl = '<rpc-url>';
 * const client = new Client(rpcUrl);
 *
 * const privateKeyHex = '86be7f6f8dcf18...'; // EdDSA hex private key
 * const privateKey = ed.utils.hexToBytes(privateKeyHex);
 *
 * // _unsafeUnwrap() is used here for simplicity, but should be avoided in production
 * const ed25519Signer = Ed25519Signer.fromPrivateKey(privateKey)._unsafeUnwrap();
 *
 * const dataOptions = {
 *   fid: -9999, // must be changed to fid of the custody address, or else it will fail
 *   network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
 * };
 *
 * const cast = await makeCastAdd({ text: 'hello world' }, dataOptions, ed25519Signer);
 * await client.submitMessage(cast._unsafeUnwrap());
 * ```
 *
 * @param ...
 *
 * @returns ...
 */
export const makeCastAdd = buildMakeMessageMethod(
  protobufs.MessageType.MESSAGE_TYPE_CAST_ADD,
  'castAddBody',
  utils.serializeCastAddBody
);

/**
 * TODO DOCS: description
 *
 * TODO DOCS: usage example, here's the structure:
 * @example
 * ```typescript
 * import { ... } from '@farcaster/js';
 *
 * const client = new Client(...)
 *
 * const message = makeCastAdd(...)
 * await client.submitMessage(message)
 * ```
 *
 * @param ...
 *
 * @returns ...
 */
export const makeCastRemove = buildMakeMessageMethod(
  protobufs.MessageType.MESSAGE_TYPE_CAST_REMOVE,
  'castRemoveBody',
  utils.serializeCastRemoveBody
);

/** @ignore */
export const makeCastAddData = buildMakeMessageDataMethod(
  protobufs.MessageType.MESSAGE_TYPE_CAST_ADD,
  'castAddBody',
  utils.serializeCastAddBody
);

/** @ignore */
export const makeCastRemoveData = buildMakeMessageDataMethod(
  protobufs.MessageType.MESSAGE_TYPE_CAST_REMOVE,
  'castRemoveBody',
  utils.serializeCastRemoveBody
);

/** Amp Methods */

/**
 * TODO DOCS: description
 *
 * TODO DOCS: usage example, here's the structure:
 * @example
 * ```typescript
 * import { ... } from '@farcaster/js';
 *
 * const client = new Client(...)
 *
 * const message = makeCastAdd(...)
 * await client.submitMessage(message)
 * ```
 *
 * @param ...
 *
 * @returns ...
 */
export const makeReactionAdd = buildMakeMessageMethod(
  protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD,
  'reactionBody',
  utils.serializeReactionBody
);

/**
 * TODO DOCS: description
 *
 * TODO DOCS: usage example, here's the structure:
 * @example
 * ```typescript
 * import { ... } from '@farcaster/js';
 *
 * const client = new Client(...)
 *
 * const message = makeCastAdd(...)
 * await client.submitMessage(message)
 * ```
 *
 * @param ...
 *
 * @returns ...
 */
export const makeReactionRemove = buildMakeMessageMethod(
  protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE,
  'reactionBody',
  utils.serializeReactionBody
);

/** @ignore */
export const makeReactionAddData = buildMakeMessageDataMethod(
  protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD,
  'reactionBody',
  utils.serializeReactionBody
);

/** @ignore */
export const makeReactionRemoveData = buildMakeMessageDataMethod(
  protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE,
  'reactionBody',
  utils.serializeReactionBody
);

/** Verification Methods */

/**
 * TODO DOCS: description
 *
 * TODO DOCS: usage example, here's the structure:
 * @example
 * ```typescript
 * import { ... } from '@farcaster/js';
 *
 * const client = new Client(...)
 *
 * const message = makeCastAdd(...)
 * await client.submitMessage(message)
 * ```
 *
 * @param ...
 *
 * @returns ...
 */
export const makeVerificationAddEthAddress = buildMakeMessageMethod(
  protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS,
  'verificationAddEthAddressBody',
  utils.serializeVerificationAddEthAddressBody
);

/**
 * TODO DOCS: description
 *
 * TODO DOCS: usage example, here's the structure:
 * @example
 * ```typescript
 * import { ... } from '@farcaster/js';
 *
 * const client = new Client(...)
 *
 * const message = makeCastAdd(...)
 * await client.submitMessage(message)
 * ```
 *
 * @param ...
 *
 * @returns ...
 */
export const makeVerificationRemove = buildMakeMessageMethod(
  protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE,
  'verificationRemoveBody',
  utils.serializeVerificationRemoveBody
);

/** @ignore */
export const makeVerificationAddEthAddressData = buildMakeMessageDataMethod(
  protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS,
  'verificationAddEthAddressBody',
  utils.serializeVerificationAddEthAddressBody
);

/** @ignore */
export const makeVerificationRemoveData = buildMakeMessageDataMethod(
  protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE,
  'verificationRemoveBody',
  utils.serializeVerificationRemoveBody
);

/** Signer Methods */

/**
 * TODO DOCS: description
 *
 * TODO DOCS: usage example, here's the structure:
 * @example
 * ```typescript
 * import { ... } from '@farcaster/js';
 *
 * const client = new Client(...)
 *
 * const message = makeCastAdd(...)
 * await client.submitMessage(message)
 * ```
 *
 * @param ...
 *
 * @returns ...
 */
export const makeSignerAdd = buildMakeMessageMethod(
  protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD,
  'signerBody',
  utils.serializeSignerBody
);

/**
 * TODO DOCS: description
 *
 * TODO DOCS: usage example, here's the structure:
 * @example
 * ```typescript
 * import { ... } from '@farcaster/js';
 *
 * const client = new Client(...)
 *
 * const message = makeCastAdd(...)
 * await client.submitMessage(message)
 * ```
 *
 * @param ...
 *
 * @returns ...
 */
export const makeSignerRemove = buildMakeMessageMethod(
  protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE,
  'signerBody',
  utils.serializeSignerBody
);

/** @ignore */
export const makeSignerAddData = buildMakeMessageDataMethod(
  protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD,
  'signerBody',
  utils.serializeSignerBody
);

/** @ignore */
export const makeSignerRemoveData = buildMakeMessageDataMethod(
  protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE,
  'signerBody',
  utils.serializeSignerBody
);

/** User Data Methods */

/**
 * TODO DOCS: description
 *
 * TODO DOCS: usage example, here's the structure:
 * @example
 * ```typescript
 * import { ... } from '@farcaster/js';
 *
 * const client = new Client(...)
 *
 * const message = makeCastAdd(...)
 * await client.submitMessage(message)
 * ```
 *
 * @param ...
 *
 * @returns ...
 */
export const makeUserDataAdd = buildMakeMessageMethod(
  protobufs.MessageType.MESSAGE_TYPE_USER_DATA_ADD,
  'userDataBody',
  utils.serializeUserDataBody
);

/** @ignore */
export const makeUserDataAddData = buildMakeMessageDataMethod(
  protobufs.MessageType.MESSAGE_TYPE_USER_DATA_ADD,
  'userDataBody',
  utils.serializeUserDataBody
);
