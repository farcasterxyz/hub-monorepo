import { DbStats, FarcasterNetwork, HubAsyncResult, HubError } from "@farcaster/core";
import { LATEST_DB_SCHEMA_VERSION } from "../storage/db/migrations/migrations.js";
import axios from "axios";
import { err, ok, ResultAsync } from "neverthrow";
import { SNAPSHOT_S3_DEFAULT_BUCKET } from "../hubble.js";

export type SnapshotMetadata = Partial<DbStats> & {
  key: string;
  timestamp: number;
  serverDate: string;
};

export const isValidSnapshotMetadata = (data: Record<string, unknown>): data is SnapshotMetadata => {
  return data["key"] !== undefined && data["timestamp"] !== undefined && data["serverDate"] !== undefined;
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

export const snapshotURL = async (
  fcNetwork: FarcasterNetwork,
  prevVersionCounter?: number,
  s3Bucket: string = SNAPSHOT_S3_DEFAULT_BUCKET,
): HubAsyncResult<[string, SnapshotMetadata]> => {
  const dirPath = snapshotDirectoryPath(fcNetwork, prevVersionCounter, s3Bucket);
  const response = await fetchSnapshotMetadata(dirPath);
  if (response.isErr()) {
    return err(response.error);
  }
  const data: SnapshotMetadata = response.value;
  return ok([`https://${s3Bucket}/${data.key}`, data]);
};
export const snapshotDirectoryPath = (
  fcNetwork: FarcasterNetwork,
  prevVersionCounter?: number,
  s3Bucket: string = SNAPSHOT_S3_DEFAULT_BUCKET,
): string => {
  const network = FarcasterNetwork[fcNetwork].toString();
  return `https://${s3Bucket}/snapshots/${network}/DB_SCHEMA_${LATEST_DB_SCHEMA_VERSION - (prevVersionCounter ?? 0)}`;
};
