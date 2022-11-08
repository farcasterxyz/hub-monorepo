import grpc from '@grpc/grpc-js';
import { ByteBuffer } from 'flatbuffers';
import Engine from '~/storage/engine/flatbuffers';
import { CastAddModel } from '~/storage/flatbuffers/types';
import { FarcasterError } from '~/utils/errors';
import { GetCastRequest, GetCastsByUserRequest } from '~/utils/generated/rpc_generated';
import { Message } from '~/utils/generated/message_generated';

class Server {
  engine: Engine;
  server: grpc.Server;

  constructor(engine: Engine) {
    this.engine = engine;
    this.server = new grpc.Server();
    this.server.addService(Server.castServiceAttrs(), this.castServiceImpls());
  }

  static castServiceAttrs() {
    return {
      getCastsByUser: {
        path: '/getCastsByUser',
        requestStream: false,
        responseStream: true,
        requestSerialize: (request: GetCastsByUserRequest): Buffer => {
          return Buffer.from(request.bb?.bytes() ?? new Uint8Array().buffer);
        },
        requestDeserialize: (buffer: Buffer): GetCastsByUserRequest => {
          return GetCastsByUserRequest.getRootAsGetCastsByUserRequest(
            new ByteBuffer(
              new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length / Uint8Array.BYTES_PER_ELEMENT)
            )
          );
        },
        responseSerialize: (response: Message): Buffer => {
          return Buffer.from((response.bb?.bytes() ?? new Uint8Array()).buffer);
        },
        responseDeserialize: (buffer: Buffer): Message => {
          return Message.getRootAsMessage(
            new ByteBuffer(
              new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length / Uint8Array.BYTES_PER_ELEMENT)
            )
          );
        },
      },
      getCast: {
        path: '/getCast',
        requestStream: false,
        responseStream: false,
        requestSerialize: (request: GetCastRequest): Buffer => {
          return Buffer.from(request.bb?.bytes() ?? new Uint8Array());
        },
        requestDeserialize: (buffer: Buffer): GetCastRequest => {
          return GetCastRequest.getRootAsGetCastRequest(
            new ByteBuffer(
              new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length / Uint8Array.BYTES_PER_ELEMENT)
            )
          );
        },
        responseSerialize: (response: Message): Buffer => {
          return Buffer.from((response.bb?.bytes() ?? new Uint8Array()).buffer);
        },
        responseDeserialize: (buffer: Buffer): Message => {
          return Message.getRootAsMessage(
            new ByteBuffer(
              new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length / Uint8Array.BYTES_PER_ELEMENT)
            )
          );
        },
      },
      // getCastsByParent: { ...defaultMethodDefinition, path: '/getCastsByParent' },
      // getCastsByMention: { ...defaultMethodDefinition, path: '/getCastsByMention' },
      // getAllCastMessagesByUser: { ...defaultMethodDefinition, path: '/getAllCastMessagesByUser' },
    };
  }

  castServiceImpls(): grpc.UntypedServiceImplementation {
    return {
      getCastsByUser: async (call: grpc.ServerWritableStream<GetCastsByUserRequest, Message>) => {
        // TODO: typecheck params
        const castsResult = await this.engine.getCastsByUser(call.request.user()?.fidArray() ?? new Uint8Array());
        castsResult.match(
          (messages: CastAddModel[]) => {
            for (const message of messages) {
              call.write(message.message);
            }
            call.end();
          },
          (err: FarcasterError) => {
            throw err;
          }
        );
      },

      getCast: async (call: grpc.ServerUnaryCall<GetCastRequest, Message>, callback: grpc.sendUnaryData<Message>) => {
        // TODO: typecheck params
        const castAddResult = await this.engine.getCast(
          call.request.cast()?.fidArray() ?? new Uint8Array(),
          call.request.cast()?.tsHashArray() ?? new Uint8Array()
        );
        castAddResult.match(
          (value: CastAddModel) => {
            callback(null, value.message);
          },
          (err: FarcasterError) => callback(err)
        );
      },
    };
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
