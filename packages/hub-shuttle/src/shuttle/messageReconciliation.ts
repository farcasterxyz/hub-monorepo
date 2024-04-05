import { bytesToHexString, HubRpcClient, Message, MessageType } from "@farcaster/hub-nodejs";
import { DB } from "./db";
import { HubEventProcessor } from "./hubEventProcessor";
import { log } from "../log";
import { MessageHandler } from "./interfaces";

const MAX_PAGE_SIZE = 3_000;

// Ensures that all messages for a given FID are present in the database. Can be used for both backfilling and reconciliation.
export class MessageReconciliation {
  private client: HubRpcClient;
  private db: DB;
  private messageHandler: MessageHandler;

  constructor(client: HubRpcClient, db: DB, handler: MessageHandler) {
    this.client = client;
    this.db = db;
    this.messageHandler = handler;
  }

  async reconcileMessagesForFid(fid: number) {
    for (const type of [
      MessageType.CAST_ADD,
      MessageType.REACTION_ADD,
      MessageType.LINK_ADD,
      MessageType.VERIFICATION_ADD_ETH_ADDRESS,
      MessageType.USER_DATA_ADD,
    ]) {
      log.info(`Reconciling messages for FID ${fid} of type ${type}`);
      await this.reconcileMessagesOfTypeForFid(fid, type);
    }
  }

  async reconcileMessagesOfTypeForFid(fid: number, type: MessageType, republish = false) {
    // todo: Username proofs, and on chain events

    const hubMessagesByHash: Record<string, Message> = {};
    for await (const messages of this.allHubMessagesOfTypeForFid(fid, type)) {
      const messageHashes = messages.map((msg) => msg.hash);

      if (messageHashes.length === 0) {
        log.info(`No messages of type ${type} for FID ${fid}`);
        continue;
      }

      const dbMessages = await this.db
        .selectFrom("messages")
        .select(["prunedAt", "revokedAt", "hash", "fid", "type", "raw"])
        .where("hash", "in", messageHashes)
        .execute();

      const dbMessageHashes = dbMessages.reduce((acc, msg) => {
        const key = Buffer.from(msg.hash).toString("hex");
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);

      for (const message of messages) {
        const msgHash = bytesToHexString(message.hash)._unsafeUnwrap();
        const msgHashKey = Buffer.from(message.hash).toString("hex");
        hubMessagesByHash[msgHashKey] = message;

        if (dbMessageHashes[msgHashKey] === undefined) {
          log.warn(`Message ${msgHash} does not exist in the DB. Processing now.`, { messageHash: msgHash });
          await HubEventProcessor.handleMissingMessage(this.db, message, this.messageHandler);
        }
      }
    }
  }

  private async *allHubMessagesOfTypeForFid(fid: number, type: MessageType) {
    let fn;
    switch (type) {
      case MessageType.CAST_ADD:
        fn = this.getAllCastMessagesByFidInBatchesOf;
        break;
      case MessageType.REACTION_ADD:
        fn = this.getAllReactionMessagesByFidInBatchesOf;
        break;
      case MessageType.LINK_ADD:
        fn = this.getAllLinkMessagesByFidInBatchesOf;
        break;
      case MessageType.VERIFICATION_ADD_ETH_ADDRESS:
        fn = this.getAllVerificationMessagesByFidInBatchesOf;
        break;
      case MessageType.USER_DATA_ADD:
        fn = this.getAllUserDataMessagesByFidInBatchesOf;
        break;
      default:
        throw `Unknown message type ${type}`;
    }
    for await (const messages of fn.call(this, fid, MAX_PAGE_SIZE)) {
      yield messages as Message[];
    }
  }

  private async *getAllCastMessagesByFidInBatchesOf(fid: number, pageSize: number) {
    let result = await this.client.getAllCastMessagesByFid({ pageSize, fid });
    for (;;) {
      if (result.isErr()) {
        throw new Error(`Unable to get all casts for FID ${fid}: ${result.error?.message}`);
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.client.getAllCastMessagesByFid({ pageSize, pageToken, fid });
    }
  }

  private async *getAllReactionMessagesByFidInBatchesOf(fid: number, pageSize: number) {
    let result = await this.client.getAllReactionMessagesByFid({ pageSize, fid });
    for (;;) {
      if (result.isErr()) {
        throw new Error(`Unable to get all reactions for FID ${fid}: ${result.error?.message}`);
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.client.getAllReactionMessagesByFid({ pageSize, pageToken, fid });
    }
  }

  private async *getAllLinkMessagesByFidInBatchesOf(fid: number, pageSize: number) {
    let result = await this.client.getAllLinkMessagesByFid({ pageSize, fid });
    for (;;) {
      if (result.isErr()) {
        throw new Error(`Unable to get all links for FID ${fid}: ${result.error?.message}`);
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.client.getAllLinkMessagesByFid({ pageSize, pageToken, fid });
    }
  }

  private async *getAllVerificationMessagesByFidInBatchesOf(fid: number, pageSize: number) {
    let result = await this.client.getAllVerificationMessagesByFid({ pageSize, fid });
    for (;;) {
      if (result.isErr()) {
        throw new Error(`Unable to get all verifications for FID ${fid}: ${result.error?.message}`);
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.client.getAllVerificationMessagesByFid({ pageSize, pageToken, fid });
    }
  }

  private async *getAllUserDataMessagesByFidInBatchesOf(fid: number, pageSize: number) {
    let result = await this.client.getAllUserDataMessagesByFid({ pageSize, fid });
    for (;;) {
      if (result.isErr()) {
        throw new Error(`Unable to get all user data messages for FID ${fid}: ${result.error?.message}`);
      }

      const { messages, nextPageToken: pageToken } = result.value;

      yield messages;

      if (!pageToken?.length) break;
      result = await this.client.getAllUserDataMessagesByFid({ pageSize, pageToken, fid });
    }
  }
}
