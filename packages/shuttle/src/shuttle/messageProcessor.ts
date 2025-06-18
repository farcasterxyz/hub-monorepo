import { Message, MessageType, isLinkCompactStateMessage, validations } from "@farcaster/hub-nodejs";
import { type Expression, type ExpressionBuilder, type SqlBool, sql } from "kysely";
import type { pino } from "pino";
import { bytesToHex, convertProtobufMessageBodyToJson, farcasterTimeToDate } from "../utils.ts";
import type { DB, HubTables, InsertableMessageRow } from "./db.ts";
import type { StoreMessageOperation } from "./index.ts";

export class MessageProcessor {
  static async storeMessage(
    message: Message,
    trx: DB,
    operation: StoreMessageOperation = "merge",
    log: pino.Logger | undefined = undefined,
    validate = true,
  ): Promise<boolean> {
    // Only validate merge messages since we may be deleting an invalid message
    if (validate && operation === "merge") {
      const validation = await validations.validateMessage(message);
      if (validation.isErr()) {
        log?.warn(`Invalid message ${bytesToHex(message.hash)}: ${validation.error.message}`);
        throw new Error(`Invalid message: ${validation.error.message}`);
      }
    }

    if (!message.data) throw new Error("Message data is missing");

    const body = convertProtobufMessageBodyToJson(message);

    const opData: Pick<InsertableMessageRow, "deletedAt" | "revokedAt" | "prunedAt"> = {
      deletedAt: null,
      prunedAt: null,
      revokedAt: null,
    };

    switch (operation) {
      case "merge":
        break;
      case "delete":
        opData.deletedAt = new Date();
        break;
      case "prune":
        opData.prunedAt = new Date();
        break;
      case "revoke":
        opData.revokedAt = new Date();
        break;
    }

    // @ts-ignore
    let result = await trx
      .insertInto("messages")
      .values({
        fid: message.data.fid,
        type: message.data.type,
        timestamp: farcasterTimeToDate(message.data.timestamp),
        hashScheme: message.hashScheme,
        signatureScheme: message.signatureScheme,
        hash: message.hash,
        signer: message.signer,
        raw: Message.encode(message).finish(),
        body,
        ...opData,
      })
      .returning(["id"])
      .onConflict((oc) => oc.doNothing())
      .executeTakeFirst();

    if (!result) {
      const data = message.data;
      result = await trx
        .updateTable("messages")
        .set({
          signatureScheme: message.signatureScheme,
          signer: message.signer,
          raw: Message.encode(message).finish(),
          ...opData,
        })
        .returning(["id"])
        .where((eb) =>
          eb.and([
            eb("hash", "=", message.hash),
            eb("fid", "=", data.fid),
            eb("type", "=", data.type),
            eb.or([
              eb("deletedAt", !opData.deletedAt ? "is not" : "is", null),
              eb("prunedAt", !opData.prunedAt ? "is not" : "is", null),
              eb("revokedAt", !opData.revokedAt ? "is not" : "is", null),
            ]),
          ]),
        )
        .executeTakeFirst();
    }

    return !!result;
  }

  // Given a compact state message, marks messages which are a difference of the subset as deleted,
  // returning message hashes found and whether they were updated as deleted messages.
  static async deleteDifferenceMessages(
    message: Message,
    trx: DB,
    log: pino.Logger | undefined = undefined,
    validate = true,
  ): Promise<Message[]> {
    if (!MessageProcessor.isCompactStateMessage(message)) {
      log?.warn(`Invalid message type for set difference deletion ${message.data?.type}`);
      throw new Error(`Invalid message type for set difference deletion ${message.data?.type}`);
    }

    if (validate) {
      const validation = await validations.validateMessage(message);
      if (validation.isErr()) {
        log?.warn(`Invalid message ${bytesToHex(message.hash)}: ${validation.error.message}`);
        throw new Error(`Invalid message: ${validation.error.message}`);
      }
    }

    const result = await trx
      .updateTable("messages")
      .set({
        deletedAt: new Date(),
      })
      .returningAll()
      .where(this.getConflictCriteria(message))
      .execute();

    return result.map((m) => Message.decode(m.raw));
  }

  // Returns the conflicting record criteria for a given message. Assumes message is a full state type
  // supported for conflict discovery.
  static getConflictCriteria(message: Message): (eb: ExpressionBuilder<HubTables, "messages">) => Expression<SqlBool> {
    const data = message.data;

    if (!data || !data.linkCompactStateBody) {
      throw new Error("linkCompactStateBody is not defined.");
    }

    const { type, targetFids } = data.linkCompactStateBody;

    return (eb) => {
      const conditions = [
        eb("fid", "=", data.fid),
        eb("type", "in", [MessageType.LINK_ADD, MessageType.LINK_COMPACT_STATE, MessageType.LINK_REMOVE]),
        eb(sql<string>`body ->> 'type'`, "=", type),
        eb.or([
          eb(sql<number>`body ->> 'targetFid'`, "not in", targetFids),
          eb("type", "=", MessageType.LINK_COMPACT_STATE),
        ]),
        eb("deletedAt", "is", null),
        eb("prunedAt", "is", null),
        eb("revokedAt", "is", null),
        eb("timestamp", "<", farcasterTimeToDate(data.timestamp)),
      ];

      return eb.and(conditions);
    };
  }

  static isCompactStateMessage(message: Message): boolean {
    return isLinkCompactStateMessage(message);
  }
}
