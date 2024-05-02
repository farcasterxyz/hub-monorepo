import {
  CastId,
  Message,
  ReactionAddMessage,
  ReactionRemoveMessage,
  ReactionType,
  StoreType,
  getDefaultStoreLimit,
} from "@farcaster/hub-nodejs";
import {
  rsCreateReactionStore,
  rsGetReactionAdd,
  rsGetReactionAddsByFid,
  rsGetReactionRemove,
  rsGetReactionRemovesByFid,
  rsGetReactionsByTarget,
  rustErrorToHubError,
} from "../../rustfunctions.js";
import StoreEventHandler from "./storeEventHandler.js";
import { MessagesPage, PageOptions, StorePruneOptions } from "./types.js";
import { UserPostfix } from "../db/types.js";
import { ResultAsync } from "neverthrow";
import RocksDB from "storage/db/rocksdb.js";
import { RustStoreBase } from "./rustStoreBase.js";
import { messageDecode } from "../../storage/db/message.js";

class ReactionStore extends RustStoreBase<ReactionAddMessage, ReactionRemoveMessage> {
  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    const pruneSizeLimit = options.pruneSizeLimit ?? getDefaultStoreLimit(StoreType.REACTIONS);
    const rustReactionStore = rsCreateReactionStore(db.rustDb, eventHandler.getRustStoreEventHandler(), pruneSizeLimit);

    super(db, rustReactionStore, UserPostfix.ReactionMessage, eventHandler, pruneSizeLimit);
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
      rsGetReactionAdd(this._rustStore, fid, type, targetCastId, targetUrl),
      rustErrorToHubError,
    );
    if (result.isErr()) {
      throw result.error;
    }
    return messageDecode(new Uint8Array(result.value)) as ReactionAddMessage;
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
      rsGetReactionRemove(this._rustStore, fid, type, targetCastId, targetUrl),
      rustErrorToHubError,
    );
    if (result.isErr()) {
      throw result.error;
    }
    return messageDecode(new Uint8Array(result.value)) as ReactionRemoveMessage;
  }

  async getReactionAddsByFid(
    fid: number,
    type?: ReactionType,
    pageOptions?: PageOptions,
  ): Promise<MessagesPage<ReactionAddMessage>> {
    const messages_page = await rsGetReactionAddsByFid(this._rustStore, fid, type ?? 0, pageOptions ?? {});

    const messages =
      messages_page.messageBytes?.map((message_bytes) => {
        return messageDecode(new Uint8Array(message_bytes)) as ReactionAddMessage;
      }) ?? [];

    return { messages, nextPageToken: messages_page.nextPageToken };
  }

  async getReactionRemovesByFid(
    fid: number,
    type?: ReactionType,
    pageOptions?: PageOptions,
  ): Promise<MessagesPage<ReactionRemoveMessage>> {
    const message_page = await rsGetReactionRemovesByFid(this._rustStore, fid, type ?? 0, pageOptions ?? {});

    const messages =
      message_page.messageBytes?.map((message_bytes) => {
        return messageDecode(new Uint8Array(message_bytes)) as ReactionRemoveMessage;
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
      this._rustStore,
      targetCastId,
      targetUrl,
      type ?? ReactionType.NONE,
      pageOptions,
    );

    const messages =
      message_page.messageBytes?.map((message_bytes) => {
        return messageDecode(new Uint8Array(message_bytes)) as ReactionAddMessage;
      }) ?? [];

    return { messages, nextPageToken: message_page.nextPageToken };
  }
}

export default ReactionStore;
