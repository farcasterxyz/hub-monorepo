import FCNode, { NodeList } from '~/node';
import Table from 'cli-table3';
import colors from 'colors/safe';
import { isCast } from '~/types/typeguards';
import { Message } from '~/types';

const rootEmoji = String.fromCodePoint(0x1fab4);
const castEmoji = String.fromCodePoint(0x1f4e2);

let nodes: NodeList;

/**
 * Debugger helps visualize the current state of messages across nodes in the network
 */
const Debugger = {
  init: (nodeList: NodeList): void => {
    nodes = nodeList;
  },

  printState: (): void => {
    const table = new Table();

    for (const username of FCNode.usernames) {
      const { blockNum, setSize } = Debugger._latestCastSetFingerprint(username);

      for (const node of nodes.values()) {
        const root = node.getRoot(username);
        if (!root) {
          table.push({ [node.name]: Debugger._visualizeMessages([], colors.red) });
          continue;
        }

        // If this node is the "latest" according to our approximate heuristic, show it in green otherwise in red.
        const isLatest = root?.data.rootBlock === blockNum && Debugger._castSetSize(node, username) === setSize;
        const color = isLatest ? colors.green : colors.red;

        const messages: Message<any>[] = node.getCastAdds(username);
        messages.unshift(root);
        table.push({ [node.name]: Debugger._visualizeMessages(messages, color) });
      }
    }

    console.log(table.toString());
  },

  /**
   * Calculates the fingerprint of the "latest" Cast Set.
   *
   * The latest set is defined as the one with the highest root block and the most messages. This
   * is a convenient approximation for comparing sets before applying an actual merge operation,
   * but is not always accurate.
   */
  _latestCastSetFingerprint: (username: string): { blockNum: number; setSize: number } => {
    let highestKnownBlock = 0;
    let largestMessageSetSize = 0;

    nodes.forEach((node) => {
      const root = node.getRoot(username);

      if (root && root.data.rootBlock >= highestKnownBlock) {
        if (root.data.rootBlock > highestKnownBlock) {
          highestKnownBlock = root.data.rootBlock;
          largestMessageSetSize = 0;
        }

        const size = Debugger._castSetSize(node, username);
        if (size > largestMessageSetSize) {
          largestMessageSetSize = size;
        }
      }
    });

    return { blockNum: highestKnownBlock, setSize: largestMessageSetSize };
  },

  /** Determine the total number of messages in a user's Cast Set */
  _castSetSize: (node: FCNode, username: string) => {
    return node.getCastAddsHashes(username).length + node.getCastDeletesHashes(username).length;
  },

  /** Convert a Message[] into a human readable string */
  _visualizeMessages: (messages: Message<any>[], color: (str: string) => string): string[] => {
    return messages.map((msg) => {
      const visual = isCast(msg) ? castEmoji : rootEmoji;
      return color(visual + '  ' + msg.hash.slice(msg.hash.length - 3, msg.hash.length));
    });
  },
};

export default Debugger;
