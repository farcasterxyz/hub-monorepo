import cron from "node-cron";
import { logger } from "../../utils/logger.js";
import { HubAsyncResult } from "@farcaster/core";
import { GossipNode } from "../../network/p2p/gossipNode.js";
import Server from "../../rpc/server.js";
import { ok } from "neverthrow";

const log = logger.child({
  component: "CheckIncomingPortsJob",
});

type SchedulerStatus = "started" | "stopped";

export class CheckIncomingPortsJobScheduler {
  private _rpcServer: Server;
  private _gossipNode: GossipNode;

  private _cronTask?: cron.ScheduledTask;

  constructor(rpcServer: Server, gossipNode: GossipNode) {
    this._rpcServer = rpcServer;
    this._gossipNode = gossipNode;
  }

  start(cronSchedule?: string) {
    const defaultSchedule = "15 * * * *"; // Every hour at :15
    this._cronTask = cron.schedule(cronSchedule ?? defaultSchedule, () => this.doJobs());
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
    if (!this._gossipNode.hasInboundConnections()) {
      log.warn({}, "No inbound Gossip connections!! Is your gossip port open?");
    }

    if (!this._rpcServer.hasInboundConnections()) {
      log.warn({}, "No inbound RPC connections!! Is your RPC port open?");
    }

    return ok(undefined);
  }
}
