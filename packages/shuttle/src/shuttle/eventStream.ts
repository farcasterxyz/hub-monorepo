import { Cluster, Redis, ReplyError } from "ioredis";
import { HubClient } from "./hub";
import { inBatchesOf, sleep } from "../utils";
import { statsd } from "../statsd";
import {
  BlockConfirmedHubEvent,
  extractTimestampFromEvent,
  HubEvent,
  HubEventType,
  isBlockConfirmedHubEvent,
} from "@farcaster/hub-nodejs";
import { log } from "../log";
import { pino } from "pino";
import { ProcessResult } from "./index";
import { Result } from "neverthrow";
import { TypedEmitter } from "tiny-typed-emitter";

// Dummy name since we don't need unique names to get desired semantics
const DUMMY_CONSUMER_GROUP = "x";

/**
 * Represents a single connection to an event stream.
 *
 * Ideally you should have two connections per purpose: one for reading and one for writing.
 */
export class EventStreamConnection {
  private client: Redis | Cluster;

  constructor(client: Redis | Cluster) {
    this.client = client;
  }

  async waitUntilReady(timeout = 5000) {
    if (this.client.status === "ready") return;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject();
      }, timeout);

      this.client.once("ready", () => {
        clearTimeout(timeoutId);
        resolve(this.client);
      });
    });
  }

  /**
   * Creates a consumer group for the given stream.
   */
  async createGroup(key: string, consumerGroup: string) {
    // Check if the group already exists
    try {
      const groups = (await this.client.xinfo("GROUPS", key)) as [string, string][];
      if (groups.some(([_fieldName, groupName]) => groupName === consumerGroup)) return;
    } catch (e: unknown) {
      if (typeof e === "object" && e !== null && e instanceof ReplyError) {
        if ("message" in e && (e.message as string).startsWith("ERR no such key")) {
          // Ignore if the group hasn't been created yet
        } else {
          throw e;
        }
      }
    }

    try {
      // Otherwise create the group
      return await this.client.xgroup("CREATE", key, consumerGroup, "0", "MKSTREAM");
    } catch (e: unknown) {
      if (typeof e === "object" && e !== null && e instanceof ReplyError) {
        if ("message" in e && (e.message as string).startsWith("BUSYGROUP")) {
          return; // Ignore if group already exists
        }
      }
      throw e;
    }
  }

  /**
   * Adds one or more event to the stream at the specified key.
   */
  async add(key: string, data: Buffer | Buffer[]) {
    if (data instanceof Buffer) {
      // We know this will always be a string because we're not providing the NOMKSTREAM flag
      return (await this.client.xadd(key, "*", "d", data)) as string;
    }

    const pipeline = this.client.pipeline();
    for (const buffer of data) {
      pipeline.xadd(key, "*", "d", buffer);
    }

    return await pipeline.exec();
  }

  /**
   * Reserves up to the specified number (default 1) of events from the stream for
   * the given consumer group.
   */
  async reserve(key: string, consumerGroup: string, count = 1) {
    // Need `as any` because xreadgroupBuffer exists but not the ioredis types
    // biome-ignore lint/suspicious/noExplicitAny: see above
    const result = await (this.client as any).xreadgroupBuffer(
      "GROUP",
      consumerGroup,
      DUMMY_CONSUMER_GROUP,
      "COUNT",
      count,
      "STREAMS",
      key,
      ">",
    );

    return result?.length && result[0].length ? this._extractEntries(result[0][1]) : [];
  }

  // biome-ignore lint/suspicious/noExplicitAny: ignore
  private _extractEntries(result: any): { id: string; data: Buffer }[] {
    if (result?.length) {
      return result.map(([idBytes, [, data]]: [Buffer, [Buffer, Buffer]]) => ({
        id: idBytes.toString(),
        data,
      }));
    } else {
      return [];
    }
  }

  /**
   * Mark the specified event(s) as processed by the consumer.
   * This should be called after you have `consume`d the event and processed successfully.
   */
  async ack(key: string, consumerGroup: string, idOrIds: string | string[]) {
    // biome-ignore lint/style/noParameterAssign: ignore
    if (typeof idOrIds === "string") idOrIds = [idOrIds];
    await this.client.xack(key, consumerGroup, ...idOrIds);
  }

  /**
   * Returns specified number of events (default 1) that have been pending for the
   * given minimum amount of time.
   *
   * Useful for re-processing events that were never `ack`ed by a consumer.
   */
  async pending(key: string, consumerGroup: string, millis = 0, count = 1) {
    const result = await this.client.xpending(key, consumerGroup, "IDLE", millis, "-", "+", count);
    return result.map(
      // biome-ignore lint/suspicious/noExplicitAny: ignore
      ([id, , idleTime, deliveryCount]: any) =>
        ({
          id,
          idleTime,
          deliveryCount,
        }) as { id: string; idleTime: number; deliveryCount: number },
    );
  }

  /**
   * Returns specified number of events (default 1) that have been pending for the
   * given minimum amount of time.
   *
   * Useful for re-processing events that were never `ack`ed by a consumer.
   */
  async claimStale(key: string, consumerGroup: string, millis = 0, count = 1) {
    // Need `as any` since method exists but not in the types
    // biome-ignore lint/suspicious/noExplicitAny: see above
    const [, result] = await (this.client as any).xautoclaimBuffer(
      key,
      consumerGroup,
      DUMMY_CONSUMER_GROUP,
      millis,
      "0-0",
      "COUNT",
      count,
    );

    return this._extractEntries(result);
  }

  /**
   * Gets the number of entries in the stream.
   *
   * Note that this number doesn't decrement when events are consumed/acked.
   * Items need to be manually deleted, or the stream needs to be trimmed.
   */
  async streamSize(key: string) {
    return (await this.client.xlen(key)) as number;
  }

  /**
   * Deletes the specified item from the stream.
   */
  async delete(key: string, id: string) {
    return await this.client.xdel(key, id);
  }

  /**
   * Trims items from the stream older than the given timestamp.
   *
   * Does an approximate trim to reduce effort by Redis.
   */
  async trim(key: string, timestamp: Date) {
    return await this.client.xtrim(key, "MINID", "~", timestamp.getTime());
  }
}

