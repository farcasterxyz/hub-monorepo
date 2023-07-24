import { ok } from "neverthrow";
import { Factories, HubEvent, HubEventType, getFarcasterTime } from "@farcaster/hub-nodejs";
import { jestRocksDB } from "../db/jestUtils.js";
import { makeTsHash, putMessage } from "../db/message.js";
import { UserPostfix } from "../db/types.js";
import { StorageCache } from "./storageCache.js";
import { putRentRegistryEvent } from "../db/storageRegistryEvent.js";

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
        usage: { cast: 3, reaction: 2, verification: 4, userData: 1, signer: 0, storage: 2 },
      },
      {
        fid: Factories.Fid.build(),
        usage: { cast: 2, reaction: 3, verification: 0, userData: 2, signer: 5, storage: 2 },
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

      for (let i = 0; i < fidUsage.usage.signer; i++) {
        const message = await Factories.SignerAddMessage.create({ data: { fid: fidUsage.fid } });
        await putMessage(db, message);
      }

      for (let i = 0; i < fidUsage.usage.storage; i++) {
        const message = await Factories.RentRegistryEvent.create({
          fid: fidUsage.fid,
          expiry: getFarcasterTime()._unsafeUnwrap() + 365 * 24 * 60 * 60 - i,
          units: 2,
        });
        await putRentRegistryEvent(db, message);
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
      await expect(cache.getMessageCount(fidUsage.fid, UserPostfix.SignerMessage)).resolves.toEqual(
        ok(fidUsage.usage.signer),
      );
      await expect(cache.getCurrentStorageUnitsForFid(fidUsage.fid)).resolves.toEqual(ok(4));
    }
  });
});

describe("getCurrentStorageUnitsForFid", () => {
  test("cache invalidation happens when expected", async () => {
    const fid = Factories.Fid.build();
    for (let i = 1; i < 3; i++) {
      const message = await Factories.RentRegistryEvent.create({
        fid: fid,
        expiry: getFarcasterTime()._unsafeUnwrap() + i,
        units: 2,
      });
      await putRentRegistryEvent(db, message);
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
    cache.processEvent(event);
    await expect(cache.getMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(1));
  });

  test("increments count with merge cast remove message event", async () => {
    const fid = Factories.Fid.build();
    const message = await Factories.CastRemoveMessage.create({ data: { fid } });
    const event = HubEvent.create({ type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message } });

    await cache.syncFromDb();
    await expect(cache.getMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(0));
    cache.processEvent(event);
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
    cache.processEvent(event);
    await expect(cache.getMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(1));
  });

  test("count is decremented with prune message event", async () => {
    const fid = Factories.Fid.build();
    const message = await Factories.ReactionAddMessage.create({ data: { fid } });
    const event = HubEvent.create({ type: HubEventType.PRUNE_MESSAGE, pruneMessageBody: { message } });

    await putMessage(db, message);
    await cache.syncFromDb();
    await expect(cache.getMessageCount(fid, UserPostfix.ReactionMessage)).resolves.toEqual(ok(1));
    cache.processEvent(event);
    await expect(cache.getMessageCount(fid, UserPostfix.ReactionMessage)).resolves.toEqual(ok(0));
  });

  test("count is decremented with revoke message event", async () => {
    const fid = Factories.Fid.build();
    const message = await Factories.SignerAddMessage.create({ data: { fid } });
    const event = HubEvent.create({ type: HubEventType.REVOKE_MESSAGE, revokeMessageBody: { message } });

    await putMessage(db, message);
    await cache.syncFromDb();
    await expect(cache.getMessageCount(fid, UserPostfix.SignerMessage)).resolves.toEqual(ok(1));
    cache.processEvent(event);
    await expect(cache.getMessageCount(fid, UserPostfix.SignerMessage)).resolves.toEqual(ok(0));
  });

  test("sets earliest tsHash with merge cast message event", async () => {
    const fid = Factories.Fid.build();

    const middleMessage = await Factories.CastAddMessage.create({ data: { fid } });
    let event = HubEvent.create({ type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message: middleMessage } });

    // Earliest tsHash is undefined initially
    await expect(cache.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(undefined));
    cache.processEvent(event);

    // Earliest tsHash is set
    await expect(cache.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(
      makeTsHash(middleMessage.data.timestamp, middleMessage.hash),
    );

    // Adding a later messages does not change the earliest tsHash
    const laterMessage = await Factories.CastAddMessage.create({
      data: { fid, timestamp: middleMessage.data.timestamp + 10 },
    });
    event = HubEvent.create({ type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message: laterMessage } });
    cache.processEvent(event);
    await expect(cache.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(
      makeTsHash(middleMessage.data.timestamp, middleMessage.hash),
    );

    // Adding an earlier message changes the earliest tsHash
    const earlierMessage = await Factories.CastAddMessage.create({
      data: { fid, timestamp: middleMessage.data.timestamp - 10 },
    });
    event = HubEvent.create({ type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message: earlierMessage } });
    cache.processEvent(event);
    await expect(cache.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(
      makeTsHash(earlierMessage.data.timestamp, earlierMessage.hash),
    );
  });

  test("unsets the earliest tsHash if the earliest message is removed", async () => {
    const fid = Factories.Fid.build();
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

    await putMessage(db, firstMessage);
    await putMessage(db, laterMessage);
    await cache.syncFromDb();
    await expect(cache.getEarliestTsHash(fid, UserPostfix.ReactionMessage)).resolves.toEqual(
      makeTsHash(firstMessage.data.timestamp, firstMessage.hash),
    );

    cache.processEvent(laterEvent);
    // Unchanged
    await expect(cache.getEarliestTsHash(fid, UserPostfix.ReactionMessage)).resolves.toEqual(
      makeTsHash(firstMessage.data.timestamp, firstMessage.hash),
    );

    cache.processEvent(firstEvent);
    // Unset
    await expect(cache.getEarliestTsHash(fid, UserPostfix.ReactionMessage)).resolves.toEqual(ok(undefined));
  });
});
