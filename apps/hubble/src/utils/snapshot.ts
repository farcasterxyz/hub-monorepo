import { DbStats, FarcasterNetwork, HubAsyncResult, HubError } from "@farcaster/core";
import { LATEST_DB_SCHEMA_VERSION } from "../storage/db/migrations/migrations.js";
import axios from "axios";
import { err, ok, ResultAsync } from "neverthrow";
import { S3_REGION, SNAPSHOT_S3_DEFAULT_BUCKET } from "../hubble.js";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";
import { Upload } from "@aws-sdk/lib-storage";
import { logger } from "./logger.js";

export type SnapshotMetadata = Partial<DbStats> & {
  keyBase: string;
  chunks: string[];
  timestamp: number;
  serverDate: string;
};

export const isValidSnapshotMetadata = (data: Record<string, unknown>): data is SnapshotMetadata => {
  return data["keyBase"] !== undefined && data["timestamp"] !== undefined && data["serverDate"] !== undefined;
};

export const fetchSnapshotMetadata = async (snapshotPrefixURI: string): HubAsyncResult<SnapshotMetadata> => {
  const latestJSON = `${snapshotPrefixURI}/latest.json`;
  const response = await ResultAsync.fromPromise(axios.get(latestJSON, { timeout: 2 * 1000 }), (error) => {
    return new HubError("unavailable.network_failure", `Failed to get latest snapshot from ${latestJSON} [${error}]`);
  });

  if (response.isErr()) {
    return err(response.error);
  }

  const result = response.value;
  if (result.status !== 200) {
    return err(
      new HubError(
        "unavailable.network_failure",
        `Failed to get latest snapshot from ${latestJSON} [${result.status}]`,
      ),
    );
  }
  if (!isValidSnapshotMetadata(result.data)) {
    return err(
      new HubError(
        "bad_request.validation_failure",
        `Invalid snapshot metadata from ${latestJSON} [${JSON.stringify(result.data)}]`,
      ),
    );
  }
  return ok(result.data as SnapshotMetadata);
};

export const snapshotDirectory = (fcNetwork: FarcasterNetwork, prevVersionCounter?: number): string => {
  const network = FarcasterNetwork[fcNetwork].toString();
  return `snapshots/${network}/DB_SCHEMA_${LATEST_DB_SCHEMA_VERSION - (prevVersionCounter ?? 0)}`;
};
export const snapshotURLAndMetadata = async (
  fcNetwork: FarcasterNetwork,
  prevVersionCounter?: number,
  s3Bucket: string = SNAPSHOT_S3_DEFAULT_BUCKET,
): HubAsyncResult<[string, SnapshotMetadata]> => {
  const dirPath = snapshotURL(fcNetwork, prevVersionCounter, s3Bucket);
  const response = await fetchSnapshotMetadata(dirPath);
  if (response.isErr()) {
    return err(response.error);
  }
  const data: SnapshotMetadata = response.value;
  return ok([`https://${s3Bucket}/${data.keyBase}`, data]);
};
export const snapshotURL = (
  fcNetwork: FarcasterNetwork,
  prevVersionCounter?: number,
  s3Bucket: string = SNAPSHOT_S3_DEFAULT_BUCKET,
): string => {
  return `https://${s3Bucket}/${snapshotDirectory(fcNetwork, prevVersionCounter)}`;
};

export const uploadToS3 = async (
  fcNetwork: FarcasterNetwork,
  chunkedDirPath: string,
  s3Bucket: string = SNAPSHOT_S3_DEFAULT_BUCKET,
  messageCount?: number,
): HubAsyncResult<string> => {
  const startTimestamp = Date.now();
  const s3 = new S3Client({
    region: S3_REGION,
  });

  // The AWS key is "snapshots/{network}/{DB_SCHEMA_VERSION}/snapshot-{yyyy-mm-dd}-{timestamp}.tar.gz"
  const keyBase = `${snapshotDirectory(fcNetwork)}/snapshot-${
    new Date(startTimestamp).toISOString().split("T")[0]
  }-${Math.floor(startTimestamp / 1000)}.tar.gz`;

  logger.info({ chunkedDirPath, keyBase, s3Bucket }, "Uploading snapshot to S3");

  // Read all the chunks files in the chunkedDirPath and upload them to S3

  // Get all the files in the directory
  const files = fs.readdirSync(chunkedDirPath);
  files.sort();

  // Upload each file to S3
  for (const file of files) {
    const key = `${keyBase}/${file}`;
    const filePath = `${chunkedDirPath}/${file}`;

    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", function (err) {
      logger.error(`S3 File Error: ${err}`);
    });

    // The chunks should be uploaded via multipart upload to S3
    const chunkUploadParams = new Upload({
      client: s3,
      params: {
        Bucket: s3Bucket,
        Key: key,
        Body: fileStream,
      },
      queueSize: 4, // 4 concurrent uploads
      partSize: 1000 * 1024 * 1024, // 1 GB
    });

    chunkUploadParams.on("httpUploadProgress", (progress) => {
      logger.info({ progress }, "Uploading snapshot to S3 - progress");
    });

    try {
      await chunkUploadParams.done();
      logger.info({ key, file, timeTakenMs: Date.now() - startTimestamp }, "Snapshot chunk uploaded to S3");
    } catch (e: unknown) {
      return err(new HubError("unavailable.network_failure", (e as Error).message));
    }
  }

  const metadata: SnapshotMetadata = {
    keyBase,
    chunks: files,
    timestamp: startTimestamp,
    serverDate: new Date(startTimestamp).toISOString(),
    ...(messageCount && { numMessages: messageCount }),
  };

  const latestJsonParams = {
    Bucket: s3Bucket,
    Key: `${snapshotDirectory(fcNetwork)}/latest.json`,
    Body: JSON.stringify(metadata, null, 2),
  };

  try {
    logger.info({ latestJsonParams, metadata }, "Preparing latest.json for uploading to S3");
    await s3.send(new PutObjectCommand(latestJsonParams));
    logger.info({}, "Snapshot latest.json uploaded to S3");
    return ok(keyBase);
  } catch (e: unknown) {
    return err(new HubError("unavailable.network_failure", (e as Error).message));
  }
};
