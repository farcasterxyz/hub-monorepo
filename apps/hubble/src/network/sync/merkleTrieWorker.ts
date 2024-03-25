import { parentPort, workerData } from "worker_threads";
import {
  MerkleTrieInterface,
  MerkleTrieInterfaceMessage,
  MerkleTrieInterfaceMethodGenericMessage,
  MerkleTrieInterfaceMethodReturnType,
  MerkleTrieKV,
  NodeMetadata,
  TrieDBPathPrefix,
} from "./merkleTrie.js";
import { logger } from "../../utils/logger.js";
import ReadWriteLock from "rwlock";
import { TrieNode, TrieSnapshot } from "./trieNode.js";
import { StatsDInitParams, initializeStatsd, statsd } from "../../utils/statsd.js";
import RocksDB from "../../storage/db/rocksdb.js";
import path from "path";
import { ResultAsync } from "neverthrow";

// The number of messages to process before unloading the trie from memory
// Approx 10k * 10 nodes * 65 bytes per node = approx 6.5MB of cached data
const TRIE_UNLOAD_THRESHOLD = 10_000;

const log = logger.child({ component: "SyncMerkleTrieWorker" });

// A type to get key/values from the DB
export type DBGetter = (key: Buffer) => Promise<Buffer | undefined>;

// An implementation of a Merkle Trie that uses RocksDB as the backing store.
//
// Note 1: While all the data for the merkle trie is cached in this worker thread, the DB can only
// be accessed via the main thread. This is because RocksDB is not thread safe, and we don't want
// to have to deal with locking the DB.
// So, to get data from the DB, we send a message to the main thread, which then reads the data
// from the DB and sends it back to this thread.
//
// Logging is also done on the main thread, since we don't want to have to deal the log caching
class MerkleTrieImpl {
  private _initialized = false;

  private _root: TrieNode;
  private _lock: ReadWriteLock;
  private _pendingDbUpdates = new Map<Buffer, Buffer>();

  _trieDb: RocksDB | undefined;

  private _dbCallId = 0;
  _dbGetCallMap = new Map<number, { resolve: (value: Buffer | undefined) => void; key: Buffer }>();
  _dbPutMap = new Map<number, { resolve: () => void }>();

  constructor(statsdInitialization?: StatsDInitParams, dbPath?: string) {
    this._lock = new ReadWriteLock();
    this._root = new TrieNode();

    if (statsdInitialization) {
      initializeStatsd(statsdInitialization.host, statsdInitialization.port);
    }

    // Don't open a separate DB for the trie during tests
    if (dbPath && process.env["NODE_ENV"] !== "test") {
      log.info({ dbPath }, "MerkleTrieImpl: initializing");
      this._trieDb = new RocksDB(`${path.basename(dbPath)}/${TrieDBPathPrefix}`);
      log.info({ triePath: this._trieDb.location }, "MerkleTrieImpl: created DB");
    } else {
      log.debug("MerkleTrieImpl: using main in-memory DB for tests");
      this._trieDb = undefined;
    }
  }

  // Get a DB value from the main thread
  async _dbGet(key: Buffer): Promise<Buffer | undefined> {
    // We'll attempt to get it from the trieDb first
    const value = this._trieDb
      ? await ResultAsync.fromPromise(this._trieDb.get(Buffer.from(key)), (e) => e as Error)
      : undefined;

    if (value?.isOk()) {
      statsd().increment("rocksdb.trie.get.hit");
      return value.value;
    } else {
      // Else, we'll get it from the main thread
      statsd().increment("rocksdb.trie.get.miss");
      return new Promise((resolve) => {
        this._dbCallId++;
        this._dbGetCallMap.set(this._dbCallId, { resolve, key });

        parentPort?.postMessage({ dbGetCallId: this._dbCallId, key });
      });
    }
  }

