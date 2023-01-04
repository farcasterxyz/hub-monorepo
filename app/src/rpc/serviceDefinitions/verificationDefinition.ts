import { toByteBuffer } from '@hub/bytes';
import * as flatbuffers from '@hub/flatbuffers';
import { defaultMethod } from '~/rpc/client';

export const verificationDefinition = () => {
  return {
    getVerification: {
      ...defaultMethod,
      path: '/getVerification',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetVerificationRequest => {
        return flatbuffers.GetVerificationRequest.getRootAsGetVerificationRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.Message => {
        return flatbuffers.Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getVerificationsByFid: {
      ...defaultMethod,
      path: '/getVerificationsByFid',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetVerificationsByFidRequest => {
        return flatbuffers.GetVerificationsByFidRequest.getRootAsGetVerificationsByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.MessagesResponse => {
        return flatbuffers.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },
  };
};
