import grpc, { ClientReadableStream, Metadata, MetadataValue } from '@grpc/grpc-js';
import { ok, err } from 'neverthrow';
import MessageModel from '~/storage/flatbuffers/messageModel';
import {
  CastAddModel,
  CastRemoveModel,
  AmpAddModel,
  AmpRemoveModel,
  ReactionAddModel,
  ReactionRemoveModel,
  SignerAddModel,
  SignerRemoveModel,
  UserDataAddModel,
  VerificationAddEthAddressModel,
  VerificationRemoveModel,
} from '~/storage/flatbuffers/types';
import { CastId, Message, ReactionType, UserDataType, UserId } from '~/utils/generated/message_generated';
import {
  EventResponse,
  GetFidsRequest,
  MessagesResponse,
  SubscribeRequest,
  FidsResponse,
} from '~/utils/generated/rpc_generated';
import { HubAsyncResult, HubError } from '~/utils/hubErrors';
import { castServiceRequests, castServiceMethods } from '~/network/rpc/flatbuffers/castService';
import { fromServiceError } from '~/network/rpc/flatbuffers/server';
import { ampServiceMethods, ampServiceRequests } from '~/network/rpc/flatbuffers/ampService';
import { reactionServiceMethods, reactionServiceRequests } from '~/network/rpc/flatbuffers/reactionService';
import { verificationServiceMethods, verificationServiceRequests } from '~/network/rpc/flatbuffers/verificationService';
import { submitServiceMethods } from '~/network/rpc/flatbuffers/submitService';
import IdRegistryEventModel from '~/storage/flatbuffers/idRegistryEventModel';
import { IdRegistryEvent } from '~/utils/generated/id_registry_event_generated';
import { signerServiceMethods, signerServiceRequests } from '~/network/rpc/flatbuffers/signerService';
import { userDataServiceMethods, userDataServiceRequests } from '~/network/rpc/flatbuffers/userDataService';
import { createSyncServiceRequest, syncServiceMethods } from '~/network/rpc/flatbuffers/syncService';
import { eventServiceMethods } from '~/network/rpc/flatbuffers/eventService';
import NameRegistryEventModel from '~/storage/flatbuffers/nameRegistryEventModel';
import { NameRegistryEvent } from '~/utils/generated/name_registry_event_generated';
import { AddressInfo } from 'net';
import { addressInfoToString, ipMultiAddrStrFromAddressInfo } from '~/utils/p2p';
import { logger } from '~/utils/logger';

class Client {
  private client: grpc.Client;
  private serverAddr: string;

  constructor(addressInfo: AddressInfo) {
    const multiAddrResult = ipMultiAddrStrFromAddressInfo(addressInfo);
    if (multiAddrResult.isErr()) {
      logger.warn({ component: 'gRPC Client', address: addressInfo }, 'Failed to parse address as multiaddr');
    }
    this.serverAddr = `${multiAddrResult.unwrapOr('localhost')}/tcp/${addressInfo.port}`;

    const addressString = addressInfoToString(addressInfo);
    this.client = new grpc.Client(addressString, grpc.credentials.createInsecure());
  }

  get serverMultiaddr() {
    return this.serverAddr;
  }

  close() {
    this.client.close();
  }

  /* -------------------------------------------------------------------------- */
  /*                                Submit Methods                              */
  /* -------------------------------------------------------------------------- */

  async submitMessage(message: MessageModel): HubAsyncResult<MessageModel> {
    return this.makeUnaryMessageRequest(submitServiceMethods().submitMessage, message.message);
  }

  async submitContractEvent(event: IdRegistryEventModel): HubAsyncResult<IdRegistryEventModel> {
    return this.makeUnaryContractEventRequest(submitServiceMethods().submitContractEvent, event.event);
  }

