import { IdRegistryEvent, Message, NameRegistryEvent } from '@hub/flatbuffers';
import { toByteBuffer } from '~/flatbuffers/utils/bytes';
import { defaultMethod } from '~/rpc/client';

export const submitDefinition = () => {
  return {
    submitMessage: {
      ...defaultMethod,
      path: '/submitMessage',
      requestDeserialize: (buffer: Buffer): Message => {
        return Message.getRootAsMessage(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): Message => {
        return Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    submitIdRegistryEvent: {
      ...defaultMethod,
      path: '/submitIdRegistryEvent',
      requestDeserialize: (buffer: Buffer): IdRegistryEvent => {
        return IdRegistryEvent.getRootAsIdRegistryEvent(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): IdRegistryEvent => {
        return IdRegistryEvent.getRootAsIdRegistryEvent(toByteBuffer(buffer));
      },
    },

    submitNameRegistryEvent: {
      ...defaultMethod,
      path: '/submitNameRegistryEvent',
      requestDeserialize: (buffer: Buffer): NameRegistryEvent => {
        return NameRegistryEvent.getRootAsNameRegistryEvent(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): NameRegistryEvent => {
        return NameRegistryEvent.getRootAsNameRegistryEvent(toByteBuffer(buffer));
      },
    },
  };
};
