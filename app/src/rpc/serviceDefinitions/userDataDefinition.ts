import {
  GetNameRegistryEventRequest,
  GetUserDataByFidRequest,
  GetUserDataRequest,
  Message,
  MessagesResponse,
  NameRegistryEvent,
} from '@hub/flatbuffers';
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

    getNameRegistryEvent: {
      ...defaultMethod,
      path: '/getNameRegistryEvent',
      requestDeserialize: (buffer: Buffer): GetNameRegistryEventRequest => {
        return GetNameRegistryEventRequest.getRootAsGetNameRegistryEventRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): NameRegistryEvent => {
        return NameRegistryEvent.getRootAsNameRegistryEvent(toByteBuffer(buffer));
      },
    },
  };
};
