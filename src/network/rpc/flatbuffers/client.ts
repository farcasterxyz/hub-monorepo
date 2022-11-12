import grpc from '@grpc/grpc-js';
import { Builder, ByteBuffer } from 'flatbuffers';
import { ok, err } from 'neverthrow';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { CastAddModel } from '~/storage/flatbuffers/types';
import { CastId, Message, UserId } from '~/utils/generated/message_generated';
import {
  GetCastRequest,
  GetCastRequestT,
  GetCastsByMentionRequest,
  GetCastsByMentionRequestT,
  GetCastsByParentRequest,
  GetCastsByParentRequestT,
  GetCastsByUserRequest,
  GetCastsByUserRequestT,
  MessagesResponse,
} from '~/utils/generated/rpc_generated';
import { HubAsyncResult } from '~/utils/hubErrors';
import { castServiceAttrs } from './castService';
import { fromServiceError } from './server';

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

  async getCastsByUser(user: UserId): HubAsyncResult<CastAddModel[]> {
    const builder = new Builder(1);
    const requestT = new GetCastsByUserRequestT(user.unpack());
    builder.finish(requestT.pack(builder));
    const request = GetCastsByUserRequest.getRootAsGetCastsByUserRequest(new ByteBuffer(builder.asUint8Array()));

    return this.makeUnaryMessagesRequest(castServiceAttrs().getCastsByUser, request);
  }

  async getCast(cast: CastId): HubAsyncResult<CastAddModel> {
    const builder = new Builder(1);
    const requestT = new GetCastRequestT(cast.unpack());
    builder.finish(requestT.pack(builder));
    const request = GetCastRequest.getRootAsGetCastRequest(new ByteBuffer(builder.asUint8Array()));

    return this.makeUnaryMessageRequest(castServiceAttrs().getCast, request);
  }

  async getCastsByParent(parent: CastId): HubAsyncResult<CastAddModel[]> {
    const builder = new Builder(1);
    const requestT = new GetCastsByParentRequestT(parent.unpack());
    builder.finish(requestT.pack(builder));
    const request = GetCastsByParentRequest.getRootAsGetCastsByParentRequest(new ByteBuffer(builder.asUint8Array()));

    return this.makeUnaryMessagesRequest(castServiceAttrs().getCastsByParent, request);
  }

  async getCastsByMention(mention: UserId): HubAsyncResult<CastAddModel[]> {
    const builder = new Builder(1);
    const requestT = new GetCastsByMentionRequestT(mention.unpack());
    builder.finish(requestT.pack(builder));
    const request = GetCastsByMentionRequest.getRootAsGetCastsByMentionRequest(new ByteBuffer(builder.asUint8Array()));

    return this.makeUnaryMessagesRequest(castServiceAttrs().getCastsByMention, request);
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
