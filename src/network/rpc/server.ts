import { rejects } from 'assert';
import jayson, { JSONRPCError } from 'jayson/promise';
import { replacer, reviver, RPCHandler, RPCRequest } from './interfaces';
import { ServerError } from '~/utils/errors';
import { logger } from '~/utils/logger';
import { AddressInfo } from 'net';
import { ipMultiAddrStrFromAddressInfo } from '~/utils/p2p';

const VERSION = 0.1;
const log = logger.child({ component: 'RPCServer' });

const serverOpts = {
  version: VERSION,
  replacer,
  reviver,
};

const rpcError = (code: number, message: string): JSONRPCError => {
  return { code, message };
};

export class RPCServer {
  private _jsonServer!: jayson.Server;
  private _tcpServer?: jayson.TcpServer;

  constructor(rpcHandler: RPCHandler) {
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

        [RPCRequest.SubmitMessage]: new jayson.Method({
          handler: async (args: any) => {
            const result = await rpcHandler.submitMessage(args.message);
            if (result.isErr()) throw rpcError(result.error.statusCode, result.error.message);
            return result.value;
          },
        }),

        [RPCRequest.SubmitIdRegistryEvent]: new jayson.Method({
          handler: async (args: any) => {
            if (!rpcHandler.submitIdRegistryEvent) {
              const fcError = new ServerError('Request not implemented on Server');
              throw rpcError(fcError.statusCode, fcError.message);
            }

            const result = await rpcHandler.submitIdRegistryEvent(args.event);
            if (result.isErr()) throw rpcError(result.error.statusCode, result.error.message);
            return result.value;
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
          log.info({ address: this.multiaddr, function: 'start' }, 'RPC server started');
          resolve();
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  /** Returns a multiaddr string representing this RPCServer */
  get multiaddr() {
    const addr = this.address;
    if (!addr) return undefined;
    return `${ipMultiAddrStrFromAddressInfo(addr)}/tcp/${addr.port}`;
  }

  get address() {
    const addr = this.tcp?.address();
    if (!addr) return undefined;
    // We always use IP sockets so this is a safe cast
    return addr as AddressInfo;
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.tcp?.close((err) => {
          log.info({ function: 'stop' }, `RPC server stopped}`);
          if (err) reject(err);
          else resolve();
        });
      } catch (err: any) {
        rejects(err);
      }
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private get tcp() {
    return this._tcpServer;
  }
}
