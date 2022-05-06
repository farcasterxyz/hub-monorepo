import Client from '~/client';
import Debugger from '~/debugger';
import FCNode from '~/node';
import Faker from 'faker';
import { isRoot } from '~/types/typeguards';
import { Cast, Message, RootMessageBody } from '~/types';
import Simulator from '~/simulator';

class BasicSimulator extends Simulator {
  constructor() {
    super('BasicSimulator');
  }

  async runBlockchain(duration: number) {
    const intervalId = setInterval(() => {
      this.stepBlockForward();
      Debugger.printNewBlock(this.blockNumber, this.blockHash);
    }, 10_000);

    setTimeout(() => {
      clearInterval(intervalId);
    }, duration);
  }

  async runNodes(duration: number) {
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
    }, duration);
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
      const messages = this.generateHistory(client);
      this.broadcast(messages);
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

  generateHistory(client: Client) {
    const root1 = client.makeRoot(this.blockNumber, this.blockHash);
    const cs1 = client.makeCastShort(Faker.lorem.words(3), root1);
    const cs2 = client.makeCastShort(Faker.lorem.words(3), root1);
    const cs3 = client.makeCastShort(Faker.lorem.words(3), root1);
    const cd1 = client.makeCastDelete(cs2, root1);
    const cs4 = client.makeCastShort(Faker.lorem.words(3), root1);
    return [root1, cs1, cs2, cs3, cd1, cs4];
  }

  /** Given a set of messages and a client, determines which nodes should receive messages, when and in what order */
  broadcast(messages: Message<any>[]) {
    const nodes = Array.from(this.nodes.values());
    const node = nodes[Math.floor(Math.random() * nodes.length)];
    messages.map((message) => this.broadcastToNode(message, node));
  }

  /** Pushes message to a node after optional delay */
  private broadcastToNode(message: Message<RootMessageBody> | Cast, node: FCNode, delay?: number) {
    setTimeout(() => {
      Debugger.printBroadcast(message, node);
      isRoot(message) ? node.addRoot(message) : node.addCast(message);
    }, delay || 0);
  }
}

export default BasicSimulator;
