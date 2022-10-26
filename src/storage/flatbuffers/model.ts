import { ByteBuffer } from 'flatbuffers';
import {
  CastAddBody,
  CastRemoveBody,
  FollowBody,
  Message,
  MessageBody,
  MessageData,
  MessageType,
} from '~/utils/generated/message_generated';
import RocksDB from '~/storage/db/binaryrocksdb';
import { RootPrefix, UserMessagePrefix, UserPrefix } from '~/storage/flatbuffers/types';

export default class MessageModel {
  public message: Message;
  public data: MessageData;

  constructor(message: Message) {
    this.message = message;
    this.data = MessageData.getRootAsMessageData(new ByteBuffer(message.dataArray() || new Uint8Array()));
  }

  static from(bytes: Uint8Array) {
    const message = Message.getRootAsMessage(new ByteBuffer(bytes));
    return new this(message);
  }

  static userKey(fid: Uint8Array): Buffer {
    const bytes = new Uint8Array(1 + 256);
    bytes.set([RootPrefix.User], 0);
    bytes.set(fid, 1 + 256 - fid.length); // pad fid for alignment
    return Buffer.from(bytes);
  }

  /** <user prefix byte, fid, set index byte, key> */
  static primaryKey(fid: Uint8Array, set: UserMessagePrefix, key: Uint8Array): Buffer {
    return Buffer.concat([this.userKey(fid), Buffer.from([set]), Buffer.from(key)]);
  }

  // <user prefix byte, fid, signer index byte, signer, type, key>
  static bySignerKey(fid: Uint8Array, signer: Uint8Array, type: MessageType, key: Uint8Array): Buffer {
    return Buffer.concat([
      this.userKey(fid),
      Buffer.from([UserPrefix.BySigner]),
      Buffer.from(signer),
      Buffer.from([type]),
      Buffer.from(key),
    ]);
  }

  static async getManyByUser<T extends MessageModel>(
    db: RocksDB,
    fid: Uint8Array,
    set: UserMessagePrefix,
    keys: Uint8Array[]
  ): Promise<T[]> {
    const values = await db.getMany(keys.map((key) => MessageModel.primaryKey(fid, set, key)));
    return values.map((value) => MessageModel.from(new Uint8Array(value)) as T);
  }

  static async getAllByUser(db: RocksDB, fid: Uint8Array): Promise<MessageModel[]> {
    const prefix = MessageModel.userKey(fid);
    const messages = [];
    for await (const [, value] of db.iteratorByPrefix(prefix, { keys: false, valueAsBuffer: true })) {
      messages.push(this.from(new Uint8Array(value)));
    }
    return messages;
  }

  static async get<T extends MessageModel>(
    db: RocksDB,
    fid: Uint8Array,
    set: UserMessagePrefix,
    key: Uint8Array
  ): Promise<T> {
    const buffer = await db.get(MessageModel.primaryKey(fid, set, key));
    return MessageModel.from(new Uint8Array(buffer)) as T;
  }

  async commit(db: RocksDB): Promise<void> {
    return db.put(this.primaryKey(), this.toBuffer());
  }

  setPrefix(): UserMessagePrefix {
    if (this.type() === MessageType.CastAdd || this.type() === MessageType.CastRemove) {
      return UserPrefix.CastMessage;
    }

    // TODO: add all message types

    throw new Error('invalid type');
  }

  primaryKey(): Buffer {
    return MessageModel.primaryKey(this.fid(), this.setPrefix(), this.timestampHash());
  }

  toBuffer(): Buffer {
    return Buffer.from(this.toBytes());
  }

  toBytes(): Uint8Array {
    return this.message.bb?.bytes() || new Uint8Array();
  }

  timestampHash(): Uint8Array {
    const hash = this.hash();
    const buffer = new ArrayBuffer(4 + hash.length);
    const view = new DataView(buffer);
    view.setUint32(0, this.data.timestamp());
    const bytes = new Uint8Array(buffer);
    bytes.set(hash, 4);
    return bytes;
  }

  timestamp(): number {
    return this.data.timestamp();
  }

  type(): MessageType {
    return this.data.type();
  }

  fid(): Uint8Array {
    return this.data.fidArray() || new Uint8Array();
  }

  hash(): Uint8Array {
    return this.message.hashArray() || new Uint8Array();
  }

  body(): CastAddBody | CastRemoveBody | FollowBody {
    if (this.data.bodyType() === MessageBody.CastAddBody) {
      return this.data.body(new CastAddBody()) as CastAddBody;
    } else if (this.data.bodyType() === MessageBody.CastRemoveBody) {
      return this.data.body(new CastRemoveBody()) as CastRemoveBody;
    } else if (this.data.bodyType() === MessageBody.FollowBody) {
      return this.data.body(new FollowBody()) as FollowBody;
    }

    // TODO: add all body types

    throw new Error('invalid bodyType');
  }
}