  // Write DB values to the DB via the main thread
  async _dbPut(dbKeyValues: MerkleTrieKV[]): Promise<void> {
    if (this._trieDb) {
      // We'll only write to the trieDb.
      const txn = this._trieDb.transaction();
      for (const { key, value } of dbKeyValues) {
        if (value && value.length > 0) {
          txn.put(Buffer.from(key), Buffer.from(value));
        } else {
          txn.del(Buffer.from(key));
        }
      }

      await this._trieDb.commit(txn);
    } else {
      return new Promise((resolve) => {
        this._dbCallId++;
        this._dbPutMap.set(this._dbCallId, { resolve });

        parentPort?.postMessage({ dbKeyValuesCallId: this._dbCallId, dbKeyValues });
      });
    }
  }

  private _dbGetter(): DBGetter {
    return this._dbGet.bind(this);
  }

  /** Incoporate the DB updates from the trie operation into the cached DB updates
   * Note that this method only updates the cache, and does not write to the DB.
   * call commitToDb() to write the cached DB updates to the DB.
   */
  private _updatePendingDbUpdates(dbUpdatesMap: Map<Buffer, Buffer>): void {
    for (const [key, value] of dbUpdatesMap) {
      this._pendingDbUpdates.set(key, value);
    }
  }

  async clear(): Promise<void> {
    return new Promise((resolve) => {
      this._lock.writeLock(async (release) => {
        this._root = new TrieNode();
        this._pendingDbUpdates.clear();

        await this._trieDb?.clear();

        resolve();
        release();
      });
    });
  }

  async initialize(): Promise<void> {
    return new Promise((resolve) => {
      this._lock.writeLock(async (release) => {
        // Initialize the trie DB first
        if (this._trieDb) {
          const dbResult = await ResultAsync.fromPromise(this._trieDb.open(), (e) => e as Error);
          if (dbResult.isErr()) {
            log.error({ err: dbResult.error }, "Error opening trie DB");
            throw dbResult.error;
          }

          log.info({ triePath: this._trieDb.location }, "MerkleTrieImpl: opened DB");
        }

        const rootBytes = await this._dbGet(TrieNode.makePrimaryKey(new Uint8Array()));
        if (rootBytes && rootBytes.length > 0) {
          this._root = TrieNode.deserialize(rootBytes);
          log.info(
            { rootHash: Buffer.from(this._root.hash).toString("hex"), items: this._root.items },
            "Merkle Trie loaded from DB",
          );
        } else {
          log.info("MerkleTrieImpl: Merkle Trie initialized with empty root node");
          this._root = new TrieNode();
        }

        this._initialized = true;
        resolve();
        release();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this._lock.writeLock(async (release) => {
        await this._unloadFromMemory(true, true);
        await this._trieDb?.close();

        resolve();
        release();
      });
    });
  }

  /**
   * Check if we need to unload the trie from memory. This is not protected by a lock, since it is only called
   * from within a lock.
   */
  private async _unloadFromMemory(writeLocked: boolean, force = false) {
    // Every TRIE_UNLOAD_THRESHOLD calls, we unload the trie from memory to avoid memory leaks.
    // Every call in this class usually loads one root-to-leaf path of the trie, so
    // we unload the trie from memory every TRIE_UNLOAD_THRESHOLD calls. This allows us to keep the
    // most recently used parts of the trie in memory, while still "garbage collecting"
    // the rest of the trie.

    // Fn that does the actual unloading
    const doUnload = async () => {
      if (this._pendingDbUpdates.size === 0) {
        // Trie has no pending DB updates, skipping unload
        return;
      }

      const dbKeyValues = [];

      // Collect all the pending DB updates into a single transaction batch
      for (const [key, value] of this._pendingDbUpdates) {
        if (value && value.length > 0) {
          dbKeyValues.push({ key: Uint8Array.from(key), value: Uint8Array.from(value) });
        } else {
          dbKeyValues.push({ key: Uint8Array.from(key), value: new Uint8Array() });
        }
      }

      await this._dbPut(dbKeyValues);
      log.info({ numDbUpdates: this._pendingDbUpdates.size, force }, "Trie committed pending DB updates");

      this._pendingDbUpdates.clear();
      this._root.unloadChildren();

      statsd().gauge("merkle_trie.num_messages", this._root.items);
    };

    if (force || this._pendingDbUpdates.size >= TRIE_UNLOAD_THRESHOLD) {
      // If we are only read locked, we need to upgrade to a write lock
      if (!writeLocked) {
        this._lock.writeLock(async (release) => {
          try {
            await doUnload();
          } finally {
            release();
          }
        });
      } else {
        // We're already write locked, so we can just do the unload
        await doUnload();
      }
    }
  }

  public async insert(id: Uint8Array): Promise<boolean> {
    if (!this._initialized) {
      log.error({ id }, "Trie not yet initialized while trying to insert");
      return false;
    }

    return new Promise((resolve) => {
      this._lock.writeLock(async (release) => {
        try {
          const { status, dbUpdatesMap } = await this._root.insert(id, this._dbGetter(), new Map());

          this._updatePendingDbUpdates(dbUpdatesMap);

          // Write the transaction to the DB
          await this._unloadFromMemory(true);

          resolve(status);
        } catch (e) {
          log.error({ e }, `Insert Error for ${id}: ${e?.toString()}`);

          resolve(false);
        }

        release();
      });
    });
  }

  /**
   * Migrate a set of key-values from the main DB to the trie DB. If the key exists in the DB, we
   * skip it, otherwise we insert it into the trie DB.
   *
   * Return the number of keys migrated actually written to the trie DB.
   */
  public async migrate(keys: Uint8Array[], values: Uint8Array[]): Promise<number> {
    return new Promise((resolve) => {
      this._lock.writeLock(async (release) => {
        let migrated = 0;
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i] as Uint8Array;
          const value = values[i] as Uint8Array;

          const dbValue = await this._dbGet(Buffer.from(key));
          if (dbValue && dbValue.length > 0) {
            continue;
          }

          const dbKeyValues = [{ key, value }];
          await this._dbPut(dbKeyValues);
          migrated++;
        }

        resolve(migrated);
        release();
      });
    });
  }

