import { Message, validations } from "@farcaster/hub-nodejs";
import { DB, InsertableMessageRow } from "./db";
import { bytesToHex, convertProtobufMessageBodyToJson, farcasterTimeToDate } from "../utils";
import { StoreMessageOperation } from "./interfaces";
import { pino } from "pino";

export class MessageProcessor {
  static async storeMessage(
    message: Message,
    trx: DB,
    operation: StoreMessageOperation = "merge",
    log: pino.Logger | undefined = undefined,
  ): Promise<boolean> {
    // const log = createLogger(messageLogData(message));
    // if (ENVIRONMENT === "prod" && message.data?.network !== FC_NETWORK_ID) {
    //   throw new BadRequestError(
    //     `Message ${bytesToHex(message.hash)} has unexpected network ID: ${message.data?.network}`,
    //   );
    // }

    const validation = await validations.validateMessage(message);
    if (validation.isErr()) {
      log?.warn(`Invalid message ${bytesToHex(message.hash)}: ${validation.error.message}`);
      throw new Error(`Invalid message: ${validation.error.message}`);
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
}
