import { Factories } from '~/test/factories';
import { TrieNode } from '~/network/sync/trieNode';
import { TIMESTAMP_LENGTH } from '~/network/sync/syncId';
import { createHash } from 'crypto';

const emptyHash = createHash('sha256').digest('hex');

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
    return traverse(children[0][1]);
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

    test('insert compacts hashstring component of syncid to single node for efficiency', async () => {
      const root = new TrieNode();
      const id = Factories.SyncId.build();

      root.insert(id.toString(), id.hashString);
      let node = root;
      // Timestamp portion of the key is not collapsed, but the hash portion is
      for (let i = 0; i < TIMESTAMP_LENGTH; i++) {
        const children = Array.from(node.children);
        expect(children.length).toEqual(1);
        node = children[0][1];
      }

      expect(node.isLeaf).toEqual(true);
      expect(node.value).toEqual(id.hashString);
    });

    test('inserting another key with a common prefix splits the node', async () => {
      // Generate two ids with the same timestamp and the same hash prefix. The trie should split the node
      // where they diverge
      const date = new Date(1665182332000);
      const hash1 =
        '0x09bc3dad4e7f2a77bbb2cccbecb06febfc3f0cbe7ea6a774d2dc043fd45c2c9912f130bf502c88fdedf7bbc4cd20b47aab2079e2d5cbd0a35afd2deec86a4321';
      const hash2 =
        '0x09bc3dad4e7f2a77bbb2cccbecb06febfc3f0cbe7ea6a774d2dc043fd45c2c9912f130bf502c88fdedf7bbc4cd20b47aab2079e2d5cbd0a35afd2deec86b1234';
      const id1 = Factories.SyncId.build(undefined, { transient: { date, hash: hash1 } });
      const id2 = Factories.SyncId.build(undefined, { transient: { date, hash: hash2 } });

      const root = new TrieNode();
      root.insert(id1.toString(), id1.hashString);
      root.insert(id2.toString(), id2.hashString);

      const splitNode = traverse(root);
      expect(splitNode.items).toEqual(2);
      const children = Array.from(splitNode.children);
      expect(children.length).toEqual(2);
      // hash1 node
      expect(children[0][0]).toEqual('a');
      expect(children[0][1].isLeaf).toBeTruthy();
      expect(children[0][1].value).toEqual(id1.hashString);
      // hash2 node
      expect(children[1][0]).toEqual('b');
      expect(children[1][1].isLeaf).toBeTruthy();
      expect(children[1][1].value).toEqual(id2.hashString);
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

    test('deleting a single item from a split node should preserve previous hash', async () => {
      const date = new Date(1665182332000);
      const hash1 =
        '0x09bc3dad4e7f2a77bbb2cccbecb06febfc3f0cbe7ea6a774d2dc043fd45c2c9912f130bf502c88fdedf7bbc4cd20b47aab2079e2d5cbd0a35afd2deec86a4321';
      const hash2 =
        '0x09bc3dad4e7f2a77bbb2cccbecb06febfc3f0cbe7ea6a774d2dc043fd45c2c9912f130bf502c88fdedf7bbc4cd20b47aab2079e2d5cbd0a35afd2deec86b1234';
      const id1 = Factories.SyncId.build(undefined, { transient: { date, hash: hash1 } });
      const id2 = Factories.SyncId.build(undefined, { transient: { date, hash: hash2 } });

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

  // describe('get', () => {});
});
