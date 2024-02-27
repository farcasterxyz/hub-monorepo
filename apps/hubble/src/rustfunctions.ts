// This is a bridge between the Rust code and the TS code.
// We import the Rust code as a NodeJS module, and then export it as a JS function.
// Note that we need to use the `createRequire` function to import the module, since it
// is binary code. If we used `import` instead, it would be interpreted as a JS module, and
// we would get an error becaues it would try to parse it as JS
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const lib = require("./addon/index.node");

import { HubError, HubErrorCode, bytesCompare, validations } from "@farcaster/hub-nodejs";
import { PAGE_SIZE_MAX, PageOptions } from "./storage/stores/types.js";
import { UserMessagePostfix } from "./storage/db/types.js";
import { DbKeyValue, RocksDbIteratorOptions } from "./storage/db/rocksdb.js";
import { logger } from "./utils/logger.js";

const log = logger.child({
  component: "RustFunctions",
});

export class RustDynStore {}
export class RustDb {}

// Type returned from Rust which is equivalent to the TypeScript type `MessagesPage`
export class RustMessagesPage {
  messageBytes?: Buffer[];
  nextPageToken?: Buffer;
}

// Use this function in TypeScript to call the rust code.
export function nativeBlake3Hash20(data: Uint8Array): Uint8Array {
  const dataBuf = Buffer.from(data);

  return new Uint8Array(lib.blake3_20(dataBuf));
}

export function nativeEd25519SignMessageHash(hash: Uint8Array, signerKey: Uint8Array): Uint8Array {
  const hashBuf = Buffer.from(hash);
  const signerKeyBuf = Buffer.from(signerKey);

  return lib.ed25519_signMessageHash(hashBuf, signerKeyBuf);
}

// Use this function in TypeScript to call the rust code.
export function nativeEd25519Verify(signature: Uint8Array, hash: Uint8Array, signer: Uint8Array): boolean {
  const sigBuf = Buffer.from(signature);
  const hashBuf = Buffer.from(hash);
  const signerBuf = Buffer.from(signer);

  return lib.ed25519_verify(sigBuf, hashBuf, signerBuf) === 1;
}

/** Fast, native implementation of validation methods to improve perf */
export const nativeValidationMethods: validations.ValidationMethods = {
  ed25519_verify: async (s: Uint8Array, m: Uint8Array, p: Uint8Array) => nativeEd25519Verify(s, m, p),
  ed25519_signMessageHash: async (m: Uint8Array, s: Uint8Array) => nativeEd25519SignMessageHash(m, s),
  blake3_20: (message: Uint8Array) => nativeBlake3Hash20(message),
};

export const rustErrorToHubError = (e: unknown) => {
  // Split the error string by "/", the first part is the error code, the second part is the error message
  const [errCode, errMsg] = (e as Error).message.split("/");
  return new HubError(errCode as HubErrorCode, errMsg ?? "");
};

/** Create or Open a DB at a give path */
export const createDb = (path: string): RustDb => {
  const db = lib.createDb(path);

  return db as RustDb;
};

export const dbOpen = (db: RustDb): void => {
  lib.dbOpen.call(db);
};

export const dbClear = (db: RustDb) => {
  return lib.dbClear.call(db);
};

export const dbClose = (db: RustDb) => {
  return lib.dbClose.call(db);
};

export const dbDestroy = (db: RustDb) => {
  return lib.dbDestroy.call(db);
};

export const dbLocation = (db: RustDb): string => {
  return lib.dbLocation.call(db);
};

export const dbGet = async (db: RustDb, key: Uint8Array): Promise<Buffer> => {
  return await lib.dbGet.call(db, key);
};

export const dbGetMany = async (db: RustDb, keys: Uint8Array[]): Promise<(Buffer | undefined)[]> => {
  const results = await lib.dbGetMany.call(db, keys);
  // If a key was not found, it is set to an empty buffer. We want to return undefined in that case
  return results.map((result: Buffer) => (result.length === 0 ? undefined : result));
};

export const dbPut = async (db: RustDb, key: Uint8Array, value: Uint8Array): Promise<void> => {
  return await lib.dbPut.call(db, key, value);
};

export const dbDel = async (db: RustDb, key: Uint8Array): Promise<void> => {
  return await lib.dbDel.call(db, key);
};

export const dbCommit = async (db: RustDb, keyValues: DbKeyValue[]): Promise<void> => {
  return await lib.dbCommit.call(db, keyValues);
};

