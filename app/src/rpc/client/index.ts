import grpc, { ClientReadableStream, Metadata, MetadataValue } from '@grpc/grpc-js';
import * as flatbuffers from '@hub/flatbuffers';
import { arrayify } from 'ethers/lib/utils';
import { ByteBuffer } from 'flatbuffers';
import { err, ok } from 'neverthrow';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import * as FBTypes from '~/flatbuffers/models/types';
import { NodeMetadata } from '~/network/sync/merkleTrie';
import * as requests from '~/rpc/client/serviceRequests';
import * as definitions from '~/rpc/serviceDefinitions';
import { HubAsyncResult, HubError, HubErrorCode } from '~/utils/hubErrors';

const fromServiceError = (err: grpc.ServiceError): HubError => {
  return new HubError(err.metadata.get('errCode')[0] as HubErrorCode, err.details);
};

interface GenericFlatbuffer {
  bb: ByteBuffer | null;
}

export const defaultMethod = {
  requestStream: false,
  responseStream: false,
  requestSerialize: (request: GenericFlatbuffer): Buffer => {
    return Buffer.from(request.bb?.bytes() ?? new Uint8Array());
  },
  responseSerialize: (response: GenericFlatbuffer): Buffer => {
    return Buffer.from(response.bb?.bytes() ?? new Uint8Array());
  },
};

const fromNodeMetadataResponse = (response: flatbuffers.TrieNodeMetadataResponse): NodeMetadata => {
  const children = new Map<string, NodeMetadata>();
  for (let i = 0; i < response.childrenLength(); i++) {
    const child = response.children(i);

    const prefix = new TextDecoder().decode(child?.prefixArray() ?? new Uint8Array());
    // Char is the last char of prefix
    const char = prefix[prefix.length - 1] ?? '';

    children.set(char, {
      numMessages: Number(child?.numMessages()),
      prefix,
      hash: new TextDecoder().decode(child?.hashArray() ?? new Uint8Array()),
    });
  }

  return {
    prefix: new TextDecoder().decode(response.prefixArray() ?? new Uint8Array()),
    numMessages: Number(response.numMessages()),
    hash: new TextDecoder().decode(response.hashArray() ?? new Uint8Array()),
    children,
  };
};

const fromSyncIdsByPrefixResponse = (response: flatbuffers.GetAllSyncIdsByPrefixResponse): string[] => {
  const ids = [];
  for (let i = 0; i < response.idsLength(); i++) {
    ids.push(response.ids(i));
  }
  return ids;
};

class Client {
  private client: grpc.Client;

  constructor(address: string) {
    this.client = new grpc.Client(address, grpc.credentials.createInsecure());
  }

  close() {
    this.client.close();
  }

  /* -------------------------------------------------------------------------- */
  /*                                Submit Methods                              */
  /* -------------------------------------------------------------------------- */

  async submitMessage(message: MessageModel): HubAsyncResult<MessageModel> {
    return this.makeUnaryMessageRequest(definitions.submitDefinition().submitMessage, message.message);
  }

  async submitIdRegistryEvent(event: IdRegistryEventModel): HubAsyncResult<IdRegistryEventModel> {
    return this.makeUnaryIdRegistryEventRequest(definitions.submitDefinition().submitIdRegistryEvent, event.event);
  }

