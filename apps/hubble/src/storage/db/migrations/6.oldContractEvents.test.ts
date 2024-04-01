import { performDbMigrations } from "./migrations.js";
import { jestRocksDB } from "../jestUtils.js";
import { MerkleTrie } from "../../../network/sync/merkleTrie.js";
import { SyncId } from "../../../network/sync/syncId.js";
import { Factories, HubError, OnChainEvent } from "@farcaster/hub-nodejs";
import StoreEventHandler from "../../stores/storeEventHandler.js";
import OnChainEventStore from "../../stores/onChainEventStore.js";
import { getOnChainEvent } from "../onChainEvent.js";
import { ResultAsync } from "neverthrow";

const db = jestRocksDB("oldContractEvents.migration.test");

describe("oldContractEvents migration", () => {
  const addEvent = async function (event: OnChainEvent, store: OnChainEventStore, trie: MerkleTrie) {
    await expect(store.mergeOnChainEvent(event)).resolves.toBeTruthy();
    const syncId = SyncId.fromOnChainEvent(event);
    await trie.insert(syncId);

    await expectExists(event, trie, true);
  };

  const expectExists = async function (event: OnChainEvent, trie: MerkleTrie, shouldExist: boolean) {
    const dbResult = await ResultAsync.fromPromise(
      getOnChainEvent(db, event.type, event.fid, event.blockNumber, event.logIndex),
      (e) => e as HubError,
    );
    expect(dbResult.isOk()).toBe(shouldExist);
    const syncId = SyncId.fromOnChainEvent(event);
    expect(await trie.exists(syncId)).toBe(shouldExist);
  };

  test("should delete version 0 id and key registry events", async () => {
    const syncTrie = new MerkleTrie(db);
    await syncTrie.initialize();
    const store = new OnChainEventStore(db, new StoreEventHandler(db));

    const idRegistryV0Event = Factories.IdRegistryOnChainEvent.build();
    const idRegistryV2Event = Factories.IdRegistryOnChainEvent.build({ version: 2 });
    const keyRegistryV0Event = Factories.SignerOnChainEvent.build();
    const keyRegistryV2Event = Factories.SignerOnChainEvent.build({ version: 2 });
    const storageRegistryV0Event = Factories.StorageRentOnChainEvent.build();

    await addEvent(idRegistryV0Event, store, syncTrie);
    await addEvent(idRegistryV2Event, store, syncTrie);
    await addEvent(keyRegistryV0Event, store, syncTrie);
    await addEvent(keyRegistryV2Event, store, syncTrie);
    await addEvent(storageRegistryV0Event, store, syncTrie);
    await syncTrie.stop();

    const success = await performDbMigrations(db, 5, 6);
    expect(success).toBe(true);

    const uncachedSyncTrie = new MerkleTrie(db);
    await uncachedSyncTrie.initialize();
    await expectExists(idRegistryV0Event, uncachedSyncTrie, false);
    await expectExists(idRegistryV2Event, uncachedSyncTrie, true);
    await expectExists(keyRegistryV0Event, uncachedSyncTrie, false);
    await expectExists(keyRegistryV2Event, uncachedSyncTrie, true);
    await expectExists(storageRegistryV0Event, uncachedSyncTrie, true);
  });
});
