import FCNode, { NodeList } from '~/node';
import { isCast, SignedCastChain } from '~/types';
import Table from 'cli-table3';

const rootEmoji = String.fromCodePoint(0x1fab4);
const castEmoji = String.fromCodePoint(0x1f4e2);

const visualizeChains = (chains: SignedCastChain[]): string[] => {
  return chains.map((chain) => visualizeChain(chain)).flat();
};

const visualizeChain = (chain: SignedCastChain): string[] => {
  return chain.map((msg) => {
    const visual = isCast(msg) ? castEmoji : rootEmoji;
    return visual + '  ..' + msg.hash.slice(msg.hash.length - 4, msg.hash.length);
  });
};

let nodes: NodeList;

const Debugger = {
  init: (nodeList: NodeList): void => {
    nodes = nodeList;
  },

  printState: (): void => {
    const table = new Table();

    for (const username of FCNode.usernames) {
      for (const node of nodes.values()) {
        table.push({ [node.name]: visualizeChains(node.engine.getCastChains(username)) });
      }
    }
    console.log(table.toString());
  },
};

export default Debugger;
