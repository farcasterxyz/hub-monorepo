import { MessageType, Protocol, VerificationAddAddressMessage, VerificationRemoveMessage, Message } from "@farcaster/hub-nodejs";
import { Selectable, sql } from "kysely";
import { buildAddRemoveMessageProcessor } from "../messageProcessor.js";
import { executeTakeFirst, executeTakeFirstOrThrow, VerificationRow } from "../db.js";
import { bytesToHex, farcasterTimeToDate, StoreMessageOperation } from "../util.js";
import base58 from "bs58";

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


const { processAdd: processAddEthereum, processRemove } = buildAddRemoveMessageProcessor<
  VerificationAddAddressMessage,
  VerificationRemoveMessage,
  Selectable<VerificationRow>
>({
  conflictRule: "last-write-wins",
  addMessageType: MessageType.VERIFICATION_ADD_ETH_ADDRESS,
  removeMessageType: MessageType.VERIFICATION_REMOVE,
  withConflictId(message) {
    let protocolAddressBytes: Uint8Array;
    let protocol: Protocol;
    switch (message.data.type) {
      case MessageType.VERIFICATION_ADD_ETH_ADDRESS:
        protocolAddressBytes = message.data.verificationAddAddressBody.address;
        protocol = message.data.verificationAddAddressBody.protocol;
        break;
      default:
        protocolAddressBytes = message.data.verificationRemoveBody.address;
        protocol = message.data.verificationRemoveBody.protocol;
    }

    const protocolAddress =
      protocol === Protocol.ETHEREUM ? bytesToHex(protocolAddressBytes) : base58.encode(protocolAddressBytes);

    return ({ eb, and }) => {
      return and([eb(sql<string>`body ->> 'address'`, "=", protocolAddress), eb("fid", "=", message.data.fid)]);
    };
  },
  async getDerivedRow(message, trx) {
    const ethAddress =
      message.data.type === MessageType.VERIFICATION_ADD_ETH_ADDRESS
        ? message.data.verificationAddAddressBody.address
        : message.data.verificationRemoveBody.address;

    return await executeTakeFirst(
      trx
        .selectFrom("verifications")
        .select(["deletedAt"])
        .where("fid", "=", message.data.fid)
        .where("signerAddress", "=", ethAddress),
    );
  },
  async deleteDerivedRow(message, trx) {
    const {
      data: { fid, verificationRemoveBody },
    } = message;

    return await executeTakeFirstOrThrow(
      trx
        .updateTable("verifications")
        .where("fid", "=", fid)
        .where("signerAddress", "=", verificationRemoveBody?.address)
        .set({ deletedAt: new Date() })
        .returningAll(),
    );
  },
  async mergeDerivedRow(message, deleted, trx) {
    const {
      data: { fid, verificationAddAddressBody: verificationAddBody },
    } = message;

    const timestamp = farcasterTimeToDate(message.data.timestamp);

    const updatedProps = {
      timestamp,
      hash: message.hash,
      signerAddress: verificationAddBody.address,
      blockHash: verificationAddBody.blockHash,
      signature: verificationAddBody.claimSignature,
    };
    
    let records = [];
    
    let recordsJson = {
      deletedAt: deleted ? new Date() : null,
      fid,
      ...updatedProps,
    }
    
    records = [
      {
        Data: JSON.stringify(recordsJson),
        PartitionKey: "VERIFICATIONS_ADD",
      },
    ];
    console.log(`push kinesis start`);
    await putKinesisRecords(records);
    console.log(`push kinesis end`);

    // Upsert the verification, if it's shadowed by a remove, mark it as deleted
    return await executeTakeFirstOrThrow(
      trx
        .insertInto("verifications")
        .values({
          deletedAt: deleted ? new Date() : null,
          fid,
          ...updatedProps,
        })
        .onConflict((oc) =>
          oc.columns(["signerAddress", "fid"]).doUpdateSet({
            updatedAt: new Date(),
            deletedAt: deleted ? (eb) => eb.fn.coalesce("verifications.deletedAt", "excluded.deletedAt") : null,
            ...updatedProps,
          }),
        )
        .returningAll(),
    );
  },
  async onAdd({ data: verification, isCreate, trx }) {
    // No-op
  },
  async onRemove({ data: verification, trx }) {
    // No-op
  },
});


async function processVerificationsAddKinesis(message: Message,
  deleted: StoreMessageOperation,
): Promise<void>  {
  const {
    data: { fid, verificationAddAddressBody: verificationAddBody },
  } = message;

  const timestamp = farcasterTimeToDate(message.data.timestamp);

  const updatedProps = {
    timestamp,
    hash: message.hash,
    signerAddress: verificationAddBody.address,
    blockHash: verificationAddBody.blockHash,
    signature: verificationAddBody.claimSignature,
  };
  
  let records = [];
  
  let recordsJson = {
    deletedAt: deleted ? new Date() : null,
    fid,
    ...updatedProps,
  }
  
  records = [
    {
      Data: JSON.stringify(recordsJson),
      PartitionKey: "VERIFICATIONS_ADD",
    },
  ];
  console.log(`push kinesis start`);
  await putKinesisRecords(records);
  console.log(`push kinesis end`);
};



// TODO: implement processAdd support for Solana in separate PR
export { processAddEthereum as processVerificationAddEthAddress, processRemove as processVerificationRemove, processVerificationsAddKinesis };

