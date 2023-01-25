import * as protobufs from '@farcaster/protobufs';
import { HubError, HubResult } from '@farcaster/protoutils';
import { err, ok } from 'neverthrow';
import AbstractRocksDB from 'rocksdb';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import {
  FID_BYTES,
  RootPrefix,
  TRUE_VALUE,
  UserMessagePostfix,
  UserMessagePostfixMax,
  UserPostfix,
} from '~/storage/db/types';

/** <user prefix byte, fid> */
export const makeUserKey = (fid: number): Buffer => {
  const buffer = new ArrayBuffer(1 + FID_BYTES);
  const view = new DataView(buffer);
  view.setUint8(0, RootPrefix.User);
  view.setBigUint64(1, BigInt(fid), false); // Big endian for ordering
  return Buffer.from(buffer);
};

/** <user prefix byte, fid, set index byte, tsHash> */
export const makeMessagePrimaryKey = (fid: number, set: UserMessagePostfix, tsHash?: Uint8Array): Buffer => {
  return Buffer.concat([makeUserKey(fid), Buffer.from([set]), Buffer.from(tsHash ?? '')]);
};

export const makeMessagePrimaryKeyFromMessage = (message: protobufs.Message): Buffer => {
  if (!message.data) {
    throw new HubError('bad_request.invalid_param', 'message data is missing');
  }
  const tsHash = makeTsHash(message.data.timestamp, message.hash);
  if (tsHash.isErr()) {
    throw tsHash.error;
  }
  return makeMessagePrimaryKey(message.data.fid, typeToSetPostfix(message.data.type), tsHash.value);
};

/** <user prefix byte, fid, signer index byte, signer, type, tsHash> */
export const makeMessageBySignerKey = (
  fid: number,
  signer: Uint8Array,
  type?: protobufs.MessageType,
  tsHash?: Uint8Array
): Buffer => {
  return Buffer.concat([
    makeUserKey(fid),
    Buffer.from([UserPostfix.BySigner]),
    Buffer.from(signer),
    Buffer.from(type ? [type] : ''),
    Buffer.from(tsHash ?? ''),
  ]);
};

/** Generate tsHash from timestamp and hash */
export const makeTsHash = (timestamp: number, hash: Uint8Array): HubResult<Uint8Array> => {
  if (timestamp >= 2 ** 32) {
    return err(new HubError('bad_request.invalid_param', 'timestamp > 4 bytes'));
  }
  const buffer = new ArrayBuffer(4 + hash.length);
  const view = new DataView(buffer);

  // Store timestamp as big-endian in first 4 bytes
  view.setUint32(0, timestamp, false);

  // Add hash bytes
  for (let i = 0; i < hash.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, security/detect-object-injection
    view.setUint8(4 + i, hash[i]!);
  }

  return ok(new Uint8Array(buffer));
};

export const typeToSetPostfix = (type: protobufs.MessageType): UserMessagePostfix => {
  if (type === protobufs.MessageType.MESSAGE_TYPE_CAST_ADD || type === protobufs.MessageType.MESSAGE_TYPE_CAST_REMOVE) {
    return UserPostfix.CastMessage;
  }

  if (
    type === protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD ||
    type === protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE
  ) {
    return UserPostfix.ReactionMessage;
  }

  if (type === protobufs.MessageType.MESSAGE_TYPE_AMP_ADD || type === protobufs.MessageType.MESSAGE_TYPE_AMP_REMOVE) {
    return UserPostfix.AmpMessage;
  }

  if (
    type === protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS ||
    type === protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE
  ) {
    return UserPostfix.VerificationMessage;
  }

  if (
    type === protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD ||
    type === protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE
  ) {
    return UserPostfix.SignerMessage;
  }

  if (type === protobufs.MessageType.MESSAGE_TYPE_USER_DATA_ADD) {
    return UserPostfix.UserDataMessage;
  }

  throw new Error('invalid type');
};

export const putMessage = (db: RocksDB, message: protobufs.Message): Promise<void> => {
  const txn = putMessageTransaction(db.transaction(), message);
  return db.commit(txn);
};

export const getMessage = async <T extends protobufs.Message>(
  db: RocksDB,
  fid: number,
  set: UserMessagePostfix,
  tsHash: Uint8Array
): Promise<T> => {
  const buffer = await db.get(makeMessagePrimaryKey(fid, set, tsHash));
  return protobufs.Message.decode(new Uint8Array(buffer)) as T;
};

export const deleteMessage = (db: RocksDB, message: protobufs.Message): Promise<void> => {
  const txn = deleteMessageTransaction(db.transaction(), message);
  return db.commit(txn);
};

export const getManyMessages = async <T extends protobufs.Message>(
  db: RocksDB,
  primaryKeys: Buffer[]
): Promise<T[]> => {
  const buffers = await db.getMany(primaryKeys);
  return buffers.map((buffer) => protobufs.Message.decode(new Uint8Array(buffer)) as T);
};

