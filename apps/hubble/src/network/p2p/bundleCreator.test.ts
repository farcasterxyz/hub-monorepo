import { Message } from "@farcaster/hub-nodejs";
import { BundleCreator } from "./bundleCreator.js";
import { LibP2PNode } from "./gossipNodeWorker.js";
import { ok } from "neverthrow";

class MockLibp2pNode {
  bundleGossipPercent = 0;
  broadcastedMessages: Message[] = [];

  getBundleGossipPercent() {
    return this.bundleGossipPercent;
  }

  async broadcastMessage(message: Message) {
    this.broadcastedMessages.push(message);
    return ok({ recipients: [] });
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

    // Sending gossip messages should immediately broadcast them
    const message = {} as Message;
    const result = await bundleCreator.gossipMessage(message);
    expect(result.bundled).toBe(false);
    expect(result.publishResults).toBeDefined();
    expect(libp2pNode.broadcastedMessages).toEqual([message]);
  });
});
