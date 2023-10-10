import { Command } from "@commander-js/extra-typings";
import * as repl from "repl";
import { readFileSync } from "fs";
import { DB, getDbClient, migrateToLatest, migrationStatus } from "./db.js";
import { CONCURRENCY, HUB_HOST, HUB_SSL, POSTGRES_URL, REDIS_URL, STATSD_HOST, STATSD_METRICS_PREFIX } from "./env.js";
import { Logger, log } from "./log.js";
import { getHubClient } from "./hub.js";
import { HubReplicator } from "./hubReplicator.js";
import { getRedisClient } from "./redis.js";
import { terminateProcess, onTerminate } from "./util.js";
import { getWebApp } from "./web.js";
import { getWorker } from "./worker.js";
import { initializeStatsd, statsd } from "./statsd.js";

// Perform shutdown cleanup on termination signal
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    log.info(`Received ${signal}. Shutting down...`);
    if (process.exitCode === undefined) {
      process.exitCode = 1;
    }
    terminateProcess({ success: false, log });
  });
}

process.on("uncaughtException", async (err) => {
  const msg = err?.message || err;
  log.error(`Uncaught exception: ${msg}`, { error: err });
});

process.on("unhandledRejection", async (reason, promise) => {
  log.error(`Unhandled promise rejection: ${reason}`, { reason });
});

if (STATSD_HOST) {
  initializeStatsd(STATSD_HOST, STATSD_METRICS_PREFIX);
}

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

const migrateDb = async (db: DB, log: Logger) => {
  const result = await migrateToLatest(db, log);
  if (result.isErr()) {
    await terminateProcess({ success: false, log });
  }
};

const ensureMigrationsUpToDate = async (db: DB, log: Logger) => {
  const { executed, pending } = await migrationStatus(db, log);
  if (executed.length === 0) {
    log.info("Detected no prior migrations have been run. Running migrations now.");
    await migrateDb(db, log);
  } else if (pending.length > 0) {
    log.error(`Detected ${pending.length} pending migrations.`);
    log.error("Please run migrations with `replicator migrate` before starting the replicator.");
    process.exit(1);
  }
};

async function migrate() {
  await migrateDb(db, log);
  await terminateProcess({ success: true, log });
}

async function console() {
  await ensureMigrationsUpToDate(db, log);

  const replServer = repl.start({ prompt: "replicator> ", breakEvalOnSigint: true }).on("exit", async () => {
    await terminateProcess({ success: true, log });
  });

  // Inject some useful variables into the REPL context
  Object.entries({
    db,
    hub,
    redis,
    statsd: statsd(),
  }).forEach(([name, value]) => {
    replServer.context[name] = value;
  });
}

async function start() {
  await redis.del("shutdown-requested"); // Clear any previous shutdown requests
  await ensureMigrationsUpToDate(db, log);

  const app = getWebApp(redis);
  onTerminate(async () => {
    await app.close();
  });

  const replicator = new HubReplicator(hub, HUB_HOST, db, log, redis);
  onTerminate(async () => {
    log.info("Stopping replicator");
    replicator.stop();
    replicator.destroy();
  });

  const worker = getWorker(redis, log, { concurrency: CONCURRENCY });
  onTerminate(async () => {
    log.info("Waiting for active running jobs to finish...");
    await redis.setex("shutdown-requested", 60, "true");
    await worker.close();
  });

  worker.run();
  replicator.start();
}

const program = new Command()
  .name("replicator")
  .description("Synchronizes a Farcaster Hub with a Postgres database")
  .version(JSON.parse(readFileSync("./package.json").toString()).version);

program.command("console").description("Starts a REPL console").action(console);

program.command("start").description("Starts the replicator").action(start);

program
  .command("migrate")
  .description("Applies database schema migrations if they are not already are up to date")
  .action(migrate);

program.parse(process.argv);
