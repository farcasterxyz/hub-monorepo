import {
  CastAddMessage,
  CastId,
  CastRemoveMessage,
  FidsResponse,
  getServer,
  HubAsyncResult,
  HubError,
  HubEvent,
  HubEventType,
  HubInfoResponse,
  HubServiceServer,
  HubServiceService,
  IdRegistryEvent,
  LinkAddMessage,
  LinkRemoveMessage,
  Message,
  MessagesResponse,
  Metadata,
  NameRegistryEvent,
  ReactionAddMessage,
  ReactionRemoveMessage,
  Server as GrpcServer,
  ServerCredentials,
  ServiceError,
  SignerAddMessage,
  SignerRemoveMessage,
  status,
  SyncIds,
  DbStats,
  TrieNodeMetadataResponse,
  TrieNodeSnapshotResponse,
  UserDataAddMessage,
  VerificationAddEthAddressMessage,
  VerificationRemoveMessage,
  SyncStatusResponse,
  SyncStatus,
  UserNameProof,
  UsernameProofsResponse,
} from "@farcaster/hub-nodejs";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { APP_NICKNAME, APP_VERSION, HubInterface } from "../hubble.js";
import { GossipNode } from "../network/p2p/gossipNode.js";
import { NodeMetadata } from "../network/sync/merkleTrie.js";
import SyncEngine from "../network/sync/syncEngine.js";
import Engine from "../storage/engine/index.js";
import { MessagesPage } from "../storage/stores/types.js";
import { logger } from "../utils/logger.js";
import { addressInfoFromParts, extractIPAddress } from "../utils/p2p.js";
import { RateLimiterAbstract, RateLimiterMemory } from "rate-limiter-flexible";
import {
  BufferedStreamWriter,
  STREAM_MESSAGE_BUFFER_SIZE,
  SLOW_CLIENT_GRACE_PERIOD_MS,
} from "./bufferedStreamWriter.js";
import { sleep } from "../utils/crypto.js";
import { RentRegistryEventsResponse } from "@farcaster/hub-nodejs";

const HUBEVENTS_READER_TIMEOUT = 1 * 60 * 60 * 1000; // 1 hour

export const SUBSCRIBE_PERIP_LIMIT = 4; // Max 4 subscriptions per IP
export const SUBSCRIBE_GLOBAL_LIMIT = 4096; // Max 4096 subscriptions globally

export type RpcUsers = Map<string, string[]>;

const log = logger.child({ component: "rpcServer" });

export const rateLimitByIp = async (ip: string, limiter: RateLimiterAbstract): HubAsyncResult<boolean> => {
  // Get the IP part of the address
  const ipPart = ip.split(":")[0] ?? "";

  try {
    await limiter.consume(ipPart);
    return ok(true);
  } catch (e) {
    return err(new HubError("unavailable", "Too many requests"));
  }
};

// Check if the user is authenticated via the metadata
export const authenticateUser = async (metadata: Metadata, rpcUsers: RpcUsers): HubAsyncResult<boolean> => {
  // If there is no auth user/pass, we don't need to authenticate
  if (rpcUsers.size === 0) {
    return ok(true);
  }

  if (metadata.get("authorization")) {
    const authHeader = metadata.get("authorization")[0] as string;
    if (!authHeader) {
      return err(new HubError("unauthenticated", "Authorization header is empty"));
    }

    const encodedCredentials = authHeader.replace("Basic ", "");
    const decodedCredentials = Buffer.from(encodedCredentials, "base64").toString("utf-8");
    const [username, password] = decodedCredentials.split(":");
    if (!username || !password) {
      return err(new HubError("unauthenticated", `Invalid username: ${username}`));
    }

    // See if username and password match one of rpcUsers
    const allowedPasswords = rpcUsers.get(username);
    if (!allowedPasswords) {
      return err(new HubError("unauthenticated", `Invalid username: ${username}`));
    }

    if (!allowedPasswords.includes(password)) {
      return err(new HubError("unauthenticated", `Invalid password for user: ${username}`));
    }

    return ok(true);
  }
  return err(new HubError("unauthenticated", "No authorization header"));
};

