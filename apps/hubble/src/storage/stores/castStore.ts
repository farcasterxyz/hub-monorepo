import { CastAddMessage, CastId, CastRemoveMessage, getDefaultStoreLimit, StoreType } from "@farcaster/hub-nodejs";
import { ResultAsync } from "neverthrow";
import RocksDB from "../db/rocksdb.js";
import { UserPostfix } from "../db/types.js";
import { MessagesPage, PageOptions, StorePruneOptions } from "../stores/types.js";
import { RustStoreBase } from "./rustStoreBase.js";
import StoreEventHandler from "./storeEventHandler.js";
import {
  rsCreateCastStore,
  rsGetCastAdd,
  rsGetCastAddsByFid,
  rsGetCastRemove,
  rsGetCastRemovesByFid,
  rsGetCastsByMention,
  rsGetCastsByParent,
  rustErrorToHubError,
} from "../../rustfunctions.js";
import { messageDecode } from "../../storage/db/message.js";

class CastStore extends RustStoreBase<CastAddMessage, CastRemoveMessage> {
  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    const pruneSizeLimit = options.pruneSizeLimit ?? getDefaultStoreLimit(StoreType.CASTS);
    const rustCastStore = rsCreateCastStore(db.rustDb, eventHandler.getRustStoreEventHandler(), pruneSizeLimit);

    super(db, rustCastStore, UserPostfix.CastMessage, eventHandler, pruneSizeLimit);
  }

  /** Looks up CastAdd message by cast tsHash */
  async getCastAdd(fid: number, hash: Uint8Array): Promise<CastAddMessage> {
    const hashBytes = Buffer.from(hash);
    const result = await ResultAsync.fromPromise(rsGetCastAdd(this._rustStore, fid, hashBytes), rustErrorToHubError);
    if (result.isErr()) {
      throw result.error;
    }
    return messageDecode(new Uint8Array(result.value)) as CastAddMessage;
  }

  /** Looks up CastRemove message by cast tsHash */
  async getCastRemove(fid: number, hash: Uint8Array): Promise<CastRemoveMessage> {
    const hashBytes = Buffer.from(hash);
    const result = await ResultAsync.fromPromise(rsGetCastRemove(this._rustStore, fid, hashBytes), rustErrorToHubError);
    if (result.isErr()) {
      throw result.error;
    }
    return messageDecode(new Uint8Array(result.value)) as CastRemoveMessage;
  }

  /** Gets all CastAdd messages for an fid */
  async getCastAddsByFid(fid: number, pageOptions: PageOptions = {}): Promise<MessagesPage<CastAddMessage>> {
    const messages_page = await rsGetCastAddsByFid(this._rustStore, fid, pageOptions ?? {});

    const messages =
      messages_page.messageBytes?.map((message_bytes) => {
        return messageDecode(new Uint8Array(message_bytes)) as CastAddMessage;
      }) ?? [];

    return { messages, nextPageToken: messages_page.nextPageToken };
  }

  /** Gets all CastRemove messages for an fid */
  async getCastRemovesByFid(fid: number, pageOptions: PageOptions = {}): Promise<MessagesPage<CastRemoveMessage>> {
    const message_page = await rsGetCastRemovesByFid(this._rustStore, fid, pageOptions ?? {});

    const messages =
      message_page.messageBytes?.map((message_bytes) => {
        return messageDecode(new Uint8Array(message_bytes)) as CastRemoveMessage;
      }) ?? [];

    return { messages, nextPageToken: message_page.nextPageToken };
  }

  async getAllCastMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {},
  ): Promise<MessagesPage<CastAddMessage | CastRemoveMessage>> {
    return await this.getAllMessagesByFid(fid, pageOptions);
  }

  /** Gets all CastAdd messages for a parent cast (fid and tsHash) */
  async getCastsByParent(
    parent: CastId | string,
    pageOptions: PageOptions = {},
  ): Promise<MessagesPage<CastAddMessage>> {
    let parentCastId = Buffer.from([]);
    let parentUrl = "";

    if (typeof parent === "string") {
      parentUrl = parent;
    } else {
      parentCastId = Buffer.from(CastId.encode(parent).finish());
    }

    const message_page = await rsGetCastsByParent(this._rustStore, parentCastId, parentUrl, pageOptions);

    const messages =
      message_page.messageBytes?.map((message_bytes) => {
        return messageDecode(new Uint8Array(message_bytes)) as CastAddMessage;
      }) ?? [];

    return { messages, nextPageToken: message_page.nextPageToken };
  }

  /** Gets all CastAdd messages for a mention (fid) */
  async getCastsByMention(mentionFid: number, pageOptions: PageOptions = {}): Promise<MessagesPage<CastAddMessage>> {
    const message_page = await rsGetCastsByMention(this._rustStore, mentionFid, pageOptions ?? {});

    const messages =
      message_page.messageBytes?.map((message_bytes) => {
        return messageDecode(new Uint8Array(message_bytes)) as CastAddMessage;
      }) ?? [];

    return { messages, nextPageToken: message_page.nextPageToken };
  }
}

export default CastStore;
