import FCNode, { InstanceName } from '~/node';
import Faker from 'faker';
import Debugger from '~/debugger';
import { Message } from '~/types';
import { isReaction, isCast, isVerification, isSignerMessage } from '~/types/typeguards';

abstract class Simulator {
  nodes: Map<InstanceName, FCNode>;
  blockNumber: number;
  blockHash: string;
  name: string;
  duration: number;

  constructor(name: string, duration: number) {
    this.name = name;
    this.nodes = new Map();
    for (const name of FCNode.instanceNames) {
      this.nodes.set(name, new FCNode(name));
    }

    this.blockNumber = 100;
    this.blockHash = Faker.datatype.hexaDecimal(64).toLowerCase();
    this.duration = duration;
  }

  run() {
    Debugger.printSimulationStart(this.name);
    this.runNodes();
    this.runClients();
    this.runBlockchain();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        Debugger.printSimulationEnd(this.name);
        resolve();
      }, this.duration + 1);
    });
  }

  abstract runNodes(): void;
  abstract runClients(): void;
  abstract runBlockchain(): void;

  stepBlockForward() {
    this.blockNumber++;
    this.blockHash = Faker.datatype.hexaDecimal(64).toLowerCase();
  }

  /** Pushes message to a node after optional delay */
  broadcastToNode(message: Message, node: FCNode, delay?: number) {
    setTimeout(() => {
      Debugger.printBroadcast(message, node);
      if (isReaction(message)) {
        node.mergeReaction(message);
      } else if (isCast(message)) {
        node.mergeCast(message);
      } else if (isVerification(message)) {
        node.mergeVerification(message);
      } else if (isSignerMessage(message)) {
        // TODO: support signers
      } else {
        // TODO: decide how to handle unknown message type
      }
    }, delay || 0);
  }
}

export default Simulator;
