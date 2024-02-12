import { bytesIncrement, HubError, HubResult, isHubError } from "@farcaster/hub-nodejs";
import { AbstractBatch, AbstractChainedBatch, AbstractIterator } from "abstract-leveldown";
import { mkdir } from "fs";
import AbstractRocksDB from "@farcaster/rocksdb";
import { logger } from "../../utils/logger.js";
import * as tar from "tar";
import * as fs from "fs";
import { err, ok, Result } from "neverthrow";
import path from "path";

export const DB_DIRECTORY = ".rocks";
export const MAX_DB_ITERATOR_OPEN_MILLISECONDS = 60 * 1000; // 1 min
const DB_NAME_DEFAULT = "farcaster";

export type Transaction = AbstractChainedBatch<Buffer, Buffer>;

const log = logger.child({
  component: "RocksDB",
});

const parseError = (e: Error): HubError => {
  if (/NotFound/i.test(e.message)) {
    return new HubError("not_found", e);
  }
  return new HubError("unavailable.storage_failure", e);
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
      // biome-ignore lint/suspicious/noAssignInExpressions: legacy code, avoid using ignore for new code, to fix
      while ((kv = await this.next())) {
        yield kv;
      }
    } catch (e) {
      if (!(isHubError(e) && e.errCode === "not_found")) {
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
          reject(new HubError("not_found", "record not found"));
        } else {
          resolve([key as Buffer | undefined, value as Buffer | undefined]);
        }
      });
    });
  }

  async end(): Promise<void> {
    if (this._iterator["_ended"]) return Promise.resolve(undefined);

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
    id: number;
    openTimestamp: number;
    options: AbstractRocksDB.IteratorOptions | undefined;
    stackTrace: string;
    timeoutMs: number;
  }>;
  private _openIteratorId = 0;
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
          const timeout = entry.timeoutMs ?? MAX_DB_ITERATOR_OPEN_MILLISECONDS;
          const openFor = now - entry.openTimestamp;
          if (openFor >= timeout) {
            log.warn(
              {
                options: entry.options,
                openForMs: openFor,
                stackTrace: entry.stackTrace,
                id: entry.id,
                timeoutMs: entry.timeoutMs,
              },
              "RocksDB iterator open for longer than timeout",
            );
          }
          return [entry];
        }
      });
      this._openIterators = new Set(openIterators);
    }, MAX_DB_ITERATOR_OPEN_MILLISECONDS);
  }

  get location() {
    return this._db["location"];
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
      if (this._db.status === "opening") {
        reject(new Error("db is opening"));
      } else if (this._db.status === "closing") {
        reject(new Error("db is closing"));
      } else if (this._db.status === "open") {
        resolve(undefined);
      } else {
        mkdir(this._db["location"], { recursive: true }, (fsErr: Error | null) => {
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
    // Close the iterator check timer
    if (this._iteratorCheckTimer) {
      clearInterval(this._iteratorCheckTimer);
    }

    return new Promise((resolve, reject) => {
      this._db.close((e?: Error) => {
        e ? reject(parseError(e)) : resolve(undefined);
      });
    });
  }

  clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._db["clear"]((e?: Error) => {
        e ? reject(parseError(e)) : resolve(undefined);
      });
    });
  }

  async destroy(): Promise<void> {
    if (this._db.status === "open") {
      await this.close();
    }
    return new Promise((resolve, reject) => {
      if (!this._hasOpened) {
        reject(new Error("db never opened"));
      } else {
        AbstractRocksDB.destroy(this._db["location"], (e?: Error) => {
          e ? reject(parseError(e)) : resolve(undefined);
        });
      }
    });
  }

  iterator(options?: AbstractRocksDB.IteratorOptions, timeoutMs = MAX_DB_ITERATOR_OPEN_MILLISECONDS): Iterator {
    const stackTrace = new Error().stack || "<no stacktrace>";

    const iterator = new Iterator(this._db.iterator({ ...options, valueAsBuffer: true, keyAsBuffer: true }));
    this._openIterators.add({
      id: this._openIteratorId++,
      iterator: iterator,
      openTimestamp: Date.now(),
      options: options,
      stackTrace,
      timeoutMs,
    });
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

  /**
   * forEach iterator, but with a prefix. See @forEachIterator for more details
   */
  async forEachIteratorByPrefix<T>(
    prefix: Buffer,
    callback: (key: Buffer | undefined, value: Buffer | undefined) => Promise<T> | T,
    options: AbstractRocksDB.IteratorOptions = {},
    timeout = MAX_DB_ITERATOR_OPEN_MILLISECONDS,
  ): Promise<T | undefined> {
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

    return this.forEachIterator(callback, { ...options, ...prefixOptions }, timeout);
  }

  /**
   * An iterator that implements a callback. If the callback
   * 1. returns true/value
   * 2. returns a promise that resolves to true/value
   * 3. throws an error
   * 4. Finishes iterating
   * 5. Times out
   *
   * We'll close the iterator
   */
  async forEachIterator<T>(
    callback: (key: Buffer | undefined, value: Buffer | undefined) => Promise<T> | T,
    options: AbstractRocksDB.IteratorOptions = {},
    timeoutMs = MAX_DB_ITERATOR_OPEN_MILLISECONDS,
  ): Promise<T | undefined> {
    const iterator = this.iterator(options, timeoutMs);
    const stacktrace = new Error().stack || "<no stacktrace>";
    const timeoutId = setTimeout(async () => {
      await iterator.end();
      log.warn({ ...options, stacktrace }, "forEachIterator timed out. Was force closed");
    }, timeoutMs);

    let returnValue: T | undefined | void;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    let caughtError: any;

    // The try/catch is outside the for loop so that we can catch errors thrown by the iterator
    // the most common error is "cannot call next() after end()", which is when the iterator has timed out
    try {
      for await (const [key, value] of iterator) {
        try {
          returnValue = await callback(key, value);
          if (returnValue) {
            await iterator.end();
            break;
          }
        } catch (e) {
          await iterator.end();
          caughtError = e;
          break;
        }
      }
    } catch (e) {
      if (e instanceof Error && e.message === "cannot call next() after end()") {
        // The iterator timed out
        log.warn(options, "forEachIterator: iterator timed out");
      } else {
        await iterator.end();
        caughtError = e;
      }
    }

    // The iterator should be closed here, but log an error if it isn't
    if (iterator.isOpen) {
      // Find the iterator entry in the iterators set
      const iteratorEntry = [...this._openIterators].find((entry) => {
        return entry.iterator === iterator;
      });

      if (iteratorEntry) {
        const logOpts = {
          options: iteratorEntry.options,
          openSecs: Date.now() - iteratorEntry.openTimestamp,
          stackTrace: iteratorEntry.stackTrace,
          id: iteratorEntry.id,
        };

        logger.error(logOpts, "forEachIterator: iterator was not closed. Force closing");
        iterator.end();
      } else {
        logger.error("forEachIterator: iterator was not closed and could not find iterator entry");
      }
    }

    clearTimeout(timeoutId);

    // If we caught and error, throw it
    if (caughtError) {
      throw caughtError;
    }

    // If the callback returned a value, return it
    if (returnValue) {
      return returnValue;
    } else {
      return undefined;
    }
  }

  async compact(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Compact all keys
      this._db.compactRange(Buffer.from([0]), Buffer.from([255]), (e?: Error) => {
        e ? reject(parseError(e)) : resolve(undefined);
      });
    });
  }

  async approximateSize(): Promise<number> {
    return new Promise((resolve) => {
      this._db.approximateSize(Buffer.from([0]), Buffer.from([255]), (e?: Error, size?: number) => {
        resolve(size || -1);
      });
    });
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
