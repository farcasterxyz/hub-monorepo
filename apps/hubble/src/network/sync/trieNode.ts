import * as protobufs from '@farcaster/protobufs';
import { bytesCompare, HubError } from '@farcaster/utils';
import { blake3 } from '@noble/hashes/blake3';
import { ResultAsync } from 'neverthrow';
import { TIMESTAMP_LENGTH } from '~/network/sync/syncId';
import RocksDB from '~/storage/db/rocksdb';
import { RootPrefix } from '~/storage/db/types';
import { blake3Truncate160, BLAKE3TRUNCATE160_EMPTY_HASH } from '~/utils/crypto';
import { NodeMetadata } from './merkleTrie';

export const EMPTY_HASH = BLAKE3TRUNCATE160_EMPTY_HASH.toString('hex');
export const MAX_VALUES_RETURNED_PER_CALL = 1000;

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

type TrieNodeOpResult = {
  status: boolean;
  dbUpdatesMap: Map<Buffer, Buffer>;
};

// An empty type that represents a serialized trie node, which will need to be loaded from the db
class SerializedTrieNode {
  hash?: Uint8Array;

  constructor(hash?: Uint8Array) {
    if (hash) {
      this.hash = hash;
    }
  }
}

/**
 * Represents a node in a MerkleTrie. Automatically updates the hashes when items are added,
 * and keeps track of the number of items in the subtree.
 */
class TrieNode {
  private _hash: Uint8Array;
  private _items: number;
  private _children: Map<number, TrieNode | SerializedTrieNode>;
  private _key: Uint8Array | undefined;

  constructor() {
    this._hash = new Uint8Array();
    this._items = 0;
    this._children = new Map();
    this._key = undefined;
  }

  /**
   * Inserts a value into the trie. Returns true if the value was inserted, false if it already existed
   *
   * @param key - The key to insert
   * @param value - The value to insert
   * @param current_index - The index of the current character in the key (only used internally)
   * @returns true if the value was inserted, false if it already existed
   *
   * Recursively traverses the trie by prefix and inserts the value at the end. Updates the hashes for
   * every node that was traversed.
   */
  public async insert(
    key: Uint8Array,
    db: RocksDB,
    dbUpdatesMap: Map<Buffer, Buffer>,
    current_index = 0
  ): Promise<TrieNodeOpResult> {
    if (current_index >= key.length) {
      throw 'Key length exceeded';
    }
    const char = key.at(current_index) as number;

    // Do not compact the timestamp portion of the trie, since it is used to compare snapshots
    if (current_index >= TIMESTAMP_LENGTH && this.isLeaf && !this._key) {
      // Reached a leaf node with no value, insert it

      // The key is copied to a new Uint8Array to avoid using Buffer's shared memory pool. Since
      // TrieNode are long-lived objects, referencing shared memory pool will prevent them from being
      // freed and leak memory.
      this._key = key === undefined ? undefined : new Uint8Array(key);

      await this._updateHash(key.slice(0, current_index), db);
      this._items += 1;

      // Also save to db
      this.saveToDBTx(dbUpdatesMap, key.slice(0, current_index));

      return { status: true, dbUpdatesMap };
    }

    if (current_index >= TIMESTAMP_LENGTH && this.isLeaf) {
      if (bytesCompare(this._key ?? new Uint8Array(), key) === 0) {
        // If the same key exists, do nothing
        return { status: false, dbUpdatesMap };
      }

      // If the key is different, and a value exists, then split the node
      await this._splitLeafNode(current_index, db, dbUpdatesMap);
    }

    if (!this._children.has(char)) {
      this._addChild(char);
    }

    // Recurse into a non-leaf node and instruct it to insert the value
    const child = await this._getOrLoadChild(key.slice(0, current_index), char, db);
    const result = await child.insert(key, db, dbUpdatesMap, current_index + 1);

    const status = result.status;

    if (status) {
      this._items += 1;
      await this._updateHash(key.slice(0, current_index), db);

      // Save the current node to DB
      this.saveToDBTx(dbUpdatesMap, key.slice(0, current_index));
    }

    return { status, dbUpdatesMap };
  }

