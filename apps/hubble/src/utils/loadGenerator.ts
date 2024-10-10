import {
  Metadata,
  getInsecureHubRpcClient,
  getSSLHubRpcClient,
  toFarcasterTime,
  TrieNodePrefix,
  HubResult,
  HubRpcClient,
  Message,
  HubError,
  MessagesResponse,
  MessageType,
  StreamFetchResponse,
  ClientDuplexStream,
  FidTimestampRequest,
  HubErrorCode,
  StreamFetchRequest,
  getFarcasterTime,
  HubEventType,
  HubEvent,
  ClientReadableStream,
  Factories,
  getAuthMetadata,
} from "@farcaster/hub-nodejs";

import { Worker } from "worker_threads";
import { TypedEmitter } from "tiny-typed-emitter";

import { appendFile } from "fs/promises";

import { addressInfoFromGossip, addressInfoToString } from "./p2p.js";

import { SyncId, timestampToPaddedTimestampPrefix } from "../network/sync/syncId.js";
import { err, ok, Result } from "neverthrow";
import { randomUUID } from "crypto";
import { rpc } from "viem/utils";
import { messageToLog } from "./logger.js";

const MAX_FID = 500_000;
const MAX_PAGE_SIZE = 500;

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
  protected eventTypes: HubEventType[];

  private stream: ClientReadableStream<HubEvent> | null = null;
  private totalShards: number | undefined;
  private shardIndex: number | undefined;

  constructor(
    label: string,
    hubClient: HubRpcClient,
    eventTypes?: HubEventType[],
    totalShards?: number,
    shardIndex?: number,
  ) {
    super();
    this.label = label;
    this.hubClient = hubClient;

    this.totalShards = totalShards;
    this.shardIndex = shardIndex;
    this.eventTypes = eventTypes || DEFAULT_EVENT_TYPES;
  }

  public override stop() {
    this.stream?.cancel();
    this.stopped = true;
    console.log(`Stopped HubSubscriber ${this.label}`);
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
    console.log(`Starting HubSubscriber ${this.label}`);

    const hubClientReady = await this._waitForReadyHubClient();
    if (hubClientReady.isErr()) {
      console.log(`HubSubscriber ${this.label} failed to connect to hub: ${hubClientReady.error}`);
      throw hubClientReady.error;
    }
    console.log(`HubSubscriber ${this.label} connected to hub`);

    const fromId = await this.getLastEventId();
    if (fromId) {
      console.log(`HubSubscriber ${this.label} Found last hub event ID: ${fromId}`);
    } else {
      console.log("No last hub event ID found, starting from beginning");
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
        console.log(
          `HubSubscriber ${this.label} subscribed to hub events (types ${JSON.stringify(this.eventTypes)}, shard: ${
            this.shardIndex
          }/${this.totalShards})`,
        );
        this.stream = stream;
        this.stopped = false;

        stream.on("close", async () => {
          console.log(`HubSubscriber ${this.label} stream closed`);
          this.stopped = true;
          this.stream = null;
        });

        void this.processStream(stream);

        return ok(stream);
      })
      .orElse((e) => {
        console.log(`Error starting hub stream: ${e}`);
        return err(e);
      });
  }

  private async processStream(stream: ClientReadableStream<HubEvent>) {
    console.log(`HubSubscriber ${this.label} started processing hub event stream`);

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
          console.log(`Hub event stream processing stopped: ${e.message}`);
        } else {
          console.log(`Hub event stream processing halted unexpectedly: ${e.message}`);
          console.log(`HubSubscriber ${this.label} restarting hub event stream in 5 seconds...`);
          await new Promise((r) => setTimeout(r, 5_000));
          void this.start();
        }
      }
    }
  }
}

export class MessageReconciliation {
  private client: HubRpcClient;
  private stream: ClientDuplexStream<StreamFetchRequest, StreamFetchResponse> | undefined;

  constructor(client: HubRpcClient) {
    this.client = client;
    this.establishStream();
  }

  async establishStream() {
    const maybeStream = await this.client.streamFetch();
    if (maybeStream.isOk()) {
      this.stream = maybeStream.value;
    } else {
      console.log(maybeStream.error, "could not establish stream");
    }
  }

  async close() {
    if (this.stream) {
      this.stream.cancel();
      this.stream = undefined;
    }
  }

