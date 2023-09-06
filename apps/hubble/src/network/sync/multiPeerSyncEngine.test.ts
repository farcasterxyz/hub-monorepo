import { jest } from "@jest/globals";
import {
  Factories,
  getInsecureHubRpcClient,
  HubRpcClient,
  FarcasterNetwork,
  IdRegistryEvent,
  SignerAddMessage,
  Message,
  TrieNodePrefix,
  HubInfoRequest,
  getFarcasterTime,
  OnChainEvent,
  CastAddMessage,
} from "@farcaster/hub-nodejs";
import { APP_NICKNAME, APP_VERSION, HubInterface } from "../../hubble.js";
import SyncEngine from "./syncEngine.js";
import { SyncId } from "./syncId.js";
import Server from "../../rpc/server.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import Engine from "../../storage/engine/index.js";
import { MockHub } from "../../test/mocks.js";
import { sleep, sleepWhile } from "../../utils/crypto.js";
import { EMPTY_HASH } from "./trieNode.js";
import { L2EventsProvider } from "../../eth/l2EventsProvider.js";

const TEST_TIMEOUT_LONG = 60 * 1000;

const testDb1 = jestRocksDB("engine1.peersyncEngine.test");
const testDb2 = jestRocksDB("engine2.peersyncEngine.test");

const network = FarcasterNetwork.TESTNET;

const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: IdRegistryEvent;
let signerAdd: SignerAddMessage;

beforeAll(async () => {
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } },
  );
});

