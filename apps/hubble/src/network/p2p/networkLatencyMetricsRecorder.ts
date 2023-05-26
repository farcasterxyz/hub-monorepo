import { PeerId } from '@libp2p/interface-peer-id';
import { AckMessageBody, PingMessageBody, HubError, NetworkLatencyMessage, GossipMessage } from '@farcaster/hub-nodejs';
import { logger } from '../../utils/logger.js';
import { GossipNode } from './gossipNode.js';
import { Result } from 'neverthrow';
import { peerIdFromBytes } from '@libp2p/peer-id';
import cron from 'node-cron';
import { GOSSIP_PROTOCOL_VERSION } from './protocol.js';

const RECENT_PEER_TTL_MILLISECONDS = 3600 * 1000; // Expire recent peers every 1 hour
const METRICS_TTL_MILLISECONDS = 3600 * 1000; // Expire stored metrics every 1 hour
const DEFAULT_PERIODIC_LATENCY_PING_CRON = '*/5 * * * *';
const MAX_JITTER_MILLISECONDS = 2 * 60 * 1000; // 2 minutes
const NETWORK_COVERAGE_THRESHOLD = [0.5, 0.75, 0.9, 0.99];

type SchedulerStatus = 'started' | 'stopped';

const log = logger.child({ component: 'NetworkLatencyMetricsRecorder' });

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

interface PeerMetrics {
  numAcks: number;
  lastAckTimestamp: number;
  messageCount: number;
}

interface PeerMetricsKey {
  peerId: PeerId;
  pingTimestamp: number;
}

class NetworkCoverageTimes {
  private _coverageMap = new Map<number, number>();
  private _seenPeerIds = new Map<PeerId, number>();

  addAckFromPeer(peerId: PeerId, time: number, numTotalPeerIds: number) {
    if (this._seenPeerIds.has(peerId)) {
      return;
    } else {
      this._seenPeerIds.set(peerId, time);
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
    Object.fromEntries(this._coverageMap.entries());
  }
}

interface GlobalMetrics {
  networkCoverage: Map<number, NetworkCoverageTimes>;
  messageMergeTime: Average;
}

export class NetworkLatencyMetricsRecorder {
  private _recentPeerIds: Map<PeerId, number>;
  private _peerMetrics: Map<PeerMetricsKey, PeerMetrics>;
  private _globalMetrics: GlobalMetrics;
  private _gossipNode: GossipNode;
  private _cronTask?: cron.ScheduledTask;

  constructor(gossipNode: GossipNode);
  constructor(
    gossipNode: GossipNode,
    recentPeerIds?: Map<PeerId, number>,
    perPeerMetrics?: Map<AckMessageBody, PeerMetrics>
  ) {
    this._recentPeerIds = recentPeerIds ?? new Map();
    this._peerMetrics = perPeerMetrics ?? new Map();
    this._globalMetrics = { networkCoverage: new Map(), messageMergeTime: new Average() };
    this._gossipNode = gossipNode;
  }

  get recentPeerIds() {
    return this._recentPeerIds;
  }

  get peerMetrics() {
    return this._peerMetrics;
  }

  start() {
    this._cronTask = cron.schedule(DEFAULT_PERIODIC_LATENCY_PING_CRON, () => {
      return this.sendPingAndLogMetrics();
    });
  }

  stop() {
    if (this._cronTask) {
      return this._cronTask.stop();
    }
  }

  status(): SchedulerStatus {
    return this._cronTask ? 'started' : 'stopped';
  }

  recordMessageMerge(latestMergeTime: number) {
    this._globalMetrics.messageMergeTime.addValue(latestMergeTime);
  }

  async recordMessageReceipt(gossipMessage: GossipMessage) {
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
        const peerIdMatchesOrigin = this._gossipNode.peerId?.equals(pingOriginPeerId) ?? false;
        if (peerIdMatchesOrigin) {
          // Log ack latency for peer
          const ackPeerId = this.getPeerIdFromBytes(ackMessage.ackOriginPeerId);
          if (ackPeerId) {
            // Add peerId to recent peerIds
            this._recentPeerIds.set(ackPeerId, Date.now());

            // Compute peer and coverage metrics
            this.computePeerAndCoverageMetrics(ackMessage, ackPeerId);

            // Expire peerIds that are past the TTL
            this.expireMetrics();
          }
        }
      }
    }
  }

  private computePeerAndCoverageMetrics(ackMessage: AckMessageBody, ackOriginPeerId: PeerId) {
    // Compute peer-level metrics
    const key = { peerId: ackOriginPeerId, pingTimestamp: ackMessage.pingTimestamp };
    const currentMetrics = this._peerMetrics.get(key);
    const updatedMetrics: PeerMetrics = {
      numAcks: (currentMetrics?.numAcks ?? 0) + 1,
      lastAckTimestamp: currentMetrics?.lastAckTimestamp ?? ackMessage.ackTimestamp,
      messageCount: (currentMetrics?.messageCount ?? 0) + 1,
    };
    this._peerMetrics.set(key, updatedMetrics);

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
    // Log peer-level metrics
    [...this._peerMetrics].forEach(([key, metrics]) => {
      log.info(
        {
          peerId: key.peerId.toString(),
          latencyMilliseconds: metrics.lastAckTimestamp - key.pingTimestamp,
          messageCount: metrics.messageCount,
        },
        'GossipPeerMetrics'
      );
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
    this._peerMetrics = new Map(
      [...this._peerMetrics].filter(([_, v]) => currTime - v.lastAckTimestamp < METRICS_TTL_MILLISECONDS)
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
}
