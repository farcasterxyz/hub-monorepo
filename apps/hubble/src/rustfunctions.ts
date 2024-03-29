// This is a bridge between the Rust code and the TS code.
// We import the Rust code as a NodeJS module, and then export it as a JS function.
// Note that we need to use the `createRequire` function to import the module, since it
// is binary code. If we used `import` instead, it would be interpreted as a JS module, and
// we would get an error because it would try to parse it as JS
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const lib = require("./addon/index.node");

import { HubError, HubErrorCode, validations } from "@farcaster/hub-nodejs";
import { PAGE_SIZE_MAX, PageOptions } from "./storage/stores/types.js";
import { UserMessagePostfix } from "./storage/db/types.js";
import { DbKeyValue, RocksDbIteratorOptions } from "./storage/db/rocksdb.js";
import { logger } from "./utils/logger.js";
import { Result } from "neverthrow";
import { NodeMetadata, TrieSnapshot } from "network/sync/merkleTrie.js";

// Also set up the log flush listener
logger.onFlushListener(() => {
  lib.flushLogBuffer();
});

const RustMerkleTrieBrand = Symbol("RustMerkleTrie");
export class RustMerkleTrie {
  // @ts-ignore
  private [RustMerkleTrieBrand]: never;
}

const RustDynStoreBrand = Symbol("RustDynStore");
export class RustDynStore {
  // @ts-ignore
  private [RustDynStoreBrand]: never;
}

const RustDbBrand = Symbol("RustDb");
export class RustDb {
  // @ts-ignore
  private [RustDbBrand]: never;
}

const RustStoreEventHandlerBrand = Symbol("RustStoreEventHandler");
export class RustStoreEventHandler {
  // @ts-ignore
  private [RustStoreEventHandlerBrand]: never;
}

// Type returned from Rust which is equivalent to the TypeScript type `MessagesPage`
export class RustMessagesPage {
  messageBytes?: Buffer[];
  nextPageToken?: Buffer;
}

// Use this function in TypeScript to call the rust code.
export function rsBlake3Hash20(data: Uint8Array): Uint8Array {
  const dataBuf = Buffer.from(data);

  return new Uint8Array(lib.blake3_20(dataBuf));
}

export function rsEd25519SignMessageHash(hash: Uint8Array, signerKey: Uint8Array): Uint8Array {
  const hashBuf = Buffer.from(hash);
  const signerKeyBuf = Buffer.from(signerKey);

  return lib.ed25519_signMessageHash(hashBuf, signerKeyBuf);
}

// Use this function in TypeScript to call the rust code.
export function rsEd25519Verify(signature: Uint8Array, hash: Uint8Array, signer: Uint8Array): boolean {
  const sigBuf = Buffer.from(signature);
  const hashBuf = Buffer.from(hash);
  const signerBuf = Buffer.from(signer);

  return lib.ed25519_verify(sigBuf, hashBuf, signerBuf) === 1;
}

/** Fast, native implementation of validation methods to improve perf */
export const rsValidationMethods: validations.ValidationMethods = {
  ed25519_verify: async (s: Uint8Array, m: Uint8Array, p: Uint8Array) => rsEd25519Verify(s, m, p),
  ed25519_signMessageHash: async (m: Uint8Array, s: Uint8Array) => rsEd25519SignMessageHash(m, s),
  blake3_20: (message: Uint8Array) => rsBlake3Hash20(message),
};

export const rustErrorToHubError = (e: unknown) => {
  // Split the error string by "/", the first part is the error code, the second part is the error message
  const [errCode, errMsg] = (e as Error).message.split("/");
  return new HubError(errCode as HubErrorCode, errMsg ?? "");
};

export const rsCreateStatsdClient = (host: string, port: number, prefix: string): void => {
  lib.createStatsdClient(host, port, prefix);
};

/** Create or Open a DB at a give path
 *
 * All rust objects need to be "owned" by someone so that rust can manage its lifecycle. For rust objects like the
 *  `RocksDb` and the `ReactionStore`, we create them as `JsBox<Arc<T>>`. `JsBox` is like Rust's `Box`, except it is
 * owned by the Javascript pointer that is returned. That is,
    - The DB object is owned by the Javascript object that is returned
    - When the Javascript object goes out of scope and is gc'd, it is `drop()`-ed in Rust.

  Since the Rust objects are `Arc<T>` inside a `JsBox`, we can clone them and keep them around in the rust code as we
  please, since the Javascript code will continue to own one `Arc<T>`, making sure that it lasts for the lifetime of
  the program.
*/
export const rsCreateDb = (path: string): RustDb => {
  const db = lib.createDb(path);

  return db as RustDb;
};

