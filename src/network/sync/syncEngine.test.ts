import { Factories } from '~/test/factories';
import Engine from '~/storage/engine';
import { SyncEngine } from '~/network/sync/syncEngine';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { mockFid, UserInfo } from '~/storage/engine/mock';
import { faker } from '@faker-js/faker';
import { SyncId } from '~/network/sync/syncId';
import { mock, instance, when, anyString } from 'ts-mockito';
import { RPCClient } from '~/network/rpc';
import { ok } from 'neverthrow';

const testDb = jestRocksDB(`engine.syncEngine.test`);
const engine = new Engine(testDb);

describe('SyncEngine', () => {
  let syncEngine: SyncEngine;

  beforeEach(async () => {
    await engine._reset();
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
      expect(syncEngine.shouldSync([], 0)).toBeFalsy();
      // Return a high message count, so we don't try to fetch sync ids, and return an empty child map so sync
      // will finish with a noop
      called = true;
      return Promise.resolve(ok({ prefix: '', numMessages: 1000, hash: '', children: new Map() }));
    });
    await syncEngine.performSync(['some-divergence'], rpcClient);
    expect(called).toBeTruthy();
  });

  test('shouldSync returns false when excludedHashes match', async () => {
    const user = await mockFid(engine, faker.datatype.number());
    await addMessagesWithTimestamps(user, [1665182332, 1665182333, 1665182334]);
    expect(syncEngine.shouldSync(syncEngine.snapshot.excludedHashes, 0)).toBeFalsy();
  });

  test('shouldSync return true or false based on number of messages when hashes dont match', async () => {
    const user = await mockFid(engine, faker.datatype.number());
    await addMessagesWithTimestamps(user, [1665182332, 1665182333, 1665182334]);
    const oldSnapshot = syncEngine.snapshot;
    await addMessagesWithTimestamps(user, [1665182534]);
    expect(oldSnapshot.excludedHashes).not.toEqual(syncEngine.snapshot.excludedHashes);
    // don't sync we have more messages
    expect(syncEngine.shouldSync(oldSnapshot.excludedHashes, 1)).toBeFalsy();
    // must sync if we have fewer messages
    expect(syncEngine.shouldSync(oldSnapshot.excludedHashes, 1000)).toBeTruthy();

    // randomly returns true or false if messages are equal
    const ourMessages = syncEngine.snapshot.numMessages;
    const results = Array.from(Array(10)).map(() => syncEngine.shouldSync(oldSnapshot.excludedHashes, ourMessages));
    expect(results).toContain(true);
    expect(results).toContain(false);
  });

  test('should not sync if messages were added within the sync threshold', async () => {
    const user = await mockFid(engine, faker.datatype.number());
    const snapshotTimestamp = syncEngine.snapshotTimestamp;
    await addMessagesWithTimestamps(user, [snapshotTimestamp - 3, snapshotTimestamp - 2, snapshotTimestamp - 1]);

    const snapshot = syncEngine.snapshot;
    // Add a message after the snapshot, within the sync threshold
    await addMessagesWithTimestamps(user, [snapshotTimestamp + 3]);
    // Ensure messages counts match, run a few times to make sure we didn't accidentally the wrong answer
    // due to randomness
    const results = Array.from(Array(10)).map(() =>
      syncEngine.shouldSync(snapshot.excludedHashes, snapshot.numMessages + 1)
    );
    expect(results).not.toContain(true);
    expect(results).toContain(false);
  });
});
