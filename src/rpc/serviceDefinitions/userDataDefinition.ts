import { Message } from '~/flatbuffers/generated/message_generated';
import { GetUserDataByFidRequest, GetUserDataRequest, MessagesResponse } from '~/flatbuffers/generated/rpc_generated';
import { toByteBuffer } from '~/flatbuffers/utils/bytes';
import { defaultMethod } from '~/rpc/server';

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
