import grpc from '@grpc/grpc-js';
import Engine from '~/storage/engine/flatbuffers';
import { GetCastRequest, GetCastsByUserRequest, MessagesResponse } from '~/utils/generated/rpc_generated';
import { defaultMethodDefinition, toMessagesResponse, toServiceError } from '~/network/rpc/flatbuffers/server';
import { toByteBuffer } from '~/storage/flatbuffers/utils';
import { GetCastsByParentRequest } from '~/utils/generated/farcaster/get-casts-by-parent-request';
import { GetCastsByMentionRequest } from '~/utils/generated/farcaster/get-casts-by-mention-request';
import { CastId, Message, UserId } from '~/utils/generated/message_generated';
import { CastAddModel } from '~/storage/flatbuffers/types';
import { HubError } from '~/utils/hubErrors';

export type CastServiceRequest =
  | GetCastsByUserRequest
  | GetCastRequest
  | GetCastsByParentRequest
  | GetCastsByMentionRequest;

export const castServiceAttrs = () => {
  return {
    getCastsByUser: {
      ...defaultMethodDefinition,
      path: '/getCastsByUser',
      requestDeserialize: (buffer: Buffer): GetCastsByUserRequest => {
        return GetCastsByUserRequest.getRootAsGetCastsByUserRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getCast: {
      ...defaultMethodDefinition,
      path: '/getCast',
      requestDeserialize: (buffer: Buffer): GetCastRequest => {
        return GetCastRequest.getRootAsGetCastRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): Message => {
        return Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getCastsByParent: {
      ...defaultMethodDefinition,
      path: '/getCastsByParent',
      requestDeserialize: (buffer: Buffer): GetCastsByParentRequest => {
        return GetCastsByParentRequest.getRootAsGetCastsByParentRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getCastsByMention: {
      ...defaultMethodDefinition,
      path: '/getCastsByMention',
      requestDeserialize: (buffer: Buffer): GetCastsByMentionRequest => {
        return GetCastsByMentionRequest.getRootAsGetCastsByMentionRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },
  };
};

export const castServiceImpls = (engine: Engine) => {
  return {
    getCastsByUser: async (
      call: grpc.ServerUnaryCall<GetCastsByUserRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const castsResult = await engine.getCastsByUser(call.request.user() ?? new UserId());
      castsResult.match(
        (messages: CastAddModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getCast: async (call: grpc.ServerUnaryCall<GetCastRequest, Message>, callback: grpc.sendUnaryData<Message>) => {
      const castAddResult = await engine.getCast(call.request.cast() ?? new CastId());
      castAddResult.match(
        (model: CastAddModel) => {
          callback(null, model.message);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getCastsByParent: async (
      call: grpc.ServerUnaryCall<GetCastsByParentRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const castsResult = await engine.getCastsByParent(call.request.parent() ?? new CastId());
      castsResult.match(
        (messages: CastAddModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getCastsByMention: async (
      call: grpc.ServerUnaryCall<GetCastsByMentionRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const castsResult = await engine.getCastsByMention(call.request.mention() ?? new UserId());
      castsResult.match(
        (messages: CastAddModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },
  };
};
