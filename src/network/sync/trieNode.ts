import { createHash } from 'crypto';

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
  private readonly _value: string | undefined;

  constructor(value: string | undefined = undefined) {
    this._hash = '';
    this._items = 0;
    this._children = new Map();
    this._value = value;

    if (value !== undefined) {
      this._updateHash();
    }
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
  public insert(key: string, value: string, current_index = 0): boolean {
    const char = key[current_index];

    // TODO: Optimize by using MPT extension nodes for leaves
    // We've reached the end of the key, add or update the value in a leaf node
    if (current_index === key.length - 1) {
      // Key with the same value already exists, so no need to modify the tree
      if (this._children.has(char) && this._children.get(char)?.value === value) {
        return false;
      }
      this._addChild(char, value);
      this._items += 1;
      this._updateHash();
      return true;
    }

    if (!this._children.has(char)) {
      this._addChild(char);
    }

    // Recurse into a non-leaf node and instruct it to insert the value
    const success = this._children.get(char)?.insert(key, value, current_index + 1);
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
      return true;
    }

    const char = key[current_index];
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
      this._updateHash();
      return true;
    }

    return false;
  }

  public get(key: string): string | undefined {
    if (this.isLeaf) {
      return this._value;
    }

    const char = key[0];
    if (!this._children.has(char)) {
      return undefined;
    }

    return this._children.get(char)?.get(key.slice(1));
  }

  // Generates a snapshot for the current node and below. current_index is the index of the prefix the method is operating on
  public getSnapshot(prefix: string, current_index = 0): TrieSnapshot {
    const char = prefix[current_index];
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
      return this._value;
    }
    return undefined;
  }

  public getNode(prefix: string): TrieNode | undefined {
    if (prefix.length === 0) {
      return this;
    }
    const char = prefix[0];
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
      return this._value ? [this._value] : [];
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
    const hash = createHash('sha256');
    let excludedItems = 0;
    this._children.forEach((child, key) => {
      if (key !== char) {
        hash.update(child.hash);
        excludedItems += child.items;
      }
    });
    return { hash: hash.digest('hex'), items: excludedItems };
  }

  private _addChild(char: string, value: string | undefined = undefined) {
    this._children.set(char, new TrieNode(value));
    // The hash requires the children to be sorted, and sorting on insert/update is cheaper than
    // sorting each time we need to update the hash
    this._children = new Map([...this._children.entries()].sort());
  }

  private _updateHash() {
    // TODO: Optimize by using a faster hash algorithm. Potentially murmurhash v3
    if (this.isLeaf) {
      this._hash = createHash('sha256')
        .update(this._value || '')
        .digest('hex');
    } else {
      const hash = createHash('sha256');
      this._children.forEach((child) => {
        hash.update(child.hash);
      });
      this._hash = hash.digest('hex');
    }
  }
}

export { TrieNode };
