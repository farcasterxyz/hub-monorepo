import { HubError } from '@farcaster/utils';
import { blake3 } from '@noble/hashes/blake3';
import { TIMESTAMP_LENGTH } from '~/network/sync/syncId';

export const EMPTY_HASH = Buffer.from(blake3('', { dkLen: 20 })).toString('hex');

/**
 * A snapshot of the trie at a particular timestamp which can be used to determine if two
 * hubs are in sync
 *
 * @prefix - The prefix (timestamp string) used to generate the snapshot
 * @excludedHashes - The hash of all the nodes excluding the prefix character at every index of the prefix
 * @numMessages - The total number of messages captured in the snapshot (excludes the prefix nodes)
 */
export type TrieSnapshot = {
  prefix: string;
  excludedHashes: string[];
  numMessages: number;
};

/**
 * Represents a node in a MerkleTrie. Automatically updates the hashes when items are added,
 * and keeps track of the number of items in the subtree.
 */
class TrieNode {
  private _hash: string;
  private _items: number;
  private _children: Map<string, TrieNode>;
  private _key: string | undefined;

  constructor() {
    this._hash = '';
    this._items = 0;
    this._children = new Map();
    this._key = undefined;
  }

  /**
   * Inserts a value into the trie. Returns true if the value was inserted, false if it already existed
   * @param key - The key to insert
   * @param value - The value to insert
   * @param current_index - The index of the current character in the key (only used internally)
   * @returns true if the value was inserted, false if it already existed
   *
   * Recursively traverses the trie by prefix and inserts the value at the end. Updates the hashes for
   * every node that was traversed.
   */
  public insert(key: string, current_index = 0): boolean {
    const char = key.charAt(current_index);

    // Do not compact the timestamp portion of the trie, since it's used to compare snapshots
    if (current_index >= TIMESTAMP_LENGTH && this.isLeaf && !this._key) {
      // Reached a leaf node with no value, insert it
      this._setKeyValue(key);
      this._items += 1;
      return true;
    }

    if (current_index >= TIMESTAMP_LENGTH && this.isLeaf) {
      if (this._key == key) {
        // If the same key exists, do nothing
        return false;
      }
      // If the key is different, and a value exists, then split the node
      this._splitLeafNode(current_index);
    }

    if (!this._children.has(char)) {
      this._addChild(char);
    }

    // Recurse into a non-leaf node and instruct it to insert the value
    const success = this._children.get(char)?.insert(key, current_index + 1);
    if (success) {
      this._items += 1;
      this._updateHash();
      return true;
    }

    return false;
  }

  /**
   * Deletes a value from the trie by key. Returns true if the value was deleted, false if it didn't exist
   * @param key - The key to delete
   * @param current_index - The index of the current character in the key (only used internally)
   *
   * Ensures that there are no empty nodes after deletion. This is important to make sure the hashes
   * will match exactly with another trie that never had the value (e.g. in another hub).
   */
  public delete(key: string, current_index = 0): boolean {
    if (this.isLeaf) {
      if (this._key === key) {
        this._items -= 1;
        this._setKeyValue(undefined);
        return true;
      } else {
        return false;
      }
    }

    const char = key.charAt(current_index);
    if (!this._children.has(char)) {
      return false;
    }

    const success = this._children.get(char)?.delete(key, current_index + 1);
    if (success) {
      this._items -= 1;
      // Delete the child if it's empty. This is required to make sure the hash will be the same
      // as another trie that doesn't have this node in the first place.
      if (this._children.get(char)?.items === 0) {
        this._children.delete(char);
      }

      if (this._items === 1 && this._children.size === 1 && current_index >= TIMESTAMP_LENGTH) {
        // Compact the node if it has only one child
        const [char, child] = this._children.entries().next().value;
        if (child._key) {
          this._setKeyValue(child._key);
          this._children.delete(char);
        }
      }

      this._updateHash();
      return true;
    }

    return false;
  }

