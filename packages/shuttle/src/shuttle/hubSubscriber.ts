import {
  ClientReadableStream,
  extractEventTimestamp,
  HubEvent,
  HubEventType,
  HubRpcClient,
} from "@farcaster/hub-nodejs";
import { err, ok, Result } from "neverthrow";
import { Logger } from "../log";
import { TypedEmitter } from "tiny-typed-emitter";
import { EventStreamConnection } from "./eventStream";
import { sleep } from "../utils";
import { RedisClient } from "./redis";
import { HubClient } from "./hub";
import { ProcessResult } from "./index";
import { statsd } from "../statsd";
import { clearTimeout } from "timers";

interface HubEventsEmitter {
  onError: (error: Error, stopped: boolean) => void;
}

export abstract class HubSubscriber extends TypedEmitter<HubEventsEmitter> {
  public readonly hubClient?: HubRpcClient;

  public async start(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public stop(): void {
    throw new Error("Method not implemented.");
  }

  public async getLastEventId(): Promise<number | undefined> {
    return undefined;
  }

  public async processHubEvent(event: HubEvent): Promise<boolean> {
    return true;
  }

  public destroy(): void {
    throw new Error("Method not implemented.");
  }
}

const DEFAULT_EVENT_TYPES = [
  HubEventType.MERGE_ON_CHAIN_EVENT,
  HubEventType.MERGE_MESSAGE,
  HubEventType.MERGE_USERNAME_PROOF,
  HubEventType.PRUNE_MESSAGE,
  HubEventType.REVOKE_MESSAGE,
];

export class BaseHubSubscriber extends HubSubscriber {
  public label: string;
  public override hubClient: HubRpcClient;
  public stopped = true;
  protected log: Logger;
  protected eventTypes: HubEventType[];

  private stream: ClientReadableStream<HubEvent> | null = null;
  private totalShards: number | undefined;
  private shardIndex: number | undefined;
  private connectionTimeout: number; // milliseconds

  constructor(
    label: string,
    hubClient: HubRpcClient,
    log: Logger,
    eventTypes?: HubEventType[],
    totalShards?: number,
    shardIndex?: number,
    connectionTimeout = 30000,
  ) {
    super();
    this.label = label;
    this.hubClient = hubClient;
    this.log = log;
    this.totalShards = totalShards;
    this.shardIndex = shardIndex;
    this.eventTypes = eventTypes || DEFAULT_EVENT_TYPES;
    this.connectionTimeout = connectionTimeout;
  }

  public override stop() {
    this.stream?.cancel();
    this.stopped = true;
    this.log.info(`Stopped HubSubscriber ${this.label}`);
  }

  public override destroy() {
    if (!this.stopped) this.stop();
    this.hubClient.$.close();
  }

  private _waitForReadyHubClient(): Promise<Result<void, unknown>> {
    return new Promise((resolve) => {
      this.hubClient?.$.waitForReady(Date.now() + 5000, (e) => {
        return e ? resolve(err(e)) : resolve(ok(undefined));
      });
    });
  }

  public override async start() {
    this.log.info(`Starting HubSubscriber ${this.label}`);

    const hubClientReady = await this._waitForReadyHubClient();
    if (hubClientReady.isErr()) {
      this.log.error(`HubSubscriber ${this.label} failed to connect to hub: ${hubClientReady.error}`);
      throw hubClientReady.error;
    }
    this.log.info(`HubSubscriber ${this.label} connected to hub`);

    const fromId = await this.getLastEventId();
    if (fromId) {
      this.log.info(`HubSubscriber ${this.label} Found last hub event ID: ${fromId}`);
    } else {
      this.log.warn("No last hub event ID found, starting from the beginning");
    }

    const subscribeParams = {
      eventTypes: this.eventTypes,
      totalShards: this.totalShards,
      shardIndex: this.shardIndex,
      fromId,
    };

    const subscribeRequest = await this.hubClient.subscribe(subscribeParams);
    subscribeRequest
      .andThen((stream) => {
        this.log.info(
          `HubSubscriber ${this.label} subscribed to hub events (types ${JSON.stringify(this.eventTypes)}, shard: ${
            this.shardIndex
          }/${this.totalShards})`,
        );
        this.stream = stream;
        this.stopped = false;

        stream.on("close", async () => {
          this.log.info(`HubSubscriber ${this.label} stream closed`);
          this.stopped = true;
          this.stream = null;
        });

        void this.processStream(stream);

        return ok(stream);
      })
      .orElse((e) => {
        this.log.error(`Error starting hub stream: ${e}`);
        return err(e);
      });
  }

