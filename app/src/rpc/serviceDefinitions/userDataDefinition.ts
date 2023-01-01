import { GetUserDataByFidRequest, GetUserDataRequest, Message, MessagesResponse } from '@hub/flatbuffers';
import { toByteBuffer } from '~/flatbuffers/utils/bytes';
import { defaultMethod } from '~/rpc/client';

export const userDataDefinition = () => {
  return {
    getUserData: {
      ...defaultMethod,
      path: '/getUserData',
      requestDeserialize: (buffer: Buffer): GetUserDataRequest => {
        return GetUserDataRequest.getRootAsGetUserDataRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): Message => {
        return Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getUserDataByFid: {
      ...defaultMethod,
      path: '/getUserDataByFid',
      requestDeserialize: (buffer: Buffer): GetUserDataByFidRequest => {
        return GetUserDataByFidRequest.getRootAsGetUserDataByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },
  };
};
