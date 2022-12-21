import { Message } from '~/flatbuffers/generated/message_generated';
import * as rpc_generated from '~/flatbuffers/generated/rpc_generated';
import { toByteBuffer } from '~/flatbuffers/utils/bytes';
import { defaultMethod } from '~/rpc/server';

export const verificationDefinition = () => {
  return {
    getVerification: {
      ...defaultMethod,
      path: '/getVerification',
      requestDeserialize: (buffer: Buffer): rpc_generated.GetVerificationRequest => {
        return rpc_generated.GetVerificationRequest.getRootAsGetVerificationRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): Message => {
        return Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getVerificationsByFid: {
      ...defaultMethod,
      path: '/getVerificationsByFid',
      requestDeserialize: (buffer: Buffer): rpc_generated.GetVerificationsByFidRequest => {
        return rpc_generated.GetVerificationsByFidRequest.getRootAsGetVerificationsByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): rpc_generated.MessagesResponse => {
        return rpc_generated.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },
  };
};
