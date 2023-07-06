import { PeerId } from "@libp2p/interface-peer-id";
import { AckMessageBody, PingMessageBody, HubError, NetworkLatencyMessage, GossipMessage } from "@farcaster/hub-nodejs";
import { logger } from "../../utils/logger.js";
import { GossipNode } from "./gossipNode.js";
import { Result, ResultAsync } from "neverthrow";
import { peerIdFromBytes } from "@libp2p/peer-id";
import cron from "node-cron";
import { GOSSIP_PROTOCOL_VERSION } from "./protocol.js";
import RocksDB from "../../storage/db/rocksdb.js";
import { RootPrefix } from "../../storage/db/types.js";

export const METRICS_TTL_MILLISECONDS = 3600 * 1000; // Expire stored metrics every 1 hour
const DEFAULT_PERIODIC_LATENCY_PING_CRON = "*/5 * * * *";
const MAX_JITTER_MILLISECONDS = 2 * 60 * 1000; // 2 minutes
const NETWORK_COVERAGE_THRESHOLD = [0.5, 0.75, 0.9, 0.99];

const log = logger.child({ component: "GossipMetricsRecorder" });

type Average = {
  sum: number;
  numElements: number;
};

type PeerLatencyMetrics = {
  numAcks: number;
  lastAckTimestamp: number;
};

type PeerMessageMetrics = {
  messageCount: number;
};

/** StringMap is used in place of Map<string, number> in the GossipMetrics
 *  type so that metrics can be JSON-serialized easily when reading / writing from
 *  RocksDB. Using Maps requires explicit coercion of deserialized objects to Maps
 */
interface StringMap<T> {
  [key: string]: T;
}

interface NetworkCoverageTimes {
  coverageMap: StringMap<number>;
  seenPeerIds: StringMap<number>;
}

type GlobalMetrics = {
  networkCoverage: StringMap<NetworkCoverageTimes>;
  messageMergeTime: Average;
};

export class GossipMetrics {
  recentPeerIds: StringMap<number>;
  peerLatencyMetrics: StringMap<PeerLatencyMetrics>;
  peerMessageMetrics: StringMap<PeerMessageMetrics>;
  globalMetrics: GlobalMetrics;

  constructor(
    recentPeerIds?: StringMap<number>,
    peerLatencyMetrics?: StringMap<PeerLatencyMetrics>,
    peerMessageMetrics?: StringMap<PeerMessageMetrics>,
    globalMetrics?: GlobalMetrics,
  ) {
    this.recentPeerIds = recentPeerIds ?? {};
    this.peerLatencyMetrics = peerLatencyMetrics ?? {};
    this.peerMessageMetrics = peerMessageMetrics ?? {};
    this.globalMetrics = globalMetrics ?? { networkCoverage: {}, messageMergeTime: { sum: 0, numElements: 0 } };
  }

  static fromBuffer(buffer: Buffer): GossipMetrics {
    try {
      const obj = JSON.parse(buffer.toString());
      return new GossipMetrics(obj.recentPeerIds, obj.peerLatencyMetrics, obj.peerMessageMetrics, obj.globalMetrics);
    } catch (e) {
      logger.error("Error parsing GossipMetrics from DB");
      return new GossipMetrics();
    }
  }

  toBuffer(): Buffer {
    return Buffer.from(JSON.stringify(this));
  }
}

export class GossipMetricsRecorder {
  private _gossipNode: GossipNode;
  private _cronTask: cron.ScheduledTask | undefined;
  private _db: RocksDB;
  private _metrics!: GossipMetrics;

  constructor(gossipNode: GossipNode, db: RocksDB) {
    this._db = db;
    this._gossipNode = gossipNode;
  }

  get recentPeerIds() {
    return this._metrics.recentPeerIds;
  }

  get peerLatencyMetrics() {
    return this._metrics.peerLatencyMetrics;
  }

  get peerMessageMetrics() {
    return this._metrics.peerMessageMetrics;
  }

  get globalMetrics() {
    return this._metrics.globalMetrics;
  }

  async start() {
    this._metrics = (await this.readMetricsFromDb()) ?? new GossipMetrics();
    // Expire metrics after loading in case hub has been offline for a long period
    this.expireMetrics();
    this._cronTask = cron.schedule(DEFAULT_PERIODIC_LATENCY_PING_CRON, () => {
      return this.sendPingAndLogMetrics(MAX_JITTER_MILLISECONDS);
    });
  }

  async stop() {
    await this.writeMetricsToDB();
    if (this._cronTask) {
      return this._cronTask?.stop();
    }
  }

