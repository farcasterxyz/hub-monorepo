import FCNode, { NodeDirectory } from '~/node';
import Table from 'cli-table3';
import colors from 'colors/safe';
import { isCast, isCastDelete, isCastShort, isRoot } from '~/types/typeguards';
import { Message } from '~/types';

const rootEmoji = String.fromCodePoint(0x1fab4);
const castEmoji = String.fromCodePoint(0x1f4e2);
const personEmoji = String.fromCodePoint(0x1f9d1);
const nodeEmoji = String.fromCodePoint(0x1f916);
const chainEmoji = String.fromCodePoint(0x1f517);

/**
 * Debugger helps visualize the current state of messages across nodes in the network
 */
const Debugger = {
  printSimulationStart: (name: string) => {
    Debugger._logSeparator();
    console.log(`${name} is starting...`);
    Debugger._logSeparator();
  },

  printSimulationEnd(name: string) {
    this._logSeparator();
    console.log(`${name} is ending...`);
    this._logSeparator();
    console.log('');
  },

  printNewBlock(blockNumber: number, blockHash: string) {
    console.log(`${chainEmoji} block  | num: ${blockNumber} hash: ${blockHash.slice(blockHash.length - 3)}`);
  },

  printBroadcast: (message: Message, node: FCNode): void => {
    const username = personEmoji + ' ' + Debugger._padString(message.data.username, 5);
    const hash = message.hash.slice(message.hash.length - 3);
    const nodeName = nodeEmoji + ' ' + Debugger._padString(node.name.toLowerCase(), 6);
    let type = 'unknown';
    let data = '';

    if (isRoot(message)) {
      type = Debugger._padString('root', 7);
    }

    if (isCastShort(message)) {
      type = Debugger._padString('cst-srt', 7);
      data = message.data.body.text.slice(0, 5) + '...';
    }

    if (isCastDelete(message)) {
      type = Debugger._padString('cst-del', 7);
      data = '0x' + message.data.body.targetHash.slice(message.data.body.targetHash.length - 3);
    }

    let outLine = `${username} > ${nodeName} | ${type} | ${hash} `;
    if (data.length > 0) {
      outLine += `| ${data} `;
    }

    console.log(outLine);
  },

  printNodeSync: (node: FCNode): void => {
    console.log(`${nodeEmoji} ${Debugger._padString(node.name.toLowerCase(), 6)} | syncing with peers `);
  },

  printNodes: (nodes: NodeDirectory): void => {
    console.log('');
    for (const username of FCNode.usernames) {
      const table = new Table({
        chars: {
          top: '═',
          'top-mid': ' ',
          'top-left': '╔',
          'top-right': '╗',
          bottom: '═',
          'bottom-mid': ' ',
          'bottom-left': '╚',
          'bottom-right': '╝',
          left: '║',
          'left-mid': ' ',
          mid: '-',
          'mid-mid': ' ',
          right: '║',
          'right-mid': '',
          middle: ' ',
        },
        style: { compact: true },
      });
      const { blockNum, setSize } = Debugger._latestCastSetFingerprint(username, nodes);
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
      console.log(username);
      console.log(table.toString());
    }
    console.log('');
  },

  /**
   * Calculates the fingerprint of the "latest" Cast Set.
   *
   * The latest set is defined as the one with the highest root block and the most messages. This
   * is a convenient approximation for comparing sets before applying an actual merge operation,
   * but is not always accurate.
   */
  _latestCastSetFingerprint: (username: string, nodes: NodeDirectory): { blockNum: number; setSize: number } => {
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

  _padString: (str: string, length: number): string => {
    while (str.length < length) {
      str += ' ';
    }
    return str;
  },

  _logSeparator(width = 50): void {
    console.log('═'.repeat(width));
  },
};

export default Debugger;
