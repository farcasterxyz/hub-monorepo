import { jestRocksDB } from "../db/jestUtils.js";
import OnChainEventStore from "./onChainEventStore.js";
import StoreEventHandler from "./storeEventHandler.js";

const db = jestRocksDB("protobufs.storageEventStore.test");
const eventHandler = new StoreEventHandler(db);
const set = new OnChainEventStore(db, eventHandler);

beforeAll(async () => {
  set;
});

beforeEach(async () => {
  await eventHandler.syncCache();
});
