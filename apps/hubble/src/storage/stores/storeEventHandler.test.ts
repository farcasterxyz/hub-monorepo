import { CastAddMessage, Factories, HubEvent, HubEventType } from "@farcaster/hub-nodejs";
import { ok, Result } from "neverthrow";
import { jestRocksDB } from "../db/jestUtils.js";
import { getMessage, makeTsHash, putMessage, putMessageTransaction } from "../db/message.js";
import { UserPostfix } from "../db/types.js";
import StoreEventHandler, { HubEventArgs, HubEventIdGenerator } from "./storeEventHandler.js";
import { sleep } from "../../utils/crypto.js";
import { getFarcasterTime } from "@farcaster/core";

const db = jestRocksDB("stores.storeEventHandler.test");
const eventHandler = new StoreEventHandler(db);

let events: HubEvent[] = [];
let currentTime = 0;

const eventListener = (event: HubEvent) => {
  events.push(event);
};

beforeAll(() => {
  eventHandler.on("mergeMessage", eventListener);
});

beforeEach(async () => {
  events = [];
  currentTime = getFarcasterTime()._unsafeUnwrap();
  await eventHandler.syncCache();
});

afterAll(() => {
  eventHandler.off("mergeMessage", eventListener);
});

let message: CastAddMessage;

beforeAll(async () => {
  message = await Factories.CastAddMessage.create();
});

describe("HubEventIdGenerator", () => {
  const generator = new HubEventIdGenerator();

  test("succeeds", () => {
    let lastId = 0;

    for (let i = 0; i < 10; i++) {
      const id = generator.generateId()._unsafeUnwrap();
      expect(id).toBeGreaterThan(lastId);
      lastId = id;
    }
  });

  test("fails if sequence ID exceeds max allowed", () => {
    const currentTimestamp = Date.now();
    const generator = new HubEventIdGenerator({ lastTimestamp: currentTimestamp, lastIndex: 4094 });
    expect(generator.generateId({ currentTimestamp }).isOk()).toEqual(true);
    expect(generator.generateId({ currentTimestamp }).isErr()).toEqual(true);
  });
});

describe("commitTransaction", () => {
  test("commits transaction and returns event id", async () => {
    const txn = putMessageTransaction(db.transaction(), message);
    const eventArgs: HubEventArgs = {
      type: HubEventType.MERGE_MESSAGE,
      mergeMessageBody: { message, deletedMessages: [] },
    };

    const result = await eventHandler.commitTransaction(txn, eventArgs);
    expect(result.isOk()).toBeTruthy();
    const eventId = result._unsafeUnwrap();
    expect(eventId).toBeGreaterThan(0);
    await expect(
      getMessage(
        db,
        message.data.fid,
        UserPostfix.CastMessage,
        makeTsHash(message.data?.timestamp, message.hash)._unsafeUnwrap(),
      ),
    ).resolves.toEqual(message);
    const event = await eventHandler.getEvent(eventId as number);
    expect(event).toMatchObject(ok(eventArgs));
    expect(events).toEqual([event._unsafeUnwrap()]);
  });
});

describe("isPrunable", () => {
  test("returns true if messsage is earlier than prune time limit", async () => {
    message = await Factories.CastAddMessage.create({ data: { timestamp: currentTime - 101 } });
    await expect(eventHandler.isPrunable(message, UserPostfix.CastMessage, 10, 100)).resolves.toEqual(ok(true));
  });
  test("returns false if there is no prune time limit", async () => {
    message = await Factories.CastAddMessage.create({ data: { timestamp: currentTime - 101 } });
    await expect(eventHandler.isPrunable(message, UserPostfix.CastMessage, 10)).resolves.toEqual(ok(false));
  });
  test("returns false if message is later than prune time limit", async () => {
    message = await Factories.CastAddMessage.create({ data: { timestamp: currentTime - 50 } });
    await expect(eventHandler.isPrunable(message, UserPostfix.CastMessage, 10, 100)).resolves.toEqual(ok(false));
  });
  test("returns false if under size limit", async () => {
    message = await Factories.CastAddMessage.create({ data: { timestamp: currentTime - 50 } });
    await putMessage(db, message);
    await expect(eventHandler.getCacheMessageCount(message.data.fid, UserPostfix.CastMessage)).resolves.toEqual(ok(1));
    await expect(eventHandler.isPrunable(message, UserPostfix.CastMessage, 1, 100)).resolves.toEqual(ok(false));
  });
  test("returns false if over size limit and message is later than earliest message", async () => {
    message = await Factories.CastAddMessage.create({ data: { timestamp: currentTime - 50 } });
    await putMessage(db, message);
    await expect(eventHandler.getCacheMessageCount(message.data.fid, UserPostfix.CastMessage)).resolves.toEqual(ok(1));

    const laterMessage = await Factories.CastAddMessage.create({
      data: { fid: message.data.fid, timestamp: currentTime + 50 },
    });
    await expect(eventHandler.isPrunable(laterMessage, UserPostfix.CastMessage, 1, 100)).resolves.toEqual(ok(false));
  });
  test("returns true if over size limit and message is earlier than earliest message", async () => {
    message = await Factories.CastAddMessage.create({ data: { timestamp: currentTime - 50 } });
    await putMessage(db, message);
    await expect(eventHandler.getCacheMessageCount(message.data.fid, UserPostfix.CastMessage)).resolves.toEqual(ok(1));
    await expect(eventHandler.getEarliestTsHash(message.data.fid, UserPostfix.CastMessage)).resolves.toEqual(
      makeTsHash(message.data.timestamp, message.hash),
    );

    const earlierMessage = await Factories.CastAddMessage.create({
      data: { fid: message.data.fid, timestamp: currentTime - 75 },
    });
    await expect(eventHandler.isPrunable(earlierMessage, UserPostfix.CastMessage, 1, 100)).resolves.toEqual(ok(true));
  });
});

