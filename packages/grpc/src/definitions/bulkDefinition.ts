import { toByteBuffer } from '@hub/bytes';
import * as flatbuffers from '@hub/flatbuffers';
import { defaultMethodDefinition } from '../utils';

const defaultBulkMethod = () => {
  return {
    ...defaultMethodDefinition,
    requestDeserialize: (buffer: Buffer): flatbuffers.GetAllMessagesByFidRequest => {
      return flatbuffers.GetAllMessagesByFidRequest.getRootAsGetAllMessagesByFidRequest(toByteBuffer(buffer));
    },
    responseDeserialize: (buffer: Buffer): flatbuffers.MessagesResponse => {
      return flatbuffers.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
    },
  };
};

export const bulkDefinition = () => {
  return {
    getAllCastMessagesByFid: {
      ...defaultBulkMethod(),
      path: '/getAllCastMessagesByFid',
    },

    getAllAmpMessagesByFid: {
      ...defaultBulkMethod(),
      path: '/getAllAmpMessagesByFid',
    },

    getAllReactionMessagesByFid: {
      ...defaultBulkMethod(),
      path: '/getAllReactionMessagesByFid',
    },

    getAllVerificationMessagesByFid: {
      ...defaultBulkMethod(),
      path: '/getAllVerificationMessagesByFid',
    },

    getAllSignerMessagesByFid: {
      ...defaultBulkMethod(),
      path: '/getAllSigneressagesByFid',
    },

    getAllUserDataMessagesByFid: {
      ...defaultBulkMethod(),
      path: '/getAllUserDataMessagesByFid',
    },
  };
};
