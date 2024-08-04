import cron from "node-cron";
import { logger } from "../../utils/logger.js";
import SyncEngine from "./syncEngine.js";
import {
  RpcMetadataRetriever,
  SyncEngineMetadataRetriever,
  computeSyncHealthMessageStats,
  divergingSyncIds,
} from "../../utils/syncHealth.js";
import { HubInterface } from "hubble.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { parseAddress } from "../../utils/p2p.js";
import { multiaddr, Multiaddr } from "@multiformats/multiaddr";
import { SyncId, SyncIdType, timestampToPaddedTimestampPrefix } from "../../network/sync/syncId.js";
import { bytesToHexString, OnChainEventType } from "@farcaster/hub-nodejs";

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
  private _maxSyncIdsToPrint = 10;

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

  sampleMissingSyncIds(syncIds: Buffer[]) {
    return syncIds
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
      .slice(0, this._maxSyncIdsToPrint)
      .map((syncIdBytes) => {
        const unpackedSyncId = SyncId.fromBytes(syncIdBytes).unpack();
        const fid = unpackedSyncId.fid;
        const type = SyncIdType[unpackedSyncId.type];

        if (unpackedSyncId.type === SyncIdType.Message) {
          const primaryKeyString = bytesToHexString(unpackedSyncId.primaryKey);
          const primaryKey = primaryKeyString.isOk() ? primaryKeyString.value : "unable to show primary key";
          const hashString = bytesToHexString(unpackedSyncId.hash);
          const hash = hashString.isOk() ? hashString.value : "unable to show hash";
          return {
            type,
            fid,
            primaryKey,
            hash,
          };
        } else if (unpackedSyncId.type === SyncIdType.FName) {
          const nameString = bytesToHexString(unpackedSyncId.name);
          const name = nameString.isOk() ? nameString.value : "unable to show name";
          return {
            type,
            fid,
            name,
            padded: unpackedSyncId.padded,
          };
        } else if (unpackedSyncId.type === SyncIdType.OnChainEvent) {
          return {
            type,
            fid,
            eventType: OnChainEventType[unpackedSyncId.eventType],
            blockNumber: unpackedSyncId.blockNumber,
            logIndex: unpackedSyncId.logIndex,
          };
        } else {
          return {
            type,
            fid,
          };
        }
      });
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
        log.info({ error: syncIds.error }, "Error computing differing sync ids");
        continue;
      }

      log.info(
        {
          ourNumMessages: syncHealthMessageStats.value.primaryNumMessages,
          theirNumMessages: syncHealthMessageStats.value.peerNumMessages,
          syncHealth: syncHealthMessageStats.value.computeDiff(),
          syncHealthPercentage: syncHealthMessageStats.value.computeDiffPercentage(),
          numSyncIdsUniqueToUs: syncIds.value.idsOnlyInPrimary.length,
          numSyncIdsUniqueToThem: syncIds.value.idsOnlyInPeer.length,
          sampledSyncIdsUniqueToUs: this.sampleMissingSyncIds(syncIds.value.idsOnlyInPrimary),
          sampledSyncIdsUniqueToThem: this.sampleMissingSyncIds(syncIds.value.idsOnlyInPeer),
          peerId,
        },
        "Computed SyncHealth stats for peer",
      );
    }
  }
}
