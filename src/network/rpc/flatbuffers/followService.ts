import grpc from '@grpc/grpc-js';
import Engine from '~/storage/engine/flatbuffers';
import {
  MessagesResponse,
  GetFollowRequest,
  GetFollowsByFidRequest,
  GetFollowsByUserRequest,
  GetFollowRequestT,
  GetFollowsByFidRequestT,
  GetFollowsByUserRequestT,
} from '~/utils/generated/rpc_generated';
import { defaultMethod, toMessagesResponse, toServiceError } from '~/network/rpc/flatbuffers/server';
import { toByteBuffer } from '~/storage/flatbuffers/utils';
import { Message, UserId } from '~/utils/generated/message_generated';
import { FollowAddModel } from '~/storage/flatbuffers/types';
import { HubError } from '~/utils/hubErrors';
import { Builder, ByteBuffer } from 'flatbuffers';

export const followServiceMethods = () => {
  return {
    getFollow: {
      ...defaultMethod,
      path: '/getFollow',
      requestDeserialize: (buffer: Buffer): GetFollowRequest => {
        return GetFollowRequest.getRootAsGetFollowRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): Message => {
        return Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getFollowsByFid: {
      ...defaultMethod,
      path: '/getFollowsByFid',
      requestDeserialize: (buffer: Buffer): GetFollowsByFidRequest => {
        return GetFollowsByFidRequest.getRootAsGetFollowsByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getFollowsByUser: {
      ...defaultMethod,
      path: '/getFollowsByUser',
      requestDeserialize: (buffer: Buffer): GetFollowsByUserRequest => {
        return GetFollowsByUserRequest.getRootAsGetFollowsByUserRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },
  };
};

export const followServiceImpls = (engine: Engine) => {
  return {
    getFollow: async (call: grpc.ServerUnaryCall<GetFollowRequest, Message>, callback: grpc.sendUnaryData<Message>) => {
      const castAddResult = await engine.getFollow(
        call.request.fidArray() ?? new Uint8Array(),
        call.request.user() ?? new UserId()
      );
      castAddResult.match(
        (model: FollowAddModel) => {
          callback(null, model.message);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getFollowsByFid: async (
      call: grpc.ServerUnaryCall<GetFollowsByFidRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const followsResult = await engine.getFollowsByFid(call.request.fidArray() ?? new Uint8Array());
      followsResult.match(
        (messages: FollowAddModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getFollowsByUser: async (
      call: grpc.ServerUnaryCall<GetFollowsByUserRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const followsResult = await engine.getFollowsByUser(call.request.user() ?? new UserId());
      followsResult.match(
        (messages: FollowAddModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },
  };
};

export const followServiceRequests = {
  getFollow: (fid: Uint8Array, user: UserId): GetFollowRequest => {
    const builder = new Builder(1);
    const requestT = new GetFollowRequestT(Array.from(fid), user.unpack());
    builder.finish(requestT.pack(builder));
    return GetFollowRequest.getRootAsGetFollowRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getFollowsByFid: (fid: Uint8Array): GetFollowsByFidRequest => {
    const builder = new Builder(1);
    const requestT = new GetFollowsByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return GetFollowsByFidRequest.getRootAsGetFollowsByFidRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getFollowsByUser: (user: UserId): GetFollowsByUserRequest => {
    const builder = new Builder(1);
    const requestT = new GetFollowsByUserRequestT(user.unpack());
    builder.finish(requestT.pack(builder));
    return GetFollowsByUserRequest.getRootAsGetFollowsByUserRequest(new ByteBuffer(builder.asUint8Array()));
  },
};
