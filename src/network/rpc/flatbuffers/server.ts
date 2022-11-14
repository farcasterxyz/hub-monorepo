import grpc from '@grpc/grpc-js';
import Engine from '~/storage/engine/flatbuffers';
import { castServiceMethods, castServiceImpls } from '~/network/rpc/flatbuffers/castService';
import { MessagesResponse, MessagesResponseT } from '~/utils/generated/rpc_generated';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { Builder, ByteBuffer } from 'flatbuffers';
import { HubError, HubErrorCode } from '~/utils/hubErrors';
import { followServiceImpls, followServiceMethods } from './followService';
import { reactionServiceImpls, reactionServiceMethods } from './reactionService';
import { verificationServiceImpls, verificationServiceMethods } from './verificationService';

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
  engine: Engine;
  server: grpc.Server;

  constructor(engine: Engine) {
    this.engine = engine;
    this.server = new grpc.Server();
    this.server.addService(castServiceMethods(), castServiceImpls(engine));
    this.server.addService(followServiceMethods(), followServiceImpls(engine));
    this.server.addService(reactionServiceMethods(), reactionServiceImpls(engine));
    this.server.addService(verificationServiceMethods(), verificationServiceImpls(engine));
  }

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server.bindAsync('localhost:0', grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
          reject(err);
        } else {
          this.server.start();
          resolve(port);
        }
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.tryShutdown((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export default Server;
