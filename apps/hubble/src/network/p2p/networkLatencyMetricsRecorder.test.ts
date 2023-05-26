import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { NetworkLatencyMetricsRecorder } from './networkLatencyMetricsRecorder.js';
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
    const recorder = new NetworkLatencyMetricsRecorder(node);
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
    const peerMetricsKey = { peerId: ackPeerId, pingTimestamp: pingTimestamp };

    // Recent peers set should now have ack sender peerId
    expect(recorder.recentPeerIds.size).toEqual(0);

    // Metrics map should have ack message with coverage
    expect(recorder.peerLatencyMetrics.size).toEqual(0);

    // Message count should be incremented
    expect(recorder.peerMessageMetrics.size).toEqual(1);
    expect(recorder.peerMessageMetrics.get(nodePeerId)?.messageCount).toEqual(1);

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
      peerId: node.peerId?.toBytes() ?? new Uint8Array(),
      version: GOSSIP_PROTOCOL_VERSION,
    });
    recorder.recordMessageReceipt(gossipMessage);

    // Recent peers set should have peerId from second ack
    expect(recorder.recentPeerIds.size).toEqual(1);
    expect(recorder.recentPeerIds.get(ackPeerId)).toBeTruthy();

    // Metrics map should have ack with updates coverage
    const updatedPeerLatencyMetrics = recorder.peerLatencyMetrics.get(peerMetricsKey);
    const updatedGlobalMetrics = recorder.globalMetrics;
    const updatedPeerMessageMetrics = recorder.peerMessageMetrics.get(nodePeerId);
    expect(recorder.peerLatencyMetrics.size).toEqual(1);
    expect(updatedPeerLatencyMetrics?.numAcks).toEqual(1);
    expect(updatedPeerLatencyMetrics?.lastAckTimestamp).toEqual(pingTimestamp + timeTaken2);
    expect(updatedPeerMessageMetrics?.messageCount).toEqual(1);
    expect(updatedGlobalMetrics?.networkCoverage.get(pingTimestamp)?.getLoggableObject()).toEqual({
      '0.5': timeTaken2,
      '0.75': timeTaken2,
      '0.9': timeTaken2,
      '0.99': timeTaken2,
    });
  });

  test('Network latency acks are sent on ping receipt', async () => {
    const nodePeerId = await createEd25519PeerId();
    const node = new MockGossipNode(nodePeerId);
    const recorder = new NetworkLatencyMetricsRecorder(node);
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
    const recorder = new NetworkLatencyMetricsRecorder(node);
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
    expect(recorder.recentPeerIds.size).toEqual(0);
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
    expect(recorder.recentPeerIds.size).toEqual(1);
    expect(node.publishCount).toEqual(0);
  });
});
