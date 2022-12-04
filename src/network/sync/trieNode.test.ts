import { Factories } from '~/test/factories';
import { TrieNode } from '~/network/sync/trieNode';
import { TIMESTAMP_LENGTH } from '~/network/sync/syncId';
import { createHash } from 'crypto';

const emptyHash = createHash('sha256').digest('hex');
const sharedDate = new Date(1665182332000);
const sharedPrefixHashA =
  '0x09bc3dad4e7f2a77bbb2cccbecb06febfc3f0cbe7ea6a774d2dc043fd45c2c9912f130bf502c88fdedf7bbc4cd20b47aab2079e2d5cbd0a35afd2deec86a4321';
const sharedPrefixHashB =
  '0x09bc3dad4e7f2a77bbb2cccbecb06febfc3f0cbe7ea6a774d2dc043fd45c2c9912f130bf502c88fdedf7bbc4cd20b47aab2079e2d5cbd0a35afd2deec86b1234';

describe('TrieNode', () => {
  // Traverse the node until we find a leaf or path splits into multiple choices
  const traverse = (node: TrieNode): TrieNode => {
    if (node.isLeaf) {
      return node;
    }
    const children = Array.from(node.children);
    if (children.length > 1) {
      return node;
    }
    return traverse((children[0] as [string, TrieNode])[1]);
  };

  describe('insert', () => {
    test('succeeds inserting a single item', async () => {
      const root = new TrieNode();
      const id = Factories.SyncId.build();

      expect(root.items).toEqual(0);
      expect(root.hash).toEqual('');

      root.insert(id.toString(), id.hashString);

      expect(root.items).toEqual(1);
      expect(root.hash).toBeTruthy();
    });

    test('inserting the same item twice is idempotent', async () => {
      const root = new TrieNode();
      const id = Factories.SyncId.build();

      root.insert(id.toString(), id.hashString);
      expect(root.items).toEqual(1);
      const previousHash = root.hash;
      root.insert(id.toString(), id.hashString);

      expect(root.hash).toEqual(previousHash);
      expect(root.items).toEqual(1);
    });

    test('inserting the same key with a different value does nothing', async () => {
      const root = new TrieNode();
      const id = Factories.SyncId.build();
      const id2 = Factories.SyncId.build();

      root.insert(id.toString(), id.hashString);
      expect(root.items).toEqual(1);
      expect(root.get(id.toString())).toEqual(id.hashString);
      const previousHash = root.hash;
      root.insert(id.toString(), id2.hashString);

      expect(root.hash).toEqual(previousHash);
      expect(root.items).toEqual(1);
      expect(root.get(id.toString())).toEqual(id.hashString);
    });

    test('insert compacts hashstring component of syncid to single node for efficiency', async () => {
      const root = new TrieNode();
      const id = Factories.SyncId.build();

      root.insert(id.toString(), id.hashString);
      let node = root;
      // Timestamp portion of the key is not collapsed, but the hash portion is
      for (let i = 0; i < TIMESTAMP_LENGTH; i++) {
        const children = Array.from(node.children);
        const firstChild = children[0] as [string, TrieNode];
        expect(children.length).toEqual(1);
        node = firstChild[1];
      }

      expect(node.isLeaf).toEqual(true);
      expect(node.value).toEqual(id.hashString);
    });

    test('inserting another key with a common prefix splits the node', async () => {
      // Generate two ids with the same timestamp and the same hash prefix. The trie should split the node
      // where they diverge
      const id1 = Factories.SyncId.build(undefined, { transient: { date: sharedDate, hash: sharedPrefixHashA } });
      const id2 = Factories.SyncId.build(undefined, { transient: { date: sharedDate, hash: sharedPrefixHashB } });

      const root = new TrieNode();
      root.insert(id1.toString(), id1.hashString);
      root.insert(id2.toString(), id2.hashString);

      const splitNode = traverse(root);
      expect(splitNode.items).toEqual(2);
      const children = Array.from(splitNode.children);
      const firstChild = children[0] as [string, TrieNode];
      const secondChild = children[1] as [string, TrieNode];
      expect(children.length).toEqual(2);
      // hash1 node
      expect(firstChild[0]).toEqual('a');
      expect(firstChild[1].isLeaf).toBeTruthy();
      expect(firstChild[1].value).toEqual(id1.hashString);
      // hash2 node
      expect(secondChild[0]).toEqual('b');
      expect(secondChild[1].isLeaf).toBeTruthy();
      expect(secondChild[1].value).toEqual(id2.hashString);
    });
  });

  describe('delete', () => {
    test('deleting a single item removes the node', async () => {
      const root = new TrieNode();
      const id = Factories.SyncId.build();

      root.insert(id.toString(), id.hashString);
      expect(root.items).toEqual(1);

      root.delete(id.toString());
      expect(root.items).toEqual(0);
      expect(root.hash).toEqual(emptyHash);
    });

    test('deleting a single item from a node with multiple items removes the item', async () => {
      const root = new TrieNode();
      const id1 = Factories.SyncId.build(undefined, { transient: { date: sharedDate } });
      const id2 = Factories.SyncId.build(undefined, { transient: { date: sharedDate } });

      root.insert(id1.toString(), id1.hashString);
      const previousHash = root.hash;
      root.insert(id2.toString(), id2.hashString);
      expect(root.items).toEqual(2);

      root.delete(id2.toString());
      expect(root.items).toEqual(1);
      expect(root.get(id2.toString())).toBeUndefined();
      expect(root.hash).toEqual(previousHash);
    });

    test('deleting a single item from a split node should preserve previous hash', async () => {
      const id1 = Factories.SyncId.build(undefined, { transient: { date: sharedDate, hash: sharedPrefixHashA } });
      const id2 = Factories.SyncId.build(undefined, { transient: { date: sharedDate, hash: sharedPrefixHashB } });

      const root = new TrieNode();
      root.insert(id1.toString(), id1.hashString);
      const previousRootHash = root.hash;
      const leafNode = traverse(root);
      root.insert(id2.toString(), id2.hashString);

      expect(root.hash).not.toEqual(previousRootHash);

      root.delete(id2.toString());

      const newLeafNode = traverse(root);
      expect(newLeafNode).toEqual(leafNode);
      expect(root.hash).toEqual(previousRootHash);
    });
  });

  describe('get', () => {
    test('getting a single item returns the value', async () => {
      const root = new TrieNode();
      const id = Factories.SyncId.build();

      root.insert(id.toString(), id.hashString);
      expect(root.items).toEqual(1);

      const value = root.get(id.toString());
      expect(value).toEqual(id.hashString);
    });

    test('getting an item after deleting it returns undefined', async () => {
      const root = new TrieNode();
      const id = Factories.SyncId.build();

      root.insert(id.toString(), id.hashString);
      expect(root.items).toEqual(1);

      root.delete(id.toString());
      expect(root.get(id.toString())).toBeUndefined();
      expect(root.items).toEqual(0);
    });

    test('getting an non-existent item that share the same prefix with an existing item returns undefined', async () => {
      const id1 = Factories.SyncId.build(undefined, { transient: { date: sharedDate, hash: sharedPrefixHashA } });
      const id2 = Factories.SyncId.build(undefined, { transient: { date: sharedDate, hash: sharedPrefixHashB } });

      const root = new TrieNode();
      root.insert(id1.toString(), id1.hashString);

      // id2 shares the same prefix, but doesn't exist, so it should return undefined
      expect(root.get(id2.toString())).toBeUndefined();
    });
  });
});
