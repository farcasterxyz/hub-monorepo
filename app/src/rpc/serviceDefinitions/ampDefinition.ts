import * as rpc_generated from '@hub/flatbuffers';
import { Message } from '@hub/flatbuffers';
import { toByteBuffer } from '~/flatbuffers/utils/bytes';
import { defaultMethod } from '~/rpc/client';

export const ampDefinition = () => {
  return {
    getAmp: {
      ...defaultMethod,
      path: '/getAmp',
      requestDeserialize: (buffer: Buffer): rpc_generated.GetAmpRequest => {
        return rpc_generated.GetAmpRequest.getRootAsGetAmpRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): Message => {
        return Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getAmpsByFid: {
      ...defaultMethod,
      path: '/getAmpsByFid',
      requestDeserialize: (buffer: Buffer): rpc_generated.GetAmpsByFidRequest => {
        return rpc_generated.GetAmpsByFidRequest.getRootAsGetAmpsByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): rpc_generated.MessagesResponse => {
        return rpc_generated.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getAmpsByUser: {
      ...defaultMethod,
      path: '/getAmpsByUser',
      requestDeserialize: (buffer: Buffer): rpc_generated.GetAmpsByUserRequest => {
        return rpc_generated.GetAmpsByUserRequest.getRootAsGetAmpsByUserRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): rpc_generated.MessagesResponse => {
        return rpc_generated.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },
  };
};
