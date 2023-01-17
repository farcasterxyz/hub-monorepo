import { HubError } from '@farcaster/utils';
import HubRpcClient from '~/rpc/client';
import { ConsoleCommandInterface } from './console';

export class InfoCommand implements ConsoleCommandInterface {
  constructor(private readonly rpcClient: HubRpcClient) {}
  commandName(): string {
    return 'info';
  }
  shortHelp(): string {
    return 'Get the hub version info';
  }
  help(): string {
    return `Usage: info
    `;
  }

  info = async () => {
    const result = await this.rpcClient.getInfo();
    return result.match(
      (info) => {
        return JSON.stringify(
          { version: info.version(), synced: info.synced(), nickname: info.nickname(), root_hash: info.rootHash() },
          null,
          2
        );
      },
      (err: HubError) => {
        return `${err}`;
      }
    );
  };
}
