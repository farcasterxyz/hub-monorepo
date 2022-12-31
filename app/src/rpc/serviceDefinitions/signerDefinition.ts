import { IdRegistryEvent } from '~/flatbuffers/generated/id_registry_event_generated';
import { Message } from '~/flatbuffers/generated/message_generated';
import * as rpc_generated from '~/flatbuffers/generated/rpc_generated';
import { toByteBuffer } from '~/flatbuffers/utils/bytes';
import { defaultMethod } from '~/rpc/client';

export const signerDefinition = () => {
  return {
    getSigner: {
      ...defaultMethod,
      path: '/getSigner',
      requestDeserialize: (buffer: Buffer): rpc_generated.GetSignerRequest => {
        return rpc_generated.GetSignerRequest.getRootAsGetSignerRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): Message => {
        return Message.getRootAsMessage(toByteBuffer(buffer));
      },
    },

    getSignersByFid: {
      ...defaultMethod,
      path: '/getSignersByFid',
      requestDeserialize: (buffer: Buffer): rpc_generated.GetSignersByFidRequest => {
        return rpc_generated.GetSignersByFidRequest.getRootAsGetSignersByFidRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): rpc_generated.MessagesResponse => {
        return rpc_generated.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },
    },

    getCustodyEvent: {
      ...defaultMethod,
      path: '/getCustodyEvent',
      requestDeserialize: (buffer: Buffer): rpc_generated.GetCustodyEventRequest => {
        return rpc_generated.GetCustodyEventRequest.getRootAsGetCustodyEventRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): IdRegistryEvent => {
        return IdRegistryEvent.getRootAsIdRegistryEvent(toByteBuffer(buffer));
      },
    },

    getFids: {
      ...defaultMethod,
      path: '/getFids',
      requestDeserialize: (buffer: Buffer): rpc_generated.GetFidsRequest => {
        return rpc_generated.GetFidsRequest.getRootAsGetFidsRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): rpc_generated.FidsResponse => {
        return rpc_generated.FidsResponse.getRootAsFidsResponse(toByteBuffer(buffer));
      },
    },
  };
};
