import { FarcasterNetwork, Factories, HubRpcClient, CastAddMessage, OnChainEvent } from "@farcaster/hub-nodejs";
import { getFarcasterTime } from "@farcaster/core";
import SyncEngine, { FailoverStreamSyncClient } from "../../network/sync/syncEngine.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import { MockHub } from "../../test/mocks.js";
import { MockRpcClient } from "./mock.js";
import { sleepWhile } from "../../utils/crypto.js";

const SLEEPWHILE_TIMEOUT = 1 * 1000;

const testDb = jestRocksDB("engine.syncEnginePerf.test");
const testDb2 = jestRocksDB("engine2.syncEnginePerf.test");

const network = FarcasterNetwork.TESTNET;
const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: OnChainEvent;
let signerEvent: OnChainEvent;
let storageEvent: OnChainEvent;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: custodySignerKey } });
  signerEvent = Factories.SignerOnChainEvent.build({ fid }, { transient: { signer: signerKey } });
  storageEvent = Factories.StorageRentOnChainEvent.build({ fid });
});

describe("SyncEnginePerfTest", () => {
  const makeMessagesWithTimeDelta = async (timeDeltas: number[]): Promise<CastAddMessage[]> => {
    return await Promise.all(
      timeDeltas.map(async (t) => {
        const farcasterTime = getFarcasterTime()._unsafeUnwrap();
        return Factories.CastAddMessage.create(
          { data: { fid, network, timestamp: farcasterTime + t } },
          { transient: { signer } },
        );
      }),
    );
  };

  test(
    "should not fetch all messages when snapshot contains non-existent prefix, streaming",
    async () => {
      const nowOrig = Date.now;

      const hub1 = new MockHub(testDb);
      const syncEngine1 = new SyncEngine(hub1, testDb);
      await syncEngine1.start();

      const hub2 = new MockHub(testDb2);
      const syncEngine2 = new SyncEngine(hub2, testDb2);
      await syncEngine2.start();

      try {
        await hub1.submitOnChainEvent(custodyEvent);
        await hub1.submitOnChainEvent(signerEvent);
        await hub1.submitOnChainEvent(storageEvent);
        await hub2.submitOnChainEvent(custodyEvent);
        await hub2.submitOnChainEvent(signerEvent);
        await hub2.submitOnChainEvent(storageEvent);

        Date.now = () => 1683074200000;
        // Merge the same messages into both engines.
        const messages = await makeMessagesWithTimeDelta([167, 169, 172]);
        for (const message of messages) {
          let res = await hub1.submitMessage(message);
          expect(res.isOk()).toBeTruthy();
          res = await hub2.submitMessage(message);
          expect(res.isOk()).toBeTruthy();
        }

        await sleepWhile(() => syncEngine2.syncTrieQSize > 0, SLEEPWHILE_TIMEOUT);
        await sleepWhile(() => syncEngine1.syncTrieQSize > 0, SLEEPWHILE_TIMEOUT);

        // Sanity check, they should equal
        expect(await syncEngine1.trie.rootHash()).toEqual(await syncEngine2.trie.rootHash());

        // A timestamp after all the messages
        Date.now = () => 1683074200000 + 200 * 1000;

        const snapshot2 = (await syncEngine2.getSnapshot())._unsafeUnwrap();
        expect(Buffer.from(snapshot2.prefix).toString("utf8")).toEqual("0073615");
        // Force a non-existent prefix (the original bug #536 is fixed)
        snapshot2.prefix = Buffer.from("00306622", "hex");

        let rpcClient = new MockRpcClient(hub2.engine, syncEngine2);
        await syncEngine1.performSync(
          "engine2",
          new FailoverStreamSyncClient(rpcClient as unknown as HubRpcClient, true),
        );
        expect(rpcClient.getAllSyncIdsByPrefixCalls.length).toEqual(0);
        expect(rpcClient.getAllMessagesBySyncIdsCalls.length).toEqual(0);

        // Sanity check, they should equal
        expect(await syncEngine1.trie.rootHash()).toEqual(await syncEngine2.trie.rootHash());

        // Even with a bad snapshot, we should still not call the sync APIs because the hashes match
        rpcClient = new MockRpcClient(hub2.engine, syncEngine2);
        await syncEngine1.performSync(
          "engine2",
          new FailoverStreamSyncClient(rpcClient as unknown as HubRpcClient, true),
        );
        expect(rpcClient.getAllSyncIdsByPrefixCalls.length).toEqual(0);
        expect(rpcClient.getAllMessagesBySyncIdsCalls.length).toEqual(0);
      } finally {
        Date.now = nowOrig;
        await syncEngine1?.stop();
        await syncEngine2?.stop();
      }
    },
    15 * 1000,
  );

  test(
    "should not fetch all messages when snapshot contains non-existent prefix, rpc",
    async () => {
      const nowOrig = Date.now;

      const hub1 = new MockHub(testDb);
      const syncEngine1 = new SyncEngine(hub1, testDb);
      await syncEngine1.start();

      const hub2 = new MockHub(testDb2);
      const syncEngine2 = new SyncEngine(hub2, testDb2);
      await syncEngine2.start();

      try {
        await hub1.submitOnChainEvent(custodyEvent);
        await hub1.submitOnChainEvent(signerEvent);
        await hub1.submitOnChainEvent(storageEvent);
        await hub2.submitOnChainEvent(custodyEvent);
        await hub2.submitOnChainEvent(signerEvent);
        await hub2.submitOnChainEvent(storageEvent);

        Date.now = () => 1683074200000;
        // Merge the same messages into both engines.
        const messages = await makeMessagesWithTimeDelta([167, 169, 172]);
        for (const message of messages) {
          let res = await hub1.submitMessage(message);
          expect(res.isOk()).toBeTruthy();
          res = await hub2.submitMessage(message);
          expect(res.isOk()).toBeTruthy();
        }

        await sleepWhile(() => syncEngine2.syncTrieQSize > 0, SLEEPWHILE_TIMEOUT);
        await sleepWhile(() => syncEngine1.syncTrieQSize > 0, SLEEPWHILE_TIMEOUT);

        // Sanity check, they should equal
        expect(await syncEngine1.trie.rootHash()).toEqual(await syncEngine2.trie.rootHash());

        // A timestamp after all the messages
        Date.now = () => 1683074200000 + 200 * 1000;

        const snapshot2 = (await syncEngine2.getSnapshot())._unsafeUnwrap();
        expect(Buffer.from(snapshot2.prefix).toString("utf8")).toEqual("0073615");
        // Force a non-existent prefix (the original bug #536 is fixed)
        snapshot2.prefix = Buffer.from("00306622", "hex");

        let rpcClient = new MockRpcClient(hub2.engine, syncEngine2);
        await syncEngine1.performSync(
          "engine2",
          new FailoverStreamSyncClient(rpcClient as unknown as HubRpcClient, false),
        );
        expect(rpcClient.getAllSyncIdsByPrefixCalls.length).toEqual(0);
        expect(rpcClient.getAllMessagesBySyncIdsCalls.length).toEqual(0);

        // Sanity check, they should equal
        expect(await syncEngine1.trie.rootHash()).toEqual(await syncEngine2.trie.rootHash());

        // Even with a bad snapshot, we should still not call the sync APIs because the hashes match
        rpcClient = new MockRpcClient(hub2.engine, syncEngine2);
        await syncEngine1.performSync(
          "engine2",
          new FailoverStreamSyncClient(rpcClient as unknown as HubRpcClient, false),
        );
        expect(rpcClient.getAllSyncIdsByPrefixCalls.length).toEqual(0);
        expect(rpcClient.getAllMessagesBySyncIdsCalls.length).toEqual(0);
      } finally {
        Date.now = nowOrig;
        await syncEngine1?.stop();
        await syncEngine2?.stop();
      }
    },
    15 * 1000,
  );
});
