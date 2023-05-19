import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { NetworkLatencyMetrics } from './networkLatencyMetrics';
import { AckMessageBody, NetworkLatencyMessage } from '@farcaster/hub-nodejs';

describe('NetworkLatencyMetrics', () => {
  test('logMetrics updates metrics state', async () => {
    const metrics = new NetworkLatencyMetrics();
    const senderPeerId = await createEd25519PeerId();
    const originPeerId = await createEd25519PeerId();
    const now = Date.now();
    const timeTaken = 3600 * 1000;
    const pingTimestamp = now - timeTaken;
    const ackMessage = AckMessageBody.create({
      pingOriginPeerId: originPeerId.toBytes(),
      pingTimestamp: pingTimestamp,
      ackTimestamp: now,
    });
    const key = `${ackMessage.pingOriginPeerId}_${ackMessage.pingTimestamp}`;
    const networkLatencyMessage = NetworkLatencyMessage.create({
      ackMessage,
    });
    metrics.logMetrics(senderPeerId, networkLatencyMessage);

    // Recent peers set should now have ack sender peerId
    expect(metrics.recentPeerIds.get(senderPeerId.toString())).toBeTruthy();

    // Metrics map should have ack message with coverage
    expect(metrics.metrics.size).toEqual(1);
    expect(metrics.metrics.get(key)?.numAcks).toEqual(1);
    expect(metrics.metrics.get(key)?.lastAckTimestamp).toEqual(now);
    expect(metrics.metrics.get(key)?.networkCoverage.get(0.5)).toEqual(timeTaken);
    expect(metrics.metrics.get(key)?.networkCoverage.get(0.75)).toEqual(timeTaken);
    expect(metrics.metrics.get(key)?.networkCoverage.get(0.9)).toEqual(timeTaken);
    expect(metrics.metrics.get(key)?.networkCoverage.get(0.99)).toEqual(timeTaken);

    // now = Date.now();
    // ackMessage = AckMessageBody.create({
    //     pingOriginPeerId: originPeerId.toBytes(),
    //     pingTimestamp: pingTimestamp,
    //     ackTimestamp: now
    // })
    // key = `${ackMessage.pingOriginPeerId}_${ackMessage.pingTimestamp}`
    // networkLatencyMessage = NetworkLatencyMessage.create({
    //     ackMessage
    // })
    // metrics.logMetrics(senderPeerId, networkLatencyMessage);
  });
});
