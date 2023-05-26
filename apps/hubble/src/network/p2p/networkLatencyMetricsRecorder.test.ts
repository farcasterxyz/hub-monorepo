import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { NetworkLatencyMetricsRecorder } from './networkLatencyMetricsRecorder.js';
import { AckMessageBody, NetworkLatencyMessage } from '@farcaster/hub-nodejs';
import { GossipNode } from './gossipNode.js';

describe('NetworkLatencyMetrics', () => {
  test('logMetrics updates metrics state', async () => {
    const node = new GossipNode();
    const metrics = new NetworkLatencyMetricsRecorder(node);
    const originPeerId = await createEd25519PeerId();
    let ackPeerId = await createEd25519PeerId();
    const pingTimestamp = Date.now();

    const timeTaken1 = 3600 * 1000;
    let ackMessage = AckMessageBody.create({
      pingOriginPeerId: originPeerId.toBytes(),
      ackOriginPeerId: ackPeerId.toBytes(),
      pingTimestamp: pingTimestamp,
      ackTimestamp: pingTimestamp + timeTaken1,
    });
    let key = `${ackMessage.pingOriginPeerId}_${ackMessage.pingTimestamp}`;
    let networkLatencyMessage = NetworkLatencyMessage.create({
      ackMessage,
    });
    metrics.logMetrics(networkLatencyMessage);

    // Recent peers set should now have ack sender peerId
    expect(metrics.recentPeerIds.get(ackPeerId.toBytes().toString())).toBeTruthy();

    // Metrics map should have ack message with coverage
    expect(metrics.metrics.size).toEqual(1);
    expect(metrics.metrics.get(key)?.numAcks).toEqual(1);
    expect(metrics.metrics.get(key)?.lastAckTimestamp).toEqual(pingTimestamp + timeTaken1);
    expect(metrics.metrics.get(key)?.networkCoverage.get(0.5)).toEqual(timeTaken1);
    expect(metrics.metrics.get(key)?.networkCoverage.get(0.75)).toEqual(timeTaken1);
    expect(metrics.metrics.get(key)?.networkCoverage.get(0.9)).toEqual(timeTaken1);
    expect(metrics.metrics.get(key)?.networkCoverage.get(0.99)).toEqual(timeTaken1);

    ackPeerId = await createEd25519PeerId();
    const timeTaken2 = 7200 * 1000;
    ackMessage = AckMessageBody.create({
      pingOriginPeerId: originPeerId.toBytes(),
      ackOriginPeerId: ackPeerId.toBytes(),
      pingTimestamp: pingTimestamp,
      ackTimestamp: pingTimestamp + timeTaken2,
    });
    key = `${ackMessage.pingOriginPeerId}_${ackMessage.pingTimestamp}`;
    networkLatencyMessage = NetworkLatencyMessage.create({
      ackMessage,
    });
    metrics.logMetrics(networkLatencyMessage);

    // Recent peers set should have peerId from second ack
    expect(metrics.recentPeerIds.size).toEqual(2);
    expect(metrics.recentPeerIds.get(ackPeerId.toBytes().toString())).toBeTruthy();

    // Metrics map should have ack with updates coverage
    expect(metrics.metrics.size).toEqual(1);
    expect(metrics.metrics.get(key)?.numAcks).toEqual(2);
    expect(metrics.metrics.get(key)?.lastAckTimestamp).toEqual(pingTimestamp + timeTaken2);
    expect(metrics.metrics.get(key)?.networkCoverage.get(0.5)).toEqual(timeTaken1);
    expect(metrics.metrics.get(key)?.networkCoverage.get(0.75)).toEqual(timeTaken2);
    expect(metrics.metrics.get(key)?.networkCoverage.get(0.9)).toEqual(timeTaken2);
    expect(metrics.metrics.get(key)?.networkCoverage.get(0.99)).toEqual(timeTaken2);
  });
});