  async submitNameRegistryEvent(event: NameRegistryEventModel): HubAsyncResult<NameRegistryEventModel> {
    return this.makeUnaryNameRegistryEventRequest(definitions.submitDefinition().submitNameRegistryEvent, event.event);
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Cast Methods                               */
  /* -------------------------------------------------------------------------- */

  async getCast(fid: Uint8Array, tsHash: Uint8Array): HubAsyncResult<FBTypes.CastAddModel> {
    return this.makeUnaryMessageRequest(
      definitions.castDefinition().getCast,
      requests.castRequests.getCast(fid, tsHash)
    );
  }

  async getCastsByFid(fid: Uint8Array): HubAsyncResult<FBTypes.CastAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.castDefinition().getCastsByFid,
      requests.castRequests.getCastsByFid(fid)
    );
  }

  async getCastsByParent(parent: flatbuffers.CastId): HubAsyncResult<FBTypes.CastAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.castDefinition().getCastsByParent,
      requests.castRequests.getCastsByParent(parent)
    );
  }

  async getCastsByMention(mention: flatbuffers.UserId): HubAsyncResult<FBTypes.CastAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.castDefinition().getCastsByMention,
      requests.castRequests.getCastsByMention(mention)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                Amp Methods                              */
  /* -------------------------------------------------------------------------- */

  async getAmp(fid: Uint8Array, user: flatbuffers.UserId): HubAsyncResult<FBTypes.AmpAddModel> {
    return this.makeUnaryMessageRequest(definitions.ampDefinition().getAmp, requests.ampRequests.getAmp(fid, user));
  }

  async getAmpsByFid(fid: Uint8Array): HubAsyncResult<FBTypes.AmpAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.ampDefinition().getAmpsByFid,
      requests.ampRequests.getAmpsByFid(fid)
    );
  }

  async getAmpsByUser(user: flatbuffers.UserId): HubAsyncResult<FBTypes.AmpAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.ampDefinition().getAmpsByUser,
      requests.ampRequests.getAmpsByUser(user)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                               Reaction Methods                             */
  /* -------------------------------------------------------------------------- */

  async getReaction(
    fid: Uint8Array,
    type: flatbuffers.ReactionType,
    cast: flatbuffers.CastId
  ): HubAsyncResult<FBTypes.ReactionAddModel> {
    return this.makeUnaryMessageRequest(
      definitions.reactionDefinition().getReaction,
      requests.reactionRequests.getReaction(fid, type, cast)
    );
  }

  async getReactionsByFid(fid: Uint8Array, type?: flatbuffers.ReactionType): HubAsyncResult<FBTypes.AmpAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.reactionDefinition().getReactionsByFid,
      requests.reactionRequests.getReactionsByFid(fid, type)
    );
  }

  async getReactionsByCast(
    cast: flatbuffers.CastId,
    type?: flatbuffers.ReactionType
  ): HubAsyncResult<FBTypes.AmpAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.reactionDefinition().getReactionsByCast,
      requests.reactionRequests.getReactionsByCast(cast, type)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                             Verification Methods                           */
  /* -------------------------------------------------------------------------- */

  async getVerification(fid: Uint8Array, address: Uint8Array): HubAsyncResult<FBTypes.VerificationAddEthAddressModel> {
    return this.makeUnaryMessageRequest(
      definitions.verificationDefinition().getVerification,
      requests.verificationRequests.getVerification(fid, address)
    );
  }

  async getVerificationsByFid(fid: Uint8Array): HubAsyncResult<FBTypes.VerificationAddEthAddressModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.verificationDefinition().getVerificationsByFid,
      requests.verificationRequests.getVerificationsByFid(fid)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Signer Methods                             */
  /* -------------------------------------------------------------------------- */

  async getSigner(fid: Uint8Array, signer: Uint8Array): HubAsyncResult<FBTypes.SignerAddModel> {
    return this.makeUnaryMessageRequest(
      definitions.signerDefinition().getSigner,
      requests.signerRequests.getSigner(fid, signer)
    );
  }

  async getSignersByFid(fid: Uint8Array): HubAsyncResult<FBTypes.SignerAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.signerDefinition().getSignersByFid,
      requests.signerRequests.getSignersByFid(fid)
    );
  }

  async getCustodyEvent(fid: Uint8Array): HubAsyncResult<IdRegistryEventModel> {
    return this.makeUnaryIdRegistryEventRequest(
      definitions.signerDefinition().getCustodyEvent,
      requests.signerRequests.getCustodyEvent(fid)
    );
  }

  async getFids(): HubAsyncResult<Uint8Array[]> {
    const method = definitions.signerDefinition().getFids;
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        new flatbuffers.GetFidsRequest(),
        (e: grpc.ServiceError | null, response?: flatbuffers.FidsResponse) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            const fids: Uint8Array[] = [];
            for (let i = 0; i < response.fidsLength(); i++) {
              const fid = response.fids(i)?.fidArray();
              if (fid) {
                fids.push(fid);
              }
            }
            resolve(ok(fids));
          }
        }
      );
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                                User Data Methods                           */
  /* -------------------------------------------------------------------------- */

  async getUserData(fid: Uint8Array, type: flatbuffers.UserDataType): HubAsyncResult<FBTypes.UserDataAddModel> {
    return this.makeUnaryMessageRequest(
      definitions.userDataDefinition().getUserData,
      requests.userDataRequests.getUserData(fid, type)
    );
  }

  async getUserDataByFid(fid: Uint8Array): HubAsyncResult<FBTypes.UserDataAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.userDataDefinition().getUserDataByFid,
      requests.userDataRequests.getUserDataByFid(fid)
    );
  }

  async getNameRegistryEvent(fname: Uint8Array): HubAsyncResult<NameRegistryEventModel> {
    return this.makeUnaryNameRegistryEventRequest(
      definitions.userDataDefinition().getNameRegistryEvent,
      requests.userDataRequests.getNameRegistryEvent(fname)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Sync Methods                             */
  /* -------------------------------------------------------------------------- */

  async getAllCastMessagesByFid(fid: Uint8Array): HubAsyncResult<(FBTypes.CastAddModel | FBTypes.CastRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(
      definitions.syncDefinition().getAllCastMessagesByFid,
      requests.syncRequests.createSyncRequest(fid)
    );
  }

  async getAllAmpMessagesByFid(fid: Uint8Array): HubAsyncResult<(FBTypes.AmpAddModel | FBTypes.AmpRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(
      definitions.syncDefinition().getAllAmpMessagesByFid,
      requests.syncRequests.createSyncRequest(fid)
    );
  }

  async getAllReactionMessagesByFid(
    fid: Uint8Array
  ): HubAsyncResult<(FBTypes.ReactionAddModel | FBTypes.ReactionRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(
      definitions.syncDefinition().getAllReactionMessagesByFid,
      requests.syncRequests.createSyncRequest(fid)
    );
  }

  async getAllVerificationMessagesByFid(
    fid: Uint8Array
  ): HubAsyncResult<(FBTypes.VerificationAddEthAddressModel | FBTypes.VerificationRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(
      definitions.syncDefinition().getAllVerificationMessagesByFid,
      requests.syncRequests.createSyncRequest(fid)
    );
  }

  async getAllSignerMessagesByFid(
    fid: Uint8Array
  ): HubAsyncResult<(FBTypes.SignerAddModel | FBTypes.SignerRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(
      definitions.syncDefinition().getAllSignerMessagesByFid,
      requests.syncRequests.createSyncRequest(fid)
    );
  }

  async getAllUserDataMessagesByFid(fid: Uint8Array): HubAsyncResult<FBTypes.UserDataAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.syncDefinition().getAllUserDataMessagesByFid,
      requests.syncRequests.createSyncRequest(fid)
    );
  }

  async getSyncMetadataByPrefix(prefix: string): HubAsyncResult<NodeMetadata> {
    return this.makeUnarySyncNodeMetadataRequest(
      definitions.syncDefinition().getSyncMetadataByPrefix,
      requests.syncRequests.createByPrefixRequest(arrayify(Buffer.from(prefix)))
    );
  }

  async getAllMessagesBySyncIds(hashes: Uint8Array[]): HubAsyncResult<MessageModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.syncDefinition().getAllMessagesBySyncIds,
      requests.syncRequests.getAllMessagesByHashesRequest(hashes)
    );
  }

  async getSyncIdsByPrefix(prefix: string): HubAsyncResult<string[]> {
    return this.makeUnarySyncIdsByPrefixRequest(
      definitions.syncDefinition().getAllSyncIdsByPrefix,
      requests.syncRequests.createByPrefixRequest(arrayify(Buffer.from(prefix)))
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Event Methods                             */
  /* -------------------------------------------------------------------------- */

  async subscribe(): HubAsyncResult<ClientReadableStream<flatbuffers.EventResponse>> {
    const method = definitions.eventDefinition().subscribe;
    const request = new flatbuffers.SubscribeRequest();
    const stream = this.client.makeServerStreamRequest(
      method.path,
      method.requestSerialize,
      method.responseDeserialize,
      request
    );
    stream.on('error', (e) => {
      return e; // Suppress exceptions
    });
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        stream.cancel(); // Cancel if not connected within timeout
        reject(err(new HubError('unavailable.network_failure', 'subscribe timed out')));
      }, 1_000);
      stream.on('metadata', (metadata: Metadata) => {
        clearTimeout(timeout);
        if (metadata.get('status')[0] === ('ready' as MetadataValue)) {
          resolve(ok(stream));
        } else {
          reject(err(new HubError('unavailable.network_failure', 'subscribe failed')));
        }
      });
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private makeUnarySyncNodeMetadataRequest<RequestType>(
    method: grpc.MethodDefinition<RequestType, flatbuffers.TrieNodeMetadataResponse>,
    request: RequestType
  ): HubAsyncResult<NodeMetadata> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: flatbuffers.TrieNodeMetadataResponse) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            resolve(ok(fromNodeMetadataResponse(response)));
          }
        }
      );
    });
  }

  private makeUnarySyncIdsByPrefixRequest<RequestType>(
    method: grpc.MethodDefinition<RequestType, flatbuffers.GetAllSyncIdsByPrefixResponse>,
    request: RequestType
  ): HubAsyncResult<string[]> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: flatbuffers.GetAllSyncIdsByPrefixResponse) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            resolve(ok(fromSyncIdsByPrefixResponse(response)));
          }
        }
      );
    });
  }

  private makeUnaryIdRegistryEventRequest<RequestType>(
    method: grpc.MethodDefinition<RequestType, flatbuffers.IdRegistryEvent>,
    request: RequestType
  ): HubAsyncResult<IdRegistryEventModel> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: flatbuffers.IdRegistryEvent) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            resolve(ok(new IdRegistryEventModel(response)));
          }
        }
      );
    });
  }

  private makeUnaryNameRegistryEventRequest<RequestType>(
    method: grpc.MethodDefinition<RequestType, flatbuffers.NameRegistryEvent>,
    request: RequestType
  ): HubAsyncResult<NameRegistryEventModel> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: flatbuffers.NameRegistryEvent) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            resolve(ok(new NameRegistryEventModel(response)));
          }
        }
      );
    });
  }

  private makeUnaryMessageRequest<RequestType, ResponseMessageType extends MessageModel>(
    method: grpc.MethodDefinition<RequestType, flatbuffers.Message>,
    request: RequestType
  ): HubAsyncResult<ResponseMessageType> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: flatbuffers.Message) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            resolve(ok(new MessageModel(response) as ResponseMessageType));
          }
        }
      );
    });
  }

  private makeUnaryMessagesRequest<RequestType, ResponseMessageType extends MessageModel>(
    method: grpc.MethodDefinition<RequestType, flatbuffers.MessagesResponse>,
    request: RequestType
  ): HubAsyncResult<ResponseMessageType[]> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: flatbuffers.MessagesResponse) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            const messages: ResponseMessageType[] = [];
            for (let i = 0; i < response.messagesLength(); i++) {
              messages.push(
                MessageModel.from(response.messages(i)?.messageBytesArray() ?? new Uint8Array()) as ResponseMessageType
              );
            }
            resolve(ok(messages));
          }
        }
      );
    });
  }
}

export default Client;
