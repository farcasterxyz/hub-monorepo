import { HubAsyncResult } from "@farcaster/hub-nodejs";
import { err, ok } from "neverthrow";
import cron from "node-cron";
import Engine from "../engine/index.js";
import { logger } from "../../utils/logger.js";
import { statsd } from "../../utils/statsd.js";
import { sleep } from "../../utils/crypto.js";

export const DEFAULT_PRUNE_MESSAGES_JOB_CRON = "0 */2 * * *"; // Every two hours

const log = logger.child({
  component: "PruneMessagesJob",
});

type SchedulerStatus = "started" | "stopped";

export class PruneMessagesJobScheduler {
  private _engine: Engine;
  private _cronTask?: cron.ScheduledTask;
  private _running = false;
  private _getSyncTrieQSizeFn: () => number;

  constructor(engine: Engine, getSyncTrieQSizeFn: () => number) {
    this._engine = engine;
    this._getSyncTrieQSizeFn = getSyncTrieQSizeFn;
  }

  start(cronSchedule?: string) {
    this._cronTask = cron.schedule(cronSchedule ?? DEFAULT_PRUNE_MESSAGES_JOB_CRON, () => this.doJobs(), {
      timezone: "Etc/UTC",
    });

    // Log the DB Size at startup
    setTimeout(() => {
      this.logDbSize();
    }, 1000);
  }

  stop() {
    if (this._cronTask) {
      this._cronTask.stop();
    }
  }

  status(): SchedulerStatus {
    return this._cronTask ? "started" : "stopped";
  }

  async logDbSize() {
    this._engine
      .getDb()
      .approximateSize()
      .then((size) => {
        statsd().gauge("rocksdb.approximate_size", size || 0);
      });
  }

  async doJobs(): HubAsyncResult<void> {
    if (this._running) {
      log.info({}, "prune messages job already running, skipping");
      return ok(undefined);
    }

    log.info({}, "starting prune messages job");
    const start = Date.now();
    this._running = true;
    let totalPruned = 0;

    let finished = false;
    let pageToken: Uint8Array | undefined;
    do {
      const fidsPage = await this._engine.getFids({ pageToken });
      if (fidsPage.isErr()) {
        return err(fidsPage.error);
      }
      const { fids, nextPageToken } = fidsPage.value;
      if (!nextPageToken) {
        finished = true;
      } else {
        pageToken = nextPageToken;
      }

      for (const fid of fids) {
        totalPruned += (await this._engine.pruneMessages(fid)).unwrapOr(0);
      }

      // Sleep for a bit avoid overloading the Merkle Trie
      const syncTrieQSize = this._getSyncTrieQSizeFn();
      if (syncTrieQSize > 10_000) {
        log.info({ syncTrieQSize }, "sync trie Q is large, sleeping for 30s");
        await sleep(30_000);
      }
    } while (!finished);

    log.info({ totalPruned, timeTakenMs: Date.now() - start }, "finished prune messages job");
    this._running = false;

    this.logDbSize();

    return ok(undefined);
  }
}
