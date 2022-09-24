import { ok, err, Result } from 'neverthrow';
import RocksDB, { Transaction } from '~/db/rocksdb';
import { Message, MessageType } from '~/types';
import { isMessage } from '~/types/typeguards';

class MessageDB {
  protected _db: RocksDB;

  constructor(db: RocksDB) {
    this._db = db;
  }

  static query(db: RocksDB) {
    return this.constructor(db);
  }

  async getMessage<T extends Message>(hash: string): Promise<T> {
    const value = await this._db.get(this.messagesKey(hash));

    const json = JSON.parse(value);

    if (!isMessage(json)) throw new Error('malformed value');

    return json as T;
  }

  async getMessages<T extends Message>(hashes: string[]): Promise<T[]> {
    const messageKeys = hashes.map((hash) => this.messagesKey(hash));
    const results = await this._db.getMany(messageKeys);

    const json = results.reduce((acc: T[], value: string) => {
      return value ? [...acc, JSON.parse(value)] : acc;
    }, []);

    return json;
  }

  // TODO: remove old version that uses Result
  // async getMessages<T extends Message>(hashes: string[]): Promise<Result<T[], string>> {
  //   const messageKeys = hashes.map((hash) => this.messagesKey(hash));
  //   const result = await this._db.getMany(messageKeys);

  //   if (result.isErr()) return err(result.error);

  //   const json = result.value.reduce((acc: T[], value: string) => {
  //     return value ? [...acc, JSON.parse(value)] : acc;
  //   }, []);

  //   return ok(json);
  // }

  async putMessage(message: Message): Promise<void> {
    const tsx = this._putMessage(this._db.transaction(), message);
    return this._db.commit(tsx);
  }

  async deleteMessage(hash: string): Promise<void> {
    const message = await this.getMessage(hash);
    const tsx = this._deleteMessage(this._db.transaction(), message);
    return this._db.commit(tsx);
  }

  async getMessageHashesByPrefix(prefix: string): Promise<string[]> {
    const hashes: string[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(prefix, {
      keys: false,
      valueAsBuffer: false,
    })) {
      hashes.push(value);
    }
    return hashes;
  }

  async getMessagesBySigner(signer: string, type?: MessageType): Promise<Message[]> {
    const hashes = await this.getMessageHashesByPrefix(this.signersKey(signer, type));
    return this.getMessages(hashes);
  }

  /** Private key methods */

  private messagesKey(hash?: string) {
    return `messages!${hash ?? ''}`;
  }

  private signersKey(signer: string, type?: MessageType, hash?: string) {
    // TODO: fix hack by creating separate methods for prefixes and keys
    return `signer!${signer}!${type ? type + '!' : ''}${hash ?? ''}`;
  }

  /** Private transaction methods */

  protected _putMessage(tsx: Transaction, message: Message): Transaction {
    return tsx
      .put(this.messagesKey(message.hash), JSON.stringify(message))
      .put(this.signersKey(message.signer, message.data.type, message.hash), message.hash);
  }

  protected _deleteMessage(tsx: Transaction, message: Message): Transaction {
    return tsx
      .del(this.signersKey(message.signer, message.data.type, message.hash))
      .del(this.messagesKey(message.hash));
  }
}

export default MessageDB;