const GROUP_NAME = "hub_events";
const MAX_EVENTS_PER_FETCH = 10;
const MESSAGE_PROCESSING_CONCURRENCY = 10;
const EVENT_PROCESSING_TIMEOUT = 10_000; // How long before retrying processing (millis)
const EVENT_DELETION_THRESHOLD = 1000 * 60 * 60 * 24; // 1 day

type PreProcessHandler = (events: HubEvent[], eventsBytes: Uint8Array[]) => Promise<ProcessResult[]>;
type PostProcessHandler = (events: HubEvent[], eventsBytes: Uint8Array[]) => Promise<void>;

export type EventStreamConsumerOptions = {
  maxEventsPerFetch?: number;
  messageProcessingConcurrency?: number;
  groupName?: string;
  eventProcessingTimeout?: number;
  eventDeletionThreshold?: number;
  beforeProcess?: PreProcessHandler;
  afterProcess?: PostProcessHandler;
};

// Provides a way for custom tracking to be implemented
interface HubEventStreamConsumerEventsEmitter {
  onError: (hubEvent: HubEvent, error: Error) => void;
}

export class EventStreamMonitor {
  private redis: Redis | Cluster;
  private relevantEventTypes: HubEventType[];
  private log: pino.Logger;
  private shardKey: string; // Shard key should map to snapchain shards
  private host: string;
  private redisPrefix: string;

  constructor(
    redis: Redis | Cluster,
    relevantEventTypes: HubEventType[],
    redisPrefix: string,
    shardKey: string,
    host: string,
    log: pino.Logger,
  ) {
    this.redis = redis;
    this.relevantEventTypes = relevantEventTypes;
    this.log = log.child({ class: "EventStreamMonitor" });
    this.shardKey = shardKey;
    this.host = host;
    this.redisPrefix = redisPrefix;
  }