  public async *allHubMessagesOfTypeForFid(
    fid: number,
    type: MessageType,
    startTimestamp?: number,
    stopTimestamp?: number,
  ) {
    let fn;
    switch (type) {
      case MessageType.CAST_ADD:
        fn = this.getAllCastMessagesByFidInBatchesOf;
        break;
      case MessageType.REACTION_ADD:
        fn = this.getAllReactionMessagesByFidInBatchesOf;
        break;
      case MessageType.LINK_ADD:
        fn = this.getAllLinkMessagesByFidInBatchesOf;
        break;
      case MessageType.VERIFICATION_ADD_ETH_ADDRESS:
        fn = this.getAllVerificationMessagesByFidInBatchesOf;
        break;
      case MessageType.USER_DATA_ADD:
        fn = this.getAllUserDataMessagesByFidInBatchesOf;
        break;
      default:
        throw `Unknown message type ${type}`;
    }
    for await (const messages of fn.call(this, fid, MAX_PAGE_SIZE, startTimestamp, stopTimestamp)) {
      yield messages as Message[];
    }
  }

  private async doCallWithFailover(
    request: Partial<StreamFetchRequest>,
    fallback: () => Promise<HubResult<MessagesResponse>>,
  ) {
    const id = randomUUID();
    const result = new Promise<HubResult<MessagesResponse>>((resolve) => {
      if (!this.stream) {
        resolve(fallback());
        return;
      }
      const process = async (response: StreamFetchResponse) => {
        if (!this.stream) {
          resolve(err(new HubError("unavailable", "unexpected stream termination")));
          return;
        }
        this.stream.off("data", process);
        if (response.idempotencyKey !== id || !response.messages) {
          if (response?.error) {
            resolve(err(new HubError(response.error.errCode as HubErrorCode, { message: response.error.message })));
            return;
          }

          this.stream.cancel();
          this.stream = undefined;
          resolve(fallback());
        } else {
          resolve(ok(response.messages));
        }
      };
      this.stream.on("data", process);
    });

    this.stream?.write({
      ...request,
      idempotencyKey: id,
    });

    return await result;
  }

  private async getAllCastMessagesByFid(request: FidTimestampRequest) {
    return await this.doCallWithFailover({ castMessagesByFid: request }, () =>
      this.client.getAllCastMessagesByFid(request),
    );
  }

  private async getAllReactionMessagesByFid(request: FidTimestampRequest) {
    return await this.doCallWithFailover({ reactionMessagesByFid: request }, () =>
      this.client.getAllReactionMessagesByFid(request),
    );
  }

  private async getAllLinkMessagesByFid(request: FidTimestampRequest) {
    return await this.doCallWithFailover({ linkMessagesByFid: request }, () =>
      this.client.getAllLinkMessagesByFid(request),
    );
  }

  private async getAllVerificationMessagesByFid(request: FidTimestampRequest) {
    return await this.doCallWithFailover({ verificationMessagesByFid: request }, () =>
      this.client.getAllVerificationMessagesByFid(request),
    );
  }

  private async getAllUserDataMessagesByFid(request: FidTimestampRequest) {
    return await this.doCallWithFailover({ userDataMessagesByFid: request }, () =>
      this.client.getAllUserDataMessagesByFid(request),
    );
  }

