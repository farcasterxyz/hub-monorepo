import { jestRocksDB } from "../db/jestUtils.js";
import OnChainEventStore from "./onChainEventStore.js";
import StoreEventHandler from "./storeEventHandler.js";
import { Factories } from "@farcaster/hub-nodejs";

const db = jestRocksDB("protobufs.onChainEventStore.test");
const eventHandler = new StoreEventHandler(db);
const set = new OnChainEventStore(db, eventHandler);

describe("OnChainEventStore", () => {
  describe("mergeOnChainEvent", () => {
    test("should merge event", async () => {
      const onChainEvent = Factories.KeyRegistryOnChainEvent.build();
      await set.mergeOnChainEvent(onChainEvent);
    });

    test("does not merge duplicate events", async () => {});
  });

  describe("getOnChainEvents", () => {
    test("returns onchain events by type and fid", async () => {});
  });

  describe("events", () => {
    test("emits events on merge", async () => {});
  });
});
