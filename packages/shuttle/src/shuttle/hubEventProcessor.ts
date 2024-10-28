import {
  HubEvent,
  isCastAddMessage,
  isCastRemoveMessage,
  isLinkAddMessage,
  isLinkCompactStateMessage,
  isLinkRemoveMessage,
  isMergeMessageHubEvent,
  isPruneMessageHubEvent,
  isReactionAddMessage,
  isReactionRemoveMessage,
  isRevokeMessageHubEvent,
  isVerificationAddAddressMessage,
  isVerificationRemoveMessage,
  Message,
} from "@farcaster/hub-nodejs";
import { DB, DBTransaction } from "./db";
import { MessageProcessor } from "./messageProcessor";
import { MessageHandler, MessageState, StoreMessageOperation } from "./";
import { log } from "../log";

export class HubEventProcessor {
  static async processHubEvent(db: DB, event: HubEvent, handler: MessageHandler) {
    await db.transaction().execute(async (trx) => {
      const shouldSkip = await handler.onHubEvent(event, trx);
      if (shouldSkip) return;

      if (isMergeMessageHubEvent(event)) {
        await this.processMessage(
          trx,
          event.mergeMessageBody.message,
          handler,
          "merge",
          event.mergeMessageBody.deletedMessages,
        );
      }
      
      if (isRevokeMessageHubEvent(event)) {
        await this.processMessage(trx, event.revokeMessageBody.message, handler, "revoke");
      }
      
      if (isPruneMessageHubEvent(event)) {
        await this.processMessage(trx, event.pruneMessageBody.message, handler, "prune");
      }
    });
  }

  static async handleMissingMessage(db: DB, message: Message, handler: MessageHandler, missingInHub?: boolean) {
    await db.transaction().execute(async (trx) => {
      const operation = missingInHub ? "delete" : "merge";
      await this.processMessage(trx, message, handler, operation, [], true);
    });
  }

  private static async processMessage(
    trx: DBTransaction,
    message: Message,
    handler: MessageHandler,
    operation: StoreMessageOperation,
    deletedMessages: Message[] = [],
    wasMissed = false,
  ) {
    const shouldValidate = process.env["SHUTTLE_VALIDATE_MESSAGES"] === "true";
    
    if (deletedMessages.length > 0) {
      await Promise.all(
        deletedMessages.map(async (deletedMessage) => {
          const isNew = await MessageProcessor.storeMessage(deletedMessage, trx, "delete", log, shouldValidate);
          const state = this.getMessageState(deletedMessage, "delete");
          await handler.handleMessageMerge(deletedMessage, trx, "delete", state, isNew, wasMissed);
        }),
      );
    } else if (operation === "merge" && MessageProcessor.isCompactStateMessage(message)) {
      const affectedMessages = await MessageProcessor.deleteDifferenceMessages(message, trx, log);
      await Promise.all(
        affectedMessages.map(async (deletedMessage) => {
          const state = this.getMessageState(deletedMessage, "delete");
          await handler.handleMessageMerge(deletedMessage, trx, "delete", state, true, wasMissed);
        }),
      );
    }

    const isNew = await MessageProcessor.storeMessage(message, trx, operation, log, shouldValidate);
    const state = this.getMessageState(message, operation);
    await handler.handleMessageMerge(message, trx, operation, state, isNew, wasMissed);
  }

  public static getMessageState(message: Message, operation: StoreMessageOperation): MessageState {
    const isAdd = operation === "merge";

    if (isAdd && isCastAddMessage(message)) return "created";
    if ((isAdd && isCastRemoveMessage(message)) || (!isAdd && isCastAddMessage(message))) return "deleted";
    
    if ((isAdd && isLinkAddMessage(message)) || (isAdd && isLinkCompactStateMessage(message))) return "created";
    if ((isAdd && isLinkRemoveMessage(message)) || (!isAdd && isLinkAddMessage(message))) return "deleted";
    
    if (isAdd && isReactionAddMessage(message)) return "created";
    if ((isAdd && isReactionRemoveMessage(message)) || (!isAdd && isReactionAddMessage(message))) return "deleted";
    
    if (isAdd && isVerificationAddAddressMessage(message)) return "created";
    if ((isAdd && isVerificationRemoveMessage(message)) || (!isAdd && isVerificationAddAddressMessage(message))) return "deleted";

    return isAdd ? "created" : "deleted";
  }
}
