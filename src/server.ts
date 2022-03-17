import FarcasterNode, { InstanceName } from '~/farcasterNode';

// 1. Create Farcaster Node instances and assign them into the Node Registry.
const nodeRegistry = new Map<InstanceName, FarcasterNode>();

for (const name of FarcasterNode.instanceNames) {
  nodeRegistry.set(name, new FarcasterNode(name));
}

// 2. Give each Node instance a reference to the Registry so they can reach other nodes,
// and make them ping each other at randomized intervals.
for (const node of nodeRegistry.values()) {
  node.setPeers(nodeRegistry);
  setInterval(() => {
    node.pingAll();
  }, Math.floor(Math.random() * 30_000));
}
