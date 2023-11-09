import { Multiaddr } from "@multiformats/multiaddr";
import { logger } from "../../utils/logger.js";
import cron from "node-cron";
import { GossipNode } from "./gossipNode.js";

const log = logger.child({
  component: "PeriodicPeerCheckScheduler",
});

type SchedulerStatus = "started" | "stopped";

// Every 2 minutes, at 00:45 seconds, to avoid clashing with the prune job
const DEFAULT_PERIODIC_PEER_CHECK_CRON = "*/5 * * * *";

export class PeriodicPeerCheckScheduler {
  private _bootstrapPeers: Multiaddr[];
  private _gossipNode: GossipNode;

  private _cronTask?: cron.ScheduledTask;

  constructor(_gossipNode: GossipNode, _bootstrapPeers: Multiaddr[]) {
    this._bootstrapPeers = _bootstrapPeers;
    this._gossipNode = _gossipNode;
  }

  start(cronSchedule?: string) {
    this._cronTask = cron.schedule(cronSchedule ?? DEFAULT_PERIODIC_PEER_CHECK_CRON, () => {
      return this.doJobs();
    });
  }

  stop() {
    if (this._cronTask) {
      return this._cronTask.stop();
    }
  }

  status(): SchedulerStatus {
    return this._cronTask ? "started" : "stopped";
  }

  async doJobs() {
    // If there are no peers, try to connect to the bootstrap peers
    const allPeerIds = await this._gossipNode.allPeerIds();
    if (allPeerIds.length > 0) {
      return;
    }
    const result = await this._gossipNode.bootstrap(this._bootstrapPeers);
    if (result.isErr()) {
      log.warn({ err: result.error }, "No Connected Peers");
    }
  }
}
