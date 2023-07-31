import {
  AdminRpcClient,
  Factories,
  FarcasterNetwork,
  HubResult,
  HubRpcClient,
  Message,
  Metadata,
  getAdminRpcClient,
  getAuthMetadata,
  getFarcasterTime,
  getInsecureHubRpcClient,
  getSSLHubRpcClient,
} from "@farcaster/hub-nodejs";
import { formatNumber, prettyPrintTable } from "./profile.js";
import { ADMIN_SERVER_PORT } from "../rpc/adminServer.js";
import RocksDB from "../storage/db/rocksdb.js";
import { GossipNode } from "../network/p2p/gossipNode.js";

let messageIdCounter = 0;

async function getMessage(): Promise<{ msg: Message; counter: number }> {
  const fid = 1;
  const network = 1;

  const now = Date.now().toString();
  const counter = messageIdCounter;
  const text = `${counter}:${now}`;

  const msg = await Factories.CastAddMessage.create({ data: { fid, network, castAddBody: { text } } });

  messageIdCounter++;
  return { msg, counter };
}

class GossipTestNode {
  gossipNode: GossipNode;
  connectedPeers = 0;
  recievedMessages = new Map<number, number>(); // Id -> timestamp

  constructor() {
    this.gossipNode = new GossipNode({} as RocksDB);
  }

  async start() {
    await this.gossipNode.start([]);

    this.registerListeners();
  }

  async stop() {
    await this.gossipNode.stop();
  }

  async waitForConnection() {
    await new Promise((resolve) => {
      const interval = setInterval(async () => {
        if (this.connectedPeers > 0) {
          clearInterval(interval);

          // Wait 100ms for the connection to be fully established
          setTimeout(resolve, 1000);
        }
      }, 100);
    });
  }

  async waitForMessages(numMessages: number, timeout: number) {
    await new Promise((resolve) => {
      const timeoutFn = setTimeout(resolve, timeout);

      const interval = setInterval(() => {
        // console.log("Recieved messages", this.recievedMessages.size, "/", numMessages);

        if (this.recievedMessages.size >= numMessages) {
          clearInterval(interval);
          clearTimeout(timeoutFn);

          // Wait 100ms for the connection to be fully established
          setTimeout(resolve, 1000);
        }
      }, 100);
    });
  }

  async sendMessage() {
    const { msg, counter } = await getMessage();

    // Send a message from the first node
    const r = await this.gossipNode.gossipMessage(msg);
    // console.log("Sent message", r);

    // When sending a message, we add it to our own stats, since technically we also have recieved
    // the message
    // this.recievedMessages.set(counter, 0);
  }

  registerListeners() {
    // Register the handlers
    this.gossipNode.gossip?.subscribe(this.gossipNode.primaryTopic());
    this.gossipNode.on("message", async (_topic, message) => {
      const castData = message._unsafeUnwrap().message?.data?.castAddBody;
      const split = castData?.text.split(":");

      const id = parseInt(split?.[0] ?? "-1");
      const delay = Date.now() - parseInt(split?.[1] ?? "-1");

      this.recievedMessages.set(id, delay);
      // console.log("Received message ", id, " - ", delay);
    });

    this.gossipNode.on("peerConnect", (peer) => {
      // console.log("Peer connected", peer);
      this.connectedPeers++;
    });

    this.gossipNode.on("peerDisconnect", (peer) => {
      // console.log("Peer disconnected", peer);
      this.connectedPeers--;
    });
  }
}

export async function profileGossipServer() {
  // Setup 2 gossip nodes
  const numNodes = 30;

  const nodes = [];
  for (let i = 0; i < numNodes; i++) {
    const node = new GossipTestNode();
    await node.start();
    nodes.push(node);

    if (i >= 1) {
      // Connect to the first node
      await (nodes[0] as GossipTestNode).gossipNode.connect(node.gossipNode);

      // Connect to upto 5 nodes that came before us
      const numConnections = Math.min(5, i);
      for (let j = 0; j < numConnections; j++) {
        const randomNode = nodes[Math.floor(Math.random() * i)] as GossipTestNode;
        await randomNode.gossipNode.connect(node.gossipNode);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      // Wait 100ms for the connection to be fully established
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Wait for the nodes to connect
  await Promise.all(nodes.map((node) => node.waitForConnection()));
  console.log("All nodes connected");

  // Send 10 messages, each from a random node
  const count = 50;
  for (let i = 0; i < count; i++) {
    const nodeNum = Math.floor(Math.random() * nodes.length);
    console.log("Sending via node", nodeNum);
    const node = nodes[nodeNum] as GossipTestNode;
    await node.sendMessage();

    // Wait 100ms between each message
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  // Wait for the message to be received
  await Promise.all(nodes.map((node) => node.waitForMessages(count, 10 * 1000)));

  // Stop the nodes
  for (const node of nodes) {
    await node.stop();
  }

  const output = prettyPrintTable(computeStats(nodes));
  console.log(output);
}

function computeStats(gossipNodes: GossipTestNode[]): string[][] {
  const data = [];

  // Headings
  const headings = ["Node", "Count", "Median", "p95"];
  data.push(headings);

  // Go over all the nodes and compute the stats
  for (const node of gossipNodes) {
    const delays = Array.from(node.recievedMessages.values());

    const count = delays.length;
    const median = delays[Math.floor(delays.length / 2)];
    const p95 = delays[Math.floor(delays.length * 0.95)];

    const row = [
      (node.gossipNode.peerId?.toString() ?? "").substring(30),
      formatNumber(count),
      formatNumber(median),
      formatNumber(p95),
    ];
    data.push(row);
  }

  return data;
}
