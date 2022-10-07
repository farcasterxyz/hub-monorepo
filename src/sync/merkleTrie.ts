import { createHash } from 'crypto';
import { ID_LENGTH, SyncId } from '~/sync/syncId';

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

  public insert(key: string, value: string, current_index = 0): boolean {
    const char = key[current_index];

    // TODO: Optimize by using MPT extension nodes for leaves
    // We've reached the end of the key, add or update the value in a leaf node
    if (current_index === ID_LENGTH - 1) {
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
}

/**
 * Represents a MerkleTrie. It's conceptually very similar to a Merkle Patricia Tree (see
 * https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/).
 * We don't have extension nodes currently, so this is essentially a Merkle Radix Trie as
 * defined in the link above.
 */
class MerkleTrie {
  private readonly _root: TrieNode;

  constructor() {
    this._root = new TrieNode();
  }

  public insert(id: SyncId): void {
    this._root.insert(id.toString(), id.hashString);
  }

  public get(id: SyncId): string | undefined {
    return this._root.get(id.toString());
  }

  public get root(): TrieNode {
    return this._root;
  }

  public get items(): number {
    return this._root.items;
  }

  public get rootHash(): string {
    return this._root.hash;
  }
}

export { MerkleTrie, TrieNode };
