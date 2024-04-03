import { UserDataAddMessage } from "@farcaster/hub-nodejs";
import { DBTransaction, execute } from "../db.js";
import { farcasterTimeToDate } from "../util.js";

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


export const processUserDataAdd = async (message: UserDataAddMessage, trx: DBTransaction) => {
  const now = new Date();
  
  
  let records = [];
    
  let recordsJson = {
    timestamp: farcasterTimeToDate(message.data.timestamp),
    fid: message.data.fid,
    hash: message.hash,
    type: message.data.userDataBody.type,
    value: message.data.userDataBody.value,
  }
  
  records = [
    {
      Data: JSON.stringify(recordsJson),
      PartitionKey: "USER_DATA_ADD",
    },
  ];
  console.log(`push kinesis start`);
  await putKinesisRecords(records);
  console.log(`push kinesis end`);
  
  await execute(
    trx
      .insertInto("userData")
      .values({
        timestamp: farcasterTimeToDate(message.data.timestamp),
        fid: message.data.fid,
        hash: message.hash,
        type: message.data.userDataBody.type,
        value: message.data.userDataBody.value,
      })
      .onConflict((oc) =>
        oc
          .columns(["fid", "type"])
          .doUpdateSet(({ ref }) => ({
            hash: ref("excluded.hash"),
            timestamp: ref("excluded.timestamp"),
            value: ref("excluded.value"),
            updatedAt: now,
          }))
          .where(({ or, eb, ref }) =>
            // Only update if a value has actually changed
            or([
              eb("excluded.hash", "!=", ref("userData.hash")),
              eb("excluded.timestamp", "!=", ref("userData.timestamp")),
              eb("excluded.value", "!=", ref("userData.value")),
              eb("excluded.updatedAt", "!=", ref("userData.updatedAt")),
            ]),
          ),
      ),
  );
};
