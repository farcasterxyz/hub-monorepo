import {
  MessageType,
  ReactionAddMessage,
  ReactionRemoveMessage,
  ReactionType,
  isReactionAddMessage,
} from "@farcaster/hub-nodejs";
import { Selectable, sql } from "kysely";
import { buildAddRemoveMessageProcessor } from "../messageProcessor.js";
import { bytesToHex, farcasterTimeToDate } from "../util.js";
import { ReactionRow, executeTakeFirst } from "../db.js";
import { AssertionError, HubEventProcessingBlockedError } from "../error.js";
import AWS from "aws-sdk";
import { Records } from "aws-sdk/clients/rdsdataservice.js";
import {AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from "../env.js";


const credentials = new AWS.Credentials({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY
});

AWS.config.update({ 
    credentials: credentials,
    region: "eu-west-1" 
  });

const kinesis = new AWS.Kinesis();

interface KinesisRecord {
  Data: string;
  PartitionKey: string;
}

async function putKinesisRecords(records: KinesisRecord[]) {
  const params = {
    Records: records,
    StreamName: "farcaster-stream", // Replace 'your-stream-name' with your Kinesis stream name
  };

  // Put records into the Kinesis stream
  kinesis.putRecords(params, (err, data) => {
    if (err) {
      console.error("Error putting records:", err);
    } else {
      console.log(data);
      console.log("Successfully put records:", data.Records.length);
    }
  });
}


const { processAdd, processRemove } = buildAddRemoveMessageProcessor<
  ReactionAddMessage,
  ReactionRemoveMessage,
  Selectable<ReactionRow>
>({
  conflictRule: "last-write-wins",
  addMessageType: MessageType.REACTION_ADD,
  removeMessageType: MessageType.REACTION_REMOVE,
  withConflictId(message) {
    const { targetCastId, targetUrl } = message.data.reactionBody;

    return ({ and, eb }) => {
      let selector;
      if (targetCastId) {
        selector = and([
          // Can't use Kysely's type-safe JSON operators because the upstream hub-nodejs
          // types don't support discriminated unions.
          eb(sql<string>`body #>> '{targetCastId,fid}'`, "=", targetCastId.fid.toString()),
          eb(sql<string>`body #>> '{targetCastId,hash}'`, "=", bytesToHex(targetCastId.hash)),
        ]);
      } else if (targetUrl) {
        selector = eb(sql<string>`body #>> '{target}'`, "=", targetUrl);
      } else {
        throw new AssertionError("Neither targetCastId nor targetUrl is defined");
      }

      return and([
        eb("fid", "=", message.data.fid),
        eb(sql<ReactionType>`body #>> '{type}'`, "=", message.data.reactionBody.type),
        selector,
      ]);
    };
  },
  async getDerivedRow(message, trx) {
    const { targetCastId, targetUrl } = message.data.reactionBody;

    return await executeTakeFirst(
      trx
        .selectFrom("reactions")
        .select(["deletedAt"])
        .where("fid", "=", message.data.fid)
        .where("type", "=", message.data.reactionBody.type)
        .where(({ eb, and }) => {
          if (targetCastId) {
            return and([eb("targetCastFid", "=", targetCastId.fid), eb("targetCastHash", "=", targetCastId.hash)]);
          } else if (targetUrl) {
            return eb("targetUrl", "=", targetUrl);
          } else {
            throw new AssertionError("Neither targetCastId nor targetUrl is defined");
          }
        }),
    );
  },
  async deleteDerivedRow(message, trx) {
    const { targetCastId, targetUrl } = message.data.reactionBody;

    const now = new Date();

    return await executeTakeFirst(
      trx
        .updateTable("reactions")
        .where("fid", "=", message.data.fid)
        .where("type", "=", message.data.reactionBody.type)
        .where(({ eb, and }) => {
          if (targetCastId) {
            return and([eb("targetCastFid", "=", targetCastId.fid), eb("targetCastHash", "=", targetCastId.hash)]);
          } else if (targetUrl) {
            return eb("targetUrl", "=", targetUrl);
          } else {
            throw new AssertionError("Neither targetCastId nor targetUrl is defined");
          }
        })
        .set({ deletedAt: now, updatedAt: now })
        .returningAll(),
    );
  },
  async mergeDerivedRow(message, deleted, trx) {
    const { targetCastId, targetUrl } = message.data.reactionBody;

    if (targetCastId) {
      const targetCast = await executeTakeFirst(
        trx
          .selectFrom("casts")
          .select(["hash"])
          .where("fid", "=", targetCastId.fid)
          .where("hash", "=", targetCastId.hash),
      );

      if (!targetCast) {
        // If cast doesn't exist, then raise exception so that we don't process
        // this message. We'll process it later once we have the corresponding
        // cast.
        throw new HubEventProcessingBlockedError(
          `Reaction ${bytesToHex(message.hash)} references cast ${bytesToHex(targetCastId.hash)} by FID ${
            targetCastId.fid
          } that has not been seen yet`,
          { blockedOnHash: targetCastId.hash },
        );
      }
    } else if (!targetUrl) {
      throw new Error("Neither targetCastId nor targetUrl is defined");
    }
    
    let records = [];
    
    let recordsJson = {
      timestamp: farcasterTimeToDate(message.data.timestamp),
      deletedAt: deleted ? new Date() : null,
      fid: message.data.fid,
      targetCastFid: targetCastId?.fid || null,
      type: message.data.reactionBody.type,
      hash: message.hash,
      targetCastHash: targetCastId?.hash || null,
      targetUrl,
    }
    
    records = [
      {
        Data: JSON.stringify(recordsJson),
        PartitionKey: "REACTIONS_ADD",
      },
    ];
    console.log(`push kinesis start`);
    await putKinesisRecords(records);
    console.log(`push kinesis end`);

    return await executeTakeFirst(
      trx
        .insertInto("reactions")
        .values({
          timestamp: farcasterTimeToDate(message.data.timestamp),
          deletedAt: deleted ? new Date() : null,
          fid: message.data.fid,
          targetCastFid: targetCastId?.fid || null,
          type: message.data.reactionBody.type,
          hash: message.hash,
          targetCastHash: targetCastId?.hash || null,
          targetUrl,
        })
        .onConflict((oc) =>
          oc
            .columns(["fid", "type", "targetCastHash", "targetUrl"])
            .doUpdateSet({
              // If this is a delete, only update deletedAt if it's not already set
              deletedAt: deleted ? (eb) => eb.fn.coalesce("reactions.deletedAt", "excluded.deletedAt") : null,
              updatedAt: new Date(),
            })
            .where(({ eb, ref, or, and }) =>
              or([
                // CRDT conflict rule 1: discard message with lower timestamp
                eb("reactions.timestamp", "<", ref("excluded.timestamp")),
                // CRDT conflict rule 2: does not apply since these are always two ReactionAdd messages
                // CRDT conflict rule 3: if timestamps and message type are identical, discard message with lower hash
                and([
                  eb("reactions.timestamp", "=", ref("excluded.timestamp")),
                  eb("reactions.hash", "<", ref("excluded.hash")),
                ]),
              ]),
            ),
        )
        .returningAll(),
    );
  },
  async onAdd({ data: reaction, isCreate, trx, skipSideEffects }) {
    // Update any other derived data

    if (!skipSideEffects) {
      // Trigger any one-time side effects (push notifications, etc.)
    }
  },
  async onRemove({ data: reaction, trx }) {
    // Update any other derived data in response to removal
  },
});

export { processAdd as processReactionAdd, processRemove as processReactionRemove };
