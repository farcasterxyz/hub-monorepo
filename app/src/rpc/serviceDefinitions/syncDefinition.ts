import {
  GetAllMessagesByFidRequest,
  GetAllMessagesBySyncIdsRequest,
  GetAllSyncIdsByPrefixResponse,
  GetTrieNodesByPrefixRequest,
  MessagesResponse,
  TrieNodeMetadataResponse,
} from '~/flatbuffers/generated/rpc_generated';
import { toByteBuffer } from '~/flatbuffers/utils/bytes';
import { defaultMethod } from '~/rpc/client';

const defaultSyncMethod = () => {
  return {
    ...defaultMethod,
    requestDeserialize: (buffer: Buffer): GetAllMessagesByFidRequest => {
      return GetAllMessagesByFidRequest.getRootAsGetAllMessagesByFidRequest(toByteBuffer(buffer));
    },
    responseDeserialize: (buffer: Buffer): MessagesResponse => {
      return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
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
      ...defaultMethod,
      requestDeserialize: (buffer: Buffer): GetTrieNodesByPrefixRequest => {
        return GetTrieNodesByPrefixRequest.getRootAsGetTrieNodesByPrefixRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): GetAllSyncIdsByPrefixResponse => {
        return GetAllSyncIdsByPrefixResponse.getRootAsGetAllSyncIdsByPrefixResponse(toByteBuffer(buffer));
      },
      path: '/getAllSyncIdsByPrefix',
    },
    getAllMessagesBySyncIds: {
      ...defaultMethod,
      requestDeserialize: (buffer: Buffer): GetAllMessagesBySyncIdsRequest => {
        return GetAllMessagesBySyncIdsRequest.getRootAsGetAllMessagesBySyncIdsRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): MessagesResponse => {
        return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
      },

      path: '/getAllMessagesBySyncIds',
    },
    getSyncMetadataByPrefix: {
      ...defaultMethod,
      requestDeserialize: (buffer: Buffer): GetTrieNodesByPrefixRequest => {
        return GetTrieNodesByPrefixRequest.getRootAsGetTrieNodesByPrefixRequest(toByteBuffer(buffer));
      },
      responseDeserialize: (buffer: Buffer): TrieNodeMetadataResponse => {
        return TrieNodeMetadataResponse.getRootAsTrieNodeMetadataResponse(toByteBuffer(buffer));
      },
      path: '/getSyncMetadataByPrefix',
    },
  };
};
