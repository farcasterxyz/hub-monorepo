import { GossipNode } from "../../network/p2p/gossipNode.js";
import { sleep } from "../../utils/crypto.js";
import { Factories, GossipMessage } from "@farcaster/hub-nodejs";

const NUM_NODES = 10;
const PROPAGATION_DELAY = 3 * 1000; // between 2 and 3 full heartbeat ticks

const TEST_TIMEOUT_LONG = 60 * 1000;
const TEST_TIMEOUT_SHORT = 10 * 1000;

describe("gossip network tests", () => {
  /**
   * MessageStore keeps track of every message in every topic received by a peer. It maps the
   * peerId -> topic -> GossipMessage[]
   */
  let messageStore: Map<string, Map<string, GossipMessage[] | undefined>>;
  let nodes: GossipNode[];

  beforeAll(async () => {
    nodes = [...Array(NUM_NODES)].map(() => new GossipNode());
    messageStore = new Map();
  });

  beforeEach(async () => {
    messageStore.clear();
    await Promise.all(nodes.map((node) => node.start([])));
  }, TEST_TIMEOUT_LONG);

  afterEach(async () => {
    await Promise.all(nodes.map((node) => node.stop()));
  }, TEST_TIMEOUT_SHORT);

  test(
    "broadcast a message via gossip to other nodes",
    async () => {
      // Connect the first node to every other node by dialing them manually
      for (const n of nodes.slice(1)) {
        // sleep to stay under the rate limit of 5 connections per second
        await sleep(200);
        const result = await n.connect(nodes[0] as GossipNode);
        expect(result.isOk()).toBeTruthy();
      }
      // biome-ignore lint/style/noNonNullAssertion: legacy code, avoid using ignore for new code
      const primaryTopic = nodes[0]!.primaryTopic();
      // Subscribe each node to the test topic
      await Promise.all(nodes.map(async (n) => await n.subscribe(primaryTopic)));

      // Sleep 5 heartbeats to let the gossipsub network form
      await sleep(PROPAGATION_DELAY);

      await Promise.all(nodes.map(async (n) => expect((await n.allPeerIds()).length).toBeGreaterThanOrEqual(1)));

      // Add listeners that receive new GossipMessages and push them to the MessageStore
      nodes.forEach((n) => {
        {
          n.addListener("message", async (topic, message) => {
            expect(message.isOk()).toBeTruthy();

            const peerId = n.peerId()?.toString() ?? "";
            const existingTopics = messageStore.get(peerId) || new Map();
            const existingMessages = existingTopics.get(topic) || [];

            existingMessages.push(message._unsafeUnwrap());
            existingTopics.set(topic, existingMessages);
            messageStore.set(peerId, existingTopics);
          });
          n.registerDebugListeners();
        }
      });

      // Create a message and send it to a random node
      const message = Factories.Message.build();
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)] as GossipNode;
      const publishResult = await randomNode.gossipMessage(message);
      expect(publishResult.isOk()).toBeTruthy();
      expect(publishResult._unsafeUnwrap().recipients.length).toBeGreaterThan(0);

      // Sleep 5 heartbeat ticks
      await sleep(PROPAGATION_DELAY);

      // Assert that every node except the sender has pushed the message into its MessageStore
      const nonSenderNodes = nodes.filter((n) => n.peerId()?.toString() !== randomNode.peerId()?.toString());

      nonSenderNodes.map((n) => {
        const topics = messageStore.get(n.peerId()?.toString() ?? "");
        expect(topics).toBeDefined();
        expect(topics?.has(primaryTopic)).toBeTruthy();
        const topicMessages = topics?.get(primaryTopic) ?? [];
        expect(topicMessages.length).toBe(1);
        expect((topicMessages[0] as GossipMessage).message).toEqual(message);
      });
    },
    TEST_TIMEOUT_LONG,
  );
});
