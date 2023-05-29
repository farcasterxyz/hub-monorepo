import { PeerId } from '@libp2p/interface-peer-id';
import { AckMessageBody, PingMessageBody, HubError, NetworkLatencyMessage, GossipMessage } from '@farcaster/hub-nodejs';
import { logger } from '../../utils/logger.js';
import { GossipNode } from './gossipNode.js';
import { Result } from 'neverthrow';
import { peerIdFromBytes } from '@libp2p/peer-id';
import cron from 'node-cron';
import { GOSSIP_PROTOCOL_VERSION } from './protocol.js';
import RocksDB from 'storage/db/rocksdb.js';

const RECENT_PEER_TTL_MILLISECONDS = 3600 * 1000; // Expire recent peers every 1 hour
const METRICS_TTL_MILLISECONDS = 3600 * 1000; // Expire stored metrics every 1 hour
const DEFAULT_PERIODIC_LATENCY_PING_CRON = '*/5 * * * *';
const MAX_JITTER_MILLISECONDS = 2 * 60 * 1000; // 2 minutes
const NETWORK_COVERAGE_THRESHOLD = [0.5, 0.75, 0.9, 0.99];
const METRICS_DB_KEY = 'GossipMetrics';

type SchedulerStatus = 'started' | 'stopped';

const log = logger.child({ component: 'GossipMetricsRecorder' });

class Average {
  private _sum = 0;
  private _numElements = 0;

  addValue(value: number) {
    this._sum += value;
    this._numElements += 1;
  }

  getAverage() {
    if (this._numElements == 0) {
      return 0;
    } else {
      return this._sum / this._numElements;
    }
  }

  clear() {
    this._sum = 0;
    this._numElements = 0;
  }
}

type PeerLatencyMetrics = {
  numAcks: number;
  lastAckTimestamp: number;
};

type PeerMessageMetrics = {
  messageCount: number;
};

class NetworkCoverageTimes {
  private _coverageMap = new Map<number, number>();
  private _seenPeerIds = new Map<string, number>();

  addAckFromPeer(peerId: PeerId, time: number, numTotalPeerIds: number) {
    if (this._seenPeerIds.has(peerId.toString())) {
      return;
    } else {
      this._seenPeerIds.set(peerId.toString(), time);
      const numSeenPeerIds = this._seenPeerIds.size;
      const coverage = numSeenPeerIds / numTotalPeerIds;
      NETWORK_COVERAGE_THRESHOLD.forEach((threshold) => {
        const coverageIsAboveThreshold = threshold <= coverage;
        const shouldUpdateMetricForThreshold = (numSeenPeerIds - 1) / numSeenPeerIds < threshold;
        if (shouldUpdateMetricForThreshold && coverageIsAboveThreshold) {
          this._coverageMap.set(threshold, time);
        }
      });
    }
  }

  getLoggableObject() {
    return Object.fromEntries(this._coverageMap);
  }
}

type GlobalMetrics = {
  networkCoverage: Map<number, NetworkCoverageTimes>;
  messageMergeTime: Average;
};

type StorageMetrics = {
  recentPeerIds: Map<string, number>;
  globalMetrics: GlobalMetrics;
  peerLatencyMetrics: Map<string, PeerLatencyMetrics>;
  peerMessageMetrics: Map<string, PeerMessageMetrics>;
};

export class GossipMetricsRecorder {
  private _recentPeerIds!: Map<string, number>;
  private _peerLatencyMetrics!: Map<string, PeerLatencyMetrics>;
  private _peerMessageMetrics!: Map<string, PeerMessageMetrics>;
  private _globalMetrics!: GlobalMetrics;
  private _gossipNode: GossipNode;
  private _cronTask: cron.ScheduledTask | undefined;
  private _db: RocksDB | undefined;

  constructor(gossipNode: GossipNode, db?: RocksDB) {
    this._db = db;
    this._gossipNode = gossipNode;
  }

  get recentPeerIds() {
    return this._recentPeerIds;
  }

  get peerLatencyMetrics() {
    return this._peerLatencyMetrics;
  }

  get peerMessageMetrics() {
    return this._peerMessageMetrics;
  }

  get globalMetrics() {
    return this._globalMetrics;
  }

