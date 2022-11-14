import grpc from '@grpc/grpc-js';
import Engine from '~/storage/engine/flatbuffers';
import {
  MessagesResponse,
  GetVerificationRequest,
  GetVerificationsByFidRequest,
  GetVerificationRequestT,
  GetVerificationsByFidRequestT,
} from '~/utils/generated/rpc_generated';
import { defaultMethod, toMessagesResponse, toServiceError } from '~/network/rpc/flatbuffers/server';
import { toByteBuffer } from '~/storage/flatbuffers/utils';
import { Message } from '~/utils/generated/message_generated';
import { HubError } from '~/utils/hubErrors';
import { Builder, ByteBuffer } from 'flatbuffers';
import { VerificationAddEthAddressModel } from '~/storage/flatbuffers/types';

export const verificationServiceMethods = () => {
  return {
    getVerification: {
      ...defaultMethod,
      path: '/getVerification',
      requestDeserialize: (buffer: Buffer): GetVerificationRequest => {
        return GetVerificationRequest.getRootAsGetVerificationRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): Message => {
        return Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getVerificationsByFid: {
      ...defaultMethod,
      path: '/getVerificationsByFid',
      requestDeserialize: (buffer: Buffer): GetVerificationsByFidRequest => {
        return GetVerificationsByFidRequest.getRootAsGetVerificationsByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },
  };
};

export const verificationServiceImpls = (engine: Engine) => {
  return {
    getVerification: async (
      call: grpc.ServerUnaryCall<GetVerificationRequest, Message>,
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
      call: grpc.ServerUnaryCall<GetVerificationsByFidRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
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

export const verificationServiceRequests = {
  getVerification: (fid: Uint8Array, address: Uint8Array): GetVerificationRequest => {
    const builder = new Builder(1);
    const requestT = new GetVerificationRequestT(Array.from(fid), Array.from(address));
    builder.finish(requestT.pack(builder));
    return GetVerificationRequest.getRootAsGetVerificationRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getVerificationsByFid: (fid: Uint8Array): GetVerificationsByFidRequest => {
    const builder = new Builder(1);
    const requestT = new GetVerificationsByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return GetVerificationsByFidRequest.getRootAsGetVerificationsByFidRequest(new ByteBuffer(builder.asUint8Array()));
  },
};
