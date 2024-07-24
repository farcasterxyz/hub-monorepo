import { ok } from "neverthrow";
import { Factories, HubEvent, HubEventType, getFarcasterTime } from "@farcaster/hub-nodejs";
import { jestRocksDB } from "../db/jestUtils.js";
import { makeTsHash, putMessage } from "../db/message.js";
import { UserPostfix } from "../db/types.js";
import { StorageCache } from "./storageCache.js";
import { putOnChainEventTransaction } from "../db/onChainEvent.js";
import { sleep } from "../../utils/crypto.js";
import CastStore from "./castStore.js";
import StoreEventHandler from "./storeEventHandler.js";
import OnChainEventStore from "./onChainEventStore.js";
import ReactionStore from "./reactionStore.js";

const db = jestRocksDB("engine.storageCache.test");

let cache: StorageCache;

beforeEach(() => {
  cache = new StorageCache(db);
});

describe("syncFromDb", () => {
  test("populates cache with messages from db", async () => {
    const usage = [
      {
        fid: Factories.Fid.build(),
        usage: { cast: 3, reaction: 2, verification: 4, userData: 1, storage: 2 },
      },
      {
        fid: Factories.Fid.build(),
        usage: { cast: 2, reaction: 3, verification: 0, userData: 2, storage: 2 },
      },
    ];
    for (const fidUsage of usage) {
      for (let i = 0; i < fidUsage.usage.cast; i++) {
        const message = await Factories.CastAddMessage.create({ data: { fid: fidUsage.fid } });
        await putMessage(db, message);
      }

      for (let i = 0; i < fidUsage.usage.reaction; i++) {
        const message = await Factories.ReactionAddMessage.create({ data: { fid: fidUsage.fid } });
        await putMessage(db, message);
      }

      for (let i = 0; i < fidUsage.usage.verification; i++) {
        const message = await Factories.VerificationAddEthAddressMessage.create({ data: { fid: fidUsage.fid } });
        await putMessage(db, message);
      }

      for (let i = 0; i < fidUsage.usage.userData; i++) {
        const message = await Factories.UserDataAddMessage.create({ data: { fid: fidUsage.fid } });
        await putMessage(db, message);
      }

      for (let i = 0; i < fidUsage.usage.storage; i++) {
        const storageRentEvent = Factories.StorageRentOnChainEvent.build({
          fid: fidUsage.fid,
          storageRentEventBody: Factories.StorageRentEventBody.build({
            expiry: getFarcasterTime()._unsafeUnwrap() + 365 * 24 * 60 * 60 - i,
            units: 2,
          }),
        });
        await db.commit(putOnChainEventTransaction(db.transaction(), storageRentEvent));
      }
    }
    await cache.syncFromDb();
    for (const fidUsage of usage) {
      await expect(cache.getMessageCount(fidUsage.fid, UserPostfix.CastMessage)).resolves.toEqual(
        ok(fidUsage.usage.cast),
      );
      await expect(cache.getMessageCount(fidUsage.fid, UserPostfix.ReactionMessage)).resolves.toEqual(
        ok(fidUsage.usage.reaction),
      );
      await expect(cache.getMessageCount(fidUsage.fid, UserPostfix.VerificationMessage)).resolves.toEqual(
        ok(fidUsage.usage.verification),
      );
      await expect(cache.getMessageCount(fidUsage.fid, UserPostfix.UserDataMessage)).resolves.toEqual(
        ok(fidUsage.usage.userData),
      );
      await expect(cache.getCurrentStorageUnitsForFid(fidUsage.fid)).resolves.toEqual(ok(4));
    }
  });
});

describe("getCurrentStorageUnitsForFid", () => {
  test("cache invalidation happens when expected", async () => {
    const fid = Factories.Fid.build();
    for (let i = 1; i < 3; i++) {
      const event = Factories.StorageRentOnChainEvent.build({
        fid: fid,
        storageRentEventBody: Factories.StorageRentEventBody.build({
          expiry: getFarcasterTime()._unsafeUnwrap() + i,
          units: 2,
        }),
      });
      await db.commit(putOnChainEventTransaction(db.transaction(), event));
    }
    await cache.syncFromDb();
    await expect(cache.getCurrentStorageUnitsForFid(fid)).resolves.toEqual(ok(4));
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await expect(cache.getCurrentStorageUnitsForFid(fid)).resolves.toEqual(ok(2));
  });
});

