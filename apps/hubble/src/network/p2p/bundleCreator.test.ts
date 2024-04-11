import { Message, MessageBundle } from "@farcaster/hub-nodejs";
import { BundleCreator } from "./bundleCreator.js";
import { LibP2PNode } from "./gossipNodeWorker.js";
import { ok } from "neverthrow";
import { sleep } from "../../utils/crypto.js";

class MockLibp2pNode {
  bundleGossipPercent = 0;
  broadcastedMessages: Message[] = [];
  broadcastedBundles: MessageBundle[] = [];

  getBundleGossipPercent() {
    return this.bundleGossipPercent;
  }

  async broadcastMessage(message: Message) {
    this.broadcastedMessages.push(message);
    return ok({ recipients: [] });
  }

  async broadcastBundle(bundle: MessageBundle) {
    this.broadcastedBundles.push(bundle);
  }
}

describe("Test bundle creation", () => {
  let libp2pNode: MockLibp2pNode;

  beforeEach(() => {
    libp2pNode = new MockLibp2pNode();
  });

  test("Not bundled if bundleGossipPercent is 0", async () => {
    const bundleCreator = new BundleCreator(libp2pNode as unknown as LibP2PNode);
    libp2pNode.bundleGossipPercent = 0;
    bundleCreator.updateIfBundling();

    // Sending gossip messages should immediately broadcast them
    const message = {} as Message;
    const result = await bundleCreator.gossipMessage(message);
    expect(result.bundled).toBe(false);
    expect(result.publishResults).toBeDefined();
    expect(libp2pNode.broadcastedMessages).toEqual([message]);
  });

  test("Bundled if bundleGossipPercent is 1", async () => {
    const bundleCreator = new BundleCreator(libp2pNode as unknown as LibP2PNode, 100, 60 * 1000);
    libp2pNode.bundleGossipPercent = 1;
    bundleCreator.updateIfBundling();

    // Sending gossip messages should bundle them
    const message = {} as Message;
    const result = await bundleCreator.gossipMessage(message);
    expect(result.bundled).toBe(true);
    expect(result.publishResults).toBeUndefined();
    expect(libp2pNode.broadcastedMessages).toEqual([]);

    // Another should still be bundled
    const message2 = {} as Message;
    const result2 = await bundleCreator.gossipMessage(message2);
    expect(result2.bundled).toBe(true);

    // Now broadcast the bundle
    await bundleCreator.broadcastBundle();

    expect(libp2pNode.broadcastedBundles.length).toBe(1);
    expect(libp2pNode.broadcastedBundles[0]?.messages.length).toBe(2);
    expect(libp2pNode.broadcastedMessages.length).toBe(0);
  });

  test("Bundle by time", async () => {
    const timeoutMs = 10;
    const bundleCreator = new BundleCreator(libp2pNode as unknown as LibP2PNode, 100, timeoutMs);
    libp2pNode.bundleGossipPercent = 1;
    bundleCreator.updateIfBundling();

    // Sending gossip messages should bundle them
    const message = {} as Message;
    const result = await bundleCreator.gossipMessage(message);
    expect(result.bundled).toBe(true);
    expect(result.publishResults).toBeUndefined();
    expect(libp2pNode.broadcastedMessages).toEqual([]);

    // Wait for the timeout to trigger.
    await sleep(2 * timeoutMs);

    // Now the bundle should have been broadcast

    expect(libp2pNode.broadcastedBundles.length).toBe(1);
    expect(libp2pNode.broadcastedBundles[0]?.messages.length).toBe(1);
    expect(libp2pNode.broadcastedMessages.length).toBe(0);
  });

  test("Bundle by size", async () => {
    const maxBundleSize = 2;
    const bundleCreator = new BundleCreator(libp2pNode as unknown as LibP2PNode, maxBundleSize, 60 * 1000);
    libp2pNode.bundleGossipPercent = 1;
    bundleCreator.updateIfBundling();

    // Sending gossip messages should bundle them
    const message = {} as Message;
    const result = await bundleCreator.gossipMessage(message);
    expect(result.bundled).toBe(true);
    expect(result.publishResults).toBeUndefined();
    expect(libp2pNode.broadcastedMessages).toEqual([]);

    // Another should still be bundled, but since it is now at the max bundle size, it should
    // be broadcast
    const message2 = {} as Message;
    const result2 = await bundleCreator.gossipMessage(message2);
    expect(result2.bundled).toBe(true);

    expect(libp2pNode.broadcastedBundles.length).toBe(1);
    expect(libp2pNode.broadcastedBundles[0]?.messages.length).toBe(2);
    expect(libp2pNode.broadcastedMessages.length).toBe(0);
  });

  test("Bundle by random chance", async () => {
    const bundleCreator = new BundleCreator(libp2pNode as unknown as LibP2PNode, 100, 60 * 1000);

    // Send 100 messages, half should be bundled
    let bundled = 0;
    for (let i = 0; i < 100; i++) {
      libp2pNode.bundleGossipPercent = 0.5;
      bundleCreator.updateIfBundling();

      const message = {} as Message;
      const result = await bundleCreator.gossipMessage(message);
      if (result.bundled) {
        bundled++;
        expect(result.publishResults).toBeUndefined();
      } else {
        expect(result.publishResults).toBeDefined();
      }
    }
    expect(bundled).toBeGreaterThan(10);
    expect(bundled).toBeLessThan(90);

    await bundleCreator.broadcastBundle();

    // And all the messages should have been broadcast
    const totalBundled = libp2pNode.broadcastedBundles.map((b) => b.messages.length).reduce((a, b) => a + b, 0);
    const totalMessages = libp2pNode.broadcastedMessages.length;
    expect(totalBundled + totalMessages).toBe(100);
  });
});
