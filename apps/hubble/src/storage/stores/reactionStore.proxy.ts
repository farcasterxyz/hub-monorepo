import {
  CastId,
  HubError,
  HubErrorCode,
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
  createReactionStore,
  db_clear,
  getAllMessagesByFid,
  getMessage,
  getReactionAdd,
  getReactionAddsByFid,
  getReactionRemove,
  getReactionRemovesByFid,
  getReactionsByTarget,
  merge,
  rustErrorToHubError,
} from "../../rustfunctions.js";
import StoreEventHandler from "./storeEventHandler.js";
import { MessagesPage, PageOptions, StorePruneOptions } from "./types.js";
import { UserMessagePostfix, UserPostfix } from "../db/types.js";
import { ResultAsync } from "neverthrow";

const PRUNE_TIME_LIMIT_DEFAULT = 60 * 60 * 24 * 90; // 90 days

export class ReactionStoreProxy {
  private rustReactionStore: RustDynStore;
  protected _eventHandler: StoreEventHandler;

  private _postfix: UserMessagePostfix;
  private _pruneSizeLimit: number;
  protected _pruneTimeLimit: number | undefined;

  constructor(eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    this.rustReactionStore = createReactionStore();

    this._postfix = UserPostfix.ReactionMessage;
    this._eventHandler = eventHandler;

    this._pruneSizeLimit = options.pruneSizeLimit ?? this.PRUNE_SIZE_LIMIT_DEFAULT;
    this._pruneTimeLimit = options.pruneTimeLimit ?? this.PRUNE_TIME_LIMIT_DEFAULT;
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

  async db_clear(): Promise<void> {
    await db_clear(this.rustReactionStore);
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
    const result = await ResultAsync.fromPromise(merge(this.rustReactionStore, messageBytes), rustErrorToHubError);
    if (result.isErr()) {
      throw result.error;
    }

    // Read the result bytes as a HubEvent
    const resultBytes = new Uint8Array(result.value);
    const hubEvent = HubEvent.decode(resultBytes);

    void this._eventHandler.processRustCommitedTransaction(hubEvent);
    return hubEvent.id;
  }

  async getMessage(fid: number, set: UserMessagePostfix, tsHash: Uint8Array): Promise<Message> {
    const message_bytes = await ResultAsync.fromPromise(
      getMessage(this.rustReactionStore, fid, set, tsHash),
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
    const message_bytes_array: Uint8Array[] = await getAllMessagesByFid(this.rustReactionStore, fid, pageOptions);

    const messages = message_bytes_array.map((message_bytes) => {
      return Message.decode(new Uint8Array(message_bytes)) as ReactionAddMessage | ReactionRemoveMessage;
    });

    return { messages };
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
      getReactionAdd(this.rustReactionStore, fid, type, targetCastId, targetUrl),
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
      getReactionRemove(this.rustReactionStore, fid, type, targetCastId, targetUrl),
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
    const message_bytes_array = await getReactionAddsByFid(this.rustReactionStore, fid, type ?? 0, pageOptions ?? {});

    const messages = message_bytes_array.map((message_bytes) => {
      return Message.decode(new Uint8Array(message_bytes)) as ReactionAddMessage;
    });

    return { messages };
  }

  async getReactionRemovesByFid(
    fid: number,
    type?: ReactionType,
    pageOptions?: PageOptions,
  ): Promise<MessagesPage<ReactionRemoveMessage>> {
    const message_bytes_array = await getReactionRemovesByFid(
      this.rustReactionStore,
      fid,
      type ?? 0,
      pageOptions ?? {},
    );

    const messages = message_bytes_array.map((message_bytes) => {
      return Message.decode(new Uint8Array(message_bytes)) as ReactionRemoveMessage;
    });

    return { messages };
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

    const message_bytes_array = await getReactionsByTarget(
      this.rustReactionStore,
      targetCastId,
      targetUrl,
      type ?? ReactionType.NONE,
      pageOptions,
    );

    const messages = message_bytes_array.map((message_bytes) => {
      return Message.decode(new Uint8Array(message_bytes)) as ReactionAddMessage;
    });

    return { messages };
  }
}
