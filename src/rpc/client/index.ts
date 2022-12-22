import grpc, { ClientReadableStream, Metadata, MetadataValue } from '@grpc/grpc-js';
import { AddressInfo } from 'net';
import { ok, err } from 'neverthrow';
import { IdRegistryEvent } from '~/flatbuffers/generated/id_registry_event_generated';
import { CastId, Message, ReactionType, UserDataType, UserId } from '~/flatbuffers/generated/message_generated';
import { NameRegistryEvent } from '~/flatbuffers/generated/name_registry_event_generated';
import * as rpc_generated from '~/flatbuffers/generated/rpc_generated';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import * as FBTypes from '~/flatbuffers/models/types';
import * as requests from '~/rpc/client/serviceRequests';
import * as definitions from '~/rpc/serviceDefinitions';
import { HubAsyncResult, HubError, HubErrorCode } from '~/utils/hubErrors';
import { logger } from '~/utils/logger';
import { addressInfoToString, ipMultiAddrStrFromAddressInfo } from '~/utils/p2p';

/**
 * "The Right Way"
 *
 * 1. Client constructor must not include multiaddr, that should be done in method or superclass.
 * 2. Factor out HubResult/HubErrors from all shared code or share Result types across backend and Hub
 * 3. Factor out RocksDB specific code from MessageModels, since the backend does not know / care about them
 * 4. Turn rpc and flatbuffs into yarn sub-projects with their own deps so they can be easily imported and refd
 */

const fromServiceError = (err: grpc.ServiceError): HubError => {
  return new HubError(err.metadata.get('errCode')[0] as HubErrorCode, err.details);
};

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
    return this.makeUnaryMessageRequest(definitions.submitDefinition().submitMessage, message.message);
  }

  async submitIdRegistryEvent(event: IdRegistryEventModel): HubAsyncResult<IdRegistryEventModel> {
    return this.makeUnaryContractEventRequest(definitions.submitDefinition().submitIdRegistryEvent, event.event);
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

  async getCastsByParent(parent: CastId): HubAsyncResult<FBTypes.CastAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.castDefinition().getCastsByParent,
      requests.castRequests.getCastsByParent(parent)
    );
  }

  async getCastsByMention(mention: UserId): HubAsyncResult<FBTypes.CastAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.castDefinition().getCastsByMention,
      requests.castRequests.getCastsByMention(mention)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                Amp Methods                              */
  /* -------------------------------------------------------------------------- */

  async getAmp(fid: Uint8Array, user: UserId): HubAsyncResult<FBTypes.AmpAddModel> {
    return this.makeUnaryMessageRequest(definitions.ampDefinition().getAmp, requests.ampRequests.getAmp(fid, user));
  }

  async getAmpsByFid(fid: Uint8Array): HubAsyncResult<FBTypes.AmpAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.ampDefinition().getAmpsByFid,
      requests.ampRequests.getAmpsByFid(fid)
    );
  }

  async getAmpsByUser(user: UserId): HubAsyncResult<FBTypes.AmpAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.ampDefinition().getAmpsByUser,
      requests.ampRequests.getAmpsByUser(user)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                               Reaction Methods                             */
  /* -------------------------------------------------------------------------- */

  async getReaction(fid: Uint8Array, type: ReactionType, cast: CastId): HubAsyncResult<FBTypes.ReactionAddModel> {
    return this.makeUnaryMessageRequest(
      definitions.reactionDefinition().getReaction,
      requests.reactionRequests.getReaction(fid, type, cast)
    );
  }

  async getReactionsByFid(fid: Uint8Array, type?: ReactionType): HubAsyncResult<FBTypes.AmpAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.reactionDefinition().getReactionsByFid,
      requests.reactionRequests.getReactionsByFid(fid, type)
    );
  }

  async getReactionsByCast(cast: CastId, type?: ReactionType): HubAsyncResult<FBTypes.AmpAddModel[]> {
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
    return this.makeUnaryContractEventRequest(
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
        new rpc_generated.GetFidsRequest(),
        (e: grpc.ServiceError | null, response?: rpc_generated.FidsResponse) => {
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

  async getUserData(fid: Uint8Array, type: UserDataType): HubAsyncResult<FBTypes.UserDataAddModel> {
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

  /* -------------------------------------------------------------------------- */
  /*                                   Sync Methods                             */
  /* -------------------------------------------------------------------------- */

  async getAllCastMessagesByFid(fid: Uint8Array): HubAsyncResult<(FBTypes.CastAddModel | FBTypes.CastRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(
      definitions.syncDefinition().getAllCastMessagesByFid,
      requests.createSyncRequest(fid)
    );
  }

  async getAllAmpMessagesByFid(fid: Uint8Array): HubAsyncResult<(FBTypes.AmpAddModel | FBTypes.AmpRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(
      definitions.syncDefinition().getAllAmpMessagesByFid,
      requests.createSyncRequest(fid)
    );
  }

  async getAllReactionMessagesByFid(
    fid: Uint8Array
  ): HubAsyncResult<(FBTypes.ReactionAddModel | FBTypes.ReactionRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(
      definitions.syncDefinition().getAllReactionMessagesByFid,
      requests.createSyncRequest(fid)
    );
  }

  async getAllVerificationMessagesByFid(
    fid: Uint8Array
  ): HubAsyncResult<(FBTypes.VerificationAddEthAddressModel | FBTypes.VerificationRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(
      definitions.syncDefinition().getAllVerificationMessagesByFid,
      requests.createSyncRequest(fid)
    );
  }

  async getAllSignerMessagesByFid(
    fid: Uint8Array
  ): HubAsyncResult<(FBTypes.SignerAddModel | FBTypes.SignerRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(
      definitions.syncDefinition().getAllSignerMessagesByFid,
      requests.createSyncRequest(fid)
    );
  }

  async getAllUserDataMessagesByFid(fid: Uint8Array): HubAsyncResult<FBTypes.UserDataAddModel[]> {
    return this.makeUnaryMessagesRequest(
      definitions.syncDefinition().getAllUserDataMessagesByFid,
      requests.createSyncRequest(fid)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Event Methods                             */
  /* -------------------------------------------------------------------------- */

  async subscribe(): HubAsyncResult<ClientReadableStream<rpc_generated.EventResponse>> {
    const method = definitions.eventDefinition().subscribe;
    const request = new rpc_generated.SubscribeRequest();
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
    method: grpc.MethodDefinition<RequestType, rpc_generated.MessagesResponse>,
    request: RequestType
  ): HubAsyncResult<ResponseMessageType[]> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: rpc_generated.MessagesResponse) => {
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
