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
import { parseAddress } from "../../utils/p2p.js";
import { Multiaddr } from "@multiformats/multiaddr";

const log = logger.child({
  component: "SyncHealth",
});

type SchedulerStatus = "started" | "stopped";

export class MeasureSyncHealthJobScheduler {
  private _cronTask?: cron.ScheduledTask;
  private _metadataRetriever: SyncEngineMetadataRetriever;
  // Start at 15 minutes ago and take a 10 minute span
  private _startSecondsAgo = 60 * 15;
  private _spanSeconds = 60 * 10;
  private _hub: HubInterface;
  private _peersInScope: Multiaddr[];

  constructor(syncEngine: SyncEngine, hub: HubInterface) {
    this._metadataRetriever = new SyncEngineMetadataRetriever(syncEngine);
    this._hub = hub;
    this._peersInScope = this.peersInScope();
  }

  start(cronSchedule?: string) {
    // Run every 10 minutes
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

  peersInScope() {
    const extraPeers =
      process.env["SYNC_HEALTH_PEERS"]
        ?.split(",")
        .map((a) => {
          const multiaddr = parseAddress(a);
          if (multiaddr.isErr()) {
            logger.warn(
              { errorCode: multiaddr.error.errCode, message: multiaddr.error.message },
              "Couldn't parse extra sync health peer address address, ignoring",
            );
          }
          return multiaddr;
        })
        .filter((a) => a.isOk())
        .map((a) => a._unsafeUnwrap()) ?? [];

    return [...extraPeers, ...this._hub.bootstrapAddrs()];
  }

  async doJobs() {
    log.info({}, "Starting compute SyncHealth job");

    const startTime = Date.now() - this._startSecondsAgo * 1000;
    const stopTime = startTime + this._spanSeconds * 1000;

    for (const multiaddr of this._peersInScope) {
      const peerId = multiaddr.getPeerId();

      if (!peerId) {
        log.info({ multiaddr }, "Couldn't get peerid for multiaddr");
        continue;
      }

      const contactInfo = this._metadataRetriever._syncEngine.getContactInfoForPeerId(peerId);

      if (!contactInfo) {
        log.info({ peerId }, "Couldn't get contact info, skipping peer");
        continue;
      }

      const rpcClient = await this._hub.getRPCClientForPeer(peerIdFromString(peerId), contactInfo.contactInfo);

      if (rpcClient === undefined) {
        log.info({ peerId, contactInfo }, "Couldn't get rpc client, skipping peer");
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
        log.info({ error: syncHealthMessageStats.error }, "Error computing SyncHealth");
        continue;
      }

      log.info(
        {
          ourNumMessages: syncHealthMessageStats.value.primaryNumMessages,
          theirNumMessages: syncHealthMessageStats.value.peerNumMessages,
          syncHealth: syncHealthMessageStats.value.computeDiff(),
          syncHealthPercentage: syncHealthMessageStats.value.computeDiffPercentage(),
          peerId,
        },
        "Computed SyncHealth stats for peer",
      );
    }

    log.info("Finished SyncHealth job");
  }
}