  /**
   * Deletes a value from the trie by key. Returns true if the value was deleted, false if it didn't exist
   *
   * @param key - The key to delete
   * @param current_index - The index of the current character in the key (only used internally)
   *
   * Ensures that there are no empty nodes after deletion. This is important to make sure the hashes
   * will match exactly with another trie that never had the value (e.g. in another hub).
   */
  public async delete(
    key: Uint8Array,
    db: RocksDB,
    dbUpdatesMap: Map<Buffer, Buffer>,
    current_index = 0
  ): Promise<TrieNodeOpResult> {
    if (this.isLeaf) {
      if (bytesCompare(this._key ?? new Uint8Array(), key) === 0) {
        this._items -= 1;
        this._key = undefined;

        this.deleteFromDbTx(dbUpdatesMap, key.slice(0, current_index));
        return { status: true, dbUpdatesMap };
      } else {
        return { status: false, dbUpdatesMap };
      }
    }

    if (current_index >= key.length) {
      throw 'Key length exceeded2';
    }
    const char = key.at(current_index) as number;
    if (!this._children.has(char)) {
      return { status: false, dbUpdatesMap };
    }

    const childTrieNode = await this._getOrLoadChild(key.slice(0, current_index), char, db);
    const result = await childTrieNode.delete(key, db, dbUpdatesMap, current_index + 1);

    const status = result.status;

    if (status) {
      this._items -= 1;
      // Delete the child if it's empty. This is required to make sure the hash will be the same
      // as another trie that doesn't have this node in the first place.
      if (childTrieNode.items === 0) {
        this._children.delete(char);

        if (this._items === 0) {
          // Delete this node
          this.deleteFromDbTx(dbUpdatesMap, key.slice(0, current_index));

          await this._updateHash(key.slice(0, current_index), db);
          return { status: true, dbUpdatesMap };
        }
      }

      if (this._items === 1 && this._children.size === 1 && current_index >= TIMESTAMP_LENGTH) {
        const char = this._children.keys().next().value;
        const child = await this._getOrLoadChild(key.slice(0, current_index), char, db);

        if (child._key) {
          this._key = child._key;
          this._children.delete(char);
          await this._updateHash(key.slice(0, current_index), db);

          // Delete child
          const childPrefix = Buffer.concat([key.slice(0, current_index), new Uint8Array([char])]);
          child.deleteFromDbTx(dbUpdatesMap, childPrefix);
        }
      }

      await this._updateHash(key.slice(0, current_index), db);
      this.saveToDBTx(dbUpdatesMap, key.slice(0, current_index));
    }

    return { status, dbUpdatesMap };
  }

  /**
   * Check if a key exists in the trie.
   * @param key - The key to look for
   * @param current_index - The index of the current character in the key (only used internally)
   */
  public async exists(key: Uint8Array, db: RocksDB, current_index = 0): Promise<boolean> {
    if (this.isLeaf && bytesCompare(this._key ?? new Uint8Array(), key) === 0) {
      return true;
    }

    if (current_index >= key.length) {
      throw 'Key length exceeded3';
    }
    const char = key.at(current_index) as number;
    if (!this._children.has(char)) {
      return false;
    }

    // NOTE: eslint falsely identifies as `fs.exists`.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const child = await this._getOrLoadChild(key.slice(0, current_index), char, db);
    const exists = (await child.exists(key, db, current_index + 1)) || false;

    return exists;
  }

  // Generates a snapshot for the current node and below until the prefix. currentIndex is the index of the prefix the method
  // is operating on
  public async getSnapshot(prefix: Uint8Array, db: RocksDB, currentIndex = 0): Promise<TrieSnapshot> {
    const excludedHashes: string[] = [];
    let numMessages = 0;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let currentNode: TrieNode = this; // traverse from current node
    for (let i = currentIndex; i < prefix.length; i++) {
      const currentPrefix = prefix.subarray(0, i);
      const char = prefix.at(i) as number;

      const excludedHash = await currentNode._excludedHash(currentPrefix, char, db);
      excludedHashes.push(excludedHash.hash);
      numMessages += excludedHash.items;

      if (!currentNode._children.has(char)) {
        return {
          prefix: currentPrefix,
          excludedHashes,
          numMessages,
        };
      }
      currentNode = await currentNode._getOrLoadChild(currentPrefix, char, db);
    }

    excludedHashes.push(Buffer.from(currentNode.hash).toString('hex'));

    return {
      prefix,
      excludedHashes,
      numMessages,
    };
  }

  public get items(): number {
    return this._items;
  }

  public get hash(): Uint8Array {
    return this._hash;
  }

  public get isLeaf(): boolean {
    return this._children.size === 0;
  }

  // Only available on leaf nodes
  public get value(): Uint8Array | undefined {
    if (this.isLeaf) {
      return this._key;
    }
    return undefined;
  }

