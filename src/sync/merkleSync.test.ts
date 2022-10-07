import { Factories } from '~/factories';
import Engine from '~/engine';
import { MerkleSync } from '~/sync/merkleSync';
import { jestRocksDB } from '~/db/jestUtils';
import { mockFid } from '~/engine/mock';
import Faker from 'faker';
import { SyncId } from '~/sync/syncId';

const testDb = jestRocksDB(`engine.follow.test`);
const engine = new Engine(testDb);

describe('MerkleSync', () => {
  let merkleSync: MerkleSync;

  beforeEach(async () => {
    await engine._reset();
    merkleSync = new MerkleSync(engine);
  });

  test('trie is updated on successful merge', async () => {
    const fid = Faker.datatype.number();
    const userInfo = await mockFid(engine, fid);
    const cast = await Factories.CastShort.create(
      { data: { fid: fid } },
      { transient: { signer: userInfo.delegateSigner } }
    );

    const existingItems = merkleSync.trie.items;
    const result = await engine.mergeMessage(cast);

    expect(result.isOk()).toBeTruthy();
    // One message was added to the trie
    expect(merkleSync.trie.items - existingItems).toEqual(1);
    expect(merkleSync.trie.get(new SyncId(cast))).toEqual(new SyncId(cast).hashString);
  });

  test('trie is not updated on merge failure', async () => {
    expect(merkleSync.trie.items).toEqual(0);

    const message = await Factories.CastShort.create();
    // Merging a message without the custody event should fail
    const result = await engine.mergeMessage(message);

    expect(result.isErr()).toBeTruthy();
    expect(merkleSync.trie.items).toEqual(0);
    expect(merkleSync.trie.get(new SyncId(message))).toBeFalsy();
  });
});
