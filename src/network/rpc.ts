import { AddressInfo } from 'net';
import { Err, Ok, Result } from 'neverthrow';
import { rejects } from 'assert';
import * as jayson from 'jayson/promise';
import CastSet from '~/sets/castSet';
import { Cast, Message, SignerMessage } from '~/types';

const VERSION = 0.1;

export type Port = number;

export enum RPCRequest {
  GetFids,
  GetAllCastsForFid,
  GetAllSignerMessagesForFid,
}

export interface RPCHandler {
  getFids(): Promise<Set<number>>;
  getAllCastsForFid(fid: number): Promise<Set<Cast>>;
  getAllSignerMessagesForFid(fid: number): Promise<Set<SignerMessage>>;
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
        [RPCRequest[RPCRequest.GetFids]]: new jayson.Method({
          handler: async function () {
            // pass it back as an Array because JSON can serialize that
            return await rpcHandler.getFids();
          },
        }),

        [RPCRequest[RPCRequest.GetAllCastsForFid]]: new jayson.Method({
          handler: async function (args: any) {
            return rpcHandler.getAllCastsForFid(args.fid);
          },
          params: Object,
        }),

        [RPCRequest[RPCRequest.GetAllSignerMessagesForFid]]: new jayson.Method({
          handler: async function (args: any) {
            return rpcHandler.getAllSignerMessagesForFid(args.fid);
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
          console.log('RPC Server listening : ', this.tcp?.address());
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
      // use the family?
      // family: address.family
      replacer,
      reviver,
    });
  }

  async getAllCastsForFid(fid: number): Promise<Result<CastSet, string>> {
    const response = await this._tcpClient.request(RPCRequest[RPCRequest.GetAllCastsForFid], { fid: fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async getAllSignerMessagesForFid(fid: number): Promise<Result<Array<Message>, string>> {
    const response = await this._tcpClient.request(RPCRequest[RPCRequest.GetAllSignerMessagesForFid], { fid: fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async getFids(): Promise<Result<Set<number>, string>> {
    const response = await this._tcpClient.request(RPCRequest[RPCRequest.GetFids], {});
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }
}
