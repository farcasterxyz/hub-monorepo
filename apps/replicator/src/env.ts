import "dotenv/config";
import os from "os";

export const COLORIZE =
  process.env["COLORIZE"] === "true" ? true : process.env["COLORIZE"] === "false" ? false : process.stdout.isTTY;
export const LOG_LEVEL = process.env["LOG_LEVEL"] || "info";

export const HUB_HOST = process.env["HUB_HOST"] || "localhost:2283";
export const HUB_SSL = process.env["HUB_SSL"] === "true" ? true : false;

export const POSTGRES_URL = process.env["POSTGRES_URL"];

export const REDIS_URL = process.env["REDIS_URL"] || "redis://localhost:6379";

export const STATSD_HOST = process.env["STATSD_HOST"];
export const STATSD_METRICS_PREFIX = process.env["STATSD_METRICS_PREFIX"] || "replicator.";

export const WEB_UI_PORT = Number(process.env["WEB_UI_PORT"] || "9411");

export const CONCURRENCY = Number(process.env["CONCURRENCY"] || os.availableParallelism());

export const WORKER_TYPE = process.env["WORKER_TYPE"] || "process"; // or "thread"

// Number of partitions to create (partitioned by FID).
// 0 = no partitioning.
// Highly experimental. Don't use in production.
export const PARTITIONS = Number(process.env["PARTITIONS"] || "0");
export const AWS_ACCESS_KEY_ID = process.env["AWS_ACCESS_KEY_ID"] || "";
export const AWS_SECRET_ACCESS_KEY = process.env["AWS_SECRET_ACCESS_KEY"] || "";
