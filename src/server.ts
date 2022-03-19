import { exit } from 'process';
import Client from '~/client';
import FCNode, { InstanceName } from '~/node';
import { isCast, isRoot } from '~/types';

// Create 5 Nodes and add them to our NodeList
const nodeList = new Map<InstanceName, FCNode>();

for (const name of FCNode.instanceNames) {
  nodeList.set(name, new FCNode(name));
}

// Give each node the NodeList and make them ping all their peers at regular intervals.
for (const node of nodeList.values()) {
  node.setPeers(nodeList);
  setInterval(() => {
    node.pingAll();
  }, Math.floor(Math.random() * 30_000));
}

// Get a connection to an existing node and set up a client to generate messages.
const knightNode = nodeList.get('Knight');
if (!knightNode) {
  console.log('The knight was not found!');
  exit();
}

const client = new Client('alice');

// Generate a new root message, a cast and a few more casts and send them to the knoght.
const m1 = client.generateRoot(0, '0x0');
knightNode.addRoot(m1);

let lastMsg = knightNode.getLastMessage(client.username);
if (lastMsg) {
  if (isCast(lastMsg) || isRoot(lastMsg)) {
    const m2 = client.generateCast('Hello, world!', lastMsg);
    knightNode.addCast(m2);
  }
}

lastMsg = knightNode.getLastMessage(client.username);
if (lastMsg) {
  if (isCast(lastMsg) || isRoot(lastMsg)) {
    const m3 = client.generateCast("I'm a cast!", lastMsg);
    const m4 = client.generateCast('On another chain!', m3);
    const chain = [m3, m4];
    knightNode.addChain(chain);
  }
}

// Check if all the messages settled correctly on the knight.
let currentChain = knightNode.getChain(client.username);
console.log(currentChain);

// Start a new chain and send it to the knight.
const b1 = client.generateRoot(1, '0x0');
knightNode.addRoot(b1);

// Check that the old chain was fully replaced by the new one.
currentChain = knightNode.getChain(client.username);
console.log(currentChain);
