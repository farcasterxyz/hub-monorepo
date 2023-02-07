import { Empty } from '@farcaster/protobufs';
import { getHubRpcClient } from '@farcaster/utils';
import path from 'path';
import * as repl from 'repl';
import { logger } from '~/utils/logger';
import { GenCommand } from './genCommand';
import { FactoriesCommand, ProtobufCommand } from './protobufCommand';
import { RpcClientCommand } from './rpcClientCommand';

export const DEFAULT_RPC_CONSOLE = '127.0.0.1:13112';

export interface ConsoleCommandInterface {
  commandName(): string;
  shortHelp(): string;
  help(): string;
  object(): any;
}

export const startConsole = async (addressString: string) => {
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
  replServer.output.write('Connecting to hub at "' + addressString + '"\n');

  replServer.setupHistory(path.join(process.cwd(), '.hub_history'), (err) => {
    if (err) {
      logger.error(err);
    }
  });

  const rpcClient = getHubRpcClient(addressString);
  const commands: ConsoleCommandInterface[] = [
    new RpcClientCommand(rpcClient),
    new ProtobufCommand(),
    new FactoriesCommand(),
    new GenCommand(rpcClient),
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

  // Run the info command to start
  replServer.output.write(
    'Connected Info: ' + JSON.stringify(await (commands[0] as RpcClientCommand).object().getInfo(Empty.create())) + '\n'
  );

  replServer.displayPrompt();
};
