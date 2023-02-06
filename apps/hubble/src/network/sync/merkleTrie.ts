import ReadWriteLock from 'rwlock';
import { SyncId } from '~/network/sync/syncId';
import { TrieNode, TrieSnapshot } from '~/network/sync/trieNode';
import RocksDB from '~/storage/db/rocksdb';
import { logger } from '~/utils/logger';

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
  component: 'SyncMerkleTrie',
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

  constructor(rocksDb: RocksDB) {
    this._db = rocksDb;
    this._lock = new ReadWriteLock();

    // TODO If the root node is available in the DB load it from there
    this._root = new TrieNode();
    this._lock.writeLock(async (release) => {
      try {
        const rootBytes = await this._db.get(TrieNode.makePrimaryKey(new Uint8Array()));
        if (rootBytes && rootBytes.length > 0) {
          this._root = TrieNode.deserialize(rootBytes);
          log.info({}, 'Loaded MerkleTrie root from DB. Reclculating hash');
          await this._root.recalculateHash(new Uint8Array(), this._db);
          log.info({ rootHash: this._root.hash, items: this.items }, 'Merkle Trie loaded from DB');
        }
      } catch {
        // There is no Root node in the DB, just use an empty one
        this._root = new TrieNode();
      }

      release();
    });
  }

  public async insert(id: SyncId): Promise<boolean> {
    return new Promise((resolve) => {
      this._lock.writeLock(async (release) => {
        try {
          // Create a new DB transaction
          const { status, txn } = await this._root.insert(id.syncId(), this._db, this._db.transaction());

          // Write the transaction to the DB
          await this._db.commit(txn);

          release();
          resolve(status);
        } catch (e) {
          log.error('Insert Error', e);

          release();
          resolve(false);
        }
      });
    });
  }

  public async delete(id: SyncId): Promise<boolean> {
    return new Promise((resolve) => {
      this._lock.writeLock(async (release) => {
        try {
          // Create a new DB transaction
          const { status, txn } = await this._root.delete(id.syncId(), this._db, this._db.transaction());

          // Write the transaction to the DB
          await this._db.commit(txn);

          release();
          resolve(status);
        } catch (e) {
          log.error('Delete Error', e);

          release();
          resolve(false);
        }
      });
    });
  }

  public async exists(id: SyncId): Promise<boolean> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const r = await this._root.exists(id.syncId(), this._db);
        release();
        resolve(r);
      });
    });
  }

  public async getSnapshot(prefix: Uint8Array): Promise<TrieSnapshot> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        const r = await this._root.getSnapshot(prefix, this._db);
        release();
        resolve(r);
      });
    });
  }

  /**
   * Returns the subset of the prefix common to two different tries by comparing excluded hashes.
   *
   * @param prefix - the prefix of the external trie.
   * @param excludedHashes - the excluded hashes of the external trie.
   */
  public async getDivergencePrefix(prefix: Uint8Array, excludedHashes: string[]): Promise<Uint8Array> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        const ourExcludedHashes = (await this.getSnapshot(prefix)).excludedHashes;
        for (let i = 0; i < prefix.length; i++) {
          // NOTE: `i` is controlled by for loop and hence not at risk of object injection.
          // eslint-disable-next-line security/detect-object-injection
          if (ourExcludedHashes[i] !== excludedHashes[i]) {
            release();
            resolve(prefix.slice(0, i));
          }
        }
        release();
        resolve(prefix);
      });
    });
  }

  public async getTrieNodeMetadata(prefix: Uint8Array): Promise<NodeMetadata | undefined> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        const node = await this._root.getNode(prefix, this._db);
        if (node === undefined) {
          release();
          resolve(undefined);
        } else {
          const md = await node.getNodeMetadata(prefix, this._db);
          release();
          resolve(md);
        }
      });
    });
  }

  public async recalculateHash(): Promise<Uint8Array> {
    return new Promise((resolve) => {
      this._lock.writeLock(async (release) => {
        const r = await this._root.recalculateHash(new Uint8Array(), this._db);
        release();
        resolve(r);
      });
    });
  }

  public async getNode(prefix: Uint8Array): Promise<TrieNode | undefined> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        const r = await this._root.getNode(prefix, this._db);
        release();
        resolve(r);
      });
    });
  }

  public async getAllValues(prefix: Uint8Array): Promise<Uint8Array[]> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        const node = await this._root.getNode(prefix, this._db);
        if (node === undefined) {
          release();
          resolve([]);
        } else {
          const r = await node.getAllValues(prefix, this._db);
          release();
          resolve(r);
        }
      });
    });
  }

  public async items(): Promise<number> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        release();
        resolve(this._root.items);
      });
    });
  }

  public async rootHash(): Promise<string> {
    return new Promise((resolve) => {
      this._lock.readLock(async (release) => {
        release();
        resolve(Buffer.from(this._root.hash).toString('hex'));
      });
    });
  }
}

export { MerkleTrie };
