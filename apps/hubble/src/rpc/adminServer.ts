import {
  AdminServiceServer,
  AdminServiceService,
  Server as GrpcServer,
  ServerCredentials,
  getServer,
  HubAsyncResult,
  HubError,
  Empty,
} from "@farcaster/hub-nodejs";
import * as net from "net";
import { err, ok, ResultAsync } from "neverthrow";
import { HubInterface } from "../hubble.js";
import SyncEngine from "../network/sync/syncEngine.js";
import { authenticateUser, getRPCUsersFromAuthString, RpcUsers, toServiceError } from "./server.js";
import RocksDB from "../storage/db/rocksdb.js";
import { RootPrefix } from "../storage/db/types.js";
import Engine from "../storage/engine/index.js";
import { logger } from "../utils/logger.js";

const log = logger.child({ module: "rpc:admin" });
export const ADMIN_SERVER_PORT = 2284;

export default class AdminServer {
  private hub: HubInterface;
  private db: RocksDB;
  private engine: Engine;
  private syncEngine: SyncEngine;
  private grpcServer: GrpcServer;

  private rpcUsers: RpcUsers;

  constructor(hub: HubInterface, db: RocksDB, engine: Engine, syncEngine: SyncEngine, rpcAuth?: string) {
    this.hub = hub;
    this.db = db;
    this.engine = engine;
    this.syncEngine = syncEngine;

    this.grpcServer = getServer();
    this.grpcServer.addService(AdminServiceService, this.getImpl());

    this.rpcUsers = getRPCUsersFromAuthString(rpcAuth);

    if (this.rpcUsers.size > 0) {
      log.info({ num_users: this.rpcUsers.size }, "RPC auth enabled");
    }
  }

  async start(host = "127.0.0.1"): HubAsyncResult<undefined> {
    // Create a unix socket server
    net.createServer(() => {
      log.info("Admin server socket connected");
    });

    return new Promise((resolve) => {
      // The Admin server is only available on localhost
      this.grpcServer.bindAsync(`${host}:${ADMIN_SERVER_PORT}`, ServerCredentials.createInsecure(), (e, port) => {
        if (e) {
          log.error(`Failed to bind admin server to socket: ${e}`);
          resolve(err(new HubError("unavailable.network_failure", `Failed to bind admin server to socket: ${e}`)));
        } else {
          this.grpcServer.start();
          log.info({ host, port }, "Starting Admin server");
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
          const authResult = await authenticateUser(call.metadata, this.rpcUsers);
          if (authResult.isErr()) {
            logger.warn({ errMsg: authResult.error.message }, "rebuildSyncTrie failed");
            callback(
              toServiceError(
                new HubError("unauthenticated", `gRPC authentication failed: ${authResult.error.message}`),
              ),
            );
            return;
          }

          await this.syncEngine?.rebuildSyncTrie();
          callback(null, Empty.create());
        })();
      },

      deleteAllMessagesFromDb: (call, callback) => {
        (async () => {
          const authResult = await authenticateUser(call.metadata, this.rpcUsers);
          if (authResult.isErr()) {
            logger.warn({ errMsg: authResult.error.message }, "deleteAllMessagesFromDb failed");
            callback(
              toServiceError(
                new HubError("unauthenticated", `gRPC authentication failed: ${authResult.error.message}`),
              ),
            );
            return;
          }

          log.warn("Deleting all messages from DB");
          let deletedCount = 0;
          const prefixes = [
            RootPrefix.User,
            RootPrefix.CastsByMention,
            RootPrefix.CastsByParent,
            RootPrefix.ReactionsByTarget,
          ];
          for (const prefix of prefixes) {
            const prefixBuffer = Buffer.from([prefix]);
            await this.db.forEachIteratorByPrefix(prefixBuffer, async (key) => {
              const result = await ResultAsync.fromPromise(this.db.del(key as Buffer), (e) => e as HubError);
              result.match(
                () => {
                  deletedCount += 1;
                },
                (e) => {
                  log.error({ errCode: e.errCode }, `Failed to delete key: ${e.message}`);
                },
              );
            });
          }
          log.info(`Deleted ${deletedCount} keys from db`);

          // Rebuild the sync trie after deleting all messages
          await this.syncEngine?.rebuildSyncTrie();

          log.warn("Finished deleting all messages from DB");
          callback(null, Empty.create());
        })();
      },
      submitOnChainEvent: async (call, callback) => {
        const authResult = await authenticateUser(call.metadata, this.rpcUsers);
        if (authResult.isErr()) {
          logger.warn({ errMsg: authResult.error.message }, "submitOnChainEvent failed");
          callback(
            toServiceError(new HubError("unauthenticated", `gRPC authentication failed: ${authResult.error.message}`)),
          );
          return;
        }

        const onChainEvent = call.request;
        const result = await this.hub?.submitOnChainEvent(onChainEvent, "rpc");
        result?.match(
          () => {
            callback(null, onChainEvent);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
    };
  };
}
