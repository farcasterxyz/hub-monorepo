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
import { BLAKE3TRUNCATE160_EMPTY_HASH, sleep } from "../../utils/crypto.js";
import {
  rsCreateMerkleTrie,
  rsCreateMerkleTrieFromDb,
  rsMerkleTrieClear,
  rsMerkleTrieDelete,
  rsMerkleTrieExists,
  rsMerkleTrieGetAllValues,
  rsMerkleTrieGetDb,
  rsMerkleTrieGetSnapshot,
  rsMerkleTrieGetTrieNodeMetadata,
  rsMerkleTrieInitialize,
  rsMerkleTrieInsert,
  rsMerkleTrieItems,
  rsMerkleTrieMigrate,
  rsMerkleTrieRootHash,
  rsMerkleTrieStop,
  rsMerkleTrieUnloadChildren,
  RustMerkleTrie,
} from "../../rustfunctions.js";
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

  constructor(rocksDb: RocksDB, trieDb?: RocksDB) {
    this._db = rocksDb;

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

  public async insert(id: SyncId): Promise<boolean> {
    return await rsMerkleTrieInsert(this._rustTrie, id.syncId());
  }

  public async insertBytes(id: Uint8Array): Promise<boolean> {
    return await rsMerkleTrieInsert(this._rustTrie, id);
  }

  public async migrate(keys: Uint8Array[], values: Uint8Array[]): Promise<number> {
    return await rsMerkleTrieMigrate(this._rustTrie, keys, values);
  }

  public async deleteBySyncId(id: SyncId): Promise<boolean> {
    return await rsMerkleTrieDelete(this._rustTrie, id.syncId());
  }

  public async deleteByBytes(id: Uint8Array): Promise<boolean> {
    return await rsMerkleTrieDelete(this._rustTrie, id);
  }

  /**
   * Check if the SyncId exists in the trie.
   */
  public async exists(id: SyncId): Promise<boolean> {
    return await rsMerkleTrieExists(this._rustTrie, id.syncId());
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

  public async unloadChidrenAtRoot(): Promise<void> {
    return await rsMerkleTrieUnloadChildren(this._rustTrie);
  }

  public getDb(): RocksDB {
    const rustDb = rsMerkleTrieGetDb(this._rustTrie);
    return RocksDB.fromRustDb(rustDb);
  }

  public async commitToDb(): Promise<void> {
    return await this.unloadChidrenAtRoot();
  }
}

export { MerkleTrie };
