import grpc from '@grpc/grpc-js';
import * as rpc_generated from '@hub/flatbuffers';
import { CastId, Message, UserId } from '@hub/flatbuffers';
import { HubError } from '@hub/utils';
import { CastAddModel } from '~/flatbuffers/models/types';
import { toMessagesResponse, toServiceError } from '~/rpc/server';
import Engine from '~/storage/engine';

export const castImplementation = (engine: Engine) => {
  return {
    getCast: async (
      call: grpc.ServerUnaryCall<rpc_generated.GetCastRequest, Message>,
      callback: grpc.sendUnaryData<Message>
    ) => {
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
      call: grpc.ServerUnaryCall<rpc_generated.GetCastsByFidRequest, rpc_generated.MessagesResponse>,
      callback: grpc.sendUnaryData<rpc_generated.MessagesResponse>
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
      call: grpc.ServerUnaryCall<rpc_generated.GetCastsByParentRequest, rpc_generated.MessagesResponse>,
      callback: grpc.sendUnaryData<rpc_generated.MessagesResponse>
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
      call: grpc.ServerUnaryCall<rpc_generated.GetCastsByMentionRequest, rpc_generated.MessagesResponse>,
      callback: grpc.sendUnaryData<rpc_generated.MessagesResponse>
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
