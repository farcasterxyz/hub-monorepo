import cron from 'node-cron';
import { logger } from '~/utils/logger';
import SyncEngine from './syncEngine';

const log = logger.child({
  component: 'PeriodSyncJob',
});

type SchedulerStatus = 'started' | 'stopped';

const DEFAULT_PERIODIC_JOB_CRON = '*/2 * * * *'; // Every 2 minutes

export class PeriodicSyncJobScheduler {
  private _syncEngine: SyncEngine;
  private _cronTask?: cron.ScheduledTask;

  constructor(_syncEngine: SyncEngine) {
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
    log.info('starting doJobs');

    // Do a diff sync
    await this._syncEngine.diffSyncIfRequired();
  }
}
