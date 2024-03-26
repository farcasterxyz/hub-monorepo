import { bytesIncrement, CastId, HubError, HubResult, Message, MessageData, MessageType } from "@farcaster/hub-nodejs";
import { err, ok, Result, ResultAsync } from "neverthrow";
import RocksDB, { RocksDbIteratorOptions, RocksDbTransaction } from "./rocksdb.js";
import {
  FID_BYTES,
  RootPrefix,
  TRUE_VALUE,
  TSHASH_LENGTH,
  UserMessagePostfix,
  UserMessagePostfixMax,
  UserPostfix,
} from "./types.js";
import { MessagesPage, PAGE_SIZE_MAX, PageOptions } from "../stores/types.js";

export const makeFidKey = (fid: number): Buffer => {
  const buffer = Buffer.alloc(FID_BYTES);
  // Even though fid is 64 bits, we're only using 32 bits for now, to save 4 bytes per key.
  // This is fine until 4 billion users, after which we'll need to do a migration of this key in the DB.
  buffer.writeUInt32BE(fid, 0);
  return buffer;
};

export const readFidKey = (buffer: Buffer): number => {
  return buffer.readUInt32BE(0);
};

/** <user prefix byte, fid> */
export const makeUserKey = (fid: number): Buffer => {
  return Buffer.concat([Buffer.from([RootPrefix.User]), makeFidKey(fid)]);
};

/** <user prefix byte, fid, set index byte, tsHash> */
export const makeMessagePrimaryKey = (fid: number, set: UserMessagePostfix, tsHash?: Uint8Array): Buffer => {
  return Buffer.concat([makeUserKey(fid), Buffer.from([set]), Buffer.from(tsHash ?? "")]);
};

