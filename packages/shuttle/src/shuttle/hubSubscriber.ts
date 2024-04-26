import { ClientReadableStream, HubEvent, HubEventType, HubResult, HubRpcClient } from "@farcaster/hub-nodejs";
import { err, ok, Result } from "neverthrow";
import { Logger } from "../log";
import { TypedEmitter } from "tiny-typed-emitter";
import { EventStreamConnection } from "./eventStream";
import { sleep } from "../utils";
import { RedisClient } from "./redis";
import { HubClient } from "./hub";

interface HubEventsEmitter {
  event: (hubEvent: HubEvent) => void;
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

  constructor(
    label: string,
    hubClient: HubRpcClient,
    log: Logger,
    eventTypes?: HubEventType[],
    totalShards?: number,
    shardIndex?: number,
  ) {
    super();
    this.label = label;
    this.hubClient = hubClient;
    this.log = log;
    this.totalShards = totalShards;
    this.shardIndex = shardIndex;
    this.eventTypes = eventTypes || DEFAULT_EVENT_TYPES;
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
      this.log.warn("No last hub event ID found, starting from beginning");
    }

    const subscribeParams = {
      eventTypes: this.eventTypes,
      totalShards: this.totalShards,
      shardIndex: this.shardIndex,
      fromId: undefined,
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
        for await (const event of stream) {
          await this.processHubEvent(event);
        }
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

export class EventStreamHubSubscriber extends BaseHubSubscriber {
  private eventStream: EventStreamConnection;
  private redis: RedisClient;
  public readonly streamKey: string;
  public readonly redisKey: string;
  private eventsToAdd: HubEvent[];
  private eventBatchSize = 100;

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
  ) {
    super(label, hubClient.client, log, eventTypes, totalShards, shardIndex);
    this.eventStream = eventStream;
    this.redis = redis;
    this.streamKey = `hub:${hubClient.host}:evt:msg:${shardKey}`;
    this.redisKey = `${hubClient.host}:${shardKey}`;
    this.eventsToAdd = [];
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
    this.eventsToAdd.push(event);
    if (this.eventsToAdd.length >= this.eventBatchSize) {
      let lastEventId: number | undefined;
      for (const evt of this.eventsToAdd) {
        await this.eventStream.add(this.streamKey, Buffer.from(HubEvent.encode(evt).finish()));
        lastEventId = evt.id;
      }
      if (lastEventId) {
        await this.redis.setLastProcessedEvent(this.redisKey, lastEventId);
      }
      this.eventsToAdd = [];
    }

    return true;
  }
}
