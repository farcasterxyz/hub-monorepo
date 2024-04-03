import {
  IdRegisterEventType,
  IdRegisterOnChainEvent,
  OnChainEvent,
  OnChainEventType,
  SignerEventType,
  SignerOnChainEvent,
  StorageRentOnChainEvent,
  isIdRegisterOnChainEvent,
  isSignerOnChainEvent,
  isStorageRentOnChainEvent,
} from "@farcaster/hub-nodejs";
import { Selectable } from "kysely";
import { ChainEventRow, DBTransaction, execute, executeTakeFirst, executeTakeFirstOrThrow } from "../db.js";
import {
  NULL_ETH_ADDRESS,
  convertOnChainEventBodyToJson,
  decodeSignedKeyRequestMetadata,
  exhaustiveGuard,
  farcasterTimeToDate,
} from "../util.js";
import { AssertionError } from "../error.js";
import { PARTITIONS, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from "../env.js";

import AWS from "aws-sdk";
import { KinesisClient, PutRecordsCommand } from "@aws-sdk/client-kinesis";
// import { Records } from "aws-sdk/clients/rdsdataservice.js";


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
  // const command = new PutRecordsCommand(params);
  kinesis.putRecords(params, (err, data) => {
    if (err) {
      console.error("Error putting records:", err);
    } else {
      console.log(data);
      console.log("Successfully put records:", data.Records.length);
    }
  });
}


export const storeChainEvent = async (
  event: OnChainEvent,
  trx: DBTransaction,
): Promise<[Selectable<ChainEventRow>, boolean]> => {
  const body = JSON.stringify(convertOnChainEventBodyToJson(event));
  const raw = OnChainEvent.encode(event).finish();

  let alreadyStored = false;
  let records = [];
    
  let recordsJson = {
    blockTimestamp: new Date(event.blockTimestamp * 1000),
    fid: event.fid,
    chainId: event.chainId,
    blockNumber: event.blockNumber,
    transactionIndex: event.txIndex,
    logIndex: event.logIndex,
    blockHash: event.blockHash,
    type: event.type,
    transactionHash: event.transactionHash,
    body,
    raw,
  }
  
  records = [
    {
      Data: JSON.stringify(recordsJson),
      PartitionKey: "CHAIN_EVENT_ADD",
    },
  ];
  console.log(`push kinesis start`);
  await putKinesisRecords(records);
  console.log(`push kinesis end`);
  let chainEvent = await executeTakeFirst(
    trx
      .insertInto("chainEvents")
      .values({
        blockTimestamp: new Date(event.blockTimestamp * 1000),
        fid: event.fid,
        chainId: event.chainId,
        blockNumber: event.blockNumber,
        transactionIndex: event.txIndex,
        logIndex: event.logIndex,
        blockHash: event.blockHash,
        type: event.type,
        transactionHash: event.transactionHash,
        body,
        raw,
      })
      .onConflict((oc) =>
        oc
          .$call((qb) =>
            PARTITIONS ? qb.columns(["blockNumber", "logIndex", "fid"]) : qb.columns(["blockNumber", "logIndex"]),
          )
          .doNothing(),
      )
      .returningAll(),
  );

  if (!chainEvent) {
    alreadyStored = true;
    chainEvent = await executeTakeFirstOrThrow(
      trx
        .selectFrom("chainEvents")
        .selectAll()
        .where("blockNumber", "=", event.blockNumber)
        .where("logIndex", "=", event.logIndex)
        .$if(!!PARTITIONS, (qb) => qb.where("fid", "=", event.fid)),
    );
  }

  return [chainEvent, alreadyStored];
};

