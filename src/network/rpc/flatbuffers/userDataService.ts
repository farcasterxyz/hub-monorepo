import grpc from '@grpc/grpc-js';
import Engine from '~/storage/engine/flatbuffers';
import {
  MessagesResponse,
  GetUserDataRequestT,
  GetUserDataByFidRequestT,
  GetUserDataRequest,
  GetUserDataByFidRequest,
} from '~/utils/generated/rpc_generated';
import { defaultMethod, toMessagesResponse, toServiceError } from '~/network/rpc/flatbuffers/server';
import { toByteBuffer } from '~/storage/flatbuffers/utils';
import { Message, UserDataType } from '~/utils/generated/message_generated';
import { HubError } from '~/utils/hubErrors';
import { Builder, ByteBuffer } from 'flatbuffers';
import { UserDataAddModel } from '~/storage/flatbuffers/types';

export const userDataServiceMethods = () => {
  return {
    getUserData: {
      ...defaultMethod,
      path: '/getUserData',
      requestDeserialize: (buffer: Buffer): GetUserDataRequest => {
        return GetUserDataRequest.getRootAsGetUserDataRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): Message => {
        return Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getUserDataByFid: {
      ...defaultMethod,
      path: '/getUserDataByFid',
      requestDeserialize: (buffer: Buffer): GetUserDataByFidRequest => {
        return GetUserDataByFidRequest.getRootAsGetUserDataByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },
  };
};

export const userDataServiceImpls = (engine: Engine) => {
  return {
    getUserData: async (
      call: grpc.ServerUnaryCall<GetUserDataRequest, Message>,
      callback: grpc.sendUnaryData<Message>
    ) => {
      const result = await engine.getUserData(call.request.fidArray() ?? new Uint8Array(), call.request.type());
      result.match(
        (model: UserDataAddModel) => {
          callback(null, model.message);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getUserDataByFid: async (
      call: grpc.ServerUnaryCall<GetUserDataByFidRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const result = await engine.getUserDataByFid(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (messages: UserDataAddModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },
  };
};

export const userDataServiceRequests = {
  getUserData: (fid: Uint8Array, type: UserDataType): GetUserDataRequest => {
    const builder = new Builder(1);
    const requestT = new GetUserDataRequestT(Array.from(fid), type);
    builder.finish(requestT.pack(builder));
    return GetUserDataRequest.getRootAsGetUserDataRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getUserDataByFid: (fid: Uint8Array): GetUserDataByFidRequest => {
    const builder = new Builder(1);
    const requestT = new GetUserDataByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return GetUserDataByFidRequest.getRootAsGetUserDataByFidRequest(new ByteBuffer(builder.asUint8Array()));
  },
};
