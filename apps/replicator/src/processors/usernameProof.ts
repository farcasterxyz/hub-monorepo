import { UserNameProof, UsernameProofMessage, bytesToUtf8String } from "@farcaster/hub-nodejs";
import { DBTransaction } from "../db.js";
import { StoreMessageOperation, farcasterTimeToDate } from "../util.js";

import AWS from 'aws-sdk';
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


export const processUserNameProofMessage = async (
  message: UsernameProofMessage,
  operation: StoreMessageOperation,
  trx: DBTransaction,
) => {
  const proof = message.data.usernameProofBody;
  if (operation === "merge") {
    await processUserNameProofAdd(proof, trx);
  } else {
    await processUserNameProofRemove(proof, trx);
  }
};

export const processUserNameProofAdd = async (proof: UserNameProof, trx: DBTransaction) => {
  const username = bytesToUtf8String(proof.name)._unsafeUnwrap();
  const timestamp = farcasterTimeToDate(proof.timestamp);

  // A removal can also be represented as a transfer to FID 0
  if (proof.fid === 0) {
    return processUserNameProofRemove(proof, trx);
  }
  
  let records = [];
    
  let recordsJson = {
    timestamp,
    fid: proof.fid,
    type: proof.type,
    username,
    signature: proof.signature,
    owner: proof.owner,
  }
  
  records = [
    {
      Data: JSON.stringify(recordsJson),
      PartitionKey: "USERNAME_PROOFS_ADD",
    },
  ];
  
  let records2Json = {
      registeredAt: timestamp,
      fid: proof.fid,
      type: proof.type,
      username,
      deletedAt: proof.fid === 0 ? timestamp : null,
  }
  
  let records2 = [
    {
      Data: JSON.stringify(recordsJson),
      PartitionKey: "FNAMES_ADD",
    },
  ];
  console.log(`push kinesis start`);
  await putKinesisRecords(records);
  console.log(`push kinesis end`);

  await trx
    .insertInto("usernameProofs")
    .values({
      timestamp,
      fid: proof.fid,
      type: proof.type,
      username,
      signature: proof.signature,
      owner: proof.owner,
    })
    .onConflict((oc) =>
      oc
        .columns(["username", "timestamp"])
        .doUpdateSet({ owner: proof.owner, fid: proof.fid, deletedAt: null, updatedAt: new Date() }),
    )
    .execute();

  
  console.log(`push kinesis start`);
  await putKinesisRecords(records2);
  console.log(`push kinesis end`);
  await trx
    .insertInto("fnames")
    .values({
      registeredAt: timestamp,
      fid: proof.fid,
      type: proof.type,
      username,
      deletedAt: proof.fid === 0 ? timestamp : null, // Sending to FID 0 is treated as delete
    })
    .onConflict((oc) => oc.column("fid").doUpdateSet({ username, updatedAt: new Date() }))
    .execute();
};

export const processUserNameProofRemove = async (proof: UserNameProof, trx: DBTransaction) => {
  const username = bytesToUtf8String(proof.name)._unsafeUnwrap();
  const now = new Date();

  await trx
    .updateTable("usernameProofs")
    .where("username", "=", username)
    .where("timestamp", "=", farcasterTimeToDate(proof.timestamp))
    .set({ deletedAt: now, updatedAt: now })
    .execute();

  await trx.updateTable("fnames").where("username", "=", username).set({ deletedAt: now, updatedAt: now }).execute();
};
