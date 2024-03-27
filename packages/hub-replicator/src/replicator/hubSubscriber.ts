import { ClientReadableStream, HubEvent, HubEventType, HubResult, HubRpcClient } from "@farcaster/hub-nodejs";
import { err, ok, Result } from "neverthrow";
import { Logger } from "../log";
import { TypedEmitter } from "tiny-typed-emitter";

interface HubEventsEmitter {
  event: (hubEvent: HubEvent) => void;
  onError: (error: Error, stopped: boolean) => void;
}

export abstract class HubSubscriber extends TypedEmitter<HubEventsEmitter> {
  public async start(fromId?: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public stop(): void {
    throw new Error("Method not implemented.");
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

export class HubSubscriberImpl extends HubSubscriber {
  public label: string;
  public hubClient: HubRpcClient;
  public stopped = true;
  private log: Logger;
  private eventTypes: HubEventType[];

  private stream: ClientReadableStream<HubEvent> | null = null;

  constructor(label: string, hubClient: HubRpcClient, log: Logger, eventTypes?: HubEventType[]) {
    super();
    this.label = label;
    this.hubClient = hubClient;
    this.log = log;
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
      this.hubClient?.$.waitForReady(Date.now() + 500, (e) => {
        return e ? resolve(err(e)) : resolve(ok(undefined));
      });
    });
  }

  public override async start(fromId?: number) {
    this.log.info(`Starting HubSubscriber ${this.label}`);

    const hubClientReady = await this._waitForReadyHubClient();
    if (hubClientReady.isErr()) {
      this.log.error(`HubSubscriber ${this.label} failed to connect to hub: ${hubClientReady.error}`);
      throw hubClientReady.error;
    }
    this.log.info(`HubSubscriber ${this.label} connected to hub`);

    const subscribeParams: { eventTypes: HubEventType[]; fromId?: number | undefined } = {
      eventTypes: this.eventTypes,
      fromId,
    };

    const subscribeRequest = await this.hubClient.subscribe(subscribeParams);
    subscribeRequest
      .andThen((stream) => {
        this.log.info(
          `HubSubscriber ${this.label} subscribed to hub events (types ${JSON.stringify(this.eventTypes)})`,
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
    try {
      for await (const event of stream) {
        this.emit("event", event);
      }
      // biome-ignore lint/suspicious/noExplicitAny: error catching
    } catch (e: any) {
      this.emit("onError", e, this.stopped);
      // if (this.stopped) {
      //   this.log.info(`Hub event stream processing stopped: ${e.message}`);
      // } else {
      //   this.log.info(`Hub event stream processing halted unexpectedly: ${e.message}`);
      //   this.log.info(`HubSubscriber ${this.label} restarting hub event stream in 5 seconds...`);
      //   await sleep(5_000);
      //   void this.start();
      // }
    }
  }
}
