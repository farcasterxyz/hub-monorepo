import { Factories } from '~/test/factories';
import { MerkleTrie } from '~/sync/merkleTrie';
import { SyncId } from '~/sync/syncId';

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
});
