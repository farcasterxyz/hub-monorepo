import { logger } from "../../utils/logger.js";
import { Result, ResultAsync } from "neverthrow";
import {
  rsApproximateSize as rsDbApproximateSize,
  rsCreateDb,
  rsDbClear,
  rsDbClose,
  rsDbCommit,
  rsDbDel,
  rsDbDestroy,
  rsDbForEachIteratorByOpts,
  rsDbForEachIteratorByPrefix,
  rsDbGet,
  rsDbGetMany,
  rsDbLocation,
  rsDbOpen,
  rsDbPut,
  RustDb,
  rustErrorToHubError,
  rsDbCountKeysAtPrefix,
  rsDbDeleteAllKeysInRange,
} from "../../rustfunctions.js";
import { PageOptions } from "storage/stores/types.js";

export type DbStatus = "new" | "opening" | "open" | "closing" | "closed";

export const DB_DIRECTORY = ".rocks";
const DB_NAME_DEFAULT = "farcaster";

const log = logger.child({
  component: "RocksDB",
});

export type DbKeyValue = {
  key: Buffer;
  value?: Buffer | undefined;
};

export class RocksDbTransaction {
  private _ops: DbKeyValue[] = [];

  put(key: Buffer, value: Buffer): RocksDbTransaction {
    this._ops.push({ key, value });
    return this;
  }

  del(key: Buffer): RocksDbTransaction {
    this._ops.push({ key });
    return this;
  }

  getKeyValues(): DbKeyValue[] {
    return this._ops;
  }
}

export type RocksDbIteratorOptions = {
  gte?: Buffer | undefined;
  gt?: Buffer | undefined;
  lt?: Buffer | undefined;
  reverse?: boolean;
};

/**
 * RocksDB extends methods from AbstractRocksDB and wraps the methods in promises. Helper methods for
 * transactions and iterating by prefix are provided at the end of the file.
 */
class RocksDB {
  private _db: RustDb;
  private _status: DbStatus;
  private _name: string | undefined;

  constructor(name?: string) {
    this._name = name;

    const createdDb = Result.fromThrowable(
      () => rsCreateDb(`${DB_DIRECTORY}/${this._name ?? DB_NAME_DEFAULT}`),
      (e) => e,
    )();
    if (createdDb.isErr()) {
      log.error({ error: createdDb.error }, "Error creating RocksDB");
      throw createdDb.error;
    }

    this._db = createdDb.value;
    this._status = "new";
  }

  static fromRustDb(db: RustDb): RocksDB {
    const rocksDb = new RocksDB();
    rocksDb._db = db;
    rocksDb._status = "open";
    return rocksDb;
  }

  get rustDb(): RustDb {
    return this._db;
  }

  get location() {
    return rsDbLocation(this._db);
  }

  get status(): DbStatus {
    return this._status;
  }

  async put(key: Buffer, value: Buffer): Promise<void> {
    const v = await ResultAsync.fromPromise(rsDbPut(this._db, key, value), (e) => rustErrorToHubError(e));
    if (v.isErr()) {
      throw v.error;
    }

    return v.value;
  }

  async get(key: Buffer): Promise<Buffer> {
    const v = await ResultAsync.fromPromise(rsDbGet(this._db, key), (e) => rustErrorToHubError(e));
    if (v.isErr()) {
      throw v.error;
    }

    return v.value;
  }

  async getMany(keys: Buffer[]): Promise<(Buffer | undefined)[]> {
    const v = await ResultAsync.fromPromise(rsDbGetMany(this._db, keys), (e) => rustErrorToHubError(e));
    if (v.isErr()) {
      throw v.error;
    }

    return v.value;
  }

  async del(key: Buffer): Promise<void> {
    const v = await ResultAsync.fromPromise(rsDbDel(this._db, key), (e) => rustErrorToHubError(e));
    if (v.isErr()) {
      throw v.error;
    }

    return v.value;
  }

  open(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.status === "opening") {
        reject(new Error("db is opening"));
      } else if (this.status === "closing") {
        reject(new Error("db is closing"));
      } else if (this.status === "open") {
        resolve(undefined);
      } else {
        this._status = "opening";
        rsDbOpen(this._db);
        this._status = "open";
        resolve(undefined);
      }
    });
  }

  close(): void {
    rsDbClose(this._db);
    this._status = "closed";
  }

  clear(): void {
    rsDbClear(this._db);
  }

  async destroy(): Promise<void> {
    if (this.status === "open") {
      this.close();
    }
    return rsDbDestroy(this._db);
  }

  /* -------------------------------------------------------------------------- */
  /*                          Custom Farcaster Methods                          */
  /* -------------------------------------------------------------------------- */

  transaction(): RocksDbTransaction {
    return new RocksDbTransaction();
  }

  async commit(tsx: RocksDbTransaction): Promise<void> {
    return await rsDbCommit(this._db, tsx.getKeyValues());
  }

  async countKeysAtPrefix(prefix: Buffer): Promise<number> {
    return await rsDbCountKeysAtPrefix(this._db, prefix);
  }

  async deleteAllKeysInRange(options: RocksDbIteratorOptions): Promise<boolean> {
    return await rsDbDeleteAllKeysInRange(this._db, options);
  }

  /**
   * forEach iterator, but with a prefix. See @forEachIterator for more details
   */
  async forEachIteratorByPrefix(
    prefix: Buffer,
    callback: (key: Buffer, value: Buffer | undefined) => Promise<boolean> | boolean | Promise<void> | void,
    pageOptions: PageOptions = {},
  ): Promise<boolean> {
    return await rsDbForEachIteratorByPrefix(this._db, prefix, pageOptions, callback);
  }

  /**
   *
   * forEach iterator using iterator opts
   */
  async forEachIteratorByOpts(
    options: RocksDbIteratorOptions,
    callback: (key: Buffer | undefined, value: Buffer | undefined) => Promise<boolean> | boolean | void,
  ): Promise<boolean> {
    return await rsDbForEachIteratorByOpts(this._db, options, callback);
  }

  async approximateSize(): Promise<number> {
    return rsDbApproximateSize(this._db);
  }
}

export default RocksDB;
