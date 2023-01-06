import * as flatbuffers from '@hub/flatbuffers';
import { toByteBuffer } from '@hub/utils';
import { defaultMethodDefinition } from '../utils';

export const verificationDefinition = () => {
  return {
    getVerification: {
      ...defaultMethodDefinition,
      path: '/getVerification',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetVerificationRequest => {
        return flatbuffers.GetVerificationRequest.getRootAsGetVerificationRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.Message => {
        return flatbuffers.Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getVerificationsByFid: {
      ...defaultMethodDefinition,
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
