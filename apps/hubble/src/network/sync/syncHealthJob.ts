import cron from "node-cron";
import { logger } from "../../utils/logger.js";
import SyncEngine from "./syncEngine.js";
import {
  RpcMetadataRetriever,
  SyncEngineMetadataRetriever,
  computeSyncHealthMessageStats,
  divergingSyncIds,
  tryPushingMissingMessages,
} from "../../utils/syncHealth.js";
import { HubInterface } from "hubble.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { SyncId, SyncIdType } from "../../network/sync/syncId.js";
import { bytesToHexString, OnChainEventType, HubResult, Message, UserDataType } from "@farcaster/hub-nodejs";

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
  private _peersToPushTo: Set<string>;
  private _peersInScope: string[];
  private _maxSyncIdsToPrint = 10;

  constructor(syncEngine: SyncEngine, hub: HubInterface) {
    this._metadataRetriever = new SyncEngineMetadataRetriever(hub, syncEngine);
    this._hub = hub;
    this._peersInScope = this.peersInScope();
    this._peersToPushTo = new Set(this._peersInScope);
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
    const errorReasons = new Set();
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
        errorReasons.add(result.error.message);
      }
    }
    return { errorReasons: [...errorReasons], successInfo };
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

      const syncIds = await divergingSyncIds(
        this._metadataRetriever,
        peerMetadataRetriever,
        new Date(startTime),
        new Date(stopTime),
      );

      if (syncIds.isErr()) {
        log.info({ error: syncIds.error }, "Error computing diverging sync ids");
        continue;
      }

      const resultsPushingToUs = await tryPushingMissingMessages(
        peerMetadataRetriever,
        this._metadataRetriever,
        syncIds.value.idsOnlyInPeer,
      );

      if (resultsPushingToUs.isErr()) {
        log.info({ error: resultsPushingToUs.error }, "Error pushing new messages to ourself");
        continue;
      }

      let resultsPushingToPeer;
      if (this._peersToPushTo.has(peerId)) {
        const unparsedResultsPushingToPeer = await tryPushingMissingMessages(
          this._metadataRetriever,
          peerMetadataRetriever,
          syncIds.value.idsOnlyInPrimary,
        );

        if (unparsedResultsPushingToPeer.isErr()) {
          log.info({ error: unparsedResultsPushingToPeer.error }, "Error pushing new messages to peer");
          continue;
        }

        // Don't try to submit to peers you're not authorized to
        const peerRequiresAuth = unparsedResultsPushingToPeer.value.find((value) => {
          return value.isErr() && (value.error.errCode === "unauthenticated" || value.error.errCode === "unauthorized");
        });

        if (peerRequiresAuth !== undefined) {
          this._peersToPushTo.delete(peerId);
        } else {
          this._peersToPushTo.add(peerId);
        }

        resultsPushingToPeer = this.processSumbitResults(unparsedResultsPushingToPeer.value);
      }

      log.info(
        {
          ourNumMessages: syncHealthMessageStats.value.primaryNumMessages,
          theirNumMessages: syncHealthMessageStats.value.peerNumMessages,
          syncHealth: syncHealthMessageStats.value.computeDiff(),
          syncHealthPercentage: syncHealthMessageStats.value.computeDiffPercentage(),
          resultsPushingToUs: this.processSumbitResults(resultsPushingToUs.value),
          resultsPushingToPeer,
          peerId,
        },
        "Computed SyncHealth stats for peer",
      );
    }
  }
}
