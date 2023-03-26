import {
  CastAddMessage,
  CastId,
  CastRemoveMessage,
  FidsResponse,
  Server as GrpcServer,
  HubEvent,
  HubEventType,
  HubInfoResponse,
  HubServiceServer,
  HubServiceService,
  IdRegistryEvent,
  Message,
  MessagesResponse,
  Metadata,
  NameRegistryEvent,
  ReactionAddMessage,
  ReactionRemoveMessage,
  ServerCredentials,
  ServiceError,
  SignerAddMessage,
  SignerRemoveMessage,
  SyncIds,
  TrieNodeMetadataResponse,
  TrieNodeSnapshotResponse,
  UserDataAddMessage,
  VerificationAddEthAddressMessage,
  VerificationRemoveMessage,
  getServer,
  status,
} from '@farcaster/protobufs';
import { HubAsyncResult, HubError } from '@farcaster/utils';
import { err, ok, Result } from 'neverthrow';
import { APP_NICKNAME, APP_VERSION, HubInterface } from '~/hubble';
import { GossipNode } from '~/network/p2p/gossipNode';
import { NodeMetadata } from '~/network/sync/merkleTrie';
import SyncEngine from '~/network/sync/syncEngine';
import Engine from '~/storage/engine';
import { MessagesPage } from '~/storage/stores/types';
import { logger } from '~/utils/logger';
import { addressInfoFromParts } from '~/utils/p2p';
import { RateLimiterMemory, RateLimiterAbstract } from 'rate-limiter-flexible';

const log = logger.child({ component: 'rpcServer' });

export const rateLimitByIp = async (ip: string, limiter: RateLimiterAbstract): HubAsyncResult<boolean> => {
  // Get the IP part of the address
  const ipPart = ip.split(':')[0] ?? '';

  try {
    await limiter.consume(ipPart);
    return ok(true);
  } catch (e) {
    return err(new HubError('unavailable', 'Too many requests'));
  }
};

// Check if the user is authenticated via the metadata
export const authenticateUser = async (
  metadata: Metadata,
  rpcAuthUser?: string,
  rpcAuthPass?: string
): HubAsyncResult<boolean> => {
  // If there is no auth user/pass, we don't need to authenticate
  if (!rpcAuthUser || !rpcAuthPass) {
    return ok(true);
  }

  if (metadata.get('authorization')) {
    const authHeader = metadata.get('authorization')[0] as string;
    if (!authHeader) {
      return err(new HubError('unauthenticated', 'Authorization header is empty'));
    }

    const encodedCredentials = authHeader.replace('Basic ', '');
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
    const [username, password] = decodedCredentials.split(':');
    if (!username || !password) {
      return err(new HubError('unauthenticated', `Invalid username: ${username}`));
    }

    if (username === rpcAuthUser && password === rpcAuthPass) {
      return ok(true);
    } else {
      return err(new HubError('unauthenticated', `Invalid password for user: ${username}`));
    }
  }
  return err(new HubError('unauthenticated', 'No authorization header'));
};

