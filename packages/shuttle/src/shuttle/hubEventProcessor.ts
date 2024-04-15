import {
  HubEvent,
  isMergeMessageHubEvent,
  isPruneMessageHubEvent,
  isRevokeMessageHubEvent,
  Message,
} from "@farcaster/hub-nodejs";
import { DB } from "./db";
import { MessageProcessor } from "./messageProcessor";
import { MessageHandler, StoreMessageOperation } from "./";
import { log } from "../log";

export class HubEventProcessor {
  static async processHubEvent(db: DB, event: HubEvent, handler: MessageHandler) {
    if (isMergeMessageHubEvent(event)) {
      await this.processMessage(
        db,
        event.mergeMessageBody.message,
        handler,
        "merge",
        event.mergeMessageBody.deletedMessages,
      );
    } else if (isRevokeMessageHubEvent(event)) {
      await this.processMessage(db, event.revokeMessageBody.message, handler, "revoke");
    } else if (isPruneMessageHubEvent(event)) {
      await this.processMessage(db, event.pruneMessageBody.message, handler, "prune");
    }
  }

  static async handleMissingMessage(db: DB, message: Message, handler: MessageHandler) {
    await this.processMessage(db, message, handler, "merge", [], true);
  }

  private static async processMessage(
    db: DB,
    message: Message,
    handler: MessageHandler,
    operation: StoreMessageOperation,
    deletedMessages: Message[] = [],
    wasMissed = false,
  ) {
    await db.transaction().execute(async (trx) => {
      if (deletedMessages.length > 0) {
        await Promise.all(
          deletedMessages.map(async (deletedMessage) => {
            const isNew = await MessageProcessor.storeMessage(deletedMessage, trx, "delete", log);
            await handler.handleMessageMerge(deletedMessage, trx, "delete", isNew, wasMissed);
          }),
        );
      }
      const isNew = await MessageProcessor.storeMessage(message, trx, operation, log);
      await handler.handleMessageMerge(message, trx, operation, isNew, wasMissed);
    });
  }
}
