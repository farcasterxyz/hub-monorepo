import { FarcasterNetwork, Message } from '@farcaster/flatbuffers';
import { Factories } from '@farcaster/utils';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import { CastRemoveModel, SignerAddModel } from '~/flatbuffers/models/types';
import { APP_NICKNAME, APP_VERSION } from '~/hub';
import SyncEngine from '~/network/sync/syncEngine';
import { SyncId } from '~/network/sync/syncId';
import HubRpcClient from '~/rpc/client';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';
import { addressInfoFromParts } from '~/utils/p2p';

const TEST_TIMEOUT_LONG = 60 * 1000;

const testDb1 = jestRocksDB(`engine1.peersyncEngine.test`);
const testDb2 = jestRocksDB(`engine2.peersyncEngine.test`);

const fid = Factories.FID.build();
const ethSigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();

let custodyEvent: IdRegistryEventModel;
let signerAdd: SignerAddModel;

beforeAll(async () => {
  custodyEvent = new IdRegistryEventModel(
    await Factories.IdRegistryEvent.create({ to: Array.from(ethSigner.signerKey), fid: Array.from(fid) })
  );

  const signerAddData = await Factories.SignerAddData.create({
    body: Factories.SignerBody.build({ signer: Array.from(signer.signerKey) }),
    fid: Array.from(fid),
  });
  signerAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { ethSigner } })
  ) as SignerAddModel;
});