  async start() {
    const metricsFromDB = await this.readMetricsFromDb();
    this._recentPeerIds = metricsFromDB?.recentPeerIds ?? new Map();
    this._peerLatencyMetrics = metricsFromDB?.peerLatencyMetrics ?? new Map();
    this._peerMessageMetrics = metricsFromDB?.peerMessageMetrics ?? new Map();
    this._globalMetrics = metricsFromDB?.globalMetrics ?? {
      networkCoverage: new Map(),
      messageMergeTime: new Average(),
    };
    this._cronTask = cron.schedule(DEFAULT_PERIODIC_LATENCY_PING_CRON, () => {
      return this.sendPingAndLogMetrics();
    });
  }

  async stop() {
    await this.writeMetricsToDB();
    if (this._cronTask) {
      return this._cronTask?.stop();
    }
  }

  status(): SchedulerStatus {
    return this._cronTask ? 'started' : 'stopped';
  }

  recordMessageMerge(latestMergeTime: number) {
    this._globalMetrics.messageMergeTime.addValue(latestMergeTime);
  }

  async recordMessageReceipt(gossipMessage: GossipMessage) {
    // Update peer-level message metrics
    this.computePeerMessageMetrics(gossipMessage);

    if (!gossipMessage.networkLatencyMessage) {
      return;
    } else if (gossipMessage.networkLatencyMessage.pingMessage) {
      // Respond to ping message with an ack message
      const pingMessage = gossipMessage.networkLatencyMessage.pingMessage;
      const ackMessage = AckMessageBody.create({
        pingOriginPeerId: pingMessage.pingOriginPeerId,
        ackOriginPeerId: this._gossipNode.peerId!.toBytes(),
        pingTimestamp: pingMessage.pingTimestamp,
        ackTimestamp: Date.now(),
      });
      const networkLatencyMessage = NetworkLatencyMessage.create({
        ackMessage,
      });
      const ackGossipMessage = GossipMessage.create({
        networkLatencyMessage,
        topics: [this._gossipNode.primaryTopic()],
        peerId: this._gossipNode.peerId?.toBytes() ?? new Uint8Array(),
        version: GOSSIP_PROTOCOL_VERSION,
      });
      await this._gossipNode.publish(ackGossipMessage);
    } else if (gossipMessage.networkLatencyMessage.ackMessage) {
      const ackMessage = gossipMessage.networkLatencyMessage.ackMessage;
      const pingOriginPeerId = this.getPeerIdFromBytes(ackMessage.pingOriginPeerId);
      if (pingOriginPeerId) {
        const peerIdMatchesOrigin = this._gossipNode.peerId?.toString() == pingOriginPeerId.toString() ?? false;
        if (peerIdMatchesOrigin) {
          // Log ack latency for peer
          const ackPeerId = this.getPeerIdFromBytes(ackMessage.ackOriginPeerId);
          if (ackPeerId) {
            // Add peerId to recent peerIds
            this._recentPeerIds.set(ackPeerId.toString(), Date.now());

            // Compute peer and coverage metrics
            this.computePeerLatencyAndCoverageMetrics(ackMessage, ackPeerId);

            // Expire peerIds that are past the TTL
            this.expireMetrics();
          }
        }
      }
    }
  }

  private computePeerMessageMetrics(gossipMessage: GossipMessage) {
    const peerId = this.getPeerIdFromBytes(gossipMessage.peerId);
    if (peerId) {
      const currentMessageMetrics = this._peerMessageMetrics.get(peerId.toString());
      const updatedMessageMetrics = {
        messageCount: (currentMessageMetrics?.messageCount ?? 0) + 1,
      };
      this._peerMessageMetrics.set(peerId.toString(), updatedMessageMetrics);
    }
  }

