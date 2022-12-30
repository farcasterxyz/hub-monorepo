import grpc, { Metadata } from '@grpc/grpc-js';
import { Builder, ByteBuffer } from 'flatbuffers';
import { EventResponse, EventResponseT, EventType, SubscribeRequest } from '~/flatbuffers/generated/rpc_generated';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import Engine from '~/storage/engine';

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
        const unpackedResponse = new EventResponseT(EventType.MergeMessage, Array.from(message.toBytes()));
        packAndWriteEventResponse(unpackedResponse, stream);
      };

      const pruneMessageListener = (message: MessageModel) => {
        const unpackedResponse = new EventResponseT(EventType.PruneMessage, Array.from(message.toBytes()));
        packAndWriteEventResponse(unpackedResponse, stream);
      };

      const revokeMessageListener = (message: MessageModel) => {
        const unpackedResponse = new EventResponseT(EventType.RevokeMessage, Array.from(message.toBytes()));
        packAndWriteEventResponse(unpackedResponse, stream);
      };

      const mergeIdRegistryEventListener = (event: IdRegistryEventModel) => {
        const unpackedResponse = new EventResponseT(EventType.MergeIdRegistryEvent, Array.from(event.toBytes()));
        packAndWriteEventResponse(unpackedResponse, stream);
      };

      const mergeNameRegistryEventListener = (event: NameRegistryEventModel) => {
        const unpackedResponse = new EventResponseT(EventType.MergeNameRegistryEvent, Array.from(event.toBytes()));
        packAndWriteEventResponse(unpackedResponse, stream);
      };

      engine.eventHandler.on('mergeMessage', mergeMessageListener);
      engine.eventHandler.on('pruneMessage', pruneMessageListener);
      engine.eventHandler.on('revokeMessage', revokeMessageListener);
      engine.eventHandler.on('mergeIdRegistryEvent', mergeIdRegistryEventListener);
      engine.eventHandler.on('mergeNameRegistryEvent', mergeNameRegistryEventListener);

      stream.on('cancelled', () => {
        stream.destroy();
      });

      stream.on('close', () => {
        engine.eventHandler.off('mergeMessage', mergeMessageListener);
        engine.eventHandler.off('pruneMessage', pruneMessageListener);
        engine.eventHandler.off('revokeMessage', revokeMessageListener);
        engine.eventHandler.off('mergeIdRegistryEvent', mergeIdRegistryEventListener);
        engine.eventHandler.off('mergeNameRegistryEvent', mergeNameRegistryEventListener);
      });

      const readyMetadata = new Metadata();
      readyMetadata.add('status', 'ready');
      stream.sendMetadata(readyMetadata);
    },
  };
};
