import grpc from '@grpc/grpc-js';
import {
  GetNameRegistryEventRequest,
  GetUserDataByFidRequest,
  GetUserDataRequest,
  Message,
  MessagesResponse,
  NameRegistryEvent,
} from '@hub/flatbuffers';
import { HubError } from '@hub/utils';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import { UserDataAddModel } from '~/flatbuffers/models/types';
import { toMessagesResponse, toServiceError } from '~/rpc/server';
import Engine from '~/storage/engine';

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

    getNameRegistryEvent: async (
      call: grpc.ServerUnaryCall<GetNameRegistryEventRequest, NameRegistryEvent>,
      callback: grpc.sendUnaryData<NameRegistryEvent>
    ) => {
      const result = await engine.getNameRegistryEvent(call.request.fnameArray() ?? new Uint8Array());
      result.match(
        (model: NameRegistryEventModel) => {
          callback(null, model.event);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },
  };
};
