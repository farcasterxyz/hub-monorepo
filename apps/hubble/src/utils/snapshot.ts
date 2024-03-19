import { DbStats, FarcasterNetwork, HubAsyncResult, HubError } from "@farcaster/core";
import { LATEST_DB_SCHEMA_VERSION } from "../storage/db/migrations/migrations.js";
import axios from "axios";
import { err, ok } from "neverthrow";

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
  const response = await axios.get(latestJSON);
  if (response.status !== 200) {
    return err(
      new HubError(
        "unavailable.network_failure",
        `Failed to get latest snapshot from ${latestJSON} [${response.status}]`,
      ),
    );
  }
  if (!isValidSnapshotMetadata(response.data)) {
    return err(
      new HubError(
        "bad_request.validation_failure",
        `Invalid snapshot metadata from ${latestJSON} [${JSON.stringify(response.data)}]`,
      ),
    );
  }
  return ok(response.data as SnapshotMetadata);
};

export const snapshotURL = async (
  fcNetwork: FarcasterNetwork,
  prevVersionCounter?: number,
): HubAsyncResult<[string, SnapshotMetadata]> => {
  const dirPath = snapshotDirectoryPath(fcNetwork, prevVersionCounter);
  const response = await fetchSnapshotMetadata(dirPath);
  if (response.isErr()) {
    return err(response.error);
  }
  const data: SnapshotMetadata = response.value;
  return ok([`https://download.farcaster.xyz/${data.key}`, data]);
};
export const snapshotDirectoryPath = (fcNetwork: FarcasterNetwork, prevVersionCounter?: number): string => {
  const network = FarcasterNetwork[fcNetwork].toString();
  return `https://download.farcaster.xyz/snapshots/${network}/DB_SCHEMA_${
    LATEST_DB_SCHEMA_VERSION - (prevVersionCounter ?? 0)
  }`;
};
