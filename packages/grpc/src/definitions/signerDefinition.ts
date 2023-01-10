import * as flatbuffers from '@farcaster/flatbuffers';
import { toByteBuffer } from '@farcaster/utils';
import { defaultMethodDefinition } from '../utils';

export const signerDefinition = () => {
  return {
    getSigner: {
      ...defaultMethodDefinition,
      path: '/getSigner',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetSignerRequest => {
        return flatbuffers.GetSignerRequest.getRootAsGetSignerRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.Message => {
        return flatbuffers.Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getSignersByFid: {
      ...defaultMethodDefinition,
      path: '/getSignersByFid',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetSignersByFidRequest => {
        return flatbuffers.GetSignersByFidRequest.getRootAsGetSignersByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.MessagesResponse => {
        return flatbuffers.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getCustodyEvent: {
      ...defaultMethodDefinition,
      path: '/getCustodyEvent',
      requestDeserialize: (buffer: Buffer): flatbuffers.GetCustodyEventRequest => {
        return flatbuffers.GetCustodyEventRequest.getRootAsGetCustodyEventRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.IdRegistryEvent => {
        return flatbuffers.IdRegistryEvent.getRootAsIdRegistryEvent(toByteBuffer(buffer));
      },
    },

    getFids: {
      ...defaultMethodDefinition,
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
