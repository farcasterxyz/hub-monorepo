import grpc from '@grpc/grpc-js';
import Engine from '~/storage/engine/flatbuffers';
import {
  MessagesResponse,
  GetSignersByFidRequestT,
  GetCustodyEventRequestT,
  GetFidsRequest,
  GetSignerRequest,
  GetSignerRequestT,
  GetSignersByFidRequest,
  GetCustodyEventRequest,
  FidsResponse,
  FidsResponseT,
} from '~/utils/generated/rpc_generated';
import { defaultMethod, toMessagesResponse, toServiceError } from '~/network/rpc/flatbuffers/server';
import { toByteBuffer } from '~/storage/flatbuffers/utils';
import { Message, UserIdT } from '~/utils/generated/message_generated';
import { HubError } from '~/utils/hubErrors';
import { Builder, ByteBuffer } from 'flatbuffers';
import { SignerAddModel } from '~/storage/flatbuffers/types';
import { IdRegistryEvent } from '~/utils/generated/id_registry_event_generated';
import IdRegistryEventModel from '~/storage/flatbuffers/idRegistryEventModel';

export const signerServiceMethods = () => {
  return {
    getSigner: {
      ...defaultMethod,
      path: '/getSigner',
      requestDeserialize: (buffer: Buffer): GetSignerRequest => {
        return GetSignerRequest.getRootAsGetSignerRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): Message => {
        return Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getSignersByFid: {
      ...defaultMethod,
      path: '/getSignersByFid',
      requestDeserialize: (buffer: Buffer): GetSignersByFidRequest => {
        return GetSignersByFidRequest.getRootAsGetSignersByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getCustodyEvent: {
      ...defaultMethod,
      path: '/getCustodyEvent',
      requestDeserialize: (buffer: Buffer): GetCustodyEventRequest => {
        return GetCustodyEventRequest.getRootAsGetCustodyEventRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): IdRegistryEvent => {
        return IdRegistryEvent.getRootAsIdRegistryEvent(toByteBuffer(buffer));
      },
    },

    getFids: {
      ...defaultMethod,
      path: '/getFids',
      requestDeserialize: (buffer: Buffer): GetFidsRequest => {
        return GetFidsRequest.getRootAsGetFidsRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): FidsResponse => {
        return FidsResponse.getRootAsFidsResponse(toByteBuffer(buffer));
      },
    },
  };
};

export const signerServiceImpls = (engine: Engine) => {
  return {
    getSigner: async (call: grpc.ServerUnaryCall<GetSignerRequest, Message>, callback: grpc.sendUnaryData<Message>) => {
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
      call: grpc.ServerUnaryCall<GetSignersByFidRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
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
      call: grpc.ServerUnaryCall<GetCustodyEventRequest, IdRegistryEvent>,
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
      call: grpc.ServerUnaryCall<GetFidsRequest, FidsResponse>,
      callback: grpc.sendUnaryData<FidsResponse>
    ) => {
      const result = await engine.getFids();
      result.match(
        (fids: Uint8Array[]) => {
          const responseT = new FidsResponseT(fids.map((fid) => new UserIdT(Array.from(fid))));
          const builder = new Builder(1);
          builder.finish(responseT.pack(builder));
          const response = FidsResponse.getRootAsFidsResponse(new ByteBuffer(builder.asUint8Array()));
          callback(null, response);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },
  };
};

export const signerServiceRequests = {
  getSigner: (fid: Uint8Array, signer: Uint8Array): GetSignerRequest => {
    const builder = new Builder(1);
    const requestT = new GetSignerRequestT(Array.from(fid), Array.from(signer));
    builder.finish(requestT.pack(builder));
    return GetSignerRequest.getRootAsGetSignerRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getSignersByFid: (fid: Uint8Array): GetSignersByFidRequest => {
    const builder = new Builder(1);
    const requestT = new GetSignersByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return GetSignersByFidRequest.getRootAsGetSignersByFidRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getCustodyEvent: (fid: Uint8Array): GetCustodyEventRequest => {
    const builder = new Builder(1);
    const requestT = new GetCustodyEventRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return GetCustodyEventRequest.getRootAsGetCustodyEventRequest(new ByteBuffer(builder.asUint8Array()));
  },
};
