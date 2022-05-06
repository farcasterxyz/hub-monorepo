import Client from '~/client';
import Debugger from '~/debugger';
import Faker from 'faker';
import Simulator from '~/simulator';

const duration = 30_000;
const name = 'SplitBrainAltSimulator';

/**
 * SplitBrainAlt Simulator
 *
 * Nodes are partitioned into two groups, and clients send messages alternately to each group. After a prescribed period of time, the
 * partition is healed.
 */
class SplitBrainAltSimulator extends Simulator {
  constructor() {
    super(name, duration);
  }

  async runBlockchain() {
    const intervalId = setInterval(() => {
      this.stepBlockForward();
      Debugger.printNewBlock(this.blockNumber, this.blockHash);
    }, 10_000);

    setTimeout(() => {
      clearInterval(intervalId);
    }, this.duration);
  }

  async runNodes() {
    Debugger.printNodes(this.nodes);

    // Split the nodes into two partitions - (cook, friar) (knight, miller, squire)
    const nodes = Array.from(this.nodes.entries());
    const nodeGroupA = new Map(nodes.slice(0, 2));
    const nodeGroupB = new Map(nodes.slice(2, nodes.length));
    const nodeGroups = [nodeGroupA, nodeGroupB];

    nodeGroups.map((nodeGroup) => {
      for (const node of nodeGroup.values()) {
        node.setPeers(nodeGroup);
      }
    });

    // Heal the network partition after a timeout of 20 seconds
    setTimeout(() => {
      for (const node of this.nodes.values()) {
        node.setPeers(this.nodes);
      }
    }, 20_000);

    // All nodes sync with their known peers every 10 seconds.
    const intervalId = setInterval(async () => {
      for (const node of this.nodes.values()) {
        await node.sync();
        Debugger.printNodeSync(node);
      }
      Debugger.printNodes(this.nodes);
    }, 10_000);

    setTimeout(() => {
      Debugger.printNodes(this.nodes);
      clearInterval(intervalId);
    }, this.duration);
  }

  async runClients() {
    // Create a valid signer for every client and broadcast it.
    for (const client of this.clients.values()) {
      const signerChange = this.generateSignerChange(client);
      for (const node of this.nodes.values()) {
        node.engine.addSignerChange(client.username, signerChange);
      }
    }

    const nodes = Array.from(this.nodes.values());
    const nodeA = nodes[0]; // Cook
    const nodeB = nodes[nodes.length - 1]; // Squire

    for (const client of this.clients.values()) {
      const messages = this.generateMessages(client);
      messages.forEach((msg, i) => {
        if (i === 0) {
          // Broadcast root message to both sides of split brain
          this.broadcastToNode(msg, nodeA);
          this.broadcastToNode(msg, nodeB);
        } else {
          // Broadcast all other messages to alternate sides of split brain
          const node = i % 2 === 0 ? nodeA : nodeB;
          console.log(client.username, node.name, i);
          this.broadcastToNode(msg, node);
        }
      });
    }
  }

  generateSignerChange(client: Client, logIndex?: number) {
    return {
      blockNumber: this.blockNumber,
      blockHash: this.blockHash,
      logIndex: logIndex || 0,
      address: client.address,
    };
  }

  generateMessages(client: Client) {
    const root1 = client.makeRoot(this.blockNumber, this.blockHash);
    const cs1 = client.makeCastShort(Faker.lorem.words(3), root1);
    const cs2 = client.makeCastShort(Faker.lorem.words(3), root1);
    const cs3 = client.makeCastShort(Faker.lorem.words(3), root1);
    const cd1 = client.makeCastDelete(cs2, root1);
    const cs4 = client.makeCastShort(Faker.lorem.words(3), root1);
    return [root1, cs1, cs2, cd1, cs3, cs4];
  }
}

/**
 * SplitBrain Simulator --
 *
 * Clients send a root message to all nodes, but send each subsequen
 */
export default SplitBrainAltSimulator;
