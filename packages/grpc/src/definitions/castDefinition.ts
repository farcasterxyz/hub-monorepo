import * as flatbuffers from '@hub/flatbuffers';
import { toByteBuffer } from '@hub/utils';
import { defaultMethodDefinition } from '../utils';

export const castDefinition = () => {
  return {
    getCast: {
      ...defaultMethodDefinition,
      path: '/getCast',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetCastRequest => {
        return flatbuffers.GetCastRequest.getRootAsGetCastRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.Message => {
        return flatbuffers.Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getCastsByFid: {
      ...defaultMethodDefinition,
      path: '/getCastsByFid',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetCastsByFidRequest => {
        return flatbuffers.GetCastsByFidRequest.getRootAsGetCastsByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.MessagesResponse => {
        return flatbuffers.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getCastsByParent: {
      ...defaultMethodDefinition,
      path: '/getCastsByParent',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetCastsByParentRequest => {
        return flatbuffers.GetCastsByParentRequest.getRootAsGetCastsByParentRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.MessagesResponse => {
        return flatbuffers.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getCastsByMention: {
      ...defaultMethodDefinition,
      path: '/getCastsByMention',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetCastsByMentionRequest => {
        return flatbuffers.GetCastsByMentionRequest.getRootAsGetCastsByMentionRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.MessagesResponse => {
        return flatbuffers.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },
  };
};
