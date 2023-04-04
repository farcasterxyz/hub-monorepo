import { bytesIncrement, HubError, isHubError } from '@farcaster/hub-nodejs';
import { AbstractBatch, AbstractChainedBatch, AbstractIterator } from 'abstract-leveldown';
import { mkdir } from 'fs';
import AbstractRocksDB from 'rocksdb';

export const DB_DIRECTORY = '.rocks';
const DB_NAME_DEFAULT = 'farcaster';

export type Transaction = AbstractChainedBatch<Buffer, Buffer>;

const parseError = (e: Error): HubError => {
  if (/NotFound/i.test(e.message)) {
    return new HubError('not_found', e);
  }
  return new HubError('unavailable.storage_failure', e);
};

export class Iterator {
  protected _iterator: AbstractIterator<AbstractRocksDB.Bytes, AbstractRocksDB.Bytes>;

  constructor(iterator: AbstractIterator<AbstractRocksDB.Bytes, AbstractRocksDB.Bytes>) {
    this._iterator = iterator;
  }

  async *[Symbol.asyncIterator]() {
    try {
      let kv: [Buffer | undefined, Buffer | undefined] | undefined;
      while ((kv = await this.next())) {
        yield kv;
      }
    } catch (e) {
      if (!(isHubError(e) && e.errCode === 'not_found')) {
        throw e;
      }
    } finally {
      await this.end();
    }
  }

  async next(): Promise<[Buffer | undefined, Buffer | undefined]> {
    return new Promise((resolve, reject) => {
      this._iterator.next((err: Error | undefined, key: AbstractRocksDB.Bytes, value: AbstractRocksDB.Bytes) => {
        if (err) {
          reject(err);
        } else if (key === undefined && value === undefined) {
          reject(new HubError('not_found', 'record not found'));
        } else {
          resolve([key as Buffer | undefined, value as Buffer | undefined]);
        }
      });
    });
  }

  async end(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._iterator.end((err: Error | undefined) => {
        err ? reject(err) : resolve(undefined);
      });
    });
  }
}

/**
 * RocksDB extends methods from AbstractRocksDB and wraps the methods in promises. Helper methods for
 * transactions and iterating by prefix are provided at the end of the file.
 */
class RocksDB {
  protected _db: AbstractRocksDB;

  private _hasOpened = false;

  constructor(name?: string) {
    this._db = new AbstractRocksDB(`${DB_DIRECTORY}/${name ?? DB_NAME_DEFAULT}`);
  }

  get location() {
    return this._db.location;
  }

  get status() {
    return this._db.status;
  }

  async put(key: Buffer, value: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      this._db.put(key, value, (e?: Error) => {
        e ? reject(parseError(e)) : resolve(undefined);
      });
    });
  }

  async get(key: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this._db.get(key, { asBuffer: true }, (e?: Error, value?: AbstractRocksDB.Bytes) => {
        e ? reject(parseError(e)) : resolve(value as Buffer);
      });
    });
  }

  async getMany(keys: Buffer[]): Promise<Buffer[]> {
    return new Promise((resolve, reject) => {
      this._db.getMany(keys, { asBuffer: true }, (e?: Error, value?: AbstractRocksDB.Bytes[]) => {
        e ? reject(parseError(e)) : resolve(value as Buffer[]);
      });
    });
  }

  async del(key: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      this._db.del(key, (e?: Error) => {
        e ? reject(parseError(e)) : resolve(undefined);
      });
    });
  }

  async batch(operations: AbstractBatch<Buffer, Buffer>[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this._db.batch(operations, (e?: Error) => {
        e ? reject(parseError(e)) : resolve(undefined);
      });
    });
  }

  open(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._db.status === 'opening') {
        reject(new Error('db is opening'));
      } else if (this._db.status === 'closing') {
        reject(new Error('db is closing'));
      } else if (this._db.status === 'open') {
        resolve(undefined);
      } else {
        // NOTE: eslint falsely identifies `open(...)` as `fs.open`.
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        mkdir(this._db.location, { recursive: true }, (fsErr: Error | null) => {
          if (fsErr) reject(parseError(fsErr));
          this._db.open({ createIfMissing: true, errorIfExists: false }, (e?: Error) => {
            if (!e) {
              this._hasOpened = true;
            }
            e ? reject(parseError(e)) : resolve(undefined);
          });
        });
      }
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._db.close((e?: Error) => {
        e ? reject(parseError(e)) : resolve(undefined);
      });
    });
  }

  clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._db['clear']((e?: Error) => {
        e ? reject(parseError(e)) : resolve(undefined);
      });
    });
  }

  async destroy(): Promise<void> {
    if (this._db.status === 'open') {
      await this.close();
    }
    return new Promise((resolve, reject) => {
      if (!this._hasOpened) {
        reject(new Error('db never opened'));
      } else {
        AbstractRocksDB.destroy(this._db.location, (e?: Error) => {
          e ? reject(parseError(e)) : resolve(undefined);
        });
      }
    });
  }

  iterator(options?: AbstractRocksDB.IteratorOptions): Iterator {
    return new Iterator(this._db.iterator({ ...options, valueAsBuffer: true, keyAsBuffer: true }));
  }

  /* -------------------------------------------------------------------------- */
  /*                          Custom Farcaster Methods                          */
  /* -------------------------------------------------------------------------- */

  transaction(): Transaction {
    return this._db.batch();
  }

  async commit(tsx: Transaction): Promise<void> {
    return new Promise((resolve, reject) => {
      tsx.write((e?: Error) => {
        e ? reject(parseError(e)) : resolve(undefined);
      });
    });
  }

  /**
   * Return an iterator for all key/values that start with the given prefix. RocksDB stores keys in lexicographical
   * order, so this iterator will continue serving keys in order until it receives one that has a lexicographic order
   * greater than the prefix.
   */
  iteratorByPrefix(prefix: Buffer, options: AbstractRocksDB.IteratorOptions = {}): Iterator {
    const prefixOptions: AbstractRocksDB.IteratorOptions = {
      gte: prefix,
    };
    const nextPrefix = bytesIncrement(new Uint8Array(prefix));
    if (nextPrefix.isErr()) {
      throw nextPrefix.error;
    }
    if (nextPrefix.value.length === prefix.length) {
      prefixOptions.lt = Buffer.from(nextPrefix.value);
    }
    return this.iterator({ ...options, ...prefixOptions });
  }
}

export default RocksDB;
