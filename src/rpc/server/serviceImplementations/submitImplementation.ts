import grpc from '@grpc/grpc-js';
import { err } from 'neverthrow';
import { IdRegistryEvent } from '~/flatbuffers/generated/id_registry_event_generated';
import { Message } from '~/flatbuffers/generated/message_generated';
import { NameRegistryEvent } from '~/flatbuffers/generated/name_registry_event_generated';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import { RPCHandler, toServiceError } from '~/rpc/server';
import Engine from '~/storage/engine/flatbuffers';
import { HubError, HubResult } from '~/utils/hubErrors';

export const submitImplementation = (engine: Engine, rpcHandler?: RPCHandler) => {
  return {
    submitMessage: async (call: grpc.ServerUnaryCall<Message, Message>, callback: grpc.sendUnaryData<Message>) => {
      const model = new MessageModel(call.request);
      let result: HubResult<void> = err(new HubError('unavailable', 'service unavailable'));
      if (rpcHandler) {
        result = await rpcHandler.submitMessage(model);
      } else {
        result = await engine.mergeMessage(model);
      }
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
      call: grpc.ServerUnaryCall<IdRegistryEvent, IdRegistryEvent>,
      callback: grpc.sendUnaryData<IdRegistryEvent>
    ) => {
      const model = new IdRegistryEventModel(call.request);
      let result: HubResult<void> = err(new HubError('unavailable', 'service unavailable'));
      if (rpcHandler && rpcHandler.submitIdRegistryEvent !== undefined) {
        result = await rpcHandler.submitIdRegistryEvent(model);
      } else {
        result = await engine.mergeIdRegistryEvent(model);
      }
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