export const toServiceError = (err: HubError): ServiceError => {
  let grpcCode: number;
  if (err.errCode === "unauthenticated") {
    grpcCode = status.UNAUTHENTICATED;
  } else if (err.errCode === "unauthorized") {
    grpcCode = status.PERMISSION_DENIED;
  } else if (
    err.errCode === "bad_request" ||
    err.errCode === "bad_request.parse_failure" ||
    err.errCode === "bad_request.validation_failure" ||
    err.errCode === "bad_request.invalid_param" ||
    err.errCode === "bad_request.conflict" ||
    err.errCode === "bad_request.duplicate" ||
    err.errCode === "bad_request.prunable"
  ) {
    grpcCode = status.INVALID_ARGUMENT;
  } else if (err.errCode === "not_found") {
    grpcCode = status.NOT_FOUND;
  } else if (
    err.errCode === "unavailable" ||
    err.errCode === "unavailable.network_failure" ||
    err.errCode === "unavailable.storage_failure"
  ) {
    grpcCode = status.UNAVAILABLE;
  } else {
    grpcCode = status.UNKNOWN;
  }
  const metadata = new Metadata();
  metadata.set("errCode", err.errCode);
  return Object.assign(err, {
    code: grpcCode,
    details: err.message,
    metadata,
  });
};

const messagesPageToResponse = ({ messages, nextPageToken }: MessagesPage<Message>) => {
  return MessagesResponse.create({
    messages,
    nextPageToken: nextPageToken ?? new Uint8Array(),
  });
};

export const getRPCUsersFromAuthString = (rpcAuth?: string): Map<string, string[]> => {
  if (!rpcAuth) {
    return new Map();
  }

  // Split up the auth string by commas
  const rpcAuthUsers = rpcAuth?.split(",") ?? [];

  // Create a map of username to all the passwords for that user
  const rpcUsers = new Map();
  rpcAuthUsers.forEach((rpcAuthUser) => {
    const [username, password] = rpcAuthUser.split(":");
    if (username && password) {
      const passwords = rpcUsers.get(username) ?? [];
      passwords.push(password);
      rpcUsers.set(username, passwords);
    }
  });

  return rpcUsers;
};

/**
 * Limit the number of simultaneous connections to the RPC server by
 * a single IP address.
 */
class IpConnectionLimiter {
  private perIpLimit: number;
  private globalLimit: number;

  private ipConnections: Map<string, number>;
  private totalConnections: number;

  constructor(perIpLimit: number, globalLimit: number) {
    this.ipConnections = new Map();

    this.perIpLimit = perIpLimit;
    this.globalLimit = globalLimit;
    this.totalConnections = 0;
  }

  public addConnection(peerString: string): Result<boolean, Error> {
    // Get the IP part of the address
    const ip = extractIPAddress(peerString) ?? "unknown";

    const connections = this.ipConnections.get(ip) ?? 0;
    if (connections >= this.perIpLimit) {
      return err(new Error(`Too many connections from this IP: ${ip}`));
    }

    if (this.totalConnections >= this.globalLimit) {
      return err(new Error("Too many connections to this server"));
    }

    this.ipConnections.set(ip, connections + 1);
    this.totalConnections += 1;
    return ok(true);
  }

  public removeConnection(peerString: string) {
    // Get the IP part of the address
    const ip = extractIPAddress(peerString) ?? "unknown";

    const connections = this.ipConnections.get(ip) ?? 0;
    if (connections > 0) {
      this.ipConnections.set(ip, connections - 1);
      this.totalConnections -= 1;
    }
  }

  clear() {
    this.ipConnections.clear();
    this.totalConnections = 0;
  }
}

export default class Server {
  private hub: HubInterface | undefined;
  private engine: Engine | undefined;
  private syncEngine: SyncEngine | undefined;
  private gossipNode: GossipNode | undefined;

  private grpcServer: GrpcServer;
  private listenIp: string;
  private port: number;

  private incomingConnections = 0;

  private rpcUsers: RpcUsers;
  private submitMessageRateLimiter: RateLimiterMemory;
  private syncSnapshotRateLimiter: RateLimiterMemory;
  private subscribeIpLimiter = new IpConnectionLimiter(SUBSCRIBE_PERIP_LIMIT, SUBSCRIBE_GLOBAL_LIMIT);

  constructor(
    hub?: HubInterface,
    engine?: Engine,
    syncEngine?: SyncEngine,
    gossipNode?: GossipNode,
    rpcAuth?: string,
    rpcRateLimit?: number,
  ) {
    this.hub = hub;
    this.engine = engine;
    this.syncEngine = syncEngine;
    this.gossipNode = gossipNode;

    this.grpcServer = getServer();

    this.listenIp = "";
    this.port = 0;

    this.rpcUsers = getRPCUsersFromAuthString(rpcAuth);

    if (this.rpcUsers.size > 0) {
      log.info({ num_users: this.rpcUsers.size }, "RPC auth enabled");
    }

    this.grpcServer.addService(HubServiceService, this.getImpl());

    // Submit message are rate limited by default to 20k per minute
    let rateLimitPerMinute = 20_000;
    if (rpcRateLimit !== undefined && rpcRateLimit >= 0) {
      rateLimitPerMinute = rpcRateLimit;
    }
    log.info({ rpcRateLimit }, "RPC rate limit enabled");

    this.submitMessageRateLimiter = new RateLimiterMemory({
      points: rateLimitPerMinute,
      duration: 60,
    });

    // Rate limit sync status to 2 per minute
    this.syncSnapshotRateLimiter = new RateLimiterMemory({
      points: 2,
      duration: 60,
    });
  }

