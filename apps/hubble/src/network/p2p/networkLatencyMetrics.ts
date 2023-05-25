import { PeerId } from '@libp2p/interface-peer-id';
import { AckMessageBody, HubError, NetworkLatencyMessage } from '@farcaster/hub-nodejs';
import { logger } from '../../utils/logger.js';
import { Result } from 'neverthrow';
import { peerIdFromBytes } from '@libp2p/peer-id';

const RECENT_PEER_TTL_MILLISECONDS = 5 * 3600 * 1000; // Expire recent peers every 5 hours
const METRICS_TTL_MILLISECONDS = 5 * 3600 * 1000; // Expire stored metrics every 5 hours

const log = logger.child({ component: 'NetworkLatencyMetrics' });

interface Metrics {
  numAcks?: number;
  lastAckTimestamp: number;
  networkCoverage: Map<number, number>;
}

export class NetworkLatencyMetrics {
  private _recentPeerIds: Map<string, number>;
  private _metrics: Map<string, Metrics>;

  constructor();
  constructor(recentPeerIds?: Map<PeerId, number>, metrics?: Map<AckMessageBody, Metrics>) {
    this._recentPeerIds = recentPeerIds ?? new Map();
    this._metrics = metrics ?? new Map();
  }

  get recentPeerIds() {
    return this._recentPeerIds;
  }

  get metrics() {
    return this._metrics;
  }

  public logMetrics(message: NetworkLatencyMessage) {
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

  private expireEntries() {
    const currTime = Date.now();
    this._recentPeerIds = new Map(
      [...this._recentPeerIds].filter(([_, v]) => currTime - v < RECENT_PEER_TTL_MILLISECONDS)
    );
    this._metrics = new Map(
      [...this._metrics].filter(([_, v]) => currTime - v.lastAckTimestamp < METRICS_TTL_MILLISECONDS)
    );
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
}