  public async delete(id: Uint8Array): Promise<boolean> {
    return new Promise((resolve) => {
      this._lock.writeLock(async (release) => {
        try {
          const { status, dbUpdatesMap } = await this._root.delete(id, this._dbGetter(), new Map());
          this._updatePendingDbUpdates(dbUpdatesMap);
          await this._unloadFromMemory(true);

          resolve(status);
        } catch (e) {
          log.error({ e }, `Delete Error for ${id}: ${e?.toString()}`);

          resolve(false);
        }

        release();
      });
    });
  }

  /**
   * Check if we already have this syncID (expressed as bytes)
   */
  public async exists(id: Uint8Array): Promise<boolean> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        try {
          const r = await this._root.exists(id, this._dbGetter());
          await this._unloadFromMemory(false);

          resolve(r);
        } catch (e) {
          log.error({ e }, `Exists Error for ${id}: ${e?.toString()}`);
          resolve(false);
        }
        release();
      });
    });
  }

  /**
   * Get a snapshot of the trie at a given prefix.
   */
  public async getSnapshot(prefix: Uint8Array): Promise<TrieSnapshot> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        const r = await this._root.getSnapshot(prefix, this._dbGetter());

        await this._unloadFromMemory(false);

        resolve(r);

        release();
      });
    });
  }

  /**
   * Get the metadata for a node in the trie at the given prefix.
   */
  public async getTrieNodeMetadata(prefix: Uint8Array): Promise<NodeMetadata | undefined> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        const node = await this._root.getNode(prefix, this._dbGetter());

        if (node === undefined) {
          resolve(undefined);
        } else {
          const md = await node.getNodeMetadata(prefix, this._dbGetter());

          resolve(md);
        }

        release();
        await this._unloadFromMemory(false);
      });
    });
  }

  public async getNode(prefix: Uint8Array): Promise<TrieNode | undefined> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        const r = await this._root.getNode(prefix, this._dbGetter());

        await this._unloadFromMemory(false);

        resolve(r);
        release();
      });
    });
  }

  /**
   * Get all the values at the prefix. This is a recursive operation.
   */
  public async getAllValues(prefix: Uint8Array): Promise<Uint8Array[]> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        const node = await this._root.getNode(prefix, this._dbGetter());
        await this._unloadFromMemory(false);

        if (node === undefined) {
          resolve([]);
        } else {
          const r = await node.getAllValues(prefix, this._dbGetter());

          await this._unloadFromMemory(false);
          resolve(r);
        }

        release();
      });
    });
  }

  public async items(): Promise<number> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        resolve(this._root.items);
        release();
      });
    });
  }

  public async rootHash(): Promise<string> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        resolve(Buffer.from(this._root.hash).toString("hex"));
        release();
      });
    });
  }

  // Save the cached DB updates to the DB
  public async commitToDb(): Promise<void> {
    return new Promise((resolve) => {
      this._lock.writeLock(async (release) => {
        await this._unloadFromMemory(true, true);

        resolve(undefined);
        release();
      });
    });
  }
}

