import { HubError } from "@farcaster/hub-nodejs";
import { logger } from "../../utils/logger.js";
import * as tar from "tar";
import * as fs from "fs";
import { err, ok, Result, ResultAsync } from "neverthrow";
import path from "path";
import {
  createDb,
  dbClear,
  dbClose,
  dbCommit,
  dbDel,
  dbDestroy,
  dbForEachIteratorByOpts,
  dbForEachIteratorByPrefix,
  dbGet,
  dbGetMany,
  dbLocation,
  dbPut,
  RustDb,
  rustErrorToHubError,
} from "../../rustfunctions.js";
import { PageOptions } from "storage/stores/types.js";

export type DbStatus = "opening" | "open" | "closing" | "closed";

export const DB_DIRECTORY = ".rocks";
const DB_NAME_DEFAULT = "farcaster";

const log = logger.child({
  component: "RocksDB",
});

const parseError = (e: Error): HubError => {
  if (/NotFound/i.test(e.message)) {
    return new HubError("not_found", e);
  }
  return new HubError("unavailable.storage_failure", e);
};

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
  gte?: Buffer;
  gt?: Buffer;
  lt?: Buffer;
  reverse?: boolean;
};

/**
 * RocksDB extends methods from AbstractRocksDB and wraps the methods in promises. Helper methods for
 * transactions and iterating by prefix are provided at the end of the file.
 */
class RocksDB {
  protected _db: RustDb;
  private _status: DbStatus = "closed";

  constructor(name?: string) {
    const createdDb = Result.fromThrowable(
      () => createDb(`${DB_DIRECTORY}/${name ?? DB_NAME_DEFAULT}`),
      (e) => e,
    )();
    if (createdDb.isErr()) {
      log.error({ error: createdDb.error }, "Error creating RocksDB");
      throw createdDb.error;
    }

    this._db = createdDb.value;
    this._status = "open";
  }

  get rustDb(): RustDb {
    return this._db;
  }

  get location() {
    return dbLocation(this._db);
  }

  get status(): DbStatus {
    return this._status;
  }

  async put(key: Buffer, value: Buffer): Promise<void> {
    const v = await ResultAsync.fromPromise(dbPut(this._db, key, value), (e) => rustErrorToHubError(e));
    if (v.isErr()) {
      throw v.error;
    }

    return v.value;
  }

  async get(key: Buffer): Promise<Buffer> {
    const v = await ResultAsync.fromPromise(dbGet(this._db, key), (e) => rustErrorToHubError(e));
    if (v.isErr()) {
      throw v.error;
    }

    return v.value;
  }

  async getMany(keys: Buffer[]): Promise<Buffer[]> {
    const v = await ResultAsync.fromPromise(dbGetMany(this._db, keys), (e) => rustErrorToHubError(e));
    if (v.isErr()) {
      throw v.error;
    }

    return v.value;
  }

  async del(key: Buffer): Promise<void> {
    const v = await ResultAsync.fromPromise(dbDel(this._db, key), (e) => rustErrorToHubError(e));
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
      }
    });
  }

  close(): void {
    dbClose(this._db);
  }

  clear(): void {
    dbClear(this._db);
  }

  async destroy(): Promise<void> {
    if (this.status === "open") {
      this.close();
    }
    return dbDestroy(this._db);
  }

  /* -------------------------------------------------------------------------- */
  /*                          Custom Farcaster Methods                          */
  /* -------------------------------------------------------------------------- */

  transaction(): RocksDbTransaction {
    return new RocksDbTransaction();
  }

  async commit(tsx: RocksDbTransaction): Promise<void> {
    return dbCommit(this._db, tsx.getKeyValues());
  }

  /**
   * forEach iterator, but with a prefix. See @forEachIterator for more details
   */
  async forEachIteratorByPrefix(
    prefix: Buffer,
    callback: (key: Buffer, value: Buffer | undefined) => Promise<boolean> | boolean | Promise<void> | void,
    pageOptions: PageOptions = {},
  ): Promise<void> {
    return dbForEachIteratorByPrefix(this._db, prefix, pageOptions, callback);
  }

  /**
   *
   * forEach iterator using iterator opts
   */
  async forEachIteratorByOpts(
    options: RocksDbIteratorOptions,
    callback: (key: Buffer | undefined, value: Buffer | undefined) => Promise<boolean> | boolean | void,
  ): Promise<void> {
    return dbForEachIteratorByOpts(this._db, options, callback);
  }

  async approximateSize(): Promise<number> {
    return 0; // TODO: There isn't a good way to do this, we need to do it manually.
  }
}

export default RocksDB;

export async function createTarBackup(inputDir: string): Promise<Result<string, Error>> {
  // Output path is {dirname}-{date as yyyy-mm-dd}-{timestamp}.tar.gz
  const outputFilePath = `${inputDir}-${new Date().toISOString().split("T")[0]}-${Math.floor(
    Date.now() / 1000,
  )}.tar.gz`;

  const start = Date.now();
  log.info({ inputDir, outputFilePath }, "Creating tarball");

  return new Promise((resolve) => {
    tar
      .c({ gzip: true, file: outputFilePath, cwd: path.dirname(inputDir) }, [path.basename(inputDir)])
      .then(() => {
        const stats = fs.statSync(outputFilePath);
        log.info({ size: stats.size, outputFilePath, timeTakenMs: Date.now() - start }, "Tarball created");
        resolve(ok(outputFilePath));
      })
      .catch((e: Error) => {
        log.error({ error: e, inputDir, outputFilePath }, "Error creating tarball");
        resolve(err(e));
      });
  });
}
