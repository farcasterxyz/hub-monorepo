import { HubAsyncResult } from '@farcaster/utils';
import { ok } from 'neverthrow';
import cron from 'node-cron';
import Engine from '~/storage/engine';
import { logger } from '~/utils/logger';

export const DEFAULT_PRUNE_EVENTS_JOB_CRON = '0 * * * *'; // Every hour at :00

const log = logger.child({
  component: 'PruneEventsJob',
});

type SchedulerStatus = 'started' | 'stopped';

export class PruneEventsJobScheduler {
  private _engine: Engine;
  private _cronTask?: cron.ScheduledTask;

  constructor(engine: Engine) {
    this._engine = engine;
  }

  start(cronSchedule?: string) {
    this._cronTask = cron.schedule(cronSchedule ?? DEFAULT_PRUNE_EVENTS_JOB_CRON, () => this.doJobs());
  }

  stop() {
    if (this._cronTask) {
      this._cronTask.stop();
    }
  }

  status(): SchedulerStatus {
    return this._cronTask ? 'started' : 'stopped';
  }

  async doJobs(): HubAsyncResult<void> {
    log.info({}, 'starting prune events job');

    await this._engine.eventHandler.pruneEvents();

    log.info({}, 'finished prune events job');

    return ok(undefined);
  }
}