export const toServiceError = (err: HubError): ServiceError => {
  let grpcCode: number;
  if (err.errCode === 'unauthenticated') {
    grpcCode = status.UNAUTHENTICATED;
  } else if (err.errCode === 'unauthorized') {
    grpcCode = status.PERMISSION_DENIED;
  } else if (
    err.errCode === 'bad_request' ||
    err.errCode === 'bad_request.parse_failure' ||
    err.errCode === 'bad_request.validation_failure' ||
    err.errCode === 'bad_request.invalid_param' ||
    err.errCode === 'bad_request.conflict' ||
    err.errCode === 'bad_request.duplicate'
  ) {
    grpcCode = status.INVALID_ARGUMENT;
  } else if (err.errCode === 'not_found') {
    grpcCode = status.NOT_FOUND;
  } else if (
    err.errCode === 'unavailable' ||
    err.errCode === 'unavailable.network_failure' ||
    err.errCode === 'unavailable.storage_failure'
  ) {
    grpcCode = status.UNAVAILABLE;
  } else {
    grpcCode = status.UNKNOWN;
  }
  const metadata = new Metadata();
  metadata.set('errCode', err.errCode);
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

export default class Server {
  private hub: HubInterface | undefined;
  private engine: Engine | undefined;
  private syncEngine: SyncEngine | undefined;
  private gossipNode: GossipNode | undefined;

  private grpcServer: GrpcServer;
  private port: number;

  private rpcAuthUser: string | undefined;
  private rpcAuthPass: string | undefined;

  private submitMessageRateLimiter: RateLimiterMemory;

  constructor(
    hub?: HubInterface,
    engine?: Engine,
    syncEngine?: SyncEngine,
    gossipNode?: GossipNode,
    rpcAuth?: string,
    rpcRateLimit?: number
  ) {
    this.hub = hub;
    this.engine = engine;
    this.syncEngine = syncEngine;
    this.gossipNode = gossipNode;

    this.grpcServer = getServer();
    this.port = 0;

    const [rpcAuthUser, rpcAuthPass] = rpcAuth?.split(':') ?? [undefined, undefined];
    if (rpcAuthUser && rpcAuthPass) {
      this.rpcAuthUser = rpcAuthUser;
      this.rpcAuthPass = rpcAuthPass;

      log.info({ username: this.rpcAuthUser }, 'RPC auth enabled');
    }

    this.grpcServer.addService(HubServiceService, this.getImpl());

    // Submit message are rate limited by default to 20k per minute
    let rateLimitPerMinute = 20_000;
    if (rpcRateLimit !== undefined && rpcRateLimit >= 0) {
      rateLimitPerMinute = rpcRateLimit;
    }

    this.submitMessageRateLimiter = new RateLimiterMemory({
      points: rateLimitPerMinute,
      duration: 60,
    });
  }

  async start(port = 0): Promise<number> {
    return new Promise((resolve, reject) => {
      this.grpcServer.bindAsync(`0.0.0.0:${port}`, ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
          logger.error({ component: 'gRPC Server', err }, 'Failed to start gRPC Server');
          reject(err);
        } else {
          this.grpcServer.start();
          this.port = port;

          logger.info({ component: 'gRPC Server', address: this.address }, 'Starting gRPC Server');
          resolve(port);
        }
      });
    });
  }

  async stop(force = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (force) {
        this.grpcServer.forceShutdown();
        log.info({ component: 'gRPC Server' }, `Force shutdown succeeded`);
        resolve();
      } else {
        this.grpcServer.tryShutdown((err) => {
          if (err) {
            log.error({ component: 'gRPC Server' }, `Shutdown failed: ${err}`);
            reject(err);
          } else {
            log.info({ component: 'gRPC Server' }, `Shutdown succeeded`);
            resolve();
          }
        });
      }
    });
  }

  get address() {
    const addr = addressInfoFromParts('0.0.0.0', this.port);
    return addr;
  }

  get auth() {
    return { user: this.rpcAuthUser, password: this.rpcAuthPass };
  }

  get listenPort() {
    return this.port;
  }

  getImpl = (): HubServiceServer => {
    return {
      getInfo: (call, callback) => {
        (async () => {
          const info = HubInfoResponse.create({
            version: APP_VERSION,
            isSynced: !this.syncEngine?.isSyncing(),
            nickname: APP_NICKNAME,
            rootHash: (await this.syncEngine?.trie.rootHash()) ?? '',
          });

          callback(null, info);
        })();
      },
      getAllSyncIdsByPrefix: (call, callback) => {
        const request = call.request;

        (async () => {
          const syncIdsResponse = await this.syncEngine?.getAllSyncIdsByPrefix(request.prefix);
          callback(null, SyncIds.create({ syncIds: syncIdsResponse ?? [] }));
        })();
      },
      getAllMessagesBySyncIds: async (call, callback) => {
        const request = call.request;

        const messagesResult = await this.engine?.getAllMessagesBySyncIds(request.syncIds);
        messagesResult?.match(
          (messages) => {
            // Check the messages for corruption. If a message is blank, that means it was present
            // in our sync trie, but the DB couldn't find it. So remove it from the sync Trie.
            const corruptedMessages = messages.filter(
              (message) => message.data === undefined || message.hash.length === 0
            );

            if (corruptedMessages.length > 0) {
              log.warn({ num: corruptedMessages.length }, 'Found corrupted messages, rebuilding some syncIDs');
              // Don't wait for this to finish, just return the messages we have.
              this.syncEngine?.rebuildSyncIds(request.syncIds);
              messages = messages.filter((message) => message.data !== undefined && message.hash.length > 0);
            }

            callback(null, MessagesResponse.create({ messages }));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getSyncMetadataByPrefix: (call, callback) => {
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
                })
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
        const request = call.request;

        (async () => {
          const rootHash = (await this.syncEngine?.trie.rootHash()) ?? '';
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
            },
            (err: HubError) => {
              callback(toServiceError(err));
            }
          );
        })();
      },
      submitMessage: async (call, callback) => {
        // Identify peer that is calling, if available. This is used for rate limiting.
        let peer;
        const peerResult = Result.fromThrowable(
          () => call.getPeer(),
          (e) => e
        )();
        if (peerResult.isErr()) {
          peer = 'unavailable'; // Catchall. If peer is unavailable, we will group all of them into one bucket
        } else {
          peer = peerResult.value;
        }

        // Check for rate limits
        const rateLimitResult = await rateLimitByIp(peer, this.submitMessageRateLimiter);
        if (rateLimitResult.isErr()) {
          logger.warn({ peer }, 'submitMessage rate limited');
          callback(toServiceError(new HubError('unavailable', 'API rate limit exceeded')));
          return;
        }

        // Authentication
        const authResult = await authenticateUser(call.metadata, this.rpcAuthUser, this.rpcAuthPass);
        if (authResult.isErr()) {
          logger.warn({ errMsg: authResult.error.message }, 'submitMessage failed');
          callback(toServiceError(new HubError('unauthenticated', 'User is not authenticated')));
          return;
        }

        const message = call.request;
        const result = await this.hub?.submitMessage(message, 'rpc');
        result?.match(
          () => {
            if (this.gossipNode) {
              // When submitting a message via RPC, we want to gossip it to other nodes.
              // This is a promise, but we won't await it.
              this.gossipNode.gossipMessage(message);
            }
            callback(null, message);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getCast: async (call, callback) => {
        const request = call.request;

        const castAddResult = await this.engine?.getCast(request.fid, request.hash);
        castAddResult?.match(
          (castAdd: CastAddMessage) => {
            callback(null, castAdd);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getCastsByFid: async (call, callback) => {
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
          }
        );
      },
      getCastsByParent: async (call, callback) => {
        const { castId, pageSize, pageToken, reverse } = call.request;

        const castsResult = await this.engine?.getCastsByParent(castId as CastId, { pageSize, pageToken, reverse });
        castsResult?.match(
          (page: MessagesPage<CastAddMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getCastsByMention: async (call, callback) => {
        const { fid, pageSize, pageToken, reverse } = call.request;

        const castsResult = await this.engine?.getCastsByMention(fid, { pageSize, pageToken, reverse });
        castsResult?.match(
          (page: MessagesPage<CastAddMessage>) => {
            callback(null, messagesPageToResponse(page));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getReaction: async (call, callback) => {
        const request = call.request;

        const reactionResult = await this.engine?.getReaction(
          request.fid,
          request.reactionType,
          request.castId ?? CastId.create()
        );
        reactionResult?.match(
          (reaction: ReactionAddMessage) => {
            callback(null, reaction);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getReactionsByFid: async (call, callback) => {
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
          }
        );
      },
      getReactionsByCast: async (call, callback) => {
        const { castId, reactionType, pageSize, pageToken, reverse } = call.request;
        const reactionsResult = await this.engine?.getReactionsByCast(castId ?? CastId.create(), reactionType, {
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
          }
        );
      },
      getUserData: async (call, callback) => {
        const request = call.request;

        const userDataResult = await this.engine?.getUserData(request.fid, request.userDataType);
        userDataResult?.match(
          (userData: UserDataAddMessage) => {
            callback(null, userData);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getUserDataByFid: async (call, callback) => {
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
          }
        );
      },
      getNameRegistryEvent: async (call, callback) => {
        const request = call.request;

        const nameRegistryEventResult = await this.engine?.getNameRegistryEvent(request.name);
        nameRegistryEventResult?.match(
          (nameRegistryEvent: NameRegistryEvent) => {
            callback(null, nameRegistryEvent);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getVerification: async (call, callback) => {
        const request = call.request;

        const verificationResult = await this.engine?.getVerification(request.fid, request.address);
        verificationResult?.match(
          (verification: VerificationAddEthAddressMessage) => {
            callback(null, verification);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getVerificationsByFid: async (call, callback) => {
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
          }
        );
      },
      getSigner: async (call, callback) => {
        const request = call.request;

        const signerResult = await this.engine?.getSigner(request.fid, request.signer);
        signerResult?.match(
          (signer: SignerAddMessage) => {
            callback(null, signer);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getSignersByFid: async (call, callback) => {
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
          }
        );
      },
      getIdRegistryEvent: async (call, callback) => {
        const request = call.request;

        const custodyEventResult = await this.engine?.getIdRegistryEvent(request.fid);
        custodyEventResult?.match(
          (custodyEvent: IdRegistryEvent) => {
            callback(null, custodyEvent);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getFids: async (call, callback) => {
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
          }
        );
      },
      getAllCastMessagesByFid: async (call, callback) => {
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
          }
        );
      },
      getAllReactionMessagesByFid: async (call, callback) => {
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
          }
        );
      },
      getAllVerificationMessagesByFid: async (call, callback) => {
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
          }
        );
      },
      getAllSignerMessagesByFid: async (call, callback) => {
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
          }
        );
      },
      getAllUserDataMessagesByFid: async (call, callback) => {
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
          }
        );
      },
      getEvent: async (call, callback) => {
        const result = await this.engine?.getEvent(call.request.id);
        result?.match(
          (event: HubEvent) => callback(null, event),
          (err: HubError) => callback(toServiceError(err))
        );
      },
      subscribe: async (stream) => {
        const { request } = stream;

        if (this.engine && request.fromId) {
          const eventsIterator = this.engine.eventHandler.getEventsIterator({ fromId: request.fromId });
          if (eventsIterator.isErr()) {
            stream.destroy(eventsIterator.error);
            return;
          }
          for await (const [, value] of eventsIterator.value) {
            const event = HubEvent.decode(Uint8Array.from(value as Buffer));
            if (request.eventTypes.length === 0 || request.eventTypes.includes(event.type)) {
              stream.write(event);
            }
          }
        }

        const eventListener = (event: HubEvent) => {
          stream.write(event);
        };

        // if no type filters are provided, subscribe to all event types
        if (request.eventTypes.length === 0) {
          this.engine?.eventHandler.on('mergeMessage', eventListener);
          this.engine?.eventHandler.on('pruneMessage', eventListener);
          this.engine?.eventHandler.on('revokeMessage', eventListener);
          this.engine?.eventHandler.on('mergeIdRegistryEvent', eventListener);
          this.engine?.eventHandler.on('mergeNameRegistryEvent', eventListener);
        } else {
          for (const eventType of request.eventTypes) {
            if (eventType === HubEventType.MERGE_MESSAGE) {
              this.engine?.eventHandler.on('mergeMessage', eventListener);
            } else if (eventType === HubEventType.PRUNE_MESSAGE) {
              this.engine?.eventHandler.on('pruneMessage', eventListener);
            } else if (eventType === HubEventType.REVOKE_MESSAGE) {
              this.engine?.eventHandler.on('revokeMessage', eventListener);
            } else if (eventType === HubEventType.MERGE_ID_REGISTRY_EVENT) {
              this.engine?.eventHandler.on('mergeIdRegistryEvent', eventListener);
            } else if (eventType === HubEventType.MERGE_NAME_REGISTRY_EVENT) {
              this.engine?.eventHandler.on('mergeNameRegistryEvent', eventListener);
            }
          }
        }

        stream.on('cancelled', () => {
          stream.destroy();
        });

        stream.on('close', () => {
          this.engine?.eventHandler.off('mergeMessage', eventListener);
          this.engine?.eventHandler.off('pruneMessage', eventListener);
          this.engine?.eventHandler.off('revokeMessage', eventListener);
          this.engine?.eventHandler.off('mergeIdRegistryEvent', eventListener);
          this.engine?.eventHandler.off('mergeNameRegistryEvent', eventListener);
        });
      },
    };
  };
}
