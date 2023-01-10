import * as flatbuffers from '@farcaster/flatbuffers';
import { HubError } from '@farcaster/utils';
import grpc from '@grpc/grpc-js';
import { Builder, ByteBuffer } from 'flatbuffers';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import { SignerAddModel } from '~/flatbuffers/models/types';
import { toMessagesResponse, toServiceError } from '~/rpc/server';
import Engine from '~/storage/engine';

export const signerImplementation = (engine: Engine) => {
  return {
    getSigner: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetSignerRequest, flatbuffers.Message>,
      callback: grpc.sendUnaryData<flatbuffers.Message>
    ) => {
      const result = await engine.getSigner(
        call.request.fidArray() ?? new Uint8Array(),
        call.request.signerArray() ?? new Uint8Array()
      );
      result.match(
        (model: SignerAddModel) => {
          callback(null, model.message);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getSignersByFid: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetSignersByFidRequest, flatbuffers.MessagesResponse>,
      callback: grpc.sendUnaryData<flatbuffers.MessagesResponse>
    ) => {
      const result = await engine.getSignersByFid(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (messages: SignerAddModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getCustodyEvent: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetCustodyEventRequest, flatbuffers.IdRegistryEvent>,
      callback: grpc.sendUnaryData<flatbuffers.IdRegistryEvent>
    ) => {
      const result = await engine.getCustodyEvent(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (model: IdRegistryEventModel) => {
          callback(null, model.event);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getFids: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetFidsRequest, flatbuffers.FidsResponse>,
      callback: grpc.sendUnaryData<flatbuffers.FidsResponse>
    ) => {
      const result = await engine.getFids();
      result.match(
        (fids: Uint8Array[]) => {
          const responseT = new flatbuffers.FidsResponseT(fids.map((fid) => new flatbuffers.UserIdT(Array.from(fid))));
          const builder = new Builder(1);
          builder.finish(responseT.pack(builder));
          const response = flatbuffers.FidsResponse.getRootAsFidsResponse(new ByteBuffer(builder.asUint8Array()));
          callback(null, response);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },
  };
};
