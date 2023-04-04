import { HubAsyncResult } from '@farcaster/hub-nodejs';
import { ok } from 'neverthrow';
import cron from 'node-cron';
import Engine from '~/storage/engine';
import { logger } from '~/utils/logger';

export const DEFAULT_PRUNE_EVENTS_JOB_CRON = '20 * * * *'; // Every hour at :20

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

    const result = await this._engine.eventHandler.pruneEvents();
    result.match(
      () => {
        log.info({}, 'finished prune events job');
      },
      (e) => {
        log.error({ errCode: e.errCode }, `error pruning events: ${e.message}`);
      }
    );

    return ok(undefined);
  }
}