  public async getNode(prefix: Uint8Array, db: RocksDB, current_index = 0): Promise<TrieNode | undefined> {
    if (current_index === prefix.length) {
      return this;
    }
    const char = prefix.at(current_index) as number;
    if (!this._children.has(char)) {
      return undefined;
    }
    const child = await this._getOrLoadChild(prefix.slice(0, current_index), char, db);
    const node = await child.getNode(prefix, db, current_index + 1);

    return node;
  }

  public async getNodeMetadata(prefix: Uint8Array, db: RocksDB): Promise<NodeMetadata> {
    const children = this.children || new Map();
    const result = new Map<number, NodeMetadata>();
    for (const [char] of children) {
      const child = await this._getOrLoadChild(prefix, char, db);
      const newPrefix = Buffer.concat([prefix, Buffer.from([char])]);
      result.set(char, {
        numMessages: child.items,
        prefix: newPrefix,
        hash: Buffer.from(child.hash).toString('hex'),
      });
    }

    return { prefix, children: result, numMessages: this.items, hash: Buffer.from(this.hash).toString('hex') };
  }

  public get children(): IterableIterator<[number, TrieNode | SerializedTrieNode]> {
    return this._children.entries();
  }

  public async getAllValues(prefix: Uint8Array, db: RocksDB): Promise<Uint8Array[]> {
    if (this.isLeaf) {
      return this._key ? [this._key] : [];
    }
    const values: Uint8Array[] = [];
    for (const [char] of this._children) {
      const child = await this._getOrLoadChild(prefix, char, db);
      values.push(...(await child.getAllValues(Buffer.concat([prefix, Buffer.from([char])]), db)));

      // Prevent this from growing indefinitely, since it could potentially load the whole trie.
      // Limit to 1000 values.
      if (values.length > MAX_VALUES_RETURNED_PER_CALL) {
        break;
      }
    }

    return values;
  }

  public unloadChildren() {
    // Replace all the children with SerializedTrieNodes. Make sure it include the hashes.

    // Collect all child chars
    const childChars = Array.from(this._children.keys());
    for (const char of childChars) {
      const child = this._children.get(char);
      this._children.set(char, new SerializedTrieNode(child?.hash));
    }
    // Sort the child chars
    this._children = new Map([...this._children.entries()].sort());
  }

  static makePrimaryKey(prefix: Uint8Array): Buffer {
    return Buffer.concat([Buffer.from([RootPrefix.SyncMerkleTrieNode]), prefix]);
  }

  static deserialize(serialized: Uint8Array): TrieNode {
    const dbtrieNode = protobufs.DbTrieNode.decode(serialized);

    const trieNode = new TrieNode();
    trieNode._key = dbtrieNode.key.length === 0 ? undefined : dbtrieNode.key;
    trieNode._items = dbtrieNode.items;
    trieNode._hash = dbtrieNode.hash;

    for (let i = 0; i < dbtrieNode.childChars.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      trieNode._children.set(dbtrieNode.childChars[i] as number, new SerializedTrieNode());
    }
    trieNode._children = new Map([...trieNode._children.entries()].sort());

    return trieNode;
  }

  /* Private methods */
  private serialize(): Buffer {
    const dbtrieNode = protobufs.DbTrieNode.create({
      key: this._key ?? new Uint8Array(),
      childChars: Array.from(this._children.keys()),
      items: this._items,
      hash: this._hash,
    });

    return Buffer.from(protobufs.DbTrieNode.encode(dbtrieNode).finish());
  }

  private saveToDBTx(dbUpdatesMap: Map<Buffer, Buffer>, prefix: Uint8Array): Map<Buffer, Buffer> {
    dbUpdatesMap.set(TrieNode.makePrimaryKey(prefix), this.serialize());
    return dbUpdatesMap;
  }

  private deleteFromDbTx(dbUpdatesMap: Map<Buffer, Buffer>, prefix: Uint8Array): Map<Buffer, Buffer> {
    dbUpdatesMap.set(TrieNode.makePrimaryKey(prefix), Buffer.from([]));
    return dbUpdatesMap;
  }

  private async _getOrLoadChild(prefix: Uint8Array, char: number, db: RocksDB): Promise<TrieNode> {
    const child = this._children.get(char);
    if (child instanceof TrieNode) {
      return child as TrieNode;
    } else {
      // The key to load is this node's key + the char
      const childPrefix = Buffer.concat([prefix, Buffer.from([char])]);
      const childKey = TrieNode.makePrimaryKey(childPrefix);
      const childBytes = await ResultAsync.fromPromise(db.get(childKey), (e) => {
        return new Error(`Failed to load child node: ${e}. Prefix: ${prefix.toString()}, char: ${char}`);
      });
      if (childBytes.isErr()) {
        // TODO: Should we throw here?
        throw childBytes.error;
      } else {
        const childNode = TrieNode.deserialize(childBytes.value);
        this._children.set(char, childNode);

        // Sort the child chars
        this._children = new Map([...this._children.entries()].sort());

        return childNode;
      }
    }
  }

