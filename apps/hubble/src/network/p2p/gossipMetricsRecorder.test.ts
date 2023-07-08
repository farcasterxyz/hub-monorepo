import { createEd25519PeerId } from "@libp2p/peer-id-factory";
import { GossipMetricsRecorder, GossipMetrics, METRICS_TTL_MILLISECONDS } from "./gossipMetricsRecorder.js";
import { AckMessageBody, NetworkLatencyMessage, GossipMessage } from "@farcaster/hub-nodejs";
import { GossipNode } from "./gossipNode.js";
import { GOSSIP_PROTOCOL_VERSION } from "./protocol.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import { RootPrefix } from "../../storage/db/types.js";
import { jest } from "@jest/globals";

const db = jestRocksDB("network.p2p.gossipMetricsRecorder.test");

describe("Gossip metrics recorder accumulates metrics from messages", () => {
  afterEach(async () => {
    jest.resetAllMocks();
    await db.del(Buffer.from([RootPrefix.GossipMetrics]));
  });

  test("", async () => {
    const node = new GossipNode(db, undefined, true);
    await node.start([]);
    const nodePeerId = node.peerId ?? (await createEd25519PeerId());
    const otherPeerId = await createEd25519PeerId();
    let ackPeerId = await createEd25519PeerId();
    const pingTimestamp = Date.now();
    const recorder = node.metricsRecorder ?? new GossipMetricsRecorder(node, db);

    const timeTaken1 = 3600 * 1000;
    let ackMessage = AckMessageBody.create({
      pingOriginPeerId: otherPeerId.toBytes(),
      ackOriginPeerId: ackPeerId.toBytes(),
      pingTimestamp: pingTimestamp,
      ackTimestamp: pingTimestamp + timeTaken1,
    });
    const networkLatencyMessage = NetworkLatencyMessage.create({
      ackMessage,
    });
    const gossipMessage = GossipMessage.create({
      networkLatencyMessage,
      topics: [node.primaryTopic()],
      peerId: node.peerId?.toBytes() ?? new Uint8Array(),
      version: GOSSIP_PROTOCOL_VERSION,
    });
    recorder?.recordMessageReceipt(gossipMessage);

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
    recorder.recordLatencyAckMessageReceipt(ackMessage);

    // Recent peers set should have peerId from second ack
    expect(Object.keys(recorder.recentPeerIds)).toHaveLength(1);
    expect(recorder.recentPeerIds[ackPeerId.toString()]).toBeTruthy();

    // Metrics map should have ack with updates coverage
    const peerMetricsKey = `${ackPeerId.toString()}_${pingTimestamp}`;
    const updatedPeerLatencyMetrics = recorder.peerLatencyMetrics[peerMetricsKey.toString()];
    const updatedGlobalMetrics = recorder.globalMetrics;
    expect(Object.keys(recorder.peerLatencyMetrics)).toHaveLength(1);

    expect(updatedPeerLatencyMetrics?.numAcks).toEqual(1);
    expect(updatedPeerLatencyMetrics?.lastAckTimestamp).toEqual(pingTimestamp + timeTaken2);
    expect(Object.keys(recorder.peerMessageMetrics)).toHaveLength(1);
    expect(Object.keys(updatedGlobalMetrics.networkCoverage)).toHaveLength(1);
    expect(updatedGlobalMetrics.networkCoverage[pingTimestamp.toString()]).toEqual({
      seenPeerIds: {
        [ackPeerId.toString()]: timeTaken2,
      },
      coverageMap: {
        "0.5": timeTaken2,
        "0.75": timeTaken2,
        "0.9": timeTaken2,
        "0.99": timeTaken2,
      },
    });
  });

  test("GossipMetrics ser/de works correctly", async () => {
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

  test("Message merge times are updated correctly", async () => {
    const node = new GossipNode(db, undefined, true);
    node.start([]);
    const recorder = node.metricsRecorder ?? new GossipMetricsRecorder(node, db);
    await recorder.start();
    expect(recorder.globalMetrics.messageMergeTime).toEqual({ numElements: 0, sum: 0 });
    recorder.recordMessageMerge(10);
    expect(recorder.globalMetrics.messageMergeTime).toEqual({ numElements: 1, sum: 10 });
    recorder.recordMessageMerge(100);
    expect(recorder.globalMetrics.messageMergeTime).toEqual({ numElements: 2, sum: 110 });
  });

  test("Metrics are expired correctly", async () => {
    const metricTime = Date.now() - METRICS_TTL_MILLISECONDS;
    const recentPeerIds = { testPeerId: metricTime };
    const peerLatencyMetrics = { testPeerId_123: { numAcks: 1, lastAckTimestamp: metricTime } };
    const peerMessageMetrics = { testPeerId: { messageCount: 11 } };
    const messageMergeTime = { sum: 112, numElements: 1 };
    const globalMetrics = {
      networkCoverage: { metricTime: { coverageMap: {}, seenPeerIds: {} } },
      messageMergeTime: messageMergeTime,
    };
    const metrics = new GossipMetrics(recentPeerIds, peerLatencyMetrics, peerMessageMetrics, globalMetrics);
    await db.put(Buffer.from([RootPrefix.GossipMetrics]), metrics.toBuffer());

    const node = new GossipNode(db, undefined, true);
    node.start([]);
    const recorder = new GossipMetricsRecorder(node, db);
    await recorder.start();

    expect(recorder.globalMetrics).toEqual({ networkCoverage: {}, messageMergeTime: { sum: 0, numElements: 0 } });
    expect(recorder.peerLatencyMetrics).toEqual({});
    expect(recorder.peerMessageMetrics).toEqual({});
    expect(recorder.recentPeerIds).toEqual({});
  });

  test("Metrics are logged and expired after ping is sent", async () => {
    const node = new GossipNode(db, undefined, true);
    await node.start([]);
    const recorder = new GossipMetricsRecorder(node, db);
    await recorder.start();

    jest.spyOn(recorder, "expireMetrics");
    jest.spyOn(recorder, "logMetrics");
    jest.spyOn(node, "publish");
    await recorder.sendPingAndLogMetrics(0);

    expect(recorder.expireMetrics).toHaveBeenCalledTimes(1);
    expect(recorder.logMetrics).toHaveBeenCalledTimes(1);
    expect(node.publish).toHaveBeenCalledTimes(1);
    expect(recorder.peerMessageMetrics).toEqual({});
  });
});
