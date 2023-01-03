import grpc from '@grpc/grpc-js';
import * as flatbuffers from '@hub/flatbuffers';
import { arrayify } from 'ethers/lib/utils';
import { Builder, ByteBuffer } from 'flatbuffers';
import MessageModel from '~/flatbuffers/models/messageModel';
import { HubInterface } from '~/flatbuffers/models/types';
import { NodeMetadata } from '~/network/sync/merkleTrie';
import SyncEngine from '~/network/sync/syncEngine';
import { TrieSnapshot } from '~/network/sync/trieNode';
import * as implementations from '~/rpc/server/serviceImplementations';
import * as definitions from '~/rpc/serviceDefinitions';
import Engine from '~/storage/engine';
import { HubError } from '~/utils/hubErrors';
import { logger } from '~/utils/logger';
import { addressInfoFromParts } from '~/utils/p2p';

export const toServiceError = (err: HubError): grpc.ServiceError => {
  let grpcCode: number;
  if (err.errCode === 'unauthenticated') {
    grpcCode = grpc.status.UNAUTHENTICATED;
  } else if (err.errCode === 'unauthorized') {
    grpcCode = grpc.status.PERMISSION_DENIED;
  } else if (
    err.errCode === 'bad_request' ||
    err.errCode === 'bad_request.parse_failure' ||
    err.errCode === 'bad_request.validation_failure'
  ) {
    grpcCode = grpc.status.INVALID_ARGUMENT;
  } else if (err.errCode === 'not_found') {
    grpcCode = grpc.status.NOT_FOUND;
  } else if (
    err.errCode === 'unavailable' ||
    err.errCode === 'unavailable.network_failure' ||
    err.errCode === 'unavailable.storage_failure'
  ) {
    grpcCode = grpc.status.UNAVAILABLE;
  } else {
    grpcCode = grpc.status.UNKNOWN;
  }
  const metadata = new grpc.Metadata();
  metadata.set('errCode', err.errCode);
  return Object.assign(err, {
    code: grpcCode,
    details: err.message,
    metadata,
  });
};

export const toMessagesResponse = (messages: MessageModel[]): flatbuffers.MessagesResponse => {
  const messagesT = new flatbuffers.MessagesResponseT(
    messages.map((model) => new flatbuffers.MessageBytesT(Array.from(model.toBytes())))
  );
  const builder = new Builder(1);
  builder.finish(messagesT.pack(builder));
  const response = flatbuffers.MessagesResponse.getRootAsMessagesResponse(new ByteBuffer(builder.asUint8Array()));
  return response;
};

export const toSyncIdsResponse = (ids: string[]): flatbuffers.GetAllSyncIdsByPrefixResponse => {
  const idsT = new flatbuffers.GetAllSyncIdsByPrefixResponseT(ids);
  const builder = new Builder(1);
  builder.finish(idsT.pack(builder));
  const response = flatbuffers.GetAllSyncIdsByPrefixResponse.getRootAsGetAllSyncIdsByPrefixResponse(
    new ByteBuffer(builder.asUint8Array())
  );
  return response;
};

export const toTrieNodeMetadataResponse = (metadata: NodeMetadata): flatbuffers.TrieNodeMetadataResponse => {
  const childrenTrie = [];

  if (metadata.children) {
    for (const [, child] of metadata.children) {
      childrenTrie.push(
        new flatbuffers.TrieNodeMetadataResponseT(
          Array.from(arrayify(Buffer.from(child.prefix))),
          BigInt(child.numMessages),
          Array.from(arrayify(Buffer.from(child.hash))),
          []
        )
      );
    }
  }

  const metadataT = new flatbuffers.TrieNodeMetadataResponseT(
    Array.from(arrayify(Buffer.from(metadata.prefix))),
    BigInt(metadata.numMessages),
    Array.from(arrayify(Buffer.from(metadata.hash))),
    childrenTrie
  );
  const builder = new Builder(1);
  builder.finish(metadataT.pack(builder));
  const response = flatbuffers.TrieNodeMetadataResponse.getRootAsTrieNodeMetadataResponse(
    new ByteBuffer(builder.asUint8Array())
  );
  return response;
};

export const toTrieNodeSnapshotResponse = (
  snapshot: TrieSnapshot,
  rootHash: string
): flatbuffers.TrieNodeSnapshotResponse => {
  const snapshotT = new flatbuffers.TrieNodeSnapshotResponseT(
    snapshot.prefix,
    snapshot.excludedHashes,
    BigInt(snapshot.numMessages),
    rootHash
  );

  const builder = new Builder(1);
  builder.finish(snapshotT.pack(builder));
  const response = flatbuffers.TrieNodeSnapshotResponse.getRootAsTrieNodeSnapshotResponse(
    new ByteBuffer(builder.asUint8Array())
  );
  return response;
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

class Server {
  private server: grpc.Server;
  private port: number;

  constructor(hub: HubInterface, engine: Engine, syncEngine: SyncEngine) {
    this.port = 0;
    this.server = new grpc.Server();
    this.server.addService(definitions.submitDefinition(), implementations.submitImplementation(hub));
    this.server.addService(definitions.castDefinition(), implementations.castImplementation(engine));
    this.server.addService(definitions.ampDefinition(), implementations.ampImplementation(engine));
    this.server.addService(definitions.reactionDefinition(), implementations.reactionImplementation(engine));
    this.server.addService(definitions.verificationDefinition(), implementations.verificationImplementations(engine));
    this.server.addService(definitions.signerDefinition(), implementations.signerImplementation(engine));
    this.server.addService(definitions.userDataDefinition(), implementations.userDataImplementations(engine));
    this.server.addService(definitions.syncDefinition(), implementations.syncImplementation(engine, syncEngine));
    this.server.addService(definitions.eventDefinition(), implementations.eventImplementation(engine));
  }

  async start(port = 0): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
          reject(err);
        } else {
          this.server.start();
          this.port = port;

          logger.info({ component: 'gRPC Server', address: this.address }, 'Starting gRPC Server');
          resolve(port);
        }
      });
    });
  }

  async stop(force = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (force) {
        this.server.forceShutdown();
        resolve();
      } else {
        this.server.tryShutdown((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }
    });
  }

  get address() {
    const addr = addressInfoFromParts('0.0.0.0', this.port);
    return addr;
  }
}

export default Server;
