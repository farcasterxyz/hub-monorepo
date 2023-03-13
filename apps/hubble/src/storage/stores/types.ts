import * as protobufs from '@farcaster/protobufs';

export const MERGE_TIMEOUT_DEFAULT = 10_000; // 10 seconds

export type StorePruneOptions = {
  pruneSizeLimit?: number; // Max number of messages per fid
  pruneTimeLimit?: number; // Max age (in seconds) of any message in the store
};

export const PAGE_LIMIT_MAX = 10_000;

export type PageOptions = {
  pageKey?: Buffer | undefined;
  limit?: number | undefined;
};

export type MessagesPage<T extends protobufs.Message> = {
  messages: T[];
  nextPageKey?: Buffer | undefined;
};
