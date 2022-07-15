import FCNode, { NodeDirectory } from '~/node';
import Table from 'cli-table3';
import logUpdate from 'log-update';
import colors from 'colors/safe';
import {
  isCastDelete,
  isCastShort,
  isReaction,
  isRoot,
  isVerificationAdd,
  isVerificationRemove,
} from '~/types/typeguards';
import { Message } from '~/types';

const rootEmoji = String.fromCodePoint(0x1fab4);
const castEmoji = String.fromCodePoint(0x1f4e2);
const reactionEmoji = String.fromCodePoint(0x1f600);
const personEmoji = String.fromCodePoint(0x1f9d1);
const nodeEmoji = String.fromCodePoint(0x1f916);
const chainEmoji = String.fromCodePoint(0x1f517);

const tableStyle = {
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
};

/** Store sections of terminal output separately for rendering */
const activity: string[] = [];
const nodeStatus: string[] = [];

/**
 * Debugger helps visualize the current state of messages across nodes in the network
 */

const Debugger = {
  printSimulationStart: (name: string) => {
    Debugger._logSeparator();
    activity.push(`${name} is starting...`);
    Debugger._logSeparator();
    Debugger._render();
  },

  printSimulationEnd(name: string) {
    activity.push(...nodeStatus);
    nodeStatus.length = 0;
    this._logSeparator();
    activity.push(`${name} is ending...`);
    this._logSeparator();
    activity.push('');
    Debugger._dumpToConsole();
  },

  printNewBlock(blockNumber: number, blockHash: string) {
    activity.push(`${chainEmoji} block  | num: ${blockNumber} hash: ${blockHash.slice(blockHash.length - 3)}`);
    Debugger._render();
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

    if (isReaction(message)) {
      const typeName = message.data.body.active ? 'rct-add' : 'rct-rem';
      type = Debugger._padString(typeName, 7);
      data = '0x' + message.data.body.targetUri.slice(message.data.body.targetUri.length - 3);
    }

    if (isVerificationAdd(message)) {
      type = Debugger._padString('ver-add', 7);
      data = message.data.body.externalAddressUri.slice(0, 7);
    }

    if (isVerificationRemove(message)) {
      type = Debugger._padString('ver-rem', 7);
      data = message.data.body.verificationAddHash.slice(0, 7);
    }

    let outLine = `${username} > ${nodeName} | ${type} | ${hash} `;
    if (data.length > 0) {
      outLine += `| ${data} `;
    }

    activity.push(outLine);
    Debugger._render();
  },

  printNodeSync: (node: FCNode): void => {
    let peerStr = '';
    let peerCounter = 0;

    if (node.peers) {
      for (const peer of node.peers.values()) {
        if (peerCounter > 0) {
          peerStr += ', ';
        }
        peerStr += peer.name.toLowerCase();
        peerCounter++;
      }
    }

    activity.push(`${nodeEmoji} ${Debugger._padString(node.name.toLowerCase(), 6)} | syncing with ${peerStr} `);
    Debugger._render();
  },

  printNodes: (nodes: NodeDirectory): void => {
    // First, empty array to achieve "in-line" update effect when rendering table
    nodeStatus.length = 0;
    nodeStatus.push('');
    for (const username of FCNode.usernames) {
      const table = new Table(tableStyle);
      const { blockNum, setSize } = Debugger._latestUserState(username, nodes);

      for (const node of nodes.values()) {
        const root = node.getRoot(username);
        const nodeName = node.name.toLowerCase();

        if (!root) {
          table.push({ [nodeName]: Debugger._visualizeState({}, colors.red) });
          continue;
        }

        // If this node is the "latest" according to heuristic, show it in green otherwise in red.
        const isLatest = root?.data.rootBlock === blockNum && Debugger._numMessages(node, username) === setSize;
        const color = isLatest ? colors.green : colors.red;

        const castHashes = node.getCastHashes(username);
        const reactionHashes = node.getReactionHashes(username);

        const messages = {
          rootHashes: [root.hash],
          castHashes,
          reactionHashes,
        };

        table.push({ [nodeName]: Debugger._visualizeState(messages, color) });
      }

      nodeStatus.push(username);
      nodeStatus.push(table.toString());
    }
    nodeStatus.push('');
  },

  /**
   * Returns the "latest" state of a user across all nodes.
   *
   * Find the state with the highest root block number and most messages. This isn't guaranteed to
   * be the latest, but is a fast approximation.
   */
  _latestUserState: (username: string, nodes: NodeDirectory): { blockNum: number; setSize: number } => {
    let highestKnownBlock = 0;
    let largestMessageSetSize = 0;

    nodes.forEach((node) => {
      const root = node.getRoot(username);

      if (root && root.data.rootBlock >= highestKnownBlock) {
        if (root.data.rootBlock > highestKnownBlock) {
          highestKnownBlock = root.data.rootBlock;
          largestMessageSetSize = 0;
        }

        const size = Debugger._numMessages(node, username);
        if (size > largestMessageSetSize) {
          largestMessageSetSize = size;
        }
      }
    });

    return { blockNum: highestKnownBlock, setSize: largestMessageSetSize };
  },

  /** Returns the number of messages for a user in a given node */
  _numMessages: (node: FCNode, username: string) => {
    return node.getAllCastHashes(username).length + node.getAllReactionHashes(username).length;
  },

  /** Draw logs and network table to stdout */
  _render() {
    const logs = activity.reduce((accum, next) => `${accum}${next}\n`, ``);
    const network = nodeStatus.reduce((accum, next) => `${accum}${next}\n`, ``);
    logUpdate(`${logs}${network}`);
  },

  /** Log completed simulation via console.log */
  _dumpToConsole() {
    const lines = activity.slice();
    activity.length = 0;
    Debugger._render();
    for (const line of lines) {
      console.log(line);
    }
  },

  /** Convert a Message[] into a human readable string */
  _visualizeState: (nodeState: Record<string, string[]>, color: (str: string) => string): string[] => {
    if (!nodeState.rootHashes) {
      return [];
    }

    const output = [];
    output.push(...nodeState.rootHashes.map((hash: string) => Debugger._visualizeMessage(hash, rootEmoji, color)));
    output.push(...nodeState.castHashes.map((hash: string) => Debugger._visualizeMessage(hash, castEmoji, color)));
    output.push(
      ...nodeState.reactionHashes.map((hash: string) => Debugger._visualizeMessage(hash, reactionEmoji, color))
    );
    return output;
  },

  _visualizeMessage: (hash: string, emoji: string, color: (str: string) => string): string => {
    return color(emoji + '  ' + hash.slice(hash.length - 3, hash.length));
  },

  _padString: (str: string, length: number): string => {
    while (str.length < length) {
      str += ' ';
    }
    return str;
  },

  _logSeparator(width = 50): void {
    activity.push('═'.repeat(width));
  },
};

export default Debugger;
