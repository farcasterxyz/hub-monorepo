import {
  HubInfoRequest,
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
import path from "path";
import * as repl from "repl";
import { ADMIN_SERVER_PORT } from "../rpc/adminServer.js";
import { logger } from "../utils/logger.js";
import { AdminCommand } from "./adminCommand.js";
import { GenCommand } from "./genCommand.js";
import { FactoriesCommand, ProtobufCommand } from "./protobufCommand.js";
import { RpcClientCommand } from "./rpcClientCommand.js";
import { WarpcastTestCommand } from "./warpcastTestCommand.js";
import { SyncId } from "../network/sync/syncId.js";
import { TrackHubDelayCommand } from "./trackHubDelayCommand.js";

export const DEFAULT_RPC_CONSOLE = "127.0.0.1:2283";

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
    new TrackHubDelayCommand(rpcClient),
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
  replServer.context["SyncId"] = SyncId;
  replServer.context["toFarcasterTime"] = toFarcasterTime;
  replServer.context["fromFarcasterTime"] = fromFarcasterTime;
  replServer.context["bytesToHex"] = bytesToHexString;
  replServer.context["hexToBytes"] = hexStringToBytes;

  // Run the info command to start

  const info = await rpcClient.getInfo(HubInfoRequest.create({ dbStats: true }), new Metadata(), {
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
