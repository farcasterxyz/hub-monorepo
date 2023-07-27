import { bytesCompare, Factories, OnChainEventType } from "@farcaster/hub-nodejs";
import { jestRocksDB } from "./jestUtils.js";
import { getManyOnChainEvents, makeOnChainEventPrimaryKey, putOnChainEventTransaction } from "./onChainEvent.js";

const db = jestRocksDB("storage.db.onChainEvent.test");

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
    const onChainEvent = Factories.KeyRegistryOnChainEvent.build();
    const txn = db.transaction();
    putOnChainEventTransaction(txn, onChainEvent);
    await db.commit(txn);
    await expect(
      getManyOnChainEvents(db, [
        makeOnChainEventPrimaryKey(
          onChainEvent.type,
          onChainEvent.fid,
          onChainEvent.blockNumber,
          onChainEvent.logIndex,
        ),
      ]),
    ).resolves.toEqual([onChainEvent]);
  });
});