  public streamKey(shardId: number) {
    return `${this.redisPrefix}:${this.host}:shard-${shardId}`;
  }

  public blockCountsKey(blockNumber: number, shardId: number, eventType: number) {
    return `${this.streamKey(shardId)}:block-counts:${blockNumber}:${eventType}`;
  }

  public currentBlockNumberKey(shardId: number) {
    return `${this.streamKey(shardId)}:current-block-number`;
  }

  public currentBlockTimestampKey(shardId: number) {
    return `${this.streamKey(shardId)}:current-block-timestamp`;
  }

  public async setBlockCounts(event: BlockConfirmedHubEvent) {
    for (const eventType of this.relevantEventTypes) {
      const count = event.blockConfirmedBody.eventCountsByType[eventType];
      if (count !== undefined) {
        await this.redis.set(
          this.blockCountsKey(event.blockConfirmedBody.blockNumber, event.shardIndex, eventType),
          count,
        );
      }
    }
  }

  public async blockCompleted(shardId: number, blockNumber: number) {
    for (const eventType of this.relevantEventTypes) {
      const key = this.blockCountsKey(blockNumber, shardId, eventType);
      const count = await this.redis.get(key);
      if (count !== null) {
        // TODO(aditi): Eventually we will want to retry missed events
        statsd.increment("hub.event.monitor.missed_events", Number(count), {
          shard: shardId,
          host: this.host,
          type: eventType,
        });
        this.log.error({ blockNumber, eventType, numMissedEvents: count }, "Missed events for block");
      }
    }
  }

  public async onEventProcessed(event: HubEvent) {
    const currentBlockNumber = await this.redis.get(this.currentBlockNumberKey(event.shardIndex));
    statsd.gauge("hub.event.monitor.current_block", Number(currentBlockNumber ?? "0"), {
      shard: event.shardIndex,
      host: this.host,
    });

    const currentBlockTimestamp = await this.redis.get(this.currentBlockTimestampKey(event.shardIndex));
    if (currentBlockTimestamp !== null) {
      statsd.gauge("hub.event.monitor.event_delay", Date.now() - Number(currentBlockTimestamp), {
        shard: event.shardIndex,
        host: this.host,
      });
    }

    if (isBlockConfirmedHubEvent(event)) {
      if (currentBlockNumber !== null && event.blockNumber > Number(currentBlockNumber) + 1) {
        // TODO(aditi): Eventually we'll want to retry here
        statsd.increment("hub.event.monitor.missed_blocks", event.blockNumber - Number(currentBlockNumber), {
          shard: event.shardIndex,
          host: this.host,
        });
        this.log.error(
          { lastBlock: currentBlockNumber, currentBlock: event.blockNumber, eventShardId: event.shardIndex },
          "Skipped events in block range",
        );
      }

      if (currentBlockNumber === null || event.blockNumber >= Number(currentBlockNumber)) {
        if (currentBlockNumber !== null) {
          await this.blockCompleted(event.shardIndex, Number(currentBlockNumber));
        }
        await this.setBlockCounts(event);
        await this.redis.set(this.currentBlockNumberKey(event.shardIndex), event.blockNumber);
        await this.redis.set(this.currentBlockTimestampKey(event.shardIndex), extractTimestampFromEvent(event));
      }
    }

    if (event.blockNumber < Number(currentBlockNumber)) {
      statsd.increment("hub.event.monitor.old_event", 1, {
        shard: event.shardIndex,
        type: event.type,
        host: this.host,
      });
      this.log.info(
        {
          blockNumber: event.blockNumber,
          eventId: event.id,
          eventType: event.type,
          eventTimestamp: extractTimestampFromEvent(event),
          eventShardId: event.shardIndex,
          currentBlockNumber: Number(currentBlockNumber),
        },
        "Received event for old block",
      );
    }

    const key = this.blockCountsKey(event.blockNumber, event.shardIndex, event.type);
    const new_count = await this.redis.decr(key);
    if (new_count === 0) {
      await this.redis.del(key);
    } else if (new_count < 0) {
      await this.redis.del(key);
      this.log.info(
        {
          blockNumber: event.blockNumber,
          eventType: event.type,
          eventTimestamp: extractTimestampFromEvent(event),
          eventShardId: event.shardIndex,
        },
        "Received unexpected event",
      );
    }
  }
}

