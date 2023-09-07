import { ClientReadableStream, HubEvent, HubEventType, HubRpcClient } from "@farcaster/hub-nodejs";
import { err, ok, Result } from "neverthrow";
import { Logger } from "pino";
import { TypedEmitter } from "tiny-typed-emitter";

interface HubEvents {
  event: (hubEvent: HubEvent) => void;
}

export class HubSubscriber extends TypedEmitter<HubEvents> {
  public hubClient: HubRpcClient;
  public stopped = true;
  private log: Logger;

  private stream: ClientReadableStream<HubEvent> | null = null;

  constructor(hubClient: HubRpcClient, log: Logger) {
    super();
    this.hubClient = hubClient;
    this.log = log;
  }

  public stop() {
    this.stream?.cancel();
    this.stopped = true;
    this.log.info("Stopped HubSubscriber");
  }

  public destroy() {
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

  public async start(fromId?: number) {
    this.log.info("Starting HubSubscriber");

    const hubClientReady = await this._waitForReadyHubClient();
    if (hubClientReady.isErr()) {
      this.log.error(`Failed to connect to hub: ${hubClientReady.error}`);
      return err(hubClientReady.error);
    }
    this.log.info("Connected to hub");

    const subscribeParams: { eventTypes: HubEventType[]; fromId?: number } = {
      eventTypes: [
        HubEventType.MERGE_MESSAGE,
        HubEventType.REVOKE_MESSAGE,
        HubEventType.PRUNE_MESSAGE,
        HubEventType.MERGE_ID_REGISTRY_EVENT,
        HubEventType.MERGE_NAME_REGISTRY_EVENT,
        HubEventType.MERGE_ON_CHAIN_EVENT,
        HubEventType.MERGE_USERNAME_PROOF,
      ],
      fromId,
    };

    const subscribeRequest = await this.hubClient.subscribe(subscribeParams);
    return subscribeRequest
      .andThen((stream) => {
        this.log.info("Subscribed to hub events");
        this.stream = stream;
        this.stopped = false;

        stream.on("close", async () => {
          this.log.info("HubSubscriber stream closed");
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
    this.log.debug("Started hub event stream processing");
    try {
      for await (const event of stream) {
        const fnLog = this.log.child({ eventId: event.id, eventType: event.type });
        fnLog.debug(`Processing event ${event.id} (${event.type})`);
        this.emit("event", event);
      }
      // rome-ignore lint/suspicious/noExplicitAny: error catching
    } catch (e: any) {
      this.log.info(`Hub event stream processing halted ${e.message}`);
    }
  }
}