  /**
   * Check if a key exists in the trie.
   * @param key - The key to look for
   * @param current_index - The index of the current character in the key (only used internally)
   */
  public exists(key: string, current_index = 0): boolean {
    if (this.isLeaf && this._key === key) {
      return true;
    }

    const char = key.charAt(current_index);
    if (!this._children.has(char)) {
      return false;
    }

    // NOTE: eslint falsely identifies as `fs.exists`.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return this._children.get(char)?.exists(key, current_index + 1) || false;
  }

  // Generates a snapshot for the current node and below. current_index is the index of the prefix the method is operating on
  public getSnapshot(prefix: string, current_index = 0): TrieSnapshot {
    const char = prefix.charAt(current_index);
    if (current_index === prefix.length - 1) {
      const excludedHash = this._excludedHash(char);
      return {
        prefix: prefix,
        excludedHashes: [excludedHash.hash],
        numMessages: excludedHash.items,
      };
    }

    const innerSnapshot = this._children.get(char)?.getSnapshot(prefix, current_index + 1);
    const excludedHash = this._excludedHash(char);
    return {
      prefix: innerSnapshot?.prefix || prefix.slice(0, current_index + 1),
      excludedHashes: [excludedHash.hash, ...(innerSnapshot?.excludedHashes || [])],
      numMessages: excludedHash.items + (innerSnapshot?.numMessages || 0),
    };
  }

  public get items(): number {
    return this._items;
  }

  public get hash(): string {
    return this._hash;
  }

  public get isLeaf(): boolean {
    return this._children.size === 0;
  }

  // Only available on leaf nodes
  public get value(): string | undefined {
    if (this.isLeaf) {
      return this._key;
    }
    return undefined;
  }

  public getNode(prefix: string): TrieNode | undefined {
    if (prefix.length === 0) {
      return this;
    }
    const char = prefix.charAt(0);
    if (!this._children.has(char)) {
      return undefined;
    }
    return this._children.get(char)?.getNode(prefix.slice(1));
  }

  public get children(): IterableIterator<[string, TrieNode]> {
    return this._children.entries();
  }

  public getAllValues(): string[] {
    if (this.isLeaf) {
      return this._key ? [this._key] : [];
    }
    const values: string[] = [];
    this._children.forEach((child) => {
      values.push(...child.getAllValues());
    });
    return values;
  }

  /* Private methods */

  private _excludedHash(char: string): { items: number; hash: string } {
    // TODO: Cache this for performance
    const hash = blake3.create({ dkLen: 20 });
    let excludedItems = 0;
    this._children.forEach((child, key) => {
      if (key !== char) {
        hash.update(child.hash);
        excludedItems += child.items;
      }
    });
    return { hash: Buffer.from(hash.digest()).toString('hex'), items: excludedItems };
  }

  private _addChild(char: string) {
    this._children.set(char, new TrieNode());
    // The hash requires the children to be sorted, and sorting on insert/update is cheaper than
    // sorting each time we need to update the hash
    this._children = new Map([...this._children.entries()].sort());
  }

  private _setKeyValue(key: string | undefined) {
    this._key = key;
    this._updateHash();
  }

  // Splits a leaf node into a non-leaf node by clearing its key/value and adding a child for
  // the next char in its key
  private _splitLeafNode(current_index: number) {
    if (!this._key) {
      // This should never happen, check is here for type safety
      throw new HubError('bad_request', 'Cannot split a leaf node without a key and value');
    }
    const newChildChar = this._key.charAt(current_index);
    this._addChild(newChildChar);
    this._children.get(newChildChar)?.insert(this._key, current_index + 1);
    this._setKeyValue(undefined);
  }

  private _updateHash() {
    if (this.isLeaf) {
      this._hash = Buffer.from(blake3(this.value || '', { dkLen: 20 })).toString('hex');
    } else {
      const hash = blake3.create({ dkLen: 20 });
      this._children.forEach((child) => {
        hash.update(child.hash);
      });
      this._hash = Buffer.from(hash.digest()).toString('hex');
    }
  }
}

export { TrieNode };