describe("getMessageCount", () => {
  test("returns the correct count even if the cache is not synced", async () => {
    const fid = Factories.Fid.build();
    const message = await Factories.CastAddMessage.create({ data: { fid } });
    const message2 = await Factories.CastAddMessage.create({ data: { fid } });
    const message3_differnt_fid = await Factories.CastAddMessage.create();
    await putMessage(db, message);
    await putMessage(db, message2);
    await putMessage(db, message3_differnt_fid);
    await expect(cache.getMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(2));
    await expect(cache.getMessageCount(message3_differnt_fid.data.fid, UserPostfix.CastMessage)).resolves.toEqual(
      ok(1),
    );
    await expect(cache.getMessageCount(Factories.Fid.build(), UserPostfix.CastMessage)).resolves.toEqual(ok(0));
  });

  test("count is correct even if called multiple times at once", async () => {
    const fid = Factories.Fid.build();
    const message = await Factories.CastAddMessage.create({ data: { fid } });
    await putMessage(db, message);

    const origDbCountKeysAtPrefix = db.countKeysAtPrefix;
    try {
      let callCount = 0;
      db.countKeysAtPrefix = async (prefix: Buffer): Promise<number> => {
        callCount++;
        await sleep(1000);
        return origDbCountKeysAtPrefix.call(db, prefix);
      };

      // Call the function multiple 110 times at once
      const promises = await Promise.all(
        Array.from({ length: 110 }, () => cache.getMessageCount(fid, UserPostfix.CastMessage)),
      );
      expect(promises.length).toEqual(110);
      expect(callCount).toEqual(1);
      promises.forEach((promise) => expect(promise).toEqual(ok(1)));
    } finally {
      db.countKeysAtPrefix = origDbCountKeysAtPrefix;
    }
  });
});