const merkleTrie = new MerkleTrieImpl(
  workerData.statsdInitialization as StatsDInitParams | undefined,
  workerData.dbPath as string,
);

// This function is a no-op at runtime, but exists to typecheck the return values
// the worker thread sends back to the main thread. Getting this wrong will cause
// difficult bugs, so better to let the compiler check it for us.
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
function makeResult<MethodName extends keyof MerkleTrieInterface>(
  result: UnwrapPromise<MerkleTrieInterfaceMethodReturnType<MethodName>>,
) {
  return result;
}

// The main thread sends messages to the worker thread via the parentPort
// and we listen for them here. We then call the appropriate method on the
// MerkleTrieImpl instance and send the result back to the main thread.
parentPort?.on(
  "message",
  async (
    msg: MerkleTrieInterfaceMethodGenericMessage & {
      dbGetCallId: number;
      value: Uint8Array;
      dbKeyValuesCallId: number;
    },
  ) => {
    const { dbGetCallId, value, dbKeyValuesCallId, method, methodCallId } = msg;
    // console.log("Received message from parent thread: ", method);

    // First check if this message is a response to a DB get call
    if (dbGetCallId) {
      const dbGetCall = merkleTrie._dbGetCallMap.get(dbGetCallId);
      if (!dbGetCall) {
        log.error({ value }, `Received response for unknown DB get call ID ${dbGetCallId}`);
        return;
      }
      merkleTrie._dbGetCallMap.delete(dbGetCallId);
      dbGetCall.resolve(value ? Buffer.from(value) : undefined);

      // Also save the value to the trie DB
      if (value && merkleTrie._trieDb) {
        const key = Uint8Array.from(dbGetCall.key);
        const dbKeyValues = [{ key, value }];
        merkleTrie._dbPut(dbKeyValues);
      }

      return;
    }

    // Next check if this message is a response to a DB put call
    if (dbKeyValuesCallId) {
      const dbPutCall = merkleTrie._dbPutMap.get(dbKeyValuesCallId);
      if (!dbPutCall) {
        log.error({ value }, `Received response for unknown DB put call ID ${dbKeyValuesCallId}`);
      }
      merkleTrie._dbPutMap.delete(dbKeyValuesCallId);
      dbPutCall?.resolve();

      return;
    }

    switch (method) {
      case "clear": {
        await merkleTrie.clear();
        parentPort?.postMessage({ methodCallId, result: makeResult<"clear">(undefined) });
        break;
      }
      case "initialize": {
        await merkleTrie.initialize();
        parentPort?.postMessage({ methodCallId, result: makeResult<"initialize">(undefined) });
        break;
      }
      case "insert": {
        const specificMsg = msg as MerkleTrieInterfaceMessage<"insert">;
        const [syncIdBytes] = specificMsg.args;
        const start = Date.now();
        const result = await merkleTrie.insert(syncIdBytes);
        statsd().timing("merkle_trie.insert", Date.now() - start);
        parentPort?.postMessage({ methodCallId, result: makeResult<"insert">(result) });
        break;
      }
      case "delete": {
        const specificMsg = msg as MerkleTrieInterfaceMessage<"delete">;
        const [syncIdBytes] = specificMsg.args;
        const start = Date.now();
        const result = await merkleTrie.delete(syncIdBytes);
        statsd().timing("merkle_trie.delete", Date.now() - start);
        parentPort?.postMessage({ methodCallId, result: makeResult<"delete">(result) });
        break;
      }
      case "exists": {
        const specificMsg = msg as MerkleTrieInterfaceMessage<"exists">;
        const [syncIdBytes] = specificMsg.args;
        const start = Date.now();
        const result = await merkleTrie.exists(syncIdBytes);
        statsd().timing("merkle_trie.exists", Date.now() - start);
        parentPort?.postMessage({ methodCallId, result: makeResult<"exists">(result) });
        break;
      }
      case "getSnapshot": {
        const specificMsg = msg as MerkleTrieInterfaceMessage<"getSnapshot">;
        const [prefix] = specificMsg.args;
        const result = await merkleTrie.getSnapshot(prefix);
        parentPort?.postMessage({ methodCallId, result: makeResult<"getSnapshot">(result) });
        break;
      }
      case "getTrieNodeMetadata": {
        const specificMsg = msg as MerkleTrieInterfaceMessage<"getTrieNodeMetadata">;
        const [prefix] = specificMsg.args;
        const result = await merkleTrie.getTrieNodeMetadata(prefix);
        parentPort?.postMessage({ methodCallId, result: makeResult<"getTrieNodeMetadata">(result) });
        break;
      }
      case "getAllValues": {
        const specificMsg = msg as MerkleTrieInterfaceMessage<"getAllValues">;
        const [prefix] = specificMsg.args;
        const result = await merkleTrie.getAllValues(prefix);
        parentPort?.postMessage({ methodCallId, result: makeResult<"getAllValues">(result) });
        break;
      }
      case "items": {
        const result = await merkleTrie.items();
        parentPort?.postMessage({ methodCallId, result: makeResult<"items">(result) });
        break;
      }
      case "rootHash": {
        const result = await merkleTrie.rootHash();
        parentPort?.postMessage({ methodCallId, result: makeResult<"rootHash">(result) });
        break;
      }
      case "commitToDb": {
        await merkleTrie.commitToDb();
        parentPort?.postMessage({ methodCallId, result: makeResult<"commitToDb">(undefined) });
        break;
      }
      case "loggerFlush": {
        // Flush any buffered logs and start logging to STDOUT
        logger.flush();
        parentPort?.postMessage({ methodCallId, result: makeResult<"loggerFlush">(undefined) });
        break;
      }
      case "unloadChildrenAtPrefix": {
        const specificMsg = msg as MerkleTrieInterfaceMessage<"unloadChildrenAtPrefix">;
        const [prefix] = specificMsg.args;
        const node = await merkleTrie.getNode(prefix);
        node?.unloadChildren();
        parentPort?.postMessage({ methodCallId, result: makeResult<"unloadChildrenAtPrefix">(undefined) });
        break;
      }
      case "stop": {
        log.info("MerkleTrieImpl: stopping");
        await merkleTrie.stop();
        parentPort?.postMessage({ methodCallId, result: makeResult<"stop">(undefined) });
        break;
      }
      case "migrate": {
        const specificMsg = msg as MerkleTrieInterfaceMessage<"migrate">;
        const [keys, values] = specificMsg.args;
        const result = await merkleTrie.migrate(keys, values);
        parentPort?.postMessage({ methodCallId, result: makeResult<"migrate">(result) });
        break;
      }
    }
  },
);
