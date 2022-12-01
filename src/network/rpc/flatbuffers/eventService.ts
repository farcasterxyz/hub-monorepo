import grpc, { Metadata } from '@grpc/grpc-js';
import Engine from '~/storage/engine/flatbuffers';
import { defaultMethod } from '~/network/rpc/flatbuffers/server';
import { toByteBuffer } from '~/storage/flatbuffers/utils';
import { EventType } from '~/utils/generated/rpc_generated';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { SubscribeRequest } from '~/utils/generated/farcaster/subscribe-request';
import { EventResponse, EventResponseT } from '~/utils/generated/farcaster/event-response';
import { Builder, ByteBuffer } from 'flatbuffers';
import ContractEventModel from '~/storage/flatbuffers/contractEventModel';

export const eventServiceMethods = () => {
  return {
    subscribe: {
      ...defaultMethod,
      path: '/subscribe',
      responseStream: true,
      requestDeserialize: (buffer: Buffer): SubscribeRequest => {
        return SubscribeRequest.getRootAsSubscribeRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): EventResponse => {
        return EventResponse.getRootAsEventResponse(toByteBuffer(buffer));
      },
    },
  };
};

const packAndWriteEventResponse = (
  unpackedResponse: EventResponseT,
  stream: grpc.ServerWritableStream<SubscribeRequest, EventResponse>
): void => {
  const builder = new Builder(1);
  builder.finish(unpackedResponse.pack(builder));
  const response = EventResponse.getRootAsEventResponse(new ByteBuffer(builder.asUint8Array()));
  stream.write(response);
};

export const eventServiceImpls = (engine: Engine) => {
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

      const mergeEventListener = (event: ContractEventModel) => {
        const unpackedResponse = new EventResponseT(EventType.MergeContractEvent, undefined, event.event.unpack());
        packAndWriteEventResponse(unpackedResponse, stream);
      };

      engine.eventHandler.on('mergeMessage', mergeMessageListener);
      engine.eventHandler.on('pruneMessage', pruneMessageListener);
      engine.eventHandler.on('revokeMessage', revokeMessageListener);
      engine.eventHandler.on('mergeContractEvent', mergeEventListener);

      stream.on('cancelled', () => {
        stream.destroy();
      });

      stream.on('close', () => {
        engine.eventHandler.off('mergeMessage', mergeMessageListener);
        engine.eventHandler.off('pruneMessage', pruneMessageListener);
        engine.eventHandler.off('revokeMessage', revokeMessageListener);
        engine.eventHandler.off('mergeContractEvent', mergeEventListener);
      });

      const readyMetadata = new Metadata();
      readyMetadata.add('status', 'ready');
      stream.sendMetadata(readyMetadata);
    },
  };
};
