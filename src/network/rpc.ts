import { AddressInfo } from 'net';
import { Err, Ok, Result } from 'neverthrow';
import { rejects } from 'assert';
import * as jayson from 'jayson/promise';
import { Cast, Follow, Message, Reaction, SignerMessage, Verification } from '~/types';

const VERSION = 0.1;

export type Port = number;

export enum RPCRequest {
  GetUsers,
  GetAllCastsByUser,
  GetAllSignerMessagesByUser,
  GetAllReactionsByUser,
  GetAllFollowsByUser,
  GetAllVerificationsByUser,
}

export interface RPCHandler {
  getUsers(): Promise<Set<number>>;
  getAllCastsByUser(fid: number): Promise<Set<Cast>>;
  getAllSignerMessagesByUser(fid: number): Promise<Set<SignerMessage>>;
  getAllReactionsByUser(fid: number): Promise<Set<Reaction>>;
  getAllFollowsByUser(fid: number): Promise<Set<Follow>>;
  getAllVerificationsByUser(fid: number): Promise<Set<Verification>>;
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

export class RPCServer {
  private _jsonServer!: jayson.Server;
  private _handler!: RPCHandler;
  private _tcpServer?: jayson.TcpServer;

  constructor(rpcHandler: RPCHandler) {
    this._handler = rpcHandler;
    this._jsonServer = new jayson.Server(
      {
        [RPCRequest[RPCRequest.GetUsers]]: new jayson.Method({
          handler: async function () {
            return await rpcHandler.getUsers();
          },
        }),

        [RPCRequest[RPCRequest.GetAllCastsByUser]]: new jayson.Method({
          handler: async function (args: any) {
            return rpcHandler.getAllCastsByUser(args.fid);
          },
          params: Object,
        }),

        [RPCRequest[RPCRequest.GetAllSignerMessagesByUser]]: new jayson.Method({
          handler: async function (args: any) {
            return rpcHandler.getAllSignerMessagesByUser(args.fid);
          },
        }),

        [RPCRequest[RPCRequest.GetAllReactionsByUser]]: new jayson.Method({
          handler: async function (args: any) {
            return rpcHandler.getAllReactionsByUser(args.fid);
          },
        }),

        [RPCRequest[RPCRequest.GetAllFollowsByUser]]: new jayson.Method({
          handler: async function (args: any) {
            return rpcHandler.getAllFollowsByUser(args.fid);
          },
        }),

        [RPCRequest[RPCRequest.GetAllVerificationsByUser]]: new jayson.Method({
          handler: async function (args: any) {
            return rpcHandler.getAllVerificationsByUser(args.fid);
          },
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

  async getFids(): Promise<Result<Set<number>, string>> {
    const response = await this._tcpClient.request(RPCRequest[RPCRequest.GetUsers], {});
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async getAllCastsByUser(fid: number): Promise<Result<Set<Cast>, string>> {
    const response = await this._tcpClient.request(RPCRequest[RPCRequest.GetAllCastsByUser], { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async getAllSignerMessagesByUser(fid: number): Promise<Result<Set<Message>, string>> {
    const response = await this._tcpClient.request(RPCRequest[RPCRequest.GetAllSignerMessagesByUser], { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async getAllReactionsByUser(fid: number): Promise<Result<Set<Reaction>, string>> {
    const response = await this._tcpClient.request(RPCRequest[RPCRequest.GetAllReactionsByUser], { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }
  async getAllFollowsByUser(fid: number): Promise<Result<Set<Follow>, string>> {
    const response = await this._tcpClient.request(RPCRequest[RPCRequest.GetAllFollowsByUser], { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }
  async getAllVerificationsByUser(fid: number): Promise<Result<Set<Verification>, string>> {
    const response = await this._tcpClient.request(RPCRequest[RPCRequest.GetAllVerificationsByUser], { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }
}
