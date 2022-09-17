import { Factories } from '~/factories';
import { Node } from '~/network/node';
import { sleep } from '~/utils';
import { GossipMessage } from '~/network/protocol';

const NUM_NODES = 10;

let nodes: Node[];
// map peerId -> topics -> Messages per topic
let messages: Map<string, Map<string, GossipMessage[] | undefined>>;

/** Create a sequence of connections between all the nodes */
const connectAll = async (nodes: Node[]) => {
  const connectionResults = await Promise.all(
    nodes.slice(1).map((n) => {
      return n.connect(nodes[0]);
    })
  );
  connectionResults.forEach((r) => {
    if (r) {
      expect(r.isOk()).toBeTruthy();
    }
  });

  // subscribe every node to the test topic
  nodes.forEach((n) => n.gossip?.subscribe('testTopic'));
  // sleep 5 heartbeats to let the gossipsub network form
  await sleep(5_000);
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

describe('gossip network', () => {
  beforeAll(async () => {
    nodes = [...Array(NUM_NODES)].map(() => new Node());
    messages = new Map();
  });

  beforeEach(async () => {
    messages.clear();
    await Promise.all(nodes.map((node) => node.start()));
  });

  afterEach(async () => {
    await Promise.all(nodes.map((node) => node.stop()));
  });

  test(
    'constructs a Gossip network and ensures all nodes are connected',
    async () => {
      await connectAll(nodes);
      nodes.forEach((n) => expect(n.gossip?.getPeers().length).toBeGreaterThanOrEqual(1));
    },
    10 * 1000
  );

  test(
    'sends a message to a gossip network',
    async () => {
      await connectAll(nodes);
      trackMessages();

      // create a message and send it to a random node.
      const message = {
        content: { message: await Factories.CastShort.create(), root: '', count: 0 },
        topics: ['testTopic'],
      };

      // publish via some random node
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      expect(randomNode.publish(message)).resolves.toBeUndefined();
      // sleep 5 heartbeat ticks
      await sleep(5_000);

      // check that every node has the message
      nodes.forEach((n) => {
        // the sender won't have this message
        if (n.peerId?.toString() === randomNode.peerId?.toString()) return;

        const topics = messages.get(n.peerId?.toString() ?? '');
        expect(topics).toBeDefined();
        expect(topics?.has('testTopic')).toBeTruthy();
        const topicMessages = topics?.get('testTopic') ?? [];
        expect(topicMessages.length).toBe(1);
        expect(topicMessages[0]).toEqual(message);
      });
    },
    // 30s timeout for this should be plenty
    30 * 1000
  );
});
