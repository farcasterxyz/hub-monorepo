import * as flatbuffers from '@farcaster/flatbuffers';
import { bytesToUtf8String, HubError } from '@farcaster/utils';
import grpc from '@grpc/grpc-js';
import { Builder, ByteBuffer } from 'flatbuffers';
import MessageModel from '~/flatbuffers/models/messageModel';
import { APP_NICKNAME, APP_VERSION } from '~/hub';
import SyncEngine from '~/network/sync/syncEngine';
import {
  toMessagesResponse,
  toServiceError,
  toSyncIdsResponse,
  toTrieNodeMetadataResponse,
  toTrieNodeSnapshotResponse,
} from '~/rpc/server';
import Engine from '~/storage/engine';

export const syncImplementation = (engine: Engine, syncEngine: SyncEngine) => {
  return {
    getInfo: async (
      call: grpc.ServerUnaryCall<flatbuffers.Empty, flatbuffers.HubInfoResponse>,
      callback: grpc.sendUnaryData<flatbuffers.HubInfoResponse>
    ) => {
      const infoT = new flatbuffers.HubInfoResponseT(
        APP_VERSION,
        syncEngine.isSyncing(),
        APP_NICKNAME,
        syncEngine.trie.rootHash
      );
      const builder = new Builder(1);
      builder.finish(infoT.pack(builder));
      const response = flatbuffers.HubInfoResponse.getRootAsHubInfoResponse(new ByteBuffer(builder.asUint8Array()));
      callback(null, response);
    },

    getAllSyncIdsByPrefix: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetTrieNodesByPrefixRequest, flatbuffers.GetAllSyncIdsByPrefixResponse>,
      callback: grpc.sendUnaryData<flatbuffers.GetAllSyncIdsByPrefixResponse>
    ) => {
      const result = syncEngine.getIdsByPrefix(
        bytesToUtf8String(call.request.prefixArray() ?? new Uint8Array())._unsafeUnwrap()
      );
      callback(null, toSyncIdsResponse(result));
    },

    getAllMessagesBySyncIds: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetAllMessagesBySyncIdsRequest, flatbuffers.MessagesResponse>,
      callback: grpc.sendUnaryData<flatbuffers.MessagesResponse>
    ) => {
      const syncIdHashes: string[] = [];
      for (let i = 0; i < call.request.syncIdsLength(); i++) {
        syncIdHashes.push(
          bytesToUtf8String(call.request.syncIds(i)?.syncIdHashArray() ?? new Uint8Array())._unsafeUnwrap()
        );
      }

      const result = await engine.getAllMessagesBySyncIds(syncIdHashes);
      result.match(
        (messages: MessageModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getSyncMetadataByPrefix: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetTrieNodesByPrefixRequest, flatbuffers.TrieNodeMetadataResponse>,
      callback: grpc.sendUnaryData<flatbuffers.TrieNodeMetadataResponse>
    ) => {
      const prefix = bytesToUtf8String(call.request.prefixArray() ?? new Uint8Array())._unsafeUnwrap();
      const result = syncEngine.getTrieNodeMetadata(prefix);
      if (result) {
        callback(null, toTrieNodeMetadataResponse(result));
      } else {
        const err = new HubError('bad_request', `Failed to get trie node metadata at ${prefix}`);
        callback(toServiceError(err));
      }
    },

    getSyncTrieNodeSnapshotByPrefix: async (
      call: grpc.ServerUnaryCall<flatbuffers.GetTrieNodesByPrefixRequest, flatbuffers.TrieNodeSnapshotResponse>,
      callback: grpc.sendUnaryData<flatbuffers.TrieNodeSnapshotResponse>
    ) => {
      const prefix = bytesToUtf8String(call.request.prefixArray() ?? new Uint8Array())._unsafeUnwrap();
      const result = syncEngine.getSnapshotByPrefix(prefix);
      const rootHash = syncEngine.trie.rootHash;
      if (result) {
        callback(null, toTrieNodeSnapshotResponse(result, rootHash));
      } else {
        const err = new HubError('bad_request', 'Failed to get trie node snapshot');
        callback(toServiceError(err));
      }
    },
  };
};

export const createSyncServiceRequest = (fid: Uint8Array): flatbuffers.GetAllMessagesByFidRequest => {
  const builder = new Builder(1);
  const requestT = new flatbuffers.GetAllMessagesByFidRequestT(Array.from(fid));
  builder.finish(requestT.pack(builder));
  return flatbuffers.GetAllMessagesByFidRequest.getRootAsGetAllMessagesByFidRequest(
    new ByteBuffer(builder.asUint8Array())
  );
};
