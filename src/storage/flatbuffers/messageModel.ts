import { ByteBuffer } from 'flatbuffers';
import {
  CastAddBody,
  CastRemoveBody,
  ReactionBody,
  FollowBody,
  Message,
  MessageBody,
  MessageData,
  MessageType,
  SignerBody,
  UserDataBody,
  HashScheme,
  SignatureScheme,
  FarcasterNetwork,
  VerificationAddEthAddressBody,
  VerificationRemoveBody,
} from '~/utils/generated/message_generated';
import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import { RootPrefix, UserMessagePostfix, UserPostfix } from '~/storage/flatbuffers/types';

/** Used when index keys are sufficiently descriptive */
export const TRUE_VALUE = Buffer.from([1]);

/** Size in bytes of a Farcaster ID */
export const FID_BYTES = 32;

/** Size in bytes of a Reaction's targetKey (32-byte fid, 4-byte timestamp, 4-byte hash) */
export const TARGET_KEY_BYTES = 40;

/** MessageModel that provides helpers to read and write Flatbuffers Messages from RocksDB */
export default class MessageModel {
  public message: Message;
  public data: MessageData;

  constructor(message: Message) {
    this.message = message;
    this.data = MessageData.getRootAsMessageData(new ByteBuffer(message.dataArray() ?? new Uint8Array()));
  }

  static from(bytes: Uint8Array) {
    const message = Message.getRootAsMessage(new ByteBuffer(bytes));
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
  static primaryKey(fid: Uint8Array, set: UserMessagePostfix, key: Uint8Array): Buffer {
    return Buffer.concat([this.userKey(fid), Buffer.from([set]), Buffer.from(key)]);
  }

  /** <user prefix byte, fid, signer index byte, signer, type, key> */
  static bySignerKey(fid: Uint8Array, signer: Uint8Array, type?: MessageType, key?: Uint8Array): Buffer {
    return Buffer.concat([
      this.userKey(fid),
      Buffer.from([UserPostfix.BySigner]),
      Buffer.from(signer),
      type ? Buffer.from([type]) : new Uint8Array(),
      key ? Buffer.from(key) : new Uint8Array(),
    ]);
  }

  static typeToSetPostfix(type: MessageType): UserMessagePostfix {
    if (type === MessageType.CastAdd || type === MessageType.CastRemove) {
      return UserPostfix.CastMessage;
    }

    if (type === MessageType.ReactionAdd || type === MessageType.ReactionRemove) {
      return UserPostfix.ReactionMessage;
    }

    if (type === MessageType.FollowAdd || type === MessageType.FollowRemove) {
      return UserPostfix.FollowMessage;
    }

    if (type === MessageType.VerificationAddEthAddress || type === MessageType.VerificationRemove) {
      return UserPostfix.VerificationMessage;
    }

    if (type === MessageType.SignerAdd || type === MessageType.SignerRemove) {
      return UserPostfix.SignerMessage;
    }

    if (type === MessageType.UserDataAdd) {
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
    type?: MessageType
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
        type ?? (new Uint8Array(key as Buffer).slice(tsHashOffset - 1, tsHashOffset)[0] as MessageType);

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
    return this.data.bb?.bytes() ?? new Uint8Array();
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
    return this.message.bb?.bytes() ?? new Uint8Array();
  }

  tsHash(): Uint8Array {
    return MessageModel.tsHash(this.timestamp(), this.hash());
  }

  timestamp(): number {
    return this.data.timestamp();
  }

  network(): FarcasterNetwork {
    return this.data.network();
  }

  type(): MessageType {
    return this.data.type();
  }

  fid(): Uint8Array {
    return this.data.fidArray() ?? new Uint8Array();
  }

  hash(): Uint8Array {
    return this.message.hashArray() ?? new Uint8Array();
  }

  hashScheme(): HashScheme {
    return this.message.hashScheme();
  }

  signature(): Uint8Array {
    return this.message.signatureArray() ?? new Uint8Array();
  }

  signatureScheme(): SignatureScheme {
    return this.message.signatureScheme();
  }

  signer(): Uint8Array {
    return this.message.signerArray() ?? new Uint8Array();
  }

  body():
    | CastAddBody
    | CastRemoveBody
    | FollowBody
    | VerificationAddEthAddressBody
    | VerificationRemoveBody
    | SignerBody
    | UserDataBody
    | ReactionBody {
    if (this.data.bodyType() === MessageBody.CastAddBody) {
      return this.data.body(new CastAddBody()) as CastAddBody;
    } else if (this.data.bodyType() === MessageBody.CastRemoveBody) {
      return this.data.body(new CastRemoveBody()) as CastRemoveBody;
    } else if (this.data.bodyType() === MessageBody.FollowBody) {
      return this.data.body(new FollowBody()) as FollowBody;
    } else if (this.data.bodyType() === MessageBody.VerificationAddEthAddressBody) {
      return this.data.body(new VerificationAddEthAddressBody()) as VerificationAddEthAddressBody;
    } else if (this.data.bodyType() === MessageBody.VerificationRemoveBody) {
      return this.data.body(new VerificationRemoveBody()) as VerificationRemoveBody;
    } else if (this.data.bodyType() === MessageBody.SignerBody) {
      return this.data.body(new SignerBody()) as SignerBody;
    } else if (this.data.bodyType() === MessageBody.UserDataBody) {
      return this.data.body(new UserDataBody()) as UserDataBody;
    } else if (this.data.bodyType() === MessageBody.ReactionBody) {
      return this.data.body(new ReactionBody()) as ReactionBody;
    }

    throw new Error('invalid bodyType');
  }
}
