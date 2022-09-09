import { AddressInfo } from 'net';
import { Err, err, Ok, Result } from 'neverthrow';
import { rejects } from 'assert';
import * as jayson from 'jayson/promise';
import CastSet from '~/sets/castSet';
import SignerSet from '~/sets/signerSet';

const VERSION = 0.1;

export type Port = number;

export enum RPCRequest {
  allCasts = 'allCasts',
  castsForFID = 'castsForFID',
  allFIDs = 'allFIDs',
  signersForFID = 'signersForFID',
}

export interface RPCHandler {
  allCasts(): Promise<Map<number, CastSet>>;
  castsForFID(fid: number): Promise<CastSet>;
  allFIDs(): Promise<Set<number>>;
  signersForFID(fid: number): Promise<SignerSet>;
}

const replacer = (key: any, value: any) => {
  if (value instanceof CastSet) {
    return CastSet.replacer(key, value);
  }
  if (value instanceof SignerSet) {
    return SignerSet.replacer(key, value);
  }
  return value;
};

const reviver = (key: any, value: any) => {
  if (value && value.$class === 'CastSet') {
    return CastSet.reviver(key, value);
  }
  if (value && value.$class === 'SignerSet') {
    return SignerSet.reviver(key, value);
  }
  return value;
};

const serverOpts = {
  version: VERSION,
  replacer,
  reviver,
};

export class RPCServer {
  _jsonServer!: jayson.Server;
  _handler!: RPCHandler;
  _tcpServer?: jayson.TcpServer;

  constructor(rpcHandler: RPCHandler) {
    this._handler = rpcHandler;
    this._jsonServer = new jayson.Server(
      {
        allCasts: new jayson.Method({
          handler: async function () {
            return err('Cannot return all casts...');
          },
        }),

        allFIDs: new jayson.Method({
          handler: async function () {
            // pass it back as an Array because JSON can serialize that
            return Array.from(await rpcHandler.allFIDs());
          },
        }),

        castsForFID: new jayson.Method({
          handler: async function (args: any) {
            return rpcHandler.castsForFID(args.fid);
          },
          params: Object,
        }),

        signersForFID: new jayson.Method({
          handler: async function (args: any) {
            return rpcHandler.signersForFID(args.fid);
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
  _tcpClient!: jayson.client;

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

  async castsForFID(fid: number): Promise<Result<CastSet, string>> {
    const response = await this._tcpClient.request(RPCRequest.castsForFID, { fid: fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async signersForFID(fid: number): Promise<Result<SignerSet, string>> {
    const response = await this._tcpClient.request(RPCRequest.signersForFID, { fid: fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async allFIDs(): Promise<Result<Set<number>, string>> {
    const response = await this._tcpClient.request(RPCRequest.allFIDs, {});
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(new Set(response.result));
  }
}
