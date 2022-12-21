import { IdRegistryEvent } from '~/flatbuffers/generated/id_registry_event_generated';
import { Message } from '~/flatbuffers/generated/message_generated';
import { NameRegistryEvent } from '~/flatbuffers/generated/name_registry_event_generated';
import { toByteBuffer } from '~/flatbuffers/utils/bytes';
import { defaultMethod } from '~/rpc/server';

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

    submitContractEvent: {
      ...defaultMethod,
      path: '/submitContractEvent',
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
