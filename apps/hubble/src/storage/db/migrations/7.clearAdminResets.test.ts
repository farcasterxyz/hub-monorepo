import { performDbMigrations } from "./migrations.js";
import { jestRocksDB } from "../jestUtils.js";
import { MerkleTrie } from "../../../network/sync/merkleTrie.js";
import { SyncId } from "../../../network/sync/syncId.js";
import { Factories, HubError, OnChainEvent, SignerEventType } from "@farcaster/hub-nodejs";
import StoreEventHandler from "../../stores/storeEventHandler.js";
import OnChainEventStore from "../../stores/onChainEventStore.js";
import { getOnChainEvent } from "../onChainEvent.js";
import { ResultAsync } from "neverthrow";

const db = jestRocksDB("clearAdminResets.migration.test");

describe("clearAdminResets migration", () => {
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

  test("should delete admin reset signer events", async () => {
    const syncTrie = new MerkleTrie(db);
    await syncTrie.initialize();
    const store = new OnChainEventStore(db, new StoreEventHandler(db));

    const idRegistryEvent = Factories.IdRegistryOnChainEvent.build();
    const keyRegistryEvent = Factories.SignerOnChainEvent.build();
    const keyRegistryResetEvent = Factories.SignerOnChainEvent.build({
      signerEventBody: Factories.SignerEventBody.build({ eventType: SignerEventType.ADMIN_RESET }),
    });
    const storageRegistryEvent = Factories.StorageRentOnChainEvent.build();

    await addEvent(idRegistryEvent, store, syncTrie);
    await addEvent(keyRegistryEvent, store, syncTrie);
    await addEvent(keyRegistryResetEvent, store, syncTrie);
    await addEvent(storageRegistryEvent, store, syncTrie);
    await syncTrie.stop();

    const success = await performDbMigrations(db, 6, 7);
    expect(success).toBe(true);

    const uncachedSyncTrie = new MerkleTrie(db);
    await uncachedSyncTrie.initialize();

    // Admin reset is removed
    await expectExists(keyRegistryResetEvent, uncachedSyncTrie, false);
    // Rest are unaffected
    await expectExists(idRegistryEvent, uncachedSyncTrie, true);
    await expectExists(keyRegistryEvent, uncachedSyncTrie, true);
    await expectExists(storageRegistryEvent, uncachedSyncTrie, true);
  });
});
