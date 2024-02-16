import { Message } from "@farcaster/hub-nodejs";
import { createReactionStore, mergeReactionStore } from "../../rustfunctions.js";

export class ReactionStoreProxy {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private rustReactionStore: any; // TODO: Add type

  constructor() {
    this.rustReactionStore = createReactionStore();
  }

  async merge(message: Message) {
    // Encode the message to bytes
    const messageBytes = Message.encode(message).finish();
    const result = await mergeReactionStore(this.rustReactionStore, messageBytes);
    return result;
  }
}
