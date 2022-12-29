import { Builder, ByteBuffer } from 'flatbuffers';
import AbstractRocksDB from 'rocksdb';
import * as message_generated from '~/flatbuffers/generated/message_generated';
import { RootPrefix, UserMessagePostfix, UserPostfix } from '~/flatbuffers/models/types';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import { HubError } from '~/utils/hubErrors';

/** Used when index keys are sufficiently descriptive */
export const TRUE_VALUE = Buffer.from([1]);

/** Size in bytes of a Farcaster ID */
export const FID_BYTES = 32;

/** Size in bytes of a Reaction's targetKey (32-byte fid, 4-byte timestamp, 4-byte hash) */
export const TARGET_KEY_BYTES = 40;

/** MessageModel that provides helpers to read and write Flatbuffers Messages from RocksDB */
export default class MessageModel {
  public message: message_generated.Message;
  public data: message_generated.MessageData;

  constructor(message: message_generated.Message) {
    const data = message_generated.MessageData.getRootAsMessageData(
      new ByteBuffer(message.dataArray() ?? new Uint8Array())
    );
    const messageType = data.type();
    if (!messageType) {
      throw new HubError('bad_request.invalid_param', 'message type is missing');
    }
    if (!Object.values(message_generated.MessageType).includes(messageType)) {
      throw new HubError('bad_request.invalid_param', 'message type is invalid');
    }
    this.message = message;
    this.data = data;
  }

  static from(bytes: Uint8Array) {
    const message = message_generated.Message.getRootAsMessage(new ByteBuffer(bytes));
    return new this(message);
  }

  /** <user prefix byte, fid> */
  static userKey(fid: Uint8Array): Buffer {
    const bytes = new Uint8Array(1 + FID_BYTES);
    bytes.set([RootPrefix.User], 0);
    bytes.set(fid, 1 + FID_BYTES - fid.length); // pad fid for alignment
    return Buffer.from(bytes);
  }

  /** <user prefix byte, fid, set index byte, key> */
  static primaryKey(fid: Uint8Array, set: UserMessagePostfix, key?: Uint8Array): Buffer {
    return Buffer.concat([this.userKey(fid), Buffer.from([set]), key ? Buffer.from(key) : new Uint8Array()]);
  }

  /** <user prefix byte, fid, signer index byte, signer, type, key> */
  static bySignerKey(
    fid: Uint8Array,
    signer: Uint8Array,
    type?: message_generated.MessageType,
    key?: Uint8Array
  ): Buffer {
    return Buffer.concat([
      this.userKey(fid),
      Buffer.from([UserPostfix.BySigner]),
      Buffer.from(signer),
      type ? Buffer.from([type]) : new Uint8Array(),
      key ? Buffer.from(key) : new Uint8Array(),
    ]);
  }

  static typeToSetPostfix(type: message_generated.MessageType): UserMessagePostfix {
    if (type === message_generated.MessageType.CastAdd || type === message_generated.MessageType.CastRemove) {
      return UserPostfix.CastMessage;
    }

    if (type === message_generated.MessageType.ReactionAdd || type === message_generated.MessageType.ReactionRemove) {
      return UserPostfix.ReactionMessage;
    }

    if (type === message_generated.MessageType.AmpAdd || type === message_generated.MessageType.AmpRemove) {
      return UserPostfix.AmpMessage;
    }

    if (
      type === message_generated.MessageType.VerificationAddEthAddress ||
      type === message_generated.MessageType.VerificationRemove
    ) {
      return UserPostfix.VerificationMessage;
    }

    if (type === message_generated.MessageType.SignerAdd || type === message_generated.MessageType.SignerRemove) {
      return UserPostfix.SignerMessage;
    }

    if (type === message_generated.MessageType.UserDataAdd) {
      return UserPostfix.UserDataMessage;
    }

    throw new Error('invalid type');
  }