export const rsDbOpen = (db: RustDb): void => {
  lib.dbOpen.call(db);
};

export const rsApproximateSize = (db: RustDb): number => {
  return lib.dbApproximateSize.call(db);
};

export const rsCreateTarBackup = (db: RustDb): Promise<string> => {
  return lib.dbCreateTarBackup.call(db);
};

export const rsCreateTarGzip = (filePath: string): Promise<string> => {
  return lib.dbCreateTarGzip(filePath);
};

export const rsDbClear = (db: RustDb) => {
  return lib.dbClear.call(db);
};

export const rsDbClose = (db: RustDb) => {
  return lib.dbClose.call(db);
};

export const rsDbDestroy = (db: RustDb) => {
  return lib.dbDestroy.call(db);
};

export const rsDbLocation = (db: RustDb): string => {
  return lib.dbLocation.call(db);
};

export const rsDbGet = async (db: RustDb, key: Uint8Array): Promise<Buffer> => {
  return await lib.dbGet.call(db, key);
};

export const rsDbGetMany = async (db: RustDb, keys: Uint8Array[]): Promise<(Buffer | undefined)[]> => {
  const results = await lib.dbGetMany.call(db, keys);
  // If a key was not found, it is set to an empty buffer. We want to return undefined in that case
  return results.map((result: Buffer) => (result.length === 0 ? undefined : result));
};

export const rsDbPut = async (db: RustDb, key: Uint8Array, value: Uint8Array): Promise<void> => {
  return await lib.dbPut.call(db, key, value);
};

export const rsDbDel = async (db: RustDb, key: Uint8Array): Promise<void> => {
  return await lib.dbDel.call(db, key);
};

export const rsDbCommit = async (db: RustDb, keyValues: DbKeyValue[]): Promise<void> => {
  return await lib.dbCommit.call(db, keyValues);
};

/**
 * Rust code needs to be memory-safe, which means that we can't pass around iterators like we do in Javascript.
 * This is because the `iterator` reference is valid for only as long as the `db` is valid, and the reference is
 * dropped right after the iterator is finished.

  This specifically means that we need to use iterators as callbacks. The way the iterators are set up is:
  - Call the `forEachIteartor` method with your callback (Either in JS or Rust)
  - Perform all actions in the callback
  - At the end of the iteration, the iterator is returned and closed by Rust

  In JS, we can have async functions as callbacks to the `forEachIterator` methods. This means that the callback
  can take arbitrarily long, and that is bad because keeping iterators open for long periods of time is very
  problematic. Additionally, we can't call async JS methods from rust. To address these both, the iterators are
  automatically paged.

  That means that when you start an iterator:
  1. JS code will fetch a page full of keys and values from rust
  2. Close the iterator right after.
  3. Calls the async callbacks with the cached key, value pairs, which can take as long as needed.
  4. Go back to step 1 to get the next page of key, value pairs.

  This method returns a boolean, which is true if the iteration is finished, and false if it is not.
  - If the iteration was stopped because it hit the pageSize, it returns false (i.e., there are more keys available)
  - If the iteration was stopped because the callback returned true, it returns false (i.e., there are more keys available)

 */
