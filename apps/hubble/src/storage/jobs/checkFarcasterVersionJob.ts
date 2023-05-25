import { HubAsyncResult } from '@farcaster/hub-nodejs';
import { ok } from 'neverthrow';
import cron from 'node-cron';
import { Hub } from '../../hubble.js';
import { logger } from '../../utils/logger.js';
import { getMinFarcasterVersion } from '../../utils/versions.js';

export const DEFAULT_CHECK_FARCASTER_VERSION_JOB_CRON = '1 0 * * *'; // Every day at 00:01 UTC

const log = logger.child({
  component: 'CheckFarcasterVersion',
});

type SchedulerStatus = 'started' | 'stopped';

export class CheckFarcasterVersionJobScheduler {
  private _hub: Hub;
  private _cronTask?: cron.ScheduledTask;

  constructor(hub: Hub) {
    this._hub = hub;
  }

  start(cronSchedule?: string) {
    this._cronTask = cron.schedule(cronSchedule ?? DEFAULT_CHECK_FARCASTER_VERSION_JOB_CRON, () => this.doJobs());
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
    log.info({}, 'starting check Farcaster version job');

    const minVersion = getMinFarcasterVersion();

    if (minVersion.isErr()) {
      log.info({}, 'Farcaster version expired, shutting down hub');
      await this._hub.stop();
    }

    return ok(undefined);
  }
}
