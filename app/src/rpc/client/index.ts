import { bytesToUtf8String, utf8StringToBytes } from '@hub/bytes';
import { HubAsyncResult } from '@hub/errors';
import * as flatbuffers from '@hub/flatbuffers';
import { HubInfoResponse } from '@hub/flatbuffers';
import Client from '@hub/grpc-client';
import MessageModel from '~/flatbuffers/models/messageModel';
import { NodeMetadata } from '~/network/sync/merkleTrie';
import { TrieSnapshot } from '~/network/sync/trieNode';
import syncRequests from '~/rpc/client/syncRequests';
import { syncDefinition } from '~/rpc/syncDefinitions';

const fromNodeMetadataResponse = (response: flatbuffers.TrieNodeMetadataResponse): NodeMetadata => {
  const children = new Map<string, NodeMetadata>();
  for (let i = 0; i < response.childrenLength(); i++) {
    const child = response.children(i);

    const prefix = bytesToUtf8String(child?.prefixArray() ?? new Uint8Array())._unsafeUnwrap();
    // Char is the last char of prefix
    const char = prefix[prefix.length - 1] ?? '';

    children.set(char, {
      numMessages: Number(child?.numMessages()),
      prefix,
      hash: bytesToUtf8String(child?.hashArray() ?? new Uint8Array())._unsafeUnwrap(),
    });
  }

  return {
    prefix: bytesToUtf8String(response.prefixArray() ?? new Uint8Array())._unsafeUnwrap(),
    numMessages: Number(response.numMessages()),
    hash: bytesToUtf8String(response.hashArray() ?? new Uint8Array())._unsafeUnwrap(),
    children,
  };
};

const fromNodeSnapshotResponse = (
  response: flatbuffers.TrieNodeSnapshotResponse
): { snapshot: TrieSnapshot; rootHash: string } => {
  const excludedHashes: string[] = [];
  for (let i = 0; i < response.excludedHashesLength(); i++) {
    excludedHashes.push(response.excludedHashes(i));
  }

  const snapshot = {
    numMessages: Number(response.numMessages()),
    prefix: response.prefix() || '',
    excludedHashes,
  };

  return { snapshot, rootHash: response.rootHash() || '' };
};

const fromSyncIdsByPrefixResponse = (response: flatbuffers.GetAllSyncIdsByPrefixResponse): string[] => {
  const ids = [];
  for (let i = 0; i < response.idsLength(); i++) {
    ids.push(response.ids(i));
  }
  return ids;
};

class HubClient extends Client {
  async getInfo(): HubAsyncResult<HubInfoResponse> {
    return this.makeUnaryRequest(syncDefinition().getInfo, syncRequests.getInfoRequest());
  }

  async getSyncMetadataByPrefix(prefix: string): HubAsyncResult<NodeMetadata> {
    const response = await this.makeUnaryRequest(
      syncDefinition().getSyncMetadataByPrefix,
      syncRequests.createByPrefixRequest(utf8StringToBytes(prefix)._unsafeUnwrap())
    );
    return response.map((metadataResponse) => fromNodeMetadataResponse(metadataResponse));
  }

  async getSyncTrieNodeSnapshotByPrefix(prefix: string): HubAsyncResult<{ snapshot: TrieSnapshot; rootHash: string }> {
    const response = await this.makeUnaryRequest(
      syncDefinition().getSyncTrieNodeSnapshotByPrefix,
      syncRequests.createByPrefixRequest(utf8StringToBytes(prefix)._unsafeUnwrap())
    );
    return response.map((snapshotResponse) => fromNodeSnapshotResponse(snapshotResponse));
  }

  async getAllMessagesBySyncIds(hashes: Uint8Array[]): HubAsyncResult<MessageModel[]> {
    const response = await this.makeUnaryMessagesRequest(
      syncDefinition().getAllMessagesBySyncIds,
      syncRequests.getAllMessagesByHashesRequest(hashes)
    );
    return response.map((messages) => messages.map((message) => new MessageModel(message)));
  }

  async getSyncIdsByPrefix(prefix: string): HubAsyncResult<string[]> {
    const response = await this.makeUnaryRequest(
      syncDefinition().getAllSyncIdsByPrefix,
      syncRequests.createByPrefixRequest(utf8StringToBytes(prefix)._unsafeUnwrap())
    );
    return response.map((prefixResponse) => fromSyncIdsByPrefixResponse(prefixResponse));
  }
}

export default HubClient;