describe("pruneEvents", () => {
  test("deletes events based on time limit", async () => {
    const message1 = await Factories.Message.create();
    const idRegistryEvent = Factories.IdRegistryEvent.build();
    const message2 = await Factories.Message.create();
    const message3 = await Factories.Message.create();

    const eventArgs1 = {
      type: HubEventType.MERGE_MESSAGE,
      mergeMessageBody: { message: message1, deletedMessages: [] },
    };
    const eventArgs2 = { type: HubEventType.MERGE_ID_REGISTRY_EVENT, mergeIdRegistryEventBody: { idRegistryEvent } };
    const eventArgs3 = { type: HubEventType.PRUNE_MESSAGE, pruneMessageBody: { message: message2 } };
    const eventArgs4 = {
      type: HubEventType.MERGE_MESSAGE,
      mergeMessageBody: { message: message3, deletedMessages: [] },
    };

    const result1 = Result.combine([
      await eventHandler.commitTransaction(db.transaction(), eventArgs1),
      await eventHandler.commitTransaction(db.transaction(), eventArgs2),
    ]);
    expect(result1.isOk()).toBeTruthy();

    await sleep(2_000);

    const result2 = Result.combine([
      await eventHandler.commitTransaction(db.transaction(), eventArgs3),
      await eventHandler.commitTransaction(db.transaction(), eventArgs4),
    ]);
    expect(result2.isOk()).toBeTruthy();

    const allEvents1 = await eventHandler.getEvents();
    expect(allEvents1._unsafeUnwrap()).toMatchObject([eventArgs1, eventArgs2, eventArgs3, eventArgs4]);

    const pruneResult1 = await eventHandler.pruneEvents(); // Should not prune any events since none are passed the default 3 days
    expect(pruneResult1.isOk()).toBeTruthy();

    const allEvents2 = await eventHandler.getEvents();
    expect(allEvents2._unsafeUnwrap()).toMatchObject([eventArgs1, eventArgs2, eventArgs3, eventArgs4]);

    const pruneResult2 = await eventHandler.pruneEvents(1_000); // Prune the events that happened more than a second ago
    expect(pruneResult2.isOk()).toBeTruthy();

    const allEvents3 = await eventHandler.getEvents();
    expect(allEvents3._unsafeUnwrap()).toMatchObject([eventArgs3, eventArgs4]);
  });
});

describe("getCurrentStorageUnitsForFid", () => {
  const fid = Factories.Fid.build();

  test("defaults to 1 before migration", async () => {
    expect(await eventHandler.getCurrentStorageUnitsForFid(fid)).toEqual(ok(1));
  });

  test("defaults to 1 during migration pruning grace period", async () => {
    // Assume migration happened 1 minute ago
    eventHandler.signerMigrated(Date.now() / 1000 - 60);
    expect(await eventHandler.getCurrentStorageUnitsForFid(fid)).toEqual(ok(1));
  });

  test("returns actual storage available after migration pruning grace period", async () => {
    // Assume migration happened 2 days
    eventHandler.signerMigrated(Date.now() / 1000 - 60 * 60 * 24 * 2);
    expect(await eventHandler.getCurrentStorageUnitsForFid(fid)).toEqual(ok(0));
  });
});