  private async *getAllCastMessagesByFidInBatchesOf(
    fid: number,
    pageSize: number,
    startTimestamp?: number,
    stopTimestamp?: number,
  ) {
    let result = await this.getAllCastMessagesByFid({ pageSize, fid, startTimestamp, stopTimestamp });
    for (;;) {
      if (result.isErr()) {
        throw new Error(`Unable to get all casts for FID ${fid}: ${result.error?.message}`);
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.getAllCastMessagesByFid({ pageSize, pageToken, fid, startTimestamp, stopTimestamp });
    }
  }

  private async *getAllReactionMessagesByFidInBatchesOf(
    fid: number,
    pageSize: number,
    startTimestamp?: number,
    stopTimestamp?: number,
  ) {
    let result = await this.getAllReactionMessagesByFid({ pageSize, fid, startTimestamp, stopTimestamp });
    for (;;) {
      if (result.isErr()) {
        throw new Error(`Unable to get all reactions for FID ${fid}: ${result.error?.message}`);
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.getAllReactionMessagesByFid({
        pageSize,
        pageToken,
        fid,
        startTimestamp,
        stopTimestamp,
      });
    }
  }

  private async *getAllLinkMessagesByFidInBatchesOf(
    fid: number,
    pageSize: number,
    startTimestamp?: number,
    stopTimestamp?: number,
  ) {
    let result = await this.getAllLinkMessagesByFid({ pageSize, fid, startTimestamp, stopTimestamp });
    for (;;) {
      if (result.isErr()) {
        throw new Error(`Unable to get all links for FID ${fid}: ${result.error?.message}`);
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.getAllLinkMessagesByFid({ pageSize, pageToken, fid, startTimestamp, stopTimestamp });
    }

    if (!this.stream) {
      let deltaResult = await this.client.getLinkCompactStateMessageByFid({ fid, pageSize });
      for (;;) {
        if (deltaResult.isErr()) {
          throw new Error(`Unable to get all link compact results for FID ${fid}: ${deltaResult.error?.message}`);
        }

        const { messages, nextPageToken: pageToken } = deltaResult.value;

        yield messages;

        if (!pageToken?.length) break;
        deltaResult = await this.client.getLinkCompactStateMessageByFid({ pageSize, pageToken, fid });
      }
    }
  }

  private async *getAllVerificationMessagesByFidInBatchesOf(
    fid: number,
    pageSize: number,
    startTimestamp?: number,
    stopTimestamp?: number,
  ) {
    let result = await this.getAllVerificationMessagesByFid({ pageSize, fid, startTimestamp, stopTimestamp });
    for (;;) {
      if (result.isErr()) {
        throw new Error(`Unable to get all verifications for FID ${fid}: ${result.error?.message}`);
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.getAllVerificationMessagesByFid({
        pageSize,
        pageToken,
        fid,
        startTimestamp,
        stopTimestamp,
      });
    }
  }

  private async *getAllUserDataMessagesByFidInBatchesOf(
    fid: number,
    pageSize: number,
    startTimestamp?: number,
    stopTimestamp?: number,
  ) {
    let result = await this.getAllUserDataMessagesByFid({ pageSize, fid, startTimestamp, stopTimestamp });
    for (;;) {
      if (result.isErr()) {
        throw new Error(`Unable to get all user data messages for FID ${fid}: ${result.error?.message}`);
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.getAllUserDataMessagesByFid({
        pageSize,
        pageToken,
        fid,
        startTimestamp,
        stopTimestamp,
      });
    }
  }
}

const START_TIME_OFFSET = 604800; // 1 week in seconds
const computeStartTimestamp = () => {
  const currentTime = getFarcasterTime();
  if (currentTime.isErr()) {
    return err(currentTime.error);
  }

  return ok(currentTime.value - START_TIME_OFFSET);
};

const getDataForFid = async (
  fid: number,
  startTimestamp: number,
  reconciler: MessageReconciliation,
  types: MessageType[],
) => {
  for (const type of types) {
    try {
      for await (const messages of reconciler.allHubMessagesOfTypeForFid(fid, type, startTimestamp)) {
        console.log(`Received ${messages.length} messages for fid ${fid} for type ${type}`);
      }
    } catch (e) {
      console.log("Error getting messages for fid", fid);
    }
  }
};

export interface ValidationWorkerMessageWithMessage {
  id: number;
  message: Message;
  errCode?: never;
  errMessage?: never;
}

export interface ValidationWorkerMessageWithError {
  id: number;
  message?: never;
  errCode: HubErrorCode;
  errMessage: string;
}

export interface ValidationWorkerData {
  l2RpcUrl: string;
  ethMainnetRpcUrl: string;
}

const getWorkerData = (): ValidationWorkerData => {
  return {
    ethMainnetRpcUrl:
      "https://eth-mainnet.g.alchemy.com/v2/sTNOcFDFkXuc1UTyR4tdXpyOaqjPF2yp,https://mainnet.infura.io/v3/498b3446c70b4e4d8d979f4272422df2",
    l2RpcUrl:
      "https://opt-mainnet.g.alchemy.com/v2/7XraarGJevWyyHCqKA49GIW50Fw4-3qt,https://optimism-mainnet.infura.io/v3/498b3446c70b4e4d8d979f4272422df2",
  };
};

// The type of response that the worker sends back to the main thread
export type ValidationWorkerMessage = ValidationWorkerMessageWithMessage | ValidationWorkerMessageWithError;

const repro = async () => {
  const workerPath = "./build/storage/engine/validation.worker.js";
  let validationWorker;
  try {
    const validationWorkerHandler = (data: ValidationWorkerMessage) => {
      const { id, message, errCode, errMessage } = data;

      if (message) {
        ok(message);
      } else {
        err(new HubError(errCode, errMessage));
      }
    };

    const workerData = getWorkerData();
    validationWorker = new Worker(workerPath, {
      workerData,
      execArgv: [`--inspect-port=${9231}`],
    });
    validationWorker.on("message", validationWorkerHandler);
  } catch (e) {
    console.log("Error", e);
  }

  for (let i = 0; i < 10_000; i++) {
    validationWorker?.postMessage({ id: i, message: await Factories.Message.create() });
  }
};

export class SimpleSubscriber extends BaseHubSubscriber {
  private messages: Message[];
  private submitRpcClient: HubRpcClient;
  private validationWorker: Worker | undefined;
  private nextId: number;

  constructor(
    label: string,
    hubClient: HubRpcClient,
    submitRpcClient: HubRpcClient,
    eventTypes?: HubEventType[],
    totalShards?: number,
    shardIndex?: number,
  ) {
    super(label, hubClient, eventTypes, totalShards, shardIndex);
    this.messages = [];
    this.submitRpcClient = submitRpcClient;
    this.nextId = 0;
    const workerPath = "./build/storage/engine/validation.worker.js";
    try {
      const validationWorkerHandler = (data: ValidationWorkerMessage) => {
        const { id, message, errCode, errMessage } = data;

        if (message) {
          ok(message);
        } else {
          err(new HubError(errCode, errMessage));
        }
      };

      const workerData = getWorkerData();
      this.validationWorker = new Worker(workerPath, {
        workerData,
        execArgv: [`--inspect-port=${9231}`],
      });

      this.validationWorker.on("message", validationWorkerHandler);
    } catch (e) {
      console.log("Error", e);
    }
  }

  public override async processHubEvent(event: HubEvent) {
    if (event.type === HubEventType.MERGE_MESSAGE) {
      if (event.mergeMessageBody === undefined) {
        throw new Error("Unexpected empty mergeMessageBody");
      }
      if (event.mergeMessageBody.message === undefined) {
        throw new Error("Unexpected empty message");
      }
      this.messages.push(event.mergeMessageBody.message);
      if (this.messages.length % 100 === 0) {
        console.log(`Received ${this.messages.length} messages`);
      }
    }

    // const username = process.env["AUTH_USERNAME"];
    // if (username === undefined) {
    //   throw new Error("Username required");
    // }

    // const password = process.env["AUTH_PASSWORD"];

    // if (password === undefined) {
    //   throw new Error("Password required");
    // }

    // const authMetadata = getAuthMetadata(username, password);
    if (this.messages.length > 10_000) {
      //   console.log("Attempting to submit messages");
      for (const message of this.messages) {
        // console.log(messageToLog(message));
        this.validationWorker?.postMessage({ id: this.nextId, message });
        this.nextId++;
      }
      //   const response = await this.submitRpcClient.submitBulkMessages({ messages: this.messages }, authMetadata);
      //   console.log(response);
      this.messages = [];
    }

    return true;
  }
}
// const realMessageHex =
//   "0a2b080310f70e18e8f8f72720013a1d0801121908c3201214cf64961ebcdc9089a1843fbe6a175c53228935871214fafa8845520220e317d54800beff9b500e84b9a418012240640e0e1e8e281a5d6fcf76b568e8959e18ffdb3c9cf99d89a897f3f987341329b7f1bf66a14fad538eb17caec734c94b19ecf8371441023c51f0227333c7be0128013220f3c0956b7c78899a1633c3b4a650835043e50d78a56d6b7d8b28735ae11b9c74";

const submitBulkMessages = async (rpcClient: HubRpcClient) => {
  const messages = [];
  //   const buf = Buffer.from(realMessageHex);
  const count = 12_000;
  for (let i = 0; i < count; i++) {
    const msg = await Factories.Message.create({
      data: { fid: i + 1, timestamp: getFarcasterTime()._unsafeUnwrap() - i * 100 },
    });
    messages.push(msg);
  }
  const response = await rpcClient.submitBulkMessages({ messages });
  console.log(response);
};

const generate = async () => {
  const kassadRpcClient = getSSLHubRpcClient("kassad.merkle.zone:2283");
  const shaneRpcClient = getSSLHubRpcClient("shane.merkle.zone:2283");

  const subscriber = new SimpleSubscriber("dummy", kassadRpcClient, shaneRpcClient);
  subscriber.start().catch((e) => {
    console.log("Error with susbscribe", e);
  });

  // setInterval(() => {
  //   submitBulkMessages(rpcClient);
  // }, 10_000);

  //   const subscriber = new SimpleSubscriber("dummy", rpcClient);
  //   subscriber.start().catch((e) => {
  //     console.log("Error with susbscribe", e);
  //   });
  //   const reconciler = new MessageReconciliation(rpcClient);
  //   const types = [MessageType.CAST_ADD, MessageType.LINK_ADD, MessageType.VERIFICATION_ADD_ETH_ADDRESS];
  //   const startTimestamp = computeStartTimestamp()._unsafeUnwrap();

  //   for (let fid = 0; fid < MAX_FID; fid++) {
  //     // don't await
  //     getDataForFid(fid, startTimestamp, reconciler, types);
  //   }
};

generate().catch((e) => {
  console.log("Error in script", e);
});
