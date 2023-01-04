import grpc from '@grpc/grpc-js';
import { HubError } from '@hub/errors';
import * as rpc_generated from '@hub/flatbuffers';
import { Message, UserId } from '@hub/flatbuffers';
import { AmpAddModel } from '~/flatbuffers/models/types';
import { toMessagesResponse, toServiceError } from '~/rpc/server';
import Engine from '~/storage/engine';

export const ampImplementation = (engine: Engine) => {
  return {
    getAmp: async (
      call: grpc.ServerUnaryCall<rpc_generated.GetAmpRequest, Message>,
      callback: grpc.sendUnaryData<Message>
    ) => {
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
      call: grpc.ServerUnaryCall<rpc_generated.GetAmpsByFidRequest, rpc_generated.MessagesResponse>,
      callback: grpc.sendUnaryData<rpc_generated.MessagesResponse>
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
      call: grpc.ServerUnaryCall<rpc_generated.GetAmpsByUserRequest, rpc_generated.MessagesResponse>,
      callback: grpc.sendUnaryData<rpc_generated.MessagesResponse>
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
