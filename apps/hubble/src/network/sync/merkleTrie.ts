import { ok, Result, ResultAsync } from "neverthrow";
import { DbTrieNode, HubAsyncResult, HubError, OnChainEvent, UserNameProof } from "@farcaster/hub-nodejs";
import { SyncId } from "./syncId.js";
import RocksDB from "../../storage/db/rocksdb.js";
import {
  FID_BYTES,
  HASH_LENGTH,
  OnChainEventPostfix,
  RootPrefix,
  UserMessagePostfixMax,
} from "../../storage/db/types.js";
import { logger } from "../../utils/logger.js";
import { messageDecode } from "../../storage/db/message.js";
import { BLAKE3TRUNCATE160_EMPTY_HASH } from "../../utils/crypto.js";
import {
  rsCreateMerkleTrie,
  rsCreateMerkleTrieFromDb,
  rsMerkleTrieBatchUpdate,
  rsMerkleTrieClear,
  rsMerkleTrieExists,
  rsMerkleTrieGetAllValues,
  rsMerkleTrieGetDb,
  rsMerkleTrieGetSnapshot,
  rsMerkleTrieGetTrieNodeMetadata,
  rsMerkleTrieInitialize,
  rsMerkleTrieItems,
  rsMerkleTrieRootHash,
  rsMerkleTrieStop,
  rsMerkleTrieUnloadChildren,
  RustMerkleTrie,
} from "../../rustfunctions.js";
import { statsd } from "../../utils/statsd.js";
import path, { dirname } from "path";
import fs from "fs";

export const EMPTY_HASH = BLAKE3TRUNCATE160_EMPTY_HASH.toString("hex");

/**
 * A snapshot of the trie at a particular timestamp which can be used to determine if two
 * hubs are in sync
 *
 * @prefix - The prefix (timestamp string) used to generate the snapshot
 * @excludedHashes - The hash of all the nodes excluding the prefix character at every index of the prefix
 * @numMessages - The total number of messages captured in the snapshot (excludes the prefix nodes)
 */
export type TrieSnapshot = {
  prefix: Uint8Array;
  excludedHashes: string[];
  numMessages: number;
};

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

export interface MerkleTrieKV {
  key: Uint8Array;
  value: Uint8Array;
}

export const TrieDBPathPrefix = "trieDb";
/**
 * MerkleTrie is a trie that contains Farcaster Messages SyncId and is used to diff the state of
 * two hubs on the network.
 *
 * Levels 1 to 10 of the trie represent the messages's timestamp while the remaining levels
 * represent its hash. It is conceptually similar to a Merkle Patricia Tree, but the current
 * implementation is closer to a Merkle Radix Trie, since it is missing extension nodes. See:
 * https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/.
 *
 */
class MerkleTrie {
  private _db: RocksDB;
  private _rustTrie: RustMerkleTrie;
  private _trieUpdatePending: boolean;
  private _trieInserts: Map<Uint8Array, (result: boolean) => void> = new Map();
  private _trieDeletes: Map<Uint8Array, (result: boolean) => void> = new Map();

  constructor(rocksDb: RocksDB, trieDb?: RocksDB) {
    this._db = rocksDb;
    this._trieUpdatePending = false;

    if (trieDb) {
      this._rustTrie = rsCreateMerkleTrieFromDb(trieDb.rustDb);
    } else {
      this._rustTrie = rsCreateMerkleTrie(rocksDb.location);
    }
  }

  // This is a static method that can be called to get the number of items in the trie.
  // NOTE: Calling this method requires exclusive open on RocksDB for given database path.
  // If there are any other processes that operate on RocksDB while this is running, there may be
  // inconsistencies or errors.
  public static async numItems(trie: MerkleTrie): HubAsyncResult<number> {
    // The trie database is instantiated with new Rocksdb, which will prefix an input path with ".rocks"
    const fullPath = path.join(trie._db.location, TrieDBPathPrefix);
    const normalizedPath = path.normalize(fullPath);
    const parts = normalizedPath.split(path.sep);
    // Remove the first directory. Note that the first element might be empty
    // if the path starts with a separator, indicating it's an absolute path.
    // In such a case, remove the second element instead.
    if (parts[0] === "") {
      parts.splice(1, 1); // Remove the second element for absolute paths
    } else {
      parts.splice(0, 1); // Remove the first element for relative paths
    }

    // NOTE: trie._db.location has `.rocks` prefix. If we don't remove it, calling new RocksDB will end up with
    // `.rocks/.rocks` prefix. This will throw an error because RocksDB won't be able to find the parent path.
    const location = parts.join(path.sep);
    if (!fs.existsSync(dirname(normalizedPath))) {
      return ok(0);
    }

    const db = new RocksDB(location);
    await db.open();

    const rootPrimaryKey = Buffer.from([RootPrefix.SyncMerkleTrieNode]);
    const rootResult = await ResultAsync.fromPromise(db.get(rootPrimaryKey), (e) => e as HubError);
    db.close();

    // If the root key was not found, return 0
    if (rootResult.isErr()) {
      return ok(0);
    }

    const rootBytes = rootResult.value;
    // If the root is empty, return 0
    if (!(rootBytes && rootBytes.length > 0)) {
      return ok(0);
    }

    const dbtrieNode = DbTrieNode.decode(rootBytes);
    return ok(dbtrieNode.items);
  }

