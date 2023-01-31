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

  public getSnapshot(prefix: Uint8Array): TrieSnapshot {
    return this._root.getSnapshot(prefix);
  }

  /**
   * Returns the subset of the prefix common to two different tries by comparing excluded hashes.
   *
   * @param prefix - the prefix of the external trie.
   * @param excludedHashes - the excluded hashes of the external trie.
   */
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
