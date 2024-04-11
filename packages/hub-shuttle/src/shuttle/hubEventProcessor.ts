import { HubEvent, isMergeMessageHubEvent, MergeMessageHubEvent, Message } from "@farcaster/hub-nodejs";
import { DB } from "./db";
import { MessageProcessor } from "./messageProcessor";
import { MessageHandler } from "./interfaces";
import { log } from "../log";

export class HubEventProcessor {
  static async processHubEvent(db: DB, event: HubEvent, handler: MessageHandler) {
    if (isMergeMessageHubEvent(event)) {
      const mergedMessage = event.mergeMessageBody.message;
      await this.processMergeMessage(db, mergedMessage, handler);
    }
  }

  static async handleMissingMessage(db: DB, message: Message, handler: MessageHandler) {
    await this.processMergeMessage(db, message, handler, true);
  }

  private static async processMergeMessage(db: DB, message: Message, handler: MessageHandler, wasMissed = false) {
    await db.transaction().execute(async (trx) => {
      await MessageProcessor.storeMessage(message, trx, "merge", log);
      await handler.handleMessageMerge(message, trx, "merge", wasMissed);
    });
  }
}
