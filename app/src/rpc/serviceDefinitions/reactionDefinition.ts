import { toByteBuffer } from '@hub/bytes';
import * as rpc_generated from '@hub/flatbuffers';
import { Message } from '@hub/flatbuffers';
import { defaultMethod } from '~/rpc/client';

export const reactionDefinition = () => {
  return {
    getReaction: {
      ...defaultMethod,
      path: '/getReaction',
      requestDeserialize: (buffer: Buffer): rpc_generated.GetReactionRequest => {
        return rpc_generated.GetReactionRequest.getRootAsGetReactionRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): Message => {
        return Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getReactionsByFid: {
      ...defaultMethod,
      path: '/getReactionsByFid',
      requestDeserialize: (buffer: Buffer): rpc_generated.GetReactionsByFidRequest => {
        return rpc_generated.GetReactionsByFidRequest.getRootAsGetReactionsByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): rpc_generated.MessagesResponse => {
        return rpc_generated.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getReactionsByCast: {
      ...defaultMethod,
      path: '/getReactionsByCast',
      requestDeserialize: (buffer: Buffer): rpc_generated.GetReactionsByCastRequest => {
        return rpc_generated.GetReactionsByCastRequest.getRootAsGetReactionsByCastRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): rpc_generated.MessagesResponse => {
        return rpc_generated.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },
  };
};
