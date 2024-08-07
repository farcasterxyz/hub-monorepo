import cron from "node-cron";
import { logger } from "../../utils/logger.js";
import SyncEngine from "./syncEngine.js";
import { RpcMetadataRetriever, SyncEngineMetadataRetriever, SyncHealthProbe } from "../../utils/syncHealth.js";
import { HubInterface } from "hubble.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { bytesToHexString, HubResult, Message, UserDataType } from "@farcaster/hub-nodejs";

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
  private _peersInScope: string[];

  constructor(syncEngine: SyncEngine, hub: HubInterface) {
    this._metadataRetriever = new SyncEngineMetadataRetriever(hub, syncEngine);
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
    const peers = process.env["SYNC_HEALTH_PEER_IDS"]?.split(",") ?? [];

    for (const multiaddr of this._hub.bootstrapAddrs()) {
      const peerId = multiaddr.getPeerId();
      if (!peerId) {
        log.info({ multiaddr }, "Couldn't get peerid for multiaddr");
      } else {
        peers.push(peerId);
      }
    }

    return peers;
  }

  processSumbitResults(results: HubResult<Message>[]) {
    const errorReasons = [];
    const successInfo = [];
    for (const result of results) {
      if (result.isOk()) {
        const hashString = bytesToHexString(result.value.hash);
        const hash = hashString.isOk() ? hashString.value : "unable to show hash";

        const typeValue = result.value.data?.type;
        const type = typeValue ? UserDataType[typeValue] : "unknown type";

        successInfo.push({
          type,
          fid: result.value.data?.fid,
          timestamp: result.value.data?.timestamp,
          hash,
        });
      } else {
        errorReasons.push(result.error.message);
      }
    }

    const uniqueErrorReasons = new Set(errorReasons);

    return {
      numErrors: errorReasons.length,
      numSuccesses: successInfo.length,
      errorReasons: [...uniqueErrorReasons],
      successInfo,
    };
  }

  async doJobs() {
    log.info({}, "Starting compute SyncHealth job");

    const startTime = Date.now() - this._startSecondsAgo * 1000;
    const stopTime = startTime + this._spanSeconds * 1000;

    for (const peerId of this._peersInScope) {
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

      const syncHealthProbe = new SyncHealthProbe(this._metadataRetriever, peerMetadataRetriever);

      const syncHealthMessageStats = await syncHealthProbe.computeSyncHealthMessageStats(
        new Date(startTime),
        new Date(stopTime),
      );

      if (syncHealthMessageStats.isErr()) {
        log.info({ error: syncHealthMessageStats.error }, "Error computing SyncHealth");
        continue;
      }

      const resultsPushingToUs = await syncHealthProbe.tryPushingDivergingSyncIds(
        new Date(startTime),
        new Date(stopTime),
        "FromPeer",
      );

      if (resultsPushingToUs.isErr()) {
        log.info({ error: resultsPushingToUs.error }, "Error pushing new messages to ourself");
        continue;
      }

      log.info(
        {
          ourNumMessages: syncHealthMessageStats.value.primaryNumMessages,
          theirNumMessages: syncHealthMessageStats.value.peerNumMessages,
          syncHealth: syncHealthMessageStats.value.computeDiff(),
          syncHealthPercentage: syncHealthMessageStats.value.computeDiffPercentage(),
          resultsPushingToUs: this.processSumbitResults(resultsPushingToUs.value),
          peerId,
        },
        "Computed SyncHealth stats for peer",
      );
    }
  }
}
