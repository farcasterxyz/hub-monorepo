import { GossipNode, GossipNodeConfig } from "../../network/p2p/gossipNode.js";
import { sleep } from "../../utils/crypto.js";
import {
  Factories,
  FarcasterNetwork,
  GossipMessage,
  isReactionAddMessage,
  Message,
  MessageData,
} from "@farcaster/hub-nodejs";
import { peerIdFromString } from "@libp2p/peer-id";

const NUM_NODES = 10;
const PROPAGATION_DELAY = 3 * 1000; // between 2 and 3 full heartbeat ticks

const TEST_TIMEOUT_LONG = 60 * 1000;
const TEST_TIMEOUT_SHORT = 10 * 1000;
const gossipNodeConfig: GossipNodeConfig = {
  network: FarcasterNetwork.DEVNET,
};

describe("gossip network tests", () => {
  /**
   * MessageStore keeps track of every message in every topic received by a peer. It maps the
   * peerId -> topic -> GossipMessage[]
   */
  let messageStore: Map<string, Map<string, GossipMessage[] | undefined>>;
  let nodes: GossipNode[];

  beforeAll(async () => {
    nodes = [...Array(NUM_NODES)].map(() => new GossipNode(gossipNodeConfig));
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

            // we'll treat reaction add messages as invalid and everything else as valid
            if (gossipMessage.message && !isReactionAddMessage(gossipMessage.message)) {
              n.reportValid(msgId, peerIdFromString(source.toString()).toBytes(), true);
            } else {
              n.reportValid(msgId, peerIdFromString(source.toString()).toBytes(), false);
            }
          });
          n.registerDebugListeners();
        }
      });

      // Create a message and send it to a random node
      const validMessage = await Factories.CastAddMessage.create({
        data: { network: gossipNodeConfig.network ?? FarcasterNetwork.DEVNET },
      });
      const invalidMessage = await Factories.ReactionAddMessage.create({
        data: { network: gossipNodeConfig.network ?? FarcasterNetwork.DEVNET },
      });
      const validPublishResult = await randomNode.gossipMessage(validMessage);
      expect(validPublishResult._unsafeUnwrapErr).toThrow();
      expect(validPublishResult.isOk()).toBeTruthy();
      expect(validPublishResult._unsafeUnwrap().recipients.length).toBeGreaterThan(0);
      const invalidPublishResult = await randomNode.gossipMessage(invalidMessage);
      expect(invalidPublishResult.isOk()).toBeTruthy();
      expect(invalidPublishResult._unsafeUnwrap().recipients.length).toBeGreaterThan(0);

      // Sleep 5 heartbeat ticks
      await sleep(PROPAGATION_DELAY);

      // Assert that every node except the sender has pushed the message into its MessageStore
      const nonSenderNodes = nodes.filter((n) => n.peerId()?.toString() !== randomNode.peerId()?.toString());

      let numReactionAddMessages = 0;
      let numCastAddMessages = 0;

      nonSenderNodes.map((n) => {
        const peerId = n.peerId();
        if (!peerId) {
          throw new Error(`peerId is undefined for node: ${n}`);
        }
        const topics = messageStore.get(peerId.toString());
        expect(topics).toBeDefined();
        expect(topics?.has(primaryTopic)).toBeTruthy();
        const topicMessages = topics?.get(primaryTopic) ?? [];
        let castAddMessage: Message | undefined;
        let reactionAddMessage: Message | undefined;
        expect(topicMessages.length).toBeGreaterThan(0);
        for (const msg of topicMessages) {
          if (msg.message && isReactionAddMessage(msg.message)) {
            reactionAddMessage = msg.message;
            numReactionAddMessages++;
          } else {
            castAddMessage = msg.message;
            numCastAddMessages++;
          }
        }
        // Cast add message must always be present, but it's ok for the reaction add message to be missing sometimes
        expect(castAddMessage).toBeDefined();
        expect(castAddMessage?.data?.network).toBe(gossipNodeConfig.network);
      });

      expect(numCastAddMessages).toBe(NUM_NODES - 1);
      // Reaction messages are not forwarded to all nodes because they are considered invalid. They stop after the first node.
      // This is a test that asyncValidation is working as expected.
      expect(numReactionAddMessages).toBe(1);

      messageStore.clear();

      // Make sure a message with data_bytes is also received
      const messageWithDataBytes = await Factories.Message.create({ data: { castAddBody: { text: "data" } } });
      messageWithDataBytes.dataBytes = MessageData.encode(messageWithDataBytes.data as MessageData).finish();
      messageWithDataBytes.data = undefined;
      const publishResultWithDataBytes = await randomNode.gossipMessage(messageWithDataBytes);
      expect(publishResultWithDataBytes.isOk()).toBeTruthy();
      expect(publishResultWithDataBytes._unsafeUnwrap().recipients.length).toBeGreaterThan(0);

      // Sleep 5 heartbeat ticks
      await sleep(PROPAGATION_DELAY);

      // Assert that every node except the sender has pushed the message into its MessageStore

      nonSenderNodes.map((n) => {
        const topics = messageStore.get(n.peerId()?.toString() ?? "");
        expect(topics).toBeDefined();
        expect(topics?.has(primaryTopic)).toBeTruthy();
        const topicMessages = topics?.get(primaryTopic) ?? [];
        expect(topicMessages.length).toBe(1);
        expect((topicMessages[0] as GossipMessage).message).toEqual(messageWithDataBytes);
      });
    },
    TEST_TIMEOUT_LONG,
  );
});
