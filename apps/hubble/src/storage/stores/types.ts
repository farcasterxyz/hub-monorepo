export const MERGE_TIMEOUT_DEFAULT = 10_000; // 10 seconds

export type StorePruneOptions = {
  pruneSizeLimit?: number; // Max number of messages per fid
  pruneTimeLimit?: number; // Max age (in seconds) of any message in the store
};
