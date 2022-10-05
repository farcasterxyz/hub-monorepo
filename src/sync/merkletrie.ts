import { Message } from '~/types';
import { createHash } from 'crypto';

const TIMESTAMP_LENGTH = 10;
const HASH_LENGTH = 128; // We're using 64 byte blake2b hashes
const ID_LENGTH = TIMESTAMP_LENGTH + HASH_LENGTH;

/**
 * SyncId represent the unique id of a message in the sync protocol.
 * It is a combination of the message's timestamp and hash
 */
class SyncId {
  private readonly _timestamp: number;
  private readonly _hash: string;

  constructor(message: Message) {
    this._timestamp = message.data.signedAt;
    this._hash = message.hash;
  }

  public toString(): string {
    return `${this.timestampString}${this.hashString}`;
  }

  public get timestampString(): string {
    return Math.floor(this._timestamp / 1000)
      .toString()
      .padStart(TIMESTAMP_LENGTH, '0');
  }

  public get hashString(): string {
    return this._hash.slice(2);
  }
}

/**
 * Represents a node in a merkle trie. Automatically updates the hashes when items are added,
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

  public insert(key: string, value: string, current_index = 0) {
    const char = key[current_index];

    // TODO: Optimize by using MPT extension nodes for leaves
    if (current_index === ID_LENGTH - 1) {
      if (this._children.has(char) && this._children.get(char)?.value === value) {
        return false;
      }
      this._children.set(char, new TrieNode(value));
      this._children = new Map([...this._children.entries()].sort()); // Keep children sorted
      this._items += 1;
      this._updateHash();
      return true;
    }

    if (!this._children.has(char)) {
      this._children.set(char, new TrieNode());
      this._children = new Map([...this._children.entries()].sort());
    }

    const success = this._children.get(char)?.insert(key, value, current_index + 1);
    if (success) {
      this._items += 1;
      this._updateHash();
      return true;
    }
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

  private _updateHash() {
    // Optimize by using a faster hash algorithm. Potentially murmurhash v3
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
 * Represents a MerkleTrie. It's exactly like a Merkle tree, except that it's a trie.
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

export { MerkleTrie, SyncId, TrieNode };