export class HubEventStreamConsumer extends TypedEmitter<HubEventStreamConsumerEventsEmitter> {
  public hub: HubClient;
  private stream: EventStreamConnection;
  public readonly streamKey: string;
  public readonly shardKey: string;
  public readonly maxEventsPerFetch: number;
  public readonly messageProcessingConcurrency: number;
  public readonly eventProcessingTimeout: number;
  public readonly eventDeletionThreshold: number;
  public stopped = true;
  public readonly groupName: string;
  private log: pino.Logger;
  private beforeProcess?: PreProcessHandler;
  private afterProcess?: PostProcessHandler;
  private interval?: NodeJS.Timeout;
  private monitor?: EventStreamMonitor;

  constructor(
    hub: HubClient,
    eventStream: EventStreamConnection,
    shardKey: string,
    options: EventStreamConsumerOptions = {},
    logger: pino.Logger = log,
    eventStreamMonitor?: EventStreamMonitor,
  ) {
    super();
    this.hub = hub;
    this.stream = eventStream;
    this.streamKey = `hub:${this.hub.host}:evt:msg:${shardKey}`;
    this.groupName = options.groupName || GROUP_NAME;
    this.maxEventsPerFetch = options.maxEventsPerFetch || MAX_EVENTS_PER_FETCH;
    this.messageProcessingConcurrency = options.messageProcessingConcurrency || MESSAGE_PROCESSING_CONCURRENCY;
    this.eventProcessingTimeout = options.eventProcessingTimeout || EVENT_PROCESSING_TIMEOUT;
    this.eventDeletionThreshold = options.eventDeletionThreshold || EVENT_DELETION_THRESHOLD;
    this.shardKey = shardKey;
    this.log = logger;
    this.beforeProcess = options.beforeProcess;
    this.afterProcess = options.afterProcess;
    this.monitor = eventStreamMonitor;
  }

  async start(onEvent: (event: HubEvent) => Promise<Result<ProcessResult, Error>>) {
    this.stopped = false;
    await this.stream.waitUntilReady();
    await this.stream.createGroup(this.streamKey, this.groupName);

    this.interval = setInterval(() => {
      // Run separately from the run loop since it consumes wall clock time and
      // doesn't need to happen often, as long as it happens at some frequency
      this.clearOldEvents();

      // While we do process stale events regularly, it's possible that a stream
      // will be so busy that we won't have had an opportunity, so make sure we
      // guarantee at least one invocation on some cadence.
      this.processStale(onEvent);
    }, 1000 * 60 /* 1 min */);

    void this._runLoop(onEvent);
  }

  stop() {
    clearInterval(this.interval);
    this.stopped = true;
  }

