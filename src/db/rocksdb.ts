import { err, ok, Result } from 'neverthrow';
import RocksDB from 'rocksdb';
import { AbstractBatch } from '~/abstract-leveldown';

const DB_PREFIX = '.rocks';

class DB {
  _db: RocksDB;
  private _hasOpened = false;

  constructor(name: string) {
    this._db = new RocksDB(`${DB_PREFIX}/${name}`);
  }

  get status() {
    return this._db.status;
  }

  async put(key: string, value: any): Promise<Result<void, string>> {
    const res = await this.open();
    if (res.isErr()) return err(res.error);

    return new Promise((resolve) => {
      this._db.put(key, value, (e?: any) => {
        resolve(e ? err(e) : ok(undefined));
      });
    });
  }

  async get(key: string): Promise<Result<string, string>> {
    const res = await this.open();
    if (res.isErr()) return err(res.error);

    return new Promise((resolve) => {
      this._db.get(key, { asBuffer: false }, (e?: any, value?: any) => {
        resolve(e ? err(e) : ok(value));
      });
    });
  }

  async getMany(keys: string[]): Promise<Result<string[], string>> {
    const res = await this.open();
    if (res.isErr()) return err(res.error);

    return new Promise((resolve) => {
      this._db.getMany(keys, { asBuffer: false }, (e?: any, value?: any) => {
        resolve(e ? err(e) : ok(value));
      });
    });
  }

  async del(key: string): Promise<Result<void, string>> {
    const res = await this.open();
    if (res.isErr()) return err(res.error);

    return new Promise((resolve) => {
      this._db.del(key, (e?: any) => {
        resolve(e ? err(e) : ok(undefined));
      });
    });
  }

  async batch(operations: AbstractBatch<string, string>[]): Promise<Result<void, string>> {
    const res = await this.open();
    if (res.isErr()) return err(res.error);

    return new Promise((resolve) => {
      this._db.batch(operations, (e?: any) => {
        resolve(e ? err(e) : ok(undefined));
      });
    });
  }

  iteratorByPrefix(prefix: string, options?: RocksDB.IteratorOptions): RocksDB.Iterator {
    const nextChar = String.fromCharCode(prefix.slice(-1).charCodeAt(0) + 1);
    const prefixBound = prefix.slice(0, -1) + nextChar;
    return this._db.iterator({ ...options, gte: prefix, lt: prefixBound });
  }

  open(): Promise<Result<void, string>> {
    return new Promise((resolve) => {
      if (this._db.status === 'opening') {
        resolve(err('db is opening'));
      } else if (this._db.status === 'closing') {
        resolve(err('db is closing'));
      } else if (this._db.status === 'open') {
        resolve(ok(undefined));
      } else {
        this._db.open({ createIfMissing: true, errorIfExists: false }, (e?: any) => {
          if (!e) {
            this._hasOpened = true;
          }
          resolve(e ? err(e) : ok(undefined));
        });
      }
    });
  }

  close(): Promise<Result<void, string>> {
    return new Promise((resolve) => {
      this._db.close((e?: any) => {
        resolve(e ? err(e) : ok(undefined));
      });
    });
  }

  clear(): Promise<Result<void, string>> {
    return new Promise((resolve) => {
      this._db.clear((e?: any) => {
        resolve(e ? err(e) : ok(undefined));
      });
    });
  }

  async destroy(): Promise<Result<void, string>> {
    // TODO: call close first if db is not closed
    return new Promise((resolve) => {
      if (!this._hasOpened) {
        resolve(err('db never opened'));
      } else {
        RocksDB.destroy(this._db.location, (e?: any) => {
          resolve(e ? err(e) : ok(undefined));
        });
      }
    });
  }
}

export default DB;