  recordMessageMerge(latestMergeTime: number) {
    const current = this._metrics.globalMetrics.messageMergeTime;
    this._metrics.globalMetrics.messageMergeTime = {
      sum: current.sum + latestMergeTime,
      numElements: current.numElements + 1,
    };
  }

  async recordMessageReceipt(gossipMessage: GossipMessage) {
    // Update peer-level message metrics
    this.computePeerMessageMetrics(gossipMessage);
  }

  async recordLatencyAckMessageReceipt(ackMessage: AckMessageBody) {
    const pingOriginPeerId = this.getPeerIdFromBytes(ackMessage.pingOriginPeerId);
    if (pingOriginPeerId) {
      const peerIdMatchesOrigin = this._gossipNode.peerId?.toString() === pingOriginPeerId.toString() ?? false;
      if (peerIdMatchesOrigin) {
        // Log ack latency for peer
        const ackPeerId = this.getPeerIdFromBytes(ackMessage.ackOriginPeerId);
        if (ackPeerId) {
          // Add peerId to recent peerIds
          this._metrics.recentPeerIds[ackPeerId.toString()] = Date.now();

          // Compute peer and coverage metrics
          this.computePeerLatencyAndCoverageMetrics(ackMessage, ackPeerId);
        }
      }
    }
  }

  private computePeerMessageMetrics(gossipMessage: GossipMessage) {
    const peerId = this.getPeerIdFromBytes(gossipMessage.peerId);
    if (peerId) {
      const currentMessageMetrics = this._metrics.peerMessageMetrics[peerId.toString()];
      const updatedMessageMetrics = {
        messageCount: (currentMessageMetrics?.messageCount ?? 0) + 1,
      };
      this._metrics.peerMessageMetrics[peerId.toString()] = updatedMessageMetrics;
    }
  }

  private computePeerLatencyAndCoverageMetrics(ackMessage: AckMessageBody, ackOriginPeerId: PeerId) {
    // Compute peer-level latency metrics
    const key = `${ackOriginPeerId.toString()}_${ackMessage.pingTimestamp}`;
    const currentLatencyMetrics = this._metrics.peerLatencyMetrics[key.toString()];
    const updatedLatencyMetrics: PeerLatencyMetrics = {
      numAcks: (currentLatencyMetrics?.numAcks ?? 0) + 1,
      lastAckTimestamp: currentLatencyMetrics?.lastAckTimestamp ?? ackMessage.ackTimestamp,
    };
    this._metrics.peerLatencyMetrics[key.toString()] = updatedLatencyMetrics;

    // Compute coverage metrics
    const coverageKey = ackMessage.pingTimestamp;
    const timeTaken = ackMessage.ackTimestamp - ackMessage.pingTimestamp;
    const currentCoverage = this._metrics.globalMetrics.networkCoverage[coverageKey.toString()];
    const updatedCoverage = this.getUpdatedCoverage(ackOriginPeerId, timeTaken, currentCoverage);
    this._metrics.globalMetrics.networkCoverage[coverageKey.toString()] = updatedCoverage;
  }

  async sendPingAndLogMetrics(jitterMs: number) {
    const jitter = Math.floor(Math.random() * jitterMs);
    await new Promise((f) => setTimeout(f, jitter));

    const peerIdBytes = this._gossipNode.peerId?.toBytes();

    if (!peerIdBytes) {
      log.error("Failed to send gossip latency ping: peerId is undefined");
      return;
    }

    const pingMessage = PingMessageBody.create({
      pingOriginPeerId: peerIdBytes,
      pingTimestamp: Date.now(),
    });
    const networkLatencyMessage = NetworkLatencyMessage.create({
      pingMessage,
    });
    const gossipMessage = GossipMessage.create({
      networkLatencyMessage,
      topics: [this._gossipNode.primaryTopic()],
      peerId: this._gossipNode.peerId?.toBytes() ?? new Uint8Array(),
      version: GOSSIP_PROTOCOL_VERSION,
    });
    const result = await this._gossipNode.publish(gossipMessage);
    const combinedResult = Result.combineWithAllErrors(result);
    if (combinedResult.isErr()) {
      log.warn({ err: combinedResult.error }, "Failed to send gossip latency ping");
    }
    // Since logging message counts on each message might make logs too noisy,
    // we log message count metrics here instead
    this.logMetrics();

    // Expire peerIds that are past the TTL
    this.expireMetrics();
  }

