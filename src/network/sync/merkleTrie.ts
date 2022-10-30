import { SyncId } from '~/network/sync/syncId';
import { TrieNode, TrieSnapshot } from '~/network/sync/trieNode';

/**
 * Represents a node in the trie, and it's immediate children
 *
 * @prefix - The prefix of the node, uniquely describes its position in the trie
 * @numMessages - The number of messages under this node
 * @hash - The merkle hash of the node
 * @children - The immediate children of this node
 */
export type NodeMetadata = {
  prefix: string;
  numMessages: number;
  hash: string;
  children?: Map<string, NodeMetadata>;
};

/**
 * Represents a MerkleTrie. It's conceptually very similar to a Merkle Patricia Tree (see
 * https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/).
 * We don't have extension nodes currently, so this is essentially a Merkle Radix Trie as
 * defined in the link above.
 *
 * The first 10 levels of the trie are used to represent the timestamp of the messages (see SyncID).
 * The "prefix" refers to a subset of the timestamp string. This is used to determine the state of the trie
 * (and therefore the hub's messages) at a particular point in time.
 *
 * Comparing the state of two tries (represented by the snapshot) for the same prefix allows us to determine
 * whether two hubs are in sync, and the earliest point of divergence if not.
 */
class MerkleTrie {
  private readonly _root: TrieNode;

  constructor() {
    this._root = new TrieNode();
  }

  public insert(id: SyncId): void {
    this._root.insert(id.toString(), id.hashString);
  }

  public delete(id: SyncId): void {
    this._root.delete(id.toString());
  }

  public get(id: SyncId): string | undefined {
    return this._root.get(id.toString());
  }

  // A snapshot captures the state of the trie excluding the nodes
  // specified in the prefix. See TrieSnapshot for more
  public getSnapshot(prefix: string): TrieSnapshot {
    return this._root.getSnapshot(prefix);
  }

  // Compares excluded hashes of another trie with this trie to determine at which prefix the
  // states differ. Returns the subset of prefix that's common to both tries.
  public getDivergencePrefix(prefix: string, excludedHashes: string[]): string {
    const ourExcludedHashes = this.getSnapshot(prefix).excludedHashes;
    for (let i = 0; i < prefix.length; i++) {
      if (ourExcludedHashes[i] !== excludedHashes[i]) {
        return prefix.slice(0, i);
      }
    }
    return prefix;
  }

  public getNodeMetadata(prefix: string): NodeMetadata | undefined {
    const node = this._root.getNode(prefix);
    if (node === undefined) {
      return undefined;
    }
    const children = node?.children || new Map();
    const result = new Map<string, NodeMetadata>();
    for (const [char, child] of children) {
      result.set(char, {
        numMessages: child.items,
        prefix: prefix + char,
        hash: child.hash,
      });
    }
    return { prefix, children: result, numMessages: node.items, hash: node.hash };
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

export { MerkleTrie };
