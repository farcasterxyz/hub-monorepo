import {
  Metadata,
  getAdminRpcClient,
  getAuthMetadata,
  getInsecureHubRpcClient,
  getSSLHubRpcClient,
  toFarcasterTime,
  fromFarcasterTime,
  bytesToHexString,
  hexStringToBytes,
} from "@farcaster/hub-nodejs";
import * as hub from "@farcaster/hub-nodejs";
import path from "path";
import * as repl from "repl";
import { AdminCommand } from "./adminCommand.js";
import { FactoriesCommand, ProtobufCommand } from "./protobufCommand.js";
import { RpcClientCommand } from "./rpcClientCommand.js";

export const DEFAULT_RPC_CONSOLE = "127.0.0.1:3383";

export interface ConsoleCommandInterface {
  commandName(): string;
  shortHelp(): string;
  help(): string;
  // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
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
    .on("exit", () => {
      process.exit(0);
    });

  replServer.output.write("\nWelcome to the Hub console. Type '.help' for a list of commands.\n");
  replServer.output.write(`Connecting to hub at "${addressString}"\n`);

  replServer.setupHistory(path.join(process.cwd(), ".hub_history"), (err) => {
    if (err) {
      console.error("Error setting up history:", err);
    }
  });

  let rpcClient;
  if (useInsecure) {
    rpcClient = getInsecureHubRpcClient(addressString);
  } else {
    rpcClient = getSSLHubRpcClient(addressString);
  }

  // Admin server is only available on localhost
  const adminClient = await getAdminRpcClient(addressString);

  const commands: ConsoleCommandInterface[] = [
    new RpcClientCommand(rpcClient),
    new ProtobufCommand(),
    new FactoriesCommand(),
    new AdminCommand(adminClient),
  ];

  replServer.defineCommand("help", {
    help: "Show this help",
    action() {
      this.clearBufferedCommand();

      this.output.write("Available commands:\n");
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
  replServer.context["getAuthMetadata"] = getAuthMetadata;
  replServer.context["toFarcasterTime"] = toFarcasterTime;
  replServer.context["fromFarcasterTime"] = fromFarcasterTime;
  replServer.context["bytesToHex"] = bytesToHexString;
  replServer.context["hexToBytes"] = hexStringToBytes;
  replServer.context["adminClient"] = adminClient;

  // Run the info command to start

  const info = await rpcClient.getInfo({}, new Metadata(), {
    deadline: Date.now() + 2000,
  });

  if (info.isErr()) {
    replServer.output.write(`Could not connect to hub at "${addressString}"\n`);
    console.log(info.error);
    process.exit(1);
  }

  replServer.output.write(`Connected Info: ${JSON.stringify(info.value)}\n`);

  replServer.displayPrompt();
};

const addressString = process.argv[2] || DEFAULT_RPC_CONSOLE;
const useInsecure = process.argv[3] === "insecure";

startConsole(addressString, useInsecure).catch((err) => {
  console.error("Error starting console:", err);
  process.exit(1);
});