  private async _runLoop(onEvent: (event: HubEvent) => Promise<Result<ProcessResult, Error>>) {
    while (!this.stopped) {
      try {
        let eventsRead = 0;

        const startTime = Date.now();
        const events = await this.stream.reserve(this.streamKey, this.groupName, this.maxEventsPerFetch);
        const reserveTime = Date.now() - startTime;

        statsd.timing("hub.event.stream.reserve_time", reserveTime, {
          hub: this.hub.host,
          source: this.shardKey,
        });
        statsd.increment("hub.event.stream.reserve", { hub: this.hub.host, source: this.shardKey });

        eventsRead += events.length;

        let eventChunk: [string, HubEvent, Buffer][] = events.map(({ id, data: eventBytes }) => [
          id,
          HubEvent.decode(eventBytes),
          eventBytes,
        ]);
        if (this.beforeProcess) {
          const allEventsInChunk = eventChunk.map(([_id, evt, _evtBytes]) => evt);
          const allEventsBytesInChunk = eventChunk.map(([_id, _evt, evtBytes]) => evtBytes);
          const preprocessResult = await this.beforeProcess.call(this, allEventsInChunk, allEventsBytesInChunk);
          eventChunk = eventChunk.filter((_evt, idx) => !preprocessResult[idx]?.skipped);
        }

        const whenReceived = "current";
        await inBatchesOf(eventChunk, this.messageProcessingConcurrency, async (batchedEvents) => {
          const eventIdsProcessed: string[] = [];
          const eventIdsSkipped: string[] = [];
          await Promise.allSettled(
            batchedEvents.map(([id, hubEvt, evtBytes]) =>
              (async (streamId, hubEvent, eventBytes) => {
                try {
                  statsd.increment("hub.event.stream.current.attempts", 1, {
                    hub: this.hub.host,
                    source: this.shardKey,
                    hubEventType: hubEvent.type.toString(),
                  });

                  const dequeueDelay = Date.now() - Number(streamId.split("-")[0]);
                  statsd.timing("hub.event.stream.dequeue_delay", dequeueDelay, {
                    hub: this.hub.host,
                    source: this.shardKey,
                    whenReceived,
                  });

                  const startTime = Date.now();
                  const result = await onEvent(hubEvent);
                  const processingTime = Date.now() - startTime;
                  statsd.timing("hub.event.stream.time", processingTime, {
                    hub: this.hub.host,
                    source: this.shardKey,
                    hubEventType: hubEvent.type.toString(),
                    whenReceived,
                  });

                  if (result.isErr()) {
                    this.emit("onError", hubEvent, result.error);
                    eventIdsSkipped.push(streamId);
                    throw result.error;
                  }

                  eventIdsProcessed.push(streamId);
                  await this.monitor?.onEventProcessed(hubEvt);

                  if (result.value.skipped) {
                    statsd.increment("hub.event.stream.skipped", 1, {
                      hub: this.hub.host,
                      source: this.shardKey,
                    });
                  }

                  if (!result.value.skipped) {
                    const e2eTime = Date.now() - extractTimestampFromEvent(hubEvent);
                    statsd.timing("hub.event.stream.e2e_time", e2eTime, {
                      hub: this.hub.host,
                      source: this.shardKey,
                      hubEventType: hubEvent.type.toString(),
                      whenReceived,
                    });
                  }
                } catch (e: unknown) {
                  statsd.increment("hub.event.stream.errors", { hub: this.hub.host, source: this.shardKey });
                  this.log.error(e); // Report and move on to next event
                }
              })(id, hubEvt, evtBytes),
            ),
          );

          if (eventIdsProcessed.length) {
            const startTime = Date.now();
            await this.stream.ack(this.streamKey, this.groupName, eventIdsProcessed);
            statsd.timing("hub.event.stream.ack_time", Date.now() - startTime, {
              hub: this.hub.host,
              source: this.shardKey,
              whenReceived,
            });

            statsd.increment("hub.event.stream.ack", eventIdsProcessed.length, {
              hub: this.hub.host,
              source: this.shardKey,
              whenReceived,
            });

            if (this.afterProcess) {
              const hubEventsProcessed = eventChunk.map(([_id, evt, _evtBytes]) => evt);
              const eventsBytesProcessed = eventChunk.map(([_id, _evt, evtBytes]) => evtBytes);
              await this.afterProcess.call(this, hubEventsProcessed, eventsBytesProcessed);
            }
          }
        });

        if (eventsRead === 0) {
          if (this.stopped) break;
          const totalProcessed = await this.processStale(onEvent);
          if (totalProcessed === 0) {
            await sleep(10); // Don't thrash CPU if there's no events to process
          }
        }
      } catch (e: unknown) {
        this.log.error(e, "Error processing event, skipping");
      }
    }
  }

