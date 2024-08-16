import { HubAsyncResult, HubError, HubEvent, HubResult, Message } from "@farcaster/hub-nodejs";
import {
  RustDynStore,
  rsGetAllMessagesByFid,
  rsGetMessage,
  rsMerge,
  rsPruneMessages,
  revoke,
  rustErrorToHubError,
  rsMergeMany,
} from "../../rustfunctions.js";
import StoreEventHandler from "./storeEventHandler.js";
import { MessagesPage, PageOptions } from "./types.js";
import { UserMessagePostfix } from "../db/types.js";
import RocksDB from "../db/rocksdb.js";
import { ResultAsync, err, ok } from "neverthrow";
import { messageDecode } from "../../storage/db/message.js";

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

const deepPartialEquals = <T>(partial: DeepPartial<T>, whole: T) => {
  if (typeof partial === "object") {
    for (const key in partial) {
      if (partial[key] !== undefined) {
        // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
        if (!deepPartialEquals(partial[key] as any, whole[key as keyof T] as any)) {
          return false;
        }
      }
    }
  } else {
    return partial === whole;
  }

  return true;
};

/**
 * Base class with common methods for all stores implemented in Rust
 */
export abstract class RustStoreBase<TAdd extends Message, TRemove extends Message> {
  protected _eventHandler: StoreEventHandler;
  protected _rustStore: RustDynStore;

  protected _postfix: UserMessagePostfix;
  protected _pruneSizeLimit: number;

  constructor(
    db: RocksDB,
    rustStore: RustDynStore,
    postfix: UserMessagePostfix,
    eventHandler: StoreEventHandler,
    pruneSizeLimit: number,
  ) {
    this._rustStore = rustStore;
    this._pruneSizeLimit = pruneSizeLimit;

    this._postfix = postfix;
    this._eventHandler = eventHandler;
  }

  get pruneSizeLimit(): number {
    return this._pruneSizeLimit;
  }

  get postfix(): UserMessagePostfix {
    return this._postfix;
  }

  async mergeMessages(messages: Message[]): Promise<Map<number, HubResult<number>>> {
    const mergeResults: Map<number, HubResult<number>> = new Map();

    // First, filter out any prunable messages
    const encodedMessages: { i: number; bytes: Uint8Array }[] = [];
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i] as Message;
      const prunableResult = await this._eventHandler.isPrunable(
        // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
        message as any,
        this._postfix,
        this._pruneSizeLimit,
      );
      if (prunableResult.isErr()) {
        mergeResults.set(i, err(prunableResult.error));
      } else if (prunableResult.value) {
        mergeResults.set(i, err(new HubError("bad_request.prunable", "message would be pruned")));
      } else {
        encodedMessages.push({ i, bytes: Message.encode(message).finish() });
      }
    }

    const results: HubResult<Map<number, HubResult<Buffer>>> = await ResultAsync.fromPromise(
      rsMergeMany(
        this._rustStore,
        encodedMessages.map((m) => m.bytes),
      ),
      rustErrorToHubError,
    );

    if (results.isErr()) {
      // Set all the results to the error
      for (const { i } of encodedMessages) {
        mergeResults.set(i, err(results.error));
      }
      return mergeResults;
    }

    // Process the results
    for (const [j, result] of results.value) {
      const i = encodedMessages[j]?.i as number;
      if (result.isErr()) {
        mergeResults.set(i, err(result.error));
      } else {
        const hubEvent = HubEvent.decode(new Uint8Array(result.value));
        void this._eventHandler.processRustCommitedTransaction(hubEvent);
        mergeResults.set(i, ok(hubEvent.id));
      }
    }

    return mergeResults;
  }

  async merge(message: Message): Promise<number> {
    const prunableResult = await this._eventHandler.isPrunable(
      // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
      message as any,
      this._postfix,
      this._pruneSizeLimit,
    );
    if (prunableResult.isErr()) {
      throw prunableResult.error;
    } else if (prunableResult.value) {
      throw new HubError("bad_request.prunable", "message would be pruned");
    }

    // Encode the message to bytes
    const messageBytes = Message.encode(message).finish();
    const result = await ResultAsync.fromPromise(rsMerge(this._rustStore, messageBytes), rustErrorToHubError);
    if (result.isErr()) {
      throw result.error;
    }

    // Read the result bytes as a HubEvent
    const resultBytes = new Uint8Array(result.value);
    const hubEvent = HubEvent.decode(resultBytes);

    void this._eventHandler.processRustCommitedTransaction(hubEvent);
    return hubEvent.id;
  }

  async revoke(message: Message): HubAsyncResult<number> {
    const messageBytes = Message.encode(message).finish();
    const result = await ResultAsync.fromPromise(revoke(this._rustStore, messageBytes), rustErrorToHubError);
    if (result.isErr()) {
      return err(result.error);
    }

    const resultBytes = new Uint8Array(result.value);
    const hubEvent = HubEvent.decode(resultBytes);

    void this._eventHandler.processRustCommitedTransaction(hubEvent);
    return ok(hubEvent.id);
  }

  async pruneMessages(fid: number): HubAsyncResult<number[]> {
    const cachedCount = await this._eventHandler.getCacheMessageCount(fid, this._postfix, false);
    let maxCount = await this._eventHandler.getMaxMessageCount(fid, this._postfix);

    // Require storage cache to be synced to prune
    if (cachedCount.isErr()) {
      return err(cachedCount.error);
    }

    if (maxCount.isErr()) {
      return err(maxCount.error);
    }

    if (this._pruneSizeLimit > 0 && this._pruneSizeLimit < maxCount.value) {
      maxCount = ok(this._pruneSizeLimit);
    }

    // Return immediately if there are no messages to prune
    if (cachedCount.value <= maxCount.value) {
      return ok([]);
    }

    const result = await ResultAsync.fromPromise(
      rsPruneMessages(this._rustStore, fid, cachedCount.value, maxCount.value),
      rustErrorToHubError,
    );
    if (result.isErr()) {
      return err(result.error);
    }

    // Read the result bytes as an array of HubEvents
    const commits = [];
    for (const resultBytes of result.value) {
      const hubEvent = HubEvent.decode(new Uint8Array(resultBytes));
      commits.push(hubEvent.id);
      void this._eventHandler.processRustCommitedTransaction(hubEvent);
    }

    return ok(commits);
  }

  async getMessage(fid: number, set: UserMessagePostfix, tsHash: Uint8Array): Promise<Message> {
    const message_bytes = await ResultAsync.fromPromise(
      rsGetMessage(this._rustStore, fid, set, tsHash),
      rustErrorToHubError,
    );
    if (message_bytes.isErr()) {
      throw message_bytes.error;
    }

    return messageDecode(new Uint8Array(message_bytes.value));
  }

  async getAllMessagesByFid(fid: number, pageOptions: PageOptions = {}): Promise<MessagesPage<TAdd | TRemove>> {
    const messages_page = await rsGetAllMessagesByFid(this._rustStore, fid, pageOptions);

    const messages =
      messages_page.messageBytes?.map((message_bytes) => {
        return messageDecode(new Uint8Array(message_bytes)) as TAdd | TRemove;
      }) ?? [];

    return { messages, nextPageToken: messages_page.nextPageToken };
  }
}
