import { Message, MessageType, isLinkCompactStateMessage, validations } from "@farcaster/hub-nodejs";
import { DB, InsertableMessageRow, HubTables } from "./db";
import { bytesToHex, convertProtobufMessageBodyToJson, farcasterTimeToDate } from "../utils";
import { pino } from "pino";
import { StoreMessageOperation } from "./";
import { Expression, ExpressionBuilder, SqlBool, sql } from "kysely";

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
    const result = await trx
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
      .onConflict((oc) =>
        oc
          .columns(["hash", "fid", "type"])
          // In case the signer was changed, make sure to always update it
          .doUpdateSet({
            signatureScheme: message.signatureScheme,
            signer: message.signer,
            raw: Message.encode(message).finish(),
            ...opData,
          })
          .where(({ eb, or }) =>
            or([
              eb("excluded.deletedAt", "is not", null).and("messages.deletedAt", "is", null),
              eb("excluded.deletedAt", "is", null).and("messages.deletedAt", "is not", null),
              eb("excluded.prunedAt", "is not", null).and("messages.prunedAt", "is", null),
              eb("excluded.prunedAt", "is", null).and("messages.prunedAt", "is not", null),
              eb("excluded.revokedAt", "is not", null).and("messages.revokedAt", "is", null),
              eb("excluded.revokedAt", "is", null).and("messages.revokedAt", "is not", null),
            ]),
          ),
      )
      .executeTakeFirst();
    return !!result;
  }

  // Given a compact state message, marks messages which are a difference of the subset as deleted,
  // returning message hashes found and whether they were updated as deleted messages.
  static async deleteDifferenceMessages(
    message: Message,
    trx: DB,
    log: pino.Logger | undefined = undefined,
    validate = true,
  ): Promise<Map<`0x${string}`, boolean>> {
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

    const potentialConflicts = await trx
      .selectFrom("messages")
      .select(["hash"])
      .where(this.getConflictCriteria(message))
      .execute();

    const result = await trx
      .updateTable("messages")
      .set({
        deletedAt: new Date(),
      })
      .returning(["hash"])
      .where(this.getConflictCriteria(message))
      .execute();

    const updateSet = new Set(result.map((r) => bytesToHex(r.hash)));
    const resultMap = new Map<`0x${string}`, boolean>();

    for (const row of potentialConflicts) {
      const hash = bytesToHex(row.hash);
      resultMap.set(hash, updateSet.has(hash));
    }

    return resultMap;
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
