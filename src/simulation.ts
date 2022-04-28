import { exit } from 'process';
import Client from '~/client';
import Debugger from '~/debugger';
import FCNode, { InstanceName } from '~/node';
import Faker from 'faker';

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

Debugger.printState();

// 4. Set up a Client to generate messages
const client = new Client('alice');

const signerChange = {
  blockNumber: 99,
  blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
  logIndex: 0,
  address: client.address,
};
// In this step, we'd make each node listen to the registry for username registrations
// and signer changes. For now, we take a shortcut and just tell the engine that a
// registration has occured for alice.
console.log(`Farcaster Registry: @alice was registered by ${client.address}`);
for (const node of nodeList.values()) {
  node.engine.addSignerChange('alice', signerChange);
}

// 5. Send two messages, sequentially to the node.
console.log('FCClient: @alice is broadcasting a new root');
const root1 = client.makeRoot(signerChange.blockNumber, signerChange.blockHash);
knightNode.addRoot(root1);

console.log('FCClient: @alice is casting a message');
const cs1 = client.makeCastShort('Hello, world!', root1);
knightNode.addCast(cs1);

// 6. Send multiple messages to the node.
console.log('FCClient: @alice is casting two messages');
const cs2 = client.makeCastShort('One pack of cookies please', root1);
knightNode.addCast(cs2);
const cs3 = client.makeCastShort('Another one!', root1);
knightNode.addCast(cs3);

// 7. Start syncing all nodes at random intervals.
for (const node of nodeList.values()) {
  node.sync();
}

setInterval(() => {
  Debugger.printState();
}, 5_000);

// 8. @alice deletes a cast
setTimeout(() => {
  console.log('FCClient: @alice is deleting a cast');
  const cd1 = client.makeCastDelete(cs2, root1);
  knightNode.addCast(cd1);
}, 30_000);

// 9. @alice changes her address and issues a new root.
setTimeout(() => {
  console.log('FCClient: @alice is changing signers');
  const client2 = new Client('alice');

  const signerChange = {
    blockNumber: 100,
    blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
    logIndex: 0,
    address: client2.address,
  };

  for (const node of nodeList.values()) {
    node.engine.addSignerChange('alice', signerChange);
  }

  console.log('FCClient: @alice is starting a new chain');
  const b1 = client2.makeRoot(signerChange.blockNumber, signerChange.blockHash);
  knightNode.addRoot(b1);
}, 60_000);
