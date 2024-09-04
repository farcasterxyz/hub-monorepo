import cron from "node-cron";
import { logger } from "../../utils/logger.js";
import SyncEngine from "./syncEngine.js";
import { RpcMetadataRetriever, SyncEngineMetadataRetriever, SyncHealthProbe } from "../../utils/syncHealth.js";
import { HubInterface } from "hubble.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { bytesToHexString, Message, UserDataType } from "@farcaster/hub-nodejs";
import { Result } from "neverthrow";
import { SubmitError } from "../../utils/syncHealth.js";

const log = logger.child({
  component: "SyncHealth",
});

type SchedulerStatus = "started" | "stopped";

export class MeasureSyncHealthJobScheduler {
  private _cronTask?: cron.ScheduledTask;
  private _metadataRetriever: SyncEngineMetadataRetriever;
  // Start at 35 minutes ago and take a 30 minute span
  private _startSecondsAgo = 60 * 35;
  private _spanSeconds = 60 * 30;
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

  processSumbitResults(results: Result<Message, SubmitError>[], peerId: string) {
    let numSuccesses = 0;
    let numErrors = 0;
    for (const result of results) {
      if (result.isOk()) {
        const hashString = bytesToHexString(result.value.hash);
        const hash = hashString.isOk() ? hashString.value : "unable to show hash";

        const typeValue = result.value.data?.type;
        const type = typeValue ? UserDataType[typeValue] : "unknown type";

        log.info(
          {
            msgDetails: { type, fid: result.value.data?.fid, timestamp: result.value.data?.timestamp, hash, peerId },
          },
          "Successfully submitted message via SyncHealth",
        );

        numSuccesses += 1;
      } else {
        const hashString = bytesToHexString(result.error.originalMessage.hash);
        const hash = hashString.isOk() ? hashString.value : "unable to show hash";
        log.info(
          { errMessage: result.error.hubError.message, peerId, hash },
          "Failed to submit message via SyncHealth",
        );

        numErrors += 1;
      }
    }
    return { numSuccesses, numErrors };
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
        log.info(
          { peerId, err: syncHealthMessageStats.error, contactInfo },
          `Error computing SyncHealth: ${syncHealthMessageStats.error}`,
        );
        continue;
      }

      const resultsPushingToUs = await syncHealthProbe.tryPushingDivergingSyncIds(
        new Date(startTime),
        new Date(stopTime),
        "FromPeer",
      );

      if (resultsPushingToUs.isErr()) {
        log.info(
          { peerId, err: resultsPushingToUs.error },
          `Error pushing new messages to ourself ${resultsPushingToUs.error}`,
        );
        continue;
      }

      log.info(
        {
          ourNumMessages: syncHealthMessageStats.value.primaryNumMessages,
          theirNumMessages: syncHealthMessageStats.value.peerNumMessages,
          syncHealth: syncHealthMessageStats.value.computeDiff(),
          syncHealthPercentage: syncHealthMessageStats.value.computeDiffPercentage(),
          resultsPushingToUs: this.processSumbitResults(resultsPushingToUs.value, peerId),
          peerId,
        },
        "Computed SyncHealth stats for peer",
      );
    }
  }
}
