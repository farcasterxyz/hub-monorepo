import * as rpc_generated from '@farcaster/flatbuffers';
import { Message } from '@farcaster/flatbuffers';
import { HubError } from '@farcaster/utils';
import grpc from '@grpc/grpc-js';
import { VerificationAddEthAddressModel } from '~/flatbuffers/models/types';
import { toMessagesResponse, toServiceError } from '~/rpc/server';
import Engine from '~/storage/engine';

export const verificationImplementations = (engine: Engine) => {
  return {
    getVerification: async (
      call: grpc.ServerUnaryCall<rpc_generated.GetVerificationRequest, Message>,
      callback: grpc.sendUnaryData<Message>
    ) => {
      const result = await engine.getVerification(
        call.request.fidArray() ?? new Uint8Array(),
        call.request.addressArray() ?? new Uint8Array()
      );
      result.match(
        (model: VerificationAddEthAddressModel) => {
          callback(null, model.message);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getVerificationsByFid: async (
      call: grpc.ServerUnaryCall<rpc_generated.GetVerificationsByFidRequest, rpc_generated.MessagesResponse>,
      callback: grpc.sendUnaryData<rpc_generated.MessagesResponse>
    ) => {
      const result = await engine.getVerificationsByFid(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (messages: VerificationAddEthAddressModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },
  };
};
