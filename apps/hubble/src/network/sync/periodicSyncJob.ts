import { ResultAsync } from "neverthrow";
import cron from "node-cron";
import { Hub } from "../../hubble.js";
import { logger } from "../..//utils/logger.js";
import SyncEngine from "./syncEngine.js";

const log = logger.child({
  component: "PeriodicSyncJob",
});

type SchedulerStatus = "started" | "stopped";

// Every 2 hours, at 1 minute mark, to avoid clashing with the prune job
const DEFAULT_PERIODIC_SYNC_JOB_CRON = "1 */2 * * *";

export class PeriodicSyncJobScheduler {
  private _hub: Hub;
  private _syncEngine: SyncEngine;
  private _cronTask?: cron.ScheduledTask;

  private _jobCount = 0;

  constructor(_hub: Hub, _syncEngine: SyncEngine) {
    this._hub = _hub;
    this._syncEngine = _syncEngine;
  }

  start(cronSchedule?: string) {
    this._cronTask = cron.schedule(cronSchedule ?? DEFAULT_PERIODIC_SYNC_JOB_CRON, () => this.doJobs(), {
      timezone: "Etc/UTC",
    });
  }

  stop() {
    if (this._cronTask) {
      return this._cronTask.stop();
    }
  }

  status(): SchedulerStatus {
    return this._cronTask ? "started" : "stopped";
  }

  async doJobs() {
    this._jobCount += 1;
    log.info({ jobCount: this._jobCount }, "starting periodic sync job");

    // Do a diff sync
    const syncResult = await ResultAsync.fromPromise(this._syncEngine.diffSyncIfRequired(this._hub), (e) => e);
    if (syncResult.isErr()) {
      log.error({ err: syncResult.error }, "error during periodic sync job");
    }

    this._jobCount -= 1;
  }
}
