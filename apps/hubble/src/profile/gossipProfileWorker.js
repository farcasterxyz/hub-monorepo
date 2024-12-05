import { parentPort, threadId } from "worker_threads";
import { ProfileWorkerAction } from "./gossipProfile.js";
import { Factories } from "@farcaster/hub-nodejs";
import { GossipNode } from "../network/p2p/gossipNode.js";
import { multiaddr } from "@multiformats/multiaddr";
// Wait for messages from the parent
parentPort?.on("message", (data) => {
  (async () => {
    const { id, action, args } = data;
    if (action === ProfileWorkerAction.Start) {
      await start();
      parentPort?.postMessage({ id, action });
    } else if (action === ProfileWorkerAction.SendMessage) {
      await sendMessage();
      parentPort?.postMessage({ id, action });
    } else if (action === ProfileWorkerAction.WaitForMessages) {
      const { count, timeout } = args;
      await Promise.all(nodes.map((node) => node.waitForMessages(count, timeout)));
      parentPort?.postMessage({ id, action });
    } else if (action === ProfileWorkerAction.Stop) {
      await Promise.all(nodes.map((node) => node.stop()));
      // Collect the data from the nodes
      const datas = nodes.map((node) => node.getData());
      const peerIds = nodes.map((node) => node.gossipNode.peerId?.toString());
      parentPort?.postMessage({ id, action, response: { peerIds, datas } });
    } else if (action === ProfileWorkerAction.GetMultiAddres) {
      const response = getMultiAddrs();
      parentPort?.postMessage({ id, action, response });
    } else if (action === ProfileWorkerAction.ConnectToMutliAddr) {
      const { multiAddr } = args;
      connectToMultiAddr(multiAddr);
      parentPort?.postMessage({ id, action });
    } else if (action === ProfileWorkerAction.ReportPeers) {
      for (const node of nodes) {
        const allPeers = node.gossipNode.allPeerIds();
        console.log(`Node ${node.gossipNode.peerId?.toString()} has ${allPeers.length} peers`);
        console.log(allPeers);
        node.gossipNode.gossip?.subscribe(node.gossipNode.primaryTopic());
        const a = node.gossipNode.gossip?.getTopics();
        console.log("------TOPICS---", a);
      }
      parentPort?.postMessage({ id, action });
    }
  })();
});
let messageIdCounter = threadId * 1000000;
const nodes = [];
const numNodes = 7;
async function start() {
  for (let i = 0; i < numNodes; i++) {
    const node = new GossipTestNode();
    await node.start();
    nodes.push(node);
    if (i >= 1) {
      // Connect to the first node
      // await (nodes[0] as GossipTestNode).gossipNode.connect(node.gossipNode);
      // Connect to upto 2 nodes that came before us
      const numConnections = 2;
      for (let j = 0; j < numConnections; j++) {
        const randomNodeNum = Math.floor(Math.random() * i);
        if (randomNodeNum !== i) {
          const randomNode = nodes[randomNodeNum];
          await randomNode.gossipNode.connect(node.gossipNode);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  }
  // Wait for the nodes to connect
  await Promise.all(nodes.map((node) => node.waitForConnection()));
}
function getMultiAddrs() {
  const peerIds = nodes.map((node) => node.gossipNode.peerId?.toString() ?? "unknown");
  const multiAddrs = nodes
    .map((node) => node.gossipNode.multiaddrs)
    .map((addrs) => addrs?.map((addr) => addr.toString())[0] ?? "");
  return { peerIds, multiAddrs };
}
async function connectToMultiAddr(multiAddrs) {
  // We'll connect the ith node to the ith multiaddr
  for (let i = 0; i < multiAddrs.length; i++) {
    const node = nodes[i];
    const multiAddr = multiAddrs[i];
    if (multiAddr) {
      const r = await node.gossipNode.connectAddress(multiaddr(multiAddr));
      console.log("Connected to:", multiAddr, "-", r);
      // Wait for the node to connect
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
async function sendMessage() {
  // Send a message from a random node
  const nodeNum = Math.floor(Math.random() * nodes.length);
  const node = nodes[nodeNum];
  await node.sendMessage();
}
async function getMessage() {
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
  gossipNode;
  connectedPeers = 0;
  sentMessages = 0;
  recievedMessages = new Map(); // Id -> timestamp
  constructor() {
    this.gossipNode = new GossipNode();
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
  async waitForMessages(numMessages, timeout) {
    await new Promise((resolve) => {
      const timeoutFn = setTimeout(resolve, timeout);
      const interval = setInterval(() => {
        // console.log("Received messages", this.receivedMessages.size, "/", numMessages);
        if (this.receivedMessages.size >= numMessages) {
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
    console.log("Sent message:", counter, "-", r);
    // When sending a message, we add it to our own stats, since technically we also have received
    // the message
    this.sentMessages++;
  }
  getData() {
    const delays = Array.from(this.receivedMessages.values());
    const sentMessages = this.sentMessages;
    const count = delays.length;
    const median = delays[Math.floor(count / 2)] ?? NaN;
    const p95 = delays[Math.floor(count * 0.95)] ?? NaN;
    return [sentMessages, count, median, p95];
  }
  registerListeners() {
    // Register the handlers
    this.gossipNode.gossip?.subscribe(this.gossipNode.primaryTopic());
    this.gossipNode.on("message", async (_topic, message) => {
      const castData = message._unsafeUnwrap().message?.data?.castAddBody;
      const split = castData?.text.split(":");
      const id = parseInt(split?.[0] ?? "-1");
      const delay = Date.now() - parseInt(split?.[1] ?? "-1");
      this.receivedMessages.set(id, delay);
      console.log("Received message ", id, " - ", delay);
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
//# sourceMappingURL=gossipProfileWorker.js.map
