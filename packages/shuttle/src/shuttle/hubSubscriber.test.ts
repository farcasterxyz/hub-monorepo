import { HubEvent, HubEventType, HubRpcClient } from "@farcaster/hub-nodejs";
import { jest } from "@jest/globals";
import { pino } from "pino";
import { EventStreamConnection } from "./eventStream";
import { EventStreamHubSubscriber } from "./hubSubscriber";
import { RedisClient } from "./redis";

const log = pino({ level: "silent" });

const hubEvent = (id: number): HubEvent =>
  HubEvent.create({
    id,
    type: HubEventType.MERGE_MESSAGE,
    timestamp: 1,
  });

const idsIn = (batch: Buffer[]): number[] => batch.map((bytes) => HubEvent.decode(bytes).id);

describe("EventStreamHubSubscriber batch flush", () => {
  let added: Buffer[][];
  let savedIds: number[];
  let eventStream: EventStreamConnection;
  let redis: RedisClient;
  let subscriber: EventStreamHubSubscriber;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    added = [];
    savedIds = [];
    eventStream = {
      add: async (_key: string, data: Buffer | Buffer[]) => {
        added.push(Array.isArray(data) ? data : [data]);
      },
    } as unknown as EventStreamConnection;
    redis = {
      getLastProcessedEvent: async () => 0,
      setLastProcessedEvent: async (_key: string, eventId: number) => {
        savedIds.push(eventId);
      },
    } as unknown as RedisClient;
    subscriber = new EventStreamHubSubscriber(
      "test",
      { host: "hub.test", client: {} as HubRpcClient },
      1,
      eventStream,
      redis,
      "1",
      log,
    );
  });

  afterEach(() => {
    subscriber.stop();
    jest.useRealTimers();
  });

  test("writes a buffered event when the timer fires and no later event arrives", async () => {
    await subscriber.processHubEvent(hubEvent(1));
    expect(added.map(idsIn)).toEqual([[1]]);

    await subscriber.processHubEvent(hubEvent(2));
    expect(added.map(idsIn)).toEqual([[1]]);

    await jest.advanceTimersByTimeAsync(199);
    expect(added.map(idsIn)).toEqual([[1]]);

    await jest.advanceTimersByTimeAsync(1);
    expect(added.map(idsIn)).toEqual([[1], [2]]);
    expect(savedIds.at(-1)).toBe(2);
  });

  test("writes a full batch once and does not write it again from the timer", async () => {
    await subscriber.processHubEvent(hubEvent(1));

    for (let id = 2; id <= 101; id++) {
      await subscriber.processHubEvent(hubEvent(id));
    }

    const batches = added.map(idsIn);
    expect(batches[0]).toEqual([1]);
    const fullBatch = batches[1] ?? [];
    expect(fullBatch).toHaveLength(100);
    expect(fullBatch[0]).toBe(2);
    expect(fullBatch[99]).toBe(101);
    expect(savedIds.at(-1)).toBe(101);

    await jest.advanceTimersByTimeAsync(1_000);
    expect(added).toHaveLength(2);
  });

  test("does not flush a buffered event after stop", async () => {
    await subscriber.processHubEvent(hubEvent(1));
    await subscriber.processHubEvent(hubEvent(2));

    subscriber.stop();
    await jest.advanceTimersByTimeAsync(1_000);

    expect(added.map(idsIn)).toEqual([[1]]);
    expect(savedIds).toEqual([1]);
  });

  test("retries a timer flush that fails to write", async () => {
    let calls = 0;
    eventStream.add = async (_key: string, data: Buffer | Buffer[]) => {
      calls += 1;
      if (calls === 2) throw new Error("redis down");
      added.push(Array.isArray(data) ? data : [data]);
    };

    await subscriber.processHubEvent(hubEvent(1));
    await subscriber.processHubEvent(hubEvent(2));

    await jest.advanceTimersByTimeAsync(200);
    expect(added.map(idsIn)).toEqual([[1]]);

    await jest.advanceTimersByTimeAsync(200);
    expect(added.map(idsIn)).toEqual([[1], [2]]);
    expect(savedIds.at(-1)).toBe(2);
  });

  test("saves a later event id after an in-flight timer flush", async () => {
    let releaseSecondAdd: () => void = () => {};
    const secondAddBlocked = new Promise<void>((resolve) => {
      releaseSecondAdd = resolve;
    });
    let markSecondAddStarted: () => void = () => {};
    const secondAddStarted = new Promise<void>((resolve) => {
      markSecondAddStarted = resolve;
    });
    let addCount = 0;
    eventStream.add = async (_key: string, data: Buffer | Buffer[]) => {
      const buffers = Array.isArray(data) ? data : [data];
      added.push(buffers);
      addCount += 1;
      if (addCount === 2) {
        markSecondAddStarted();
        await secondAddBlocked;
      }
    };

    await subscriber.processHubEvent(hubEvent(1));
    await subscriber.processHubEvent(hubEvent(2));

    const timerFlushed = jest.advanceTimersByTimeAsync(201);
    await secondAddStarted;

    const thirdEvent = subscriber.processHubEvent(hubEvent(3));
    releaseSecondAdd();
    await timerFlushed;
    await thirdEvent;

    expect(savedIds).toEqual([1, 2, 3]);
    expect(added.map(idsIn)).toEqual([[1], [2], [3]]);
  });
});
