import { CastId, FidRequest, Message } from '@farcaster/protobufs';
import { HubError, HubRpcClient } from '@farcaster/utils';
import { ConsoleCommandInterface } from './console';

export class CastsCommand implements ConsoleCommandInterface {
  constructor(private readonly rpcClient: HubRpcClient) {}
  commandName(): string {
    return 'casts';
  }
  shortHelp(): string {
    return 'Get the list of casts by fid/tsHash or other parameters';
  }
  help(): string {
    return `Usage: casts <command> <args>
    Commands:
      castByFidAndHash <fid> <tsHash> - Get the cast by fid and tsHash
      castsByFid <fid> - Get the list of casts by fid
      castsByParent <fid> <tsHash> - Get the list of casts by parent
      castsByMention <userId> - Get the list of casts by mention`;
  }

  castByFidAndHash = async (fid: number, hash: Uint8Array): Promise<HubError | Message> => {
    const result = await this.rpcClient.getCast(CastId.create({ fid, hash }));
    return result.match<HubError | Message>(
      (cast) => {
        return cast;
      },
      (err: HubError) => {
        return err;
      }
    );
  };

  castsByFid = async (fid: number): Promise<HubError | Message[]> => {
    const result = await this.rpcClient.getCastsByFid(FidRequest.create({ fid }));
    return result.match<HubError | Message[]>(
      (casts) => {
        return casts.messages;
      },
      (err: HubError) => {
        return err;
      }
    );
  };

  castsByParent = async (fid: number, hash: Uint8Array): Promise<HubError | Message[]> => {
    const result = await this.rpcClient.getCastsByParent(CastId.create({ fid, hash }));
    return result.match<HubError | Message[]>(
      (casts) => {
        return casts.messages;
      },
      (err: HubError) => {
        return err;
      }
    );
  };

  castsByMention = async (userId: number): Promise<HubError | Message[]> => {
    const result = await this.rpcClient.getCastsByMention(FidRequest.create({ fid: userId }));
    return result.match<HubError | Message[]>(
      (casts) => {
        return casts.messages;
      },
      (err: HubError) => {
        return err;
      }
    );
  };
}
