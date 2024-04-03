import {
  base58ToBytes,
  bytesToBase58,
  HubEvent,
  HubEventType,
  IdRegisterEventType,
  isCastAddMessage,
  isCastRemoveMessage,
  isIdRegisterOnChainEvent,
  isLinkAddMessage,
  isLinkRemoveMessage,
  isMergeMessageHubEvent,
  isMergeOnChainHubEvent,
  isMergeUsernameProofHubEvent,
  isPruneMessageHubEvent,
  isReactionAddMessage,
  isReactionRemoveMessage,
  isRevokeMessageHubEvent,
  isUserDataAddMessage,
  isUsernameProofMessage,
  isVerificationAddAddressMessage,
  isVerificationRemoveMessage,
  MergeMessageHubEvent,
  MergeOnChainEventHubEvent,
  MergeUsernameProofHubEvent,
  Message,
  MessageType,
  OnChainEvent,
  Protocol,
  PruneMessageHubEvent,
  RevokeMessageHubEvent,
  UserNameProof,
} from "@farcaster/hub-nodejs";
import { Redis } from "ioredis";
import { sql } from "kysely";
import { DB, DBTransaction, execute, executeTx } from "../db.js";
import { PARTITIONS, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from "../env.js";
import { Logger } from "../log.js";
import {
  bytesToHex,
  convertProtobufMessageBodyToJson,
  exhaustiveGuard,
  farcasterTimeToDate,
  StoreMessageOperation,
  toHexEncodedUint8Array,
} from "../util.js";
import { processOnChainEvent } from "./onChainEvent.js";
import { processUserNameProofAdd, processUserNameProofMessage, processUserNameProofRemove } from "./usernameProof.js";
import { AssertionError, HubEventProcessingBlockedError, isStandardError } from "../error.js";
import { processCastAdd, processCastRemove } from "./cast.js";
import { processReactionAdd, processReactionRemove } from "./reaction.js";
import { processLinkAdd, processLinkRemove } from "./link.js";
import { processVerificationAddEthAddress, processVerificationRemove } from "./verification.js";
import { processUserDataAdd } from "./userData.js";
import { MergeMessage } from "../jobs/mergeMessage.js";
import { statsd } from "../statsd.js";
import AWS from "aws-sdk";
import { Records } from "aws-sdk/clients/rdsdataservice.js";


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

export async function processOnChainEvents(events: OnChainEvent[], db: DB, log: Logger, redis: Redis) {
  for (const event of events) {
    const txHash = bytesToHex(event.transactionHash);
    log.debug(
      `Processing on-chain event (fid: ${event.fid} type: ${event.type} txHash: ${txHash} txIdx: ${event.txIndex} logIndex: ${event.logIndex}`,
      { fid: event.fid, type: event.type, txHash, txIdx: event.txIndex, logIdx: event.logIndex },
    );
    await executeTx(db, async (trx) => {
      await processOnChainEvent(event, trx);
    });
  }

  // Once transaction committed, look for any registration events and process messages that were blocked
  // on the FID not being present yet
  for (const event of events) {
    if (!isIdRegisterOnChainEvent(event)) continue;

    if (event.idRegisterEventBody.eventType === IdRegisterEventType.REGISTER) {
      const { fid } = event;
      const unblockedMessages = Object.values(await redis.hgetall(`messages-blocked-on-fid:${fid}`)).map(
        (messageJsonStr) => Message.fromJSON(JSON.parse(messageJsonStr)),
      );

      for (const unblockedMessage of unblockedMessages) {
        // Enqueue this message at the front of the queue since it might be blocking other messages
        await MergeMessage.enqueue(
          { messageJsonStr: JSON.stringify(Message.toJSON(unblockedMessage)) },
          { lifo: true },
        );
        // Remove it from the blocked set. If it's still blocked, it'll be re-added to the set later
        await redis.hdel(`messages-blocked-on-fid:${fid}`, bytesToHex(unblockedMessage.hash));
      }
    }
  }
}

export async function processUserNameProof(db: DB, log: Logger, proof: UserNameProof) {
  await executeTx(db, async (trx) => {
    await processUserNameProofAdd(proof, trx);
  });
}

export async function mergeMessage(message: Message, trx: DBTransaction, log: Logger, redis: Redis) {
  await processMessage(message, "merge", trx, log, redis);
}

export async function deleteMessage(message: Message, trx: DBTransaction, log: Logger, redis: Redis) {
  await processMessage(message, "delete", trx, log, redis);
}

export async function pruneMessage(message: Message, trx: DBTransaction, log: Logger, redis: Redis) {
  await processMessage(message, "prune", trx, log, redis);
}

export async function revokeMessage(message: Message, trx: DBTransaction, log: Logger, redis: Redis) {
  await processMessage(message, "revoke", trx, log, redis);
}

export async function processMessage(
  inputMessage: Message,
  operation: StoreMessageOperation,
  trx: DBTransaction,
  log: Logger,
  redis: Redis,
) {
  const message = transformMessage(inputMessage);
  if (!message.data) throw new AssertionError("Message contained no data");

  await storeMessage(message, operation, trx, log);

  const hash = bytesToHex(message.hash);
  const fid = message.data.fid;
  try {
    switch (message.data.type) {
      case MessageType.CAST_ADD:
        if (!isCastAddMessage(message)) throw new AssertionError(`Invalid CastAddMessage: ${message}`);
        log.debug(`Processing CastAddMessage ${hash} (fid ${fid})`, { fid, hash });
        await processCastAdd(message, operation, trx);
        break;
      case MessageType.CAST_REMOVE:
        if (!isCastRemoveMessage(message)) throw new AssertionError(`Invalid CastRemoveMessage: ${message}`);
        log.debug(`Processing CastRemoveMessage ${hash} (fid ${fid})`, { fid, hash });
        await processCastRemove(message, operation, trx);
        break;
      case MessageType.REACTION_ADD:
        if (!isReactionAddMessage(message)) throw new AssertionError(`Invalid ReactionAddMessage: ${message}`);
        log.debug(`Processing ReactionAddMessage ${hash} (fid ${fid})`, { fid, hash });
        await processReactionAdd(message, operation, trx);
        break;
      case MessageType.REACTION_REMOVE:
        if (!isReactionRemoveMessage(message)) throw new AssertionError(`Invalid ReactionRemoveMessage: ${message}`);
        log.debug(`Processing ReactionRemoveMessage ${hash} (fid ${fid})`, { fid, hash });
        await processReactionRemove(message, operation, trx);
        break;
      case MessageType.LINK_ADD:
        if (!isLinkAddMessage(message)) throw new AssertionError(`Invalid LinkAddMessage: ${message}`);
        log.debug(`Processing LinkAddMessage ${hash} (fid ${fid})`, { fid, hash });
        await processLinkAdd(message, operation, trx);
        break;
      case MessageType.LINK_REMOVE:
        if (!isLinkRemoveMessage(message)) throw new AssertionError(`Invalid LinkRemoveMessage: ${message}`);
        log.debug(`Processing LinkRemoveMessage ${hash} (fid ${fid})`, { fid, hash });
        await processLinkRemove(message, operation, trx);
        break;
      case MessageType.VERIFICATION_ADD_ETH_ADDRESS: {
        // TODO: add support for multi-protocol verification
        if (!isVerificationAddAddressMessage(message))
          throw new AssertionError(`Invalid VerificationAddEthAddressMessage: ${message}`);
        log.debug(`Processing VerificationAddEthAddressMessage ${hash} (fid ${fid})`, { fid, hash });
        await processVerificationAddEthAddress(message, operation, trx);
        break;
      }
      case MessageType.VERIFICATION_REMOVE:
        if (!isVerificationRemoveMessage(message))
          throw new AssertionError(`Invalid VerificationRemoveMessage: ${message}`);
        log.debug(`Processing VerificationRemoveMessage ${hash} (fid ${fid})`, { fid, hash });
        await processVerificationRemove(message, operation, trx);
        break;
      case MessageType.USER_DATA_ADD:
        if (!isUserDataAddMessage(message)) throw new AssertionError(`Invalid UserDataAddMessage: ${message}`);
        log.debug(`Processing UserDataAddMessage ${hash} (fid ${fid})`, { fid, hash });
        await processUserDataAdd(message, trx);
        break;
      case MessageType.USERNAME_PROOF:
        if (!isUsernameProofMessage(message)) throw new AssertionError(`Invalid UsernameProofMessage: ${message}`);
        log.debug(`Processing UsernameProofMessage ${hash} (fid ${fid})`, { fid, hash });
        await processUserNameProofMessage(message, operation, trx);
        break;
      case MessageType.FRAME_ACTION:
        throw new AssertionError("Unexpected FRAME_ACTION message type");
      case MessageType.NONE:
        throw new AssertionError("Message contained no type");
      default:
        // If we're getting a type error on the line below, it means we've missed a case above.
        // Did we add a new message type?
        exhaustiveGuard(message.data.type);
    }
    statsd().increment(`messages.${operation}.${message.data.type}`);
  } catch (e: unknown) {
    const raw = Message.encode(message).finish();
    let blockedOnFid: number | null = null;
    let blockedOnHash: string | null = null;
    if (isStandardError(e)) {
      switch (e.reason) {
        case "missing_message":
        case "fid_not_registered": {
          log.debug(
            {
              messageHash: hash,
              fid: fid,
              error: e.name,
              errorReason: e.reason,
              errorMessage: e.message,
            },
            "Replicator unable to process message",
          );
          if (!(e instanceof HubEventProcessingBlockedError))
            throw new AssertionError("fid_not_registered/missing_message error isn't a HubEventProcessingBlockedError");
          blockedOnFid = e.blockedOnFid || null;
          blockedOnHash = e.blockedOnHash ? bytesToHex(e.blockedOnHash) : null;
          statsd().increment(`messages.blocked.${e.reason}`);
        }
      }
    }

    if (blockedOnFid) {
      await redis
        .pipeline()
        .hset(`messages-blocked-on-fid:${blockedOnFid}`, { [hash]: JSON.stringify(Message.toJSON(message)) })
        .expire(`messages-blocked-on-fid:${blockedOnFid}`, 60 * 60 * 24 * 30) // Expire after 30 days so we don't leak memory
        .exec();
    } else if (blockedOnHash) {
      await redis
        .pipeline()
        .hset(`messages-blocked-on-hash:${blockedOnHash}`, { [hash]: JSON.stringify(Message.toJSON(message)) })
        .expire(`messages-blocked-on-hash:${blockedOnHash}`, 60 * 60 * 24 * 30) // Expire after 30 days so we don't leak memory
        .exec();
    } else {
      log.error(
        {
          messageHash: hash,
          fid: fid,
          rawMessage: raw,
          operation: operation.toString(),
        },
        `Error processing message ${hash} (fid ${fid}): ${e}`,
      );
      throw e; // Message was not processed successfully, so throw so it gets retried later
    }
  }

  // If we make it here, then the message was processed successfully.
  // Check if there were any messages blocked by this message, and re-enqueue their
  // processing if so.
  const unblockedMessages = Object.values(await redis.hgetall(`messages-blocked-on-hash:${hash}`)).map(
    (messageJsonStr) => Message.fromJSON(JSON.parse(messageJsonStr)),
  );

  for (const unblockedMessage of unblockedMessages) {
    // Enqueue this message at the front of the queue since it might be blocking other messages
    await MergeMessage.enqueue({ messageJsonStr: JSON.stringify(Message.toJSON(unblockedMessage)) }, { lifo: true });
    // Remove it from the blocked set. If it's still blocked, it'll be re-added to the set later
    await redis.hdel(`messages-blocked-on-hash:${hash}`, bytesToHex(unblockedMessage.hash));
  }
}

// At the moment, transform message is explicitly used to change the data encoding for verification messages.
// Message attributes may be stored as JSONB, which does not allow for null bytes.
// However, cryptographic hashes and signatures can be seen as arbitrary bytes of data which means they may or may not
// contain 0 byte values, since a null byte in JSONB is just a 0.
// 1. When MessageType === VERIFICATION_ADD_ETH_ADDRESS:
//    - Convert all claim signatures to hex
//    - [Protocol.Solana] Convert block hash and address to base58 encoding
// 2. When MessageType === VERIFICATION_REMOVE:
//    - [Protocol.Solana] Convert block hash and address to base58 encoding
// TODO: There are many better ways to do this in the future.
function transformMessage(message: Message): Message {
  if (!message.data) {
    return message;
  }

  if (message.data.verificationAddAddressBody) {
    // for ALL protocol message verifications, encode the claim signatures to hex
    const claimSignature = toHexEncodedUint8Array(message.data.verificationAddAddressBody.claimSignature);
    let blockHash = message.data.verificationAddAddressBody.blockHash;
    let address = message.data.verificationAddAddressBody.address;
    // convert block hash and address to base58 encoded values for Solana
    // TODO: create separate processAdd for Solana
    switch (message.data.verificationAddAddressBody.protocol) {
      case Protocol.SOLANA: {
        const blockHashBase58 = bytesToBase58(blockHash);
        if (blockHashBase58.isErr()) {
          throw new AssertionError(`Invalid blockHash: ${blockHashBase58.error}`);
        }

        const blockHashBytes = base58ToBytes(blockHashBase58.value);
        if (blockHashBytes.isErr()) {
          throw new AssertionError(`Invalid blockHash: ${blockHashBytes.error}`);
        }

        blockHash = blockHashBytes.value;

        const addressBase58 = bytesToBase58(address);
        if (addressBase58.isErr()) {
          throw new AssertionError(`Invalid address: ${addressBase58.error}`);
        }

        const addressBytes = base58ToBytes(addressBase58.value);
        if (addressBytes.isErr()) {
          throw new AssertionError(`Invalid address: ${addressBytes.error}`);
        }

        address = addressBytes.value;
      }
    }
    message.data.verificationAddAddressBody = {
      ...message.data.verificationAddAddressBody,
      address: address,
      blockHash: blockHash,
      claimSignature: claimSignature,
    };
  }

  if (message.data.verificationRemoveBody) {
    if (message.data.verificationRemoveBody.protocol === Protocol.SOLANA) {
      const address = message.data.verificationRemoveBody.address;

      const addressBase58 = bytesToBase58(address);
      if (addressBase58.isErr()) {
        throw new AssertionError(`Invalid address: ${addressBase58.error}`);
      }

      const addressBytes = base58ToBytes(addressBase58.value);
      if (addressBytes.isErr()) {
        throw new AssertionError(`Invalid address: ${addressBytes.error}`);
      }

      message.data.verificationRemoveBody.address = addressBytes.value;
    }
  }

  return message;
}

export async function storeMessage(
  message: Message,
  operation: StoreMessageOperation,
  trx: DBTransaction,
  log: Logger,
): Promise<void>  {
  if (!message.data) throw new Error("Message missing data!"); // Shouldn't happen
  const now = new Date();

  log.debug(`Storing message ${bytesToHex(message.hash)} via ${operation} operation`);
  let records = [];
    
  let recordsJson = {
    createdAt: now,
    updatedAt: now,
    fid: message.data.fid,
    type: message.data.type,
    timestamp: farcasterTimeToDate(message.data.timestamp),
    hash: message.hash,
    hashScheme: message.hashScheme,
    signature: message.signature,
    signatureScheme: message.signatureScheme,
    signer: message.signer,
    raw: Message.encode(message).finish(),
    deletedAt: operation === "delete" ? now : null,
    prunedAt: operation === "prune" ? now : null,
    revokedAt: operation === "revoke" ? now : null,
    body: JSON.stringify(convertProtobufMessageBodyToJson(message)),
  }
  
  records = [
    {
      Data: JSON.stringify(recordsJson),
      PartitionKey: "MESSAGE_ADD",
    },
  ];
  console.log(`push kinesis start`);
  await putKinesisRecords(records);
  console.log(`push kinesis end`);
}

// export async function storeMessage(
//   message: Message,
//   operation: StoreMessageOperation,
//   trx: DBTransaction,
//   log: Logger,
// ) {
//   if (!message.data) throw new Error("Message missing data!"); // Shouldn't happen
//   const now = new Date();

//   log.debug(`Storing message ${bytesToHex(message.hash)} via ${operation} operation`);
//   let records = [];
    
//   let recordsJson = {
//     createdAt: now,
//     updatedAt: now,
//     fid: message.data.fid,
//     type: message.data.type,
//     timestamp: farcasterTimeToDate(message.data.timestamp),
//     hash: message.hash,
//     hashScheme: message.hashScheme,
//     signature: message.signature,
//     signatureScheme: message.signatureScheme,
//     signer: message.signer,
//     raw: Message.encode(message).finish(),
//     deletedAt: operation === "delete" ? now : null,
//     prunedAt: operation === "prune" ? now : null,
//     revokedAt: operation === "revoke" ? now : null,
//     body: JSON.stringify(convertProtobufMessageBodyToJson(message)),
//   }
  
//   records = [
//     {
//       Data: JSON.stringify(recordsJson),
//       PartitionKey: "MESSAGE_ADD",
//     },
//   ];
//   console.log(`push kinesis start`);
//   await putKinesisRecords(records);
//   console.log(`push kinesis end`);
//   await execute(
//     trx
//       .insertInto("messages")
//       .values({
//         createdAt: now,
//         updatedAt: now,
//         fid: message.data.fid,
//         type: message.data.type,
//         timestamp: farcasterTimeToDate(message.data.timestamp),
//         hash: message.hash,
//         hashScheme: message.hashScheme,
//         signature: message.signature,
//         signatureScheme: message.signatureScheme,
//         signer: message.signer,
//         raw: Message.encode(message).finish(),
//         deletedAt: operation === "delete" ? now : null,
//         prunedAt: operation === "prune" ? now : null,
//         revokedAt: operation === "revoke" ? now : null,
//         body: JSON.stringify(convertProtobufMessageBodyToJson(message)),
//       })
//       .onConflict((oc) =>
//         oc
//           .$call((qb) => (PARTITIONS ? qb.columns(["hash", "fid"]) : qb.columns(["hash"])))
//           .doUpdateSet(({ ref }) => ({
//             updatedAt: now,
//             // Only the signer or message state could have changed
//             signature: ref("excluded.signature"),
//             signatureScheme: ref("excluded.signatureScheme"),
//             signer: ref("excluded.signer"),
//             deletedAt: operation === "delete" ? now : null,
//             prunedAt: operation === "prune" ? now : null,
//             revokedAt: operation === "revoke" ? now : null,
//           }))
//           .where(({ or, eb, ref }) =>
//             // Only update if a value has actually changed
//             or([
//               eb("excluded.signature", "!=", ref("messages.signature")),
//               eb("excluded.signatureScheme", "!=", ref("messages.signatureScheme")),
//               eb("excluded.signer", "!=", ref("messages.signer")),
//               eb("excluded.deletedAt", "is", sql`distinct from ${ref("messages.deletedAt")}`),
//               eb("excluded.prunedAt", "is", sql`distinct from ${ref("messages.prunedAt")}`),
//               eb("excluded.revokedAt", "is", sql`distinct from ${ref("messages.revokedAt")}`),
//             ]),
//           ),
//       )
//       .returning(["hash", "updatedAt", "createdAt"]),
//   );
// }

export async function processHubEvent(hubEvent: HubEvent, db: DB, log: Logger, redis: Redis) {
  switch (hubEvent.type) {
    case HubEventType.MERGE_MESSAGE:
      log.info(`Processing merge event ${hubEvent.id}`);
      if (!isMergeMessageHubEvent(hubEvent)) throw new AssertionError(`Invalid MergeMessageHubEvent: ${hubEvent}`);
      await processMergeMessageHubEvent(hubEvent, db, log, redis);
      break;
    case HubEventType.PRUNE_MESSAGE:
      log.info(`Processing prune event ${hubEvent.id}`);
      if (!isPruneMessageHubEvent(hubEvent)) throw new AssertionError(`Invalid PruneMessageHubEvent: ${hubEvent}`);
      await processPruneMessageHubEvent(hubEvent, db, log, redis);
      break;
    case HubEventType.REVOKE_MESSAGE:
      log.info(`Processing revoke event ${hubEvent.id}`);
      if (!isRevokeMessageHubEvent(hubEvent)) throw new AssertionError(`Invalid RevokeMessageHubEvent: ${hubEvent}`);
      await processRevokeMessageHubEvent(hubEvent, db, log, redis);
      break;
    case HubEventType.MERGE_ON_CHAIN_EVENT:
      log.info(`Processing onchain event ${hubEvent.id}`);
      if (!isMergeOnChainHubEvent(hubEvent)) throw new AssertionError(`Invalid MergeOnChainHubEvent: ${hubEvent}`);
      await processMergeOnChainHubEvent(hubEvent, db, log, redis);
      break;
    case HubEventType.MERGE_USERNAME_PROOF:
      log.info(`Processing username proof event ${hubEvent.id}`);
      if (!isMergeUsernameProofHubEvent(hubEvent))
        throw new AssertionError(`Invalid MergeUsernameProofHubEvent: ${hubEvent}`);
      await processUserNameProofHubEvent(hubEvent, db, log, redis);
      break;
    case HubEventType.NONE:
      throw new AssertionError("HubEvent contained no type");
    default:
      // If we're getting a type error on the line below, it means we've missed a case above.
      // Did we add a new event type?
      exhaustiveGuard(hubEvent.type);
  }
}

export async function processMergeOnChainHubEvent(
  hubEvent: MergeOnChainEventHubEvent,
  db: DB,
  log: Logger,
  redis: Redis,
) {
  await processOnChainEvents([hubEvent.mergeOnChainEventBody.onChainEvent], db, log, redis);
}

export async function processMergeMessageHubEvent(hubEvent: MergeMessageHubEvent, db: DB, log: Logger, redis: Redis) {
  const { message, deletedMessages } = hubEvent.mergeMessageBody;
  await executeTx(db, async (trx) => {
    await mergeMessage(message, trx, log, redis);

    for (const deletedMessage of deletedMessages) {
      await deleteMessage(deletedMessage, trx, log, redis);
    }
  });
}

export async function processPruneMessageHubEvent(hubEvent: PruneMessageHubEvent, db: DB, log: Logger, redis: Redis) {
  await executeTx(db, async (trx) => {
    await pruneMessage(hubEvent.pruneMessageBody.message, trx, log, redis);
  });
}

export async function processRevokeMessageHubEvent(hubEvent: RevokeMessageHubEvent, db: DB, log: Logger, redis: Redis) {
  await executeTx(db, async (trx) => {
    await revokeMessage(hubEvent.revokeMessageBody.message, trx, log, redis);
  });
}

export async function processUserNameProofHubEvent(
  hubEvent: MergeUsernameProofHubEvent,
  db: DB,
  log: Logger,
  redis: Redis,
) {
  const { usernameProof, usernameProofMessage, deletedUsernameProof, deletedUsernameProofMessage } =
    hubEvent.mergeUsernameProofBody;
  await executeTx(db, async (trx) => {
    if (deletedUsernameProof) await processUserNameProofRemove(deletedUsernameProof, trx);
    if (deletedUsernameProofMessage) await revokeMessage(deletedUsernameProofMessage, trx, log, redis);
    if (usernameProof) await processUserNameProofAdd(usernameProof, trx);
    if (usernameProofMessage) await mergeMessage(usernameProofMessage, trx, log, redis);
  });
}