  public async processStale(onEvent: (event: HubEvent) => Promise<Result<ProcessResult, Error>>) {
    let totalStaleProcessed = 0;

    const startTime = Date.now();
    const events = await this.stream.claimStale(
      this.streamKey,
      this.groupName,
      this.eventProcessingTimeout,
      this.maxEventsPerFetch,
    );
    statsd.timing("hub.event.stream.claim_stale_time", Date.now() - startTime, {
      hub: this.hub.host,
      source: this.shardKey,
    });
    statsd.increment("hub.event.stream.claim_stale", 1, {
      hub: this.hub.host,
      source: this.shardKey,
    });

    await inBatchesOf(events, this.messageProcessingConcurrency, async (batchedEvents) => {
      const eventIdsProcessed: string[] = [];
      const whenReceived = "stale";
      await Promise.allSettled(
        batchedEvents.map((event) =>
          (async (streamEvent) => {
            try {
              const hubEvent = HubEvent.decode(streamEvent.data);
              statsd.increment("hub.event.stream.stale.attempts", 1, {
                hub: this.hub.host,
                source: this.shardKey,
                hubEventType: hubEvent.type.toString(),
              });

              const dequeueDelay = Date.now() - Number(streamEvent.id.split("-")[0]);
              statsd.timing("hub.event.stream.dequeue_delay", dequeueDelay, {
                hub: this.hub.host,
                source: this.shardKey,
                whenReceived,
              });

              const startTime = Date.now();
              const result = await onEvent(hubEvent);
              const processingTime = Date.now() - startTime;
              statsd.timing("hub.event.stream.time", processingTime, {
                hub: this.hub.host,
                source: this.shardKey,
                hubEventType: hubEvent.type.toString(),
                whenReceived,
              });
              if (result.isErr()) throw result.error;

              eventIdsProcessed.push(streamEvent.id);
              await this.monitor?.onEventProcessed(hubEvent);

              statsd.timing("hub.event.stream.e2e_time", Date.now() - extractTimestampFromEvent(hubEvent), {
                hub: this.hub.host,
                source: this.shardKey,
                hubEventType: hubEvent.type.toString(),
                whenReceived,
              });
            } catch (e: unknown) {
              statsd.increment("hub.event.stream.errors", { hub: this.hub.host, source: this.shardKey });
              this.log.error(e, "Error processing stale event"); // Report and move on to next event
            }
          })(event),
        ),
      );

      // ACK all processed events in a single call
      if (eventIdsProcessed.length) {
        totalStaleProcessed += eventIdsProcessed.length;
        const startTime = Date.now();
        await this.stream.ack(this.streamKey, this.groupName, eventIdsProcessed);
        statsd.timing("hub.event.stream.ack_time", Date.now() - startTime, {
          hub: this.hub.host,
          source: this.shardKey,
          whenReceived,
        });

        statsd.increment("hub.event.stream.ack", eventIdsProcessed.length, {
          hub: this.hub.host,
          source: this.shardKey,
          whenReceived,
        });
        statsd.increment("hub.event.stream.stale.processed", eventIdsProcessed.length, {
          hub: this.hub.host,
          source: this.shardKey,
        });
      }
    });

    return totalStaleProcessed;
  }

  public async clearOldEvents() {
    const deleteThresholdTimestamp = new Date(Date.now() - this.eventDeletionThreshold);

    const startTime = Date.now();
    const eventsCleared = await this.stream.trim(this.streamKey, deleteThresholdTimestamp);
    statsd.timing("hub.event.stream.trim_time", Date.now() - startTime, {
      hub: this.hub.host,
      source: this.shardKey,
    });

    statsd.increment("hub.event.stream.trimmed", eventsCleared, {
      hub: this.hub.host,
      source: this.shardKey,
    });

    return eventsCleared;
  }
}