export const makeMessagePrimaryKeyFromMessage = (message: Message): Buffer => {
  if (!message.data) {
    throw new HubError("bad_request.invalid_param", "message data is missing");
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
  type?: MessageType,
  tsHash?: Uint8Array,
): Buffer => {
  return Buffer.concat([
    makeUserKey(fid),
    Buffer.from([UserPostfix.BySigner]),
    Buffer.from(signer),
    Buffer.from(type ? [type] : ""),
    Buffer.from(tsHash ?? ""),
  ]);
};

/** Generate tsHash from timestamp and hash */
export const makeTsHash = (timestamp: number, hash: Uint8Array): HubResult<Uint8Array> => {
  if (timestamp >= 2 ** 32) {
    return err(new HubError("bad_request.invalid_param", "timestamp > 4 bytes"));
  }
  const buffer = Buffer.alloc(4 + hash.length);

  // Store timestamp as big-endian in first 4 bytes
  buffer.writeUint32BE(timestamp, 0);
  buffer.set(hash, 4);

  return ok(new Uint8Array(buffer));
};

export const unpackTsHash = (tsHash: Uint8Array): HubResult<[number, Uint8Array]> => {
  if (tsHash.length !== TSHASH_LENGTH) {
    return err(new HubError("bad_request.invalid_param", "invalid tsHash length"));
  }
  const timestamp = tsHash.slice(0, 4);
  const hash = tsHash.slice(4);
  return ok([Buffer.from(timestamp).readUInt32BE(0), hash]);
};

export const typeToSetPostfix = (type: MessageType): UserMessagePostfix => {
  if (type === MessageType.CAST_ADD || type === MessageType.CAST_REMOVE) {
    return UserPostfix.CastMessage;
  }

  if (type === MessageType.REACTION_ADD || type === MessageType.REACTION_REMOVE) {
    return UserPostfix.ReactionMessage;
  }

  if (type === MessageType.VERIFICATION_ADD_ETH_ADDRESS || type === MessageType.VERIFICATION_REMOVE) {
    return UserPostfix.VerificationMessage;
  }

  if (type === MessageType.USER_DATA_ADD) {
    return UserPostfix.UserDataMessage;
  }

  if (type === MessageType.LINK_ADD || type === MessageType.LINK_REMOVE) {
    return UserPostfix.LinkMessage;
  }

  if (type === MessageType.USERNAME_PROOF) {
    return UserPostfix.UsernameProofMessage;
  }

  throw new Error(`invalid type: ${type}`);
};

export const putMessage = (db: RocksDB, message: Message): Promise<void> => {
  const txn = putMessageTransaction(db.transaction(), message);
  return db.commit(txn);
};

export const getMessage = async <T extends Message>(
  db: RocksDB,
  fid: number,
  set: UserMessagePostfix,
  tsHash: Uint8Array,
): Promise<T> => {
  const buffer = await db.get(makeMessagePrimaryKey(fid, set, tsHash));
  return messageDecode(new Uint8Array(buffer)) as T;
};

export const isMessageInDB = async (db: RocksDB, message: Message): Promise<boolean> => {
  const exists = await ResultAsync.fromPromise(
    (async () => {
      return db.get(makeMessagePrimaryKeyFromMessage(message));
    })(),
    (e) => e,
  );
  return exists.isOk() && exists.value.length > 0;
};

export const deleteMessage = (db: RocksDB, message: Message): Promise<void> => {
  const txn = deleteMessageTransaction(db.transaction(), message);
  return db.commit(txn);
};

export const getManyMessages = async <T extends Message>(db: RocksDB, primaryKeys: Buffer[]): Promise<T[]> => {
  const buffers = await db.getMany(primaryKeys);
  return buffers.map((buffer) => messageDecode(new Uint8Array(buffer ?? [])) as T);
};

export const getManyMessagesByFid = async <T extends Message>(
  db: RocksDB,
  fid: number,
  set: UserMessagePostfix,
  tsHashes: Uint8Array[],
): Promise<T[]> => {
  return getManyMessages<T>(
    db,
    tsHashes.map((tsHash) => makeMessagePrimaryKey(fid, set, tsHash)),
  );
};

export const getAllMessagesByFid = async (db: RocksDB, fid: number): Promise<Message[]> => {
  const userPrefix = makeUserKey(fid);
  const maxPrefix = Buffer.concat([userPrefix, Buffer.from([UserMessagePostfixMax + 1])]);
  const iteratorOptions = {
    gte: userPrefix,
    lt: maxPrefix,
  };

  const messages: Message[] = [];
  await db.forEachIteratorByOpts(iteratorOptions, (_key, buffer) => {
    messages.push(messageDecode(new Uint8Array(buffer as Buffer)));
  });

  return messages;
};

export const getPageIteratorOptsByPrefix = (prefix: Buffer, pageOptions: PageOptions = {}): RocksDbIteratorOptions => {
  const prefixEnd = bytesIncrement(Uint8Array.from(prefix));
  if (prefixEnd.isErr()) {
    throw prefixEnd.error;
  }

  let startKey: Buffer;
  if (pageOptions.pageToken) {
    startKey = Buffer.concat([prefix, Buffer.from(pageOptions.pageToken)]);
  } else if (pageOptions.reverse === true) {
    startKey = Buffer.from(prefixEnd.value);
  } else {
    startKey = prefix;
  }

  if (pageOptions.pageSize && pageOptions.pageSize > PAGE_SIZE_MAX) {
    throw new HubError("bad_request.invalid_param", `pageSize > ${PAGE_SIZE_MAX}`);
  }

  return pageOptions.reverse === true
    ? { lt: startKey, gt: prefix, reverse: true }
    : {
        gt: startKey,
        lt: Buffer.from(prefixEnd.value),
      };
};

export const getMessagesPageByPrefix = async <T extends Message>(
  db: RocksDB,
  prefix: Buffer,
  filter: (message: Message) => message is T,
  pageOptions: PageOptions = {},
): Promise<MessagesPage<T>> => {
  const iteratorOpts = getPageIteratorOptsByPrefix(prefix, pageOptions);

  const limit = pageOptions.pageSize || PAGE_SIZE_MAX;

  const messages: T[] = [];

  let iteratorFinished = true;
  let lastPageToken: Uint8Array | undefined;

  await db.forEachIteratorByOpts(iteratorOpts, (key, value) => {
    if (!key || !value) {
      return false; // skip
    }

    const message = messageDecode(new Uint8Array(value as Buffer));
    if (filter(message)) {
      messages.push(message);

      if (messages.length >= limit) {
        lastPageToken = Uint8Array.from(key.subarray(prefix.length));
        iteratorFinished = false;
        return true;
      }
    }

    return false; // continue
  });

  if (!iteratorFinished) {
    return { messages, nextPageToken: lastPageToken };
  } else {
    return { messages, nextPageToken: undefined };
  }
};

export const getMessagesBySignerPrefix = (db: RocksDB, fid: number, signer: Uint8Array, type?: MessageType): Buffer => {
  return makeMessageBySignerKey(fid, signer, type);
};

/** Get an array of messages for a given fid and signer */
export const getAllMessagesBySigner = async <T extends Message>(
  db: RocksDB,
  fid: number,
  signer: Uint8Array,
  type?: MessageType,
): Promise<T[]> => {
  // Generate prefix by excluding tsHash from the bySignerKey
  // Format of bySignerKey: <user prefix byte, fid, by signer index byte, signer, type, tsHash>
  const prefix = makeMessageBySignerKey(fid, signer, type);

  // Initialize array of message primary keys
  const primaryKeys: Buffer[] = [];

  // Loop through all keys that start with the given prefix
  await db.forEachIteratorByPrefix(prefix, (key, _) => {
    // Get the tsHash for the message using its position in the key relative to the prefix
    // If the prefix did not include type, add an extra byte to the tsHash offset
    const tsHashOffset = prefix.length + (type ? 0 : 1);
    const tsHash = new Uint8Array(key as Buffer).slice(tsHashOffset);

    // Get the type for the message, either from the predefined type variable or by looking at the byte
    // prior to the tsHash in the key
    const messageType = type ?? (new Uint8Array(key as Buffer).slice(tsHashOffset - 1, tsHashOffset)[0] as MessageType);

    // Convert the message type to a set postfix
    const setPostfix = typeToSetPostfix(messageType);

    // Use the fid, setPostfix, and tsHash to generate the primaryKey for the message and store it
    primaryKeys.push(makeMessagePrimaryKey(fid, setPostfix, tsHash));
  });

  // Look up many messages using the array of primaryKeys
  return getManyMessages(db, primaryKeys);
};

export const putMessageTransaction = (txn: RocksDbTransaction, message: Message): RocksDbTransaction => {
  if (!message.data) {
    throw new HubError("bad_request.invalid_param", "message data is missing");
  }
  const tsHash = makeTsHash(message.data.timestamp, message.hash);
  if (tsHash.isErr()) {
    throw tsHash.error; // TODO: use result pattern
  }
  const primaryKey = makeMessagePrimaryKey(message.data.fid, typeToSetPostfix(message.data.type), tsHash.value);
  const bySignerKey = makeMessageBySignerKey(message.data.fid, message.signer, message.data.type, tsHash.value);

  const messageBuffer = messageEncode(message);
  return txn.put(primaryKey, Buffer.from(messageBuffer)).put(bySignerKey, TRUE_VALUE);
};

export const deleteMessageTransaction = (txn: RocksDbTransaction, message: Message): RocksDbTransaction => {
  if (!message.data) {
    throw new HubError("bad_request.invalid_param", "message data is missing");
  }
  const tsHash = makeTsHash(message.data.timestamp, message.hash);
  if (tsHash.isErr()) {
    throw tsHash.error; // TODO: use result pattern
  }
  const primaryKey = makeMessagePrimaryKey(message.data.fid, typeToSetPostfix(message.data.type), tsHash.value);
  const bySignerKey = makeMessageBySignerKey(message.data.fid, message.signer, message.data.type, tsHash.value);
  return txn.del(bySignerKey).del(primaryKey);
};

// If the message's data_bytes is set, then we'll not store the data field in the DB.
// to save space. Instead, we'll store the message with the data_bytes field set, and
// then when we read the message, we'll decode it, set the data field
export const messageEncode = (message: Message): Uint8Array => {
  if (message.dataBytes && message.dataBytes.length > 0) {
    const cloned = Message.decode(Message.encode(message).finish());
    cloned.data = undefined;
    return Message.encode(cloned).finish();
  } else {
    return Message.encode(message).finish();
  }
};

// If the message's data_bytes is set, then we'll decode it and populate the data field
// to make the Message object easier to work with
export const messageDecode = (messageBytes: Uint8Array): Message => {
  const message = Message.decode(messageBytes);
  if (message.dataBytes && message.dataBytes.length > 0) {
    message.data = MessageData.decode(message.dataBytes);
  }
  return message;
};

// Ensure that the message has a data field set, by decoding the data_bytes field if it exists
export const ensureMessageData = (message: Message): Message => {
  // If the message has a data_bytes field set, use that instead of the data field
  if (message.dataBytes && message.dataBytes.length > 0) {
    const decodedMessageData = Result.fromThrowable(
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      () => MessageData.decode(message.dataBytes!),
      (e) => e,
    )();
    if (decodedMessageData.isOk()) {
      message.data = decodedMessageData.value;
    }
  }

  return message;
};
