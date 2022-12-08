import { Factories } from '~/test/factories';
import Engine from '~/storage/engine';
import { SyncEngine } from '~/network/sync/syncEngine';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { mockFid, UserInfo } from '~/storage/engine/mock';
import { faker } from '@faker-js/faker';
import { SyncId } from '~/network/sync/syncId';
import { anyString, instance, mock, when } from 'ts-mockito';
import { RPCClient } from '~/network/rpc';
import { ok } from 'neverthrow';

const testDb = jestRocksDB(`engine.syncEngine.test`);

describe('SyncEngine', () => {
  let syncEngine: SyncEngine;
  let engine: Engine;

  beforeEach(async () => {
    await testDb.clear();
    engine = new Engine(testDb);
    syncEngine = new SyncEngine(engine);
  });

  const addMessagesWithTimestamps = async (user: UserInfo, timestamps: number[]) => {
    return await Promise.all(
      timestamps.map(async (t) => {
        const message = await Factories.CastShort.create(
          { data: { fid: user.fid, signedAt: t * 1000 } },
          { transient: { signer: user.delegateSigner } }
        );
        const result = await engine.mergeMessage(message);
        expect(result.isOk()).toBeTruthy();
        return Promise.resolve(message);
      })
    );
  };

  test('trie is updated on successful merge', async () => {
    const fid = faker.datatype.number();
    const userInfo = await mockFid(engine, fid);
    const cast = await Factories.CastShort.create(
      { data: { fid: fid } },
      { transient: { signer: userInfo.delegateSigner } }
    );

    const existingItems = syncEngine.trie.items;
    const result = await engine.mergeMessage(cast);

    expect(result.isOk()).toBeTruthy();
    // One message was added to the trie
    expect(syncEngine.trie.items - existingItems).toEqual(1);
    expect(syncEngine.trie.get(new SyncId(cast))).toEqual(new SyncId(cast).hashString);
  });

  test('trie is not updated on merge failure', async () => {
    expect(syncEngine.trie.items).toEqual(0);

    const message = await Factories.CastShort.create();
    // Merging a message without the custody event should fail
    const result = await engine.mergeMessage(message);

    expect(result.isErr()).toBeTruthy();
    expect(syncEngine.trie.items).toEqual(0);
    expect(syncEngine.trie.get(new SyncId(message))).toBeFalsy();
  });

  test('trie is updated when a message is removed', async () => {
    const user = await mockFid(engine, faker.datatype.number());
    const targetUri = faker.internet.url();
    const reactionRemove = await Factories.ReactionRemove.create(
      { data: { fid: user.fid, body: { targetUri: targetUri } } },
      { transient: { signer: user.delegateSigner } }
    );
    const reactionAdd = await Factories.ReactionAdd.create(
      { data: { fid: user.fid, body: { targetUri: targetUri }, signedAt: reactionRemove.data.signedAt + 1 } },
      { transient: { signer: user.delegateSigner } }
    );
    await engine.mergeMessage(reactionRemove);
    const id = new SyncId(reactionRemove);
    expect(syncEngine.trie.get(id)).toEqual(id.hashString);

    // Merging the reaction add deletes the reaction remove in the db, and it should be reflected in the trie
    await engine.mergeMessage(reactionAdd);
    expect(await engine.getMessagesByHashes([reactionRemove.hash])).toEqual([]);
    expect(syncEngine.trie.get(id)).toBeFalsy();
  });

  test('snapshotTimestampPrefix trims the seconds', async () => {
    const nowInSeconds = Date.now() / 1000;
    const snapshotTimestamp = syncEngine.snapshotTimestamp;
    expect(snapshotTimestamp).toBeLessThanOrEqual(nowInSeconds);
    expect(snapshotTimestamp).toEqual(Math.floor(nowInSeconds / 10) * 10);
  });

  test('shouldSync returns false when already syncing', async () => {
    const mockRPCClient = mock(RPCClient);
    const rpcClient = instance(mockRPCClient);
    let called = false;
    when(mockRPCClient.getSyncMetadataByPrefix(anyString())).thenCall(() => {
      expect(syncEngine.shouldSync([])).toBeFalsy();
      called = true;
      // Return an empty child map so sync will finish with a noop
      return Promise.resolve(ok({ prefix: '', numMessages: 1000, hash: '', children: new Map() }));
    });
    await syncEngine.performSync(['some-divergence'], rpcClient);
    expect(called).toBeTruthy();
  });

  test('shouldSync returns false when excludedHashes match', async () => {
    const user = await mockFid(engine, faker.datatype.number());
    await addMessagesWithTimestamps(user, [1665182332, 1665182333, 1665182334]);
    expect(syncEngine.shouldSync(syncEngine.snapshot.excludedHashes)).toBeFalsy();
  });

  test('shouldSync returns true when hashes dont match', async () => {
    const user = await mockFid(engine, faker.datatype.number());
    await addMessagesWithTimestamps(user, [1665182332, 1665182333, 1665182334]);
    const oldSnapshot = syncEngine.snapshot;
    await addMessagesWithTimestamps(user, [1665182534]);
    expect(oldSnapshot.excludedHashes).not.toEqual(syncEngine.snapshot.excludedHashes);
    expect(syncEngine.shouldSync(oldSnapshot.excludedHashes)).toBeTruthy();
  });

  xtest('should not sync if messages were added within the sync threshold', async () => {
    const user = await mockFid(engine, faker.datatype.number());
    const snapshotTimestamp = syncEngine.snapshotTimestamp;
    await addMessagesWithTimestamps(user, [snapshotTimestamp - 3, snapshotTimestamp - 2, snapshotTimestamp - 1]);

    const snapshot = syncEngine.snapshot;
    // Add a message after the snapshot, within the sync threshold
    await addMessagesWithTimestamps(user, [snapshotTimestamp + 1]);
    expect(syncEngine.shouldSync(snapshot.excludedHashes)).toBeFalsy();
  });

  test('initialize populates the trie with all existing messages', async () => {
    const user = await mockFid(engine, faker.datatype.number());
    const messages = await addMessagesWithTimestamps(user, [1665182332, 1665182333, 1665182334]);

    const syncEngine = new SyncEngine(engine);
    expect(syncEngine.trie.items).toEqual(0);

    await syncEngine.initialize();

    // There might be more messages related to user creation, but it's sufficient to check for casts
    expect(syncEngine.trie.items).toBeGreaterThanOrEqual(3);
    expect(syncEngine.trie.rootHash).toBeTruthy();
    expect(syncEngine.trie.get(new SyncId(messages[0]))).toBeTruthy();
    expect(syncEngine.trie.get(new SyncId(messages[1]))).toBeTruthy();
    expect(syncEngine.trie.get(new SyncId(messages[2]))).toBeTruthy();
  });
});
