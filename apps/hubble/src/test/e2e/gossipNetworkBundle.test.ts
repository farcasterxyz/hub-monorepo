import { GossipNode } from "../../network/p2p/gossipNode.js";
import { sleep } from "../../utils/crypto.js";
import { Factories, GossipMessage, MessageBundle } from "@farcaster/hub-nodejs";
import { peerIdFromString } from "@libp2p/peer-id";

const NUM_NODES = 5;
const PROPAGATION_DELAY = 3 * 1000; // between 2 and 3 full heartbeat ticks

const TEST_TIMEOUT_LONG = 60 * 1000;
const TEST_TIMEOUT_SHORT = 10 * 1000;

describe("gossip network with bundle tests", () => {
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
    "broadcast a bundle message via gossip to other nodes",
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
      // Because of how the network is set up, nodes[0] is the bootstrapper and will gossip to every node. So we need to publish from a different node
      const randomNodeExcept0 = Math.floor(Math.random() * (nodes.length - 1)) + 1;
      const randomNode = nodes[randomNodeExcept0] as GossipNode;

      // Add listeners that receive new GossipMessages and push them to the MessageStore
      nodes.forEach((n) => {
        {
          n.addListener("message", async (topic, message, source, msgId) => {
            expect(message.isOk()).toBeTruthy();

            const peerId = n.peerId()?.toString() ?? "";
            const existingTopics = messageStore.get(peerId) || new Map();
            const existingMessages = existingTopics.get(topic) || [];

            const gossipMessage = message._unsafeUnwrap();
            existingMessages.push(gossipMessage);
            existingTopics.set(topic, existingMessages);
            messageStore.set(peerId, existingTopics);

            // we'll treat bundles of size 3 as valid, and everything else as invalid
            if (gossipMessage.messageBundle && gossipMessage.messageBundle.messages.length === 3) {
              n.reportValid(msgId, peerIdFromString(source.toString()).toBytes(), true);
            } else {
              n.reportValid(msgId, peerIdFromString(source.toString()).toBytes(), false);
            }
          });
          n.registerDebugListeners();
        }
      });

      const validMessages = [];
      for (let i = 0; i < 3; i++) {
        validMessages.push(await Factories.CastAddMessage.create());
      }
      const validBundle = MessageBundle.create({ hash: new Uint8Array([1, 2, 3]), messages: validMessages });

      // Above, we treat messages with 4 messages as invalid, so create one with 4 messages
      const invalidMessages = [];
      for (let i = 0; i < 4; i++) {
        invalidMessages.push(await Factories.ReactionAddMessage.create());
      }
      const invalidBundle = MessageBundle.create({ hash: new Uint8Array([4, 1, 2, 3, 4]), messages: invalidMessages });

      const validPublishResult = await randomNode.gossipBundle(validBundle);
      expect(validPublishResult.isOk()).toBeTruthy();
      expect(validPublishResult._unsafeUnwrap().recipients.length).toBeGreaterThan(0);

      // Gossiping the bundle again will fail because it is a duplicate
      const duplicatePublishResult = await randomNode.gossipBundle(validBundle);
      expect(duplicatePublishResult.isErr()).toBeTruthy();
      expect(duplicatePublishResult._unsafeUnwrapErr().errCode).toBe("bad_request.duplicate");

      // Gossiping an invalid bundle will succeed, beacuse the broadcast will succeed but each individual node
      // will report it as invalid, and it will not spread through the network
      const invalidPublishResult = await randomNode.gossipBundle(invalidBundle);
      expect(invalidPublishResult.isOk()).toBeTruthy();
      expect(invalidPublishResult._unsafeUnwrap().recipients.length).toBeGreaterThan(0);

      // Sleep 5 heartbeat ticks
      await sleep(PROPAGATION_DELAY);

      // Assert that every node except the sender has pushed the message into its MessageStore
      const nonSenderNodes = nodes.filter((n) => n.peerId()?.toString() !== randomNode.peerId()?.toString());

      let numInvalidBundles = 0;
      let numValidBundles = 0;

      nonSenderNodes.map((n) => {
        const peerId = n.peerId();
        if (!peerId) {
          throw new Error(`peerId is undefined for node: ${n}`);
        }
        const topics = messageStore.get(peerId.toString());
        expect(topics).toBeDefined();
        expect(topics?.has(primaryTopic)).toBeTruthy();
        const topicMessages = topics?.get(primaryTopic) ?? [];
        let validBundle: MessageBundle | undefined;
        let invalidBundle: MessageBundle | undefined;
        expect(topicMessages.length).toBeGreaterThan(0);
        for (const msg of topicMessages) {
          if (msg.messageBundle && msg.messageBundle.messages.length !== 3) {
            invalidBundle = msg.messageBundle;
            numInvalidBundles++;
          } else {
            validBundle = msg.messageBundle;
            numValidBundles++;
          }
        }
        // Cast add message must always be present, but it's ok for the reaction add message to be missing sometimes
        expect(validBundle).toBeDefined();
      });

      expect(numValidBundles).toBe(NUM_NODES - 1);
      // Reaction messages are not forwarded to all nodes because they are considered invalid. They stop after the first node.
      // This is a test that asyncValidation is working as expected.
      expect(numInvalidBundles).toBe(1);

      messageStore.clear();
    },
    TEST_TIMEOUT_LONG,
  );
});
