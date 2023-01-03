import { blake3 } from '@noble/hashes/blake3';
import Factories from '~/flatbuffers/factories';
import { TIMESTAMP_LENGTH } from '~/network/sync/syncId';
import { TrieNode } from '~/network/sync/trieNode';

const fid = Factories.FID.build();
const emptyHash = Buffer.from(blake3('', { dkLen: 16 })).toString('hex');
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
      const id = await Factories.SyncId.create();

      expect(root.items).toEqual(0);
      expect(root.hash).toEqual('');

      root.insert(id.toString());

      expect(root.items).toEqual(1);
      expect(root.hash).toBeTruthy();
    });

    test('inserting the same item twice is idempotent', async () => {
      const root = new TrieNode();
      const id = await Factories.SyncId.create();

      root.insert(id.toString());
      expect(root.items).toEqual(1);
      const previousHash = root.hash;
      root.insert(id.toString());

      expect(root.hash).toEqual(previousHash);
      expect(root.items).toEqual(1);
    });

    test('insert compacts hashstring component of syncid to single node for efficiency', async () => {
      const root = new TrieNode();
      const id = await Factories.SyncId.create();

      root.insert(id.toString());
      let node = root;
      // Timestamp portion of the key is not collapsed, but the hash portion is
      for (let i = 0; i < TIMESTAMP_LENGTH; i++) {
        const children = Array.from(node.children);
        const firstChild = children[0] as [string, TrieNode];
        expect(children.length).toEqual(1);
        node = firstChild[1];
      }

      expect(node.isLeaf).toEqual(true);
      expect(node.value).toEqual(id.idString());
    });

    test('inserting another key with a common prefix splits the node', async () => {
      // Generate two ids with the same timestamp and the same hash prefix. The trie should split the node
      // where they diverge
      const id1 = await Factories.SyncId.create(undefined, {
        transient: { date: sharedDate, hash: sharedPrefixHashA, fid },
      });
      const hash1 = id1.toString();

      const id2 = await Factories.SyncId.create(undefined, {
        transient: { date: sharedDate, hash: sharedPrefixHashB, fid },
      });
      const hash2 = id2.toString();

      // The node at which the trie splits should be the first character that differs between the two hashes
      const firstDiffPos = hash1.split('').findIndex((c, i) => c !== hash2[i]);

      const root = new TrieNode();
      root.insert(id1.toString());
      root.insert(id2.toString());

      const splitNode = traverse(root);
      expect(splitNode.items).toEqual(2);
      const children = Array.from(splitNode.children);
      const firstChild = children[0] as [string, TrieNode];
      const secondChild = children[1] as [string, TrieNode];
      expect(children.length).toEqual(2);
      // hash1 node
      expect(firstChild[0]).toEqual(hash1[firstDiffPos]);
      expect(firstChild[1].isLeaf).toBeTruthy();
      expect(firstChild[1].value).toEqual(id1.idString());
      // hash2 node
      expect(secondChild[0]).toEqual(hash2[firstDiffPos]);
      expect(secondChild[1].isLeaf).toBeTruthy();
      expect(secondChild[1].value).toEqual(id2.idString());
    });
  });

  describe('delete', () => {
    test('deleting a single item removes the node', async () => {
      const root = new TrieNode();
      const id = await Factories.SyncId.create();

      root.insert(id.toString());
      expect(root.items).toEqual(1);

      root.delete(id.toString());
      expect(root.items).toEqual(0);
      expect(root.hash).toEqual(emptyHash);
    });

    test('deleting a single item from a node with multiple items removes the item', async () => {
      const root = new TrieNode();
      const id1 = await Factories.SyncId.create(undefined, { transient: { date: sharedDate } });
      const id2 = await Factories.SyncId.create(undefined, { transient: { date: sharedDate } });

      root.insert(id1.toString());
      const previousHash = root.hash;
      root.insert(id2.toString());
      expect(root.items).toEqual(2);

      root.delete(id2.toString());
      expect(root.items).toEqual(1);
      expect(root.exists(id2.toString())).toBeFalsy();
      expect(root.hash).toEqual(previousHash);
    });

    test('deleting a single item from a split node should preserve previous hash', async () => {
      const id1 = await Factories.SyncId.create(undefined, {
        transient: { date: sharedDate, hash: sharedPrefixHashA },
      });
      const id2 = await Factories.SyncId.create(undefined, {
        transient: { date: sharedDate, hash: sharedPrefixHashB },
      });

      const root = new TrieNode();
      root.insert(id1.toString());
      const previousRootHash = root.hash;
      const leafNode = traverse(root);
      root.insert(id2.toString());

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
      const id = await Factories.SyncId.create();

      root.insert(id.toString());
      expect(root.items).toEqual(1);

      expect(root.exists(id.toString())).toBeTruthy();
    });

    test('getting an item after deleting it returns undefined', async () => {
      const root = new TrieNode();
      const id = await Factories.SyncId.create();

      root.insert(id.toString());
      expect(root.items).toEqual(1);

      root.delete(id.toString());
      expect(root.exists(id.toString())).toBeFalsy();
      expect(root.items).toEqual(0);
    });

    test('getting an non-existent item that share the same prefix with an existing item returns undefined', async () => {
      const id1 = await Factories.SyncId.create(undefined, {
        transient: { date: sharedDate, hash: sharedPrefixHashA },
      });
      const id2 = await Factories.SyncId.create(undefined, {
        transient: { date: sharedDate, hash: sharedPrefixHashB },
      });

      const root = new TrieNode();
      root.insert(id1.toString());

      // id2 shares the same prefix, but doesn't exist, so it should return undefined
      expect(root.exists(id2.toString())).toBeFalsy();
    });
  });
});
