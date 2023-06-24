import { bytesIncrement, HubError, isHubError } from '@farcaster/hub-nodejs';
import { AbstractBatch, AbstractChainedBatch, AbstractIterator } from 'abstract-leveldown';
import { mkdir } from 'fs';
import AbstractRocksDB from '@farcaster/rocksdb';
import { logger } from '../../utils/logger.js';

export const DB_DIRECTORY = '.rocks';
export const MAX_DB_ITERATOR_OPEN_MILLISECONDS = 60 * 1000; // 1 min
const DB_NAME_DEFAULT = 'farcaster';

export type Transaction = AbstractChainedBatch<Buffer, Buffer>;

const log = logger.child({
  component: 'RocksDB',
});

const parseError = (e: Error): HubError => {
  if (/NotFound/i.test(e.message)) {
    return new HubError('not_found', e);
  }
  return new HubError('unavailable.storage_failure', e);
};

export class Iterator {
  protected _iterator: AbstractIterator<AbstractRocksDB.Bytes, AbstractRocksDB.Bytes>;
  private _isOpen: boolean;

  constructor(iterator: AbstractIterator<AbstractRocksDB.Bytes, AbstractRocksDB.Bytes>) {
    this._iterator = iterator;
    this._isOpen = true;
  }

  get isOpen() {
    return this._isOpen;
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
    if (this._iterator['_ended']) return Promise.resolve(undefined);

    return new Promise((resolve, reject) => {
      this._iterator.end((err: Error | undefined) => {
        if (!err) {
          this._isOpen = false;
        }
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

  /** This set and cron are used to check whether iterators are open
   * (i.e. iterator.end) has not been called for MAX_DB_ITERATOR_OPEN_MILLISECONDS
   */
  private _openIterators: Set<{
    iterator: Iterator;
    openTimestamp: number;
    options: AbstractRocksDB.IteratorOptions | undefined;
  }>;
  private _iteratorCheckTimer?: NodeJS.Timer;

  constructor(name?: string) {
    this._db = new AbstractRocksDB(`${DB_DIRECTORY}/${name ?? DB_NAME_DEFAULT}`);
    this._openIterators = new Set();
    this._iteratorCheckTimer = setInterval(() => {
      const now = Date.now();
      const openIterators = [...this._openIterators].flatMap((entry) => {
        if (!entry.iterator.isOpen) {
          return [];
        } else {
          if (now - entry.openTimestamp >= MAX_DB_ITERATOR_OPEN_MILLISECONDS) {
            log.warn(
              entry.options,
              `RocksDB iterator open
                for more than ${MAX_DB_ITERATOR_OPEN_MILLISECONDS} ms`
            );
          }
          return [entry];
        }
      });
      this._openIterators = new Set(openIterators);
    }, MAX_DB_ITERATOR_OPEN_MILLISECONDS);
  }

  get location() {
    return this._db['location'];
  }

  get status() {
    return this._db.status;
  }

  get openIterators() {
    return this._openIterators;
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
        mkdir(this._db['location'], { recursive: true }, (fsErr: Error | null) => {
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
        AbstractRocksDB.destroy(this._db['location'], (e?: Error) => {
          e ? reject(parseError(e)) : resolve(undefined);
        });
      }
    });
  }

  iterator(options?: AbstractRocksDB.IteratorOptions): Iterator {
    const iterator = new Iterator(this._db.iterator({ ...options, valueAsBuffer: true, keyAsBuffer: true }));
    this._openIterators.add({ iterator: iterator, openTimestamp: Date.now(), options: options });
    return iterator;
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

  async compact(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Compact all keys
      this._db.compactRange(Buffer.from([0]), Buffer.from([255]), (e?: Error) => {
        e ? reject(parseError(e)) : resolve(undefined);
      });
    });
  }
}

export default RocksDB;
