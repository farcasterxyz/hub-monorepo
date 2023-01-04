import { toByteBuffer } from '@hub/bytes';
import * as flatbuffers from '@hub/flatbuffers';
import { defaultMethod } from '~/rpc/client';

export const signerDefinition = () => {
  return {
    getSigner: {
      ...defaultMethod,
      path: '/getSigner',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetSignerRequest => {
        return flatbuffers.GetSignerRequest.getRootAsGetSignerRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.Message => {
        return flatbuffers.Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getSignersByFid: {
      ...defaultMethod,
      path: '/getSignersByFid',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetSignersByFidRequest => {
        return flatbuffers.GetSignersByFidRequest.getRootAsGetSignersByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.MessagesResponse => {
        return flatbuffers.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getCustodyEvent: {
      ...defaultMethod,
      path: '/getCustodyEvent',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetCustodyEventRequest => {
        return flatbuffers.GetCustodyEventRequest.getRootAsGetCustodyEventRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.IdRegistryEvent => {
        return flatbuffers.IdRegistryEvent.getRootAsIdRegistryEvent(toByteBuffer(buffer));
      },
    },

    getFids: {
      ...defaultMethod,
      path: '/getFids',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetFidsRequest => {
        return flatbuffers.GetFidsRequest.getRootAsGetFidsRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.FidsResponse => {
        return flatbuffers.FidsResponse.getRootAsFidsResponse(toByteBuffer(buffer));
      },
    },
  };
};
