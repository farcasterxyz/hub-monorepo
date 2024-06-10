import {
  HubAsyncResult,
  StoreType,
  VerificationAddAddressMessage,
  VerificationRemoveMessage,
  getDefaultStoreLimit,
} from "@farcaster/hub-nodejs";
import {
  rsCreateVerificationStore,
  rsGetVerificationAdd,
  rsGetVerificationAddsByFid,
  rsGetVerificationRemove,
  rsGetVerificationRemovesByFid,
  rsMigrateVerifications,
  rustErrorToHubError,
} from "../../rustfunctions.js";
import StoreEventHandler from "./storeEventHandler.js";
import { MessagesPage, PageOptions, StorePruneOptions } from "./types.js";
import { UserPostfix } from "../db/types.js";
import { ResultAsync } from "neverthrow";
import RocksDB from "storage/db/rocksdb.js";
import { RustStoreBase } from "./rustStoreBase.js";
import { messageDecode } from "../../storage/db/message.js";

class VerificationStore extends RustStoreBase<VerificationAddAddressMessage, VerificationRemoveMessage> {
  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    const pruneSizeLimit = options.pruneSizeLimit ?? getDefaultStoreLimit(StoreType.VERIFICATIONS);
    const rustVerificationStore = rsCreateVerificationStore(
      db.rustDb,
      eventHandler.getRustStoreEventHandler(),
      pruneSizeLimit,
    );

    super(db, rustVerificationStore, UserPostfix.VerificationMessage, eventHandler, pruneSizeLimit);
  }

  async getVerificationAdd(fid: number, address: Uint8Array): Promise<VerificationAddAddressMessage> {
    const result = await ResultAsync.fromPromise(
      rsGetVerificationAdd(this._rustStore, fid, address),
      rustErrorToHubError,
    );
    if (result.isErr()) {
      throw result.error;
    }
    return messageDecode(new Uint8Array(result.value)) as VerificationAddAddressMessage;
  }

  async getVerificationRemove(fid: number, address: Uint8Array): Promise<VerificationRemoveMessage> {
    const result = await ResultAsync.fromPromise(
      rsGetVerificationRemove(this._rustStore, fid, address),
      rustErrorToHubError,
    );
    if (result.isErr()) {
      throw result.error;
    }
    return messageDecode(new Uint8Array(result.value)) as VerificationRemoveMessage;
  }

  async getVerificationAddsByFid(
    fid: number,
    pageOptions?: PageOptions,
  ): Promise<MessagesPage<VerificationAddAddressMessage>> {
    const messages_page = await rsGetVerificationAddsByFid(this._rustStore, fid, pageOptions ?? {});

    const messages =
      messages_page.messageBytes?.map((message_bytes) => {
        return messageDecode(new Uint8Array(message_bytes)) as VerificationAddAddressMessage;
      }) ?? [];

    return { messages, nextPageToken: messages_page.nextPageToken };
  }

  async getVerificationRemovesByFid(
    fid: number,
    pageOptions?: PageOptions,
  ): Promise<MessagesPage<VerificationRemoveMessage>> {
    const message_page = await rsGetVerificationRemovesByFid(this._rustStore, fid, pageOptions ?? {});

    const messages =
      message_page.messageBytes?.map((message_bytes) => {
        return messageDecode(new Uint8Array(message_bytes)) as VerificationRemoveMessage;
      }) ?? [];

    return { messages, nextPageToken: message_page.nextPageToken };
  }

  async getAllVerificationMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {},
  ): Promise<MessagesPage<VerificationAddAddressMessage | VerificationRemoveMessage>> {
    return await this.getAllMessagesByFid(fid, pageOptions);
  }

  async migrateVerifications(): HubAsyncResult<{ total: number; duplicates: number }> {
    const result = await ResultAsync.fromPromise(rsMigrateVerifications(this._rustStore), rustErrorToHubError);
    if (result.isErr()) {
      return result;
    }
    return result;
  }
}

export default VerificationStore;