  logMetrics() {
    // Log peer-level latency metrics
    Object.entries(this._metrics.peerLatencyMetrics).forEach(([key, metrics]) => {
      const keyFragments = key.split("_");
      const peerId = keyFragments[0];
      const pingTimestamp = Number(keyFragments[1]);
      log.info(
        {
          peerId: peerId,
          latencyMilliseconds: metrics.lastAckTimestamp - pingTimestamp,
          peerNetwork: this._gossipNode.network,
        },
        "GossipPeerLatencyMetrics",
      );
    });

    // Log peer-level message metrics
    Object.entries(this._metrics.peerMessageMetrics).forEach(([peerId, metrics]) => {
      log.info(
        {
          peerId: peerId.toString(),
          messageCount: metrics.messageCount,
          peerNetwork: this._gossipNode.network,
        },
        "GossipPeerMessageMetrics",
      );
    });

    // Log global metrics
    Object.entries(this._metrics.globalMetrics.networkCoverage).forEach(([pingTimestamp, coverage]) => {
      log.info(
        {
          pingTimestamp: Number(pingTimestamp),
          coverage: coverage.coverageMap,
          peerNetwork: this._gossipNode.network,
        },
        "GossipNetworkCoverageMetrics",
      );
    });
    const messageMergeTime = this._metrics.globalMetrics.messageMergeTime;
    log.info(
      {
        messageMergeTime: messageMergeTime.numElements === 0 ? 0 : messageMergeTime.sum / messageMergeTime.numElements,
        peerNetwork: this._gossipNode.network,
      },
      "GossipGlobalMetrics",
    );
  }

  expireMetrics() {
    const currTime = Date.now();
    this._metrics.recentPeerIds = Object.fromEntries(
      Object.entries(this._metrics.recentPeerIds).filter(([_, v]) => currTime - v < METRICS_TTL_MILLISECONDS),
    );
    this._metrics.globalMetrics.networkCoverage = Object.fromEntries(
      Object.entries(this._metrics.globalMetrics.networkCoverage).filter(
        ([timestamp, _]) => currTime - Number(timestamp) < METRICS_TTL_MILLISECONDS,
      ),
    );
    this._metrics.globalMetrics.messageMergeTime = { sum: 0, numElements: 0 };

    this._metrics.peerLatencyMetrics = Object.fromEntries(
      Object.entries(this._metrics.peerLatencyMetrics).filter(
        ([_, v]) => currTime - v.lastAckTimestamp < METRICS_TTL_MILLISECONDS,
      ),
    );

    this._metrics.peerMessageMetrics = {};
  }

  private getPeerIdFromBytes(peerIdBytes?: Uint8Array): PeerId | undefined {
    if (!peerIdBytes) {
      return undefined;
    } else {
      const peerIdResult = Result.fromThrowable(
        () => peerIdFromBytes(peerIdBytes),
        (error) => new HubError("bad_request.parse_failure", error as Error),
      )();
      if (peerIdResult.isOk()) {
        return peerIdResult.value;
      } else {
        return undefined;
      }
    }
  }

  private getUpdatedCoverage(
    peerId: PeerId,
    time: number,
    currentCoverage?: NetworkCoverageTimes,
  ): NetworkCoverageTimes {
    if (currentCoverage?.seenPeerIds[peerId.toString()]) {
      return currentCoverage;
    } else {
      const seenPeerIds: StringMap<number> = Object.assign({}, currentCoverage?.seenPeerIds ?? {});
      const coverageMap: StringMap<number> = Object.assign({}, currentCoverage?.coverageMap ?? {});
      seenPeerIds[peerId.toString()] = time;
      const numSeenPeerIds = Object.keys(seenPeerIds).length;
      const coverage = numSeenPeerIds / Object.keys(this._metrics.recentPeerIds ?? {}).length;
      NETWORK_COVERAGE_THRESHOLD.forEach((threshold) => {
        const coverageIsAboveThreshold = threshold <= coverage;
        const shouldUpdateMetricForThreshold = (numSeenPeerIds - 1) / numSeenPeerIds < threshold;
        if (shouldUpdateMetricForThreshold && coverageIsAboveThreshold) {
          coverageMap[threshold.toString()] = time;
        }
      });
      return {
        seenPeerIds: seenPeerIds,
        coverageMap: coverageMap,
      };
    }
  }

  private async readMetricsFromDb(): Promise<GossipMetrics | undefined> {
    const key = this.makeMetricsKey();
    const result = await ResultAsync.fromPromise(this._db.get(Buffer.from(key)), (e) => e as HubError);
    if (result.isOk()) {
      return GossipMetrics.fromBuffer(result.value);
    }
    return undefined;
  }

  private async writeMetricsToDB() {
    const key = this.makeMetricsKey();
    const value = this._metrics.toBuffer();
    await this._db?.put(key, value);
  }

  private makeMetricsKey(): Buffer {
    return Buffer.from([RootPrefix.GossipMetrics]);
  }
}
