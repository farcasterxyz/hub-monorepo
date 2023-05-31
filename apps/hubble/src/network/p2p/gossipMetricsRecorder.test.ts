import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { GossipMetricsRecorder, GossipMetrics } from './gossipMetricsRecorder.js';
import {
  AckMessageBody,
  PingMessageBody,
  NetworkLatencyMessage,
  GossipMessage,
  HubResult,
} from '@farcaster/hub-nodejs';
import { GossipNode } from './gossipNode.js';
import { GOSSIP_PROTOCOL_VERSION } from './protocol.js';
import { PublishResult } from '@libp2p/interface-pubsub';
import { ok } from 'neverthrow';
import { PeerId } from '@libp2p/interface-peer-id';

class MockGossipNode extends GossipNode {
  publishCount = 0;
  _peerId: PeerId;

  constructor(peerId: PeerId) {
    super();
    this._peerId = peerId;
  }

  override async publish(_: GossipMessage): Promise<HubResult<PublishResult>[]> {
    this.publishCount += 1;
    return [ok({ recipients: [] })];
  }

  override get peerId(): PeerId {
    return this._peerId;
  }
}

describe('NetworkLatencyMetrics', () => {
  test('recordMessageReceipt updates metrics state', async () => {
    const nodePeerId = await createEd25519PeerId();
    const node = new MockGossipNode(nodePeerId);
    const recorder = new GossipMetricsRecorder(node);
    await recorder.start();
    const otherPeerId = await createEd25519PeerId();
    let ackPeerId = await createEd25519PeerId();
    const pingTimestamp = Date.now();

    const timeTaken1 = 3600 * 1000;
    let ackMessage = AckMessageBody.create({
      pingOriginPeerId: otherPeerId.toBytes(),
      ackOriginPeerId: ackPeerId.toBytes(),
      pingTimestamp: pingTimestamp,
      ackTimestamp: pingTimestamp + timeTaken1,
    });
    let networkLatencyMessage = NetworkLatencyMessage.create({
      ackMessage,
    });
    let gossipMessage = GossipMessage.create({
      networkLatencyMessage,
      topics: [node.primaryTopic()],
      peerId: node.peerId?.toBytes() ?? new Uint8Array(),
      version: GOSSIP_PROTOCOL_VERSION,
    });
    recorder.recordMessageReceipt(gossipMessage);

    // Recent peers set should now have ack sender peerId
    expect(Object.keys(recorder.recentPeerIds)).toHaveLength(0);

    // Metrics map should have ack message with coverage
    expect(Object.keys(recorder.peerLatencyMetrics)).toHaveLength(0);

    // Message count should be incremented
    expect(Object.keys(recorder.peerMessageMetrics)).toHaveLength(1);
    expect(recorder.peerMessageMetrics[nodePeerId.toString()]?.messageCount).toEqual(1);

    ackPeerId = await createEd25519PeerId();
    const timeTaken2 = 7200 * 1000;
    ackMessage = AckMessageBody.create({
      pingOriginPeerId: nodePeerId.toBytes(),
      ackOriginPeerId: ackPeerId.toBytes(),
      pingTimestamp: pingTimestamp,
      ackTimestamp: pingTimestamp + timeTaken2,
    });
    networkLatencyMessage = NetworkLatencyMessage.create({
      ackMessage,
    });
    gossipMessage = GossipMessage.create({
      networkLatencyMessage,
      topics: [node.primaryTopic()],
      peerId: nodePeerId.toBytes(),
      version: GOSSIP_PROTOCOL_VERSION,
    });
    recorder.recordMessageReceipt(gossipMessage);

    // Recent peers set should have peerId from second ack
    expect(Object.keys(recorder.recentPeerIds)).toHaveLength(1);
    expect(recorder.recentPeerIds[ackPeerId.toString()]).toBeTruthy();

    // Metrics map should have ack with updates coverage
    const peerMetricsKey = `${ackPeerId.toString()}_${pingTimestamp}`;
    const updatedPeerLatencyMetrics = recorder.peerLatencyMetrics[peerMetricsKey];
    const updatedGlobalMetrics = recorder.globalMetrics;
    const updatedPeerMessageMetrics = recorder.peerMessageMetrics[nodePeerId.toString()];
    expect(Object.keys(recorder.peerLatencyMetrics)).toHaveLength(1);

    expect(updatedPeerLatencyMetrics?.numAcks).toEqual(1);
    expect(updatedPeerLatencyMetrics?.lastAckTimestamp).toEqual(pingTimestamp + timeTaken2);
    expect(Object.keys(recorder.peerMessageMetrics)).toHaveLength(1);
    expect(updatedPeerMessageMetrics?.messageCount).toEqual(2);
    expect(Object.keys(updatedGlobalMetrics.networkCoverage)).toHaveLength(1);
    // eslint-disable-next-line security/detect-object-injection
    expect(updatedGlobalMetrics.networkCoverage[pingTimestamp]).toEqual({
      seenPeerIds: {
        [ackPeerId.toString()]: timeTaken2,
      },
      coverageMap: {
        '0.5': timeTaken2,
        '0.75': timeTaken2,
        '0.9': timeTaken2,
        '0.99': timeTaken2,
      },
    });
  });

  test('Network latency acks are sent on ping receipt', async () => {
    const nodePeerId = await createEd25519PeerId();
    const node = new MockGossipNode(nodePeerId);
    const recorder = new GossipMetricsRecorder(node);
    await recorder.start();
    // Ping message should be responded to with an ack message
    const pingMessage = PingMessageBody.create({
      pingOriginPeerId: nodePeerId.toBytes(),
      pingTimestamp: Date.now(),
    });
    const networkLatencyMessage = NetworkLatencyMessage.create({
      pingMessage,
    });
    const gossipMessage = GossipMessage.create({
      networkLatencyMessage,
      topics: [node.primaryTopic()],
      peerId: node.peerId?.toBytes() ?? new Uint8Array(),
      version: GOSSIP_PROTOCOL_VERSION,
    });
    await recorder.recordMessageReceipt(gossipMessage);
    expect(node.publishCount).toEqual(1);
  });

  test('Network latency metrics are logged on ack receipt', async () => {
    const nodePeerId = await createEd25519PeerId();
    const node = new MockGossipNode(nodePeerId);
    const recorder = new GossipMetricsRecorder(node);
    await recorder.start();
    const senderPeerId = await createEd25519PeerId();

    // Metrics should not be logged if ping origin peerId does not match node's peerId
    const ackPeerId = await createEd25519PeerId();
    let ackMessage = AckMessageBody.create({
      pingOriginPeerId: ackPeerId.toBytes(),
      ackOriginPeerId: senderPeerId.toBytes(),
      pingTimestamp: Date.now(),
    });
    let networkLatencyMessage = NetworkLatencyMessage.create({
      ackMessage,
    });
    let gossipMessage = GossipMessage.create({
      networkLatencyMessage,
      topics: [node.primaryTopic()],
      peerId: node.peerId?.toBytes() ?? new Uint8Array(),
      version: GOSSIP_PROTOCOL_VERSION,
    });
    await recorder.recordMessageReceipt(gossipMessage);
    expect(Object.keys(recorder.recentPeerIds)).toHaveLength(0);
    expect(node.publishCount).toEqual(0);

    // Metrics should be logged if ping origin peerId matches node's peerId
    ackMessage = AckMessageBody.create({
      pingOriginPeerId: node.peerId?.toBytes() ?? new Uint8Array(),
      ackOriginPeerId: senderPeerId.toBytes(),
      pingTimestamp: Date.now(),
    });
    networkLatencyMessage = NetworkLatencyMessage.create({
      ackMessage,
    });
    gossipMessage = GossipMessage.create({
      networkLatencyMessage,
      topics: [node.primaryTopic()],
      peerId: node.peerId?.toBytes() ?? new Uint8Array(),
      version: GOSSIP_PROTOCOL_VERSION,
    });
    await recorder.recordMessageReceipt(gossipMessage);
    expect(Object.keys(recorder.recentPeerIds)).toHaveLength(1);
    expect(node.publishCount).toEqual(0);
  });

  test('GossipMetrics serde works correctly', async () => {
    const recentPeerIds = { testPeerId: 1 };
    const peerLatencyMetrics = { testPeerId_123: { numAcks: 1, lastAckTimestamp: 12345 } };
    const peerMessageMetrics = { testPeerId: { messageCount: 11 } };
    const messageMergeTime = { sum: 112, numElements: 1 };
    const globalMetrics = { networkCoverage: {}, messageMergeTime: messageMergeTime };

    const metrics = new GossipMetrics(recentPeerIds, peerLatencyMetrics, peerMessageMetrics, globalMetrics);
    const buffer = metrics.toBuffer();
    const deserializedMetrics = GossipMetrics.fromBuffer(buffer);
    expect(deserializedMetrics).toEqual(metrics);
  });
});
