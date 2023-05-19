import { PeerId } from '@libp2p/interface-peer-id';
import { AckMessageBody, NetworkLatencyMessage } from '@farcaster/hub-nodejs';
import { logger } from '~/utils/logger';

const RECENT_PEER_TTL_MILLISECONDS = 5 * 60 * 3600 * 1000;
const METRICS_TTL_MILLISECONDS = 5 * 60 * 3600 * 1000;

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

  public logMetrics(senderPeerId: PeerId, message: NetworkLatencyMessage) {
    if (message.ackMessage) {
      const ackMessage = message.ackMessage;
      // Add peerId to recent peerIds
      this._recentPeerIds.set(senderPeerId.toString(), Date.now());

      // Log ack latency for peer
      log.info(
        {
          receivingHubPeerId: senderPeerId.toString(),
          latencyMilliseconds: ackMessage.ackTimestamp - ackMessage.pingTimestamp,
        },
        'gossip network latency metrics'
      );

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
    const metricsKey = `${ackMessage.pingOriginPeerId}_${ackMessage.pingTimestamp}`;
    const currentMetrics = this._metrics.get(metricsKey);
    const newNumAcks = (this._metrics.get(metricsKey)?.numAcks ?? 0) + 1;
    const coverageProportion = newNumAcks / this._recentPeerIds.size;
    const updatedMetrics: Metrics = {
      numAcks: newNumAcks,
      networkCoverage: currentMetrics?.networkCoverage ?? new Map<number, number>(),
      lastAckTimestamp: ackMessage.ackTimestamp,
    };
    const timeTaken = ackMessage.ackTimestamp - ackMessage.pingTimestamp;
    const coverageLabels = [0.5, 0.75, 0.9, 0.99];
    coverageLabels.forEach((label) => {
      if (!currentMetrics?.networkCoverage.get(label) && label <= coverageProportion) {
        updatedMetrics.networkCoverage.set(label, timeTaken);
        log.info({ networkCoverage: label, timeTaken: timeTaken }, 'gossip network coverage metrics');
      }
    });
    this._metrics.set(metricsKey, updatedMetrics);
  }
}
