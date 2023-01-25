import * as protobufs from '@farcaster/protobufs';
import { FarcasterNetwork } from '@farcaster/protobufs';
import { Factories, getFarcasterTime } from '@farcaster/protoutils';
import { anything, instance, mock, when } from 'ts-mockito';
import SyncEngine from '~/network/sync/syncEngine';
import { SyncId } from '~/network/sync/syncId';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';

const testDb = jestRocksDB(`engine.syncEngine.test`);
const testDb2 = jestRocksDB(`engine2.syncEngine.test`);

const network = protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET;

const fid = Factories.Fid.build();
const custodySigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();

let custodyEvent: protobufs.IdRegistryEvent;
let signerAdd: protobufs.Message;
let castAdd: protobufs.Message;

beforeAll(async () => {
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySigner.signerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerBody: { signer: signer.signerKey } } },
    { transient: { signer: custodySigner } }
  );

  castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
});

describe('SyncEngine', () => {
  let syncEngine: SyncEngine;
  let engine: Engine;

  beforeEach(async () => {
    await testDb.clear();
    engine = new Engine(testDb, FarcasterNetwork.FARCASTER_NETWORK_TESTNET);
    syncEngine = new SyncEngine(engine);
  });

  const addMessagesWithTimestamps = async (timestamps: number[]) => {
    return await Promise.all(
      timestamps.map(async (t) => {
        const cast = await Factories.CastAddMessage.create(
          { data: { fid, network, timestamp: t } },
          { transient: { signer } }
        );

        const result = await engine.mergeMessage(cast);
        expect(result.isOk()).toBeTruthy();
        return Promise.resolve(cast);
      })
    );
  };

  test('trie is updated on successful merge', async () => {
    const existingItems = syncEngine.trie.items;

    const rcustody = await engine.mergeIdRegistryEvent(custodyEvent);
    expect(rcustody.isOk()).toBeTruthy();

    const rsigneradd = await engine.mergeMessage(signerAdd);
    expect(rsigneradd.isOk()).toBeTruthy();

    const result = await engine.mergeMessage(castAdd);
    expect(result.isOk()).toBeTruthy();

    // Two messages (signerAdd + castAdd) was added to the trie
    expect(syncEngine.trie.items - existingItems).toEqual(2);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine.trie.exists(new SyncId(castAdd))).toBeTruthy();
  });

  test('trie is not updated on merge failure', async () => {
    expect(syncEngine.trie.items).toEqual(0);

    // Merging a message without the custody event should fail
    const result = await engine.mergeMessage(castAdd);

    expect(result.isErr()).toBeTruthy();
    expect(syncEngine.trie.items).toEqual(0);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine.trie.exists(new SyncId(castAdd))).toBeFalsy();
  });

  test(
    'trie is updated when a message is removed',
    async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeMessage(signerAdd);
      let result = await engine.mergeMessage(castAdd);
      expect(result.isOk()).toBeTruthy();

      // Remove this cast.
      const castRemove = await Factories.CastRemoveMessage.create(
        { data: { fid, network, castRemoveBody: { targetHash: castAdd.hash } } },
        { transient: { signer } }
      );

      // Merging the cast remove deletes the cast add in the db, and it should be reflected in the trie
      result = await engine.mergeMessage(castRemove);
      expect(result.isOk()).toBeTruthy();

      const id = new SyncId(castRemove);
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(syncEngine.trie.exists(id)).toBeTruthy();

      // const allMessages = await engine.getAllMessagesBySyncIds([id.idString()]);
      // expect(allMessages.isOk()).toBeTruthy();
      // expect(allMessages._unsafeUnwrap()[0]?.type()).toEqual(MessageType.MESSAGE_TYPE_CAST_REMOVE);

      // The trie should contain the message remove
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(syncEngine.trie.exists(id)).toBeTruthy();

      // The trie should not contain the castAdd anymore
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      expect(syncEngine.trie.exists(new SyncId(castAdd))).toBeFalsy();
    },
    100 * 60 * 1000
  );

  test(
    'trie is updated when message with higher order is merged',
    async () => {
      const rcustody = await engine.mergeIdRegistryEvent(custodyEvent);
      expect(rcustody.isOk()).toBeTruthy();

      const rsigneradd = await engine.mergeMessage(signerAdd);
      expect(rsigneradd.isOk()).toBeTruthy();

      // Reaction
      const reactionBody = { targetCastId: { fid, hash: castAdd.hash } };
      const reaction1 = await Factories.ReactionAddMessage.create(
        { data: { fid, network, timestamp: 30662167, reactionBody } },
        { transient: { signer } }
      );

      // Same reaction, but with different timestamp
      const reaction2 = await Factories.ReactionAddMessage.create(
        { data: { fid, network, timestamp: 30662168, reactionBody } },
        { transient: { signer } }
      );

      // Merging the first reaction should succeed
      let result = await engine.mergeMessage(reaction1);
      expect(result.isOk()).toBeTruthy();
      expect(syncEngine.trie.items).toEqual(2); // signerAdd + reaction1

      // Then merging the second reaction should also succeed and remove reaction1
      result = await engine.mergeMessage(reaction2);
      expect(result.isOk()).toBeTruthy();
      expect(syncEngine.trie.items).toEqual(2); // signerAdd + reaction2 (reaction1 is removed)

      // Create a new engine and sync engine
      testDb2.clear();
      const engine2 = new Engine(testDb2, FarcasterNetwork.FARCASTER_NETWORK_TESTNET);
      const syncEngine2 = new SyncEngine(engine2);
      await engine2.mergeIdRegistryEvent(custodyEvent);
      await engine2.mergeMessage(signerAdd);

      // Only merge reaction2
      result = await engine2.mergeMessage(reaction2);
      expect(result.isOk()).toBeTruthy();
      expect(syncEngine2.trie.items).toEqual(2); // signerAdd + reaction2

      // Roothashes must match
      expect(syncEngine2.trie.rootHash).toEqual(syncEngine.trie.rootHash);
    },
    100 * 60 * 1000
  );

  test('snapshotTimestampPrefix trims the seconds', async () => {
    const nowInSeconds = getFarcasterTime()._unsafeUnwrap();
    const snapshotTimestamp = syncEngine.snapshotTimestamp._unsafeUnwrap();
    expect(snapshotTimestamp).toBeLessThanOrEqual(nowInSeconds);
    expect(snapshotTimestamp).toEqual(Math.floor(nowInSeconds / 10) * 10);
  });

  test('shouldSync returns false when already syncing', async () => {
    const mockRPCClient = mock(protobufs.SyncServiceClient);
    const rpcClient = instance(mockRPCClient);
    let called = false;
    when(mockRPCClient.getSyncMetadataByPrefix(anything(), anything())).thenCall((_a, callback) => {
      expect(syncEngine.shouldSync([])._unsafeUnwrap()).toBeFalsy();
      called = true;

      // Return an empty child map so sync will finish with a noop
      const emptyMetadata = protobufs.TrieNodeMetadataResponse.create({
        prefix: new Uint8Array(),
        numMessages: 1000,
        hash: new Uint8Array(),
        children: [],
      });
      callback(null, emptyMetadata);
    });
    await syncEngine.performSync(['some-divergence'], rpcClient);
    expect(called).toBeTruthy();
  });

  test('shouldSync returns false when excludedHashes match', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);

    await addMessagesWithTimestamps([30662167, 30662169, 30662172]);
    expect(syncEngine.shouldSync(syncEngine.snapshot._unsafeUnwrap().excludedHashes)._unsafeUnwrap()).toBeFalsy();
  });

  test('shouldSync returns true when hashes dont match', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);

    await addMessagesWithTimestamps([30662167, 30662169, 30662172]);
    const oldSnapshot = syncEngine.snapshot._unsafeUnwrap();
    await addMessagesWithTimestamps([30662372]);
    expect(oldSnapshot.excludedHashes).not.toEqual(syncEngine.snapshot._unsafeUnwrap().excludedHashes);
    expect(syncEngine.shouldSync(oldSnapshot.excludedHashes)._unsafeUnwrap()).toBeTruthy();
  });

  test('initialize populates the trie with all existing messages', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);

    const messages = await addMessagesWithTimestamps([30662167, 30662169, 30662172]);

    const syncEngine = new SyncEngine(engine);
    expect(syncEngine.trie.items).toEqual(0);

    await syncEngine.initialize();

    // There might be more messages related to user creation, but it's sufficient to check for casts
    expect(syncEngine.trie.items).toBeGreaterThanOrEqual(3);
    expect(syncEngine.trie.rootHash).toBeTruthy();
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine.trie.exists(new SyncId(messages[0] as protobufs.Message))).toBeTruthy();
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine.trie.exists(new SyncId(messages[1] as protobufs.Message))).toBeTruthy();
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine.trie.exists(new SyncId(messages[2] as protobufs.Message))).toBeTruthy();
  });
});
