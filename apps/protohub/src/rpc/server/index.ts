import {
  AmpAddMessage,
  CastAddMessage,
  CastId,
  FidsResponse,
  getServer,
  HubInfoResponse,
  HubServiceServer,
  HubServiceService,
  IdRegistryEvent,
  Message,
  MessagesResponse,
  Metadata,
  NameRegistryEvent,
  ReactionAddMessage,
  ServiceError,
  SignerAddMessage,
  status,
  SyncIds,
  TrieNodeMetadataResponse,
  TrieNodeSnapshotResponse,
  UserDataAddMessage,
  VerificationAddEthAddressMessage,
} from '@farcaster/protobufs';
import { HubError } from '@farcaster/protoutils';
import { APP_NICKNAME, APP_VERSION, HubInterface } from '~/hub';
import { NodeMetadata } from '~/network/sync/merkleTrie';
import SyncEngine from '~/network/sync/syncEngine';
import Engine from '~/storage/engine';

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

class Server {
  private hub: HubInterface | undefined;
  private engine: Engine | undefined;
  private syncEngine: SyncEngine | undefined;

  constructor(hub?: HubInterface, engine?: Engine, syncEngine?: SyncEngine) {
    this.hub = hub;
    this.engine = engine;
    this.syncEngine = syncEngine;
  }

  HubServiceGrpc = (): HubServiceServer => {
    return {
      getInfo: (call, callback) => {
        const info = HubInfoResponse.create({
          version: APP_VERSION,
          isSynced: !this.syncEngine?.isSyncing(),
          nickname: APP_NICKNAME,
          rootHash: this.syncEngine?.trie.rootHash ?? '',
        });

        callback(null, info);
      },
      getAllSyncIdsByPrefix: (call, callback) => {
        const request = call.request;

        const syncIdsResponse = this.syncEngine?.getAllSyncIdsByPrefix(request.prefix);
        callback(null, SyncIds.create({ syncIds: syncIdsResponse ?? [] }));
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

        const metadata = this.syncEngine?.getTrieNodeMetadata(request.prefix);
        callback(null, toTrieNodeMetadataResponse(metadata));
      },
      getSyncSnapshotByPrefix: (call, callback) => {
        const request = call.request;

        const snapshot = this.syncEngine?.getSnapshotByPrefix(request.prefix);
        snapshot?.match(
          (snapshot) => {
            const snapshotResponse = TrieNodeSnapshotResponse.create({
              prefix: snapshot.prefix,
              numMessages: snapshot.numMessages,
              rootHash: this.syncEngine?.trie.rootHash ?? '',
              excludedHashes: snapshot.excludedHashes,
            });
            callback(null, snapshotResponse);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      submitMessage: async (call, callback) => {
        const message = call.request;
        const result = await this.hub?.submitMessage(message, 'rpc');
        result?.match(
          () => {
            callback(null, message);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      submitIdRegistryEvent: async (call, callback) => {
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

        const reactionsResult = await this.engine?.getReactionsByFid(request.fid);
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

        const reactionsResult = await this.engine?.getReactionsByCast(
          request.castId ?? CastId.create(),
          request.reactionType
        );
        reactionsResult?.match(
          (reactions: ReactionAddMessage[]) => {
            callback(null, MessagesResponse.create({ messages: reactions }));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getAmp: async (call, callback) => {
        const request = call.request;

        const ampResult = await this.engine?.getAmp(request.fid, request.targetFid);
        ampResult?.match(
          (amp: AmpAddMessage) => {
            callback(null, amp);
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getAmpsByFid: async (call, callback) => {
        const request = call.request;

        const ampsResult = await this.engine?.getAmpsByFid(request.fid);
        ampsResult?.match(
          (amps: AmpAddMessage[]) => {
            callback(null, MessagesResponse.create({ messages: amps }));
          },
          (err: HubError) => {
            callback(toServiceError(err));
          }
        );
      },
      getAmpsByUser: async (call, callback) => {
        const request = call.request;

        const ampsResult = await this.engine?.getAmpsByTargetFid(request.fid);
        ampsResult?.match(
          (amps: AmpAddMessage[]) => {
            callback(null, MessagesResponse.create({ messages: amps }));
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
      getCustodyEvent: async (call, callback) => {
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
      getAllAmpMessagesByFid: async (call, callback) => {
        const request = call.request;

        const result = await this.engine?.getAllAmpMessagesByFid(request.fid);
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
    };
  };
}

const grpcServer = getServer();
grpcServer.addService(HubServiceService, new Server().HubServiceGrpc());
