/* eslint-disable security/detect-non-literal-fs-filename */

import {
  FarcasterNetwork,
  Factories,
  getFarcasterTime,
  HubRpcClient,
  IdRegistryEvent,
  MessageType,
  SignerAddMessage,
  Message,
  ReactionType,
  TrieNodeMetadataResponse,
} from '@farcaster/hub-nodejs';
import { ok } from 'neverthrow';
import { anything, instance, mock, when } from 'ts-mockito';
import SyncEngine from '~/network/sync/syncEngine';
import { SyncId } from '~/network/sync/syncId';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { sleepWhile } from '~/utils/crypto';
import { NetworkFactories } from '../utils/factories';

const testDb = jestRocksDB(`engine.syncEngine.test`);
const testDb2 = jestRocksDB(`engine2.syncEngine.test`);

const network = FarcasterNetwork.TESTNET;
const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: IdRegistryEvent;
let signerAdd: SignerAddMessage;
let castAdd: Message;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } }
  );

  castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
});

describe('SyncEngine', () => {
  let syncEngine: SyncEngine;
  let engine: Engine;

  beforeEach(async () => {
    await testDb.clear();
    engine = new Engine(testDb, FarcasterNetwork.TESTNET);
    syncEngine = new SyncEngine(engine, testDb);
  });

  afterEach(async () => {
    await syncEngine.stop();
    await engine.stop();
  });

  const addMessagesWithTimestamps = async (timestamps: number[]) => {
    const results = await Promise.all(
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

    await sleepWhile(() => syncEngine.syncTrieQSize > 0, 1000);
    await syncEngine.trie.commitToDb();
    return results;
  };

  test('trie is updated on successful merge', async () => {
    const existingItems = await syncEngine.trie.items();

    const rcustody = await engine.mergeIdRegistryEvent(custodyEvent);
    expect(rcustody.isOk()).toBeTruthy();

    const rsigneradd = await engine.mergeMessage(signerAdd);
    expect(rsigneradd.isOk()).toBeTruthy();

    const result = await engine.mergeMessage(castAdd);
    expect(result.isOk()).toBeTruthy();

    // Wait for the trie to be updated
    await sleepWhile(() => syncEngine.syncTrieQSize > 0, 1000);

    // Two messages (signerAdd + castAdd) was added to the trie
    expect((await syncEngine.trie.items()) - existingItems).toEqual(2);
    expect(await syncEngine.trie.exists(new SyncId(castAdd))).toBeTruthy();
  });

  test('trie is not updated on merge failure', async () => {
    expect(await syncEngine.trie.items()).toEqual(0);

    // Merging a message without the custody event should fail
    const result = await engine.mergeMessage(castAdd);

    expect(result.isErr()).toBeTruthy();

    // Wait for the trie to be updated
    await sleepWhile(() => syncEngine.syncTrieQSize > 0, 1000);

    expect(await syncEngine.trie.items()).toEqual(0);
    expect(await syncEngine.trie.exists(new SyncId(castAdd))).toBeFalsy();
  });

  test('trie is updated when a message is removed', async () => {
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

    // Wait for the trie to be updated
    await sleepWhile(() => syncEngine.syncTrieQSize > 0, 1000);

    const id = new SyncId(castRemove);
    expect(await syncEngine.trie.exists(id)).toBeTruthy();

    const allMessages = await engine.getAllMessagesBySyncIds([id.syncId()]);
    expect(allMessages.isOk()).toBeTruthy();
    expect(allMessages._unsafeUnwrap()[0]?.data?.type).toEqual(MessageType.CAST_REMOVE);

    // The trie should contain the message remove
    expect(await syncEngine.trie.exists(id)).toBeTruthy();

    // The trie should not contain the castAdd anymore
    expect(await syncEngine.trie.exists(new SyncId(castAdd))).toBeFalsy();
  });

  test('getAllMessages returns empty with invalid syncId', async () => {
    expect(await syncEngine.trie.items()).toEqual(0);
    const result = await engine.getAllMessagesBySyncIds([new SyncId(castAdd).syncId()]);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()[0]?.data).toBeUndefined();
    expect(result._unsafeUnwrap()[0]?.hash.length).toEqual(0);
  });

  test('trie is updated when message with higher order is merged', async () => {
    const rcustody = await engine.mergeIdRegistryEvent(custodyEvent);
    expect(rcustody.isOk()).toBeTruthy();

    const rsigneradd = await engine.mergeMessage(signerAdd);
    expect(rsigneradd.isOk()).toBeTruthy();

    // Reaction
    const reactionBody = {
      targetCastId: { fid, hash: castAdd.hash },
      type: ReactionType.LIKE,
    };
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

    // Wait for the trie to be updated
    await sleepWhile(() => syncEngine.syncTrieQSize > 0, 1000);
    expect(await syncEngine.trie.items()).toEqual(2); // signerAdd + reaction1

    // Then merging the second reaction should also succeed and remove reaction1
    result = await engine.mergeMessage(reaction2);
    expect(result.isOk()).toBeTruthy();

    // Wait for the trie to be updated
    await sleepWhile(() => syncEngine.syncTrieQSize > 0, 1000);
    expect(await syncEngine.trie.items()).toEqual(2); // signerAdd + reaction2 (reaction1 is removed)

    // Create a new engine and sync engine
    testDb2.clear();
    const engine2 = new Engine(testDb2, FarcasterNetwork.TESTNET);
    const syncEngine2 = new SyncEngine(engine2, testDb2);
    await engine2.mergeIdRegistryEvent(custodyEvent);
    await engine2.mergeMessage(signerAdd);

    // Only merge reaction2
    result = await engine2.mergeMessage(reaction2);
    expect(result.isOk()).toBeTruthy();

    // Wait for the trie to be updated
    await sleepWhile(() => syncEngine.syncTrieQSize > 0, 1000);
    expect(await syncEngine2.trie.items()).toEqual(2); // signerAdd + reaction2

    // Roothashes must match
    expect(await syncEngine2.trie.rootHash()).toEqual(await syncEngine.trie.rootHash());

    await syncEngine2.stop();
    await engine2.stop();
  });

  test('snapshotTimestampPrefix trims the seconds', async () => {
    const nowInSeconds = getFarcasterTime()._unsafeUnwrap();
    const snapshotTimestamp = syncEngine.snapshotTimestamp._unsafeUnwrap();
    expect(snapshotTimestamp).toBeLessThanOrEqual(nowInSeconds);
    expect(snapshotTimestamp).toEqual(Math.floor(nowInSeconds / 10) * 10);
  });

  test('shouldSync returns false when already syncing', async () => {
    const mockRPCClient = mock<HubRpcClient>();
    const rpcClient = instance(mockRPCClient);
    let called = false;
    when(mockRPCClient.getSyncMetadataByPrefix(anything(), anything(), anything())).thenCall(async () => {
      const shouldSync = await syncEngine.shouldSync({
        prefix: new Uint8Array(),
        numMessages: 10,
        excludedHashes: [],
      });
      expect(shouldSync.isOk()).toBeTruthy();
      expect(shouldSync._unsafeUnwrap()).toBeFalsy();
      called = true;

      // Return an empty child map so sync will finish with a noop
      const emptyMetadata = TrieNodeMetadataResponse.create({
        prefix: new Uint8Array(),
        numMessages: 1000,
        hash: '',
        children: [],
      });
      return Promise.resolve(ok(emptyMetadata));
    });
    await syncEngine.performSync(
      {
        prefix: new Uint8Array(),
        numMessages: 10,
        excludedHashes: ['some-divergence'],
      },
      rpcClient
    );
    expect(called).toBeTruthy();
  });

  test('shouldSync returns false when excludedHashes match', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);

    await addMessagesWithTimestamps([30662167, 30662169, 30662172]);
    expect((await syncEngine.shouldSync((await syncEngine.getSnapshot())._unsafeUnwrap()))._unsafeUnwrap()).toBeFalsy();
  });

  test('shouldSync returns true when hashes dont match', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);

    await addMessagesWithTimestamps([30662167, 30662169, 30662172]);
    const oldSnapshot = (await syncEngine.getSnapshot())._unsafeUnwrap();
    await addMessagesWithTimestamps([30662372]);
    expect(oldSnapshot.excludedHashes).not.toEqual((await syncEngine.getSnapshot())._unsafeUnwrap().excludedHashes);
    expect((await syncEngine.shouldSync(oldSnapshot))._unsafeUnwrap()).toBeTruthy();
  });

  test('initialize populates the trie with all existing messages', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);

    const messages = await addMessagesWithTimestamps([30662167, 30662169, 30662172]);

    expect(await syncEngine.trie.items()).toEqual(4); // signerAdd + 3 messages

    const syncEngine2 = new SyncEngine(engine, testDb);
    await syncEngine2.initialize();

    // Make sure all messages exist
    expect(await syncEngine2.trie.items()).toEqual(4);
    expect(await syncEngine2.trie.rootHash()).toEqual(await syncEngine.trie.rootHash());
    expect(await syncEngine2.trie.exists(new SyncId(messages[0] as Message))).toBeTruthy();
    expect(await syncEngine2.trie.exists(new SyncId(messages[1] as Message))).toBeTruthy();
    expect(await syncEngine2.trie.exists(new SyncId(messages[2] as Message))).toBeTruthy();

    await syncEngine2.stop();
  });

  test('Rebuild trie from engine messages', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);

    const messages = await addMessagesWithTimestamps([30662167, 30662169, 30662172]);

    expect(await syncEngine.trie.items()).toEqual(4); // signerAdd + 3 messages

    const syncEngine2 = new SyncEngine(engine, testDb);
    await syncEngine2.initialize(true); // Rebuild from engine messages

    // Make sure all messages exist
    expect(await syncEngine2.trie.items()).toEqual(4);
    expect(await syncEngine2.trie.rootHash()).toEqual(await syncEngine.trie.rootHash());
    expect(await syncEngine2.trie.exists(new SyncId(messages[0] as Message))).toBeTruthy();
    expect(await syncEngine2.trie.exists(new SyncId(messages[1] as Message))).toBeTruthy();
    expect(await syncEngine2.trie.exists(new SyncId(messages[2] as Message))).toBeTruthy();

    await syncEngine2.stop();
  });

  test('getSnapshot should use a prefix of 10-seconds resolution timestamp', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);

    await addMessagesWithTimestamps([30662160, 30662169, 30662172]);
    const nowOrig = Date.now;
    Date.now = () => 1609459200000 + 30662167 * 1000;
    try {
      const result = await syncEngine.getSnapshot();
      const snapshot = result._unsafeUnwrap();
      expect((snapshot.prefix as Buffer).toString('utf8')).toEqual('0030662160');
    } finally {
      Date.now = nowOrig;
    }
  });

  describe('getDivergencePrefix', () => {
    const trieWithIds = async (timestamps: number[]) => {
      const syncIds = await Promise.all(
        timestamps.map(async (t) => {
          return await NetworkFactories.SyncId.create(undefined, { transient: { date: new Date(t * 1000) } });
        })
      );

      await Promise.all(syncIds.map((id) => syncEngine.trie.insert(id)));
      await syncEngine.trie.commitToDb();
    };

    test('returns the prefix with the most common excluded hashes', async () => {
      await trieWithIds([1665182332, 1665182343, 1665182345]);

      const trie = syncEngine.trie;

      const prefixToTest = Buffer.from('1665182343');
      const oldSnapshot = await trie.getSnapshot(prefixToTest);
      trie.insert(await NetworkFactories.SyncId.create(undefined, { transient: { date: new Date(1665182353000) } }));

      // Since message above was added at 1665182353, the two tries diverged at 16651823 for our prefix
      let divergencePrefix = await syncEngine.getDivergencePrefix(
        await trie.getSnapshot(prefixToTest),
        oldSnapshot.excludedHashes
      );
      expect(divergencePrefix).toEqual(Buffer.from('16651823'));

      // divergence prefix should be the full prefix, if snapshots are the same
      const currentSnapshot = await trie.getSnapshot(prefixToTest);
      divergencePrefix = await syncEngine.getDivergencePrefix(
        await trie.getSnapshot(prefixToTest),
        currentSnapshot.excludedHashes
      );
      expect(divergencePrefix).toEqual(prefixToTest);

      // divergence prefix should empty if excluded hashes are empty
      divergencePrefix = await syncEngine.getDivergencePrefix(await trie.getSnapshot(prefixToTest), []);
      expect(divergencePrefix.length).toEqual(0);

      // divergence prefix should be our prefix if provided hashes are longer
      const with5 = Buffer.concat([prefixToTest, Buffer.from('5')]);
      divergencePrefix = await syncEngine.getDivergencePrefix(await trie.getSnapshot(with5), [
        ...currentSnapshot.excludedHashes,
        'different',
      ]);
      expect(divergencePrefix).toEqual(prefixToTest);
    });
  });
});
