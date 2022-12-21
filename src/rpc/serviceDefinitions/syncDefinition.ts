import { GetAllMessagesByFidRequest, MessagesResponse } from '~/flatbuffers/generated/rpc_generated';
import { toByteBuffer } from '~/flatbuffers/utils/bytes';
import { defaultMethod } from '~/rpc/server';

const defaultSyncMethod = () => {
  return {
    ...defaultMethod,
    requestDeserialize: (buffer: Buffer): GetAllMessagesByFidRequest => {
      return GetAllMessagesByFidRequest.getRootAsGetAllMessagesByFidRequest(toByteBuffer(buffer));
    },
    responseDeserialize: (buffer: Buffer): MessagesResponse => {
      return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
    },
  };
};

export const syncDefinition = () => {
  return {
    getAllCastMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllCastMessagesByFid',
    },

    getAllAmpMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllAmpMessagesByFid',
    },

    getAllReactionMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllReactionMessagesByFid',
    },

    getAllVerificationMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllVerificationMessagesByFid',
    },

    getAllSignerMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllSigneressagesByFid',
    },

    getAllUserDataMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllUserDataMessagesByFid',
    },
  };
};
