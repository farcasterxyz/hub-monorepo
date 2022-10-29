import { Factories } from '~/test/factories';
import { MerkleTrie } from '~/network/sync/merkleTrie';
import { SyncId } from '~/network/sync/syncId';
import { createHash } from 'crypto';

describe('MerkleTrie', () => {
  const trieWithMessages = async (timestamps: number[]) => {
    const messages = await Promise.all(
      timestamps.map(async (t) => {
        return await Factories.CastShort.create({ data: { signedAt: t * 1000 } });
      })
    );
    const syncIds = messages.map((m) => new SyncId(m));

    const trie = new MerkleTrie();
    syncIds.forEach((id) => trie.insert(id));
    return trie;
  };

  describe('insert', () => {
    test('succeeds inserting a single item', async () => {
      const trie = new MerkleTrie();
      const message = await Factories.CastShort.create();
      const syncId = new SyncId(message);

      expect(trie.items).toEqual(0);
      expect(trie.rootHash).toEqual('');

      trie.insert(syncId);

      expect(trie.items).toEqual(1);
      expect(trie.rootHash).toBeTruthy();
    });

    test('inserts are idempotent', async () => {
      const message1 = await Factories.CastShort.create();
      const syncId1 = new SyncId(message1);
      const message2 = await Factories.CastShort.create();
      const syncId2 = new SyncId(message2);

      const firstTrie = new MerkleTrie();
      firstTrie.insert(syncId1);
      firstTrie.insert(syncId2);

      const secondTrie = new MerkleTrie();
      secondTrie.insert(syncId2);
      secondTrie.insert(syncId1);

      // Order does not matter
      expect(firstTrie.rootHash).toEqual(secondTrie.rootHash);
      expect(firstTrie.items).toEqual(secondTrie.items);
      expect(firstTrie.rootHash).toBeTruthy();

      firstTrie.insert(syncId2);
      secondTrie.insert(syncId1);

      // Re-adding same item does not change the hash
      expect(firstTrie.rootHash).toEqual(secondTrie.rootHash);
      expect(firstTrie.items).toEqual(secondTrie.items);
      expect(firstTrie.items).toEqual(2);
    });

    test('insert multiple items out of order results in the same root hash', async () => {
      const messages = await Factories.CastShort.createList(25);
      const syncIds = messages.map((message) => new SyncId(message));

      const firstTrie = new MerkleTrie();
      const secondTrie = new MerkleTrie();

      syncIds.forEach((syncId) => firstTrie.insert(syncId));
      const shuffledIds = syncIds.sort(() => 0.5 - Math.random());
      shuffledIds.forEach((syncId) => secondTrie.insert(syncId));

      expect(firstTrie.rootHash).toEqual(secondTrie.rootHash);
      expect(firstTrie.rootHash).toBeTruthy();
      expect(firstTrie.items).toEqual(secondTrie.items);
      expect(firstTrie.items).toEqual(25);
    });
  });

  test('succeeds getting single item', async () => {
    const trie = new MerkleTrie();
    const message = await Factories.CastShort.create();
    const syncId = new SyncId(message);

    expect(trie.get(syncId)).toBeFalsy();

    trie.insert(syncId);

    expect(trie.get(syncId)).toEqual(syncId.hashString);

    // Message signed 1 second after
    message.data.signedAt = message.data.signedAt + 1000;
    const nonExistingSyncId = new SyncId(message);
    expect(trie.get(nonExistingSyncId)).toBeFalsy();
  });

  test('value is always undefined for non-leaf nodes', async () => {
    const trie = new MerkleTrie();
    const message = await Factories.CastShort.create();
    const syncId = new SyncId(message);

    trie.insert(syncId);

    expect(trie.root.value).toBeFalsy();
  });

  describe('getNodeMetadata', () => {
    test('returns undefined if prefix is not present', async () => {
      const syncId = new SyncId(await Factories.CastShort.create({ data: { signedAt: 1665182332000 } }));
      const trie = new MerkleTrie();
      trie.insert(syncId);

      expect(trie.getNodeMetadata('166518234')).toBeUndefined();
    });

    test('returns the root metadata if the prefix is empty', async () => {
      const syncId = new SyncId(await Factories.CastShort.create({ data: { signedAt: 1665182332000 } }));
      const trie = new MerkleTrie();
      trie.insert(syncId);

      const nodeMetadata = trie.getNodeMetadata('');
      expect(nodeMetadata).toBeDefined();
      expect(nodeMetadata?.numMessages).toEqual(1);
      expect(nodeMetadata?.prefix).toEqual('');
      expect(nodeMetadata?.children?.size).toEqual(1);
      expect(nodeMetadata?.children?.get('1')).toBeDefined();
    });

    test('returns the correct metadata if prefix is present', async () => {
      const trie = await trieWithMessages([1665182332, 1665182343]);
      const nodeMetadata = trie.getNodeMetadata('16651823');

      expect(nodeMetadata).toBeDefined();
      expect(nodeMetadata?.numMessages).toEqual(2);
      expect(nodeMetadata?.prefix).toEqual('16651823');
      expect(nodeMetadata?.children?.size).toEqual(2);
      expect(nodeMetadata?.children?.get('3')).toBeDefined();
      expect(nodeMetadata?.children?.get('4')).toBeDefined();
    });
  });

  describe('getSnapshot', () => {
    test('returns basic information', async () => {
      const trie = await trieWithMessages([1665182332, 1665182343]);

      const snapshot = trie.getSnapshot('1665182343');
      expect(snapshot.prefix).toEqual('1665182343');
      expect(snapshot.numMessages).toEqual(1);
      expect(snapshot.excludedHashes.length).toEqual('1665182343'.length);
    });

    test('returns early when prefix is only partially present', async () => {
      const trie = await trieWithMessages([1665182332, 1665182343]);

      const snapshot = trie.getSnapshot('1677123');
      expect(snapshot.prefix).toEqual('167');
      expect(snapshot.numMessages).toEqual(2);
      expect(snapshot.excludedHashes.length).toEqual('167'.length);
    });

    test('excluded hashes excludes the prefix char at every level', async () => {
      const trie = await trieWithMessages([1665182332, 1665182343, 1665182345, 1665182351]);
      const emptyHash = createHash('sha256').digest('hex');
      let snapshot = trie.getSnapshot('1665182351');
      let node = trie.getNodeMetadata('16651823');
      // We expect the excluded hash to be the hash of the 3 and 4 child nodes, and excludes the 5 child node
      const expectedHash = createHash('sha256')
        .update(node?.children?.get('3')?.hash || '')
        .update(node?.children?.get('4')?.hash || '')
        .digest('hex');
      expect(snapshot.excludedHashes).toEqual([
        emptyHash, // 1, these are empty because there are no other children at this level
        emptyHash, // 6
        emptyHash, // 6
        emptyHash, // 5
        emptyHash, // 1
        emptyHash, // 8
        emptyHash, // 2
        emptyHash, // 3
        expectedHash, // 5 (hash of the 3 and 4 child node hashes)
        emptyHash, // 1
      ]);

      snapshot = trie.getSnapshot('1665182343');
      node = trie.getNodeMetadata('166518234');
      const expectedLastHash = createHash('sha256')
        .update(node?.children?.get('5')?.hash || '')
        .digest('hex');
      node = trie.getNodeMetadata('16651823');
      const expectedPenultimateHash = createHash('sha256')
        .update(node?.children?.get('3')?.hash || '')
        .update(node?.children?.get('5')?.hash || '')
        .digest('hex');
      expect(snapshot.excludedHashes).toEqual([
        emptyHash, // 1
        emptyHash, // 6
        emptyHash, // 6
        emptyHash, // 5
        emptyHash, // 1
        emptyHash, // 8
        emptyHash, // 2
        emptyHash, // 3
        expectedPenultimateHash, // 4 (hash of the 3 and 5 child node hashes)
        expectedLastHash, // 3 (hash of the 5 child node hash)
      ]);
    });
  });

  test('getAllValues returns all values for child nodes', async () => {
    const trie = await trieWithMessages([1665182332, 1665182343, 1665182345]);

    let values = trie.root.getNode('16651823')?.getAllValues();
    expect(values?.length).toEqual(3);
    values = trie.root.getNode('166518233')?.getAllValues();
    expect(values?.length).toEqual(1);
  });

  describe('getDivergencePrefix', () => {
    test('returns the prefix with the most common excluded hashes', async () => {
      const trie = await trieWithMessages([1665182332, 1665182343, 1665182345]);
      const prefixToTest = '1665182343';
      const oldSnapshot = trie.getSnapshot(prefixToTest);
      trie.insert(new SyncId(await Factories.CastShort.create({ data: { signedAt: 1665182353000 } })));

      // Since message above was added at 1665182353, the two tries diverged at 16651823 for our prefix
      let divergencePrefix = trie.getDivergencePrefix(prefixToTest, oldSnapshot.excludedHashes);
      expect(divergencePrefix).toEqual('16651823');

      // divergence prefix should be the full prefix, if snapshots are the same
      const currentSnapshot = trie.getSnapshot(prefixToTest);
      divergencePrefix = trie.getDivergencePrefix(prefixToTest, currentSnapshot.excludedHashes);
      expect(divergencePrefix).toEqual(prefixToTest);

      // divergence prefix should empty if excluded hashes are empty
      divergencePrefix = trie.getDivergencePrefix(prefixToTest, []);
      expect(divergencePrefix).toEqual('');

      // divergence prefix should be our prefix if provided hashes are longer
      divergencePrefix = trie.getDivergencePrefix(prefixToTest + '5', [...currentSnapshot.excludedHashes, 'different']);
      expect(divergencePrefix).toEqual(prefixToTest);
    });
  });
});