describe("Multi peer sync engine", () => {
  const addMessagesWithTimeDelta = async (engine: Engine, timeDelta: number[]) => {
    return await Promise.all(
      timeDelta.map(async (t) => {
        const farcasterTime = getFarcasterTime()._unsafeUnwrap();
        const cast = await Factories.CastAddMessage.create(
          { data: { fid, network, timestamp: farcasterTime + t } },
          { transient: { signer } },
        );

        const result = await engine.mergeMessage(cast);
        expect(result.isOk()).toBeTruthy();

        return cast;
      }),
    );
  };

  const removeMessagesWithTsHashes = async (engine: Engine, addMessages: Message[]) => {
    return await Promise.all(
      addMessages.map(async (addMessage) => {
        const castRemove = await Factories.CastRemoveMessage.create(
          {
            data: {
              fid,
              network,
              timestamp: addMessage.data?.timestamp ?? 0 + 10,
              castRemoveBody: { targetHash: addMessage.hash },
            },
          },
          { transient: { signer } },
        );

        const result = await engine.mergeMessage(castRemove);
        expect(result.isOk()).toBeTruthy();
        return Promise.resolve(castRemove);
      }),
    );
  };

  // Engine 1 is where we add events, and see if engine 2 will sync them
  let engine1: Engine;
  let hub1: HubInterface;
  let syncEngine1: SyncEngine;
  let server1: Server;
  let port1;
  let clientForServer1: HubRpcClient;

  beforeEach(async () => {
    // Engine 1 is where we add events, and see if engine 2 will sync them
    engine1 = new Engine(testDb1, network);
    hub1 = new MockHub(testDb1, engine1);
    syncEngine1 = new SyncEngine(hub1, testDb1);
    syncEngine1.start();
    server1 = new Server(hub1, engine1, syncEngine1);
    port1 = await server1.start();
    clientForServer1 = getInsecureHubRpcClient(`127.0.0.1:${port1}`);
  });

  afterEach(async () => {
    // Cleanup
    clientForServer1.close();
    await server1.stop();
    await syncEngine1.stop();
    await engine1.stop();
  });

  test("toBytes test", async () => {
    // Add signer custody event to engine 1
    await engine1.mergeIdRegistryEvent(custodyEvent);
    await engine1.mergeMessage(signerAdd);

    // Get info first
    const info = await clientForServer1.getInfo(HubInfoRequest.create());
    expect(info.isOk()).toBeTruthy();
    const infoResult = info._unsafeUnwrap();
    expect(infoResult.version).toEqual(APP_VERSION);
    expect(infoResult.nickname).toEqual(APP_NICKNAME);

    // Fetch the signerAdd message from engine 1
    const rpcResult = await clientForServer1.getAllSignerMessagesByFid({ fid });
    expect(rpcResult.isOk()).toBeTruthy();
    expect(rpcResult._unsafeUnwrap().messages.length).toEqual(1);
    const rpcSignerAdd = rpcResult._unsafeUnwrap().messages[0] as SignerAddMessage;

    expect(Message.toJSON(signerAdd)).toEqual(Message.toJSON(rpcSignerAdd));
    expect(signerAdd.data?.fid).toEqual(rpcSignerAdd.data?.fid);

    // Create a new sync engine from the existing engine, and see if all the messages from the engine
    // are loaded into the sync engine Merkle Trie properly.
    await syncEngine1.trie.commitToDb();
    const reinitSyncEngine = new SyncEngine(hub1, testDb1);
    await reinitSyncEngine.start();

    expect(await reinitSyncEngine.trie.rootHash()).toEqual(await syncEngine1.trie.rootHash());

    await reinitSyncEngine.stop();
  });

  test(
    "two peers should sync",
    async () => {
      // Add signer custody event to engine 1
      await engine1.mergeIdRegistryEvent(custodyEvent);
      await engine1.mergeMessage(signerAdd);

      // Add messages to engine 1
      await addMessagesWithTimeDelta(engine1, [167, 169, 172]);
      await sleepWhile(() => syncEngine1.syncTrieQSize > 0, 1000);

      const engine2 = new Engine(testDb2, network);
      const hub2 = new MockHub(testDb2, engine2);
      const syncEngine2 = new SyncEngine(hub2, testDb2);

      // Add the signer custody event to engine 2
      await engine2.mergeIdRegistryEvent(custodyEvent);

      // Engine 2 should sync with engine1
      expect(
        (await syncEngine2.syncStatus("engine2", (await syncEngine1.getSnapshot())._unsafeUnwrap()))._unsafeUnwrap()
          .shouldSync,
      ).toBeTruthy();

      // Sync engine 2 with engine 1
      await syncEngine2.performSync("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap(), clientForServer1);

      // Make sure root hash matches
      expect(await syncEngine1.trie.rootHash()).toEqual(await syncEngine2.trie.rootHash());

      // Should sync should now be false with the new excluded hashes
      expect(
        (await syncEngine2.syncStatus("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap()))._unsafeUnwrap()
          .shouldSync,
      ).toBeFalsy();

      // Add more messages
      await addMessagesWithTimeDelta(engine1, [367, 369, 372]);
      await sleepWhile(() => syncEngine1.syncTrieQSize > 0, 1000);

      // grab a new snapshot from the RPC for engine1
      const newSnapshotResult = await clientForServer1.getSyncSnapshotByPrefix(TrieNodePrefix.create());
      expect(newSnapshotResult.isOk()).toBeTruthy();
      const newSnapshot = newSnapshotResult._unsafeUnwrap();

      // Sanity check snapshot
      const localSnapshot = (await syncEngine1.getSnapshot())._unsafeUnwrap();
      expect(localSnapshot.excludedHashes).toEqual(newSnapshot.excludedHashes);
      expect(localSnapshot.excludedHashes.length).toEqual(newSnapshot.excludedHashes.length);
      expect(await syncEngine1.trie.rootHash()).toEqual(newSnapshot.rootHash);

      // Should sync should now be true
      expect((await syncEngine2.syncStatus("engine1", newSnapshot))._unsafeUnwrap().shouldSync).toBeTruthy();

      // Do the sync again
      await syncEngine2.performSync("engine1", newSnapshot, clientForServer1);

      // Make sure root hash matches
      expect(await syncEngine1.trie.rootHash()).toEqual(await syncEngine2.trie.rootHash());

      await syncEngine2.stop();
      await engine2.stop();
    },
    TEST_TIMEOUT_LONG,
  );

  test("cast remove should remove from trie", async () => {
    // Add signer custody event to engine 1
    await engine1.mergeIdRegistryEvent(custodyEvent);
    await engine1.mergeMessage(signerAdd);

    // Add a cast to engine1
    const castAdd = (await addMessagesWithTimeDelta(engine1, [167]))[0] as Message;
    await sleepWhile(() => syncEngine1.syncTrieQSize > 0, 1000);

    const engine2 = new Engine(testDb2, network);
    const hub2 = new MockHub(testDb2, engine2);
    const syncEngine2 = new SyncEngine(hub2, testDb2);

    // Add the signer custody event to engine 2
    await engine2.mergeIdRegistryEvent(custodyEvent);

    // Sync engine 2 with engine 1
    await syncEngine2.performSync("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap(), clientForServer1);
    await sleepWhile(() => syncEngine2.syncTrieQSize > 0, 1000);

    expect(await syncEngine2.trie.rootHash()).toEqual(await syncEngine1.trie.rootHash());

    // Make sure the castAdd is in the trie
    expect(await syncEngine1.trie.exists(new SyncId(castAdd))).toBeTruthy();
    expect(await syncEngine2.trie.exists(new SyncId(castAdd))).toBeTruthy();

    const castRemove = await Factories.CastRemoveMessage.create(
      {
        data: {
          fid,
          network,
          timestamp: castAdd.data?.timestamp ?? 0 + 10,
          castRemoveBody: { targetHash: castAdd.hash },
        },
      },
      { transient: { signer } },
    );

    // Merging the cast remove deletes the cast add in the db, and it should be reflected in the trie
    const result = await engine1.mergeMessage(castRemove);
    await sleepWhile(() => syncEngine1.syncTrieQSize > 0, 1000);

    expect(result.isOk()).toBeTruthy();

    const castRemoveId = new SyncId(castRemove);
    expect(await syncEngine1.trie.exists(castRemoveId)).toBeTruthy();
    // The trie should not contain the castAdd anymore
    expect(await syncEngine1.trie.exists(new SyncId(castAdd))).toBeFalsy();

    // Syncing engine2 --> engine1 should do nothing, even though engine2 has the castAdd and it has been removed
    // from engine1.
    {
      const server2 = new Server(new MockHub(testDb2, engine2), engine2, syncEngine2);
      const port2 = await server2.start();
      const clientForServer2 = getInsecureHubRpcClient(`127.0.0.1:${port2}`);
      const engine1RootHashBefore = await syncEngine1.trie.rootHash();

      await syncEngine1.performSync("engine2", (await syncEngine2.getSnapshot())._unsafeUnwrap(), clientForServer2);
      await sleepWhile(() => syncEngine1.syncTrieQSize > 0, 1000);

      expect(await syncEngine1.trie.rootHash()).toEqual(engine1RootHashBefore);

      clientForServer2.close();
      await server2.stop();
    }

    // castRemove doesn't yet exist in engine2
    expect(await syncEngine2.trie.exists(castRemoveId)).toBeFalsy();

    await syncEngine2.performSync("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap(), clientForServer1);
    await sleepWhile(() => syncEngine2.syncTrieQSize > 0, 1000);

    expect(await syncEngine2.trie.exists(castRemoveId)).toBeTruthy();
    expect(await syncEngine2.trie.exists(new SyncId(castAdd))).toBeFalsy();

    expect(await syncEngine2.trie.rootHash()).toEqual(await syncEngine1.trie.rootHash());

    // Adding the castAdd to engine2 should not change the root hash,
    // because it has already been removed, so adding it is a no-op
    const beforeRootHash = await syncEngine2.trie.rootHash();
    await engine2.mergeMessage(castAdd);
    await sleepWhile(() => syncEngine2.syncTrieQSize > 0, 1000);

    expect(await syncEngine2.trie.rootHash()).toEqual(beforeRootHash);

    await syncEngine2.stop();
    await engine2.stop();
  });

  test("shouldn't fetch messages that already exist", async () => {
    // Engine1 has 1 message
    await engine1.mergeIdRegistryEvent(custodyEvent);
    await engine1.mergeMessage(signerAdd);

    const engine2 = new Engine(testDb2, network);
    const hub2 = new MockHub(testDb2, engine2);
    const syncEngine2 = new SyncEngine(hub2, testDb2);

    // Engine2 has 2 messages
    await engine2.mergeIdRegistryEvent(custodyEvent);
    await engine2.mergeMessage(signerAdd);
    await addMessagesWithTimeDelta(engine2, [167]);

    // Syncing engine2 --> engine1 should not fetch any additional messages, since engine2 already
    // has all the messages
    {
      const fetchMessagesSpy = jest.spyOn(syncEngine1, "getAllMessagesBySyncIds");
      await syncEngine2.performSync("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap(), clientForServer1);

      expect(fetchMessagesSpy).not.toHaveBeenCalled();
    }

    await syncEngine2.stop();
    await engine2.stop();
  });

  test("should fetch only the exact missing message", async () => {
    // Engine1 has 2 message
    await engine1.mergeIdRegistryEvent(custodyEvent);
    await engine1.mergeMessage(signerAdd);
    const msgs = await addMessagesWithTimeDelta(engine1, [167]);

    const engine2 = new Engine(testDb2, network);
    const hub2 = new MockHub(testDb2, engine2);
    const syncEngine2 = new SyncEngine(hub2, testDb2);

    // Engine2 has 1 messages
    await engine2.mergeIdRegistryEvent(custodyEvent);
    await engine2.mergeMessage(signerAdd);

    // Syncing engine2 --> engine1 should fetch only the missing message
    {
      const fetchMessagesSpy = jest.spyOn(syncEngine1, "getAllMessagesBySyncIds");
      await syncEngine2.performSync("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap(), clientForServer1);

      expect(fetchMessagesSpy).toHaveBeenCalledTimes(1);
      expect(fetchMessagesSpy).toHaveBeenCalledWith([new SyncId(msgs[0] as Message).syncId()]);

      // Also assert the root hashes are the same
      expect(await syncEngine2.trie.rootHash()).toEqual(await syncEngine1.trie.rootHash());
    }

    await syncEngine2.stop();
    await engine2.stop();
  });

  describe("after migration", () => {
    let engine2: Engine;
    let syncEngine2: SyncEngine;
    let retryEventsMock: L2EventsProvider;
    let custodyEvent: OnChainEvent;
    let signerEvent: OnChainEvent;

    beforeEach(async () => {
      engine2 = new Engine(testDb2, network);
      const hub2 = new MockHub(testDb2, engine2);
      // biome-ignore lint/suspicious/noExplicitAny: mock used only in tests
      const l2EventsProvider = jest.fn() as any;
      l2EventsProvider.retryEventsFromBlock = jest.fn();
      retryEventsMock = l2EventsProvider.retryEventsFromBlock;

      syncEngine2 = new SyncEngine(hub2, testDb2, l2EventsProvider);

      // Set up engine1
      custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid });
      signerEvent = Factories.SignerOnChainEvent.build({
        fid,
        signerEventBody: Factories.SignerEventBody.build({ key: (await signer.getSignerKey())._unsafeUnwrap() }),
      });
      const migratedEvent = Factories.SignerMigratedOnChainEvent.build();
      await engine1.mergeOnChainEvent(custodyEvent);
      await engine1.mergeOnChainEvent(signerEvent);
      await engine1.mergeOnChainEvent(migratedEvent);

      await engine2.mergeOnChainEvent(migratedEvent);
      await addMessagesWithTimeDelta(engine1, [167]);
    });
    test("retries the id registry event block if it's missing", async () => {
      await syncEngine2.performSync("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap(), clientForServer1);

      // Because do it without awaiting, we need to wait for the promise to resolve
      await sleep(100);
      expect(retryEventsMock).toHaveBeenCalledWith(custodyEvent.blockNumber);
    });

    test("retries the signer event block if it's missing", async () => {
      await engine2.mergeOnChainEvent(custodyEvent);
      await syncEngine2.performSync("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap(), clientForServer1);

      // Because do it without awaiting, we need to wait for the promise to resolve
      await sleep(100);
      expect(retryEventsMock).toHaveBeenCalledWith(signerEvent.blockNumber);
    });

    test("does not retry any block if both events are present", async () => {
      await engine2.mergeOnChainEvent(custodyEvent);
      await engine2.mergeOnChainEvent(signerEvent);
      await syncEngine2.performSync("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap(), clientForServer1);

      // Because do it without awaiting, we need to wait for the promise to resolve
      await sleep(100);
      expect(retryEventsMock).not.toHaveBeenCalled();
    });
  });

  test("recovers if there are missing messages in the engine", async () => {
    const engine2 = new Engine(testDb2, network);
    const hub2 = new MockHub(testDb2, engine2);
    const syncEngine2 = new SyncEngine(hub2, testDb2);
    await syncEngine2.start();

    // Add a message to engine1 synctrie, but not to the engine itself.
    syncEngine1.trie.insert(new SyncId(signerAdd));

    // Attempt to sync engine2 <-- engine1.
    await syncEngine2.performSync("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap(), clientForServer1);

    // Since the message is actually missing, it should be a no-op, and the missing message should disappear
    // from the sync trie
    await sleepWhile(async () => (await syncEngine2.trie.exists(new SyncId(signerAdd))) === true, 1000);
    expect(await syncEngine2.trie.exists(new SyncId(signerAdd))).toBeFalsy();

    // The root hashes should be the same, since nothing actually happened
    expect(await syncEngine1.trie.items()).toEqual(await syncEngine2.trie.items());
    expect(await syncEngine1.trie.rootHash()).toEqual(EMPTY_HASH);
  });

  test("recovers if there are missing messages in the engine during sync", async () => {
    const engine2 = new Engine(testDb2, network);
    const hub2 = new MockHub(testDb2, engine2);
    const syncEngine2 = new SyncEngine(hub2, testDb2);
    await syncEngine2.start();

    await engine2.mergeIdRegistryEvent(custodyEvent);
    await engine1.mergeIdRegistryEvent(custodyEvent);

    await engine2.mergeMessage(signerAdd);
    await engine1.mergeMessage(signerAdd);

    // We'll get 2 CastAdds
    const castAdd1 = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
    const castAdd2 = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });

    // CastAdd1 is added properly to both
    expect(await engine2.mergeMessage(castAdd1)).toBeTruthy();
    expect(await engine1.mergeMessage(castAdd1)).toBeTruthy();

    // CastAdd2 is added only to the sync trie, but is missing from the engine
    await syncEngine2.trie.insert(new SyncId(castAdd2));

    // Wait for the sync trie to be updated
    await sleepWhile(async () => (await syncEngine2.trie.items()) !== 3, 1000);
    await sleepWhile(async () => (await syncEngine1.trie.items()) !== 2, 1000);

    // Attempt to sync engine2 <-- engine1. Engine1 has only singerAdd
    await syncEngine2.performSync("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap(), clientForServer1);

    // The sync engine should realize that castAdd2 is not in it's engine, so it should be removed from the sync trie
    await sleepWhile(async () => (await syncEngine2.trie.exists(new SyncId(castAdd2))) === true, 1000);

    expect(await syncEngine2.trie.exists(new SyncId(castAdd2))).toBeFalsy();

    // but the signerAdd should still be there along with castAdd1
    expect(await syncEngine2.trie.exists(new SyncId(signerAdd))).toBeTruthy();
    expect(await syncEngine2.trie.exists(new SyncId(castAdd1))).toBeTruthy();

    await syncEngine2.stop();
    await engine2.stop();
  });

  test("recovers if messages are missing from the sync trie", async () => {
    await engine1.mergeIdRegistryEvent(custodyEvent);
    await engine1.mergeMessage(signerAdd);

    const engine2 = new Engine(testDb2, network);
    const hub2 = new MockHub(testDb2, engine2);
    const syncEngine2 = new SyncEngine(hub2, testDb2);
    await syncEngine2.start();

    // We add it to the engine2 synctrie as normal...
    await engine2.mergeIdRegistryEvent(custodyEvent);
    await engine2.mergeMessage(signerAdd);

    // ...but we'll corrupt the sync trie by pretending that the signerAdd message is missing
    syncEngine2.trie.deleteBySyncId(new SyncId(signerAdd));

    // syncengine2 should be empty
    expect(await syncEngine2.trie.items()).toEqual(0);
    expect(await syncEngine2.trie.rootHash()).toEqual(EMPTY_HASH);

    // Attempt to sync engine2 <-- engine1.
    // It will appear to engine2 that the message is missing, so it will request it from engine1.
    // It will be a duplicate, but the sync trie should be updated
    await syncEngine2.performSync("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap(), clientForServer1);

    // Since the message isn't actually missing, it should be a no-op, and the missing message should
    // get added back to the sync trie
    await sleepWhile(async () => (await syncEngine2.trie.exists(new SyncId(signerAdd))) === false, 1000);

    // The root hashes should now be the same
    expect(await syncEngine1.trie.items()).toEqual(await syncEngine2.trie.items());
    expect(await syncEngine1.trie.rootHash()).toEqual(await syncEngine2.trie.rootHash());

    await syncEngine2.stop();
    await engine2.stop();
  });

  test("syncEngine syncs with same numMessages but different hashes", async () => {
    await engine1.mergeIdRegistryEvent(custodyEvent);
    await engine1.mergeMessage(signerAdd);

    const engine2 = new Engine(testDb2, network);
    const hub2 = new MockHub(testDb2, engine2);
    const syncEngine2 = new SyncEngine(hub2, testDb2);

    await engine2.mergeIdRegistryEvent(custodyEvent);
    await engine2.mergeMessage(signerAdd);

    expect(await syncEngine1.trie.items()).toEqual(await syncEngine2.trie.items());
    expect(await syncEngine1.trie.rootHash()).toEqual(await syncEngine2.trie.rootHash());

    // Add two different messages to engine1 and engine2
    await addMessagesWithTimeDelta(engine1, [167]);
    await addMessagesWithTimeDelta(engine2, [169]);

    await sleepWhile(async () => (await syncEngine1.trie.items()) !== 2, 1000);
    await sleepWhile(async () => (await syncEngine2.trie.items()) !== 2, 1000);

    // Do a sync
    await syncEngine2.performSync("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap(), clientForServer1);
    await sleepWhile(async () => (await syncEngine2.trie.items()) !== 3, 1000);

    expect(await syncEngine2.trie.items()).toEqual(3);

    // Do a sync the other way
    {
      const server2 = new Server(new MockHub(testDb2, engine2), engine2, syncEngine2);
      const port2 = await server2.start();
      const clientForServer2 = getInsecureHubRpcClient(`127.0.0.1:${port2}`);

      await syncEngine1.performSync("engine2", (await syncEngine2.getSnapshot())._unsafeUnwrap(), clientForServer2);
      await sleepWhile(async () => (await syncEngine1.trie.items()) !== 3, 1000);

      // Now both engines should have the same number of messages and the same root hash
      expect(await syncEngine1.trie.items()).toEqual(await syncEngine2.trie.items());
      expect(await syncEngine1.trie.rootHash()).toEqual(await syncEngine2.trie.rootHash());

      clientForServer2.$.close();
      await server2.stop();
    }

    await syncEngine2.stop();
    await engine2.stop();
  });

  test("syncEngine syncs with more numMessages and different hashes", async () => {
    await engine1.mergeIdRegistryEvent(custodyEvent);
    await engine1.mergeMessage(signerAdd);

    const engine2 = new Engine(testDb2, network);
    const hub2 = new MockHub(testDb2, engine2);
    const syncEngine2 = new SyncEngine(hub2, testDb2);

    await engine2.mergeIdRegistryEvent(custodyEvent);
    await engine2.mergeMessage(signerAdd);

    expect(await syncEngine1.trie.items()).toEqual(await syncEngine2.trie.items());
    expect(await syncEngine1.trie.rootHash()).toEqual(await syncEngine2.trie.rootHash());

    // Add two different messages to engine1 and engine2
    await addMessagesWithTimeDelta(engine1, [167, 168]);
    await addMessagesWithTimeDelta(engine2, [169]);

    await sleepWhile(() => syncEngine1.syncTrieQSize > 0, 1000);
    await sleepWhile(() => syncEngine2.syncTrieQSize > 0, 1000);

    // Do a sync
    await syncEngine2.performSync("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap(), clientForServer1);
    await sleepWhile(() => syncEngine2.syncTrieQSize > 0, 1000);

    expect(await syncEngine2.trie.items()).toEqual(4);

    // Do a sync the other way
    {
      const server2 = new Server(new MockHub(testDb2, engine2), engine2, syncEngine2);
      const port2 = await server2.start();
      const clientForServer2 = getInsecureHubRpcClient(`127.0.0.1:${port2}`);

      await syncEngine1.performSync("engine2", (await syncEngine2.getSnapshot())._unsafeUnwrap(), clientForServer2);
      await sleepWhile(() => syncEngine1.syncTrieQSize > 0, 1000);

      // Now both engines should have the same number of messages and the same root hash
      expect(await syncEngine1.trie.items()).toEqual(await syncEngine2.trie.items());
      expect(await syncEngine1.trie.rootHash()).toEqual(await syncEngine2.trie.rootHash());

      clientForServer2.$.close();
      await server2.stop();
    }

    await syncEngine2.stop();
    await engine2.stop();
  });

  xtest(
    "loads of messages",
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
      let castMessagesToRemove: Message[] = [];

      let totalMessages = 0;

      let totalTime = await timedTest(async () => {
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
          const addedMessages = await addMessagesWithTimeDelta(engine1, timestamps);
          await sleepWhile(() => syncEngine1.syncTrieQSize > 0, 1000);
          castMessagesToRemove = addedMessages.slice(0, 10);

          msgTimestamp += batchSize;
          totalMessages += batchSize;
        }
        await sleepWhile(() => syncEngine1.syncTrieQSize > 0, 1000);
      });
      expect(totalTime).toBeGreaterThan(0);
      expect(totalMessages).toBeGreaterThan(numBatches * batchSize);
      // console.log('Merge total time', totalTime, 'seconds. Messages per second:', totalMessages / totalTime);

      const engine2 = new Engine(testDb2, network);
      const hub2 = new MockHub(testDb2, engine2);
      const syncEngine2 = new SyncEngine(hub2, testDb2);
      syncEngine2.start();

      // Engine 2 should sync with engine1
      expect(
        (await syncEngine2.syncStatus("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap()))._unsafeUnwrap()
          .shouldSync,
      ).toBeTruthy();

      await engine2.mergeIdRegistryEvent(custodyEvent);
      await engine2.mergeMessage(signerAdd);

      // Sync engine 2 with engine 1, and measure the time taken
      totalTime = await timedTest(async () => {
        await syncEngine2.performSync("engine1", (await syncEngine1.getSnapshot())._unsafeUnwrap(), clientForServer1);
      });

      expect(totalTime).toBeGreaterThan(0);
      expect(totalMessages).toBeGreaterThan(numBatches * batchSize);
      // console.log('Sync total time', totalTime, 'seconds. Messages per second:', totalMessages / totalTime);

      expect((await syncEngine1.getSnapshot())._unsafeUnwrap().excludedHashes).toEqual(
        (await syncEngine2.getSnapshot())._unsafeUnwrap().excludedHashes,
      );
      expect((await syncEngine1.getSnapshot())._unsafeUnwrap().numMessages).toEqual(
        (await syncEngine2.getSnapshot())._unsafeUnwrap().numMessages,
      );

      // Create a new sync engine from the existing engine, and see if all the messages from the engine
      // are loaded into the sync engine Merkle Trie properly.
      const reinitSyncEngine = new SyncEngine(hub1, testDb1);
      expect(await reinitSyncEngine.trie.rootHash()).toEqual("");

      totalTime = await timedTest(async () => {
        await reinitSyncEngine.start();
      });
      // console.log('MerkleTrie total time', totalTime, 'seconds. Messages per second:', totalMessages / totalTime);

      expect(await reinitSyncEngine.trie.rootHash()).toEqual(await syncEngine1.trie.rootHash());

      await syncEngine2.stop();
      await engine2.stop();
    },
    TEST_TIMEOUT_LONG,
  );
});
