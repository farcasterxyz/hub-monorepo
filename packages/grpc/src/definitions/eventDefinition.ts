import { EventResponse, SubscribeRequest } from '@farcaster/flatbuffers';
import { toByteBuffer } from '@farcaster/utils';
import { defaultMethodDefinition } from '../utils';

export const eventDefinition = () => {
  return {
    subscribe: {
      ...defaultMethodDefinition,
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
