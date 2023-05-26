import { PeerId } from '@libp2p/interface-peer-id';
import { AckMessageBody, HubError, NetworkLatencyMessage } from '@farcaster/hub-nodejs';
import { logger } from '../../utils/logger.js';
import { GossipNode } from './gossipNode.js';
import { Result } from 'neverthrow';
import { peerIdFromBytes } from '@libp2p/peer-id';
import cron from 'node-cron';

const RECENT_PEER_TTL_MILLISECONDS = 5 * 3600 * 1000; // Expire recent peers every 5 hours
const METRICS_TTL_MILLISECONDS = 5 * 3600 * 1000; // Expire stored metrics every 5 hours
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

  recordMessageReceipt() {
    this._messageCount += 1;
  }

  recordMessageMerge(latestMergeTime: number) {
    const currentMergeTime = this._averageMergeTime;
    this._averageMergeTime = [currentMergeTime[0] + latestMergeTime, currentMergeTime[1] + 1];
  }

  recordLatencyMessageReceipt(message: NetworkLatencyMessage) {
    if (message.ackMessage) {
      const ackMessage = message.ackMessage;
      // Log ack latency for peer
      const peerIdResult = Result.fromThrowable(
        () => peerIdFromBytes(ackMessage.ackOriginPeerId ?? new Uint8Array([])),
        (error) => new HubError('bad_request.parse_failure', error as Error)
      )();
      if (peerIdResult.isOk()) {
        log.info(
          {
            receivingHubPeerId: peerIdResult.value,
            latencyMilliseconds: ackMessage.ackTimestamp - ackMessage.pingTimestamp,
          },
          'GossipLatencyMetrics'
        );
      }

      // Log network coverage
      this.logNetworkCoverage(ackMessage);

      // Expire peerIds that are past the TTL
      this.expireEntries();
    }
    return;
  }

  private logMessageAndMergeMetrics() {
    log.info(
      {
        messageCount: this._messageCount,
        mergeTimeMilliseconds: this._averageMergeTime[0] / this._averageMergeTime[1],
      },
      'GossipMessageCount'
    );
    // Reset average merge time metric
    this._averageMergeTime = [0, 0];
  }

  private logNetworkCoverage(ackMessage: AckMessageBody) {
    // Add peerId to recent peerIds
    this._recentPeerIds.set(ackMessage.ackOriginPeerId.toString(), Date.now());

    // Compute coverage metrics
    const metricsKey = `${ackMessage.pingOriginPeerId}_${ackMessage.pingTimestamp}`;
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
    const result = await this._gossipNode.gossipNetworkLatencyPing();
    const combinedResult = Result.combineWithAllErrors(result);
    if (combinedResult.isErr()) {
      log.warn({ err: combinedResult.error }, 'Failed to send gossip latency ping');
    }
    // Since logging message counts on each message might make logs too noisy,
    // we log message count metrics here instead
    this.logMessageAndMergeMetrics();
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
