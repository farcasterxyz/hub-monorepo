import { Factories } from '~/test/factories';
import { MerkleTrie } from '~/network/sync/merkleTrie';
import { SyncId } from '~/network/sync/syncId';

describe('MerkleTrie', () => {
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

  test('insert multiple items out of orders results in the same root hash', async () => {
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

  test('snapshots', async () => {
    const message1 = await Factories.CastShort.create({ data: { signedAt: 1665182332000 } });
    const syncId1 = new SyncId(message1);
    // 11 seconds later
    const message2 = await Factories.CastShort.create({ data: { signedAt: 1665182343000 } });
    const syncId2 = new SyncId(message2);

    const trie = new MerkleTrie();
    trie.insert(syncId1);
    trie.insert(syncId2);

    const snapshot = trie.getSnapshot('1665182343');
    expect(snapshot.prefix).toEqual('1665182343');
    expect(snapshot.numMessages).toEqual(1);
    expect(snapshot.excludedHashes.length).toEqual('1665182343'.length);
  });

  test('trie compare', async () => {
    const minDate = new Date(2022, 0, 1);
    const maxDate = new Date(2022, 0, 1, 0, 10, 0);
    const messages = await Factories.CastShort.createList(25, undefined, {
      transient: { minDate: minDate, maxDate: maxDate },
    });
    const firstTrie = new MerkleTrie();
    const secondTrie = new MerkleTrie();
    messages.forEach((message) => {
      const id = new SyncId(message);
      firstTrie.insert(id);
      secondTrie.insert(id);
    });

    // 150 seconds before max date
    const differingMessage = await Factories.CastShort.create({ data: { signedAt: maxDate.getTime() - 1 * 1000 } });
    firstTrie.insert(new SyncId(differingMessage));
    const prefix = Math.floor(maxDate.getTime() / 10000).toString();
    const firstSnapshot = firstTrie.getSnapshot(prefix);
    const secondSnapshot = secondTrie.getSnapshot(prefix);

    // const divergenceMetadata = firstTrie.getDivergenceMetadata(prefix, secondSnapshot.excludedHashes);
    // console.log(`Differing id: ${differingMessage.hash}`);
    // console.log(`divergenceMetadata: ${divergenceMetadata.prefix}`);
    // console.log(`First trie: ${[...(firstTrie.root.getNode(divergenceMetadata.prefix)?.childHashes || [])]}`);
    // console.log(`Second trie: ${[...(secondTrie.root.getNode(divergenceMetadata.prefix)?.childHashes || [])]}`);

    // const secondNode = secondTrie.root.getNode(divergenceMetadata.prefix);
    // const secondHashes = secondNode?.childHashes || new Map();
    // divergenceMetadata.childHashes.forEach((hash, char) => {
    //   if (secondHashes.get(char) !== hash) {
    //     console.log(`Mismatch at ${char}`);
    //     console.log(`First Node ${firstTrie.root.getNode(divergenceMetadata.prefix + char)?.getAllValues()}`);
    //     console.log(`Second Node ${secondTrie.root.getNode(divergenceMetadata.prefix + char)?.getAllValues()}`);
    //   }
    // });
    expect(firstSnapshot.prefix).toEqual(secondSnapshot.prefix);
    expect(firstSnapshot.numMessages).toEqual(secondSnapshot.numMessages + 1);
    expect(firstSnapshot.excludedHashes).not.toEqual(secondSnapshot.excludedHashes);
  });
});
