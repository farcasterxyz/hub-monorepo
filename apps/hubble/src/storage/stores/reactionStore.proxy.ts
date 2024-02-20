import { HubError, Message, StoreType, getDefaultStoreLimit } from "@farcaster/hub-nodejs";
import { createReactionStore, getAllMessagesByFid, merge } from "../../rustfunctions.js";
import StoreEventHandler from "./storeEventHandler.js";
import { PageOptions, StorePruneOptions } from "./types.js";
import { UserMessagePostfix, UserPostfix } from "../db/types.js";

const PRUNE_TIME_LIMIT_DEFAULT = 60 * 60 * 24 * 90; // 90 days

export class ReactionStoreProxy {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private rustReactionStore: any; // TODO: Add type

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
    const result = await merge(this.rustReactionStore, messageBytes);
    return result;
  }

  async getAllMessagesByFid(fid: number, pageOptions: PageOptions = {}): Promise<Message[]> {
    const message_bytes_array: Uint8Array[] = await getAllMessagesByFid(this.rustReactionStore, fid, pageOptions);

    const messages: Message[] = message_bytes_array.map((message_bytes) => {
      return Message.decode(message_bytes);
    });

    return messages;
  }
}