export const getManyMessagesByFid = async <T extends protobufs.Message>(
  db: RocksDB,
  fid: number,
  set: UserMessagePostfix,
  tsHashes: Uint8Array[]
): Promise<T[]> => {
  return getManyMessages<T>(
    db,
    tsHashes.map((tsHash) => makeMessagePrimaryKey(fid, set, tsHash))
  );
};

export const getAllMessagesByFid = async (db: RocksDB, fid: number): Promise<protobufs.Message[]> => {
  const userPrefix = makeUserKey(fid);
  const maxPrefix = Buffer.concat([userPrefix, Buffer.from([UserMessagePostfixMax + 1])]);
  const iteratorOptions = {
    keys: false,
    valueAsBuffer: true,
    gte: userPrefix,
    lt: maxPrefix,
  };
  const messages = [];
  for await (const [, buffer] of db.iterator(iteratorOptions)) {
    messages.push(protobufs.Message.decode(new Uint8Array(buffer)));
  }
  return messages;
};

/** Get an array of messages for a given fid and signer */
export const getAllMessagesBySigner = async <T extends protobufs.Message>(
  db: RocksDB,
  fid: number,
  signer: Uint8Array,
  type?: protobufs.MessageType
): Promise<T[]> => {
  // Generate prefix by excluding tsHash from the bySignerKey
  // Format of bySignerKey: <user prefix byte, fid, by signer index byte, signer, type, tsHash>
  const prefix = makeMessageBySignerKey(fid, signer, type);

  // Initialize array of message primary keys
  const primaryKeys: Buffer[] = [];

  // Loop through all keys that start with the given prefix
  for await (const [key] of db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
    // Get the tsHash for the message using its position in the key relative to the prefix
    // If the prefix did not include type, add an extra byte to the tsHash offset
    const tsHashOffset = prefix.length + (type ? 0 : 1);
    const tsHash = new Uint8Array(key.slice(tsHashOffset));

    // Get the type for the message, either from the predefined type variable or by looking at the byte
    // prior to the tsHash in the key
    const messageType =
      type ?? (new Uint8Array(key as Buffer).slice(tsHashOffset - 1, tsHashOffset)[0] as protobufs.MessageType);

    // Convert the message type to a set postfix
    const setPostfix = typeToSetPostfix(messageType);

    // Use the fid, setPostfix, and tsHash to generate the primaryKey for the message and store it
    primaryKeys.push(makeMessagePrimaryKey(fid, setPostfix, tsHash));
  }

  // Look up many messages using the array of primaryKeys
  return getManyMessages(db, primaryKeys);
};

export const getMessagesPruneIterator = (
  db: RocksDB,
  fid: number,
  setPostfix: UserMessagePostfix
): AbstractRocksDB.Iterator => {
  const prefix = makeMessagePrimaryKey(fid, setPostfix);
  return db.iteratorByPrefix(prefix, { keys: false, valueAsBuffer: true });
};

export const getNextMessageToPrune = (iterator: AbstractRocksDB.Iterator): Promise<protobufs.Message> => {
  return new Promise((resolve, reject) => {
    iterator.next((err: Error | undefined, _: AbstractRocksDB.Bytes, value: AbstractRocksDB.Bytes) => {
      if (err || !value) {
        reject(err);
      } else {
        resolve(protobufs.Message.decode(new Uint8Array(value as Buffer)));
      }
    });
  });
};

export const putMessageTransaction = (txn: Transaction, message: protobufs.Message): Transaction => {
  if (!message.data) {
    throw new HubError('bad_request.invalid_param', 'message data is missing');
  }
  const tsHash = makeTsHash(message.data.timestamp, message.hash);
  if (tsHash.isErr()) {
    throw tsHash.error; // TODO: use result pattern
  }
  const primaryKey = makeMessagePrimaryKey(message.data.fid, typeToSetPostfix(message.data.type), tsHash.value);
  const messageBuffer = Buffer.from(protobufs.Message.encode(message).finish());
  const bySignerKey = makeMessageBySignerKey(message.data.fid, message.signer, message.data.type, tsHash.value);
  return txn.put(primaryKey, messageBuffer).put(bySignerKey, TRUE_VALUE);
};

export const deleteMessageTransaction = (txn: Transaction, message: protobufs.Message): Transaction => {
  if (!message.data) {
    throw new HubError('bad_request.invalid_param', 'message data is missing');
  }
  const tsHash = makeTsHash(message.data.timestamp, message.hash);
  if (tsHash.isErr()) {
    throw tsHash.error; // TODO: use result pattern
  }
  const primaryKey = makeMessagePrimaryKey(message.data.fid, typeToSetPostfix(message.data.type), tsHash.value);
  const bySignerKey = makeMessageBySignerKey(message.data.fid, message.signer, message.data.type, tsHash.value);
  return txn.del(bySignerKey).del(primaryKey);
};
