import Client from '~/client';
import Debugger from '~/debugger';
import Faker from 'faker';
import Simulator from '~/simulator';
import { ethers } from 'ethers';
import * as FC from '~/types';

/**
 * Basic Simulator
 *
 * Clients generate messages and send them in order to a single node. All nodes sync every 10 seconds.
 */

class BasicSimulator extends Simulator {
  clients: Map<string, Client>;

  constructor(clients: Map<string, Client>) {
    super('BasicSimulator', 20_000);

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
        node.engine.addSignerChange(client.username, await signerChange);
      }
    }

    // Create messages for clients and broadcast them at random
    Array.from(this.clients.values()).map(async (client) => {
      const messages = await this.generateMessages(client);
      const nodes = Array.from(this.nodes.values());
      const node = nodes[Math.floor(Math.random() * nodes.length)];
      messages.map((message) => this.broadcastToNode(message, node));
    });
  }

  async generateSignerChange(client: Client, logIndex?: number) {
    return {
      blockNumber: this.blockNumber,
      blockHash: this.blockHash,
      logIndex: logIndex || 0,
      address: client.signer.signerKey,
    };
  }

  async generateRandomVerification(client: Client, root: FC.Root): Promise<FC.VerificationAdd> {
    const randomEthWallet = ethers.Wallet.createRandom();
    const ethAddress = randomEthWallet.address;
    const claimToSign = await client.makeVerificationClaimHash(ethAddress);
    const externalSignature = await randomEthWallet.signMessage(claimToSign);
    const blockHash = this.blockHash;
    return client.makeVerificationAdd(ethAddress, claimToSign, blockHash, externalSignature, root);
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
    const vAdd1 = await this.generateRandomVerification(client, root1);
    const vAdd2 = await this.generateRandomVerification(client, root1);
    const vRem1 = await client.makeVerificationRemove(vAdd1, root1);
    return [root1, cs1, cs2, cs3, cd1, cs4, ra1, ru1, vAdd1, vAdd2, vRem1];
  }
}

export default BasicSimulator;