  /** Generate tsHash from timestamp and hash */
  static tsHash(timestamp: number, hash: Uint8Array): Uint8Array {
    const buffer = new ArrayBuffer(4 + hash.length);
    const view = new DataView(buffer);
    view.setUint32(0, timestamp, false); // Stores timestamp as big-endian in first 4 bytes
    const bytes = new Uint8Array(buffer);
    bytes.set(hash, 4);
    return bytes;
  }

  static async getMany<T extends MessageModel>(db: RocksDB, primaryKeys: Buffer[]): Promise<T[]> {
    const values = await db.getMany(primaryKeys);
    return values.map((value) => MessageModel.from(new Uint8Array(value)) as T);
  }

  static async getManyByUser<T extends MessageModel>(
    db: RocksDB,
    fid: Uint8Array,
    set: UserMessagePostfix,
    keys: Uint8Array[]
  ): Promise<T[]> {
    return this.getMany<T>(
      db,
      keys.map((key) => MessageModel.primaryKey(fid, set, key))
    );
  }

  static async getAllByUser(db: RocksDB, fid: Uint8Array): Promise<MessageModel[]> {
    const prefix = MessageModel.userKey(fid);
    const messages = [];
    for await (const [, value] of db.iteratorByPrefix(prefix, { keys: false, valueAsBuffer: true })) {
      messages.push(this.from(new Uint8Array(value)));
    }
    return messages;
  }

  /** Get an array of messages for a given fid and signer */
  static async getAllBySigner<T extends MessageModel>(
    db: RocksDB,
    fid: Uint8Array,
    signer: Uint8Array,
    type?: message_generated.MessageType
  ): Promise<T[]> {
    // Generate prefix by excluding tsHash from the bySignerKey
    // Format of bySignerKey: <user prefix byte, fid, by signer index byte, signer, type, tsHash>
    const prefix = MessageModel.bySignerKey(fid, signer, type);

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
        type ??
        (new Uint8Array(key as Buffer).slice(tsHashOffset - 1, tsHashOffset)[0] as message_generated.MessageType);

      // Convert the message type to a set postfix
      const setPostfix = MessageModel.typeToSetPostfix(messageType);

      // Use the fid, setPostfix, and tsHash to generate the primaryKey for the message and store it
      primaryKeys.push(MessageModel.primaryKey(fid, setPostfix, tsHash));
    }

