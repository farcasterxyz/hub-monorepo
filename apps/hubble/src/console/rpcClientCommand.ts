import { HubRpcClient } from "@farcaster/hub-nodejs";
import { ConsoleCommandInterface } from "./console.js";

export class RpcClientCommand implements ConsoleCommandInterface {
  constructor(private readonly rpcClient: HubRpcClient) {}
  commandName(): string {
    return "rpcClient";
  }
  shortHelp(): string {
    return "Use the RPC client connected to the Hub";
  }
  help(): string {
    return "Usage: rpcClient.<rpc>(<args>)";
  }
  object(): HubRpcClient {
    return this.rpcClient;
  }
}
