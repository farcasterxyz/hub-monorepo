import grpc from '@grpc/grpc-js';
import { Builder, ByteBuffer } from 'flatbuffers';
import { MessagesResponse, MessagesResponseT } from '~/flatbuffers/generated/rpc_generated';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import * as definitions from '~/rpc/serviceDefinitions';
import { NodeMetadata } from '~/network/sync/merkleTrie';
import Engine from '~/storage/engine/flatbuffers';
import { HubAsyncResult, HubError } from '~/utils/hubErrors';
import { logger } from '~/utils/logger';
import { addressInfoFromParts } from '~/utils/p2p';
import * as implementations from '~/rpc/server/serviceImplementations';
import { HubSubmitSource } from '~/flatbuffers/models/types';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';

/**
 * Extendable RPC APIs
 */
export interface RPCHandler {
  submitMessage(message: MessageModel, source?: HubSubmitSource): HubAsyncResult<void>;
  submitIdRegistryEvent?(event: IdRegistryEventModel, source?: HubSubmitSource): HubAsyncResult<void>;
  submitNameRegistryEvent?(event: NameRegistryEventModel, source?: HubSubmitSource): HubAsyncResult<void>;
  getSyncMetadataByPrefix?(prefix: string): HubAsyncResult<NodeMetadata>;
  getSyncIdsByPrefix?(prefix: string): HubAsyncResult<string[]>;
}

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

export const toMessagesResponse = (messages: MessageModel[]): MessagesResponse => {
  const messagesT = new MessagesResponseT(messages.map((model) => model.message.unpack()));
  const builder = new Builder(1);
  builder.finish(messagesT.pack(builder));
  const response = MessagesResponse.getRootAsMessagesResponse(new ByteBuffer(builder.asUint8Array()));
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

  constructor(engine: Engine, rpcHandler?: RPCHandler) {
    this.port = 0;
    this.server = new grpc.Server();
    this.server.addService(definitions.submitDefinition(), implementations.submitImplementation(engine, rpcHandler));
    this.server.addService(definitions.castDefinition(), implementations.castImplementation(engine));
    this.server.addService(definitions.ampDefinition(), implementations.ampImplementation(engine));
    this.server.addService(definitions.reactionDefinition(), implementations.reactionImplementation(engine));
    this.server.addService(definitions.verificationDefinition(), implementations.verificationImplementations(engine));
    this.server.addService(definitions.signerDefinition(), implementations.signerImplementation(engine));
    this.server.addService(definitions.userDataDefinition(), implementations.userDataImplementations(engine));
    this.server.addService(definitions.syncDefinition(), implementations.syncImplementation(engine));
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
