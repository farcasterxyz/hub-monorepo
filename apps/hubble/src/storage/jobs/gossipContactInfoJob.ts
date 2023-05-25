import cron from 'node-cron';
import { HubInterface } from '../../hubble.js';
import { logger } from '../../utils/logger.js';
import { HubAsyncResult } from '@farcaster/core';

const log = logger.child({
  component: 'GossipContactInfo',
});

type SchedulerStatus = 'started' | 'stopped';

export class GossipContactInfoJobScheduler {
  private _hub: HubInterface;
  private _cronTask?: cron.ScheduledTask;

  constructor(hub: HubInterface) {
    this._hub = hub;
  }

  start(cronSchedule?: string) {
    const randomSecond = Math.floor(Math.random() * 59);
    const defaultSchedule = `${randomSecond} * */4 * *`; // Random second (avoid stampede) every 4 hours
    this._cronTask = cron.schedule(cronSchedule ?? defaultSchedule, () => this.doJobs());
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
    log.info({}, 'starting gossip contact info job');

    return await this._hub.gossipContactInfo();
  }
}
