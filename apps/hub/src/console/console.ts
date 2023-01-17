import path from 'path';
import * as repl from 'repl';
import HubRpcClient from '~/rpc/client';
import { logger } from '~/utils/logger';
import { addressInfoFromParts } from '~/utils/p2p';
import { CastsCommand } from './castsCommand';
import { InfoCommand } from './infoCommand';
import { SyncTrieCommand } from './syncTrieCommand';

const addressInfo = addressInfoFromParts('127.0.0.1', 13112)._unsafeUnwrap();

export const startConsole = async () => {
  const replServer = repl
    .start({
      prompt: 'hub> ',
      useColors: true,
      useGlobal: true,
      breakEvalOnSigint: true,
    })
    .on('exit', () => {
      process.exit(0);
    });

  replServer.output.write("\nWelcome to the Hub console. Type '.help' for a list of commands.\n");
  replServer.output.write('Connected to hub at ' + JSON.stringify(addressInfo) + '\n');

  replServer.setupHistory(path.join(process.cwd(), '.hub_history'), (err) => {
    if (err) {
      logger.error(err);
    }
  });

  replServer.defineCommand('help', {
    help: 'Show this help',
    action() {
      this.clearBufferedCommand();
      this.output.write(`Available commands:
            syncTrie: Query the sync trie
            info: Get the hub version info
            casts: Get the list of casts by fid/tsHash or other parameters
    `);
      this.displayPrompt();
    },
  });

  const rpcClient = new HubRpcClient(addressInfo);

  replServer.context['syncTrie'] = new SyncTrieCommand(rpcClient);
  replServer.context['info'] = new InfoCommand(rpcClient);
  replServer.context['casts'] = new CastsCommand(rpcClient);

  replServer.displayPrompt();
};
