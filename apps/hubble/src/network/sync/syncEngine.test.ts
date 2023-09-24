import {
  FarcasterNetwork,
  Factories,
  getFarcasterTime,
  HubRpcClient,
  MessageType,
  Message,
  ReactionType,
  TrieNodeMetadataResponse,
  bytesToHexString,
  utf8StringToBytes,
  UserNameType,
  toFarcasterTime,
  OnChainEvent,
} from "@farcaster/hub-nodejs";
import { ok } from "neverthrow";
import { anything, instance, mock, when } from "ts-mockito";
import SyncEngine from "./syncEngine.js";
import { SyncId } from "./syncId.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import Engine from "../../storage/engine/index.js";
import { sleepWhile } from "../../utils/crypto.js";
import { NetworkFactories } from "../../network/utils/factories.js";
import { HubInterface } from "../../hubble.js";
import { MockHub } from "../../test/mocks.js";
import { jest } from "@jest/globals";
import { publicClient } from "../../test/utils.js";
import { IdRegisterOnChainEvent } from "@farcaster/core";

const TEST_TIMEOUT_SHORT = 60 * 1000;
const SLEEPWHILE_TIMEOUT = 10 * 1000;

const testDb = jestRocksDB("engine.syncEngine.test");
const testDb2 = jestRocksDB("engine2.syncEngine.test");

const network = FarcasterNetwork.TESTNET;
const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: IdRegisterOnChainEvent;
let signerEvent: OnChainEvent;
let storageEvent: OnChainEvent;
let castAdd: Message;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: custodySignerKey } });
  signerEvent = Factories.SignerOnChainEvent.build({ fid }, { transient: { signer: signerKey } });
  storageEvent = Factories.StorageRentOnChainEvent.build({ fid });
  castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
});

