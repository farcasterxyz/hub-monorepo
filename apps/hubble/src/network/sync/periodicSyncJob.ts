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
    log.info('starting periodic sync job');

    // Do a diff sync
    await this._syncEngine.diffSyncIfRequired(this._hub);
  }
}