  async submitNameRegistryEvent(event: NameRegistryEventModel): HubAsyncResult<NameRegistryEventModel> {
    return this.makeUnaryNameRegistryEventRequest(submitServiceMethods().submitNameRegistryEvent, event.event);
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Cast Methods                               */
  /* -------------------------------------------------------------------------- */

  async getCast(fid: Uint8Array, tsHash: Uint8Array): HubAsyncResult<CastAddModel> {
    return this.makeUnaryMessageRequest(castServiceMethods().getCast, castServiceRequests.getCast(fid, tsHash));
  }

  async getCastsByFid(fid: Uint8Array): HubAsyncResult<CastAddModel[]> {
    return this.makeUnaryMessagesRequest(castServiceMethods().getCastsByFid, castServiceRequests.getCastsByFid(fid));
  }

  async getCastsByParent(parent: CastId): HubAsyncResult<CastAddModel[]> {
    return this.makeUnaryMessagesRequest(
      castServiceMethods().getCastsByParent,
      castServiceRequests.getCastsByParent(parent)
    );
  }

  async getCastsByMention(mention: UserId): HubAsyncResult<CastAddModel[]> {
    return this.makeUnaryMessagesRequest(
      castServiceMethods().getCastsByMention,
      castServiceRequests.getCastsByMention(mention)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                Amp Methods                              */
  /* -------------------------------------------------------------------------- */

  async getAmp(fid: Uint8Array, user: UserId): HubAsyncResult<AmpAddModel> {
    return this.makeUnaryMessageRequest(ampServiceMethods().getAmp, ampServiceRequests.getAmp(fid, user));
  }

  async getAmpsByFid(fid: Uint8Array): HubAsyncResult<AmpAddModel[]> {
    return this.makeUnaryMessagesRequest(ampServiceMethods().getAmpsByFid, ampServiceRequests.getAmpsByFid(fid));
  }

  async getAmpsByUser(user: UserId): HubAsyncResult<AmpAddModel[]> {
    return this.makeUnaryMessagesRequest(ampServiceMethods().getAmpsByUser, ampServiceRequests.getAmpsByUser(user));
  }

  /* -------------------------------------------------------------------------- */
  /*                               Reaction Methods                             */
  /* -------------------------------------------------------------------------- */

  async getReaction(fid: Uint8Array, type: ReactionType, cast: CastId): HubAsyncResult<ReactionAddModel> {
    return this.makeUnaryMessageRequest(
      reactionServiceMethods().getReaction,
      reactionServiceRequests.getReaction(fid, type, cast)
    );
  }

  async getReactionsByFid(fid: Uint8Array, type?: ReactionType): HubAsyncResult<AmpAddModel[]> {
    return this.makeUnaryMessagesRequest(
      reactionServiceMethods().getReactionsByFid,
      reactionServiceRequests.getReactionsByFid(fid, type)
    );
  }

  async getReactionsByCast(cast: CastId, type?: ReactionType): HubAsyncResult<AmpAddModel[]> {
    return this.makeUnaryMessagesRequest(
      reactionServiceMethods().getReactionsByCast,
      reactionServiceRequests.getReactionsByCast(cast, type)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                             Verification Methods                           */
  /* -------------------------------------------------------------------------- */

  async getVerification(fid: Uint8Array, address: Uint8Array): HubAsyncResult<VerificationAddEthAddressModel> {
    return this.makeUnaryMessageRequest(
      verificationServiceMethods().getVerification,
      verificationServiceRequests.getVerification(fid, address)
    );
  }

  async getVerificationsByFid(fid: Uint8Array): HubAsyncResult<VerificationAddEthAddressModel[]> {
    return this.makeUnaryMessagesRequest(
      verificationServiceMethods().getVerificationsByFid,
      verificationServiceRequests.getVerificationsByFid(fid)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Signer Methods                             */
  /* -------------------------------------------------------------------------- */

  async getSigner(fid: Uint8Array, signer: Uint8Array): HubAsyncResult<SignerAddModel> {
    return this.makeUnaryMessageRequest(signerServiceMethods().getSigner, signerServiceRequests.getSigner(fid, signer));
  }

  async getSignersByFid(fid: Uint8Array): HubAsyncResult<SignerAddModel[]> {
    return this.makeUnaryMessagesRequest(
      signerServiceMethods().getSignersByFid,
      signerServiceRequests.getSignersByFid(fid)
    );
  }

  async getCustodyEvent(fid: Uint8Array): HubAsyncResult<IdRegistryEventModel> {
    return this.makeUnaryContractEventRequest(
      signerServiceMethods().getCustodyEvent,
      signerServiceRequests.getCustodyEvent(fid)
    );
  }

  async getFids(): HubAsyncResult<Uint8Array[]> {
    const method = signerServiceMethods().getFids;
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        new GetFidsRequest(),
        (e: grpc.ServiceError | null, response?: FidsResponse) => {
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

  async getUserData(fid: Uint8Array, type: UserDataType): HubAsyncResult<UserDataAddModel> {
    return this.makeUnaryMessageRequest(
      userDataServiceMethods().getUserData,
      userDataServiceRequests.getUserData(fid, type)
    );
  }

  async getUserDataByFid(fid: Uint8Array): HubAsyncResult<UserDataAddModel[]> {
    return this.makeUnaryMessagesRequest(
      userDataServiceMethods().getUserDataByFid,
      userDataServiceRequests.getUserDataByFid(fid)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Sync Methods                             */
  /* -------------------------------------------------------------------------- */

  async getAllCastMessagesByFid(fid: Uint8Array): HubAsyncResult<(CastAddModel | CastRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(syncServiceMethods().getAllCastMessagesByFid, createSyncServiceRequest(fid));
  }

  async getAllAmpMessagesByFid(fid: Uint8Array): HubAsyncResult<(AmpAddModel | AmpRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(syncServiceMethods().getAllAmpMessagesByFid, createSyncServiceRequest(fid));
  }

  async getAllReactionMessagesByFid(fid: Uint8Array): HubAsyncResult<(ReactionAddModel | ReactionRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(
      syncServiceMethods().getAllReactionMessagesByFid,
      createSyncServiceRequest(fid)
    );
  }

  async getAllVerificationMessagesByFid(
    fid: Uint8Array
  ): HubAsyncResult<(VerificationAddEthAddressModel | VerificationRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(
      syncServiceMethods().getAllVerificationMessagesByFid,
      createSyncServiceRequest(fid)
    );
  }

  async getAllSignerMessagesByFid(fid: Uint8Array): HubAsyncResult<(SignerAddModel | SignerRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(syncServiceMethods().getAllSignerMessagesByFid, createSyncServiceRequest(fid));
  }

  async getAllUserDataMessagesByFid(fid: Uint8Array): HubAsyncResult<UserDataAddModel[]> {
    return this.makeUnaryMessagesRequest(
      syncServiceMethods().getAllUserDataMessagesByFid,
      createSyncServiceRequest(fid)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Event Methods                             */
  /* -------------------------------------------------------------------------- */

  async subscribe(): HubAsyncResult<ClientReadableStream<EventResponse>> {
    const method = eventServiceMethods().subscribe;
    const request = new SubscribeRequest();
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

  private makeUnaryContractEventRequest<RequestType>(
    method: grpc.MethodDefinition<RequestType, IdRegistryEvent>,
    request: RequestType
  ): HubAsyncResult<IdRegistryEventModel> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: IdRegistryEvent) => {
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
    method: grpc.MethodDefinition<RequestType, NameRegistryEvent>,
    request: RequestType
  ): HubAsyncResult<NameRegistryEventModel> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: NameRegistryEvent) => {
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
    method: grpc.MethodDefinition<RequestType, Message>,
    request: RequestType
  ): HubAsyncResult<ResponseMessageType> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: Message) => {
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
    method: grpc.MethodDefinition<RequestType, MessagesResponse>,
    request: RequestType
  ): HubAsyncResult<ResponseMessageType[]> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: MessagesResponse) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            const messages: ResponseMessageType[] = [];
            for (let i = 0; i < response.messagesLength(); i++) {
              messages.push(new MessageModel(response.messages(i) ?? new Message()) as ResponseMessageType);
            }
            resolve(ok(messages));
          }
        }
      );
    });
  }
}

export default Client;
