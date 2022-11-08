import grpc from '@grpc/grpc-js';
import Engine from '~/storage/engine/flatbuffers';
import { Message } from '~/utils/generated/message_generated';
import { toByteBuffer } from '~/storage/flatbuffers/utils';
import { castServiceAttrs, castServiceImpls, CastServiceRequest } from '~/network/rpc/flatbuffers/castService';

type RpcRequest = CastServiceRequest;

export const defaultMethodDefinition = {
  requestStream: false,
  responseStream: false,
  requestSerialize: (request: RpcRequest): Buffer => {
    return Buffer.from(request.bb?.bytes() ?? new Uint8Array().buffer);
  },
  responseSerialize: (response: Message): Buffer => {
    return Buffer.from((response.bb?.bytes() ?? new Uint8Array()).buffer);
  },
  responseDeserialize: (buffer: Buffer): Message => {
    return Message.getRootAsMessage(toByteBuffer(buffer));
  },
};

class Server {
  engine: Engine;
  server: grpc.Server;

  constructor(engine: Engine) {
    this.engine = engine;
    this.server = new grpc.Server();
    this.server.addService(castServiceAttrs(), castServiceImpls(engine));
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
