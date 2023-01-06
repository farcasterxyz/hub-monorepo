import { EventResponse, SubscribeRequest } from '@hub/flatbuffers';
import { toByteBuffer } from '@hub/utils';
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
