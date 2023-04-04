import {
  Empty,
  Metadata,
  getAdminRpcClient,
  getAuthMetadata,
  getInsecureHubRpcClient,
  getSSLHubRpcClient,
} from '@farcaster/hub-nodejs';
import path from 'path';
import * as repl from 'repl';
import { ADMIN_SERVER_PORT } from '~/rpc/adminServer';
import { logger } from '~/utils/logger';
import { AdminCommand } from './adminCommand';
import { GenCommand } from './genCommand';
import { FactoriesCommand, ProtobufCommand } from './protobufCommand';
import { RpcClientCommand } from './rpcClientCommand';
import { WarpcastTestCommand } from './warpcastTestCommand';

export const DEFAULT_RPC_CONSOLE = '127.0.0.1:2283';

export interface ConsoleCommandInterface {
  commandName(): string;
  shortHelp(): string;
  help(): string;
  object(): any;
}

export const startConsole = async (addressString: string, useInsecure: boolean) => {
  const replServer = repl
    .start({
      prompt: `${addressString} hub> `,
      useColors: true,
      useGlobal: true,
      breakEvalOnSigint: true,
    })
    .on('exit', () => {
      process.exit(0);
    });

  replServer.output.write("\nWelcome to the Hub console. Type '.help' for a list of commands.\n");
  replServer.output.write('Connecting to hub at "' + addressString + '"\n');

  replServer.setupHistory(path.join(process.cwd(), '.hub_history'), (err) => {
    if (err) {
      logger.error(err);
    }
  });

  let rpcClient;
  if (useInsecure) {
    rpcClient = getInsecureHubRpcClient(addressString);
  } else {
    rpcClient = getSSLHubRpcClient(addressString);
  }

  // Admin server is only available on localhost
  const adminClient = await getAdminRpcClient(`127.0.0.1:${ADMIN_SERVER_PORT}`);

  const commands: ConsoleCommandInterface[] = [
    new RpcClientCommand(rpcClient),
    new ProtobufCommand(),
    new FactoriesCommand(),
    new GenCommand(rpcClient, adminClient),
    new WarpcastTestCommand(rpcClient, adminClient),
    new AdminCommand(adminClient),
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
    replServer.context[command.commandName()] = command.object();
  });

  // Add some utility functions
  replServer.context['getAuthMetadata'] = getAuthMetadata;

  // Run the info command to start

  const info = await rpcClient.getInfo(Empty.create(), new Metadata(), { deadline: Date.now() + 2000 });

  if (info.isErr()) {
    replServer.output.write('Could not connect to hub at "' + addressString + '"\n');
    // eslint-disable-next-line no-console
    console.log(info.error);
    process.exit(1);
  }

  replServer.output.write('Connected Info: ' + JSON.stringify(info.value) + '\n');

  replServer.displayPrompt();
};