export const rsDbForEachIteratorByPrefix = async (
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

/**
 * Iterator using raw iterator options. See note above for how the paging works.
 */
export const rsDbForEachIteratorByOpts = async (
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

export const rsCreateStoreEventHandler = (
  epoch?: number,
  last_timestamp?: number,
  last_seq?: number,
): RustStoreEventHandler => {
  return lib.createStoreEventHandler(epoch, last_timestamp, last_seq) as RustStoreEventHandler;
};

export const rsGetNextEventId = (
  eventHandler: RustStoreEventHandler,
  currentTimestamp?: number,
): Result<number, HubError> => {
  return Result.fromThrowable(() => lib.getNextEventId.call(eventHandler, currentTimestamp), rustErrorToHubError)();
};

/** Create a reaction Store */
export const rsCreateReactionStore = (
  db: RustDb,
  eventHandler: RustStoreEventHandler,
  pruneSizeLimit: number,
): RustDynStore => {
  const store = lib.createReactionStore(db, eventHandler, pruneSizeLimit);

  return store as RustDynStore;
};

/** Create a cast Store */
export const rsCreateCastStore = (
  db: RustDb,
  eventHandler: RustStoreEventHandler,
  pruneSizeLimit: number,
): RustDynStore => {
  const store = lib.createCastStore(db, eventHandler, pruneSizeLimit);

  return store as RustDynStore;
};

export const rsGetCastAdd = async (store: RustDynStore, fid: number, hashBytes: Buffer): Promise<Buffer> => {
  return await lib.getCastAdd.call(store, fid, hashBytes);
};

export const rsGetCastRemove = async (store: RustDynStore, fid: number, hashBytes: Buffer): Promise<Buffer> => {
  return await lib.getCastRemove.call(store, fid, hashBytes);
};

export const rsGetCastAddsByFid = async (
  store: RustDynStore,
  fid: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getCastAddsByFid.call(store, fid, pageOptions);
};

export const rsGetCastRemovesByFid = async (
  store: RustDynStore,
  fid: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getCastRemovesByFid.call(store, fid, pageOptions);
};

export const rsGetCastsByParent = async (
  store: RustDynStore,
  parentCastIdBytes: Buffer,
  parentUrl: string,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getCastsByParent.call(store, parentCastIdBytes, parentUrl, pageOptions);
};

export const rsGetCastsByMention = async (
  store: RustDynStore,
  mentionFid: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getCastsByMention.call(store, mentionFid, pageOptions);
};

export const rsGetMessage = async (
  store: RustDynStore,
  fid: number,
  set: UserMessagePostfix,
  tsHash: Uint8Array,
): Promise<Buffer> => {
  return await lib.getMessage.call(store, fid, set, tsHash);
};

/** This is dynamically dispatched to any Store that you pass in */
export const rsMerge = async (store: RustDynStore, messageBytes: Uint8Array): Promise<Buffer> => {
  return await lib.merge.call(store, messageBytes);
};

/** Revoke a message from the store */
export const revoke = async (store: RustDynStore, messageBytes: Uint8Array): Promise<Buffer> => {
  return await lib.revoke.call(store, messageBytes);
};

/** This is dynamically dispatched to any Store, and the messages will be returned from that store */
export const rsPruneMessages = async (
  store: RustDynStore,
  fid: number,
  cachedCount: number,
  units: number,
): Promise<Buffer> => {
  return await lib.pruneMessages.call(store, fid, cachedCount, units);
};

export const rsGetAllMessagesByFid = async (
  store: RustDynStore,
  fid: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getAllMessagesByFid.call(store, fid, pageOptions);
};

export const rsGetReactionAdd = async (
  store: RustDynStore,
  fid: number,
  type: number,
  targetCastIdBytes: Buffer,
  targetUrl: string,
): Promise<Buffer> => {
  return await lib.getReactionAdd.call(store, fid, type, targetCastIdBytes, targetUrl);
};

export const rsGetReactionRemove = async (
  store: RustDynStore,
  fid: number,
  type: number,
  targetCastIdBytes: Buffer,
  targetUrl: string,
): Promise<Buffer> => {
  return await lib.getReactionRemove.call(store, fid, type, targetCastIdBytes, targetUrl);
};

export const rsGetReactionAddsByFid = async (
  store: RustDynStore,
  fid: number,
  type: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getReactionAddsByFid.call(store, fid, type, pageOptions);
};

export const rsGetReactionRemovesByFid = async (
  store: RustDynStore,
  fid: number,
  type: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getReactionRemovesByFid.call(store, fid, type, pageOptions);
};

export const rsGetReactionsByTarget = async (
  store: RustDynStore,
  targetCastIdBytes: Buffer,
  targetUrl: string,
  type: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getReactionsByTarget.call(store, targetCastIdBytes, targetUrl, type, pageOptions);
};

/** UserData Store */
export const rsCreateUserDataStore = (
  db: RustDb,
  eventHandler: RustStoreEventHandler,
  pruneSizeLimit: number,
): RustDynStore => {
  const store = lib.createUserDataStore(db, eventHandler, pruneSizeLimit);

  return store as RustDynStore;
};

export const rsGetUserDataAdd = async (store: RustDynStore, fid: number, dataType: number): Promise<Buffer> => {
  return await lib.getUserDataAdd.call(store, fid, dataType);
};

export const rsGetUserDataAddsByFid = async (
  store: RustDynStore,
  fid: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getUserDataAddsByFid.call(store, fid, pageOptions);
};

export const rsGetUserNameProof = async (store: RustDynStore, name: Uint8Array): Promise<Buffer> => {
  return await lib.getUserNameProof.call(store, name);
};

export const rsGetUserNameProofByFid = async (store: RustDynStore, fid: number): Promise<Buffer> => {
  return await lib.getUserNameProofByFid.call(store, fid);
};

export const rsMergeUserNameProof = async (store: RustDynStore, usernameProof: Uint8Array): Promise<Buffer> => {
  return await lib.mergeUserNameProof.call(store, usernameProof);
};

/** VerificationStore */
export const rsCreateVerificationStore = (
  db: RustDb,
  eventHandler: RustStoreEventHandler,
  pruneSizeLimit: number,
): RustDynStore => {
  const store = lib.createVerificationStore(db, eventHandler, pruneSizeLimit);

  return store as RustDynStore;
};

export const rsGetVerificationAdd = async (store: RustDynStore, fid: number, address: Uint8Array): Promise<Buffer> => {
  return await lib.getVerificationAdd.call(store, fid, address);
};

export const rsGetVerificationRemove = async (
  store: RustDynStore,
  fid: number,
  address: Uint8Array,
): Promise<Buffer> => {
  return await lib.getVerificationRemove.call(store, fid, address);
};

export const rsGetVerificationAddsByFid = async (
  store: RustDynStore,
  fid: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getVerificationAddsByFid.call(store, fid, pageOptions);
};

export const rsGetVerificationRemovesByFid = async (
  store: RustDynStore,
  fid: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getVerificationRemovesByFid.call(store, fid, pageOptions);
};

export const rsMigrateVerifications = async (store: RustDynStore): Promise<{ total: number; duplicates: number }> => {
  return await lib.migrateVerifications.call(store);
};

/** Username Proofs store */
export const rsCreateUsernameProofStore = (
  db: RustDb,
  eventHandler: RustStoreEventHandler,
  pruneSizeLimit: number,
): RustDynStore => {
  const store = lib.createUsernameProofStore(db, eventHandler, pruneSizeLimit);

  return store as RustDynStore;
};

export const rsGetUsernameProof = async (store: RustDynStore, name: Uint8Array, type: number): Promise<Buffer> => {
  return await lib.getUsernameProof.call(store, name, type);
};

export const rsGetUsernameProofsByFid = async (
  store: RustDynStore,
  fid: number,
  pageOptions: PageOptions,
): Promise<RustMessagesPage> => {
  return await lib.getUsernameProofsByFid.call(store, fid, pageOptions);
};

export const rsGetUsernameProofByFidAndName = async (
  store: RustDynStore,
  fid: number,
  name: Uint8Array,
): Promise<Buffer> => {
  return await lib.getUsernameProofByFidAndName.call(store, fid, name);
};

export namespace rsLinkStore {
  export const CreateLinkStore = (
    db: RustDb,
    eventHandler: RustStoreEventHandler,
    pruneSizeLimit: number,
  ): RustDynStore => {
    const store = lib.createLinkStore(db, eventHandler, pruneSizeLimit);

    return store as RustDynStore;
  };

  export const GetLinkAdd = async (store: RustDynStore, fid: number, type: string, target: number): Promise<Buffer> => {
    return await lib.getLinkAdd.call(store, fid, type, target);
  };

  export const GetLinkAddsByFid = async (
    store: RustDynStore,
    fid: number,
    type: string,
    pageOptions: PageOptions,
  ): Promise<RustMessagesPage> => {
    return await lib.getLinkAddsByFid.call(store, fid, type, pageOptions);
  };

  export const GetLinkRemovesByFid = async (
    store: RustDynStore,
    fid: number,
    type: string,
    pageOptions: PageOptions,
  ): Promise<RustMessagesPage> => {
    return await lib.getLinkRemovesByFid.call(store, fid, type, pageOptions);
  };

  export const GetLinksByTarget = async (
    store: RustDynStore,
    target: number,
    type: string,
    pageOptions: PageOptions,
  ): Promise<RustMessagesPage> => {
    return await lib.getLinksByTarget.call(store, target, type, pageOptions);
  };

  export const GetLinkRemove = async (
    store: RustDynStore,
    fid: number,
    type: string,
    target: number,
  ): Promise<Buffer> => {
    return await lib.getLinkRemove.call(store, fid, type, target);
  };

  export const GetAllLinkMessagesByFid = async (
    store: RustDynStore,
    fid: number,
    pageOptions: PageOptions,
  ): Promise<RustMessagesPage> => {
    return await lib.getAllLinkMessagesByFid.call(store, fid, pageOptions);
  };
}

/**
 * Merkle Trie Functions
 */
export const rsCreateMerkleTrie = (dbPath: string): RustMerkleTrie => {
  const trie = lib.createMerkleTrie(dbPath);
  return trie as RustMerkleTrie;
};

export const rsCreateMerkleTrieFromDb = (db: RustDb): RustMerkleTrie => {
  const trie = lib.createMerkleTrieFromDb(db);
  return trie as RustMerkleTrie;
};

export const rsMerkleTrieGetDb = (trie: RustMerkleTrie): RustDb => {
  return lib.merkleTrieGetDb.call(trie) as RustDb;
};

export const rsMerkleTrieInitialize = async (trie: RustMerkleTrie): Promise<void> => {
  await lib.merkleTrieInitialize.call(trie);
};

export const rsMerkleTrieClear = async (trie: RustMerkleTrie): Promise<void> => {
  await lib.merkleTrieClear.call(trie);
};

export const rsMerkleTrieStop = async (trie: RustMerkleTrie): Promise<void> => {
  await lib.merkleTrieStop.call(trie);
};

export const rsMerkleTrieInsert = async (trie: RustMerkleTrie, key: Uint8Array): Promise<boolean> => {
  return await lib.merkleTrieInsert.call(trie, key);
};

export const rsMerkleTrieDelete = async (trie: RustMerkleTrie, key: Uint8Array): Promise<boolean> => {
  return await lib.merkleTrieDelete.call(trie, key);
};

export const rsMerkleTrieExists = async (trie: RustMerkleTrie, key: Uint8Array): Promise<boolean> => {
  return await lib.merkleTrieExists.call(trie, key);
};

export const rsMerkleTrieGetSnapshot = async (trie: RustMerkleTrie, prefix: Uint8Array): Promise<TrieSnapshot> => {
  const snapshot = (await lib.merkleTrieGetSnapshot.call(trie, prefix)) as TrieSnapshot;
  return {
    prefix: new Uint8Array(snapshot.prefix),
    excludedHashes: snapshot.excludedHashes,
    numMessages: snapshot.numMessages,
  };
};

export const rsMerkleTrieGetTrieNodeMetadata = async (
  trie: RustMerkleTrie,
  prefix: Uint8Array,
): Promise<NodeMetadata | undefined> => {
  try {
    const metadata = await lib.merkleTrieGetTrieNodeMetadata.call(trie, prefix);

    // The returned metadata has a childrenKeys and childrenValues, which need to be turned into a Map
    const children = new Map<number, NodeMetadata>();
    for (let i = 0; i < metadata.childrenKeys.length; i++) {
      children.set(metadata.childrenKeys[i], metadata.childrenValues[i]);
    }

    return {
      numMessages: metadata.numMessages,
      hash: metadata.hash,
      prefix: new Uint8Array(metadata.prefix),
      children,
    };
  } catch (err) {
    const e = err as HubError;
    if (e.message.includes("Node not found")) {
      return undefined;
    } else {
      throw err;
    }
  }
};

export const rsMerkleTrieGetAllValues = async (trie: RustMerkleTrie, prefix: Uint8Array): Promise<Uint8Array[]> => {
  return await lib.merkleTrieGetAllValues.call(trie, prefix);
};

export const rsMerkleTrieItems = async (trie: RustMerkleTrie): Promise<number> => {
  return await lib.merkleTrieItems.call(trie);
};

export const rsMerkleTrieRootHash = async (trie: RustMerkleTrie): Promise<string> => {
  return Buffer.from(await lib.merkleTrieRootHash.call(trie)).toString("hex");
};

export const rsMerkleTrieMigrate = async (
  trie: RustMerkleTrie,
  keys: Uint8Array[],
  values: Uint8Array[],
): Promise<number> => {
  return await lib.merkleTrieMigrate.call(trie, keys, values);
};

export const rsMerkleTrieUnloadChildren = async (trie: RustMerkleTrie): Promise<void> => {
  return await lib.merkleTrieUnloadChildren.call(trie);
};
