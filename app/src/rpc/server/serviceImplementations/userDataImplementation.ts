import grpc from '@grpc/grpc-js';
import { Message } from '~/flatbuffers/generated/message_generated';
import { GetUserDataByFidRequest, GetUserDataRequest, MessagesResponse } from '~/flatbuffers/generated/rpc_generated';
import { UserDataAddModel } from '~/flatbuffers/models/types';
import { toMessagesResponse, toServiceError } from '~/rpc/server';
import Engine from '~/storage/engine';
import { HubError } from '~/utils/hubErrors';

export const userDataImplementations = (engine: Engine) => {
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
