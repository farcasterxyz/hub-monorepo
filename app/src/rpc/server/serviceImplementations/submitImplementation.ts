import grpc from '@grpc/grpc-js';
import { HubError } from '@hub/errors';
import { IdRegistryEvent, Message, NameRegistryEvent } from '@hub/flatbuffers';
import { Result } from 'neverthrow';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import { HubInterface } from '~/flatbuffers/models/types';
import { toServiceError } from '~/rpc/server';

export const submitImplementation = (hub: HubInterface) => {
  return {
    submitMessage: async (call: grpc.ServerUnaryCall<Message, Message>, callback: grpc.sendUnaryData<Message>) => {
      const model = new MessageModel(call.request);
      const result = await hub.submitMessage(model, 'rpc');
      result.match(
        () => {
          callback(null, model.message);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    submitIdRegistryEvent: async (
      call: grpc.ServerUnaryCall<IdRegistryEvent, IdRegistryEvent>,
      callback: grpc.sendUnaryData<IdRegistryEvent>
    ) => {
      const constructModel = Result.fromThrowable(
        (event: IdRegistryEvent) => new IdRegistryEventModel(event),
        (e) => e as HubError
      );
      const model = constructModel(call.request);
      if (model.isErr()) {
        callback(toServiceError(model.error));
        return;
      }
      const result = await hub.submitIdRegistryEvent(model.value, 'rpc');
      result.match(
        () => {
          callback(null, model.value.event);
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
      const constructModel = Result.fromThrowable(
        (event: NameRegistryEvent) => new NameRegistryEventModel(event),
        (e) => e as HubError
      );
      const model = constructModel(call.request);
      if (model.isErr()) {
        callback(toServiceError(model.error));
        return;
      }
      const result = await hub.submitNameRegistryEvent(model.value, 'rpc');
      result.match(
        () => {
          callback(null, model.value.event);
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },
  };
};
