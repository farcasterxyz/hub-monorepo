import grpc from '@grpc/grpc-js';
import { Builder, ByteBuffer } from 'flatbuffers';
import { IdRegistryEvent } from '~/flatbuffers/generated/id_registry_event_generated';
import { Message, UserIdT } from '~/flatbuffers/generated/message_generated';
import * as rpc_generated from '~/flatbuffers/generated/rpc_generated';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import { SignerAddModel } from '~/flatbuffers/models/types';
import { toMessagesResponse, toServiceError } from '~/rpc/server';
import Engine from '~/storage/engine';
import { HubError } from '~/utils/hubErrors';

export const signerImplementation = (engine: Engine) => {
  return {
    getSigner: async (
      call: grpc.ServerUnaryCall<rpc_generated.GetSignerRequest, Message>,
      callback: grpc.sendUnaryData<Message>
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
      call: grpc.ServerUnaryCall<rpc_generated.GetSignersByFidRequest, rpc_generated.MessagesResponse>,
      callback: grpc.sendUnaryData<rpc_generated.MessagesResponse>
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
      call: grpc.ServerUnaryCall<rpc_generated.GetCustodyEventRequest, IdRegistryEvent>,
      callback: grpc.sendUnaryData<IdRegistryEvent>
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
      call: grpc.ServerUnaryCall<rpc_generated.GetFidsRequest, rpc_generated.FidsResponse>,
      callback: grpc.sendUnaryData<rpc_generated.FidsResponse>
    ) => {
      const result = await engine.getFids();
      result.match(
        (fids: Uint8Array[]) => {
          const responseT = new rpc_generated.FidsResponseT(fids.map((fid) => new UserIdT(Array.from(fid))));
          const builder = new Builder(1);
          builder.finish(responseT.pack(builder));
          const response = rpc_generated.FidsResponse.getRootAsFidsResponse(new ByteBuffer(builder.asUint8Array()));
          callback(null, response);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },
  };
};
