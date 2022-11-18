import grpc from '@grpc/grpc-js';
import { ok, err } from 'neverthrow';
import MessageModel from '~/storage/flatbuffers/messageModel';
import {
  CastAddModel,
  CastRemoveModel,
  FollowAddModel,
  FollowRemoveModel,
  ReactionAddModel,
  ReactionRemoveModel,
  SignerAddModel,
  SignerRemoveModel,
  UserDataAddModel,
  VerificationAddEthAddressModel,
  VerificationRemoveModel,
} from '~/storage/flatbuffers/types';
import { CastId, Message, ReactionType, UserDataType, UserId } from '~/utils/generated/message_generated';
import { GetFidsRequest, MessagesResponse } from '~/utils/generated/rpc_generated';
import { HubAsyncResult } from '~/utils/hubErrors';
import { castServiceRequests, castServiceMethods } from '~/network/rpc/flatbuffers/castService';
import { fromServiceError } from './server';
import { followServiceMethods, followServiceRequests } from './followService';
import { reactionServiceMethods, reactionServiceRequests } from './reactionService';
import { verificationServiceMethods, verificationServiceRequests } from './verificationService';
import { submitServiceMethods } from './submitService';
import ContractEventModel from '~/storage/flatbuffers/contractEventModel';
import { ContractEvent } from '~/utils/generated/contract_event_generated';
import { signerServiceMethods, signerServiceRequests } from './signerService';
import { userDataServiceMethods, userDataServiceRequests } from './userDataService';
import { FidsResponse } from '~/utils/generated/farcaster/fids-response';
import { createSyncServiceRequest, syncServiceMethods } from './syncService';

class Client {
  client: grpc.Client;

  constructor(port: number) {
    this.client = new grpc.Client(`localhost:${port}`, grpc.credentials.createInsecure());
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

  async submitContractEvent(event: ContractEventModel): HubAsyncResult<ContractEventModel> {
    return this.makeUnaryContractEventRequest(submitServiceMethods().submitContractEvent, event.event);
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
  /*                                Follow Methods                              */
  /* -------------------------------------------------------------------------- */

  async getFollow(fid: Uint8Array, user: UserId): HubAsyncResult<FollowAddModel> {
    return this.makeUnaryMessageRequest(followServiceMethods().getFollow, followServiceRequests.getFollow(fid, user));
  }

  async getFollowsByFid(fid: Uint8Array): HubAsyncResult<FollowAddModel[]> {
    return this.makeUnaryMessagesRequest(
      followServiceMethods().getFollowsByFid,
      followServiceRequests.getFollowsByFid(fid)
    );
  }

  async getFollowsByUser(user: UserId): HubAsyncResult<FollowAddModel[]> {
    return this.makeUnaryMessagesRequest(
      followServiceMethods().getFollowsByUser,
      followServiceRequests.getFollowsByUser(user)
    );
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

  async getReactionsByFid(fid: Uint8Array, type?: ReactionType): HubAsyncResult<FollowAddModel[]> {
    return this.makeUnaryMessagesRequest(
      reactionServiceMethods().getReactionsByFid,
      reactionServiceRequests.getReactionsByFid(fid, type)
    );
  }

  async getReactionsByCast(cast: CastId, type?: ReactionType): HubAsyncResult<FollowAddModel[]> {
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

  async getCustodyEvent(fid: Uint8Array): HubAsyncResult<ContractEventModel> {
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

  async getAllFollowMessagesByFid(fid: Uint8Array): HubAsyncResult<(FollowAddModel | FollowRemoveModel)[]> {
    return this.makeUnaryMessagesRequest(syncServiceMethods().getAllFollowMessagesByFid, createSyncServiceRequest(fid));
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
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private makeUnaryContractEventRequest<RequestType>(
    method: grpc.MethodDefinition<RequestType, ContractEvent>,
    request: RequestType
  ): HubAsyncResult<ContractEventModel> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: ContractEvent) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            resolve(ok(new ContractEventModel(response)));
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
