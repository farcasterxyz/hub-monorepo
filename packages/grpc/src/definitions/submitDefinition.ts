import { toByteBuffer } from '@hub/bytes';
import * as flatbuffers from '@hub/flatbuffers';
import { defaultMethodDefinition } from '../utils';

export const submitDefinition = () => {
  return {
    submitMessage: {
      ...defaultMethodDefinition,
      path: '/submitMessage',
      requestDeserialize: (buffer: Buffer): flatbuffers.Message => {
        return flatbuffers.Message.getRootAsMessage(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.Message => {
        return flatbuffers.Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    submitIdRegistryEvent: {
      ...defaultMethodDefinition,
      path: '/submitIdRegistryEvent',
      requestDeserialize: (buffer: Buffer): flatbuffers.IdRegistryEvent => {
        return flatbuffers.IdRegistryEvent.getRootAsIdRegistryEvent(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.IdRegistryEvent => {
        return flatbuffers.IdRegistryEvent.getRootAsIdRegistryEvent(toByteBuffer(buffer));
      },
    },

    submitNameRegistryEvent: {
      ...defaultMethodDefinition,
      path: '/submitNameRegistryEvent',
      requestDeserialize: (buffer: Buffer): flatbuffers.NameRegistryEvent => {
        return flatbuffers.NameRegistryEvent.getRootAsNameRegistryEvent(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.NameRegistryEvent => {
        return flatbuffers.NameRegistryEvent.getRootAsNameRegistryEvent(toByteBuffer(buffer));
      },
    },
  };
};