  public async clear(): Promise<void> {
    this._trieInserts.clear();
    this._trieDeletes.clear();

    return await rsMerkleTrieClear(this._rustTrie);
  }

  public async stop(): Promise<void> {
    return await rsMerkleTrieStop(this._rustTrie);
  }

  public async initialize(): Promise<void> {
    log.info("Initializing Merkle Trie");
    return await rsMerkleTrieInitialize(this._rustTrie);
  }

  public async rebuild(): Promise<void> {
    await this.clear();

    // Rebuild the trie by iterating over all the messages, on chain events and fnames  in the db
    let count = 0;

    // Messages
    await this._db.forEachIteratorByPrefix(Buffer.from([RootPrefix.User]), async (key, value) => {
      const postfix = (key as Buffer).readUint8(1 + FID_BYTES);
      if (postfix < UserMessagePostfixMax) {
        const message = Result.fromThrowable(
          () => messageDecode(new Uint8Array(value as Buffer)),
          (e) => e as HubError,
        )();
        if (message.isOk() && message.value.hash.length === HASH_LENGTH) {
          await this.insert(SyncId.fromMessage(message.value));
          count += 1;
          if (count % 10_000 === 0) {
            log.info({ count }, "Rebuilding Merkle Trie");
          }
        }
      }
    });
    log.info({ count }, "Rebuilt messages trie");
    // On chain events
    await this._db.forEachIteratorByPrefix(Buffer.from([RootPrefix.OnChainEvent]), async (key, value) => {
      const postfix = (key as Buffer).readUint8(1);
      if (postfix === OnChainEventPostfix.OnChainEvents) {
        const event = Result.fromThrowable(
          () => OnChainEvent.decode(new Uint8Array(value as Buffer)),
          (e) => e as HubError,
        )();
        if (event.isOk()) {
          await this.insert(SyncId.fromOnChainEvent(event.value));
          count += 1;
          if (count % 10_000 === 0) {
            log.info({ count }, "Rebuilding Merkle Trie (events)");
          }
        }
      }
    });
    log.info({ count }, "Rebuilt events trie");
    await this._db.forEachIteratorByPrefix(Buffer.from([RootPrefix.FNameUserNameProof]), async (key, value) => {
      const proof = Result.fromThrowable(
        () => UserNameProof.decode(new Uint8Array(value as Buffer)),
        (e) => e as HubError,
      )();
      if (proof.isOk()) {
        await this.insert(SyncId.fromFName(proof.value));
        count += 1;
        if (count % 10_000 === 0) {
          log.info({ count }, "Rebuilding Merkle Trie (proofs)");
        }
      }
    });
    log.info({ count }, "Rebuilt fnmames trie");
  }

  countPendingUpdates(): number {
    return this._trieInserts.size + this._trieDeletes.size;
  }

