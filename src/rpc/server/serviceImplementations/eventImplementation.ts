import grpc, { Metadata } from '@grpc/grpc-js';
import { Builder, ByteBuffer } from 'flatbuffers';
import { EventType, SubscribeRequest, EventResponse, EventResponseT } from '~/flatbuffers/generated/rpc_generated';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import Engine from '~/storage/engine/flatbuffers';

const packAndWriteEventResponse = (
  unpackedResponse: EventResponseT,
  stream: grpc.ServerWritableStream<SubscribeRequest, EventResponse>
): void => {
  const builder = new Builder(1);
  builder.finish(unpackedResponse.pack(builder));
  const response = EventResponse.getRootAsEventResponse(new ByteBuffer(builder.asUint8Array()));
  stream.write(response);
};

export const eventImplementation = (engine: Engine) => {
  return {
    subscribe: async (stream: grpc.ServerWritableStream<SubscribeRequest, EventResponse>) => {
      const mergeMessageListener = (message: MessageModel) => {
        const unpackedResponse = new EventResponseT(EventType.MergeMessage, message.message.unpack(), undefined);
        packAndWriteEventResponse(unpackedResponse, stream);
      };

      const pruneMessageListener = (message: MessageModel) => {
        const unpackedResponse = new EventResponseT(EventType.PruneMessage, message.message.unpack(), undefined);
        packAndWriteEventResponse(unpackedResponse, stream);
      };

      const revokeMessageListener = (message: MessageModel) => {
        const unpackedResponse = new EventResponseT(EventType.RevokeMessage, message.message.unpack(), undefined);
        packAndWriteEventResponse(unpackedResponse, stream);
      };

      const mergeEventListener = (event: IdRegistryEventModel) => {
        const unpackedResponse = new EventResponseT(EventType.MergeContractEvent, undefined, event.event.unpack());
        packAndWriteEventResponse(unpackedResponse, stream);
      };

      engine.eventHandler.on('mergeMessage', mergeMessageListener);
      engine.eventHandler.on('pruneMessage', pruneMessageListener);
      engine.eventHandler.on('revokeMessage', revokeMessageListener);
      engine.eventHandler.on('mergeIdRegistryEvent', mergeEventListener);

      stream.on('cancelled', () => {
        stream.destroy();
      });

      stream.on('close', () => {
        engine.eventHandler.off('mergeMessage', mergeMessageListener);
        engine.eventHandler.off('pruneMessage', pruneMessageListener);
        engine.eventHandler.off('revokeMessage', revokeMessageListener);
        engine.eventHandler.off('mergeIdRegistryEvent', mergeEventListener);
      });

      const readyMetadata = new Metadata();
      readyMetadata.add('status', 'ready');
      stream.sendMetadata(readyMetadata);
    },
  };
};
