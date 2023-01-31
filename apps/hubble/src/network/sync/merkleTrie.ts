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
  prefix: Uint8Array;
  numMessages: number;
  hash: string;
  children?: Map<number, NodeMetadata>;
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
 *
 * Note about concurrency: This class and TrieNode are not thread-safe. This is fine because there are no async
 * methods, which means the operations won't be interrupted. DO NOT add async methods without considering
 * impact on concurrency-safety.
 */
class MerkleTrie {
  private readonly _root: TrieNode;

  constructor() {
    this._root = new TrieNode();
  }

  public insert(id: SyncId): boolean {
    return this._root.insert(id.syncId());
  }

  public delete(id: SyncId): boolean {
    return this._root.delete(id.syncId());
  }

  public exists(id: SyncId): boolean {
    // NOTE: eslint falsely identifies as `fs.exists`.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return this._root.exists(id.syncId());
  }

  // A snapshot captures the state of the trie excluding the nodes
  // specified in the prefix. See TrieSnapshot for more
  public getSnapshot(prefix: Uint8Array): TrieSnapshot {
    return this._root.getSnapshot(prefix);
  }

  // Compares excluded hashes of another trie with this trie to determine at which prefix the
  // states differ. Returns the subset of prefix that's common to both tries.
  public getDivergencePrefix(prefix: Uint8Array, excludedHashes: string[]): Uint8Array {
    const ourExcludedHashes = this.getSnapshot(prefix).excludedHashes;
    for (let i = 0; i < prefix.length; i++) {
      // NOTE: `i` is controlled by for loop and hence not at risk of object injection.
      // eslint-disable-next-line security/detect-object-injection
      if (ourExcludedHashes[i] !== excludedHashes[i]) {
        return prefix.slice(0, i);
      }
    }
    return prefix;
  }

  public getTrieNodeMetadata(prefix: Uint8Array): NodeMetadata | undefined {
    const node = this._root.getNode(prefix);
    if (node === undefined) {
      return undefined;
    }
    const children = node?.children || new Map();
    const result = new Map<number, NodeMetadata>();
    for (const [char, child] of children) {
      const newPrefix = Buffer.concat([prefix, Buffer.from([char])]);
      result.set(char, {
        numMessages: child.items,
        prefix: newPrefix,
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
