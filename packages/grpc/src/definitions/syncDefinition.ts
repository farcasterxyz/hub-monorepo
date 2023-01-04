import { toByteBuffer } from '@hub/bytes';
import * as flatbuffers from '@hub/flatbuffers';
import { defaultMethodDefinition } from '../utils';

const defaultSyncMethod = () => {
  return {
    ...defaultMethodDefinition,
    requestDeserialize: (buffer: Buffer): flatbuffers.GetAllMessagesByFidRequest => {
      return flatbuffers.GetAllMessagesByFidRequest.getRootAsGetAllMessagesByFidRequest(toByteBuffer(buffer));
    },
    responseDeserialize: (buffer: Buffer): flatbuffers.MessagesResponse => {
      return flatbuffers.MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
    },
  };
};

export const syncDefinition = () => {
  return {
    getAllCastMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllCastMessagesByFid',
    },

    getAllAmpMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllAmpMessagesByFid',
    },

    getAllReactionMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllReactionMessagesByFid',
    },

    getAllVerificationMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllVerificationMessagesByFid',
    },

    getAllSignerMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllSigneressagesByFid',
    },

    getAllUserDataMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllUserDataMessagesByFid',
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
