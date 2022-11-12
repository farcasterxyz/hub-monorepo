import grpc from '@grpc/grpc-js';
import { ok, err } from 'neverthrow';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { CastAddModel, FollowAddModel } from '~/storage/flatbuffers/types';
import { CastId, Message, UserId } from '~/utils/generated/message_generated';
import { MessagesResponse } from '~/utils/generated/rpc_generated';
import { HubAsyncResult } from '~/utils/hubErrors';
import { castServiceRequests, castServiceMethods } from '~/network/rpc/flatbuffers/castService';
import { fromServiceError } from './server';
import { followServiceMethods, followServiceRequests } from './followService';

class Client {
  client: grpc.Client;

  constructor(port: number) {
    this.client = new grpc.Client(`localhost:${port}`, grpc.credentials.createInsecure());
  }

  close() {
    this.client.close();
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
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

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
