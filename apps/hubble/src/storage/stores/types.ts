import { Message } from "@farcaster/hub-nodejs";
export const MERGE_TIMEOUT_DEFAULT = 10_000; // 10 seconds

export type StorePruneOptions = {
  pruneSizeLimit?: number; // Max number of messages per fid
};

export const PAGE_SIZE_MAX = 10_000;
export const DEFAULT_PAGE_SIZE = 100;

export type PageOptions = {
  pageToken?: Uint8Array | undefined;
  pageSize?: number | undefined;
  reverse?: boolean | undefined;
};

export type MessagesPage<T extends Message> = {
  messages: T[];
  nextPageToken?: Uint8Array | undefined;
};
