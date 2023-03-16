import { HubAsyncResult } from '@farcaster/utils';
import { err, ok } from 'neverthrow';
import cron from 'node-cron';
import Engine from '~/storage/engine';
import { logger } from '~/utils/logger';

export const DEFAULT_PRUNE_MESSAGES_JOB_CRON = '0 * * * *'; // Every hour at :00

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
    this._cronTask = cron.schedule(cronSchedule ?? DEFAULT_PRUNE_MESSAGES_JOB_CRON, () => this.doJobs());
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
    log.info({}, 'starting prune job');

    let finished = false;
    let pageToken: Uint8Array | undefined;
    do {
      const fidsPage = await this._engine.getFids({ pageToken, pageSize: 100 });
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
        await this._engine.pruneMessages(fid);
      }
    } while (!finished);

    log.info({}, 'finished prune job');

    return ok(undefined);
  }
}
