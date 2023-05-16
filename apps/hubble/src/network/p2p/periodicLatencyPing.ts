import { logger } from '~/utils/logger';
import cron from 'node-cron';
import { GossipNode } from './gossipNode';
import { Result } from 'neverthrow';

const log = logger.child({
  component: 'PeriodicLatencyPing',
});

type SchedulerStatus = 'started' | 'stopped';

// Every 5 minutes
const DEFAULT_PERIODIC_LATENCY_PING_CRON = '*/5 * * * *';

export class PeriodicLatencyPingScheduler {
  private _gossipNode: GossipNode;

  private _cronTask?: cron.ScheduledTask;

  constructor(_gossipNode: GossipNode) {
    this._gossipNode = _gossipNode;
  }

  start() {
    this._cronTask = cron.schedule(DEFAULT_PERIODIC_LATENCY_PING_CRON, () => {
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
    const result = await this._gossipNode.gossipNetworkLatencyPing();
    const combinedResult = Result.combineWithAllErrors(result);
    if (combinedResult.isErr()) {
      log.warn({ err: combinedResult.error }, 'No Connected Peers');
    }
  }
}
