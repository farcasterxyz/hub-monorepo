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

  static primaryKey(fid: Uint8Array, key: Uint8Array): Buffer {
    return Buffer.concat([Buffer.from('message'), Buffer.from(fid), Buffer.from(key)]);
  }

  static async get<T extends MessageModel>(db: RocksDB, fid: Uint8Array, key: Uint8Array): Promise<T> {
    const buffer = await db.get(MessageModel.primaryKey(fid, key));
    return this.from(new Uint8Array(buffer)) as T;
  }

  async commit(db: RocksDB): Promise<void> {
    return db.put(this.primaryKey(), this.toBuffer());
  }

  primaryKey(): Buffer {
    return MessageModel.primaryKey(this.fid(), this.timestampHash());
  }

  toBuffer(): Buffer {
    return Buffer.from(this.toBytes());
  }

  toBytes(): Uint8Array {
    return this.message.bb?.bytes() || new Uint8Array();
  }

  timestampHash(): Uint8Array {
    // TODO: confirm this is the most efficient way of converting number to Uint8Array
    const b = new ArrayBuffer(4);
    const view = new DataView(b);
    view.setUint32(0, this.data.timestamp());
    return new Uint8Array([...new Uint8Array(b), ...(this.message.hashArray() ?? new Uint8Array())]);
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

    throw new Error('invalid bodyType');
  }
}