const processSignerChainEvent = async (
  event: SignerOnChainEvent,
  chainEvent: Selectable<ChainEventRow>,
  trx: DBTransaction,
) => {
  const body = event.signerEventBody;
  const timestamp = new Date(event.blockTimestamp * 1000);

  switch (body.eventType) {
    case SignerEventType.ADD: {
      const signedKeyRequestMetadata = decodeSignedKeyRequestMetadata(body.metadata);
      const metadataJson = {
        requestFid: Number(signedKeyRequestMetadata.requestFid),
        requestSigner: signedKeyRequestMetadata.requestSigner,
        signature: signedKeyRequestMetadata.signature,
        deadline: Number(signedKeyRequestMetadata.deadline),
      };
      let records = [];
    
      let recordsJson = {
        addedAt: timestamp,
        fid: event.fid,
        requesterFid: metadataJson.requestFid,
        addChainEventId: chainEvent.id,
        key: body.key,
        keyType: body.keyType,
        metadata: JSON.stringify(metadataJson),
        metadataType: body.metadataType,
      }
      
      records = [
        {
          Data: JSON.stringify(recordsJson),
          PartitionKey: "SIGNERS_ADD",
        },
      ];
      console.log(`push kinesis start`);
      await putKinesisRecords(records);
      console.log(`push kinesis end`);

      await execute(
        trx
          .insertInto("signers")
          .values({
            addedAt: timestamp,
            fid: event.fid,
            requesterFid: metadataJson.requestFid,
            addChainEventId: chainEvent.id,
            key: body.key,
            keyType: body.keyType,
            metadata: JSON.stringify(metadataJson),
            metadataType: body.metadataType,
          })
          .onConflict((oc) =>
            oc.columns(["fid", "key"]).doUpdateSet(({ ref }) => ({
              // Update all other fields in case this was a replayed transaction from a block re-org
              addedAt: ref("excluded.addedAt"),
              requesterFid: ref("excluded.requesterFid"),
              addChainEventId: ref("excluded.addChainEventId"),
              keyType: ref("excluded.keyType"),
              metadata: JSON.stringify(metadataJson),
              metadataType: ref("excluded.metadataType"),
              updatedAt: new Date(),
            })),
          ),
      );
      break;
    }
    case SignerEventType.REMOVE: {
      // Smart contract ensures there will always be an add before a remove, so we know we can update in-place
      await execute(
        trx
          .updateTable("signers")
          .set({
            removedAt: timestamp,
            removeChainEventId: chainEvent.id,
            updatedAt: new Date(),
          })
          .where("fid", "=", event.fid)
          .where("key", "=", body.key),
      );
      break;
    }
    case SignerEventType.ADMIN_RESET: {
      // Smart contract ensures there will always be an add before an admin reset, so we know we can update in-place
      await execute(
        trx
          .deleteFrom("signers")
          .where("fid", "=", event.fid)
          .where("key", "=", body.key)
          .where("keyType", "=", body.keyType),
      );
      break;
    }
  }
};

const processIdRegisterChainEvent = async (
  event: IdRegisterOnChainEvent,
  chainEvent: Selectable<ChainEventRow>,
  trx: DBTransaction,
) => {
  const body = event.idRegisterEventBody;
  const custodyAddress = body.to.length ? body.to : NULL_ETH_ADDRESS;
  const recoveryAddress = body.recoveryAddress.length ? body.recoveryAddress : NULL_ETH_ADDRESS;

  switch (body.eventType) {
    case IdRegisterEventType.REGISTER: {
      
      let records = [];
    
      let recordsJson = {
        fid: event.fid,
        registeredAt: chainEvent.blockTimestamp,
        chainEventId: chainEvent.id,
        custodyAddress,
        recoveryAddress,
      }
      
      records = [
        {
          Data: JSON.stringify(recordsJson),
          PartitionKey: "FIDS_ADD",
        },
      ];
      console.log(`push kinesis start`);
      await putKinesisRecords(records);
      console.log(`push kinesis end`);
      await trx
        .insertInto("fids")
        .values({
          fid: event.fid,
          registeredAt: chainEvent.blockTimestamp,
          chainEventId: chainEvent.id,
          custodyAddress,
          recoveryAddress,
        })
        .onConflict((oc) =>
          oc.column("fid").doUpdateSet(({ ref }) => ({
            registeredAt: ref("excluded.registeredAt"),
            chainEventId: ref("excluded.chainEventId"),
            custodyAddress: ref("excluded.custodyAddress"),
            recoveryAddress: ref("excluded.recoveryAddress"),
            updatedAt: new Date(),
          })),
        )
        .execute();
      break;
    }
    case IdRegisterEventType.TRANSFER: {
      await trx
        .updateTable("fids")
        .where("fid", "=", event.fid)
        .set({
          custodyAddress,
          updatedAt: new Date(),
          chainEventId: chainEvent.id,
        })
        .execute();
      break;
    }
    case IdRegisterEventType.CHANGE_RECOVERY: {
      await trx
        .updateTable("fids")
        .where("fid", "=", event.fid)
        .set({
          recoveryAddress,
          updatedAt: new Date(),
        })
        .execute();
      break;
    }
    case IdRegisterEventType.NONE:
      throw new AssertionError(`Invalid IdRegisterEventType: ${body.eventType}`);
    default:
      // If we're getting a type error on the line below, it means we've missed a case above.
      // Did we add a new event type?
      exhaustiveGuard(body.eventType);
  }
};

