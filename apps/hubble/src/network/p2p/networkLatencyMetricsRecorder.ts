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

type SchedulerStatus = 'started' | 'stopped';

const log = logger.child({ component: 'NetworkLatencyMetricsRecorder' });

interface Metrics {
  numAcks?: number;
  lastAckTimestamp: number;
  networkCoverage: Map<number, number>;
}

export class NetworkLatencyMetricsRecorder {
  private _recentPeerIds: Map<string, number>;
  private _metrics: Map<string, Metrics>;
  private _messageCount: number;
  private _averageMergeTime: [number, number];
  private _gossipNode: GossipNode;
  private _cronTask?: cron.ScheduledTask;

  constructor(gossipNode: GossipNode);
  constructor(gossipNode: GossipNode, recentPeerIds?: Map<PeerId, number>, metrics?: Map<AckMessageBody, Metrics>) {
    this._recentPeerIds = recentPeerIds ?? new Map();
    this._metrics = metrics ?? new Map();
    this._messageCount = 0;
    this._gossipNode = gossipNode;
    this._averageMergeTime = [0, 0];
  }

  get recentPeerIds() {
    return this._recentPeerIds;
  }

  get metrics() {
    return this._metrics;
  }

  get messageCount() {
    return this._messageCount;
  }

  start() {
    this._cronTask = cron.schedule(DEFAULT_PERIODIC_LATENCY_PING_CRON, () => {
      return this.sendPing();
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
    const currentMergeTime = this._averageMergeTime;
    this._averageMergeTime = [currentMergeTime[0] + latestMergeTime, currentMergeTime[1] + 1];
  }

  async recordMessageReceipt(gossipMessage: GossipMessage) {
    this._messageCount += 1;
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
      const pingOriginPeerIdResult = Result.fromThrowable(
        () => peerIdFromBytes(ackMessage.pingOriginPeerId ?? new Uint8Array([])),
        (error) => new HubError('bad_request.parse_failure', error as Error)
      )();
      if (pingOriginPeerIdResult.isOk()) {
        const peerIdMatchesOrigin = this._gossipNode.peerId?.equals(pingOriginPeerIdResult.value) ?? false;
        if (peerIdMatchesOrigin) {
          // Log ack latency for peer
          const ackPeerIdResultResult = Result.fromThrowable(
            () => peerIdFromBytes(ackMessage.ackOriginPeerId ?? new Uint8Array([])),
            (error) => new HubError('bad_request.parse_failure', error as Error)
          )();
          if (ackPeerIdResultResult.isOk()) {
            log.info(
              {
                receivingHubPeerId: ackPeerIdResultResult.value,
                latencyMilliseconds: ackMessage.ackTimestamp - ackMessage.pingTimestamp,
              },
              'GossipLatencyMetrics'
            );

            // Log network coverage
            this.logNetworkCoverage(ackMessage, ackPeerIdResultResult.value);

            // Expire peerIds that are past the TTL
            this.expireEntries();
          }
        }
      }
    }
  }

  private logMessageCountAndMergeMetrics() {
    const numMergeTimes = this._averageMergeTime[1];
    const averageMergeTime = numMergeTimes == 0 ? 0 : this._averageMergeTime[0] / this._averageMergeTime[1];
    log.info(
      {
        messageCount: this._messageCount,
        mergeTimeMilliseconds: averageMergeTime,
      },
      'GossipMessageCount'
    );
    // Reset average merge time metric
    this._averageMergeTime = [0, 0];
  }

  private logNetworkCoverage(ackMessage: AckMessageBody, ackOriginPeerId: PeerId) {
    // Add peerId to recent peerIds
    this._recentPeerIds.set(ackOriginPeerId.toString(), Date.now());

    // Compute coverage metrics
    const metricsKey = `${ackOriginPeerId.toString()}_${ackMessage.pingTimestamp}`;
    const currentMetrics = this._metrics.get(metricsKey);
    const oldNumAcks = this._metrics.get(metricsKey)?.numAcks ?? 0;
    const newNumAcks = oldNumAcks + 1;
    const coverageProportion = newNumAcks / this._recentPeerIds.size;
    const updatedMetrics: Metrics = {
      numAcks: newNumAcks,
      networkCoverage: currentMetrics?.networkCoverage ?? new Map<number, number>(),
      lastAckTimestamp: ackMessage.ackTimestamp,
    };
    const timeTaken = ackMessage.ackTimestamp - ackMessage.pingTimestamp;
    const coverageThresholds = [0.5, 0.75, 0.9, 0.99];
    coverageThresholds.forEach((threshold) => {
      const coverageIsAboveThreshold = threshold <= coverageProportion;
      const shouldUpdateMetricForThreshold = oldNumAcks / newNumAcks < threshold;
      if (shouldUpdateMetricForThreshold && coverageIsAboveThreshold) {
        updatedMetrics.networkCoverage.set(threshold, timeTaken);
        log.info({ networkCoverage: threshold, timeTakenMilliseconds: timeTaken }, 'GossipCoverageMetrics');
      }
    });
    this._metrics.set(metricsKey, updatedMetrics);
  }

  private async sendPing() {
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
    this.logMessageCountAndMergeMetrics();
  }

  private expireEntries() {
    const currTime = Date.now();
    this._recentPeerIds = new Map(
      [...this._recentPeerIds].filter(([_, v]) => currTime - v < RECENT_PEER_TTL_MILLISECONDS)
    );
    this._metrics = new Map(
      [...this._metrics].filter(([_, v]) => currTime - v.lastAckTimestamp < METRICS_TTL_MILLISECONDS)
    );
  }
}
