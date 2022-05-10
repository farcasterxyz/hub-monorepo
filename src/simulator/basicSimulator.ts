import Client from '~/client';
import Debugger from '~/debugger';
import Faker from 'faker';
import Simulator from '~/simulator';

/**
 * Basic Simulator
 *
 * Clients generate messages and send them in order to a single node. All nodes sync every 10 seconds.
 */

class BasicSimulator extends Simulator {
  constructor() {
    super('BasicSimulator', 20_000);
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

    for (const node of this.nodes.values()) {
      node.setPeers(this.nodes);
    }

    const intervalId = setInterval(async () => {
      for (const node of this.nodes.values()) {
        await node.sync();
        Debugger.printNodeSync(node);
      }
      Debugger.printNodes(this.nodes);
    }, 10_000);

    setTimeout(() => {
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

    // Create messages for clients and broadcast them at random
    Array.from(this.clients.values()).map((client) => {
      const messages = this.generateMessages(client);
      const nodes = Array.from(this.nodes.values());
      const node = nodes[Math.floor(Math.random() * nodes.length)];
      messages.map((message) => this.broadcastToNode(message, node));
    });
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
    const ra1 = client.makeReaction(cs4, root1);
    const ru1 = client.makeReaction(cs4, root1, false);
    return [root1, cs1, cs2, cs3, cd1, cs4, ra1, ru1];
  }
}

export default BasicSimulator;
