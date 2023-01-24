import { CastIdT, UserIdT } from '@farcaster/flatbuffers';
import { hexStringToBytes, HubError } from '@farcaster/utils';
import MessageModel from '~/flatbuffers/models/messageModel';
import HubRpcClient from '~/rpc/client';
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

  castByFidAndHash = async (fid: string, tsHash: string): Promise<HubError | MessageModel> => {
    const fidBytes = hexStringToBytes(fid);
    if (fidBytes.isErr()) {
      return fidBytes.error;
    }

    const tsHashBytes = hexStringToBytes(tsHash);
    if (tsHashBytes.isErr()) {
      return tsHashBytes.error;
    }

    const result = await this.rpcClient.getCast(fidBytes._unsafeUnwrap(), tsHashBytes._unsafeUnwrap());
    return result.match<HubError | MessageModel>(
      (cast) => {
        const mm = new MessageModel(cast);
        return mm;
      },
      (err: HubError) => {
        return err;
      }
    );
  };

  castsByFid = async (fid: string): Promise<HubError | MessageModel[]> => {
    const fidBytes = hexStringToBytes(fid);
    if (fidBytes.isErr()) {
      return fidBytes.error;
    }

    const result = await this.rpcClient.getCastsByFid(fidBytes._unsafeUnwrap());
    return result.match<HubError | MessageModel[]>(
      (casts) => {
        return casts.map((cast) => new MessageModel(cast));
      },
      (err: HubError) => {
        return err;
      }
    );
  };

  castsByParent = async (fid: string, tsHash: string): Promise<HubError | MessageModel[]> => {
    const fidBytes = hexStringToBytes(fid);
    if (fidBytes.isErr()) {
      return fidBytes.error;
    }

    const tsHashBytes = hexStringToBytes(tsHash);
    if (tsHashBytes.isErr()) {
      return tsHashBytes.error;
    }

    const castIdT = new CastIdT(Array.from(tsHashBytes._unsafeUnwrap()), Array.from(tsHashBytes._unsafeUnwrap()));
    const result = await this.rpcClient.getCastsByParent(castIdT);
    return result.match<HubError | MessageModel[]>(
      (casts) => {
        return casts.map((cast) => new MessageModel(cast));
      },
      (err: HubError) => {
        return err;
      }
    );
  };

  castsByMention = async (userId: string): Promise<HubError | MessageModel[]> => {
    const userFidBytes = hexStringToBytes(userId);
    if (userFidBytes.isErr()) {
      return userFidBytes.error;
    }

    const userIdT = new UserIdT(Array.from(userFidBytes._unsafeUnwrap()));

    const result = await this.rpcClient.getCastsByMention(userIdT);
    return result.match<HubError | MessageModel[]>(
      (casts) => {
        return casts.map((cast) => new MessageModel(cast));
      },
      (err: HubError) => {
        return err;
      }
    );
  };
}
