import { jestRocksDB } from "../db/jestUtils.js";
import OnChainEventStore from "./onChainEventStore.js";
import StoreEventHandler from "./storeEventHandler.js";
import { Factories, OnChainEventType } from "@farcaster/hub-nodejs";
import { ok } from "neverthrow";

const db = jestRocksDB("protobufs.onChainEventStore.test");
const eventHandler = new StoreEventHandler(db);
const set = new OnChainEventStore(db, eventHandler);

describe("OnChainEventStore", () => {
  describe("mergeOnChainEvent", () => {
    test("should merge event", async () => {
      const onChainEvent = Factories.KeyRegistryOnChainEvent.build();
      await set.mergeOnChainEvent(onChainEvent);
      expect(await set.getOnChainEvents(OnChainEventType.EVENT_TYPE_SIGNER, onChainEvent.fid)).toEqual([onChainEvent]);
    });

    test("does not merge duplicate events", async () => {
      const onChainEvent = Factories.KeyRegistryOnChainEvent.build();
      await set.mergeOnChainEvent(onChainEvent);
      await expect(set.mergeOnChainEvent(onChainEvent)).rejects.toThrow("already exists");
    });
  });

  describe("isSignerMigrated", () => {
    test("returns true if signer migrated", async () => {
      const signerMigratedEvent = Factories.OnChainEvent.build({
        type: OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED,
        fid: 0,
      });
      await set.mergeOnChainEvent(signerMigratedEvent);
      const result = await set.isSignerMigrated();
      expect(result).toEqual(ok(true));
    });

    test("returns false if not migrated", async () => {
      const result = await set.isSignerMigrated();
      expect(result).toEqual(ok(false));
    });
  });

  describe("getOnChainEvents", () => {
    test("returns onchain events by type and fid", async () => {});
  });

  describe("events", () => {
    test("emits events on merge", async () => {});
  });
});
