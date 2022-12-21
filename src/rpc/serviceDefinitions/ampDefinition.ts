import { Message } from '~/flatbuffers/generated/message_generated';
import * as rpc_generated from '~/flatbuffers/generated/rpc_generated';
import { toByteBuffer } from '~/flatbuffers/utils/bytes';
import { defaultMethod } from '~/rpc/server';

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
