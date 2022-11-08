import grpc from '@grpc/grpc-js';
import { Builder, ByteBuffer } from 'flatbuffers';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { CastAddModel } from '~/storage/flatbuffers/types';
import { CastIdT, Message, UserIdT } from '~/utils/generated/message_generated';
import Server from '~/network/rpc/flatbuffers/server';
import {
  GetCastRequest,
  GetCastRequestT,
  GetCastsByUserRequest,
  GetCastsByUserRequestT,
} from '~/utils/generated/rpc_generated';

const promisifyMessageStream = <T extends MessageModel>(stream: grpc.ClientReadableStream<Message>): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const messages: T[] = [];
    stream.on('data', (message: Message) => {
      messages.push(new MessageModel(message) as T);
    });
    stream.on('end', () => {
      resolve(messages);
    });
    stream.on('error', (err) => {
      reject(err);
    });
  });
};

class Client {
  client: grpc.Client;

  constructor(port: number) {
    this.client = new grpc.Client(`localhost:${port}`, grpc.credentials.createInsecure());
  }

  close() {
    this.client.close();
  }

  async getCastsByUser(fid: Uint8Array): Promise<CastAddModel[]> {
    const builder = new Builder(1);
    const requestT = new GetCastsByUserRequestT(new UserIdT(Array.from(fid)));
    builder.finish(requestT.pack(builder));
    const request = GetCastsByUserRequest.getRootAsGetCastsByUserRequest(new ByteBuffer(builder.asUint8Array()));

    const stream = this.client.makeServerStreamRequest(
      '/getCastsByUser',
      Server.castServiceAttrs().getCastsByUser.requestSerialize,
      Server.castServiceAttrs().getCastsByUser.responseDeserialize,
      request
    );

    return promisifyMessageStream<CastAddModel>(stream);
  }

  async getCast(fid: Uint8Array, tsHash: Uint8Array): Promise<CastAddModel> {
    const builder = new Builder(1);
    const castIdT = new CastIdT(Array.from(fid), Array.from(tsHash));
    const requestT = new GetCastRequestT(castIdT);
    builder.finish(requestT.pack(builder));
    const rpcRequest = GetCastRequest.getRootAsGetCastRequest(new ByteBuffer(builder.asUint8Array()));

    return new Promise((resolve, reject) => {
      this.client.makeUnaryRequest(
        '/getCast',
        Server.castServiceAttrs().getCast.requestSerialize,
        Server.castServiceAttrs().getCast.responseDeserialize,
        rpcRequest,
        async (err: grpc.ServiceError | null, response?: Message) => {
          if (err) {
            reject(err);
          } else if (response) {
            resolve(new MessageModel(response) as CastAddModel);
          }
        }
      );
    });
  }

  serializeRequest(bytes: Uint8Array): Buffer {
    return Buffer.from(bytes);
  }

  deserializeResponse(buffer: Buffer): CastAddModel {
    const message = MessageModel.from(new Uint8Array(buffer));
    return message as CastAddModel;
  }
}

export default Client;
