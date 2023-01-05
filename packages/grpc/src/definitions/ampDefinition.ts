import { toByteBuffer } from '@hub/bytes';
import * as flatbuffers from '@hub/flatbuffers';
import { defaultMethodDefinition } from '../utils';

export const ampDefinition = () => {
  return {
    getAmp: {
      ...defaultMethodDefinition,
      path: '/getAmp',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetAmpRequest => {
        return flatbuffers.GetAmpRequest.getRootAsGetAmpRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.Message => {
        return flatbuffers.Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getAmpsByFid: {
      ...defaultMethodDefinition,
      path: '/getAmpsByFid',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetAmpsByFidRequest => {
        return flatbuffers.GetAmpsByFidRequest.getRootAsGetAmpsByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.MessagesResponse => {
        return flatbuffers.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getAmpsByUser: {
      ...defaultMethodDefinition,
      path: '/getAmpsByUser',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetAmpsByUserRequest => {
        return flatbuffers.GetAmpsByUserRequest.getRootAsGetAmpsByUserRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.MessagesResponse => {
        return flatbuffers.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },
  };
};
