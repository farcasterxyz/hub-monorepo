import { Factories } from '~/factories';
import Engine from '~/engine';
import { SyncEngine } from '~/sync/syncEngine';
import { jestRocksDB } from '~/db/jestUtils';
import { mockFid } from '~/engine/mock';
import Faker from 'faker';
import { SyncId } from '~/sync/syncId';

const testDb = jestRocksDB(`engine.follow.test`);
const engine = new Engine(testDb);

describe('SyncEngine', () => {
  let syncEngine: SyncEngine;

  beforeEach(async () => {
    await engine._reset();
    syncEngine = new SyncEngine(engine);
  });

  test('trie is updated on successful merge', async () => {
    const fid = Faker.datatype.number();
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
});
