import * as protobufs from '@farcaster/protobufs';

export const MERGE_TIMEOUT_DEFAULT = 10_000; // 10 seconds

export type StorePruneOptions = {
  pruneSizeLimit?: number; // Max number of messages per fid
  pruneTimeLimit?: number; // Max age (in seconds) of any message in the store
};

export type PrefixRangeOptions = {
  startPrefix?: Buffer | undefined;
  limit?: number | undefined;
};

export type MessageRange<T extends protobufs.Message> = {
  messages: T[];
  nextPrefix?: Buffer | undefined;
};
