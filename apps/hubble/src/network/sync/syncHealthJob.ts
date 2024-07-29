import cron from "node-cron";
import { logger } from "../../utils/logger.js";
import SyncEngine from "./syncEngine.js";
import {
  RpcMetadataRetriever,
  SyncEngineMetadataRetriever,
  computeSyncHealthMessageStats,
} from "../../utils/syncHealth.js";
import { HubInterface } from "hubble.js";
import { peerIdFromString } from "@libp2p/peer-id";

const log = logger.child({
  component: "SyncHealth",
});

type SchedulerStatus = "started" | "stopped";

export class MeasureSyncHealthJobScheduler {
  private _cronTask?: cron.ScheduledTask;
  private _metadataRetriever: SyncEngineMetadataRetriever;
  private _maxNumPeers = 10;
  private _startSecondsAgo = 60 * 15;
  private _spanSeconds = 60 * 10;
  private _hub: HubInterface;

  constructor(syncEngine: SyncEngine, hub: HubInterface) {
    this._metadataRetriever = new SyncEngineMetadataRetriever(syncEngine);
    this._hub = hub;
  }

  start(cronSchedule?: string) {
    // Run every 10 minutes at a random minute
    const defaultSchedule = "*/10 * * * *";
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

  async doJobs() {
    log.info({}, "Starting compute sync health job");

    const peerIds = Array.from(this._metadataRetriever._syncEngine.getCurrentHubPeerContacts());

    // Shuffle and pick peers
    const peersToContact = peerIds
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
      .slice(0, this._maxNumPeers);

    const startTime = Date.now() - this._startSecondsAgo * 1000;
    const stopTime = startTime + this._spanSeconds * 1000;

    for (const [peerId, contactInfo] of peersToContact) {
      const rpcClient = await this._hub.getRPCClientForPeer(peerIdFromString(peerId), contactInfo);

      if (rpcClient === undefined) {
        log.info("Couldn't get rpc client, skipping peer", peerId, contactInfo);
        continue;
      }

      const peerMetadataRetriever = new RpcMetadataRetriever(rpcClient);
      computeSyncHealthMessageStats;

      const syncHealthMessageStats = await computeSyncHealthMessageStats(
        new Date(startTime),
        new Date(stopTime),
        this._metadataRetriever,
        peerMetadataRetriever,
      );

      if (syncHealthMessageStats.isErr()) {
        log.info(syncHealthMessageStats.error, "Error computing sync stats");
        continue;
      }

      log.info(
        {
          hubNumMessages: syncHealthMessageStats.value.primaryNumMessages,
          peerNumMessages: syncHealthMessageStats.value.peerNumMessages,
          syncHealth: syncHealthMessageStats.value.computeDiff(),
          syncHealthPercentage: syncHealthMessageStats.value.computeDiffPercentage(),
          contactInfo,
        },
        "Computed sync health stats for peer",
      );
    }
  }
}