  private async processStream(stream: ClientReadableStream<HubEvent>) {
    this.log.debug(`HubSubscriber ${this.label} started processing hub event stream`);

    while (!this.stopped) {
      if (stream.closed || stream.destroyed) {
        await this.start(); // Restart the stream
        break; // Break out since `start` will start new stream
      }

      try {
        // Do not allow hanging unresponsive connections to linger:
        let cancel = setTimeout(() => {
          this.destroy();
        }, this.connectionTimeout);
        for await (const event of stream) {
          await this.processHubEvent(event);
          clearTimeout(cancel);
          cancel = setTimeout(() => {
            this.destroy();
          }, this.connectionTimeout);
        }
        clearTimeout(cancel);
        // biome-ignore lint/suspicious/noExplicitAny: error catching
      } catch (e: any) {
        this.emit("onError", e, this.stopped);
        if (this.stopped) {
          this.log.info(`Hub event stream processing stopped: ${e.message}`);
        } else {
          this.log.info(`Hub event stream processing halted unexpectedly: ${e.message}`);
          this.log.info(`HubSubscriber ${this.label} restarting hub event stream in 5 seconds...`);
          await sleep(5_000);
          void this.start();
        }
      }
    }
  }
}

type PreProcessHandler = (events: HubEvent[], eventBytes: Uint8Array[]) => Promise<ProcessResult[]>;
type PostProcessHandler = (events: HubEvent[], eventBytes: Uint8Array[]) => Promise<void>;

type EventStreamHubSubscriberOptions = {
  beforeProcess?: PreProcessHandler;
  afterProcess?: PostProcessHandler;
};

export class EventStreamHubSubscriber extends BaseHubSubscriber {
  private eventStream: EventStreamConnection;
  private redis: RedisClient;
  public readonly streamKey: string;
  public readonly redisKey: string;
  private readonly shardKey: string;
  private eventsToAdd: [HubEvent, Buffer][];
  public eventBatchSize = 100;
  private eventBatchLastFlushedAt = 0;
  public maxTimeBetweenBatchFlushes = 200; // Millis
  public maxBatchBytesBeforeForceFlush = 2 ** 20; // 2 MiB
  private eventBatchBytes = 0;
  private beforeProcess?: PreProcessHandler;
  private afterProcess?: PostProcessHandler;
  private hub: string;

  constructor(
    label: string,
    hubClient: HubClient,
    eventStream: EventStreamConnection,
    redis: RedisClient,
    shardKey: string,
    log: Logger,
    eventTypes?: HubEventType[],
    totalShards?: number,
    shardIndex?: number,
    connectionTimeout?: number,
    options?: EventStreamHubSubscriberOptions,
  ) {
    super(label, hubClient.client, log, eventTypes, totalShards, shardIndex, connectionTimeout);
    this.eventStream = eventStream;
    this.redis = redis;
    this.streamKey = `hub:${hubClient.host}:evt:msg:${shardKey}`;
    this.redisKey = `${hubClient.host}:${shardKey}`;
    this.hub = hubClient.host;
    this.eventsToAdd = [];
    this.beforeProcess = options?.beforeProcess;
    this.afterProcess = options?.afterProcess;
    this.shardKey = shardKey;
  }

  public override async getLastEventId(): Promise<number | undefined> {
    // Migrate the old label based key if present
    const labelBasedKey = await this.redis.getLastProcessedEvent(this.label);
    if (labelBasedKey > 0) {
      await this.redis.setLastProcessedEvent(this.redisKey, labelBasedKey);
      await this.redis.setLastProcessedEvent(this.label, 0);
    }
    return await this.redis.getLastProcessedEvent(this.redisKey);
  }

  public override async processHubEvent(event: HubEvent): Promise<boolean> {
    const eventBytes = Buffer.from(HubEvent.encode(event).finish());

    this.eventBatchBytes += eventBytes.length;
    this.eventsToAdd.push([event, eventBytes]);
    if (
      this.eventsToAdd.length >= this.eventBatchSize ||
      this.eventBatchBytes >= this.maxBatchBytesBeforeForceFlush ||
      Date.now() - this.eventBatchLastFlushedAt > this.maxTimeBetweenBatchFlushes
    ) {
      const startTime = Date.now();
      // Empties the current batch
      const eventBatch = this.eventsToAdd.splice(0, this.eventsToAdd.length);
      const events = eventBatch.map(([evt, _evtBytes]) => evt);
      this.eventBatchBytes = 0;

      let eventsToWriteBatch = eventBatch;
      if (this.beforeProcess) {
        const eventBytesBatch = eventBatch.map(([_evt, evtBytes]) => evtBytes);
        const preprocessResult = await this.beforeProcess.call(this, events, eventBytesBatch);
        eventsToWriteBatch = eventBatch.filter((evt, idx) => !preprocessResult[idx]?.skipped);
      }

      const eventToWriteBatch = eventsToWriteBatch.map(([evt, _evtBytes]) => evt);
      const eventBytesToWriteBatch = eventsToWriteBatch.map(([_evt, evtBytes]) => evtBytes);
      // Copies the removed events to the stream
      await this.eventStream.add(this.streamKey, eventBytesToWriteBatch);

      this.eventBatchLastFlushedAt = Date.now();

      // biome-ignore lint/style/noNonNullAssertion: batch always has at least one event
      const [evt, eventBytes] = eventBatch[eventBatch.length - 1]!;
      const lastEventId = evt.id;
      await this.redis.setLastProcessedEvent(this.redisKey, lastEventId);

      if (this.afterProcess) {
        await this.afterProcess.call(this, eventToWriteBatch, eventBytesToWriteBatch);
      }

      const processTime = Date.now() - startTime;

      if (events[0]) {
        const startEventTimestamp = extractEventTimestamp(events[0].id);
        statsd.gauge("hub.event.subscriber.last_batch_earliest_event_timestamp", startEventTimestamp, {
          source: this.shardKey,
          hub: this.hub,
        });
      }

      statsd.gauge("hub.event.subscriber.last_batch_size", events.length, { source: this.shardKey, hub: this.hub });

      statsd.timing("hub.event.subscriber.process_time.per_event", processTime / events.length, {
        source: this.shardKey,
        hub: this.hub,
      });

      statsd.timing("hub.event.subscriber.process_time.per_batch", processTime, {
        source: this.shardKey,
        hub: this.hub,
      });
    }

    return true;
  }
}
