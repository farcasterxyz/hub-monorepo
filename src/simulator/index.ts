import Client from '~/client';
import FCNode, { InstanceName } from '~/node';
import Faker from 'faker';
import Debugger from '~/debugger';

abstract class Simulator {
  nodes: Map<InstanceName, FCNode>;
  clients: Map<string, Client>;
  blockNumber: number;
  blockHash: string;
  name: string;

  constructor(name: string) {
    this.name = name;
    this.nodes = new Map();
    for (const name of FCNode.instanceNames) {
      this.nodes.set(name, new FCNode(name));
    }

    this.clients = new Map();
    for (const name of Client.instanceNames) {
      this.clients.set(name, new Client(name));
    }

    this.blockNumber = 100;
    this.blockHash = Faker.datatype.hexaDecimal(64).toLowerCase();
  }

  run(duration: number) {
    Debugger.printSimulationStart(this.name);
    this.runNodes(duration);
    this.runClients(duration);
    this.runBlockchain(duration);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        Debugger.printSimulationEnd(this.name);
        resolve();
      }, duration + 1);
    });
  }

  abstract runNodes(duration: number): void;
  abstract runClients(duration: number): void;
  abstract runBlockchain(duration: number): void;

  stepBlockForward() {
    this.blockNumber++;
    this.blockHash = Faker.datatype.hexaDecimal(64).toLowerCase();
  }
}

export default Simulator;
