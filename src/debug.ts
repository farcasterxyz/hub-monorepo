import FCNode, { NodeList } from '~/node';
import { isCast, SignedCastChain } from '~/types';

const visualizeChains = (chains: SignedCastChain[]): string => {
  return chains.map((chain) => visualizeChain(chain)).join('');
};

const visualizeChain = (chain: SignedCastChain): string => {
  return chain.reduce((acc, msg) => {
    if (isCast(msg)) {
      return `${acc}-`;
    } else {
      return `${acc}*`;
    }
  }, '');
};

let nodes: NodeList;

const Debugger = {
  init: (nodeList: NodeList): void => {
    nodes = nodeList;
  },

  printState: (): void => {
    console.log('===========Network Snapshot===========');
    for (const username of FCNode.usernames) {
      console.log(`@${username}`);
      for (const node of nodes.values()) {
        console.log(`|------${node.name.padEnd(6)}: `, visualizeChains(node.engine.castChains.get(username) || []));
      }
      console.log('=====================================');
    }
  },
};

export default Debugger;
