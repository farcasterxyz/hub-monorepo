import { exit } from 'process';
import Client from '~/client';
import Debugger from '~/debug';
import FCNode, { InstanceName } from '~/node';
import { isCast, isRoot } from '~/types';

// 1. Create 5 Farcaster nodes
const nodeList = new Map<InstanceName, FCNode>();

for (const name of FCNode.instanceNames) {
  nodeList.set(name, new FCNode(name));
}

Debugger.init(nodeList);

// 2. Connect each node to their peers
for (const node of nodeList.values()) {
  node.setPeers(nodeList);
}

// 3. Get a connection to a single node
const knightNode = nodeList.get('Knight');
if (!knightNode) {
  console.log('The knight was not found!');
  exit();
}

// 4. Set up a Client
const client = new Client('alice');

// 5. Send two messages, sequentially to the node.
const m1 = client.generateRoot(0, '0x0');
knightNode.addRoot(m1);

let lastMsg = knightNode.getLastMessage(client.username);
if (lastMsg) {
  if (isCast(lastMsg) || isRoot(lastMsg)) {
    const m2 = client.generateCast('Hello, world!', lastMsg);
    knightNode.addCast(m2);
  }
}

Debugger.printState();

// 6. Send multiple messages to the node.
console.log('Client: adding two message into the chain');
lastMsg = knightNode.getLastMessage(client.username);
if (lastMsg) {
  if (isCast(lastMsg) || isRoot(lastMsg)) {
    const m3 = client.generateCast("I'm a cast!", lastMsg);
    const m4 = client.generateCast('On another chain!', m3);
    const chain = [m3, m4];
    knightNode.addChain(chain);
  }
}

Debugger.printState();

// 7. Start another chain and send it to the node.
console.log('Client: starting a new chain');
const b1 = client.generateRoot(1, '0x0');
knightNode.addRoot(b1);

Debugger.printState();

// 8. Start syncing all nodes at random intervals.
for (const node of nodeList.values()) {
  node.sync();
}

setInterval(() => {
  Debugger.printState();
}, 5_000);
