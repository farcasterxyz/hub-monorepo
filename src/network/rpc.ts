import { AddressInfo } from 'net';
import { Err, Ok, Result } from 'neverthrow';
import { rejects } from 'assert';
import jayson, { JSONRPCError } from 'jayson/promise';
import { Cast, Follow, IDRegistryEvent, Message, Reaction, SignerMessage, Verification } from '~/types';
import { FarcasterError } from '~/errors';

const VERSION = 0.1;

export type Port = number;

export enum RPCRequest {
  GetUsers = 'getUsers',
  GetAllCastsByUser = 'getAllCastsByUser',
  GetAllSignerMessagesByUser = 'getAllSignerMessagesByUser',
  GetAllReactionsByUser = 'getAllReactionsByUser',
  GetAllFollowsByUser = 'getAllFollowsByUser',
  GetAllVerificationsByUser = 'getAllVerificationsByUser',
  GetCustodyEventByUser = 'getCustodyEventByUser',
}

export interface RPCHandler {
  getUsers(): Promise<Set<number>>;
  getAllCastsByUser(fid: number): Promise<Set<Cast>>;
  getAllSignerMessagesByUser(fid: number): Promise<Set<SignerMessage>>;
  getAllReactionsByUser(fid: number): Promise<Set<Reaction>>;
  getAllFollowsByUser(fid: number): Promise<Set<Follow>>;
  getAllVerificationsByUser(fid: number): Promise<Set<Verification>>;
  getCustodyEventByUser(fid: number): Promise<Result<IDRegistryEvent, FarcasterError>>;
  // getCustodyEventByUser(fid: number): Promise<IDRegistryEvent>;
}

const replacer = (key: any, value: any) => {
  // convert all sets to arrays
  if (value instanceof Set) {
    return { $class: 'Set', $asArray: Array.from(value) };
  }
  return value;
};

const reviver = (key: any, value: any) => {
  if (value && value.$class === 'Set') {
    return new Set(value.$asArray);
  }
  return value;
};

const serverOpts = {
  version: VERSION,
  replacer,
  reviver,
};

export const rpcError = (code: number, message: string): JSONRPCError => {
  return { code, message };
};

export class RPCServer {
  private _jsonServer!: jayson.Server;
  private _handler!: RPCHandler;
  private _tcpServer?: jayson.TcpServer;

  constructor(rpcHandler: RPCHandler) {
    this._handler = rpcHandler;
    this._jsonServer = new jayson.Server(
      {
        [RPCRequest.GetUsers]: new jayson.Method({
          handler: async () => {
            return await rpcHandler.getUsers();
          },
        }),

        [RPCRequest.GetAllCastsByUser]: new jayson.Method({
          handler: (args: any) => {
            return rpcHandler.getAllCastsByUser(args.fid);
          },
          params: Object,
        }),

        [RPCRequest.GetAllSignerMessagesByUser]: new jayson.Method({
          handler: async (args: any) => {
            return rpcHandler.getAllSignerMessagesByUser(args.fid);
          },
        }),

        [RPCRequest.GetAllReactionsByUser]: new jayson.Method({
          handler: async (args: any) => {
            return rpcHandler.getAllReactionsByUser(args.fid);
          },
        }),

        [RPCRequest.GetAllFollowsByUser]: new jayson.Method({
          handler: async (args: any) => {
            return rpcHandler.getAllFollowsByUser(args.fid);
          },
        }),

        [RPCRequest.GetAllVerificationsByUser]: new jayson.Method({
          handler: async (args: any) => {
            return rpcHandler.getAllVerificationsByUser(args.fid);
          },
        }),

        [RPCRequest.GetCustodyEventByUser]: new jayson.Method({
          handler: async (args: any) => {
            const result = await rpcHandler.getCustodyEventByUser(args.fid);
            if (result.isErr()) throw rpcError(result.error.statusCode, result.error.message);
            return result.value;
          },
          params: Object,
        }),
      },
      serverOpts
    );
  }

  async start(port = 0): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // start the tcp server
        this._tcpServer = this._jsonServer.tcp().listen(port, () => {
          resolve();
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  get address() {
    return this.tcp?.address();
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.tcp?.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } catch (err: any) {
        rejects(err);
      }
    });
  }

  // Private methods

  private get tcp() {
    return this._tcpServer;
  }
}

export class RPCClient {
  private _tcpClient!: jayson.client;

  constructor(address: AddressInfo) {
    this._tcpClient = jayson.Client.tcp({
      port: address.port,
      host: address.address,
      // TODO use the family?
      // family: address.family
      replacer,
      reviver,
    });
  }

  async getUsers(): Promise<Result<Set<number>, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetUsers, {});
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async getAllCastsByUser(fid: number): Promise<Result<Set<Cast>, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetAllCastsByUser, { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async getAllSignerMessagesByUser(fid: number): Promise<Result<Set<Message>, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetAllSignerMessagesByUser, { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async getAllReactionsByUser(fid: number): Promise<Result<Set<Reaction>, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetAllReactionsByUser, { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }
  async getAllFollowsByUser(fid: number): Promise<Result<Set<Follow>, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetAllFollowsByUser, { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }
  async getAllVerificationsByUser(fid: number): Promise<Result<Set<Verification>, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetAllVerificationsByUser, { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async getCustodyEventByUser(fid: number): Promise<Result<IDRegistryEvent, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetCustodyEventByUser, { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }
}
