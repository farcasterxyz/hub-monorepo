import cron from "node-cron";
import { Hub, HubShutdownReason } from "../../hubble.js";
import { logger } from "../../utils/logger.js";
import { HubAsyncResult } from "@farcaster/core";
import { fetchNetworkConfig } from "../../network/utils/networkConfig.js";
import { err, ok } from "neverthrow";

const log = logger.child({
  component: "UpdateNetworkConfigJob",
});

type SchedulerStatus = "started" | "stopped";

export class UpdateNetworkConfigJobScheduler {
  private _hub: Hub;
  private _cronTask?: cron.ScheduledTask;

  constructor(hub: Hub) {
    this._hub = hub;
  }

  start(cronSchedule?: string) {
    const defaultSchedule = "59 * * * *"; // Every hour at :59
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
    const networkConfig = await fetchNetworkConfig();
    if (networkConfig.isErr()) {
      log.error({ err: networkConfig.error }, "error fetching network config");
      return err(networkConfig.error);
    }

    const { shouldRestart, shouldExit } = this._hub.applyNetworkConfig(networkConfig.value);
    if (shouldExit) {
      log.error({}, "Network config exit signal");
      process.kill(process.pid, "SIGQUIT");
    }

    if (shouldRestart) {
      log.info({}, "Network config restart signal");
      await this._hub.stop(HubShutdownReason.SELF_TERMINATED, false);
      await this._hub.start();
    }

    log.info({}, "Network config updated");
    return ok(undefined);
  }
}