export const dbForEachIteratorByPrefix = async (
  db: RustDb,
  prefix: Uint8Array,
  pageOptions: PageOptions,
  cb: (key: Buffer, value: Buffer | undefined) => Promise<boolean> | boolean | Promise<void> | void,
): Promise<boolean> => {
  let dbKeyValues: DbKeyValue[] = [];
  const batchPageSize = pageOptions.pageSize ?? PAGE_SIZE_MAX;

  let allFinished = false;
  let nextPageToken = undefined;
  let stopped = false;
  let batchPageOptions = { ...pageOptions };

  do {
    allFinished = await lib.dbForEachIteratorByPrefix.call(
      db,
      prefix,
      batchPageOptions,
      (key: Buffer, value: Buffer | undefined) => {
        dbKeyValues.push({ key, value });

        if (dbKeyValues.length > batchPageSize) {
          nextPageToken = new Uint8Array(key.subarray(prefix.length));
          return true; // Stop the iteration
        }

        return false; // Continue the iteration
      },
    );

    // Iterate over the key-values
    for (const kv of dbKeyValues) {
      const shouldStop = await cb(kv.key, kv.value);
      if (shouldStop) {
        stopped = true;
        break;
      }
    }

    batchPageOptions = { ...pageOptions, pageToken: nextPageToken };
    dbKeyValues = []; // Clear the key-values array
  } while (!allFinished && !stopped && nextPageToken);

  return !stopped && allFinished;
};

export const dbForEachIteratorByOpts = async (
  db: RustDb,
  iteratorOpts: RocksDbIteratorOptions,
  cb: (key: Buffer, value: Buffer | undefined) => Promise<boolean> | boolean | void,
  overridePageSize?: number, // Only for tests
): Promise<boolean> => {
  let dbKeyValues: DbKeyValue[] = [];
  const batchPageSize = overridePageSize ?? PAGE_SIZE_MAX;

  let stopped = false;
  let nextPageToken = undefined;
  let allFinished = false;

  do {
    const batchPageOptions = { ...iteratorOpts };
    if (nextPageToken) {
      if (iteratorOpts.reverse) {
        batchPageOptions.lt = nextPageToken;
      } else {
        batchPageOptions.gt = nextPageToken;
        batchPageOptions.gte = undefined;
      }
    }

    allFinished = await lib.dbForEachIteratorByOpts.call(db, batchPageOptions, (key: Buffer, value: Buffer) => {
      dbKeyValues.push({ key, value });
      if (dbKeyValues.length >= batchPageSize) {
        nextPageToken = new Uint8Array(key);
        return true; // Stop the iteration
      }
      return false; // Continue the iteration
    });

    for (const kv of dbKeyValues) {
      const shouldStop = await cb(kv.key, kv.value);
      if (shouldStop) {
        stopped = true;
        break;
      }
    }

    dbKeyValues = []; // Clear the key-values array
  } while (!allFinished && !stopped && nextPageToken);

  return !stopped && allFinished;
};

/** Create a reaction Store */
export const createReactionStore = (db: RustDb, pruneSizeLimit: number, pruneTimeLimit: number): RustDynStore => {
  const store = lib.createReactionStore(db, pruneSizeLimit, pruneTimeLimit);

  return store as RustDynStore;
};

export const getMessage = async (
  store: RustDynStore,
  fid: number,
  set: UserMessagePostfix,
  tsHash: Uint8Array,
): Promise<Buffer> => {
  return await lib.getMessage.call(store, fid, set, tsHash);
};

/** This is dynamically dispatched to any Store that you pass in */
export const merge = async (store: RustDynStore, messageBytes: Uint8Array): Promise<Buffer> => {
  return await lib.merge.call(store, messageBytes);
};

/** Revoke a message from the store */
export const revoke = async (store: RustDynStore, messageBytes: Uint8Array): Promise<Buffer> => {
  return await lib.revoke.call(store, messageBytes);
};

/** This is dynamically dispatched to any Store, and the messages will be returned from that store */
export const pruneMessages = async (
  store: RustDynStore,
  fid: number,
  cachedCount: number,
  units: number,
): Promise<Buffer> => {
  return await lib.pruneMessages.call(store, fid, cachedCount, units);
};

export const getAllMessagesByFid = async (
  store: RustDynStore,
  fid: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getAllMessagesByFid.call(store, fid, pageOptions);
};

export const getReactionAdd = async (
  store: RustDynStore,
  fid: number,
  type: number,
  targetCastIdBytes: Buffer,
  targetUrl: string,
): Promise<Buffer> => {
  return await lib.getReactionAdd.call(store, fid, type, targetCastIdBytes, targetUrl);
};

export const getReactionRemove = async (
  store: RustDynStore,
  fid: number,
  type: number,
  targetCastIdBytes: Buffer,
  targetUrl: string,
): Promise<Buffer> => {
  return await lib.getReactionRemove.call(store, fid, type, targetCastIdBytes, targetUrl);
};

export const getReactionAddsByFid = async (
  store: RustDynStore,
  fid: number,
  type: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getReactionAddsByFid.call(store, fid, type, pageOptions);
};

export const getReactionRemovesByFid = async (
  store: RustDynStore,
  fid: number,
  type: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getReactionRemovesByFid.call(store, fid, type, pageOptions);
};

export const getReactionsByTarget = async (
  store: RustDynStore,
  targetCastIdBytes: Buffer,
  targetUrl: string,
  type: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getReactionsByTarget.call(store, targetCastIdBytes, targetUrl, type, pageOptions);
};
