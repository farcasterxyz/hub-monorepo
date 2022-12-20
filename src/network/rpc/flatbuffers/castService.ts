import grpc from '@grpc/grpc-js';
import { Builder, ByteBuffer } from 'flatbuffers';
import { defaultMethod, toMessagesResponse, toServiceError } from '~/network/rpc/flatbuffers/server';
import Engine from '~/storage/engine/flatbuffers';
import { CastAddModel } from '~/storage/flatbuffers/types';
import { toByteBuffer } from '~/storage/flatbuffers/utils';
import { CastId, Message, UserId } from '~/utils/generated/message_generated';
import {
  GetCastRequest,
  GetCastsByFidRequest,
  GetCastsByParentRequest,
  GetCastsByMentionRequest,
  MessagesResponse,
  GetCastsByFidRequestT,
  GetCastRequestT,
  GetCastsByParentRequestT,
  GetCastsByMentionRequestT,
} from '~/utils/generated/rpc_generated';
import { HubError } from '~/utils/hubErrors';

export const castServiceMethods = () => {
  return {
    getCast: {
      ...defaultMethod,
      path: '/getCast',
      requestDeserialize: (buffer: Buffer): GetCastRequest => {
        return GetCastRequest.getRootAsGetCastRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): Message => {
        return Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getCastsByFid: {
      ...defaultMethod,
      path: '/getCastsByFid',
      requestDeserialize: (buffer: Buffer): GetCastsByFidRequest => {
        return GetCastsByFidRequest.getRootAsGetCastsByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getCastsByParent: {
      ...defaultMethod,
      path: '/getCastsByParent',
      requestDeserialize: (buffer: Buffer): GetCastsByParentRequest => {
        return GetCastsByParentRequest.getRootAsGetCastsByParentRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getCastsByMention: {
      ...defaultMethod,
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
    getCast: async (call: grpc.ServerUnaryCall<GetCastRequest, Message>, callback: grpc.sendUnaryData<Message>) => {
      const castAddResult = await engine.getCast(
        call.request.fidArray() ?? new Uint8Array(),
        call.request.tsHashArray() ?? new Uint8Array()
      );
      castAddResult.match(
        (model: CastAddModel) => {
          callback(null, model.message);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getCastsByFid: async (
      call: grpc.ServerUnaryCall<GetCastsByFidRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const castsResult = await engine.getCastsByFid(call.request.fidArray() ?? new Uint8Array());
      castsResult.match(
        (messages: CastAddModel[]) => {
          callback(null, toMessagesResponse(messages));
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

export const castServiceRequests = {
  getCast: (fid: Uint8Array, tsHash: Uint8Array): GetCastRequest => {
    const builder = new Builder(1);
    const requestT = new GetCastRequestT(Array.from(fid), Array.from(tsHash));
    builder.finish(requestT.pack(builder));
    return GetCastRequest.getRootAsGetCastRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getCastsByFid: (fid: Uint8Array): GetCastsByFidRequest => {
    const builder = new Builder(1);
    const requestT = new GetCastsByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return GetCastsByFidRequest.getRootAsGetCastsByFidRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getCastsByParent: (parent: CastId): GetCastsByParentRequest => {
    const builder = new Builder(1);
    const requestT = new GetCastsByParentRequestT(parent.unpack());
    builder.finish(requestT.pack(builder));
    return GetCastsByParentRequest.getRootAsGetCastsByParentRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getCastsByMention: (mention: UserId): GetCastsByMentionRequest => {
    const builder = new Builder(1);
    const requestT = new GetCastsByMentionRequestT(mention.unpack());
    builder.finish(requestT.pack(builder));
    return GetCastsByMentionRequest.getRootAsGetCastsByMentionRequest(new ByteBuffer(builder.asUint8Array()));
  },
};
