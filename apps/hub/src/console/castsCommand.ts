import { CastIdT, UserIdT } from '~/../../../packages/flatbuffers/dist';
import { hexStringToBytes, HubError } from '~/../../../packages/utils/dist';
import MessageModel from '~/flatbuffers/models/messageModel';
import HubRpcClient from '~/rpc/client';

export class CastsCommand {
  constructor(private readonly rpcClient: HubRpcClient) {}

  castByFidAndHash = async (fid: string, tsHash: string): Promise<string | MessageModel> => {
    const fidBytes = hexStringToBytes(fid);
    if (fidBytes.isErr()) {
      return JSON.stringify(fidBytes.error);
    }

    const tsHashBytes = hexStringToBytes(tsHash);
    if (tsHashBytes.isErr()) {
      return JSON.stringify(tsHashBytes.error);
    }

    const result = await this.rpcClient.getCast(fidBytes._unsafeUnwrap(), tsHashBytes._unsafeUnwrap());
    return result.match<string | MessageModel>(
      (cast) => {
        const mm = new MessageModel(cast);
        return mm;
      },
      (err: HubError) => {
        return `${err}`;
      }
    );
  };

  castsByFid = async (fid: string): Promise<string | MessageModel[]> => {
    const fidBytes = hexStringToBytes(fid);
    if (fidBytes.isErr()) {
      return JSON.stringify(fidBytes.error);
    }

    const result = await this.rpcClient.getCastsByFid(fidBytes._unsafeUnwrap());
    return result.match<string | MessageModel[]>(
      (casts) => {
        return casts.map((cast) => new MessageModel(cast));
      },
      (err: HubError) => {
        return `${err}`;
      }
    );
  };

  castsByParent = async (fid: string, tsHash: string): Promise<string | MessageModel[]> => {
    const fidBytes = hexStringToBytes(fid);
    if (fidBytes.isErr()) {
      return JSON.stringify(fidBytes.error);
    }

    const tsHashBytes = hexStringToBytes(tsHash);
    if (tsHashBytes.isErr()) {
      return JSON.stringify(tsHashBytes.error);
    }

    const castIdT = new CastIdT(Array.from(tsHashBytes._unsafeUnwrap()), Array.from(tsHashBytes._unsafeUnwrap()));
    const result = await this.rpcClient.getCastsByParent(castIdT);
    return result.match<string | MessageModel[]>(
      (casts) => {
        return casts.map((cast) => new MessageModel(cast));
      },
      (err: HubError) => {
        return `${err}`;
      }
    );
  };

  castsByMention = async (userId: string): Promise<string | MessageModel[]> => {
    const userFidBytes = hexStringToBytes(userId);
    if (userFidBytes.isErr()) {
      return JSON.stringify(userFidBytes.error);
    }

    const userIdT = new UserIdT(Array.from(userFidBytes._unsafeUnwrap()));

    const result = await this.rpcClient.getCastsByMention(userIdT);
    return result.match<string | MessageModel[]>(
      (casts) => {
        return casts.map((cast) => new MessageModel(cast));
      },
      (err: HubError) => {
        return `${err}`;
      }
    );
  };
}
