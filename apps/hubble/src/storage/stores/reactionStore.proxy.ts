import { Message } from "@farcaster/hub-nodejs";
import { createReactionStore, getAllMessagesByFid, merge } from "../../rustfunctions.js";

export class ReactionStoreProxy {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private rustReactionStore: any; // TODO: Add type

  constructor() {
    this.rustReactionStore = createReactionStore();
  }

  async merge(message: Message): Promise<number> {
    // Encode the message to bytes
    const messageBytes = Message.encode(message).finish();
    const result = await merge(this.rustReactionStore, messageBytes);
    return result;
  }

  async getAllMessagesByFid(fid: number): Promise<Message[]> {
    const message_bytes_array: Uint8Array[] = await getAllMessagesByFid(this.rustReactionStore, fid);

    const messages: Message[] = message_bytes_array.map((message_bytes) => {
      return Message.decode(message_bytes);
    });

    return messages;
  }
}
