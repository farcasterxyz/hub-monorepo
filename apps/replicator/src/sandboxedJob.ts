import { SandboxedJob } from "bullmq";
import { isMainThread } from "worker_threads";
import { loadJobs, runJob } from "./jobs.js";
import { HUB_HOST, HUB_SSL, POSTGRES_URL, REDIS_URL } from "./env.js";
import { log } from "./log.js";
import { getDbClient } from "./db.js";
import { getHubClient } from "./hub.js";
import { getRedisClient } from "./redis.js";
import { threadId, processId, terminateProcess, onTerminate } from "./util.js";

loadJobs();

const SHUTDOWN_CHECK_INTERVAL_MS = 2_000;

const db = getDbClient(POSTGRES_URL);
onTerminate(async () => {
  log.debug("Disconnecting from database");
  await db.destroy();
});

const hub = getHubClient(HUB_HOST, { ssl: HUB_SSL });
onTerminate(async () => {
  log.debug("Disconnecting from hub");
  hub.close();
});

const redis = getRedisClient(REDIS_URL);
onTerminate(async () => {
  log.debug("Disconnecting from Redis");
  redis.disconnect();
});

const workerId = `${processId()}:${threadId()}`;
const workerLog = log.child({ context: "worker", wid: workerId });
const workerType = isMainThread ? "process" : "thread";

let lastCheckTime = Date.now();
async function checkForShutdown() {
  lastCheckTime = Date.now();
  if (await redis.get("shutdown-requested")) {
    log.info(`Shutdown requested, terminating worker ${workerType} ${workerId}`);
    await terminateProcess({ success: true, log: workerLog });
    return;
  }

  const now = Date.now();
  setTimeout(checkForShutdown, SHUTDOWN_CHECK_INTERVAL_MS);
}
setTimeout(checkForShutdown, SHUTDOWN_CHECK_INTERVAL_MS);

workerLog.info(`Starting worker ${workerType} ${workerId}`, { processId: processId(), threadId: threadId() });

export default async function (job: SandboxedJob) {
  log.debug(`Running ${job.name} job ${job.id}`, { jid: job.id, jobName: job.name, jobData: job.data });
  return runJob(job, db, redis, workerLog, hub);
}