  private computePeerLatencyAndCoverageMetrics(ackMessage: AckMessageBody, ackOriginPeerId: PeerId) {
    // Compute peer-level latency metrics
    const key = `${ackOriginPeerId.toString()}_${ackMessage.pingTimestamp}`;
    const currentLatencyMetrics = this._peerLatencyMetrics.get(key);
    const updatedLatencyMetrics: PeerLatencyMetrics = {
      numAcks: (currentLatencyMetrics?.numAcks ?? 0) + 1,
      lastAckTimestamp: currentLatencyMetrics?.lastAckTimestamp ?? ackMessage.ackTimestamp,
    };
    this._peerLatencyMetrics.set(key, updatedLatencyMetrics);

    // Compute coverage metrics
    const coverageKey = ackMessage.pingTimestamp;
    const timeTaken = ackMessage.ackTimestamp - ackMessage.pingTimestamp;
    const currentCoverage = this._globalMetrics.networkCoverage.get(coverageKey);
    if (currentCoverage) {
      currentCoverage.addAckFromPeer(ackOriginPeerId, timeTaken, this._recentPeerIds.size);
    } else {
      const networkCoverage = new NetworkCoverageTimes();
      networkCoverage.addAckFromPeer(ackOriginPeerId, timeTaken, this._recentPeerIds.size);
      this._globalMetrics.networkCoverage.set(coverageKey, networkCoverage);
    }
  }

  private async sendPingAndLogMetrics() {
    const jitter = Math.floor(Math.random() * MAX_JITTER_MILLISECONDS);
    await new Promise((f) => setTimeout(f, jitter));

    const pingMessage = PingMessageBody.create({
      pingOriginPeerId: this._gossipNode.peerId!.toBytes(),
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
      log.warn({ err: combinedResult.error }, 'Failed to send gossip latency ping');
    }
    // Since logging message counts on each message might make logs too noisy,
    // we log message count metrics here instead
    this.logMetrics();
  }

  private logMetrics() {
    // Log peer-level latency metrics
    [...this._peerLatencyMetrics].forEach(([key, metrics]) => {
      const keyFragments = key.split('_');
      const peerId = keyFragments[0];
      const pingTimestamp = Number(keyFragments[1]);
      log.info(
        {
          peerId: peerId,
          latencyMilliseconds: metrics.lastAckTimestamp - pingTimestamp,
        },
        'GossipPeerLatencyMetrics'
      );
    });

    // Log peer-level message metrics
    [...this.peerMessageMetrics].forEach(([peerId, metrics]) => {
      log.info({
        peerId: peerId.toString(),
        messageCount: metrics.messageCount,
      });
    });

    // Log global metrics
    [...this._globalMetrics.networkCoverage].forEach(([_, coverage]) => {
      log.info(coverage.getLoggableObject(), 'GossipNetworkCoverage');
    });
    log.info(
      {
        messageMergeTime: this._globalMetrics.messageMergeTime.getAverage(),
      },
      'GossipMergeMetrics'
    );
  }

  expireMetrics() {
    const currTime = Date.now();
    this._recentPeerIds = new Map(
      [...this._recentPeerIds].filter(([_, v]) => currTime - v < RECENT_PEER_TTL_MILLISECONDS)
    );
    this._globalMetrics.networkCoverage = new Map(
      [...this._globalMetrics.networkCoverage].filter(
        ([timestamp, _]) => currTime - timestamp < METRICS_TTL_MILLISECONDS
      )
    );
    this._globalMetrics.messageMergeTime.clear();
    this._peerLatencyMetrics = new Map(
      [...this._peerLatencyMetrics].filter(([_, v]) => currTime - v.lastAckTimestamp < METRICS_TTL_MILLISECONDS)
    );
  }

  private getPeerIdFromBytes(peerIdBytes?: Uint8Array): PeerId | undefined {
    if (!peerIdBytes) {
      return undefined;
    } else {
      const peerIdResult = Result.fromThrowable(
        () => peerIdFromBytes(peerIdBytes),
        (error) => new HubError('bad_request.parse_failure', error as Error)
      )();
      if (peerIdResult.isOk()) {
        return peerIdResult.value;
      } else {
        return undefined;
      }
    }
  }

  private async readMetricsFromDb(): Promise<StorageMetrics | undefined> {
    const key = Buffer.from(METRICS_DB_KEY);
    const value = await this._db?.get(key);
    if (value) {
      return JSON.parse(value?.toString());
    }
    return undefined;
  }

  private async writeMetricsToDB() {
    const key = Buffer.from(METRICS_DB_KEY);
    const storageMetrics = {
      recentPeerIds: this._recentPeerIds,
      globalMetrics: this._globalMetrics,
      peerLatencyMetrics: this._peerLatencyMetrics,
      peerMessageMetrics: this._peerMessageMetrics,
    };
    const value = Buffer.from(JSON.stringify(storageMetrics));
    await this._db?.put(key, value);
  }
}
