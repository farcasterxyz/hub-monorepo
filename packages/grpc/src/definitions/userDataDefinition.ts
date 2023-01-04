import { toByteBuffer } from '@hub/bytes';
import * as flatbuffers from '@hub/flatbuffers';
import { defaultMethodDefinition } from '../utils';

export const userDataDefinition = () => {
  return {
    getUserData: {
      ...defaultMethodDefinition,
      path: '/getUserData',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetUserDataRequest => {
        return flatbuffers.GetUserDataRequest.getRootAsGetUserDataRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.UserDataAddMessage => {
        return flatbuffers.Message.getRootAsMessage(toByteBuffer(buffer)) as flatbuffers.UserDataAddMessage;
      },
    },

    getUserDataByFid: {
      ...defaultMethodDefinition,
      path: '/getUserDataByFid',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetUserDataByFidRequest => {
        return flatbuffers.GetUserDataByFidRequest.getRootAsGetUserDataByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.MessagesResponse => {
        return flatbuffers.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getNameRegistryEvent: {
      ...defaultMethodDefinition,
      path: '/getNameRegistryEvent',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetNameRegistryEventRequest => {
        return flatbuffers.GetNameRegistryEventRequest.getRootAsGetNameRegistryEventRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.NameRegistryEvent => {
        return flatbuffers.NameRegistryEvent.getRootAsNameRegistryEvent(toByteBuffer(buffer));
      },
    },
  };
};
