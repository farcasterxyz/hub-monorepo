import { LinkAddMessage, LinkRemoveMessage, MessageType } from "@farcaster/hub-nodejs";
import { Selectable } from "kysely";
import { buildAddRemoveMessageProcessor } from "../messageProcessor.js";
import { LinkRow, executeTakeFirst } from "../db.js";
import { farcasterTimeToDate } from "../util.js";
import { HubEventProcessingBlockedError } from "../error.js";
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
  LinkAddMessage,
  LinkRemoveMessage,
  Selectable<LinkRow>
>({
  conflictRule: "last-write-wins",
  addMessageType: MessageType.LINK_ADD,
  removeMessageType: MessageType.LINK_REMOVE,
  withConflictId(message) {
    const { type, targetFid } = message.data.linkBody;

    return ({ and, eb, ref }) => {
      const conditions = [eb("fid", "=", message.data.fid), eb(ref("body", "->>").key("type"), "=", type)];
      if (targetFid) conditions.push(eb(ref("body", "->>").key("targetFid"), "=", targetFid.toString()));
      return and(conditions);
    };
  },
  async getDerivedRow(message, trx) {
    const { type, targetFid } = message.data.linkBody;

    return await executeTakeFirst(
      trx
        .selectFrom("links")
        .where("fid", "=", message.data.fid)
        .where("type", "=", type)
        .$call((qb) => (targetFid ? qb.where("targetFid", "=", targetFid) : qb)),
    );
  },
  async deleteDerivedRow(message, trx) {
    const { type, targetFid } = message.data.linkBody;

    const now = new Date();

    return await executeTakeFirst(
      trx
        .updateTable("links")
        .where("fid", "=", message.data.fid)
        .where("type", "=", type)
        .$call((qb) => (targetFid ? qb.where("targetFid", "=", targetFid) : qb))
        .set({ updatedAt: now, deletedAt: now })
        .returningAll(),
    );
  },
  async mergeDerivedRow(message, deleted, trx) {
    const { type, targetFid, displayTimestamp } = message.data.linkBody;

    const fidExists = await trx.selectFrom("fids").where("fid", "=", message.data.fid).executeTakeFirst();
    if (!fidExists)
      throw new HubEventProcessingBlockedError(`Cannot process link message for unknown fid ${message.data.fid}`, {
        blockedOnFid: message.data.fid,
      });

    if (targetFid) {
      const targetFidExists = await trx.selectFrom("fids").where("fid", "=", targetFid).executeTakeFirst();
      if (!targetFidExists)
        throw new HubEventProcessingBlockedError(`Cannot process link message for unknown targetFid ${targetFid}`, {
          blockedOnFid: targetFid,
        });
    }
    
    let records = [];
    
    let recordsJson = {
      hash: message.hash,
      fid: message.data.fid,
      targetFid: message.data.linkBody.targetFid || null,
      type: message.data.linkBody.type,
      timestamp: farcasterTimeToDate(message.data.timestamp),
      displayTimestamp: farcasterTimeToDate(displayTimestamp) || null,
      deletedAt: deleted ? new Date() : null,
    }
    
    records = [
      {
        Data: JSON.stringify(recordsJson),
        PartitionKey: "LINK_ADD",
      },
    ];
    
    console.log(`push kinesis start`);
    await putKinesisRecords(records);
    console.log(`push kinesis end`);

    return await executeTakeFirst(
      trx
        .insertInto("links")
        .values({
          hash: message.hash,
          fid: message.data.fid,
          targetFid: message.data.linkBody.targetFid || null,
          type: message.data.linkBody.type,
          timestamp: farcasterTimeToDate(message.data.timestamp),
          displayTimestamp: farcasterTimeToDate(displayTimestamp) || null,
          deletedAt: deleted ? new Date() : null,
        })
        .onConflict((oc) =>
          oc
            .columns(["fid", "targetFid", "type"])
            .doUpdateSet({
              hash: message.hash,
              timestamp: farcasterTimeToDate(message.data.timestamp),
              displayTimestamp: farcasterTimeToDate(displayTimestamp),
              // If this is a delete, only update deletedAt if it's not already set
              deletedAt: deleted ? (eb) => eb.fn.coalesce("links.deletedAt", "excluded.deletedAt") : null,
            })
            .where(({ eb, ref, or, and }) =>
              deleted
                ? or([]) // No predicate if we're deleting
                : or([
                    // CRDT conflict rule 1: discard message with lower timestamp
                    eb("links.timestamp", "<", ref("excluded.timestamp")),
                    // CRDT conflict rule 2: does not apply since these are always two ReactionAdd messages
                    // CRDT conflict rule 3: if timestamps and message type are identical, discard message with lower hash
                    and([
                      eb("links.timestamp", "=", ref("excluded.timestamp")),
                      eb("links.hash", "<", ref("excluded.hash")),
                    ]),
                  ]),
            ),
        )
        .returningAll(),
    );
  },
  async onAdd({ data: follow, isCreate, trx, skipSideEffects }) {
    // Update any other derived data

    if (!skipSideEffects) {
      // Trigger any one-time side effects (push notifications, etc.)
    }
  },
  async onRemove({ data: follow, trx }) {
    // Update any other derived data in response to removal
  },
});

export { processAdd as processLinkAdd, processRemove as processLinkRemove };
