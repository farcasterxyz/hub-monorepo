import grpc from '@grpc/grpc-js';
import Engine from '~/storage/engine/flatbuffers';
import { defaultMethod, toServiceError } from '~/network/rpc/flatbuffers/server';
import { toByteBuffer } from '~/storage/flatbuffers/utils';
import { Message } from '~/utils/generated/message_generated';
import { HubError } from '~/utils/hubErrors';
import MessageModel from '~/storage/flatbuffers/messageModel';
import ContractEventModel from '~/storage/flatbuffers/contractEventModel';
import { ContractEvent } from '~/utils/generated/contract_event_generated';
import { NameRegistryEvent } from '~/utils/generated/nameregistry_generated';
import NameRegistryEventModel from '~/storage/flatbuffers/nameRegistryEventModel';

export const submitServiceMethods = () => {
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
      requestDeserialize: (buffer: Buffer): ContractEvent => {
        return ContractEvent.getRootAsContractEvent(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): ContractEvent => {
        return ContractEvent.getRootAsContractEvent(toByteBuffer(buffer));
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

export const submitServiceImpls = (engine: Engine) => {
  return {
    submitMessage: async (call: grpc.ServerUnaryCall<Message, Message>, callback: grpc.sendUnaryData<Message>) => {
      const model = new MessageModel(call.request);
      const result = await engine.mergeMessage(model);
      result.match(
        () => {
          callback(null, model.message);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    submitContractEvent: async (
      call: grpc.ServerUnaryCall<ContractEvent, ContractEvent>,
      callback: grpc.sendUnaryData<ContractEvent>
    ) => {
      const model = new ContractEventModel(call.request);
      const result = await engine.mergeIdRegistryEvent(model);
      result.match(
        () => {
          callback(null, model.event);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    submitNameRegistryEvent: async (
      call: grpc.ServerUnaryCall<NameRegistryEvent, NameRegistryEvent>,
      callback: grpc.sendUnaryData<NameRegistryEvent>
    ) => {
      const model = new NameRegistryEventModel(call.request);
      const result = await engine.mergeNameRegistryEvent(model);
      result.match(
        () => {
          callback(null, model.event);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },
  };
};
