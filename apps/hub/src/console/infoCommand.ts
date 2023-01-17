import { HubError } from '@farcaster/utils';
import HubRpcClient from '~/rpc/client';

export class InfoCommand {
  constructor(private readonly rpcClient: HubRpcClient) {}

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
