import { getDefaultStoreLimit, LinkAddMessage, LinkRemoveMessage, Message, StoreType } from "@farcaster/hub-nodejs";
import { makeFidKey } from "../../storage/db/message.js";
import { UserPostfix } from "../db/types.js";
import { MessagesPage, PageOptions, StorePruneOptions } from "./types.js";
import { ResultAsync } from "neverthrow";
import RocksDB from "../db/rocksdb.js";
import { rsLinkStore, rustErrorToHubError } from "../../rustfunctions.js";
import { RustStoreBase } from "./rustStoreBase.js";
import storeEventHandler from "./storeEventHandler.js";

const makeTargetKey = (target: number): Buffer => {
  return makeFidKey(target);
};

/**
 * LinkStore persists Link Messages in RocksDB using a two-phase CRDT set to guarantee
 * eventual consistency.
 *
 * A Link is created by a user and points at a target (e.g. fid) and has a type (e.g. "follow").
 * Links are added with a LinkAdd and removed with a LinkRemove. Link messages can
 * collide if two messages have the same user fid, target, and type. Collisions are handled with
 * Last-Write-Wins + Remove-Wins rules as follows:
 *
 * 1. Highest timestamp wins
 * 2. Remove wins over Adds
 * 3. Highest lexicographic hash wins
 *
 * LinkMessages are stored ordinally in RocksDB indexed by a unique key `fid:tsHash`,
 * which makes truncating a user's earliest messages easy. Indices are built to look up
 * link adds in the adds set, link removes in the remove set and all links
 * for a given target. The key-value entries created by the Link Store are:
 *
 * 1. fid:tsHash -> link message
 * 2. fid:set:targetCastTsHash:linkType -> fid:tsHash (Set Index)
 * 3. linkTarget:linkType:targetCastTsHash -> fid:tsHash (Target Index)
 */
class LinkStore extends RustStoreBase<LinkAddMessage, LinkRemoveMessage> {
  constructor(db: RocksDB, eventHandler: storeEventHandler, options: StorePruneOptions = {}) {
    const pruneSizeLimit = options.pruneSizeLimit ?? getDefaultStoreLimit(StoreType.LINKS);
    const rustReactionStore = rsLinkStore.CreateLinkStore(
      db.rustDb,
      eventHandler.getRustStoreEventHandler(),
      pruneSizeLimit,
    );

    super(db, rustReactionStore, UserPostfix.LinkMessage, eventHandler, pruneSizeLimit);
  }

  async getLinkAdd(fid: number, type: string, target: number): Promise<LinkAddMessage> {
    const result = await ResultAsync.fromPromise(
      rsLinkStore.GetLinkAdd(this._rustStore, fid, type, target),
      rustErrorToHubError,
    );

    if (result.isErr()) {
      throw result.error;
    }

    return Message.decode(new Uint8Array(result.value)) as LinkAddMessage;
  }

  async getLinkRemove(fid: number, type: string, target: number): Promise<LinkRemoveMessage> {
    const result = await ResultAsync.fromPromise(
      rsLinkStore.GetLinkRemove(this._rustStore, fid, type, target),
      rustErrorToHubError,
    );

    if (result.isErr()) {
      throw result.error;
    }

    return Message.decode(new Uint8Array(result.value)) as LinkRemoveMessage;
  }

  /** Finds all LinkAdd Messages by iterating through the prefixes */
  async getLinkAddsByFid(
    fid: number,
    type?: string,
    pageOptions: PageOptions = {},
  ): Promise<MessagesPage<LinkAddMessage>> {
    const messages_page = await rsLinkStore.GetLinkAddsByFid(this._rustStore, fid, type ?? "", pageOptions);

    const messages =
      messages_page.messageBytes?.map((message_bytes) => {
        return Message.decode(new Uint8Array(message_bytes)) as LinkAddMessage;
      }) ?? [];

    return { messages, nextPageToken: messages_page.nextPageToken };
  }

  /** Finds all LinkRemove Messages by iterating through the prefixes */
  async getLinkRemovesByFid(
    fid: number,
    type?: string,
    pageOptions: PageOptions = {},
  ): Promise<MessagesPage<LinkRemoveMessage>> {
    const messages_page = await rsLinkStore.GetLinkRemovesByFid(this._rustStore, fid, type ?? "", pageOptions);

    const messages =
      messages_page.messageBytes?.map((message_bytes) => {
        return Message.decode(new Uint8Array(message_bytes)) as LinkRemoveMessage;
      }) ?? [];

    return { messages, nextPageToken: messages_page.nextPageToken };
  }

  /** Finds all LinkAdds that point to a specific target by iterating through the prefixes */
  async getLinksByTarget(
    target: number,
    type?: string,
    pageOptions: PageOptions = {},
  ): Promise<MessagesPage<LinkAddMessage>> {
    const messages_page = await rsLinkStore.GetLinksByTarget(this._rustStore, target, type ?? "", pageOptions);

    const messages =
      messages_page.messageBytes?.map((message_bytes) => {
        return Message.decode(new Uint8Array(message_bytes)) as LinkAddMessage;
      }) ?? [];

    return { messages, nextPageToken: messages_page.nextPageToken };
  }

  async getAllLinkMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {},
  ): Promise<MessagesPage<LinkAddMessage | LinkRemoveMessage>> {
    const messages_page = await rsLinkStore.GetAllLinkMessagesByFid(this._rustStore, fid, pageOptions);

    const messages =
      messages_page.messageBytes?.map((message_bytes) => {
        return Message.decode(new Uint8Array(message_bytes)) as LinkAddMessage | LinkRemoveMessage;
      }) ?? [];

    return { messages, nextPageToken: messages_page.nextPageToken };
  }
}
export default LinkStore;