  async doBatchUpdate() {
    this._trieUpdatePending = true;
    // Keep inserting while there are pending updates
    while (this.countPendingUpdates() > 0) {
      statsd().gauge("merkle_trie.pending_updates", this.countPendingUpdates());

      const insertUpdates = Array.from(this._trieInserts);
      this._trieInserts = new Map();

      const deleteUpdates = Array.from(this._trieDeletes);
      this._trieDeletes = new Map();

      const results = await ResultAsync.fromPromise(
        rsMerkleTrieBatchUpdate(
          this._rustTrie,
          insertUpdates.map(([key, _]) => key),
          deleteUpdates.map(([key, _]) => key),
        ),
        (e) => e as HubError,
      );

      if (results.isErr()) {
        log.error({ error: results.error }, "Error batch updating trie");
        // Resolve all the pending updates with false
        insertUpdates.forEach(([_, resolve]) => resolve(false));
        deleteUpdates.forEach(([_, resolve]) => resolve(false));
      } else {
        const allResults = results.value;
        // Resolve all the pending updates with the result. The allResults are concatenated
        // so we should also concat the insert+delete updates
        let i = 0;
        insertUpdates.forEach(([_, resolve]) => resolve(allResults[i++] as boolean));
        deleteUpdates.forEach(([_, resolve]) => resolve(allResults[i++] as boolean));
      }

      // Sleep for a bit to let any promises resolve. This is Ok, because the
      // doBatchUpdate() call is never blocking
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
    this._trieUpdatePending = false;
  }

  public async insert(id: SyncId): Promise<boolean> {
    return (await this.insertBytes([id.syncId()]))[0] as boolean;
  }

  public async insertBatch(ids: SyncId[]): Promise<boolean[]> {
    return await this.insertBytes(ids.map((id) => id.syncId()));
  }

  public async insertBytes(ids: Uint8Array[]): Promise<boolean[]> {
    const allPromises: Promise<boolean>[] = [];
    return new Promise<boolean[]>((resolve) => {
      ids.forEach((id) => {
        allPromises.push(
          new Promise<boolean>((resolve) => {
            this._trieInserts.set(id, resolve);
            // Remove it from the delete queue if it was there
            const resolveFn = this._trieDeletes.get(id);
            if (resolveFn) {
              this._trieDeletes.delete(id);
              resolveFn(true);
            }
          }),
        );
      });

      if (this._trieUpdatePending) {
        // Nothing to do, it will be processed at the next opportunity
      } else {
        // Trigger the update
        void this.doBatchUpdate();
      }

      resolve(Promise.all(allPromises));
    });
  }

  public async delete(id: SyncId): Promise<boolean> {
    return (await this.deleteByBytes([id.syncId()]))[0] as boolean;
  }

  public async deleteByBytes(ids: Uint8Array[]): Promise<boolean[]> {
    const allPromises: Promise<boolean>[] = [];
    return new Promise<boolean[]>((resolve) => {
      ids.forEach((id) => {
        allPromises.push(
          new Promise<boolean>((resolve) => {
            this._trieDeletes.set(id, resolve);
            // Remove it from the insert queue if it was there
            const resolveFn = this._trieInserts.get(id);
            if (resolveFn) {
              this._trieInserts.delete(id);
              resolveFn(true);
            }
          }),
        );
      });

      if (this._trieUpdatePending) {
        // Nothing to do, it will be processed at the next opportunity
      } else {
        // Trigger the update
        void this.doBatchUpdate();
      }

      resolve(Promise.all(allPromises));
    });
  }

  /**
   * Check if the SyncId exists in the trie.
   */
  public async exists(id: SyncId): Promise<boolean> {
    return await this.existsByBytes(id.syncId());
  }

  /**
   * Check if we already have this syncID (expressed as bytes)
   */
  public async existsByBytes(id: Uint8Array): Promise<boolean> {
    return await rsMerkleTrieExists(this._rustTrie, id);
  }

  /**
   * Get a snapshot of the trie at a given prefix.
   */
  public async getSnapshot(prefix: Uint8Array): Promise<TrieSnapshot> {
    return await rsMerkleTrieGetSnapshot(this._rustTrie, prefix);
  }

  /**
   * Get the metadata for a node in the trie at the given prefix.
   */
  public async getTrieNodeMetadata(prefix: Uint8Array): Promise<NodeMetadata | undefined> {
    return await rsMerkleTrieGetTrieNodeMetadata(this._rustTrie, prefix);
  }

  /**
   * Get all the values at the prefix.
   */
  public async getAllValues(prefix: Uint8Array): Promise<Uint8Array[]> {
    return await rsMerkleTrieGetAllValues(this._rustTrie, prefix);
  }

  public async items(): Promise<number> {
    return await rsMerkleTrieItems(this._rustTrie);
  }

  public async rootHash(): Promise<string> {
    return await rsMerkleTrieRootHash(this._rustTrie);
  }

  public async unloadChildrenAtRoot(): Promise<void> {
    return await rsMerkleTrieUnloadChildren(this._rustTrie);
  }

  public getDb(): RocksDB {
    const rustDb = rsMerkleTrieGetDb(this._rustTrie);
    return RocksDB.fromRustDb(rustDb);
  }

  public async commitToDb(): Promise<void> {
    return await this.unloadChildrenAtRoot();
  }
}

export { MerkleTrie };
