import { toByteBuffer } from '@hub/bytes';
import { EventResponse, SubscribeRequest } from '@hub/flatbuffers';
import { defaultMethod } from '~/rpc/client';

export const eventDefinition = () => {
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
