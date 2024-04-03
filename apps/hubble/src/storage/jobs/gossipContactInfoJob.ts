import cron from "node-cron";
import { HubInterface } from "../../hubble.js";
import { logger } from "../../utils/logger.js";
import { HubAsyncResult } from "@farcaster/core";

const log = logger.child({
  component: "GossipContactInfo",
});

type SchedulerStatus = "started" | "stopped";

export class GossipContactInfoJobScheduler {
  private _hub: HubInterface;
  private _cronTask?: cron.ScheduledTask;

  constructor(hub: HubInterface) {
    this._hub = hub;
  }

  start(cronSchedule?: string) {
    const randomMinute = Math.floor(Math.random() * 60);
    const defaultSchedule = `${randomMinute} */2 * * *`; // Every 2 hours at a random minute
    this._cronTask = cron.schedule(cronSchedule ?? defaultSchedule, () => this.doJobs(), {
      timezone: "Etc/UTC",
    });
  }

  stop() {
    if (this._cronTask) {
      this._cronTask.stop();
    }
  }

  status(): SchedulerStatus {
    return this._cronTask ? "started" : "stopped";
  }

  async doJobs(): HubAsyncResult<void> {
    log.info({}, "starting gossip contact info job");

    return await this._hub.gossipContactInfo();
  }
}
