import { rejects } from 'assert';
import jayson, { JSONRPCError } from 'jayson/promise';
import { replacer, reviver, RPCHandler, RPCRequest } from './interfaces';
import { ServerError } from '~/utils/errors';

const VERSION = 0.1;

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

        [RPCRequest.SubmitIDRegistryEvent]: new jayson.Method({
          handler: async (args: any) => {
            if (!rpcHandler.submitIDRegistryEvent) {
              const fcError = new ServerError('Request not implemented on Server');
              throw rpcError(fcError.statusCode, fcError.message);
            }

            const result = await rpcHandler.submitIDRegistryEvent(args.event);
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
          console.log('RPC server started:', this.tcp?.address());
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
          console.log('RPC server stopped');
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
