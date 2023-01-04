import { HubAsyncResult } from '@hub/errors';
import { err, ok } from 'neverthrow';
import cron from 'node-cron';
import Engine from '~/storage/engine';
import { logger } from '~/utils/logger';

export const DEFAULT_PRUNE_MESSAGES_JOB_CRON = '0 * * * *'; // Every hour

const log = logger.child({
  component: 'PruneMessagesJob',
});

type SchedulerStatus = 'started' | 'stopped';

export class PruneMessagesJobScheduler {
  private _engine: Engine;
  private _cronTask?: cron.ScheduledTask;

  constructor(engine: Engine) {
    this._engine = engine;
  }

  start(cronSchedule?: string) {
    this._cronTask = cron.schedule(cronSchedule ?? DEFAULT_PRUNE_MESSAGES_JOB_CRON, () => {
      this.doJobs();
    });
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
    log.info({}, 'starting doJobs');

    const fids = await this._engine.getFids();
    if (fids.isErr()) {
      return err(fids.error);
    }

    for (const fid of fids.value) {
      await this._engine.pruneMessages(fid);
    }

    return ok(undefined);
  }
}
