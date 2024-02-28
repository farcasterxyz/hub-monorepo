import {
  CastId,
  HubAsyncResult,
  HubError,
  HubEvent,
  Message,
  ReactionAddMessage,
  ReactionRemoveMessage,
  ReactionType,
  StoreType,
  getDefaultStoreLimit,
} from "@farcaster/hub-nodejs";
import {
  RustDynStore,
  rsCreateReactionStore,
  rsGetAllMessagesByFid,
  rsGetMessage,
  rsGetReactionAdd,
  rsGetReactionAddsByFid,
  rsGetReactionRemove,
  rsGetReactionRemovesByFid,
  rsGetReactionsByTarget,
  rsMerge,
  rsPruneMessages,
  revoke,
  rustErrorToHubError,
} from "../../rustfunctions.js";
import StoreEventHandler from "./storeEventHandler.js";
import { MessagesPage, PageOptions, StorePruneOptions } from "./types.js";
import { UserMessagePostfix, UserPostfix } from "../db/types.js";
import { ResultAsync, err, ok } from "neverthrow";
import RocksDB from "storage/db/rocksdb.js";

const PRUNE_TIME_LIMIT_DEFAULT = 60 * 60 * 24 * 90; // 90 days

class ReactionStore {
  private rustReactionStore: RustDynStore;
  protected _eventHandler: StoreEventHandler;

  private _postfix: UserMessagePostfix;
  private _pruneSizeLimit: number;
  protected _pruneTimeLimit: number | undefined;

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    this._pruneSizeLimit = options.pruneSizeLimit ?? this.PRUNE_SIZE_LIMIT_DEFAULT;
    this._pruneTimeLimit = options.pruneTimeLimit ?? this.PRUNE_TIME_LIMIT_DEFAULT;

    this.rustReactionStore = rsCreateReactionStore(
      db.rustDb,
      eventHandler.getRustStoreEventHandler(),
      this._pruneSizeLimit,
      this._pruneTimeLimit,
    );