  private async _excludedHash(
    prefix: Uint8Array,
    prefixChar: number,
    db: RocksDB
  ): Promise<{ items: number; hash: string }> {
    const hash = blake3.create({ dkLen: 20 });
    let excludedItems = 0;
    for (const [char] of this._children) {
      const child = await this._getOrLoadChild(prefix, char, db);
      if (prefixChar !== char) {
        hash.update(child.hash);
        excludedItems += child.items;
      }
    }

    const digest = hash.digest();
    return {
      hash: Buffer.from(digest.buffer, digest.byteOffset, digest.byteLength).toString('hex'),
      items: excludedItems,
    };
  }

  private _addChild(char: number) {
    this._children.set(char, new TrieNode());
    // The hash requires the children to be sorted, and sorting on insert/update is cheaper than
    // sorting each time we need to update the hash
    this._children = new Map([...this._children.entries()].sort());
  }

  // Splits a leaf node into a non-leaf node by clearing its key/value and adding a child for
  // the next char in its key
  private async _splitLeafNode(
    current_index: number,
    db: RocksDB,
    dbUpdatesMap: Map<Buffer, Buffer>
  ): Promise<Map<Buffer, Buffer>> {
    if (!this._key) {
      // This should never happen, check is here for type safety
      throw new HubError('bad_request', 'Cannot split a leaf node without a key and value');
    }

    const newChildChar = this._key.at(current_index) as number;
    this._addChild(newChildChar);
    const newChild = this._children.get(newChildChar) as TrieNode;
    await newChild.insert(this._key, db, dbUpdatesMap, current_index + 1);

    const prefix = this._key.slice(0, current_index);

    this._key = undefined;
    await this._updateHash(prefix, db);

    // Save the current node to the DB
    this.saveToDBTx(dbUpdatesMap, prefix);

    return dbUpdatesMap;
  }

  private async _updateHash(prefix: Uint8Array, db: RocksDB) {
    let digest: Uint8Array;
    if (this.isLeaf) {
      digest = blake3Truncate160(this.value);
    } else {
      const hash = blake3.create({ dkLen: 20 });
      for (const [char] of this._children) {
        // If the child hash is available, use it, else load the child and get its hash
        const childHash = this._children.get(char)?.hash;
        if (childHash) {
          hash.update(childHash);
        } else {
          const child = await this._getOrLoadChild(prefix, char, db);
          hash.update(child.hash);
        }
      }

      digest = hash.digest();
    }
    this._hash = digest;
  }

  // Commented out, but useful for debugging

  // public async verifyCounts(prefix: Uint8Array, db: RocksDB): Promise<boolean> {
  //   let count = this.isLeaf ? 1 : 0;

  //   if (this.isLeaf && this._key === undefined) {
  //     console.log(`Leaf node without key at ${Buffer.from(prefix).toString('hex')}`);
  //     return false;
  //   }

  //   for (const [char] of this._children) {
  //     const child = await this._getOrLoadChild(prefix, char, db);
  //     count += child.items;
  //   }

  //   if (count !== this.items) {
  //     console.log(
  //       `Count mismatch: ${count} !== ${this.items} at ${Buffer.from(prefix).toString('hex')} with ${
  //         this._children.size
  //       } children`
  //     );
  //     return false;
  //   }

  //   for (const [char] of this._children) {
  //     const child = await this._getOrLoadChild(prefix, char, db);
  //     const newPrefix = Buffer.concat([prefix, Buffer.from([char])]);
  //     if (!(await child.verifyCounts(newPrefix, db))) {
  //       return false;
  //     }
  //   }

  //   return true;
  // }

  // public async printTrie(prefix: Uint8Array, db: RocksDB): Promise<string> {
  //   let r = `${Buffer.from(prefix).toString('hex')}, ${this.items}, ${Buffer.from(this._hash).toString(
  //     'hex'
  //   )}, ${Buffer.from(this.value || new Uint8Array()).toString('hex')} \n`;

  //   for (const [char] of this._children) {
  //     const child = await this._getOrLoadChild(prefix, char, db);
  //     const newPrefix = Buffer.concat([prefix, Buffer.from([char])]);
  //     r = r + (await child.printTrie(newPrefix, db));
  //   }

  //   return r;
  // }
}

export { TrieNode };