    // Look up many messages using the array of primaryKeys
    return this.getMany(db, primaryKeys);
  }

  static async get<T extends MessageModel>(
    db: RocksDB,
    fid: Uint8Array,
    set: UserMessagePostfix,
    key: Uint8Array
  ): Promise<T> {
    const buffer = await db.get(MessageModel.primaryKey(fid, set, key));
    return MessageModel.from(new Uint8Array(buffer)) as T;
  }

  static getPruneIterator(db: RocksDB, fid: Uint8Array, setPostfix: UserMessagePostfix): AbstractRocksDB.Iterator {
    const prefix = MessageModel.primaryKey(fid, setPostfix);
    return db.iteratorByPrefix(prefix, { keys: false, valueAsBuffer: true });
  }

  static async getNextToPrune(iterator: AbstractRocksDB.Iterator): Promise<MessageModel> {
    return new Promise((resolve, reject) => {
      iterator.next((err: Error | undefined, _: AbstractRocksDB.Bytes, value: AbstractRocksDB.Bytes) => {
        if (err || !value) {
          reject(err);
        } else {
          resolve(MessageModel.from(new Uint8Array(value as Buffer)));
        }
      });
    });
  }

  static putTransaction(tsx: Transaction, message: MessageModel): Transaction {
    return tsx.put(message.primaryKey(), message.toBuffer()).put(message.bySignerKey(), TRUE_VALUE);
  }

  static deleteTransaction(tsx: Transaction, message: MessageModel): Transaction {
    return tsx.del(message.bySignerKey()).del(message.primaryKey());
  }

  async put(db: RocksDB): Promise<void> {
    const tsx = this.putTransaction(db.transaction());
    return db.commit(tsx);
  }

  putTransaction(tsx: Transaction): Transaction {
    return MessageModel.putTransaction(tsx, this);
  }

  setPostfix(): UserMessagePostfix {
    return MessageModel.typeToSetPostfix(this.type());
  }

  dataBytes(): Uint8Array {
    const builder = new Builder(1);
    const dataT = this.data.unpack();
    builder.finish(dataT.pack(builder));
    return builder.asUint8Array();
  }

  primaryKey(): Buffer {
    return MessageModel.primaryKey(this.fid(), this.setPostfix(), this.tsHash());
  }

  bySignerKey(): Buffer {
    return MessageModel.bySignerKey(this.fid(), this.signer(), this.type(), this.tsHash());
  }

  toBuffer(): Buffer {
    return Buffer.from(this.toBytes());
  }

  toBytes(): Uint8Array {
    const builder = new Builder(1);
    const messageT = this.message.unpack();
    builder.finish(messageT.pack(builder));
    return builder.asUint8Array();
  }

  tsHash(): Uint8Array {
    return MessageModel.tsHash(this.timestamp(), this.hash());
  }

  timestamp(): number {
    return this.data.timestamp();
  }

  network(): message_generated.FarcasterNetwork {
    return this.data.network();
  }

  type(): message_generated.MessageType {
    return this.data.type() as message_generated.MessageType;
  }

  typeName(): string {
    return message_generated.MessageType[this.type()] as string;
  }

  fid(): Uint8Array {
    return this.data.fidArray() ?? new Uint8Array();
  }

  hash(): Uint8Array {
    return this.message.hashArray() ?? new Uint8Array();
  }

  hashScheme(): message_generated.HashScheme {
    return this.message.hashScheme();
  }

  signature(): Uint8Array {
    return this.message.signatureArray() ?? new Uint8Array();
  }

  signatureScheme(): message_generated.SignatureScheme {
    return this.message.signatureScheme();
  }

  signer(): Uint8Array {
    return this.message.signerArray() ?? new Uint8Array();
  }

  body():
    | message_generated.CastAddBody
    | message_generated.CastRemoveBody
    | message_generated.AmpBody
    | message_generated.VerificationAddEthAddressBody
    | message_generated.VerificationRemoveBody
    | message_generated.SignerBody
    | message_generated.UserDataBody
    | message_generated.ReactionBody {
    if (this.data.bodyType() === message_generated.MessageBody.CastAddBody) {
      return this.data.body(new message_generated.CastAddBody()) as message_generated.CastAddBody;
    } else if (this.data.bodyType() === message_generated.MessageBody.CastRemoveBody) {
      return this.data.body(new message_generated.CastRemoveBody()) as message_generated.CastRemoveBody;
    } else if (this.data.bodyType() === message_generated.MessageBody.AmpBody) {
      return this.data.body(new message_generated.AmpBody()) as message_generated.AmpBody;
    } else if (this.data.bodyType() === message_generated.MessageBody.VerificationAddEthAddressBody) {
      return this.data.body(
        new message_generated.VerificationAddEthAddressBody()
      ) as message_generated.VerificationAddEthAddressBody;
    } else if (this.data.bodyType() === message_generated.MessageBody.VerificationRemoveBody) {
      return this.data.body(new message_generated.VerificationRemoveBody()) as message_generated.VerificationRemoveBody;
    } else if (this.data.bodyType() === message_generated.MessageBody.SignerBody) {
      return this.data.body(new message_generated.SignerBody()) as message_generated.SignerBody;
    } else if (this.data.bodyType() === message_generated.MessageBody.UserDataBody) {
      return this.data.body(new message_generated.UserDataBody()) as message_generated.UserDataBody;
    } else if (this.data.bodyType() === message_generated.MessageBody.ReactionBody) {
      return this.data.body(new message_generated.ReactionBody()) as message_generated.ReactionBody;
    }

    throw new Error('invalid bodyType');
  }
}