describe("SyncEngine", () => {
  jest.setTimeout(TEST_TIMEOUT_SHORT);

  let syncEngine: SyncEngine;
  let hub: HubInterface;
  let engine: Engine;

  beforeEach(async () => {
    engine = new Engine(testDb, FarcasterNetwork.TESTNET, undefined, publicClient);
    hub = new MockHub(testDb, engine);
    syncEngine = new SyncEngine(hub, testDb);
  }, TEST_TIMEOUT_SHORT);

  afterEach(async () => {
    await syncEngine.stop();
    await engine.stop();
  }, TEST_TIMEOUT_SHORT);

  const addMessagesWithTimestamps = async (timeDelta: number[]) => {
    const results = await Promise.all(
      timeDelta.map(async (t) => {
        const farcasterTime = getFarcasterTime()._unsafeUnwrap();
        const cast = await Factories.CastAddMessage.create(
          { data: { fid, network, timestamp: farcasterTime + t } },
          { transient: { signer } },
        );

        const result = await engine.mergeMessage(cast);
        expect(result.isOk()).toBeTruthy();
        return Promise.resolve(cast);
      }),
    );

    await sleepWhile(() => syncEngine.syncTrieQSize > 0, SLEEPWHILE_TIMEOUT);
    await syncEngine.trie.commitToDb();
    return results;
  };

  test("trie is updated on successful merge", async () => {
    const existingItems = await syncEngine.trie.items();

    const rcustody = await engine.mergeOnChainEvent(custodyEvent);
    expect(rcustody.isOk()).toBeTruthy();

    const rsigneradd = await engine.mergeOnChainEvent(signerEvent);
    expect(rsigneradd.isOk()).toBeTruthy();

    const rstorage = await engine.mergeOnChainEvent(storageEvent);
    expect(rstorage.isOk()).toBeTruthy();

    const result = await engine.mergeMessage(castAdd);
    expect(result.isOk()).toBeTruthy();

    // Wait for the trie to be updated
    await sleepWhile(() => syncEngine.syncTrieQSize > 0, SLEEPWHILE_TIMEOUT);

    // Two messages (signerEvent + castAdd) was added to the trie
    expect((await syncEngine.trie.items()) - existingItems).toEqual(1);
    expect(await syncEngine.trie.exists(SyncId.fromMessage(castAdd))).toBeTruthy();
  });

  test("trie is not updated on merge failure", async () => {
    expect(await syncEngine.trie.items()).toEqual(0);

    // Merging a message without the custody event should fail
    const result = await engine.mergeMessage(castAdd);

    expect(result.isErr()).toBeTruthy();

    // Wait for the trie to be updated
    await sleepWhile(() => syncEngine.syncTrieQSize > 0, SLEEPWHILE_TIMEOUT);

    expect(await syncEngine.trie.items()).toEqual(0);
    expect(await syncEngine.trie.exists(SyncId.fromMessage(castAdd))).toBeFalsy();
  });

  test("trie is updated when a message is removed", async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);

    let result = await engine.mergeMessage(castAdd);

    expect(result.isOk()).toBeTruthy();

    // Remove this cast.
    const castRemove = await Factories.CastRemoveMessage.create(
      { data: { fid, network, castRemoveBody: { targetHash: castAdd.hash } } },
      { transient: { signer } },
    );

    // Merging the cast remove deletes the cast add in the db, and it should be reflected in the trie
    result = await engine.mergeMessage(castRemove);
    expect(result.isOk()).toBeTruthy();

    // Wait for the trie to be updated
    await sleepWhile(() => syncEngine.syncTrieQSize > 0, SLEEPWHILE_TIMEOUT);

    const id = SyncId.fromMessage(castRemove);
    expect(await syncEngine.trie.exists(id)).toBeTruthy();

    const allMessages = await syncEngine.getAllMessagesBySyncIds([id]);
    expect(allMessages.isOk()).toBeTruthy();
    expect(allMessages._unsafeUnwrap()[0]?.data?.type).toEqual(MessageType.CAST_REMOVE);

    // The trie should contain the message remove
    expect(await syncEngine.trie.exists(id)).toBeTruthy();

    // The trie should not contain the castAdd anymore
    expect(await syncEngine.trie.exists(SyncId.fromMessage(castAdd))).toBeFalsy();
  });

  test("trie is updated for username proof messages", async () => {
    const custodyAddress = bytesToHexString(custodyEvent.idRegisterEventBody.to)._unsafeUnwrap();
    jest.spyOn(publicClient, "getEnsAddress").mockImplementation(() => {
      return Promise.resolve(custodyAddress);
    });
    const timestampSec = Math.floor(Date.now() / 1000);
    const proof = await Factories.UsernameProofMessage.create(
      {
        data: {
          fid,
          usernameProofBody: Factories.UserNameProof.build({
            name: utf8StringToBytes("test.eth")._unsafeUnwrap(),
            fid,
            owner: custodyEvent.idRegisterEventBody.to,
            timestamp: timestampSec,
            type: UserNameType.USERNAME_TYPE_ENS_L1,
          }),
          timestamp: toFarcasterTime(timestampSec * 1000)._unsafeUnwrap(),
          type: MessageType.USERNAME_PROOF,
        },
      },
      { transient: { signer } },
    );

    const existingItems = await syncEngine.trie.items();
    expect(existingItems).toEqual(0);

    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
    expect((await engine.mergeMessage(proof)).isOk()).toBeTruthy();

    await sleepWhile(() => syncEngine.syncTrieQSize > 0, SLEEPWHILE_TIMEOUT);

    // SignerAdd and Username proof is added to the trie
    expect((await syncEngine.trie.items()) - existingItems).toEqual(1);
    expect(await syncEngine.trie.exists(SyncId.fromMessage(proof))).toBeTruthy();
  });

  test("getAllMessages returns empty with invalid syncId", async () => {
    expect(await syncEngine.trie.items()).toEqual(0);
    const result = await syncEngine.getAllMessagesBySyncIds([SyncId.fromMessage(castAdd)]);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()[0]?.data).toBeUndefined();
    expect(result._unsafeUnwrap()[0]?.hash.length).toEqual(0);
  });

  test("trie is updated when message with higher order is merged", async () => {
    const rcustody = await engine.mergeOnChainEvent(custodyEvent);
    expect(rcustody.isOk()).toBeTruthy();

    const rsigneradd = await engine.mergeOnChainEvent(signerEvent);
    expect(rsigneradd.isOk()).toBeTruthy();

    const rstorage = await engine.mergeOnChainEvent(storageEvent);
    expect(rstorage.isOk()).toBeTruthy();

    const currentTime = getFarcasterTime()._unsafeUnwrap();

    // Reaction
    const reactionBody = {
      targetCastId: { fid, hash: castAdd.hash },
      type: ReactionType.LIKE,
    };
    const reaction1 = await Factories.ReactionAddMessage.create(
      { data: { fid, network, timestamp: currentTime + 10, reactionBody } },
      { transient: { signer } },
    );

    // Same reaction, but with different timestamp
    const reaction2 = await Factories.ReactionAddMessage.create(
      { data: { fid, network, timestamp: currentTime + 15, reactionBody } },
      { transient: { signer } },
    );

    // Merging the first reaction should succeed
    let result = await engine.mergeMessage(reaction1);
    expect(result.isOk()).toBeTruthy();

    // Wait for the trie to be updated
    await sleepWhile(() => syncEngine.syncTrieQSize > 0, SLEEPWHILE_TIMEOUT);
    expect(await syncEngine.trie.items()).toEqual(1); // reaction1

    // Then merging the second reaction should also succeed and remove reaction1
    result = await engine.mergeMessage(reaction2);
    expect(result.isOk()).toBeTruthy();

    // Wait for the trie to be updated
    await sleepWhile(() => syncEngine.syncTrieQSize > 0, SLEEPWHILE_TIMEOUT);
    expect(await syncEngine.trie.items()).toEqual(1); // reaction2 (reaction1 is removed)

    // Create a new engine and sync engine
    testDb2.clear();
    const engine2 = new Engine(testDb2, FarcasterNetwork.TESTNET);
    const hub2 = new MockHub(testDb2, engine2);
    const syncEngine2 = new SyncEngine(hub2, testDb2);
    await engine2.mergeOnChainEvent(custodyEvent);
    await engine2.mergeOnChainEvent(signerEvent);
    await engine2.mergeOnChainEvent(storageEvent);

    // Only merge reaction2
    result = await engine2.mergeMessage(reaction2);
    expect(result.isOk()).toBeTruthy();

    // Wait for the trie to be updated
    await sleepWhile(() => syncEngine.syncTrieQSize > 0, SLEEPWHILE_TIMEOUT);
    expect(await syncEngine2.trie.items()).toEqual(1); //reaction2

    // Roothashes must match
    expect(await syncEngine2.trie.rootHash()).toEqual(await syncEngine.trie.rootHash());

    await syncEngine2.stop();
    await engine2.stop();
  });

  test("snapshotTimestampPrefix trims the seconds", async () => {
    const nowInSeconds = getFarcasterTime()._unsafeUnwrap();
    const snapshotTimestamp = syncEngine.snapshotTimestamp._unsafeUnwrap();
    expect(snapshotTimestamp).toBeLessThanOrEqual(nowInSeconds);
    expect(snapshotTimestamp).toEqual(Math.floor(nowInSeconds / 10) * 10);
  });

  test("syncStatus.shouldSync is false when already syncing", async () => {
    const mockRPCClient = mock<HubRpcClient>();
    const rpcClient = instance(mockRPCClient);
    let called = false;
    when(mockRPCClient.getSyncMetadataByPrefix(anything(), anything(), anything())).thenCall(async () => {
      const shouldSync = await syncEngine.syncStatus("test", {
        prefix: new Uint8Array(),
        numMessages: 10,
        excludedHashes: [],
      });
      expect(shouldSync.isOk()).toBeTruthy();
      expect(shouldSync._unsafeUnwrap().isSyncing).toBeTruthy();
      expect(shouldSync._unsafeUnwrap().shouldSync).toBeFalsy();
      called = true;

      // Return an empty child map so sync will finish with a noop
      const emptyMetadata = TrieNodeMetadataResponse.create({
        prefix: new Uint8Array(),
        numMessages: 1000,
        hash: "",
        children: [],
      });
      return Promise.resolve(ok(emptyMetadata));
    });
    await syncEngine.performSync(
      "test",
      {
        prefix: new Uint8Array(),
        numMessages: 10,
        excludedHashes: ["some-divergence"],
      },
      rpcClient,
    );
    expect(called).toBeTruthy();
  });

  test("syncStatus returns their snapshot and our snapshot when not syncing", async () => {
    const theirSnapshot = (await syncEngine.getSnapshot())._unsafeUnwrap();
    const syncStatus = await syncEngine.syncStatus("test", theirSnapshot);
    expect(syncStatus.isOk()).toBeTruthy();
    expect(syncStatus._unsafeUnwrap().isSyncing).toBeFalsy();
    expect(syncStatus._unsafeUnwrap().theirSnapshot).toEqual(theirSnapshot);
    expect(syncStatus._unsafeUnwrap().ourSnapshot).toBeTruthy();
  });

  test("syncStatus.shouldSync is false when excludedHashes match", async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);

    await addMessagesWithTimestamps([167, 169, 172]);
    expect(
      (await syncEngine.syncStatus("test", (await syncEngine.getSnapshot())._unsafeUnwrap()))._unsafeUnwrap()
        .shouldSync,
    ).toBeFalsy();
  });

  test("syncStatus.shouldSync is true when hashes dont match", async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);

    await addMessagesWithTimestamps([167, 169, 172]);
    const oldSnapshot = (await syncEngine.getSnapshot())._unsafeUnwrap();
    await addMessagesWithTimestamps([372]);
    expect(oldSnapshot.excludedHashes).not.toEqual((await syncEngine.getSnapshot())._unsafeUnwrap().excludedHashes);
    expect((await syncEngine.syncStatus("test", oldSnapshot))._unsafeUnwrap().shouldSync).toBeTruthy();
  });

  test("syncStatus.shouldSync is false if we didnt merge any messages successfully recently", async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
    const mockRPCClient = mock<HubRpcClient>();
    const rpcClient = instance(mockRPCClient);

    const oldSnapshot = (await syncEngine.getSnapshot())._unsafeUnwrap();
    const result = await syncEngine.mergeMessages([castAdd], rpcClient);
    expect(result.successCount).toEqual(1);

    // Should sync should return true becuase the excluded hashes don't match
    expect(oldSnapshot.excludedHashes).not.toEqual((await syncEngine.getSnapshot())._unsafeUnwrap().excludedHashes);
    expect((await syncEngine.syncStatus("test", oldSnapshot))._unsafeUnwrap().shouldSync).toBeTruthy();

    const failedResult = await syncEngine.mergeMessages([castAdd], rpcClient);
    expect(failedResult.successCount).toEqual(0);
    expect(failedResult.errCount).toEqual(1);

    // Should sync should return false because we failed to merge any messages
    expect((await syncEngine.syncStatus("test", oldSnapshot))._unsafeUnwrap().shouldSync).toBeTruthy();

    // shouldSync should be true for the same snapshot with a different peerId
    expect((await syncEngine.syncStatus("new_peer", oldSnapshot))._unsafeUnwrap().shouldSync).toBeTruthy();
  });

  test("getSyncStats is correct", async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeUserNameProof(Factories.UserNameProof.build());
    await engine.mergeUserNameProof(Factories.UserNameProof.build());
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);
    await addMessagesWithTimestamps([167, 169, 170]);

    const stats = await syncEngine.getDbStats();
    expect(stats.numFids).toEqual(1);
    expect(stats.numFnames).toEqual(2);
    expect(stats.numMessages).toEqual(3);
  });

  test("initialize populates the trie with all existing messages", async () => {
    await engine.mergeOnChainEvent(custodyEvent);
    await engine.mergeOnChainEvent(signerEvent);
    await engine.mergeOnChainEvent(storageEvent);

    const messages = await addMessagesWithTimestamps([167, 169, 172]);

    expect(await syncEngine.trie.items()).toEqual(3); // 3 messages

    const syncEngine2 = new SyncEngine(hub, testDb);
    await syncEngine2.start();

    // Make sure all messages exist
    expect(await syncEngine2.trie.items()).toEqual(3);
    expect(await syncEngine2.trie.rootHash()).toEqual(await syncEngine.trie.rootHash());
    expect(await syncEngine2.trie.exists(SyncId.fromMessage(messages[0] as Message))).toBeTruthy();
    expect(await syncEngine2.trie.exists(SyncId.fromMessage(messages[1] as Message))).toBeTruthy();
    expect(await syncEngine2.trie.exists(SyncId.fromMessage(messages[2] as Message))).toBeTruthy();

    await syncEngine2.stop();
  });

  test(
    "Rebuild trie from engine messages",
    async () => {
      await engine.mergeOnChainEvent(custodyEvent);
      await engine.mergeOnChainEvent(signerEvent);
      await engine.mergeOnChainEvent(storageEvent);

      const messages = await addMessagesWithTimestamps([167, 169, 172]);

      expect(await syncEngine.trie.items()).toEqual(3); // 3 messages

      const syncEngine2 = new SyncEngine(hub, testDb);
      await syncEngine2.start(true); // Rebuild from engine messages

      // Make sure all messages exist
      expect(await syncEngine2.trie.items()).toEqual(3);
      expect(await syncEngine2.trie.rootHash()).toEqual(await syncEngine.trie.rootHash());
      expect(await syncEngine2.trie.exists(SyncId.fromMessage(messages[0] as Message))).toBeTruthy();
      expect(await syncEngine2.trie.exists(SyncId.fromMessage(messages[1] as Message))).toBeTruthy();
      expect(await syncEngine2.trie.exists(SyncId.fromMessage(messages[2] as Message))).toBeTruthy();

      await syncEngine2.stop();
    },
    TEST_TIMEOUT_SHORT,
  );

  test(
    "getSnapshot should use a prefix of 10-seconds resolution timestamp",
    async () => {
      await engine.mergeOnChainEvent(custodyEvent);
      await engine.mergeOnChainEvent(signerEvent);
      await engine.mergeOnChainEvent(storageEvent);

      const nowOrig = Date.now;
      Date.now = () => 1683074200000;
      try {
        await addMessagesWithTimestamps([160, 169, 172]);
        Date.now = () => 1683074200000 + 167 * 1000;
        const result = await syncEngine.getSnapshot();
        const snapshot = result._unsafeUnwrap();
        expect(Buffer.from(snapshot.prefix).toString("utf8")).toEqual("0073615160");
      } finally {
        Date.now = nowOrig;
      }
    },
    TEST_TIMEOUT_SHORT,
  );

  describe("getDivergencePrefix", () => {
    const trieWithIds = async (timestamps: number[]) => {
      const syncIds = await Promise.all(
        timestamps.map(async (t) => {
          return await NetworkFactories.SyncId.create(undefined, { transient: { date: new Date(t * 1000) } });
        }),
      );

      await Promise.all(syncIds.map((id) => syncEngine.trie.insert(id)));
      await syncEngine.trie.commitToDb();
    };

    test("returns the prefix with the most common excluded hashes", async () => {
      await trieWithIds([1665182332, 1665182343, 1665182345]);

      const trie = syncEngine.trie;

      const prefixToTest = new Uint8Array(Buffer.from("1665182343"));
      const oldSnapshot = await trie.getSnapshot(prefixToTest);
      trie.insert(await NetworkFactories.SyncId.create(undefined, { transient: { date: new Date(1665182353000) } }));

      // Since message above was added at 1665182353, the two tries diverged at 16651823 for our prefix
      let divergencePrefix = await syncEngine.getDivergencePrefix(
        await trie.getSnapshot(prefixToTest),
        oldSnapshot.excludedHashes,
      );
      expect(divergencePrefix).toEqual(new Uint8Array(Buffer.from("16651823")));

      // divergence prefix should be the full prefix, if snapshots are the same
      const currentSnapshot = await trie.getSnapshot(prefixToTest);
      divergencePrefix = await syncEngine.getDivergencePrefix(
        await trie.getSnapshot(prefixToTest),
        currentSnapshot.excludedHashes,
      );
      expect(divergencePrefix).toEqual(prefixToTest);

      // divergence prefix should empty if excluded hashes are empty
      divergencePrefix = await syncEngine.getDivergencePrefix(await trie.getSnapshot(prefixToTest), []);
      expect(divergencePrefix.length).toEqual(0);

      // divergence prefix should be our prefix if provided hashes are longer
      const with5 = Buffer.concat([prefixToTest, new Uint8Array(Buffer.from("5"))]);
      divergencePrefix = await syncEngine.getDivergencePrefix(await trie.getSnapshot(with5), [
        ...currentSnapshot.excludedHashes,
        "different",
      ]);
      expect(divergencePrefix).toEqual(prefixToTest);
    });
  });

  describe("compactDbIfRequired", () => {
    test("does not compact if under the threshold", async () => {
      expect(syncEngine.shouldCompactDb).toBeFalsy();
      expect(await syncEngine.compactDbIfRequired(1000)).toBeFalsy();
      expect(syncEngine.shouldCompactDb).toBeFalsy();
    });

    test("compacts the db if over the threshold", async () => {
      expect(syncEngine.shouldCompactDb).toBeFalsy();
      expect(await syncEngine.compactDbIfRequired(1_000_000)).toBeTruthy();
      expect(syncEngine.shouldCompactDb).toBeFalsy();
    });
  });
});
