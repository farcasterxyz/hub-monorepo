import { Result, ResultAsync } from "neverthrow";
import ReadWriteLock from "rwlock";
import { HubError, Message } from "@farcaster/hub-nodejs";
import { SyncId } from "./syncId.js";
import { TrieNode, TrieSnapshot } from "./trieNode.js";
import RocksDB from "../../storage/db/rocksdb.js";
import { FID_BYTES, HASH_LENGTH, RootPrefix, UserMessagePostfixMax } from "../../storage/db/types.js";
import { logger } from "../../utils/logger.js";
import { statsd } from "../../utils/statsd.js";

// The number of messages to process before unloading the trie from memory
// Approx 25k * 10 nodes * 65 bytes per node = approx 16MB of cached data
const TRIE_UNLOAD_THRESHOLD = 25_000;

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

const log = logger.child({
  component: "SyncMerkleTrie",
});

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
  private _root: TrieNode;
  private _db: RocksDB;
  private _lock: ReadWriteLock;

  private _pendingDbUpdates = new Map<Buffer, Buffer>();

  private _callsSinceLastUnload = 0;

  constructor(rocksDb: RocksDB) {
    this._db = rocksDb;
    this._lock = new ReadWriteLock();

    this._root = new TrieNode();
  }

  public async initialize(): Promise<void> {
    return new Promise((resolve) => {
      this._lock.writeLock(async (release) => {
        try {
          const rootBytes = await this._db.get(TrieNode.makePrimaryKey(new Uint8Array()));
          if (rootBytes && rootBytes.length > 0) {
            this._root = TrieNode.deserialize(rootBytes);
            log.info(
              { rootHash: Buffer.from(this._root.hash).toString("hex"), items: this.items },
              "Merkle Trie loaded from DB",
            );
          }
        } catch (e) {
          // There is no Root node in the DB, just use an empty one
        }

        resolve();
        release();
      });
    });
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
    this._root = new TrieNode();

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
    return new Promise((resolve) => {
      this._lock.writeLock(async (release) => {
        try {
          const { status, dbUpdatesMap } = await this._root.insert(id.syncId(), this._db, new Map());
          statsd().gauge("merkle_trie.num_messages", this._root.items);

          this._updatePendingDbUpdates(dbUpdatesMap);

          // Write the transaction to the DB
          await this._unloadFromMemory(true);

          resolve(status);
        } catch (e) {
          log.error({ e }, "Insert Error");

          resolve(false);
        }

        release();
      });
    });
  }

  public async deleteBySyncId(id: SyncId): Promise<boolean> {
    return this.deleteByBytes(id.syncId());
  }

  public async deleteByBytes(id: Uint8Array): Promise<boolean> {
    return new Promise((resolve) => {
      this._lock.writeLock(async (release) => {
        try {
          const { status, dbUpdatesMap } = await this._root.delete(id, this._db, new Map());
          this._updatePendingDbUpdates(dbUpdatesMap);
          await this._unloadFromMemory(true);

          resolve(status);
        } catch (e) {
          log.error({ e }, "Delete Error");

          resolve(false);
        }

        release();
      });
    });
  }

  /**
   * Check if the SyncId exists in the trie.
   */
  public async exists(id: SyncId): Promise<boolean> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        const r = await this._root.exists(id.syncId(), this._db);

        await this._unloadFromMemory(false);

        resolve(r);
        release();
      });
    });
  }

  /**
   * Check if we already have this syncID (expressed as bytes)
   */
  public async existsByBytes(id: Uint8Array): Promise<boolean> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        const r = await this._root.exists(id, this._db);

        await this._unloadFromMemory(false);

        resolve(r);
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
        const r = await this._root.getSnapshot(prefix, this._db);

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
        const node = await this._root.getNode(prefix, this._db);

        await this._unloadFromMemory(false);

        if (node === undefined) {
          resolve(undefined);
        } else {
          const md = await node.getNodeMetadata(prefix, this._db);

          await this._unloadFromMemory(false);
          resolve(md);
        }

        release();
      });
    });
  }

  public async getNode(prefix: Uint8Array): Promise<TrieNode | undefined> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        const r = await this._root.getNode(prefix, this._db);

        await this._unloadFromMemory(false);

        resolve(r);
        release();
      });
    });
  }

  /**
   * Get all the values at the prefix. This is a recursive operation.
   * TODO: This method might become very expensive, since it loads all the nodes under the trie at the given prefix,
   * so we should probably check the size of the trie before calling this method.
   */
  public async getAllValues(prefix: Uint8Array): Promise<Uint8Array[]> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        const node = await this._root.getNode(prefix, this._db);
        await this._unloadFromMemory(false);

        if (node === undefined) {
          resolve([]);
        } else {
          const r = await node.getAllValues(prefix, this._db);

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

  /** Incoporate the DB updates from the trie operation into the cached DB updates
   * Note that this method only updates the cache, and does not write to the DB.
   * call commitToDb() to write the cached DB updates to the DB.
   */
  private _updatePendingDbUpdates(dbUpdatesMap: Map<Buffer, Buffer>): void {
    for (const [key, value] of dbUpdatesMap) {
      this._pendingDbUpdates.set(key, value);
    }
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
      this._callsSinceLastUnload = 0;

      if (this._pendingDbUpdates.size === 0) {
        // Trie has no pending DB updates, skipping unload
        return;
      }

      const txn = this._db.transaction();

      // Collect all the pending DB updates into a single transaction batch
      for (const [key, value] of this._pendingDbUpdates) {
        if (value && value.length > 0) {
          txn.put(key, value);
        } else {
          txn.del(key);
        }
      }

      await this._db.commit(txn);
      logger.info({ numDbUpdates: this._pendingDbUpdates.size, force }, "Trie committed pending DB updates");

      this._pendingDbUpdates.clear();
      this._root.unloadChildren();
    };

    if (force || this._callsSinceLastUnload >= TRIE_UNLOAD_THRESHOLD) {
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
    } else {
      this._callsSinceLastUnload++;
    }
  }
}

export { MerkleTrie };
