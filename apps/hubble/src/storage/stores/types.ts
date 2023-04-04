import { Message } from '@farcaster/hub-nodejs';
export const MERGE_TIMEOUT_DEFAULT = 10_000; // 10 seconds

export type StorePruneOptions = {
  pruneSizeLimit?: number; // Max number of messages per fid
  pruneTimeLimit?: number; // Max age (in seconds) of any message in the store
};

export const PAGE_SIZE_MAX = 10_000;

export type PageOptions = {
  pageToken?: Uint8Array | undefined;
  pageSize?: number | undefined;
  reverse?: boolean | undefined;
};

export type MessagesPage<T extends Message> = {
  messages: T[];
  nextPageToken?: Uint8Array | undefined;
};
