import grpc from '@grpc/grpc-js';
import Engine from '~/storage/engine/flatbuffers';
import { castServiceMethods, castServiceImpls } from '~/network/rpc/flatbuffers/castService';
import { MessagesResponse, MessagesResponseT } from '~/utils/generated/rpc_generated';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { Builder, ByteBuffer } from 'flatbuffers';
import { HubAsyncResult, HubError, HubErrorCode } from '~/utils/hubErrors';
import { ampServiceImpls, ampServiceMethods } from '~/network/rpc/flatbuffers/ampService';
import { reactionServiceImpls, reactionServiceMethods } from '~/network/rpc/flatbuffers/reactionService';
import { verificationServiceImpls, verificationServiceMethods } from '~/network/rpc/flatbuffers/verificationService';
import { submitServiceImpls, submitServiceMethods } from '~/network/rpc/flatbuffers/submitService';
import { signerServiceImpls, signerServiceMethods } from '~/network/rpc/flatbuffers/signerService';
import { userDataServiceImpls, userDataServiceMethods } from '~/network/rpc/flatbuffers/userDataService';
import { syncServiceImpls, syncServiceMethods } from '~/network/rpc/flatbuffers/syncService';
import { eventServiceImpls, eventServiceMethods } from './eventService';
import { NodeMetadata } from '~/network/sync/merkleTrie';
import IdRegistryEventModel from '~/storage/flatbuffers/idRegistryEventModel';
import { addressInfoFromParts } from '~/utils/p2p';
import { logger } from '~/utils/logger';

/**
 * Extendable RPC APIs
 */
export interface RPCHandler {
  submitMessage(message: MessageModel): HubAsyncResult<void>;
  submitIdRegistryEvent?(event: IdRegistryEventModel): HubAsyncResult<void>;
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

export const fromServiceError = (err: grpc.ServiceError): HubError => {
  return new HubError(err.metadata.get('errCode')[0] as HubErrorCode, err.details);
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
  server: grpc.Server;
  port: number;

  constructor(engine: Engine, rpcHandler?: RPCHandler) {
    this.port = 0;
    this.server = new grpc.Server();
    this.server.addService(submitServiceMethods(), submitServiceImpls(engine, rpcHandler));
    this.server.addService(castServiceMethods(), castServiceImpls(engine));
    this.server.addService(ampServiceMethods(), ampServiceImpls(engine));
    this.server.addService(reactionServiceMethods(), reactionServiceImpls(engine));
    this.server.addService(verificationServiceMethods(), verificationServiceImpls(engine));
    this.server.addService(signerServiceMethods(), signerServiceImpls(engine));
    this.server.addService(userDataServiceMethods(), userDataServiceImpls(engine));
    this.server.addService(syncServiceMethods(), syncServiceImpls(engine));
    this.server.addService(eventServiceMethods(), eventServiceImpls(engine));
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
