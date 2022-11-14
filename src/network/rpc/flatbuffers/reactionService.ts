import grpc from '@grpc/grpc-js';
import Engine from '~/storage/engine/flatbuffers';
import {
  MessagesResponse,
  GetReactionRequest,
  GetReactionsByFidRequest,
  GetReactionsByCastRequest,
  GetReactionRequestT,
  GetReactionsByFidRequestT,
  GetReactionsByCastRequestT,
} from '~/utils/generated/rpc_generated';
import { defaultMethod, toMessagesResponse, toServiceError } from '~/network/rpc/flatbuffers/server';
import { toByteBuffer } from '~/storage/flatbuffers/utils';
import { CastId, Message, ReactionType } from '~/utils/generated/message_generated';
import { HubError } from '~/utils/hubErrors';
import { Builder, ByteBuffer } from 'flatbuffers';
import { ReactionAddModel } from '~/storage/flatbuffers/types';

export const reactionServiceMethods = () => {
  return {
    getReaction: {
      ...defaultMethod,
      path: '/getReaction',
      requestDeserialize: (buffer: Buffer): GetReactionRequest => {
        return GetReactionRequest.getRootAsGetReactionRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): Message => {
        return Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getReactionsByFid: {
      ...defaultMethod,
      path: '/getReactionsByFid',
      requestDeserialize: (buffer: Buffer): GetReactionsByFidRequest => {
        return GetReactionsByFidRequest.getRootAsGetReactionsByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getReactionsByCast: {
      ...defaultMethod,
      path: '/getReactionsByCast',
      requestDeserialize: (buffer: Buffer): GetReactionsByCastRequest => {
        return GetReactionsByCastRequest.getRootAsGetReactionsByCastRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },
  };
};

export const reactionServiceImpls = (engine: Engine) => {
  return {
    getReaction: async (
      call: grpc.ServerUnaryCall<GetReactionRequest, Message>,
      callback: grpc.sendUnaryData<Message>
    ) => {
      const result = await engine.getReaction(
        call.request.fidArray() ?? new Uint8Array(),
        call.request.type(),
        call.request.cast() ?? new CastId()
      );
      result.match(
        (model: ReactionAddModel) => {
          callback(null, model.message);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getReactionsByFid: async (
      call: grpc.ServerUnaryCall<GetReactionsByFidRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const result = await engine.getReactionsByFid(
        call.request.fidArray() ?? new Uint8Array(),
        call.request.type() ?? undefined
      );
      result.match(
        (messages: ReactionAddModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getReactionsByCast: async (
      call: grpc.ServerUnaryCall<GetReactionsByCastRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const result = await engine.getReactionsByCast(
        call.request.cast() ?? new CastId(),
        call.request.type() ?? undefined
      );
      result.match(
        (messages: ReactionAddModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },
  };
};

export const reactionServiceRequests = {
  getReaction: (fid: Uint8Array, type: ReactionType, cast: CastId): GetReactionRequest => {
    const builder = new Builder(1);
    const requestT = new GetReactionRequestT(Array.from(fid), type, cast.unpack());
    builder.finish(requestT.pack(builder));
    return GetReactionRequest.getRootAsGetReactionRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getReactionsByFid: (fid: Uint8Array, type?: ReactionType): GetReactionsByFidRequest => {
    const builder = new Builder(1);
    const requestT = new GetReactionsByFidRequestT(Array.from(fid), type);
    builder.finish(requestT.pack(builder));
    return GetReactionsByFidRequest.getRootAsGetReactionsByFidRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getReactionsByCast: (cast: CastId, type?: ReactionType): GetReactionsByCastRequest => {
    const builder = new Builder(1);
    const requestT = new GetReactionsByCastRequestT(cast.unpack(), type);
    builder.finish(requestT.pack(builder));
    return GetReactionsByCastRequest.getRootAsGetReactionsByCastRequest(new ByteBuffer(builder.asUint8Array()));
  },
};
