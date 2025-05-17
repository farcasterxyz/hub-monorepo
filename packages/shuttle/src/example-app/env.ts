import "dotenv/config";
import os from "os";

export const COLORIZE =
  process.env["COLORIZE"] === "true" ? true : process.env["COLORIZE"] === "false" ? false : process.stdout.isTTY;
export const LOG_LEVEL = process.env["LOG_LEVEL"] || "info";

export const HUB_HOST = process.env["HUB_HOST"] || "hub-full.farcaster.xyz:2283";
export const HUB_SSL = process.env["HUB_SSL"] === "true" ? true : false;

export const POSTGRES_URL = process.env["POSTGRES_URL"] || "postgres://shuttle:password@localhost:6541/postgres";
export const POSTGRES_SCHEMA = process.env["POSTGRES_SCHEMA"] || "public";
export const REDIS_URL = process.env["REDIS_URL"] || "localhost:6379";

export const TOTAL_SHARDS = parseInt(process.env["SHARDS"] || "0");
export const SHARD_INDEX = parseInt(process.env["SHARD_INDEX"] || "0");

export const BACKFILL_FIDS = process.env["BACKFILL_FIDS"] ? process.env["BACKFILL_FIDS"].split(",").map(Number) : [];
export const MAX_FID = parseInt(process.env["MAX_FID"] || "1000");

export const STATSD_HOST = process.env["STATSD_HOST"];
export const STATSD_METRICS_PREFIX = process.env["STATSD_METRICS_PREFIX"] || "shuttle.";

export const CONCURRENCY = parseInt(process.env["CONCURRENCY"] || "10");
export const USE_STREAMING_RPCS_FOR_BACKFILL = process.env["USE_STREAMING_RPCS_FOR_BACKFILL"] !== "false";
export const SUBSCRIBE_RPC_TIMEOUT = parseInt(process.env["SUBSCRIBE_RPC_TIMEOUT"] || "30000");

export const REWIND_SECONDS = parseInt(process.env["REWIND_SECONDS"] || "0");
