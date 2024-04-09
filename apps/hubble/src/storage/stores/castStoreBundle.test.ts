import { CastAddMessage, CastRemoveMessage, Factories, getFarcasterTime, HubResult } from "@farcaster/hub-nodejs";
import { jestRocksDB } from "../db/jestUtils.js";
import { RootPrefix, UserPostfix } from "../db/types.js";
import CastStore from "./castStore.js";
import StoreEventHandler from "./storeEventHandler.js";
import { putOnChainEventTransaction } from "../db/onChainEvent.js";

const db = jestRocksDB("protobufs.castStoreBundle.test");
const eventHandler = new StoreEventHandler(db);
const store = new CastStore(db, eventHandler);
const fid = Factories.Fid.build();

const generateAddWithTimestamp = async (fid: number, timestamp: number): Promise<CastAddMessage> => {
  return Factories.CastAddMessage.create({
    data: { fid, timestamp },
  });
};

const generateRemoveWithTimestamp = async (
  fid: number,
  timestamp: number,
  target?: CastAddMessage,
): Promise<CastRemoveMessage> => {
  return Factories.CastRemoveMessage.create({
    data: { fid, timestamp, castRemoveBody: { targetHash: target ? target.hash : Factories.MessageHash.build() } },
  });
};

beforeAll(async () => {
  const rent = Factories.StorageRentOnChainEvent.build({ fid }, { transient: { units: 1 } });
  await db.commit(putOnChainEventTransaction(db.transaction(), rent));
});

beforeEach(async () => {
  await eventHandler.syncCache();
});

describe("Add Bundles", () => {
  test("Add 10 casts", async () => {
    const casts: CastAddMessage[] = [];
    for (let i = 0; i < 10; i++) {
      casts.push(await generateAddWithTimestamp(fid, i));
    }

    // Add all 10 casts
    const results = await store.mergeMessages(casts);
    // Expect exactly 10 casts to be added
    expect(results.size).toBe(10);
    for (let i = 0; i < 10; i++) {
      const eventId = results.get(i) as HubResult<number>;
      expect(eventId.isOk()).toBe(true);
      expect(eventId._unsafeUnwrap()).toBeGreaterThan(0);
    }

    // Expect all 10 to be in the DB
    let castAddMessages = 0;
    await db.forEachIteratorByPrefix(Buffer.from([RootPrefix.User]), (key) => {
      // Get the 6th byte, which is the set of the message
      const set = key[5];
      if (set === UserPostfix.CastMessage) {
        castAddMessages++;
      }
    });

    expect(castAddMessages).toBe(10);
  });

  test("Add invalid casts", async () => {
    const casts: CastAddMessage[] = [];
    for (let i = 0; i < 5; i++) {
      casts.push(await generateAddWithTimestamp(fid, i));
    }

    // Make the 2nd cast a duplicate of the first
    casts[1] = casts[0] as CastAddMessage;

    // Merge all of them
    const results = await store.mergeMessages(casts);
    expect(results.size).toBe(5);

    // The second one should have failed
    expect(results.get(1)?.isOk()).toBe(false);
    // While there should be 4 successful ones
    expect(results.get(0)?.isOk()).toBe(true);
    expect(results.get(2)?.isOk()).toBe(true);
    expect(results.get(3)?.isOk()).toBe(true);
    expect(results.get(4)?.isOk()).toBe(true);
  });

  test("Add-remove works", async () => {
    const time = getFarcasterTime()._unsafeUnwrap() - 10;
    const add1 = await generateAddWithTimestamp(fid, time + 1);
    const add2 = await generateAddWithTimestamp(fid, time + 2);
    const add3 = await generateAddWithTimestamp(fid, time + 3);
    const add4 = await generateAddWithTimestamp(fid, time + 4);
    const add5 = await generateAddWithTimestamp(fid, time + 5);

    const remove1 = await generateRemoveWithTimestamp(fid, time + 1, add1);
    const remove2 = await generateRemoveWithTimestamp(fid, time + 2, add2);
    const remove3 = await generateRemoveWithTimestamp(fid, time + 3, add3);
    const remove4 = await generateRemoveWithTimestamp(fid, time + 4, add4);
    const remove5 = await generateRemoveWithTimestamp(fid, time + 5, add5);

    // Merging the adds + removes should work (i.e, it should remove the adds earlier in the array)
    const results = await store.mergeMessages([add1, add2, add3, remove1, remove2]);
    expect(results.size).toBe(5);
    for (let i = 0; i < 5; i++) {
      expect(results.get(i)?.isOk()).toBe(true);
    }

    // add1 and add2 should be removed
    await expect(store.getCastAdd(fid, add1.hash)).rejects.toBeTruthy();
    await expect(store.getCastAdd(fid, add2.hash)).rejects.toBeTruthy();
    // add3 should still be there
    expect((await store.getCastAdd(fid, add3.hash)).hash).toEqual(add3.hash);

    // Merging removes before adds should make the adds fail
    const results2 = await store.mergeMessages([remove4, add4, add5]);
    expect(results2.size).toBe(3);
    expect(results2.get(0)?.isOk()).toBe(true);
    expect(results2.get(1)?.isOk()).toBe(false);
    expect(results2.get(2)?.isOk()).toBe(true);

    // add4 is missing, but add5 should be there
    await expect(store.getCastAdd(fid, add4.hash)).rejects.toBeTruthy();
    expect((await store.getCastAdd(fid, add5.hash)).hash).toEqual(add5.hash);

    // Merging all the removes should work
    const results3 = await store.mergeMessages([remove3, remove5]);
    expect(results3.size).toBe(2);
    expect(results3.get(0)?.isOk()).toBe(true);
    expect(results3.get(1)?.isOk()).toBe(true);

    // All adds should be gone
    await expect(store.getCastAdd(fid, add3.hash)).rejects.toBeTruthy();
    await expect(store.getCastAdd(fid, add5.hash)).rejects.toBeTruthy();
  });
});
