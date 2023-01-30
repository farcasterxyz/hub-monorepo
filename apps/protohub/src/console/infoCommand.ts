import { Empty } from '@farcaster/protobufs';
import { HubError, HubRpcClient } from '@farcaster/utils';
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
    const result = await this.rpcClient.getInfo(Empty.create({}));
    return result.match<any>(
      (info) => {
        return info;
      },
      (err: HubError) => {
        return err;
      }
    );
  };
}