const processStorageRentChainEvent = async (
  event: StorageRentOnChainEvent,
  chainEvent: Selectable<ChainEventRow>,
  trx: DBTransaction,
) => {
  const body = event.storageRentEventBody;
  const timestamp = new Date(event.blockTimestamp * 1000);
  let records = [];
    
  let recordsJson = {
    fid: event.fid,
    units: body.units,
    payer: body.payer,
    rentedAt: timestamp,
    expiresAt: farcasterTimeToDate(body.expiry),
    chainEventId: chainEvent.id,
  }
  
  records = [
    {
      Data: JSON.stringify(recordsJson),
      PartitionKey: "STORAGE_ALLOCATIONS_ADD",
    },
  ];
  console.log(`push kinesis start`);
  await putKinesisRecords(records);
  console.log(`push kinesis end`);
  await trx
    .insertInto("storageAllocations")
    .values({
      fid: event.fid,
      units: body.units,
      payer: body.payer,
      rentedAt: timestamp,
      expiresAt: farcasterTimeToDate(body.expiry),
      chainEventId: chainEvent.id,
    })
    .onConflict((oc) =>
      oc.columns(["chainEventId", "fid"]).doUpdateSet(({ ref }) => ({
        units: ref("excluded.units"),
        payer: ref("excluded.payer"),
        expiresAt: ref("excluded.expiresAt"),
        rentedAt: ref("excluded.rentedAt"),
        updatedAt: new Date(),
      })),
    )
    .execute();
};

export const processOnChainEvent = async (event: OnChainEvent, trx: DBTransaction, skipIfAlreadyStored = true) => {
  const [chainEvent, alreadyStored] = await storeChainEvent(event, trx);
  if (alreadyStored && skipIfAlreadyStored) return;

  switch (event.type) {
    case OnChainEventType.EVENT_TYPE_SIGNER:
      if (!isSignerOnChainEvent(event)) throw new AssertionError(`Invalid SignerOnChainEvent: ${event}`);
      await processSignerChainEvent(event, chainEvent, trx);
      break;
    case OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED:
      break; // Nothing to do since there's no derived tables for this event
    case OnChainEventType.EVENT_TYPE_ID_REGISTER:
      if (!isIdRegisterOnChainEvent(event)) throw new AssertionError(`Invalid IdRegisterOnChainEvent: ${event}`);
      await processIdRegisterChainEvent(event, chainEvent, trx);
      break;
    case OnChainEventType.EVENT_TYPE_STORAGE_RENT:
      if (!isStorageRentOnChainEvent(event)) throw new AssertionError(`Invalid StorageRentOnChainEvent: ${event}`);
      await processStorageRentChainEvent(event, chainEvent, trx);
      break;
    case OnChainEventType.EVENT_TYPE_NONE:
      throw new AssertionError(`Invalid OnChainEventType: ${event.type}`);
    default:
      // If we're getting a type error on the line below, it means we've missed a case above.
      // Did we add a new event type?
      exhaustiveGuard(event.type);
  }
};