  async start(ip = "0.0.0.0", port = 0): Promise<number> {
    return new Promise((resolve, reject) => {
      this.grpcServer.bindAsync(`${ip}:${port}`, ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
          logger.error({ component: "gRPC Server", err }, "Failed to start gRPC Server");
          reject(err);
        } else {
          this.grpcServer.start();

          this.listenIp = ip;
          this.port = port;

          logger.info({ component: "gRPC Server", address: this.address }, "Starting gRPC Server");
          resolve(port);
        }
      });
    });
  }

  async stop(force = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (force) {
        this.grpcServer.forceShutdown();
        log.info({ component: "gRPC Server" }, "Force shutdown succeeded");
        resolve();
      } else {
        this.grpcServer.tryShutdown((err) => {
          if (err) {
            log.error({ component: "gRPC Server" }, `Shutdown failed: ${err}`);
            reject(err);
          } else {
            log.info({ component: "gRPC Server" }, "Shutdown succeeded");
            resolve();
          }
        });
      }
    });
  }

  get address() {
    const addr = addressInfoFromParts(this.listenIp, this.port);
    return addr;
  }

  get auth() {
    return this.rpcUsers;
  }

  get listenPort() {
    return this.port;
  }

  public hasInboundConnections() {
    return this.incomingConnections > 0;
  }

  public clearRateLimiters() {
    this.subscribeIpLimiter.clear();
  }

  getImpl = (): HubServiceServer => {
    return {
      getInfo: (call, callback) => {
        (async () => {
          const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
          log.debug({ method: "getInfo", req: call.request }, `RPC call from ${peer}`);

          const info = HubInfoResponse.create({
            version: APP_VERSION,
            isSyncing: !this.syncEngine?.isSyncing(),
            nickname: APP_NICKNAME,
            rootHash: (await this.syncEngine?.trie.rootHash()) ?? "",
          });

          if (call.request.dbStats && this.syncEngine) {
            const stats = await this.syncEngine.getDbStats();
            info.dbStats = DbStats.create({
              numMessages: stats?.numMessages,
              numFidEvents: stats?.numFids,
              numFnameEvents: stats?.numFnames,
            });
          }

          callback(null, info);
        })();
      },
      getSyncStatus: (call, callback) => {
        (async () => {
          const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
          log.debug({ method: "getSyncStatus", req: call.request }, `RPC call from ${peer}`);

          if (!this.gossipNode || !this.syncEngine || !this.hub) {
            callback(toServiceError(new HubError("bad_request", "Hub isn't initialized")));
            return;
          }
          let peersToCheck: string[];
          if (call.request.peerId && call.request.peerId.length > 0) {
            peersToCheck = [call.request.peerId];
          } else {
            peersToCheck = this.gossipNode.allPeerIds();
          }

          const response = SyncStatusResponse.create({
            isSyncing: false,
            syncStatus: [],
          });

          for (const peerId of peersToCheck) {
            const statusResult = await this.syncEngine.getSyncStatusForPeer(peerId, this.hub);
            if (statusResult.isOk()) {
              const status = statusResult.value;
              response.isSyncing = status.isSyncing;
              const peerStatus = SyncStatus.create({
                peerId,
                inSync: status.inSync,
                shouldSync: status.shouldSync,
                lastBadSync: status.lastBadSync,
                divergencePrefix: status.divergencePrefix,
                divergenceSecondsAgo: status.divergenceSecondsAgo,
                ourMessages: status.ourSnapshot.numMessages,
                theirMessages: status.theirSnapshot.numMessages,
              });
              response.syncStatus.push(peerStatus);
            }
          }

          callback(null, response);
        })();
      },
      getAllSyncIdsByPrefix: (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getAllSyncIdsByPrefix", req: call.request }, `RPC call from ${peer}`);

        const request = call.request;

        (async () => {
          const syncIdsResponse = await this.syncEngine?.getAllSyncIdsByPrefix(request.prefix);
          callback(null, SyncIds.create({ syncIds: syncIdsResponse ?? [] }));
        })();
      },
      getAllMessagesBySyncIds: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getAllMessagesBySyncIds", req: call.request }, `RPC call from ${peer}`);

        const request = call.request;

        const messagesResult = await this.syncEngine?.getAllMessagesBySyncIds(request.syncIds);
        messagesResult?.match(
          (messages) => {
            // Check the messages for corruption. If a message is blank, that means it was present
            // in our sync trie, but the DB couldn't find it. So remove it from the sync Trie.
            const corruptedMessages = messages.filter(
              (message) => message.data === undefined || message.hash.length === 0,
            );

            if (corruptedMessages.length > 0) {
              log.warn({ num: corruptedMessages.length }, "Found corrupted messages, rebuilding some syncIDs");
              // Don't wait for this to finish, just return the messages we have.
              this.syncEngine?.rebuildSyncIds(request.syncIds);
              // rome-ignore lint/style/noParameterAssign: legacy code, avoid using ignore for new code
              messages = messages.filter((message) => message.data !== undefined && message.hash.length > 0);
            }

            callback(null, MessagesResponse.create({ messages }));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getSyncMetadataByPrefix: (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getSyncMetadataByPrefix", req: call.request }, `RPC call from ${peer}`);

        const toTrieNodeMetadataResponse = (metadata?: NodeMetadata): TrieNodeMetadataResponse => {
          const childrenTrie = [];

          if (!metadata) {
            return TrieNodeMetadataResponse.create({});
          }

          if (metadata.children) {
            for (const [, child] of metadata.children) {
              childrenTrie.push(
                TrieNodeMetadataResponse.create({
                  prefix: child.prefix,
                  numMessages: child.numMessages,
                  hash: child.hash,
                  children: [],
                }),
              );
            }
          }

          const metadataResponse = TrieNodeMetadataResponse.create({
            prefix: metadata.prefix,
            numMessages: metadata.numMessages,
            hash: metadata.hash,
            children: childrenTrie,
          });

          return metadataResponse;
        };

        const request = call.request;

        (async () => {
          const metadata = await this.syncEngine?.getTrieNodeMetadata(request.prefix);
          callback(null, toTrieNodeMetadataResponse(metadata));
        })();
      },
      getSyncSnapshotByPrefix: (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.info(
          { method: "getSyncSnapshotByPrefix", req: call.request, reqStr: JSON.stringify(call.request) },
          `RPC call from ${peer}`,
        );

        // If someone is asking for our sync snapshot, that means we're getting incoming
        // connections
        this.incomingConnections += 1;

        const request = call.request;

        (async () => {
          const rateLimitResult = await rateLimitByIp(peer, this.syncSnapshotRateLimiter);
          if (rateLimitResult.isErr()) {
            callback(toServiceError(rateLimitResult.error));
            logger.warn({ err: rateLimitResult.error }, `RPC call: Rate limit exceeded for ${peer}`);
            return;
          }

          const rootHash = (await this.syncEngine?.trie.rootHash()) ?? "";
          const snapshot = await this.syncEngine?.getSnapshotByPrefix(request.prefix);
          snapshot?.match(
            (snapshot) => {
              const snapshotResponse = TrieNodeSnapshotResponse.create({
                prefix: snapshot.prefix,
                numMessages: snapshot.numMessages,
                rootHash,
                excludedHashes: snapshot.excludedHashes,
              });
              callback(null, snapshotResponse);
              log.info({ snapshotResponse }, `RPC call: Sending snapshot response to ${peer}`);
            },
            (err: HubError) => {
              callback(toServiceError(err));
              log.error({ err }, `RPC call: Error sending snapshot response to ${peer}`);
            },
          );
        })();
      },
      submitMessage: async (call, callback) => {
        // Identify peer that is calling, if available. This is used for rate limiting.
        const peer = Result.fromThrowable(
          () => call.getPeer(),
          (e) => e,
        )().unwrapOr("unavailable");

        // Check for rate limits
        const rateLimitResult = await rateLimitByIp(peer, this.submitMessageRateLimiter);
        if (rateLimitResult.isErr()) {
          logger.warn({ peer }, "submitMessage rate limited");
          callback(toServiceError(new HubError("unavailable", "API rate limit exceeded")));
          return;
        }

        // Authentication
        const authResult = await authenticateUser(call.metadata, this.rpcUsers);
        if (authResult.isErr()) {
          logger.warn({ errMsg: authResult.error.message }, "submitMessage failed");
          callback(
            toServiceError(new HubError("unauthenticated", `gRPC authentication failed: ${authResult.error.message}`)),
          );
          return;
        }

        const message = call.request;
        const result = await this.hub?.submitMessage(message, "rpc");
        result?.match(
          () => {
            callback(null, message);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getCast: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getCast", req: call.request }, `RPC call from ${peer}`);

        const request = call.request;

        const castAddResult = await this.engine?.getCast(request.fid, request.hash);
        castAddResult?.match(
          (castAdd: CastAddMessage) => {
            callback(null, castAdd);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getCastsByFid: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getCastsByFid", req: call.request }, `RPC call from ${peer}`);

        const { fid, pageSize, pageToken, reverse } = call.request;

        const castsResult = await this.engine?.getCastsByFid(fid, {
          pageSize,
          pageToken,
          reverse,
        });
        castsResult?.match(
          (page: MessagesPage<CastAddMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getCastsByParent: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getCastsByParent", req: call.request }, `RPC call from ${peer}`);

        const { parentCastId, parentUrl, pageSize, pageToken, reverse } = call.request;

        const castsResult = await this.engine?.getCastsByParent(parentCastId ?? parentUrl ?? "", {
          pageSize,
          pageToken,
          reverse,
        });
        castsResult?.match(
          (page: MessagesPage<CastAddMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getCastsByMention: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getCastsByMention", req: call.request }, `RPC call from ${peer}`);

        const { fid, pageSize, pageToken, reverse } = call.request;

        const castsResult = await this.engine?.getCastsByMention(fid, { pageSize, pageToken, reverse });
        castsResult?.match(
          (page: MessagesPage<CastAddMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getReaction: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getReaction", req: call.request }, `RPC call from ${peer}`);

        const request = call.request;

        const reactionResult = await this.engine?.getReaction(
          request.fid,
          request.reactionType,
          request.targetCastId ?? request.targetUrl ?? "",
        );
        reactionResult?.match(
          (reaction: ReactionAddMessage) => {
            callback(null, reaction);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getReactionsByFid: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getReactionsByFid", req: call.request }, `RPC call from ${peer}`);

        const { fid, reactionType, pageSize, pageToken, reverse } = call.request;
        const reactionsResult = await this.engine?.getReactionsByFid(fid, reactionType, {
          pageSize,
          pageToken,
          reverse,
        });
        reactionsResult?.match(
          (page: MessagesPage<ReactionAddMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getReactionsByCast: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getReactionsByCast", req: call.request }, `RPC call from ${peer}`);

        const { targetCastId, reactionType, pageSize, pageToken, reverse } = call.request;
        const reactionsResult = await this.engine?.getReactionsByTarget(targetCastId ?? CastId.create(), reactionType, {
          pageSize,
          pageToken,
          reverse,
        });
        reactionsResult?.match(
          (page: MessagesPage<ReactionAddMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getReactionsByTarget: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getReactionsByTarget", req: call.request }, `RPC call from ${peer}`);

        const { targetCastId, targetUrl, reactionType, pageSize, pageToken, reverse } = call.request;
        const reactionsResult = await this.engine?.getReactionsByTarget(targetCastId ?? targetUrl ?? "", reactionType, {
          pageSize,
          pageToken,
          reverse,
        });
        reactionsResult?.match(
          (page: MessagesPage<ReactionAddMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getUserData: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getUserData", req: call.request }, `RPC call from ${peer}`);

        const request = call.request;

        const userDataResult = await this.engine?.getUserData(request.fid, request.userDataType);
        userDataResult?.match(
          (userData: UserDataAddMessage) => {
            callback(null, userData);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getUserDataByFid: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getUserDataByFid", req: call.request }, `RPC call from ${peer}`);

        const { fid, pageSize, pageToken, reverse } = call.request;

        const userDataResult = await this.engine?.getUserDataByFid(fid, {
          pageSize,
          pageToken,
          reverse,
        });
        userDataResult?.match(
          (page: MessagesPage<UserDataAddMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getNameRegistryEvent: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getNameRegistryEvent", req: call.request }, `RPC call from ${peer}`);

        const request = call.request;

        const nameRegistryEventResult = await this.engine?.getNameRegistryEvent(request.name);
        nameRegistryEventResult?.match(
          (nameRegistryEvent: NameRegistryEvent) => {
            callback(null, nameRegistryEvent);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getUsernameProof: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getUsernameProof", req: call.request }, `RPC call from ${peer}`);

        const request = call.request;

        const usernameProofResult = await this.engine?.getUserNameProof(request.name);
        usernameProofResult?.match(
          (usernameProof: UserNameProof) => {
            callback(null, usernameProof);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getUserNameProofsByFid: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getUserNameProofsByFid", req: call.request }, `RPC call from ${peer}`);

        const request = call.request;

        const usernameProofResult = await this.engine?.getUserNameProofsByFid(request.fid);
        usernameProofResult?.match(
          (usernameProofs: UserNameProof[]) => {
            callback(null, UsernameProofsResponse.create({ proofs: usernameProofs }));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getVerification: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getVerification", req: call.request }, `RPC call from ${peer}`);

        const request = call.request;

        const verificationResult = await this.engine?.getVerification(request.fid, request.address);
        verificationResult?.match(
          (verification: VerificationAddEthAddressMessage) => {
            callback(null, verification);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getVerificationsByFid: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getVerificationsByFid", req: call.request }, `RPC call from ${peer}`);

        const { fid, pageSize, pageToken, reverse } = call.request;

        const verificationsResult = await this.engine?.getVerificationsByFid(fid, {
          pageSize,
          pageToken,
          reverse,
        });
        verificationsResult?.match(
          (page: MessagesPage<VerificationAddEthAddressMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getSigner: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getSigner", req: call.request }, `RPC call from ${peer}`);

        const request = call.request;

        const signerResult = await this.engine?.getSigner(request.fid, request.signer);
        signerResult?.match(
          (signer: SignerAddMessage) => {
            callback(null, signer);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getSignersByFid: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getSignersByFid", req: call.request }, `RPC call from ${peer}`);

        const { fid, pageSize, pageToken, reverse } = call.request;
        const signersResult = await this.engine?.getSignersByFid(fid, {
          pageSize,
          pageToken,
          reverse,
        });
        signersResult?.match(
          (page: MessagesPage<SignerAddMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getIdRegistryEvent: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getIdRegistryEvent", req: call.request }, `RPC call from ${peer}`);

        const request = call.request;
        const idRegistryEventResult = await this.engine?.getIdRegistryEvent(request.fid);
        idRegistryEventResult?.match(
          (idRegistryEvent: IdRegistryEvent) => {
            callback(null, idRegistryEvent);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getLink: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getLink", req: call.request }, `RPC call from ${peer}`);

        const request = call.request;

        const linkResult = await this.engine?.getLink(request.fid, request.linkType, request.targetFid ?? 0);
        linkResult?.match(
          (link: LinkAddMessage) => {
            callback(null, link);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getLinksByFid: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getLinksByFid", req: call.request }, `RPC call from ${peer}`);

        const { fid, linkType, pageSize, pageToken, reverse } = call.request;
        const linksResult = await this.engine?.getLinksByFid(fid, linkType, {
          pageSize,
          pageToken,
          reverse,
        });
        linksResult?.match(
          (page: MessagesPage<LinkAddMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getLinksByTarget: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getLinksByTarget", req: call.request }, `RPC call from ${peer}`);

        const { targetFid, linkType, pageSize, pageToken, reverse } = call.request;
        const linksResult = await this.engine?.getLinksByTarget(targetFid ?? 0, linkType, {
          pageSize,
          pageToken,
          reverse,
        });
        linksResult?.match(
          (page: MessagesPage<LinkAddMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getIdRegistryEventByAddress: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getIdRegistryEventByAddress", req: call.request }, `RPC call from ${peer}`);

        const request = call.request;
        const idRegistryEventResult = await this.engine?.getIdRegistryEventByAddress(request.address);
        idRegistryEventResult?.match(
          (idRegistryEvent: IdRegistryEvent) => {
            callback(null, idRegistryEvent);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getRentRegistryEvents: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getRentRegistryEvents", req: call.request }, `RPC call from ${peer}`);

        const request = call.request;
        const rentRegistryEventsResult = await this.engine?.getRentRegistryEvents(request.fid);
        rentRegistryEventsResult?.match(
          (rentRegistryEvents: RentRegistryEventsResponse) => {
            callback(null, rentRegistryEvents);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getFids: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getFids", req: call.request }, `RPC call from ${peer}`);

        const { pageSize, pageToken, reverse } = call.request;

        const result = await this.engine?.getFids({
          pageSize,
          pageToken,
          reverse,
        });
        result?.match(
          (page: { fids: number[]; nextPageToken: Uint8Array | undefined }) => {
            callback(null, FidsResponse.create(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getAllCastMessagesByFid: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getAllCastMessagesByFid", req: call.request }, `RPC call from ${peer}`);

        const { fid, pageSize, pageToken, reverse } = call.request;
        const result = await this.engine?.getAllCastMessagesByFid(fid, {
          pageSize,
          pageToken,
          reverse,
        });
        result?.match(
          (page: MessagesPage<CastAddMessage | CastRemoveMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getAllReactionMessagesByFid: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getAllReactionMessagesByFid", req: call.request }, `RPC call from ${peer}`);

        const { fid, pageSize, pageToken, reverse } = call.request;
        const result = await this.engine?.getAllReactionMessagesByFid(fid, {
          pageSize,
          pageToken,
          reverse,
        });
        result?.match(
          (page: MessagesPage<ReactionAddMessage | ReactionRemoveMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getAllVerificationMessagesByFid: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getAllVerificationMessagesByFid", req: call.request }, `RPC call from ${peer}`);

        const { fid, pageSize, pageToken, reverse } = call.request;
        const result = await this.engine?.getAllVerificationMessagesByFid(fid, {
          pageSize,
          pageToken,
          reverse,
        });
        result?.match(
          (page: MessagesPage<VerificationAddEthAddressMessage | VerificationRemoveMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getAllSignerMessagesByFid: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getAllSignerMessagesByFid", req: call.request }, `RPC call from ${peer}`);

        const { fid, pageSize, pageToken, reverse } = call.request;
        const result = await this.engine?.getAllSignerMessagesByFid(fid, {
          pageSize,
          pageToken,
          reverse,
        });
        result?.match(
          (page: MessagesPage<SignerAddMessage | SignerRemoveMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getAllUserDataMessagesByFid: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getAllUserDataMessagesByFid", req: call.request }, `RPC call from ${peer}`);

        const { fid, pageSize, pageToken, reverse } = call.request;
        const result = await this.engine?.getUserDataByFid(fid, {
          pageSize,
          pageToken,
          reverse,
        });
        result?.match(
          (page: MessagesPage<UserDataAddMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getAllLinkMessagesByFid: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getAllLinkMessagesByFid", req: call.request }, `RPC call from ${peer}`);

        const { fid, pageSize, pageToken, reverse } = call.request;
        const result = await this.engine?.getAllLinkMessagesByFid(fid, {
          pageSize,
          pageToken,
          reverse,
        });
        result?.match(
          (page: MessagesPage<LinkAddMessage | LinkRemoveMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          },
        );
      },
      getEvent: async (call, callback) => {
        const peer = Result.fromThrowable(() => call.getPeer())().unwrapOr("unknown");
        log.debug({ method: "getEvent", req: call.request }, `RPC call from ${peer}`);

        const result = await this.engine?.getEvent(call.request.id);
        result?.match(
          (event: HubEvent) => callback(null, event),
          (err: HubError) => callback(toServiceError(err)),
        );
      },
      subscribe: async (stream) => {
        const { request } = stream;
        const peer = Result.fromThrowable(
          () => stream.getPeer(),
          (e) => {
            log.error({ err: e }, "subscribe: error getting peer");
          },
        )().unwrapOr("unknown peer:port");

        // Check if username/password authenticates. If it does, we'll allow the connection
        // regardless of rate limits.
        let authorized = false;
        if (this.rpcUsers.size > 0) {
          authorized = (await authenticateUser(stream.metadata, this.rpcUsers)).unwrapOr(false);
        }
        const allowed = this.subscribeIpLimiter.addConnection(peer);

        if (allowed.isOk() || authorized) {
          log.info({ r: request, peer }, "subscribe: starting stream");
        } else {
          log.info({ r: request, peer, err: allowed.error.message }, "subscribe: rejected stream");

          stream.destroy(new Error(allowed.error.message));
          return;
        }

        // We'll write using a Buffered Stream Writer
        const bufferedStreamWriter = new BufferedStreamWriter(stream);

        // We'll listen to all events and write them to the stream as they happen
        const eventListener = (event: HubEvent) => {
          bufferedStreamWriter.writeToStream(event);
        };

        // Register a close listener to remove all listeners before we start sending events
        stream.on("close", () => {
          this.engine?.eventHandler.off("mergeMessage", eventListener);
          this.engine?.eventHandler.off("pruneMessage", eventListener);
          this.engine?.eventHandler.off("revokeMessage", eventListener);
          this.engine?.eventHandler.off("mergeIdRegistryEvent", eventListener);
          this.engine?.eventHandler.off("mergeNameRegistryEvent", eventListener);
          this.engine?.eventHandler.off("mergeUsernameProofEvent", eventListener);

          this.subscribeIpLimiter.removeConnection(peer);

          log.info({ peer }, "subscribe: stream closed");
        });

        // If the user wants to start from a specific event, we'll start from there first
        if (this.engine && request.fromId !== undefined && request.fromId >= 0) {
          const eventsIteratorOpts = this.engine.eventHandler.getEventsIteratorOpts({ fromId: request.fromId });
          if (eventsIteratorOpts.isErr()) {
            stream.destroy(eventsIteratorOpts.error);
            return;
          }

          // We'll set a timeout of 1 hour, after which we'll stop writing to the stream
          // This is to prevent a situation where we're writing to the stream, but the client
          // is not reading it.
          const timeout = setTimeout(async () => {
            logger.warn(
              { timeout: HUBEVENTS_READER_TIMEOUT, peer: stream.getPeer() },
              "HubEvents subscribe: timeout, stopping stream",
            );

            const error = new HubError("unavailable.network_failure", `stream timeout for peer: ${stream.getPeer()}`);
            stream.destroy(error);
          }, HUBEVENTS_READER_TIMEOUT);

          // Track our RSS usage, to detect a situation where we're writing a lot of data to the stream,
          // but the client is not reading it. If we detect this, we'll stop writing to the stream.
          // Right now, we don't act on it, but we'll log it for now. We could potentially
          // destroy() the stream.
          const rssUsage = process.memoryUsage().rss;
          const RSS_USAGE_THRESHOLD = 1_000_000_000; // 1G

          await this.engine.getDb().forEachIterator(
            async (_key, value) => {
              const event = HubEvent.decode(Uint8Array.from(value as Buffer));
              if (request.eventTypes.length === 0 || request.eventTypes.includes(event.type)) {
                const writeResult = bufferedStreamWriter.writeToStream(event);

                if (writeResult.isErr()) {
                  logger.warn(
                    { err: writeResult.error },
                    `subscribe: failed to write to stream while returning events ${request.fromId}`,
                  );

                  return true;
                } else {
                  if (writeResult.value === false) {
                    // If the stream was buffered, we can wait for a bit before continuing
                    // to allow the client to read the data. If this happens too much, the bufferedStreamWriter
                    // will timeout and destroy the stream.
                    // The buffered writer is not async to make it easier to preserve ordering guarantees. So, we sleep here
                    await sleep(SLOW_CLIENT_GRACE_PERIOD_MS / STREAM_MESSAGE_BUFFER_SIZE);
                  }

                  // Write was successful, check the RSS usage
                  if (process.memoryUsage().rss > rssUsage + RSS_USAGE_THRESHOLD) {
                    // more than 1G, so we're writing a lot of data to the stream, but the client is not reading it.
                    // We'll destroy the stream.
                    const error = new HubError("unavailable.network_failure", "stream memory usage too much");
                    logger.error({ errCode: error.errCode }, error.message);
                    stream.destroy(error);

                    return true;
                  }
                }
              }

              return false;
            },
            eventsIteratorOpts.value,
            HUBEVENTS_READER_TIMEOUT,
          );

          // If we reach here, the iterator has ended, so we'll clear the timeout
          clearTimeout(timeout);
        }

        // if no type filters are provided, subscribe to all event types and start streaming events
        if (request.eventTypes.length === 0) {
          this.engine?.eventHandler.on("mergeMessage", eventListener);
          this.engine?.eventHandler.on("pruneMessage", eventListener);
          this.engine?.eventHandler.on("revokeMessage", eventListener);
          this.engine?.eventHandler.on("mergeIdRegistryEvent", eventListener);
          this.engine?.eventHandler.on("mergeNameRegistryEvent", eventListener);
          this.engine?.eventHandler.on("mergeUsernameProofEvent", eventListener);
        } else {
          for (const eventType of request.eventTypes) {
            if (eventType === HubEventType.MERGE_MESSAGE) {
              this.engine?.eventHandler.on("mergeMessage", eventListener);
            } else if (eventType === HubEventType.PRUNE_MESSAGE) {
              this.engine?.eventHandler.on("pruneMessage", eventListener);
            } else if (eventType === HubEventType.REVOKE_MESSAGE) {
              this.engine?.eventHandler.on("revokeMessage", eventListener);
            } else if (eventType === HubEventType.MERGE_ID_REGISTRY_EVENT) {
              this.engine?.eventHandler.on("mergeIdRegistryEvent", eventListener);
            } else if (eventType === HubEventType.MERGE_NAME_REGISTRY_EVENT) {
              this.engine?.eventHandler.on("mergeNameRegistryEvent", eventListener);
            } else if (eventType === HubEventType.MERGE_USERNAME_PROOF) {
              this.engine?.eventHandler.on("mergeUsernameProofEvent", eventListener);
            }
          }
        }
      },
    };
  };
}
