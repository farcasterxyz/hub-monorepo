import { bytesCompare, Factories, RentRegistryEvent } from "@farcaster/hub-nodejs";
import { jestRocksDB } from "./jestUtils.js";
import {
  getNextRentRegistryEventFromIterator,
  getRentRegistryEventsIterator,
  makeRentRegistryEventPrimaryKey,
  putRentRegistryEvent,
} from "./storageRegistryEvent.js";

const db = jestRocksDB("storage.db.storageRegistryEvent.test");
const ethAccount = Factories.EthAddress.build();
let rentRegistryEvent: RentRegistryEvent;

beforeAll(async () => {
  rentRegistryEvent = Factories.RentRegistryEvent.build({ payer: ethAccount, fid: 1, expiry: 1 });
});

describe("makeRentRegistryEventPrimaryKey", () => {
  test("orders keys by fid", () => {
    const key1 = makeRentRegistryEventPrimaryKey(1_000, 1_000);
    const key2 = makeRentRegistryEventPrimaryKey(1_001, 1_001);
    const key3 = makeRentRegistryEventPrimaryKey(1_000_000, 1_002);
    expect(bytesCompare(key1, key2)).toEqual(-1);
    expect(bytesCompare(key2, key3)).toEqual(-1);
  });
});

describe("putRentRegistryEvent", () => {
  test("succeeds", async () => {
    await expect(putRentRegistryEvent(db, rentRegistryEvent)).resolves.toEqual(undefined);
    await expect(
      getNextRentRegistryEventFromIterator(getRentRegistryEventsIterator(db, rentRegistryEvent.fid)),
    ).resolves.toEqual(rentRegistryEvent);
  });
});

describe("getRentRegistryEventsIterator", () => {
  test("succeeds when event exists", async () => {
    await expect(putRentRegistryEvent(db, rentRegistryEvent)).resolves.toEqual(undefined);
    await expect(
      getNextRentRegistryEventFromIterator(getRentRegistryEventsIterator(db, rentRegistryEvent.fid)),
    ).resolves.toEqual(rentRegistryEvent);
  });

  test("fails when event not found", async () => {
    await expect(
      getNextRentRegistryEventFromIterator(getRentRegistryEventsIterator(db, rentRegistryEvent.fid)),
    ).resolves.toBeUndefined();
  });
});
