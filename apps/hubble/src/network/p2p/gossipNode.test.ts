import * as protobufs from '@farcaster/grpc';
import { multiaddr } from '@multiformats/multiaddr/';
import { GossipNode } from '~/network/p2p/gossipNode';
import { NETWORK_TOPIC_PRIMARY } from '~/network/p2p/protocol';
import { sleep } from '~/utils/crypto';
import { NetworkFactories } from '../utils/factories';

const NUM_NODES = 10;
const PROPAGATION_DELAY = 3 * 1000; // between 2 and 3 full heartbeat ticks

const TEST_TIMEOUT_LONG = 60 * 1000;
const TEST_TIMEOUT_SHORT = 10 * 1000;

let nodes: GossipNode[];
// map peerId -> topics -> Messages per topic
let messages: Map<string, Map<string, protobufs.GossipMessage[] | undefined>>;

/** Create a sequence of connections between all the nodes */
const connectAll = async (nodes: GossipNode[]) => {
  const connectionResults = await Promise.all(
    nodes.slice(1).map((n) => {
      return n.connect(nodes[0] as GossipNode);
    })
  );
  connectionResults.forEach((r) => expect(r?.isOk()).toBeTruthy());

  // subscribe every node to the test topic
  nodes.forEach((n) => n.gossip?.subscribe(NETWORK_TOPIC_PRIMARY));
  // sleep 5 heartbeats to let the gossipsub network form
  await sleep(PROPAGATION_DELAY);
};

const trackMessages = () => {
  nodes.forEach((n) => {
    {
      n.addListener('message', (topic, message) => {
        expect(message.isOk()).toBeTruthy();

        const peerId = n.peerId?.toString() ?? '';
        let existingTopics = messages.get(peerId);
        if (!existingTopics) existingTopics = new Map();
        let existingMessages = existingTopics.get(topic);
        if (!existingMessages) existingMessages = [];

        existingMessages.push(message._unsafeUnwrap());
        existingTopics.set(topic, existingMessages);
        messages.set(peerId, existingTopics);
      });
      n.registerDebugListeners();
    }
  });
};

describe('node unit tests', () => {
  test('fails to bootstrap to invalid addresses', async () => {
    const node = new GossipNode();
    const error = (await node.start([multiaddr()]))._unsafeUnwrapErr();
    expect(error.errCode).toEqual('unavailable');
    expect(error.message).toContain('could not connect to any bootstrap nodes');
    await node.stop();
  });

  test('fails to connect with a node that has not started', async () => {
    const node = new GossipNode();
    await node.start([]);

    let result = await node.connectAddress(multiaddr());
    expect(result.isErr()).toBeTruthy();

    const offlineNode = new GossipNode();
    result = await node.connect(offlineNode);
    expect(result.isErr()).toBeTruthy();

    await node.stop();
  });

  test(
    'can only dial allowed nodes',
    async () => {
      const node1 = new GossipNode();
      await node1.start([]);

      const node2 = new GossipNode();
      await node2.start([]);

      // node 3 has node 1 in its allow list, but not node 2
      const node3 = new GossipNode();
      if (node1.peerId) {
        await node3.start([], { allowedPeerIdStrs: [node1.peerId.toString()] });
      } else {
        throw Error('Node1 not started, no peerId found');
      }

      try {
        let dialResult = await node1.connect(node3);
        expect(dialResult.isOk()).toBeTruthy();

        dialResult = await node2.connect(node3);
        expect(dialResult.isErr()).toBeTruthy();

        dialResult = await node3.connect(node2);
        expect(dialResult.isErr()).toBeTruthy();
      } finally {
        await node1.stop();
        await node2.stop();
        await node3.stop();
      }
    },
    TEST_TIMEOUT_SHORT
  );

  test('port and transport addrs in the Ip MultiAddr is not allowed', async () => {
    const node = new GossipNode();
    const options = { ipMultiAddr: '/ip4/127.0.0.1/tcp/8080' };
    const error = (await node.start([], options))._unsafeUnwrapErr();

    expect(error.errCode).toEqual('unavailable');
    expect(error.message).toMatch('unexpected multiaddr transport/port information');
    expect(node.isStarted()).toBeFalsy();
    await node.stop();
  });

  test('invalid multiaddr format is not allowed', async () => {
    const node = new GossipNode();
    // an IPv6 being supplied as an IPv4
    const options = { ipMultiAddr: '/ip4/2600:1700:6cf0:990:2052:a166:fb35:830a' };
    expect((await node.start([], options))._unsafeUnwrapErr().errCode).toEqual('unavailable');
    const error = (await node.start([], options))._unsafeUnwrapErr();

    expect(error.errCode).toEqual('unavailable');
    expect(error.message).toMatch('invalid multiaddr');
    expect(node.isStarted()).toBeFalsy();
    await node.stop();
  });
});

describe('gossip network', () => {
  beforeAll(async () => {
    nodes = [...Array(NUM_NODES)].map(() => new GossipNode());
    messages = new Map();
  });

  beforeEach(async () => {
    messages.clear();
    await Promise.all(nodes.map((node) => node.start([])));
  });

  afterEach(async () => {
    await Promise.all(nodes.map((node) => node.stop()));
  }, TEST_TIMEOUT_SHORT);

  test(
    'sends a message to a gossip network',
    async () => {
      await connectAll(nodes);
      nodes.map((n) => expect(n.gossip?.getPeers().length).toBeGreaterThanOrEqual(1));

      trackMessages();

      const message = NetworkFactories.GossipMessage.build();
      // publish via some random node
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)] as GossipNode;
      expect(randomNode.publish(message)).resolves.toBeUndefined();
      // sleep 5 heartbeat ticks
      await sleep(PROPAGATION_DELAY);

      // check that every node has the message
      nodes.map((n) => {
        // the sender won't have this message
        if (n.peerId?.toString() === randomNode.peerId?.toString()) return;

        const topics = messages.get(n.peerId?.toString() ?? '');
        expect(topics).toBeDefined();
        expect(topics?.has(NETWORK_TOPIC_PRIMARY)).toBeTruthy();
        const topicMessages = topics?.get(NETWORK_TOPIC_PRIMARY) ?? [];
        expect(topicMessages.length).toBe(1);
        expect(topicMessages[0]).toEqual(message);
      });
    },
    TEST_TIMEOUT_LONG
  );
});
