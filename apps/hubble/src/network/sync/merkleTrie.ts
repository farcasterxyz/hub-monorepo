import { Result, ResultAsync } from "neverthrow";
import { Worker } from "worker_threads";
import { HubError, Message } from "@farcaster/hub-nodejs";
import { SyncId } from "./syncId.js";
import { TrieNode, TrieSnapshot } from "./trieNode.js";
import RocksDB from "../../storage/db/rocksdb.js";
import { FID_BYTES, HASH_LENGTH, RootPrefix, UserMessagePostfixMax } from "../../storage/db/types.js";
import { logger } from "../../utils/logger.js";
import { getStatusdInitialization } from "../../utils/statsd.js";

/**
 * Represents a node in the trie, and it's immediate children
 *
 * @prefix - The prefix of the node, uniquely describes its position in the trie
 * @numMessages - The number of messages under this node
 * @hash - The merkle hash of the node
 * @children - The immediate children of this node
 */
export type NodeMetadata = {
  prefix: Uint8Array;
  numMessages: number;
  hash: string;
  children?: Map<number, NodeMetadata>;
};

const log = logger.child({ component: "SyncMerkleTrie" });
const workerLog = logger.child({ component: "SyncMerkleTrieWorker" });

export interface MerkleTrieKV {
  key: Uint8Array;
  value: Uint8Array;
}

export interface MerkleTrieInterface {
  initialize(): Promise<void>;
  clear(): Promise<void>;
  insert(syncIdBytes: Uint8Array): Promise<boolean>;
  delete(syncIdBytes: Uint8Array): Promise<boolean>;
  exists(syncIdBytes: Uint8Array): Promise<boolean>;
  getSnapshot(prefix: Uint8Array): Promise<TrieSnapshot>;
  getTrieNodeMetadata(prefix: Uint8Array): Promise<NodeMetadata | undefined>;
  getAllValues(prefix: Uint8Array): Promise<Uint8Array[]>;
  items(): Promise<number>;
  rootHash(): Promise<string>;
  commitToDb(): Promise<void>;
  unloadChildrenAtPrefix(prefix: Uint8Array): Promise<void>;
}

export type MerkleTrieInterfaceMethodNames = keyof MerkleTrieInterface;

export type MerkleTrieInterfaceMethodReturnType<MethodName extends MerkleTrieInterfaceMethodNames> = ReturnType<
  MerkleTrieInterface[MethodName]
>;

export type MerkleTrieInterfaceMessage<MethodName extends MerkleTrieInterfaceMethodNames> = {
  method: MethodName;
  args: Parameters<MerkleTrieInterface[MethodName]>;
  methodCallId: number;
};

export type MerkleTrieInterfaceMethodGenericMessage = {
  [K in MerkleTrieInterfaceMethodNames]: {
    method: K;
    args: Parameters<MerkleTrieInterface[K]>;
    methodCallId: number;
  };
}[MerkleTrieInterfaceMethodNames];

/**
 * MerkleTrie is a trie that contains Farcaster Messages SyncId and is used to diff the state of
 * two hubs on the network.
 *
 * Levels 1 to 10 of the trie represent the messages's timestamp while the remaining levels
 * represent its hash. It is conceptually similar to a Merkle Patricia Tree, but the current
 * implementation is closer to a Merkle Radix Trie, since it is missing extension nodes. See:
 * https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/.
 *
 *
 * Note: MerkleTrie and TrieNode are not thread-safe, which is ok because there are no async
 * methods. DO NOT add async methods without considering impact on concurrency-safety.
 */
class MerkleTrie {
  private _worker;
  private _nodeMethodCallId = 0;
  private _nodeMethodCallMap = new Map<number, { resolve: Function; reject: Function }>();

  private _db: RocksDB;

  constructor(rocksDb: RocksDB) {
    this._db = rocksDb;

    const workerPath = new URL("../../../build/network/sync/merkleTrieWorker.js", import.meta.url);
    this._worker = new Worker(workerPath, {
      workerData: { statsdInitialization: getStatusdInitialization() },
    });

    this._worker.addListener("message", async (event) => {
      // console.log("Received message from worker thread", msg);
      if (event.dbGetCallId) {
        const value = await ResultAsync.fromPromise(this._db.get(Buffer.from(event.key)), (e) => e as Error);
        if (value.isErr()) {
          log.warn({ key: event.key, error: value.error }, "Error getting value from DB");
          this._worker.postMessage({
            dbGetCallId: event.dbGetCallId,
            value: undefined,
          });
        } else {
          this._worker.postMessage({
            dbGetCallId: event.dbGetCallId,
            value: value.value,
          });
        }
      } else if (event.dbKeyValuesCallId) {
        const keyValues = event.dbKeyValues as MerkleTrieKV[];
        const txn = this._db.transaction();

        // Collect all the pending DB updates into a single transaction batch
        for (const { key, value } of keyValues) {
          if (value && value.length > 0) {
            txn.put(Buffer.from(key), Buffer.from(value));
          } else {
            txn.del(Buffer.from(key));
          }
        }

        await this._db.commit(txn);
        this._worker.postMessage({
          dbKeyValuesCallId: event.dbKeyValuesCallId,
        });
      } else if (event.log) {
        // Log event from the libp2p worker thread.
        const { level, logObj, message } = event.log;
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        (workerLog as any)[level](logObj, message);
      } else {
        // Result of a method call. Pick the correct method call from the map and resolve/reject the promise
        const result = event;
        const methodCall = this._nodeMethodCallMap.get(result.methodCallId);
        if (methodCall) {
          this._nodeMethodCallMap.delete(result.methodCallId);
          methodCall.resolve(result.result);
        }
      }
    });
  }

