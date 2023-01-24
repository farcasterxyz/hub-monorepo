import { AddressInfo } from 'net';
import path from 'path';
import * as repl from 'repl';
import HubRpcClient from '~/rpc/client';
import { logger } from '~/utils/logger';
import { addressInfoFromParts } from '~/utils/p2p';
import { CastsCommand } from './castsCommand';
import { InfoCommand } from './infoCommand';
import { SyncTrieCommand } from './syncTrieCommand';

export const DEFAULT_RPC_CONSOLE = addressInfoFromParts('127.0.0.1', 13112)._unsafeUnwrap();

export const parseServerAddress = (server: string): AddressInfo => {
  const [host, port] = server.split(':');
  if (!host || !port) throw new Error('Invalid server address');

  return addressInfoFromParts(host, parseInt(port))._unsafeUnwrap();
};

export interface ConsoleCommandInterface {
  commandName(): string;
  shortHelp(): string;
  help(): string;
}

export const startConsole = async (addressInfo: AddressInfo) => {
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

  const rpcClient = new HubRpcClient(addressInfo);
  const commands: ConsoleCommandInterface[] = [
    new SyncTrieCommand(rpcClient),
    new InfoCommand(rpcClient),
    new CastsCommand(rpcClient),
  ];

  replServer.defineCommand('help', {
    help: 'Show this help',
    action() {
      this.clearBufferedCommand();

      this.output.write(`Available commands:\n`);
      commands.forEach((command) => {
        this.output.write(`\t${command.commandName()} - ${command.shortHelp()}\n`);
      });

      this.displayPrompt();
    },
  });

  commands.forEach((command) => {
    replServer.context[command.commandName()] = command;
  });

  replServer.displayPrompt();
};
