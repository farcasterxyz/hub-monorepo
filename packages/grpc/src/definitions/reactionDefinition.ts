import * as flatbuffers from '@hub/flatbuffers';
import { toByteBuffer } from '@hub/utils';
import { defaultMethodDefinition } from '../utils';

export const reactionDefinition = () => {
  return {
    getReaction: {
      ...defaultMethodDefinition,
      path: '/getReaction',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetReactionRequest => {
        return flatbuffers.GetReactionRequest.getRootAsGetReactionRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.Message => {
        return flatbuffers.Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getReactionsByFid: {
      ...defaultMethodDefinition,
      path: '/getReactionsByFid',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetReactionsByFidRequest => {
        return flatbuffers.GetReactionsByFidRequest.getRootAsGetReactionsByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.MessagesResponse => {
        return flatbuffers.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getReactionsByCast: {
      ...defaultMethodDefinition,
      path: '/getReactionsByCast',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetReactionsByCastRequest => {
        return flatbuffers.GetReactionsByCastRequest.getRootAsGetReactionsByCastRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.MessagesResponse => {
        return flatbuffers.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },
  };
};