describe('Multi peer sync engine', () => {
  const addMessagesWithTimestamps = async (engine: Engine, timestamps: number[]) => {
    return await Promise.all(
      timestamps.map(async (t) => {
        const addData = await Factories.CastAddData.create({ fid: Array.from(fid), timestamp: t });
        const addMessage = await Factories.Message.create(
          { data: Array.from(addData.bb?.bytes() ?? []) },
          { transient: { signer } }
        );
        const addMessageModel = new MessageModel(addMessage);

        const result = await engine.mergeMessage(addMessageModel);
        expect(result.isOk()).toBeTruthy();
        return Promise.resolve(addMessageModel);
      })
    );
  };

  const removeMessagesWithTsHashes = async (engine: Engine, addMessages: MessageModel[]) => {
    return await Promise.all(
      addMessages.map(async (addMessage) => {
        const castRemoveBody = await Factories.CastRemoveBody.create({
          targetTsHash: Array.from(addMessage.tsHash()),
        });
        const castRemoveData = await Factories.CastRemoveData.create({
          fid: Array.from(fid),
          timestamp: addMessage.timestamp() + 10,
          body: castRemoveBody.unpack(),
        });
        const castRemove = new MessageModel(
          await Factories.Message.create(
            { data: Array.from(castRemoveData.bb?.bytes() ?? []) },
            { transient: { signer } }
          )
        );

        const result = await engine.mergeMessage(castRemove);
        expect(result.isOk()).toBeTruthy();
        return Promise.resolve(castRemove);
      })
    );
  };

  // Engine 1 is where we add events, and see if engine 2 will sync them
  let engine1: Engine;
  let hub1;
  let syncEngine1: SyncEngine;
  let server1: Server;
  let port1;
  let clientForServer1: HubRpcClient;

  beforeEach(async () => {
    // Engine 1 is where we add events, and see if engine 2 will sync them
    engine1 = new Engine(testDb1, FarcasterNetwork.Testnet);
    hub1 = new MockHub(testDb1, engine1);
    syncEngine1 = new SyncEngine(engine1);
    syncEngine1.initialize();
    server1 = new Server(hub1, engine1, syncEngine1);
    port1 = await server1.start();
    clientForServer1 = new HubRpcClient(addressInfoFromParts('127.0.0.1', port1)._unsafeUnwrap());
  });

  afterEach(async () => {
    // Cleanup
    clientForServer1.close();
    await server1.stop();
  });

  test('toBytes test', async () => {
    // Add signer custody event to engine 1
    await engine1.mergeIdRegistryEvent(custodyEvent);
    await engine1.mergeMessage(signerAdd);

    // Get info first
    const info = await clientForServer1.getInfo();
    expect(info.isOk()).toBeTruthy();
    const infoResult = info._unsafeUnwrap();
    expect(infoResult.version()).toEqual(APP_VERSION);
    expect(infoResult.nickname()).toEqual(APP_NICKNAME);

    // Fetch the signerAdd message from engine 1
    const rpcResult = await clientForServer1.getAllSignerMessagesByFid(fid);
    expect(rpcResult.isOk()).toBeTruthy();
    expect(rpcResult._unsafeUnwrap().length).toEqual(1);
    const rpcSignerAddMessage = rpcResult._unsafeUnwrap()[0];
    const rpcSignerAdd = new MessageModel(rpcSignerAddMessage as Message);

    // Construct the message model from the rpc message bytes.
    const mm = MessageModel.from(rpcSignerAdd.toBuffer());

    expect(signerAdd?.toBuffer().toString('hex')).toEqual(rpcSignerAdd?.toBuffer().toString('hex'));
    expect(mm.fid()).toEqual(signerAdd.fid());

    // Create a new sync engine from the existing engine, and see if all the messages from the engine
    // are loaded into the sync engine Merkle Trie properly.
    const reinitSyncEngine = new SyncEngine(engine1);
    expect(reinitSyncEngine.trie.rootHash).toEqual('');
    await reinitSyncEngine.initialize();

    expect(reinitSyncEngine.trie.rootHash).toEqual(syncEngine1.trie.rootHash);
  });

  test(
    'two peers should sync',
    async () => {
      // Add signer custody event to engine 1
      await engine1.mergeIdRegistryEvent(custodyEvent);
      await engine1.mergeMessage(signerAdd);

      // Add messages to engine 1
      await addMessagesWithTimestamps(engine1, [30662167, 30662169, 30662172]);

      const engine2 = new Engine(testDb2, FarcasterNetwork.Testnet);
      const syncEngine2 = new SyncEngine(engine2);

      // Engine 2 should sync with engine1
      expect(syncEngine2.shouldSync(syncEngine1.snapshot._unsafeUnwrap().excludedHashes)._unsafeUnwrap()).toBeTruthy();

      // Sync engine 2 with engine 1
      await syncEngine2.performSync(syncEngine1.snapshot._unsafeUnwrap().excludedHashes, clientForServer1);

      // Make sure root hash matches
      expect(syncEngine1.trie.rootHash).toEqual(syncEngine2.trie.rootHash);

      // Should sync should now be false with the new excluded hashes
      expect(syncEngine2.shouldSync(syncEngine1.snapshot._unsafeUnwrap().excludedHashes)._unsafeUnwrap()).toBeFalsy();

      // Add more messages
      await addMessagesWithTimestamps(engine1, [30663167, 30663169, 30663172]);

      // grab a new snapshot from the RPC for engine1
      const newSnapshotResult = await clientForServer1.getSyncTrieNodeSnapshotByPrefix('');
      expect(newSnapshotResult.isOk()).toBeTruthy();
      const newSnapshot = newSnapshotResult._unsafeUnwrap();

      // Sanity check snapshot
      const localSnapshot = syncEngine1.snapshot._unsafeUnwrap();
      expect(localSnapshot.excludedHashes).toEqual(newSnapshot.snapshot.excludedHashes);
      expect(localSnapshot.excludedHashes.length).toEqual(newSnapshot.snapshot.excludedHashes.length);
      expect(syncEngine1.trie.rootHash).toEqual(newSnapshot.rootHash);

      // Should sync should now be true
      expect(syncEngine2.shouldSync(newSnapshot.snapshot.excludedHashes)._unsafeUnwrap()).toBeTruthy();

      // Do the sync again
      await syncEngine2.performSync(newSnapshot.snapshot.excludedHashes, clientForServer1);

      // Make sure root hash matches
      expect(syncEngine1.trie.rootHash).toEqual(syncEngine2.trie.rootHash);
    },
    TEST_TIMEOUT_LONG
  );

  test('cast remove should remove from trie', async () => {
    // Add signer custody event to engine 1
    await engine1.mergeIdRegistryEvent(custodyEvent);
    await engine1.mergeMessage(signerAdd);

    // Add a cast to engine1
    const castAdd = (await addMessagesWithTimestamps(engine1, [30662167]))[0] as MessageModel;

    const engine2 = new Engine(testDb2, FarcasterNetwork.Testnet);
    const syncEngine2 = new SyncEngine(engine2);
    // Sync engine 2 with engine 1
    await syncEngine2.performSync([], clientForServer1);

    // Make sure the castAdd is in the trie
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine1.trie.exists(new SyncId(castAdd))).toBeTruthy();
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine2.trie.exists(new SyncId(castAdd))).toBeTruthy();

    // Remove the cast
    const castRemoveBody = await Factories.CastRemoveBody.create({ targetTsHash: Array.from(castAdd.tsHash()) });
    const castRemoveData = await Factories.CastRemoveData.create({
      fid: Array.from(fid),
      body: castRemoveBody.unpack(),
    });
    const castRemove = new MessageModel(
      await Factories.Message.create({ data: Array.from(castRemoveData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as CastRemoveModel;

    // Merging the cast remove deletes the cast add in the db, and it should be reflected in the trie
    const result = await engine1.mergeMessage(castRemove);
    expect(result.isOk()).toBeTruthy();

    const castRemoveId = new SyncId(castRemove);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine1.trie.exists(castRemoveId)).toBeTruthy();
    // The trie should not contain the castAdd anymore
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine1.trie.exists(new SyncId(castAdd))).toBeFalsy();

    // Syncing engine2 --> engine1 should do nothing, even though engine2 has the castAdd and it has been removed
    // from engine1.
    {
      const server2 = new Server(new MockHub(testDb2, engine2), engine2, syncEngine2);
      const port2 = await server2.start();
      const clientForServer2 = new HubRpcClient(addressInfoFromParts('127.0.0.1', port2)._unsafeUnwrap());
      const engine1RootHashBefore = syncEngine1.trie.rootHash;

      await syncEngine1.performSync(syncEngine2.snapshot._unsafeUnwrap().excludedHashes, clientForServer2);
      expect(syncEngine1.trie.rootHash).toEqual(engine1RootHashBefore);

      clientForServer2.close();
      await server2.stop();
    }

    // castRemove doesn't yet exist in engine2
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine2.trie.exists(castRemoveId)).toBeFalsy();

    // Syncing engine2 with engine1 should delete the castAdd from the trie and add the castRemove
    await syncEngine2.performSync(syncEngine1.snapshot._unsafeUnwrap().excludedHashes, clientForServer1);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine2.trie.exists(castRemoveId)).toBeTruthy();
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine2.trie.exists(new SyncId(castAdd))).toBeFalsy();
    expect(syncEngine2.trie.rootHash).toEqual(syncEngine1.trie.rootHash);

    // Adding the castAdd to engine2 should not change the root hash,
    // because it has already been removed, so adding it is a no-op
    const beforeRootHash = syncEngine2.trie.rootHash;
    await engine2.mergeMessage(castAdd);
    expect(syncEngine2.trie.rootHash).toEqual(beforeRootHash);
  });

  xtest(
    'loads of messages',
    async () => {
      const timedTest = async (fn: () => Promise<void>): Promise<number> => {
        const start = Date.now();
        await fn();
        const end = Date.now();

        const totalTime = (end - start) / 1000;
        return totalTime;
      };

      // Add signer custody event to engine 1
      await engine1.mergeIdRegistryEvent(custodyEvent);
      await engine1.mergeMessage(signerAdd);

      // Add loads of messages to engine 1
      let msgTimestamp = 30662167;
      const batchSize = 100;
      const numBatches = 20;

      // Remove a few messages from the previous batch
      let castMessagesToRemove: MessageModel[] = [];

      let totalMessages = 0;

      for (let i = 0; i < numBatches; i++) {
        // Remove a few messages from the previous batch
        const timestampsToRemove = [];
        for (let j = 0; j < castMessagesToRemove.length; j++) {
          timestampsToRemove.push(msgTimestamp + j);
        }

        await removeMessagesWithTsHashes(engine1, castMessagesToRemove);

        msgTimestamp += timestampsToRemove.length;
        totalMessages += timestampsToRemove.length;

        // Add new timestamped messages
        const timestamps = [];
        for (let j = 0; j < batchSize; j++) {
          timestamps.push(msgTimestamp + j);
        }
        // console.log('adding batch', i, ' of ', numBatches);
        const addedMessages = await addMessagesWithTimestamps(engine1, timestamps);
        castMessagesToRemove = addedMessages.slice(0, 10);

        msgTimestamp += batchSize;
        totalMessages += batchSize;
      }

      const engine2 = new Engine(testDb2, FarcasterNetwork.Testnet);
      const syncEngine2 = new SyncEngine(engine2);
      syncEngine2.initialize();

      // Engine 2 should sync with engine1
      expect(syncEngine2.shouldSync(syncEngine1.snapshot._unsafeUnwrap().excludedHashes)._unsafeUnwrap()).toBeTruthy();

      await engine2.mergeIdRegistryEvent(custodyEvent);
      await engine2.mergeMessage(signerAdd);

      // Sync engine 2 with engine 1, and measure the time taken
      let totalTime = await timedTest(async () => {
        await syncEngine2.performSync(syncEngine1.snapshot._unsafeUnwrap().excludedHashes, clientForServer1);
      });

      expect(totalTime).toBeGreaterThan(0);
      expect(totalMessages).toBeGreaterThan(numBatches * batchSize);
      // console.log('Sync total time', totalTime, 'seconds. Messages per second:', totalMessages / totalTime);

      expect(syncEngine1.snapshot._unsafeUnwrap().excludedHashes).toEqual(
        syncEngine2.snapshot._unsafeUnwrap().excludedHashes
      );
      expect(syncEngine1.snapshot._unsafeUnwrap().numMessages).toEqual(
        syncEngine2.snapshot._unsafeUnwrap().numMessages
      );

      // Create a new sync engine from the existing engine, and see if all the messages from the engine
      // are loaded into the sync engine Merkle Trie properly.
      const reinitSyncEngine = new SyncEngine(engine1);
      expect(reinitSyncEngine.trie.rootHash).toEqual('');

      totalTime = await timedTest(async () => {
        await reinitSyncEngine.initialize();
      });
      // console.log('MerkleTrie total time', totalTime, 'seconds. Messages per second:', totalMessages / totalTime);

      expect(reinitSyncEngine.trie.rootHash).toEqual(syncEngine1.trie.rootHash);
    },
    TEST_TIMEOUT_LONG
  );
});
