import { Worker } from "bullmq";
import { EventEmitter } from "events";
import Redis from "ioredis";
import path from "path";
import { Logger } from "./log.js";
import { WORKER_TYPE } from "./env.js";

export function getWorker(redis: Redis, log: Logger, { concurrency }: { concurrency: number }) {
  const processorFile = path.join(__dirname, "sandboxedJob.js");

  // Prevent erroneous warnings about listener usage since
  // increasing concurrency results in more listeners
  EventEmitter.defaultMaxListeners = Math.max(EventEmitter.defaultMaxListeners, concurrency + 1);

  const worker = new Worker("default", processorFile, {
    autorun: false, // Don't start yet
    useWorkerThreads: WORKER_TYPE === "thread",
    concurrency,
    connection: redis,
    removeOnComplete: { count: 100 }, // Keep at most this many completed jobs
    removeOnFail: { count: 5000 }, // Keep at most this many failed jobs
  });

  worker.on("failed", (job, err) => {
    if (err.message === "Unexpected exit code: 0 signal: null") return; // Ignore explicit process termination
    log.error(`Job ${job?.name} ${job?.id} failed: ${err.message}: ${err.stack}`);
  });
  worker.on("error", (err) => {
    log.error(`Worker encountered error: ${err.message}: ${err.stack}`);
  });
  worker.on("closed", () => {
    log.info("Worker terminated");
  });
  worker.on("stalled", (job) => {
    log.info(`Job ${job} took too long and has stalled`);
  });

  return worker;
}
