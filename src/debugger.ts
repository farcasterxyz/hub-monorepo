import FCNode, { NodeList } from '~/node';
import { SignedCastChain } from '~/types';
import Table from 'cli-table3';
import colors from 'colors/safe';
import { isCast } from '~/types/typeguards';

const rootEmoji = String.fromCodePoint(0x1fab4);
const castEmoji = String.fromCodePoint(0x1f4e2);

const visualizeChains = (chains: SignedCastChain[], color: (str: string) => string): string[] => {
  return chains.map((chain) => visualizeChain(chain, color)).flat();
};

const visualizeChain = (chain: SignedCastChain, color: (str: string) => string): string[] => {
  return chain.map((msg) => {
    const visual = isCast(msg) ? castEmoji : rootEmoji;
    return color(visual + '  ' + msg.hash.slice(msg.hash.length - 3, msg.hash.length));
  });
};

/** Determine the timestamp of the latest message in the Cast Chains */
const latestChainSignedAt = (chains: SignedCastChain[]): number => {
  const lastChain = chains[chains.length - 1];
  if (!lastChain) {
    return 0;
  }

  const lastMsg = lastChain[lastChain.length - 1];
  if (!lastMsg) {
    return 0;
  }

  return lastMsg.message.signedAt;
};

let nodes: NodeList;

const Debugger = {
  init: (nodeList: NodeList): void => {
    nodes = nodeList;
  },

  printState: (): void => {
    const table = new Table();

    for (const username of FCNode.usernames) {
      // Determine the chain which has the user's latest message, so that we can mark it green.
      let latestSignedAt = 0;
      nodes.forEach((node) => {
        const chainLatestSignedAt = latestChainSignedAt(node.engine.getChains(username));
        if (chainLatestSignedAt > latestSignedAt) {
          latestSignedAt = chainLatestSignedAt;
        }
      });

      // For each user's chain in each node, print the chain.
      for (const node of nodes.values()) {
        const chainLatestSignedAt = latestChainSignedAt(node.engine.getChains(username));
        const color = chainLatestSignedAt === latestSignedAt ? colors.green : colors.red;
        table.push({ [node.name]: visualizeChains(node.engine.getChains(username), color) });
      }
    }

    console.log(table.toString());
  },
};

export default Debugger;
