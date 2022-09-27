import RocksDB, { Transaction } from '~/db/rocksdb';
import { Message, MessageType } from '~/types';
import { isMessage } from '~/types/typeguards';

/**
 * MessageDB is like a Message model. It can be instantiated with a RocksDB instance and provides methods for
 * getting, putting, and deleting messages. All other DBs (i.e. CastDB, ReactionDB, etc) extend MessageDB using
 * the same pattern:
 *
 * - Public methods to be used in sets (i.e. getMessage, putMessage, etc)
 * - Key methods for determining the schema of RocksDB (i.e. messagesPrefix, messagesKey)
 * - Transaction methods for creating and chaining RocksDB transactions (i.e. _putMessage)
 *
 * All public put and delete methods in DB files should each represent a single, atomic RocksDB transaction.
 */
class MessageDB {
  protected _db: RocksDB;

  constructor(db: RocksDB) {
    this._db = db;
  }

  static query(db: RocksDB) {
    return this.constructor(db);
  }

  /** Public methods */

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

  async getMessagesBySigner<T extends Message>(fid: number, signer: string, type?: MessageType): Promise<T[]> {
    const hashes = await this.getMessageHashesByPrefix(this.messagesBySignerPrefix(fid, signer, type));
    return this.getMessages<T>(hashes);
  }

  /** Private key methods */

  private messagesPrefix() {
    return `messages!`;
  }

  private messagesKey(hash: string) {
    return this.messagesPrefix() + hash;
  }

  private messagesBySignerPrefix(fid: number, signer: string, type?: MessageType) {
    const typePrefix = type ? `type!${type}!` : '';
    return `fid!${fid}!signer!${signer}!${typePrefix}`;
  }

  private messagesBySignerKey(fid: number, signer: string, type: MessageType, hash: string) {
    return this.messagesBySignerPrefix(fid, signer, type) + hash;
  }

  /** Private transaction methods */

  protected _putMessage(tsx: Transaction, message: Message): Transaction {
    return tsx
      .put(this.messagesKey(message.hash), JSON.stringify(message))
      .put(this.messagesBySignerKey(message.data.fid, message.signer, message.data.type, message.hash), message.hash);
  }

  protected _deleteMessage(tsx: Transaction, message: Message): Transaction {
    return tsx
      .del(this.messagesBySignerKey(message.data.fid, message.signer, message.data.type, message.hash))
      .del(this.messagesKey(message.hash));
  }
}

export default MessageDB;