  // A typed wrapper around the worker.postMessage method, to make sure we don't make any type mistakes
  // when calling the method
  async callMethod<MethodName extends MerkleTrieInterfaceMethodNames>(
    method: MethodName,
    ...args: Parameters<MerkleTrieInterface[MethodName]>
  ): Promise<MerkleTrieInterfaceMethodReturnType<MethodName>> {
    const methodCallId = this._nodeMethodCallId++;
    const methodCall = { method, args, methodCallId };

    const result = new Promise<MerkleTrieInterfaceMethodReturnType<MethodName>>((resolve, reject) => {
      this._nodeMethodCallMap.set(methodCallId, { resolve, reject });
      this._worker?.postMessage(methodCall);
    });

    return result;
  }

  public async stop(): Promise<void> {
    await this._worker?.terminate();
  }

  public async initialize(): Promise<void> {
    return this.callMethod("initialize");
  }

  public async rebuild(): Promise<void> {
    // First, delete the root node
    const dbStatus = await ResultAsync.fromPromise(
      this._db.del(TrieNode.makePrimaryKey(new Uint8Array())),
      (e) => e as HubError,
    );
    if (dbStatus.isErr()) {
      log.warn("Error Deleting trie root node. Ignoring", dbStatus.error);
    }

    // Brand new empty root node
    await this.callMethod("clear");

    // Rebuild the trie by iterating over all the messages in the db
    const prefix = Buffer.from([RootPrefix.User]);
    let count = 0;

    await this._db.forEachIteratorByPrefix(
      prefix,
      async (key, value) => {
        const postfix = (key as Buffer).readUint8(1 + FID_BYTES);
        if (postfix < UserMessagePostfixMax) {
          const message = Result.fromThrowable(
            () => Message.decode(new Uint8Array(value as Buffer)),
            (e) => e as HubError,
          )();
          if (message.isOk() && message.value.hash.length === HASH_LENGTH) {
            await this.insert(new SyncId(message.value));
            count += 1;
            if (count % 10_000 === 0) {
              log.info({ count }, "Rebuilding Merkle Trie");
            }
          }
        }
      },
      {},
      1 * 60 * 60 * 1000,
    );
  }

  public async insert(id: SyncId): Promise<boolean> {
    return this.callMethod("insert", id.syncId());
  }

  public async deleteBySyncId(id: SyncId): Promise<boolean> {
    return this.callMethod("delete", id.syncId());
  }

  public async deleteByBytes(id: Uint8Array): Promise<boolean> {
    return this.callMethod("delete", new Uint8Array(id));
  }

  /**
   * Check if the SyncId exists in the trie.
   */
  public async exists(id: SyncId): Promise<boolean> {
    return this.callMethod("exists", id.syncId());
  }

  /**
   * Check if we already have this syncID (expressed as bytes)
   */
  public async existsByBytes(id: Uint8Array): Promise<boolean> {
    return this.callMethod("exists", new Uint8Array(id));
  }

  /**
   * Get a snapshot of the trie at a given prefix.
   */
  public async getSnapshot(prefix: Uint8Array): Promise<TrieSnapshot> {
    return this.callMethod("getSnapshot", new Uint8Array(prefix));
  }

  /**
   * Get the metadata for a node in the trie at the given prefix.
   */
  public async getTrieNodeMetadata(prefix: Uint8Array): Promise<NodeMetadata | undefined> {
    return this.callMethod("getTrieNodeMetadata", new Uint8Array(prefix));
  }

  /**
   * Get all the values at the prefix.
   */
  public async getAllValues(prefix: Uint8Array): Promise<Uint8Array[]> {
    return this.callMethod("getAllValues", new Uint8Array(prefix));
  }

  public async items(): Promise<number> {
    return this.callMethod("items");
  }

  public async rootHash(): Promise<string> {
    return this.callMethod("rootHash");
  }

  // Save the cached DB updates to the DB
  public async commitToDb(): Promise<void> {
    return this.callMethod("commitToDb");
  }

  public async unloadChildrenAtPrefix(prefix: Uint8Array): Promise<void> {
    return this.callMethod("unloadChildrenAtPrefix", prefix);
  }
}

export { MerkleTrie };
