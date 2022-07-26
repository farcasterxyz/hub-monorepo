import Client from '~/client';
import Debugger from '~/debugger';
import Faker from 'faker';
import Simulator from '~/simulator';
import { convertToHex } from '~/utils';
/**
 * Chaos Simulator
 *
 * Clients send messages to random nodes in random order with randomzied delays. Nodes sync with other nodes every 10 seconds, but with a 33% chance
 * of sync failure.
 */

class ChaosSimulator extends Simulator {
  clients: Map<string, Client>;

  constructor(clients: Map<string, Client>) {
    super('ChaosSimulator', 120_000);

    this.clients = clients;
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
        if (Math.random() < 0.33) {
          await node.sync();
          Debugger.printNodeSync(node);
        }
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
        node.engine.addSignerChange(client.username, await signerChange);
      }
    }

    // Create messages for clients and broadcast them at random
    Array.from(this.clients.values()).map(async (client) => {
      const messages = await this.generateMessages(client);
      const nodes = Array.from(this.nodes.values());
      const node = nodes[Math.floor(Math.random() * nodes.length)];
      // Send the root early, so we have some interesting merges
      const root = messages[0];
      this.broadcastToNode(root, node, Math.random() * 5_000);
      const nonRootMessages = messages.slice(1);
      nonRootMessages.map((message) => this.broadcastToNode(message, node, Math.random() * 60_000));
    });
  }

  async generateSignerChange(client: Client, logIndex?: number) {
    return {
      blockNumber: this.blockNumber,
      blockHash: this.blockHash,
      logIndex: logIndex || 0,
      address: await convertToHex(client.publicKey),
    };
  }

  async generateMessages(client: Client) {
    const root1 = await client.makeRoot(this.blockNumber, this.blockHash);
    const cs1 = await client.makeCastShort(Faker.lorem.words(3), root1);
    const cs2 = await client.makeCastShort(Faker.lorem.words(3), root1);
    const cs3 = await client.makeCastShort(Faker.lorem.words(3), root1);
    const cd1 = await client.makeCastRemove(cs2, root1);
    const cs4 = await client.makeCastShort(Faker.lorem.words(3), root1);
    const ra1 = await client.makeReaction(cs4, root1);
    const ru1 = await client.makeReaction(cs4, root1, false);
    return [root1, cs1, cs2, cs3, cd1, cs4, ra1, ru1];
  }
}

export default ChaosSimulator;
