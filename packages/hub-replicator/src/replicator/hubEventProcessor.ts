import { HubEvent, isMergeMessageHubEvent, MergeMessageHubEvent, Message } from "@farcaster/hub-nodejs";
import { DB } from "../app/db";
import { MessageProcessor } from "./messageProcessor";

export class HubEventProcessor {
  static async processHubEvent(db: DB, event: HubEvent) {
    if (isMergeMessageHubEvent(event)) {
      const mergedMessage = event.mergeMessageBody.message;
      await this.processMergeMessage(db, mergedMessage);
    }
  }

  static async handleMissingMessage(db: DB, message: Message) {
    await this.processMergeMessage(db, message);
  }

  private static async processMergeMessage(db: DB, message: Message) {
    await db.transaction().execute(async (trx) => {
      await MessageProcessor.storeMessage(message, trx, "merge");
    });
  }
}
