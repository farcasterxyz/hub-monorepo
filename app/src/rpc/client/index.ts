import grpc from '@grpc/grpc-js';
import { bytesToUtf8String, utf8StringToBytes } from '@hub/bytes';
import { HubAsyncResult, HubError, HubErrorCode } from '@hub/errors';
import * as flatbuffers from '@hub/flatbuffers';
import { HubInfoResponse } from '@hub/flatbuffers';
import Client from '@hub/grpc-client';
import { ByteBuffer } from 'flatbuffers';
import { err, ok } from 'neverthrow';
import MessageModel from '~/flatbuffers/models/messageModel';
import { NodeMetadata } from '~/network/sync/merkleTrie';
import { TrieSnapshot } from '~/network/sync/trieNode';
import syncRequests from '~/rpc/client/syncRequests';
import { syncDefinition } from '~/rpc/syncDefinitions';

const fromServiceError = (err: grpc.ServiceError): HubError => {
  return new HubError(err.metadata.get('errCode')[0] as HubErrorCode, err.details);
};

interface GenericFlatbuffer {
  bb: ByteBuffer | null;
}

export const defaultMethod = {
  requestStream: false,
  responseStream: false,
  requestSerialize: (request: GenericFlatbuffer): Buffer => {
    return Buffer.from(request.bb?.bytes() ?? new Uint8Array());
  },
  responseSerialize: (response: GenericFlatbuffer): Buffer => {
    return Buffer.from(response.bb?.bytes() ?? new Uint8Array());
  },
};

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
  /* -------------------------------------------------------------------------- */
  /*                                   Sync Methods                             */
  /* -------------------------------------------------------------------------- */
  async getInfo(): HubAsyncResult<HubInfoResponse> {
    return this.makeUnaryInfoRequest(syncDefinition().getInfo, syncRequests.getInfoRequest());
  }

  async getSyncMetadataByPrefix(prefix: string): HubAsyncResult<NodeMetadata> {
    return this.makeUnarySyncNodeMetadataRequest(
      syncDefinition().getSyncMetadataByPrefix,
      syncRequests.createByPrefixRequest(utf8StringToBytes(prefix)._unsafeUnwrap())
    );
  }

  async getSyncTrieNodeSnapshotByPrefix(prefix: string): HubAsyncResult<{ snapshot: TrieSnapshot; rootHash: string }> {
    return this.makeUnarySyncNodeSnapshotRequest(
      syncDefinition().getSyncTrieNodeSnapshotByPrefix,
      syncRequests.createByPrefixRequest(utf8StringToBytes(prefix)._unsafeUnwrap())
    );
  }

  async getAllMessagesBySyncIds(hashes: Uint8Array[]): HubAsyncResult<MessageModel[]> {
    const messages = await this.makeUnaryMessagesRequest(
      syncDefinition().getAllMessagesBySyncIds,
      syncRequests.getAllMessagesByHashesRequest(hashes)
    );
    if (messages.isErr()) {
      return err(messages.error);
    }
    return ok(messages.value.map((message) => new MessageModel(message)));
  }

  async getSyncIdsByPrefix(prefix: string): HubAsyncResult<string[]> {
    return this.makeUnarySyncIdsByPrefixRequest(
      syncDefinition().getAllSyncIdsByPrefix,
      syncRequests.createByPrefixRequest(utf8StringToBytes(prefix)._unsafeUnwrap())
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private makeUnaryInfoRequest<RequestType>(
    method: grpc.MethodDefinition<RequestType, flatbuffers.HubInfoResponse>,
    request: RequestType
  ): HubAsyncResult<HubInfoResponse> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: flatbuffers.HubInfoResponse) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            resolve(ok(response));
          }
        }
      );
    });
  }

  private makeUnarySyncNodeMetadataRequest<RequestType>(
    method: grpc.MethodDefinition<RequestType, flatbuffers.TrieNodeMetadataResponse>,
    request: RequestType
  ): HubAsyncResult<NodeMetadata> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: flatbuffers.TrieNodeMetadataResponse) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            resolve(ok(fromNodeMetadataResponse(response)));
          }
        }
      );
    });
  }

  private makeUnarySyncNodeSnapshotRequest<RequestType>(
    method: grpc.MethodDefinition<RequestType, flatbuffers.TrieNodeSnapshotResponse>,
    request: RequestType
  ): HubAsyncResult<{ snapshot: TrieSnapshot; rootHash: string }> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: flatbuffers.TrieNodeSnapshotResponse) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            resolve(ok(fromNodeSnapshotResponse(response)));
          }
        }
      );
    });
  }

  private makeUnarySyncIdsByPrefixRequest<RequestType>(
    method: grpc.MethodDefinition<RequestType, flatbuffers.GetAllSyncIdsByPrefixResponse>,
    request: RequestType
  ): HubAsyncResult<string[]> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: flatbuffers.GetAllSyncIdsByPrefixResponse) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            resolve(ok(fromSyncIdsByPrefixResponse(response)));
          }
        }
      );
    });
  }
}

export default HubClient;
