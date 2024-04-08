import { performDbMigrations } from "./migrations.js";
import { Factories } from "@farcaster/hub-nodejs";
import { jestRocksDB } from "../jestUtils.js";
import OnChainEventStore from "../../stores/onChainEventStore.js";
import StoreEventHandler from "../../stores/storeEventHandler.js";
import * as process from "process";

const db = jestRocksDB("clearEvents.migration.test");

describe("clearEvents migration", () => {
  test("should clear all events", async () => {
    const event1 = Factories.IdRegistryOnChainEvent.build();
    const event2 = Factories.StorageRentOnChainEvent.build();
    const event3 = Factories.SignerOnChainEvent.build();
    const store = new OnChainEventStore(db, new StoreEventHandler(db));
    await expect(store.mergeOnChainEvent(event1)).resolves.toBeTruthy();
    await expect(store.mergeOnChainEvent(event2)).resolves.toBeTruthy();
    await expect(store.mergeOnChainEvent(event3)).resolves.toBeTruthy();

    await expect(store.getIdRegisterEventByFid(event1.fid)).resolves.toEqual(event1);

    const success = await performDbMigrations(db, 2, 3);
    expect(success).toBe(true);
    store.clearCaches();

    await expect(store.getIdRegisterEventByFid(event1.fid)).rejects.toThrow("NotFound");
  });

  test("does not clear events if skip env var is set", async () => {
    try {
      process.env["SKIP_CLEAR_EVENTS"] = "true";
      const event = Factories.IdRegistryOnChainEvent.build();
      const store = new OnChainEventStore(db, new StoreEventHandler(db));
      await expect(store.mergeOnChainEvent(event)).resolves.toBeTruthy();

      await expect(store.getIdRegisterEventByFid(event.fid)).resolves.toEqual(event);

      const success = await performDbMigrations(db, 2, 3);
      expect(success).toBe(true);
      store.clearCaches();

      await expect(store.getIdRegisterEventByFid(event.fid)).resolves.toEqual(event);
    } finally {
      process.env["SKIP_CLEAR_EVENTS"] = undefined;
    }
  });
});
