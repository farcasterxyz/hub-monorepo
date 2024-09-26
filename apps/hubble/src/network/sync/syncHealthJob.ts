import cron from "node-cron";
import { logger } from "../../utils/logger.js";
import SyncEngine from "./syncEngine.js";
import { RpcMetadataRetriever, SyncEngineMetadataRetriever, SyncHealthProbe } from "../../utils/syncHealth.js";
import { HubInterface } from "hubble.js";
import { peerIdFromString } from "@libp2p/peer-id";
import { bytesToHexString, fromFarcasterTime, Message, UserDataType } from "@farcaster/hub-nodejs";
import { Result } from "neverthrow";
import { SubmitError } from "../../utils/syncHealth.js";
import { SyncId } from "./syncId.js";
import { addressInfoFromGossip, addressInfoToString } from "../../utils/p2p.js";

const log = logger.child({
  component: "SyncHealth",
});

type SchedulerStatus = "started" | "stopped";

enum PeerIdentifierKind {
  PeerId = 0,
  AddrInfo = 1,
}

type PeerIdentifier = { kind: PeerIdentifierKind; identifier: string };

export class MeasureSyncHealthJobScheduler {
  private _cronTask?: cron.ScheduledTask;
  private _metadataRetriever: SyncEngineMetadataRetriever;
  // Start at 65 minutes ago and take a 60 minute span
  private _startSecondsAgo = 60 * 65;
  private _spanSeconds = 60 * 60;
  private _hub: HubInterface;
  private _peersInScope: PeerIdentifier[];

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

  peerAddrInfosInScope() {}

  peersInScope() {
    const peerIds = process.env["SYNC_HEALTH_PEER_IDS"]?.split(",") ?? [];

    for (const multiaddr of this._hub.bootstrapAddrs()) {
      const peerId = multiaddr.getPeerId();
      if (!peerId) {
        log.info({ multiaddr }, "Couldn't get peerid for multiaddr");
      } else {
        peerIds.push(peerId);
      }
    }

    const peerIdentifiers = peerIds.map((peerId) => {
      return {
        kind: PeerIdentifierKind.PeerId,
        identifier: peerId,
      };
    });

    const addrInfos =
      process.env["SYNC_HEALTH_ADDR_INFOS"]?.split(",").map((addrInfo) => {
        return { kind: PeerIdentifierKind.AddrInfo, identifier: addrInfo };
      }) ?? [];

    return [...peerIdentifiers, ...addrInfos];
  }

  unixTimestampFromMessage(message: Message) {
    const msgTimestamp = message.data?.timestamp;
    if (msgTimestamp) {
      const msgUnixTimestamp = fromFarcasterTime(msgTimestamp);
      if (msgUnixTimestamp.isErr()) {
        return undefined;
      } else {
        return msgUnixTimestamp.value;
      }
    }
    return undefined;
  }

  async processSumbitResults(
    results: Result<Message, SubmitError>[],
    peerId: string,
    startTime: number,
    stopTime: number,
  ) {
    let numSuccesses = 0;
    let numErrors = 0;
    let numAlreadyMerged = 0;
    for (const result of results) {
      if (result.isOk()) {
        const hashString = bytesToHexString(result.value.hash);
        const hash = hashString.isOk() ? hashString.value : "unable to show hash";

        const typeValue = result.value.data?.type;
        const type = typeValue ? UserDataType[typeValue] : "unknown type";

        log.info(
          {
            msgDetails: {
              type,
              fid: result.value.data?.fid,
              timestamp: this.unixTimestampFromMessage(result.value),
              hash,
              peerId,
            },
            startTime,
            stopTime,
          },
          "Successfully submitted message via SyncHealth",
        );

        numSuccesses += 1;
      } else {
        const hashString = bytesToHexString(result.error.originalMessage.hash);
        const hash = hashString.isOk() ? hashString.value : "unable to show hash";

        const logTags = {
          errMessage: result.error.hubError.message,
          peerId,
          startTime,
          stopTime,
          msgDetails: {
            fid: result.error.originalMessage.data?.fid,
            timestamp: this.unixTimestampFromMessage(result.error.originalMessage),
            hash,
          },
        };
        if (result.error.hubError.errCode === "bad_request.duplicate") {
          // This message has already been merged into the DB, but for some reason is not in the Trie.
          // Just update the trie.
          await this._metadataRetriever._syncEngine.trie.insert(SyncId.fromMessage(result.error.originalMessage));
          log.info(logTags, "Merged missing message into sync trie via SyncHealth");
          numAlreadyMerged += 1;
        } else {
          log.info(logTags, "Failed to submit message via SyncHealth");
          numErrors += 1;
        }
      }
    }
    return { numSuccesses, numErrors, numAlreadyMerged };
  }

