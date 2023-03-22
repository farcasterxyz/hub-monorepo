import * as protobufs from '@farcaster/protobufs';
import {
  AdminServiceServer,
  AdminServiceService,
  Server as GrpcServer,
  ServerCredentials,
  getServer,
} from '@farcaster/protobufs';
import { HubAsyncResult, HubError } from '@farcaster/utils';
import * as net from 'net';
import { err, ok } from 'neverthrow';
import { HubInterface } from '~/hubble';
import SyncEngine from '~/network/sync/syncEngine';
import { authenticateUser, toServiceError } from '~/rpc/server';
import RocksDB from '~/storage/db/rocksdb';
import Engine from '~/storage/engine';
import { logger } from '~/utils/logger';

const log = logger.child({ module: 'rpc:admin' });
export const ADMIN_SERVER_PORT = 2284;

export default class AdminServer {
  private hub: HubInterface;
  private db: RocksDB;
  private engine: Engine;
  private syncEngine: SyncEngine;
  private grpcServer: GrpcServer;

  private rpcAuthUser: string | undefined;
  private rpcAuthPass: string | undefined;

  constructor(hub: HubInterface, db: RocksDB, engine: Engine, syncEngine: SyncEngine, rpcAuth?: string) {
    this.hub = hub;
    this.db = db;
    this.engine = engine;
    this.syncEngine = syncEngine;

    this.grpcServer = getServer();
    this.grpcServer.addService(AdminServiceService, this.getImpl());

    const [rpcAuthUser, rpcAuthPass] = rpcAuth?.split(':') ?? [undefined, undefined];
    if (rpcAuthUser && rpcAuthPass) {
      this.rpcAuthUser = rpcAuthUser;
      this.rpcAuthPass = rpcAuthPass;

      log.info({ username: this.rpcAuthUser }, 'Admin RPC auth enabled');
    }
  }

  async start(host = '127.0.0.1'): HubAsyncResult<undefined> {
    // Create a unix socket server
    net.createServer(() => {
      log.info('Admin server socket connected');
    });

    return new Promise((resolve) => {
      // The Admin server is only available on localhost
      this.grpcServer.bindAsync(`${host}:${ADMIN_SERVER_PORT}`, ServerCredentials.createInsecure(), (e, port) => {
        if (e) {
          log.error(`Failed to bind admin server to socket: ${e}`);
          resolve(err(new HubError('unavailable.network_failure', `Failed to bind admin server to socket: ${e}`)));
        } else {
          this.grpcServer.start();
          log.info({ host, port }, 'Starting Admin server');
          resolve(ok(undefined));
        }
      });
    });
  }

  async stop(force = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (force) {
        this.grpcServer.forceShutdown();
        resolve();
      } else {
        this.grpcServer.tryShutdown((e) => {
          if (e) {
            log.error(`Failed to shutdown admin server: ${e}`);
            reject(e);
          } else {
            resolve();
          }
        });
      }
    });
  }

  getImpl = (): AdminServiceServer => {
    return {
      rebuildSyncTrie: (call, callback) => {
        (async () => {
          const authResult = await authenticateUser(call.metadata, this.rpcAuthUser, this.rpcAuthPass);
          if (authResult.isErr()) {
            logger.warn({ errMsg: authResult.error.message }, 'rebuildSyncTrie failed');
            callback(toServiceError(new HubError('unauthenticated', 'User is not authenticated')));
            return;
          }

          await this.syncEngine?.rebuildSyncTrie();
          callback(null, protobufs.Empty.create());
        })();
      },

      deleteAllMessagesFromDb: (call, callback) => {
        (async () => {
          const authResult = await authenticateUser(call.metadata, this.rpcAuthUser, this.rpcAuthPass);
          if (authResult.isErr()) {
            logger.warn({ errMsg: authResult.error.message }, 'deleteAllMessagesFromDb failed');
            callback(toServiceError(new HubError('unauthenticated', 'User is not authenticated')));
            return;
          }

          log.warn('Deleting all messages from DB');
          let done = false;
          do {
            const toDelete: Buffer[] = [];
            await this.engine?.forEachMessage(async (_message, key) => {
              toDelete.push(key);
              if (toDelete.length >= 10_000) {
                return true;
              }
              return false;
            });

            // If there is nothing remaining to be deleted, we are done
            if (toDelete.length === 0) {
              done = true;
              break;
            }

            // Delete in batches of 10_000
            const txn = this.db?.transaction();
            toDelete.forEach((key) => {
              txn?.del(key);
            });
            await this.db?.commit(txn);
            log.warn(`Deleted ${toDelete.length} messages from DB`);
          } while (!done);

          // Rebuild the sync trie after deleting all messages
          await this.syncEngine?.rebuildSyncTrie();

          log.warn('Finished deleting all messages from DB');
          callback(null, protobufs.Empty.create());
        })();
      },

      submitIdRegistryEvent: async (call, callback) => {
        const authResult = await authenticateUser(call.metadata, this.rpcAuthUser, this.rpcAuthPass);
        if (authResult.isErr()) {
          logger.warn({ errMsg: authResult.error.message }, 'submitIdRegistryEvent failed');
          callback(toServiceError(new HubError('unauthenticated', 'User is not authenticated')));
          return;
        }

        const idRegistryEvent = call.request;
        const result = await this.hub?.submitIdRegistryEvent(idRegistryEvent, 'rpc');
        result?.match(
          () => {
            callback(null, idRegistryEvent);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },

      submitNameRegistryEvent: async (call, callback) => {
        const authResult = await authenticateUser(call.metadata, this.rpcAuthUser, this.rpcAuthPass);
        if (authResult.isErr()) {
          logger.warn({ errMsg: authResult.error.message }, 'submitNameRegistryEvent failed');
          callback(toServiceError(new HubError('unauthenticated', 'User is not authenticated')));
          return;
        }

        const nameRegistryEvent = call.request;
        const result = await this.hub?.submitNameRegistryEvent(nameRegistryEvent, 'rpc');
        result?.match(
          () => {
            callback(null, nameRegistryEvent);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
    };
  };
}
