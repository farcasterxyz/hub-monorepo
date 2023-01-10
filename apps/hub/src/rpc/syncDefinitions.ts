import * as flatbuffers from '@farcaster/flatbuffers';
import { toByteBuffer } from '@farcaster/utils';
import { ByteBuffer } from 'flatbuffers';

interface GenericFlatbuffer {
  bb: ByteBuffer | null;
}

const defaultMethodDefinition = {
  requestStream: false,
  responseStream: false,
  requestSerialize: (request: GenericFlatbuffer): Buffer => {
    return Buffer.from(request.bb?.bytes() ?? new Uint8Array());
  },
  responseSerialize: (response: GenericFlatbuffer): Buffer => {
    return Buffer.from(response.bb?.bytes() ?? new Uint8Array());
  },
};

export const syncDefinition = () => {
  return {
    getInfo: {
      ...defaultMethodDefinition,
      requestDeserialize: (buffer: Buffer): flatbuffers.Empty => {
        return flatbuffers.Empty.getRootAsEmpty(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.HubInfoResponse => {
        return flatbuffers.HubInfoResponse.getRootAsHubInfoResponse(toByteBuffer(buffer));
      },
      path: '/getInfo',
    },
    getAllSyncIdsByPrefix: {
      ...defaultMethodDefinition,
      requestDeserialize: (buffer: Buffer): flatbuffers.GetTrieNodesByPrefixRequest => {
        return flatbuffers.GetTrieNodesByPrefixRequest.getRootAsGetTrieNodesByPrefixRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.GetAllSyncIdsByPrefixResponse => {
        return flatbuffers.GetAllSyncIdsByPrefixResponse.getRootAsGetAllSyncIdsByPrefixResponse(toByteBuffer(buffer));
      },
      path: '/getAllSyncIdsByPrefix',
    },
    getAllMessagesBySyncIds: {
      ...defaultMethodDefinition,
      requestDeserialize: (buffer: Buffer): flatbuffers.GetAllMessagesBySyncIdsRequest => {
        return flatbuffers.GetAllMessagesBySyncIdsRequest.getRootAsGetAllMessagesBySyncIdsRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.MessagesResponse => {
        return flatbuffers.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },

      path: '/getAllMessagesBySyncIds',
    },
    getSyncMetadataByPrefix: {
      ...defaultMethodDefinition,
      requestDeserialize: (buffer: Buffer): flatbuffers.GetTrieNodesByPrefixRequest => {
        return flatbuffers.GetTrieNodesByPrefixRequest.getRootAsGetTrieNodesByPrefixRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.TrieNodeMetadataResponse => {
        return flatbuffers.TrieNodeMetadataResponse.getRootAsTrieNodeMetadataResponse(toByteBuffer(buffer));
      },
      path: '/getSyncMetadataByPrefix',
    },
    getSyncTrieNodeSnapshotByPrefix: {
      ...defaultMethodDefinition,
      requestDeserialize: (buffer: Buffer): flatbuffers.GetTrieNodesByPrefixRequest => {
        return flatbuffers.GetTrieNodesByPrefixRequest.getRootAsGetTrieNodesByPrefixRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): flatbuffers.TrieNodeSnapshotResponse => {
        return flatbuffers.TrieNodeSnapshotResponse.getRootAsTrieNodeSnapshotResponse(toByteBuffer(buffer));
      },
      path: '/getSyncTrieNodeSnapshotByPrefix',
    },
  };
};
