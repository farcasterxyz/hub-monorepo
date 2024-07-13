import { Cluster, ClusterOptions, Redis, RedisOptions, ReplyError } from "ioredis";
import { getHubEventCacheKey, HubClient } from "./hub";
import { inBatchesOf, sleep } from "../utils";
import { statsd } from "../statsd";
import { extractEventTimestamp, HubEvent } from "@farcaster/hub-nodejs";
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

  constructor(
    hub: HubClient,
    eventStream: EventStreamConnection,
    shardKey: string,
    options: EventStreamConsumerOptions = {},
    logger: pino.Logger = log,
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
  }

  async start(onEvent: (event: HubEvent) => Promise<Result<ProcessResult, Error>>) {
    this.stopped = false;
    await this.stream.waitUntilReady();
    await this.stream.createGroup(this.streamKey, this.groupName);
    void this._runLoop(onEvent);
  }

  stop() {
    this.stopped = true;
  }

  private async _runLoop(onEvent: (event: HubEvent) => Promise<Result<ProcessResult, Error>>) {
    while (!this.stopped) {
      try {
        const sizeStartTime = Date.now();
        const size = await this.stream.streamSize(this.streamKey);
        statsd.gauge("hub.event.stream.size", size, { hub: this.hub.host, source: this.shardKey });
        const sizeTime = Date.now() - sizeStartTime;

        statsd.timing("hub.event.stream.size_time", sizeTime, {
          hub: this.hub.host,
          source: this.shardKey,
        });
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

        await inBatchesOf(eventChunk, this.messageProcessingConcurrency, async (batchedEvents) => {
          const eventIdsProcessed: string[] = [];
          const eventIdsSkipped: string[] = [];
          await Promise.allSettled(
            batchedEvents.map(([id, hubEvt, evtBytes]) =>
              (async (streamId, hubEvent, eventBytes) => {
                try {
                  const dequeueDelay = Date.now() - Number(streamId.split("-")[0]);
                  statsd.timing("hub.event.stream.dequeue_delay", dequeueDelay, {
                    hub: this.hub.host,
                    source: this.shardKey,
                  });

                  const startTime = Date.now();
                  const result = await onEvent(hubEvent);
                  const processingTime = Date.now() - startTime;
                  statsd.timing("hub.event.stream.time", processingTime, {
                    hub: this.hub.host,
                    source: this.shardKey,
                    hubEventType: hubEvent.type.toString(),
                  });

                  if (result.isErr()) {
                    this.emit("onError", hubEvent, result.error);
                    eventIdsSkipped.push(streamId);
                    throw result.error;
                  }

                  eventIdsProcessed.push(streamId);
                  if (result.value.skipped) {
                    statsd.increment("hub.event.stream.skipped", 1, {
                      hub: this.hub.host,
                      source: this.shardKey,
                    });
                  }

                  if (!result.value.skipped) {
                    const e2eTime = Date.now() - extractEventTimestamp(hubEvent.id);
                    statsd.timing("hub.event.stream.e2e_time", e2eTime, {
                      hub: this.hub.host,
                      source: this.shardKey,
                      hubEventType: hubEvent.type.toString(),
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
            });

            statsd.increment("hub.event.stream.ack", eventIdsProcessed.length, {
              hub: this.hub.host,
              source: this.shardKey,
            });

            if (this.afterProcess) {
              const eventsProcessed = eventChunk.filter(([id, ,]) => !eventIdsSkipped.includes(id));
              const hubEventsProcessed = eventChunk.map(([_id, evt, _evtBytes]) => evt);
              const eventsBytesProcessed = eventChunk.map(([_id, _evt, evtBytes]) => evtBytes);
              await this.afterProcess.call(this, hubEventsProcessed, eventsBytesProcessed);
            }
          }
        });

        if (eventsRead === 0) {
          if (this.stopped) break;
          const numProcessed = await this.processStale(onEvent);
          const numCleared = await this.clearOldEvents();
          if (numProcessed + numCleared === 0) await sleep(10); // No events, so wait a bit to prevent CPU thrash
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
      await Promise.allSettled(
        batchedEvents.map((event) =>
          (async (streamEvent) => {
            try {
              statsd.increment("hub.event.stream.stale.attempts", 1, {
                hub: this.hub.host,
                source: this.shardKey,
              });

              const dequeueDelay = Date.now() - Number(streamEvent.id.split("-")[0]);
              statsd.timing("hub.event.stream.dequeue_delay", dequeueDelay, {
                hub: this.hub.host,
                source: this.shardKey,
              });

              const startTime = Date.now();
              const hubEvent = HubEvent.decode(streamEvent.data);
              const result = await onEvent(hubEvent);
              const processingTime = Date.now() - startTime;
              statsd.timing("hub.event.stream.time", processingTime, {
                hub: this.hub.host,
                source: this.shardKey,
              });
              if (result.isErr()) throw result.error;

              eventIdsProcessed.push(streamEvent.id);

              statsd.timing("hub.event.stream.e2e_time", Date.now() - extractEventTimestamp(hubEvent.id), {
                hub: this.hub.host,
                source: this.shardKey,
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
        });

        statsd.increment("hub.event.stream.ack", eventIdsProcessed.length, {
          hub: this.hub.host,
          source: this.shardKey,
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