  async getRpcClient(peer: PeerIdentifier) {
    if (peer.kind === PeerIdentifierKind.PeerId) {
      const contactInfo = this._metadataRetriever._syncEngine.getContactInfoForPeerId(peer.identifier);

      if (!contactInfo) {
        log.info({ peerId: peer.identifier }, "Couldn't get contact info for peer");
        return undefined;
      }

      return this._hub.getRPCClientForPeer(peerIdFromString(peer.identifier), contactInfo.contactInfo);
    } else {
      return this._hub.getHubRpcClient(peer.identifier);
    }
  }

  contactInfoForLogs(peer: PeerIdentifier) {
    if (peer.kind === PeerIdentifierKind.PeerId) {
      const contactInfo = this._metadataRetriever._syncEngine.getContactInfoForPeerId(peer.identifier);

      if (!contactInfo) {
        return "Missing contact info";
      }

      return contactInfo.contactInfo;
    } else {
      return peer.identifier;
    }
  }

  async doJobs() {
    if (!this._hub.performedFirstSync) {
      log.info("Skipping SyncHealth job because we haven't performed our first sync yet");
      return;
    }

    log.info({}, "Starting compute SyncHealth job");

    const startTime = Date.now() - this._startSecondsAgo * 1000;
    const stopTime = startTime + this._spanSeconds * 1000;

    for (const peer of this._peersInScope) {
      const rpcClient = await this.getRpcClient(peer);

      if (rpcClient === undefined) {
        log.info({ peerId: peer.identifier }, "Couldn't get rpc client, skipping peer");
        continue;
      }

      const peerMetadataRetriever = new RpcMetadataRetriever(rpcClient);

      const syncHealthProbe = new SyncHealthProbe(this._metadataRetriever, peerMetadataRetriever);

      const syncHealthMessageStats = await syncHealthProbe.computeSyncHealthMessageStats(
        new Date(startTime),
        new Date(stopTime),
      );

      if (syncHealthMessageStats.isErr()) {
        const contactInfo = this.contactInfoForLogs(peer);
        log.info(
          {
            peerId: peer.identifier,
            err: syncHealthMessageStats.error,
            contactInfo,
          },
          `Error computing SyncHealth: ${syncHealthMessageStats.error}.`,
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
          { peerId: peer.identifier, err: resultsPushingToUs.error },
          `Error pushing new messages to ourself ${resultsPushingToUs.error}`,
        );
        continue;
      }

      const processedResults = await this.processSumbitResults(
        resultsPushingToUs.value,
        peer.identifier,
        startTime,
        stopTime,
      );

      log.info(
        {
          ourNumMessages: syncHealthMessageStats.value.primaryNumMessages,
          theirNumMessages: syncHealthMessageStats.value.peerNumMessages,
          syncHealth: syncHealthMessageStats.value.computeDiff(),
          syncHealthPercentage: syncHealthMessageStats.value.computeDiffPercentage(),
          resultsPushingToUs: processedResults,
          peerId: peer.identifier,
          startTime,
          stopTime,
        },
        "Computed SyncHealth stats for peer",
      );
    }
  }
}