describe("getEarliestTsHash", () => {
  test("returns undefined if there are no messages", async () => {
    await expect(cache.getEarliestTsHash(Factories.Fid.build(), UserPostfix.CastMessage)).resolves.toEqual(
      ok(undefined),
    );
  });

  test("returns the earliest tsHash by scanning the db on first use", async () => {
    const fid = Factories.Fid.build();
    const first = await Factories.CastAddMessage.create({ data: { fid, timestamp: 123 } });
    const second = await Factories.CastAddMessage.create({ data: { fid, timestamp: 213 } });
    const third = await Factories.CastAddMessage.create({ data: { fid, timestamp: 321 } });
    await putMessage(db, second);
    await putMessage(db, first);

    await expect(cache.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(
      makeTsHash(first.data.timestamp, first.hash),
    );

    await putMessage(db, third);
    // Unchanged
    await expect(cache.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(
      makeTsHash(first.data.timestamp, first.hash),
    );
  });
});

describe("processEvent", () => {
  test("increments count with merge cast message event", async () => {
    const fid = Factories.Fid.build();
    const message = await Factories.CastAddMessage.create({ data: { fid } });
    const event = HubEvent.create({ type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message } });

    await cache.syncFromDb();
    await expect(cache.getMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(0));
    await cache.processEvent(event);
    await expect(cache.getMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(1));
  });

  test("increments count with merge cast remove message event", async () => {
    const fid = Factories.Fid.build();
    const message = await Factories.CastRemoveMessage.create({ data: { fid } });
    const event = HubEvent.create({ type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message } });

    await cache.syncFromDb();
    await expect(cache.getMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(0));
    await cache.processEvent(event);
    await expect(cache.getMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(1));
  });

  test("count is unchanged when removing existing cast", async () => {
    const fid = Factories.Fid.build();
    const cast = await Factories.CastAddMessage.create({ data: { fid } });
    const castRemove = await Factories.CastRemoveMessage.create({
      data: { fid, castRemoveBody: { targetHash: cast.hash } },
    });
    const event = HubEvent.create({
      type: HubEventType.MERGE_MESSAGE,
      mergeMessageBody: { message: castRemove, deletedMessages: [cast] },
    });

    await putMessage(db, cast);
    await cache.syncFromDb();
    await expect(cache.getMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(1));
    await cache.processEvent(event);
    await expect(cache.getMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(1));
  });

  test("count is decremented with prune message event", async () => {
    const fid = Factories.Fid.build();
    const message = await Factories.ReactionAddMessage.create({ data: { fid } });
    const event = HubEvent.create({ type: HubEventType.PRUNE_MESSAGE, pruneMessageBody: { message } });

    await putMessage(db, message);
    await cache.syncFromDb();
    await expect(cache.getMessageCount(fid, UserPostfix.ReactionMessage)).resolves.toEqual(ok(1));
    await cache.processEvent(event);
    await expect(cache.getMessageCount(fid, UserPostfix.ReactionMessage)).resolves.toEqual(ok(0));
  });

  test("count is decremented with revoke message event", async () => {
    const fid = Factories.Fid.build();
    const message = await Factories.CastAddMessage.create({ data: { fid } });
    const event = HubEvent.create({ type: HubEventType.REVOKE_MESSAGE, revokeMessageBody: { message } });

    await putMessage(db, message);
    await cache.syncFromDb();
    await expect(cache.getMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(1));
    await cache.processEvent(event);
    await expect(cache.getMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(0));
  });

  test("sets earliest tsHash with merge cast message event", async () => {
    const fid = Factories.Fid.build();
    const storageEvent = Factories.StorageRentOnChainEvent.build({ fid });
    const eventHandler = new StoreEventHandler(db, {}, undefined, cache);
    const onChainEventStore = new OnChainEventStore(db, eventHandler);
    await onChainEventStore.mergeOnChainEvent(storageEvent);
    const castStore = new CastStore(db, eventHandler);

    const middleMessage = await Factories.CastAddMessage.create({ data: { fid } });
    // Earliest tsHash is undefined initially
    await expect(cache.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(undefined));
    await castStore.merge(middleMessage);

    // Earliest tsHash is set
    await expect(cache.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(
      makeTsHash(middleMessage.data.timestamp, middleMessage.hash),
    );

    // Adding a later messages does not change the earliest tsHash
    const laterMessage = await Factories.CastAddMessage.create({
      data: { fid, timestamp: middleMessage.data.timestamp + 10 },
    });
    await castStore.merge(laterMessage);
    await expect(cache.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(
      makeTsHash(middleMessage.data.timestamp, middleMessage.hash),
    );

    // Adding an earlier message changes the earliest tsHash
    const earlierMessage = await Factories.CastAddMessage.create({
      data: { fid, timestamp: middleMessage.data.timestamp - 10 },
    });
    await castStore.merge(earlierMessage);
    await expect(cache.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(
      makeTsHash(earlierMessage.data.timestamp, earlierMessage.hash),
    );
  });

  test("resets the earliest tsHash if the earliest message is removed", async () => {
    const fid = Factories.Fid.build();
    const storageEvent = Factories.StorageRentOnChainEvent.build({ fid });
    const eventHandler = new StoreEventHandler(db, {}, undefined, cache);
    const onChainEventStore = new OnChainEventStore(db, eventHandler);
    await onChainEventStore.mergeOnChainEvent(storageEvent);
    const reactionStore = new ReactionStore(db, eventHandler);

    const firstMessage = await Factories.ReactionAddMessage.create({ data: { fid } });
    const laterMessage = await Factories.ReactionAddMessage.create({
      data: { fid, timestamp: firstMessage.data.timestamp + 10 },
    });
    const firstEvent = HubEvent.create({
      type: HubEventType.PRUNE_MESSAGE,
      pruneMessageBody: { message: firstMessage },
    });
    const laterEvent = HubEvent.create({
      type: HubEventType.PRUNE_MESSAGE,
      pruneMessageBody: { message: laterMessage },
    });

    await reactionStore.merge(firstMessage);

    await expect(cache.getEarliestTsHash(fid, UserPostfix.ReactionMessage)).resolves.toEqual(
      makeTsHash(firstMessage.data.timestamp, firstMessage.hash),
    );

    await reactionStore.merge(laterMessage);
    // Unchanged
    await expect(cache.getEarliestTsHash(fid, UserPostfix.ReactionMessage)).resolves.toEqual(
      makeTsHash(firstMessage.data.timestamp, firstMessage.hash),
    );

    await reactionStore.revoke(firstMessage);
    // reset to later message
    await expect(cache.getEarliestTsHash(fid, UserPostfix.ReactionMessage)).resolves.toEqual(
      makeTsHash(laterMessage.data.timestamp, laterMessage.hash),
    );
  });
});
