import { ResultAsync } from 'neverthrow';
import cron from 'node-cron';
import { Hub } from '~/hubble';
import { logger } from '~/utils/logger';
import SyncEngine from './syncEngine';

const log = logger.child({
  component: 'PeriodicSyncJob',
});

type SchedulerStatus = 'started' | 'stopped';

const DEFAULT_PERIODIC_JOB_CRON = '*/2 * * * *'; // Every 2 minutes

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
    this._cronTask = cron.schedule(cronSchedule ?? DEFAULT_PERIODIC_JOB_CRON, () => {
      return this.doJobs();
    });
  }

  stop() {
    if (this._cronTask) {
      return this._cronTask.stop();
    }
  }

  status(): SchedulerStatus {
    return this._cronTask ? 'started' : 'stopped';
  }

  async doJobs() {
    this._jobCount += 1;
    log.info({ jobCount: this._jobCount }, 'starting periodic sync job');

    // Do a diff sync
    const syncResult = await ResultAsync.fromPromise(this._syncEngine.diffSyncIfRequired(this._hub), (e) => e);
    if (syncResult.isErr()) {
      log.error({ err: syncResult.error }, 'error during periodic sync job');
    }

    this._jobCount -= 1;
  }
}
