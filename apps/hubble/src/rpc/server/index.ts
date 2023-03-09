import {
  CastAddMessage,
  CastId,
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
  ReactionType,
  ServerCredentials,
  ServiceError,
  SignerAddMessage,
  SyncIds,
  TrieNodeMetadataResponse,
  TrieNodeSnapshotResponse,
  UserDataAddMessage,
  VerificationAddEthAddressMessage,
  getServer,
  status,
} from '@farcaster/protobufs';
import { HubAsyncResult, HubError } from '@farcaster/utils';
import { err, ok } from 'neverthrow';
import { APP_NICKNAME, APP_VERSION, HubInterface } from '~/hubble';
import { GossipNode } from '~/network/p2p/gossipNode';
import { NodeMetadata } from '~/network/sync/merkleTrie';
import SyncEngine from '~/network/sync/syncEngine';
import Engine from '~/storage/engine';
import { logger } from '~/utils/logger';
import { addressInfoFromParts } from '~/utils/p2p';

const log = logger.child({ component: 'rpcServer' });

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

export default class Server {
  private hub: HubInterface | undefined;
  private engine: Engine | undefined;
  private syncEngine: SyncEngine | undefined;
  private gossipNode: GossipNode | undefined;

  private grpcServer: GrpcServer;
  private port: number;

  private rpcAuthUser: string | undefined;
  private rpcAuthPass: string | undefined;

  constructor(hub?: HubInterface, engine?: Engine, syncEngine?: SyncEngine, gossipNode?: GossipNode, rpcAuth?: string) {
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

  // Check if the user is authenticated via the metadata
  async authenticateUser(metadata: Metadata): HubAsyncResult<boolean> {
    // If there is no auth user/pass, we don't need to authenticate
    if (!this.rpcAuthUser || !this.rpcAuthPass) {
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

      if (username === this.rpcAuthUser && password === this.rpcAuthPass) {
        return ok(true);
      } else {
        return err(new HubError('unauthenticated', `Invalid password for user: ${username}`));
      }
    }
    return err(new HubError('unauthenticated', 'No authorization header'));
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
            callback(null, MessagesResponse.create({ messages: messages ?? [] }));
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
        const authResult = await this.authenticateUser(call.metadata);
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
      submitIdRegistryEvent: async (call, callback) => {
        const authResult = await this.authenticateUser(call.metadata);
        if (authResult.isErr()) {
          logger.warn({ errMsg: authResult.error.message }, 'submitIdRegistry failed');
          callback(toServiceError(new HubError('unauthenticated', 'User is not authenticated')));
          return;
        }

        const idRegistryEvent = call.request;

        const result = await this.hub?.submitIdRegistryEvent(idRegistryEvent, 'rpc');
        result?.match(
          () => {
            // Note: We don't gossip ID registry events, since we assume each node has its own connection
            // to an ETH node.
            callback(null, idRegistryEvent);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      submitNameRegistryEvent: async (call, callback) => {
        const authResult = await this.authenticateUser(call.metadata);
        if (authResult.isErr()) {
          logger.warn({ errMsg: authResult.error.message }, 'submitNameRegistry failed');
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
        const request = call.request;

        const castsResult = await this.engine?.getCastsByFid(request.fid);
        castsResult?.match(
          (casts: CastAddMessage[]) => {
            callback(null, MessagesResponse.create({ messages: casts }));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getCastsByParent: async (call, callback) => {
        const request = call.request;

        const castsResult = await this.engine?.getCastsByParent(request);
        castsResult?.match(
          (casts: CastAddMessage[]) => {
            callback(null, MessagesResponse.create({ messages: casts }));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getCastsByMention: async (call, callback) => {
        const request = call.request;

        const castsResult = await this.engine?.getCastsByMention(request.fid);
        castsResult?.match(
          (casts: CastAddMessage[]) => {
            callback(null, MessagesResponse.create({ messages: casts }));
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
        const request = call.request;
        const reactionType = request.reactionType === ReactionType.NONE ? undefined : request.reactionType;
        const reactionsResult = await this.engine?.getReactionsByFid(request.fid, reactionType);
        reactionsResult?.match(
          (reactions: ReactionAddMessage[]) => {
            callback(null, MessagesResponse.create({ messages: reactions }));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getReactionsByCast: async (call, callback) => {
        const request = call.request;
        const reactionType = request.reactionType === ReactionType.NONE ? undefined : request.reactionType;
        const reactionsResult = await this.engine?.getReactionsByCast(request.castId ?? CastId.create(), reactionType);
        reactionsResult?.match(
          (reactions: ReactionAddMessage[]) => {
            callback(null, MessagesResponse.create({ messages: reactions }));
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
        const request = call.request;

        const userDataResult = await this.engine?.getUserDataByFid(request.fid);
        userDataResult?.match(
          (userData: UserDataAddMessage[]) => {
            callback(null, MessagesResponse.create({ messages: userData }));
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
        const request = call.request;

        const verificationsResult = await this.engine?.getVerificationsByFid(request.fid);
        verificationsResult?.match(
          (verifications: VerificationAddEthAddressMessage[]) => {
            callback(null, MessagesResponse.create({ messages: verifications }));
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
        const request = call.request;

        const signersResult = await this.engine?.getSignersByFid(request.fid);
        signersResult?.match(
          (signers: SignerAddMessage[]) => {
            callback(null, MessagesResponse.create({ messages: signers }));
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
        const result = await this.engine?.getFids();
        result?.match(
          (fids: number[]) => {
            callback(null, FidsResponse.create({ fids }));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getAllCastMessagesByFid: async (call, callback) => {
        const request = call.request;

        const result = await this.engine?.getAllCastMessagesByFid(request.fid);
        result?.match(
          (messages: Message[]) => {
            callback(null, MessagesResponse.create({ messages }));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getAllReactionMessagesByFid: async (call, callback) => {
        const request = call.request;

        const result = await this.engine?.getAllReactionMessagesByFid(request.fid);
        result?.match(
          (messages: Message[]) => {
            callback(null, MessagesResponse.create({ messages }));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getAllVerificationMessagesByFid: async (call, callback) => {
        const request = call.request;

        const result = await this.engine?.getAllVerificationMessagesByFid(request.fid);
        result?.match(
          (messages: Message[]) => {
            callback(null, MessagesResponse.create({ messages }));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getAllSignerMessagesByFid: async (call, callback) => {
        const request = call.request;

        const result = await this.engine?.getAllSignerMessagesByFid(request.fid);
        result?.match(
          (messages: Message[]) => {
            callback(null, MessagesResponse.create({ messages }));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getAllUserDataMessagesByFid: async (call, callback) => {
        const request = call.request;

        const result = await this.engine?.getUserDataByFid(request.fid);
        result?.match(
          (messages: Message[]) => {
            callback(null, MessagesResponse.create({ messages }));
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
          const eventsIterator = this.engine.eventHandler.getEventsIterator(request.fromId);
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
