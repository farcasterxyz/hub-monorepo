import { Message } from '~/types';
import { createHash } from 'crypto';

const TIMESTAMP_LENGTH = 10;
const HASH_LENGTH = 128; // We're using 64 byte blake2b hashes
const ID_LENGTH = TIMESTAMP_LENGTH + HASH_LENGTH;

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

class TrieNode {
  private _hash: string;
  private _items: number;
  private _children: Map<string, TrieNode>;
  private readonly _value: string | null;

  constructor(value: string | null = null) {
    this._hash = '';
    this._items = 0;
    this._children = new Map();
    this._value = value;

    if (value !== null) {
      this._updateHash();
    }
  }

  public insert(key: string, value: string, current_index = 0) {
    const char = key[current_index];

    // TODO: Optimize by using MPT extension nodes for leaves
    if (current_index === ID_LENGTH - 1) {
      this._children.set(char, new TrieNode(value));
      this._children = new Map([...this._children.entries()].sort()); // Keep children sorted
      this._items += 1;
      this._updateHash();
      return;
    }

    if (!this._children.has(char)) {
      this._children.set(char, new TrieNode());
      this._children = new Map([...this._children.entries()].sort());
    }

    this._children.get(char)!.insert(key, value, current_index + 1);
    this._items += 1;
    this._updateHash();
  }

  private _updateHash() {
    if (this.isLeaf) {
      this._hash = createHash('sha256').update(this._value!).digest('hex');
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
  public get value(): string | null {
    if (this.isLeaf) {
      return this._value;
    }
    return null;
  }
}

class MerkleTrie {
  private readonly _root: TrieNode;

  constructor() {
    this._root = new TrieNode();
  }

  public insert(id: SyncId): void {
    this._root.insert(id.toString(), id.hashString);
  }

  public get root(): TrieNode {
    return this._root;
  }

  public get items(): number {
    return this._root.items;
  }

  public get hash(): string {
    return this._root.hash;
  }
}

export { MerkleTrie, SyncId, TrieNode };