    this._postfix = UserPostfix.ReactionMessage;
    this._eventHandler = eventHandler;
  }

  protected get PRUNE_SIZE_LIMIT_DEFAULT() {
    return getDefaultStoreLimit(StoreType.REACTIONS);
  }

  protected get PRUNE_TIME_LIMIT_DEFAULT() {
    return PRUNE_TIME_LIMIT_DEFAULT;
  }

  get pruneSizeLimit(): number {
    return this._pruneSizeLimit;
  }

  get pruneTimeLimit(): number | undefined {
    // No more time based pruning after the migration
    return undefined;
  }

  async merge(message: Message): Promise<number> {
    const prunableResult = await this._eventHandler.isPrunable(
      // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
      message as any,
      this._postfix,
      this.pruneSizeLimit,
      this.pruneTimeLimit,
    );
    if (prunableResult.isErr()) {
      throw prunableResult.error;
    } else if (prunableResult.value) {
      throw new HubError("bad_request.prunable", "message would be pruned");
    }

    // Encode the message to bytes
    const messageBytes = Message.encode(message).finish();
    const result = await ResultAsync.fromPromise(rsMerge(this.rustReactionStore, messageBytes), rustErrorToHubError);
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
    const result = await ResultAsync.fromPromise(revoke(this.rustReactionStore, messageBytes), rustErrorToHubError);
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
    const units = await this._eventHandler.getCurrentStorageUnitsForFid(fid);

    // Require storage cache to be synced to prune
    if (cachedCount.isErr()) {
      return err(cachedCount.error);
    }

    if (units.isErr()) {
      return err(units.error);
    }

    // Return immediately if there are no messages to prune
    if (cachedCount.value === 0) {
      return ok([]);
    }

    const result = await ResultAsync.fromPromise(
      rsPruneMessages(this.rustReactionStore, fid, cachedCount.value, units.value),
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
      rsGetMessage(this.rustReactionStore, fid, set, tsHash),
      rustErrorToHubError,
    );
    if (message_bytes.isErr()) {
      throw message_bytes.error;
    }

    return Message.decode(new Uint8Array(message_bytes.value));
  }

  async getAllMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {},
  ): Promise<MessagesPage<ReactionAddMessage | ReactionRemoveMessage>> {
    const messages_page = await rsGetAllMessagesByFid(this.rustReactionStore, fid, pageOptions);

    const messages =
      messages_page.messageBytes?.map((message_bytes) => {
        return Message.decode(new Uint8Array(message_bytes)) as ReactionAddMessage | ReactionRemoveMessage;
      }) ?? [];

    return { messages, nextPageToken: messages_page.nextPageToken };
  }

  async getReactionAdd(fid: number, type: ReactionType, target: CastId | string): Promise<ReactionAddMessage> {
    let targetCastId = Buffer.from([]);
    let targetUrl = "";

    if (typeof target === "string") {
      targetUrl = target;
    } else {
      targetCastId = Buffer.from(CastId.encode(target).finish());
    }

    const result = await ResultAsync.fromPromise(
      rsGetReactionAdd(this.rustReactionStore, fid, type, targetCastId, targetUrl),
      rustErrorToHubError,
    );
    if (result.isErr()) {
      throw result.error;
    }
    return Message.decode(new Uint8Array(result.value)) as ReactionAddMessage;
  }

  async getReactionRemove(fid: number, type: ReactionType, target: CastId | string): Promise<ReactionRemoveMessage> {
    let targetCastId = Buffer.from([]);
    let targetUrl = "";

    if (typeof target === "string") {
      targetUrl = target;
    } else {
      targetCastId = Buffer.from(CastId.encode(target).finish());
    }

    const result = await ResultAsync.fromPromise(
      rsGetReactionRemove(this.rustReactionStore, fid, type, targetCastId, targetUrl),
      rustErrorToHubError,
    );
    if (result.isErr()) {
      throw result.error;
    }
    return Message.decode(new Uint8Array(result.value)) as ReactionRemoveMessage;
  }

  async getReactionAddsByFid(
    fid: number,
    type?: ReactionType,
    pageOptions?: PageOptions,
  ): Promise<MessagesPage<ReactionAddMessage>> {
    const messages_page = await rsGetReactionAddsByFid(this.rustReactionStore, fid, type ?? 0, pageOptions ?? {});

    const messages =
      messages_page.messageBytes?.map((message_bytes) => {
        return Message.decode(new Uint8Array(message_bytes)) as ReactionAddMessage;
      }) ?? [];

    return { messages, nextPageToken: messages_page.nextPageToken };
  }

  async getReactionRemovesByFid(
    fid: number,
    type?: ReactionType,
    pageOptions?: PageOptions,
  ): Promise<MessagesPage<ReactionRemoveMessage>> {
    const message_page = await rsGetReactionRemovesByFid(this.rustReactionStore, fid, type ?? 0, pageOptions ?? {});

    const messages =
      message_page.messageBytes?.map((message_bytes) => {
        return Message.decode(new Uint8Array(message_bytes)) as ReactionRemoveMessage;
      }) ?? [];

    return { messages, nextPageToken: message_page.nextPageToken };
  }

  async getAllReactionMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {},
  ): Promise<MessagesPage<ReactionAddMessage | ReactionRemoveMessage>> {
    return await this.getAllMessagesByFid(fid, pageOptions);
  }

  async getReactionsByTarget(
    target: CastId | string,
    type?: ReactionType,
    pageOptions: PageOptions = {},
  ): Promise<MessagesPage<ReactionAddMessage>> {
    let targetCastId = Buffer.from([]);
    let targetUrl = "";

    if (typeof target === "string") {
      targetUrl = target;
    } else {
      targetCastId = Buffer.from(CastId.encode(target).finish());
    }

    const message_page = await rsGetReactionsByTarget(
      this.rustReactionStore,
      targetCastId,
      targetUrl,
      type ?? ReactionType.NONE,
      pageOptions,
    );

    const messages =
      message_page.messageBytes?.map((message_bytes) => {
        return Message.decode(new Uint8Array(message_bytes)) as ReactionAddMessage;
      }) ?? [];

    return { messages, nextPageToken: message_page.nextPageToken };
  }
}

export default ReactionStore;
