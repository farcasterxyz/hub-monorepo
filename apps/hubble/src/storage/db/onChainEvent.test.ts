import { bytesCompare, Factories, OnChainEvent, OnChainEventType } from "@farcaster/hub-nodejs";
import { jestRocksDB } from "./jestUtils.js";
import {
  getManyOnChainEvents,
  getOnChainEvent,
  getOnChainEventByKey,
  makeOnChainEventPrimaryKey,
  putOnChainEventTransaction,
} from "./onChainEvent.js";

const db = jestRocksDB("storage.db.onChainEvent.test");
let onChainEvent: OnChainEvent;
let anotherEvent: OnChainEvent;

beforeEach(async () => {
  onChainEvent = Factories.SignerOnChainEvent.build();
  anotherEvent = Factories.IdRegistryOnChainEvent.build();
  let txn = db.transaction();
  txn = putOnChainEventTransaction(txn, onChainEvent);
  txn = putOnChainEventTransaction(txn, anotherEvent);
  await db.commit(txn);
});

describe("makeOnChainEventPrimaryKey", () => {
  test("orders keys by type, fid, block and log index", () => {
    const key1 = makeOnChainEventPrimaryKey(OnChainEventType.EVENT_TYPE_SIGNER, 100, 1, 1);
    const key2 = makeOnChainEventPrimaryKey(OnChainEventType.EVENT_TYPE_SIGNER, 100, 1, 2);
    const key3 = makeOnChainEventPrimaryKey(OnChainEventType.EVENT_TYPE_SIGNER, 101, 200, 10);
    const key4 = makeOnChainEventPrimaryKey(OnChainEventType.EVENT_TYPE_SIGNER, 101, 202, 1);
    const key5 = makeOnChainEventPrimaryKey(OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED, 0, 500, 23);
    expect(bytesCompare(key1, key2)).toEqual(-1);
    expect(bytesCompare(key2, key3)).toEqual(-1);
    expect(bytesCompare(key3, key4)).toEqual(-1);
    expect(bytesCompare(key4, key5)).toEqual(-1);
  });
});

describe("putOnChainEvent", () => {
  test("succeeds", async () => {
    const onChainEvent = Factories.SignerOnChainEvent.build();
    const txn = db.transaction();
    putOnChainEventTransaction(txn, onChainEvent);
    await db.commit(txn);
    await expect(
      getOnChainEvent(db, onChainEvent.type, onChainEvent.fid, onChainEvent.blockNumber, onChainEvent.logIndex),
    ).resolves.toEqual(onChainEvent);
  });
});

describe("getOnChainEvent", () => {
  test("succeeds", async () => {
    await expect(
      getOnChainEvent(db, onChainEvent.type, onChainEvent.fid, onChainEvent.blockNumber, onChainEvent.logIndex),
    ).resolves.toEqual(onChainEvent);
  });
});
describe("getOnChainEventByKey", () => {
  test("succeeds", async () => {
    await expect(
      getOnChainEventByKey(
        db,
        makeOnChainEventPrimaryKey(
          onChainEvent.type,
          onChainEvent.fid,
          onChainEvent.blockNumber,
          onChainEvent.logIndex,
        ),
      ),
    ).resolves.toEqual(onChainEvent);
  });
});
describe("getManyOnChainEvents", () => {
  test("succeeds", async () => {
    const key1 = makeOnChainEventPrimaryKey(
      anotherEvent.type,
      anotherEvent.fid,
      anotherEvent.blockNumber,
      anotherEvent.logIndex,
    );
    const key2 = makeOnChainEventPrimaryKey(
      onChainEvent.type,
      onChainEvent.fid,
      onChainEvent.blockNumber,
      onChainEvent.logIndex,
    );
    await expect(getManyOnChainEvents(db, [key1, key2])).resolves.toEqual([anotherEvent, onChainEvent]);
  });
});
