import { Factories } from '~/factories';
import { MerkleTrie, SyncId, TrieNode } from '~/sync/merkletrie';
import { Message } from '~/types';

describe('merkle trie', () => {
  describe('syncid', () => {
    let message: Message;
    let syncId: SyncId;

    beforeEach(async () => {
      message = await Factories.CastShort.create();
      syncId = new SyncId(message);
    });

    test('timestamp is correct', () => {
      expect(syncId.timestampString).toEqual(Math.floor(message.data.signedAt / 1000).toString());
      expect(syncId.timestampString.length).toEqual(10);
    });
    test('hash is correct', () => {
      expect(syncId.hashString.startsWith('0x')).toBeFalsy();
      expect(message.hash.endsWith(syncId.hashString)).toBeTruthy();
      expect(syncId.hashString.length).toEqual(128);
    });
    test('id correct', () => {
      expect(syncId.toString()).toEqual(`${syncId.timestampString}${syncId.hashString}`);
      expect(syncId.toString().length).toEqual(138);
    });
  });

  test('insert single item', async () => {
    const trie = new MerkleTrie();
    const message = await Factories.CastShort.create();
    const syncId = new SyncId(message);

    expect(trie.items).toEqual(0);
    expect(trie.hash).toEqual('');

    trie.insert(syncId);

    expect(trie.items).toEqual(1);
    expect(trie.hash).toBeTruthy();
  });

  test('idempotency', async () => {
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
    expect(firstTrie.hash).toEqual(secondTrie.hash);
    expect(firstTrie.items).toEqual(secondTrie.items);
    expect(firstTrie.hash).toBeTruthy();

    firstTrie.insert(syncId2);
    secondTrie.insert(syncId1);

    // Re-adding same item does not change the hash
    expect(firstTrie.hash).toEqual(secondTrie.hash);
  });

  test('insert multiple items', async () => {
    const messages = await Factories.CastShort.createList(25);
    const syncIds = messages.map((message) => new SyncId(message));

    const firstTrie = new MerkleTrie();
    const secondTrie = new MerkleTrie();

    syncIds.forEach((syncId) => firstTrie.insert(syncId));
    const shuffledIds = syncIds.sort((a, b) => 0.5 - Math.random());
    shuffledIds.forEach((syncId) => secondTrie.insert(syncId));

    expect(firstTrie.hash).toEqual(secondTrie.hash);
    expect(firstTrie.hash).toBeTruthy();
  });
});
