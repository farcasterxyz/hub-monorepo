import grpc from '@grpc/grpc-js';
import Engine from '~/storage/engine/flatbuffers';
import {
  MessagesResponse,
  GetAmpRequest,
  GetAmpsByFidRequest,
  GetAmpsByUserRequest,
  GetAmpRequestT,
  GetAmpsByFidRequestT,
  GetAmpsByUserRequestT,
} from '~/utils/generated/rpc_generated';
import { defaultMethod, toMessagesResponse, toServiceError } from '~/network/rpc/flatbuffers/server';
import { toByteBuffer } from '~/storage/flatbuffers/utils';
import { Message, UserId } from '~/utils/generated/message_generated';
import { AmpAddModel } from '~/storage/flatbuffers/types';
import { HubError } from '~/utils/hubErrors';
import { Builder, ByteBuffer } from 'flatbuffers';

export const ampServiceMethods = () => {
  return {
    getAmp: {
      ...defaultMethod,
      path: '/getAmp',
      requestDeserialize: (buffer: Buffer): GetAmpRequest => {
        return GetAmpRequest.getRootAsGetAmpRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): Message => {
        return Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getAmpsByFid: {
      ...defaultMethod,
      path: '/getAmpsByFid',
      requestDeserialize: (buffer: Buffer): GetAmpsByFidRequest => {
        return GetAmpsByFidRequest.getRootAsGetAmpsByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getAmpsByUser: {
      ...defaultMethod,
      path: '/getAmpsByUser',
      requestDeserialize: (buffer: Buffer): GetAmpsByUserRequest => {
        return GetAmpsByUserRequest.getRootAsGetAmpsByUserRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },
  };
};

export const ampServiceImpls = (engine: Engine) => {
  return {
    getAmp: async (call: grpc.ServerUnaryCall<GetAmpRequest, Message>, callback: grpc.sendUnaryData<Message>) => {
      const result = await engine.getAmp(
        call.request.fidArray() ?? new Uint8Array(),
        call.request.user() ?? new UserId()
      );
      result.match(
        (model: AmpAddModel) => {
          callback(null, model.message);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getAmpsByFid: async (
      call: grpc.ServerUnaryCall<GetAmpsByFidRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const ampsResult = await engine.getAmpsByFid(call.request.fidArray() ?? new Uint8Array());
      ampsResult.match(
        (messages: AmpAddModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getAmpsByUser: async (
      call: grpc.ServerUnaryCall<GetAmpsByUserRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const ampsResult = await engine.getAmpsByUser(call.request.user() ?? new UserId());
      ampsResult.match(
        (messages: AmpAddModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },
  };
};

export const ampServiceRequests = {
  getAmp: (fid: Uint8Array, user: UserId): GetAmpRequest => {
    const builder = new Builder(1);
    const requestT = new GetAmpRequestT(Array.from(fid), user.unpack());
    builder.finish(requestT.pack(builder));
    return GetAmpRequest.getRootAsGetAmpRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getAmpsByFid: (fid: Uint8Array): GetAmpsByFidRequest => {
    const builder = new Builder(1);
    const requestT = new GetAmpsByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return GetAmpsByFidRequest.getRootAsGetAmpsByFidRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getAmpsByUser: (user: UserId): GetAmpsByUserRequest => {
    const builder = new Builder(1);
    const requestT = new GetAmpsByUserRequestT(user.unpack());
    builder.finish(requestT.pack(builder));
    return GetAmpsByUserRequest.getRootAsGetAmpsByUserRequest(new ByteBuffer(builder.asUint8Array()));
  },
};
