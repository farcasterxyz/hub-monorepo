import grpc from '@grpc/grpc-js';
import { Builder, ByteBuffer } from 'flatbuffers';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { CastAddModel } from '~/storage/flatbuffers/types';
import {
  GetCastsByMentionRequest,
  GetCastsByMentionRequestT,
} from '~/utils/generated/farcaster/get-casts-by-mention-request';
import {
  GetCastsByParentRequest,
  GetCastsByParentRequestT,
} from '~/utils/generated/farcaster/get-casts-by-parent-request';
import { CastIdT, Message, UserIdT } from '~/utils/generated/message_generated';
import {
  GetCastRequest,
  GetCastRequestT,
  GetCastsByUserRequest,
  GetCastsByUserRequestT,
} from '~/utils/generated/rpc_generated';
import { castServiceAttrs } from './castService';

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
      castServiceAttrs().getCastsByUser.requestSerialize,
      castServiceAttrs().getCastsByUser.responseDeserialize,
      request
    );

    return promisifyMessageStream<CastAddModel>(stream);
  }

  async getCast(fid: Uint8Array, tsHash: Uint8Array): Promise<CastAddModel> {
    const builder = new Builder(1);
    const requestT = new GetCastRequestT(new CastIdT(Array.from(fid), Array.from(tsHash)));
    builder.finish(requestT.pack(builder));
    const request = GetCastRequest.getRootAsGetCastRequest(new ByteBuffer(builder.asUint8Array()));

    return new Promise((resolve, reject) => {
      this.client.makeUnaryRequest(
        '/getCast',
        castServiceAttrs().getCast.requestSerialize,
        castServiceAttrs().getCast.responseDeserialize,
        request,
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

  async getCastsByParent(fid: Uint8Array, tsHash: Uint8Array): Promise<CastAddModel[]> {
    const builder = new Builder(1);
    const requestT = new GetCastsByParentRequestT(new CastIdT(Array.from(fid), Array.from(tsHash)));
    builder.finish(requestT.pack(builder));
    const request = GetCastsByParentRequest.getRootAsGetCastsByParentRequest(new ByteBuffer(builder.asUint8Array()));

    const stream = this.client.makeServerStreamRequest(
      '/getCastsByParent',
      castServiceAttrs().getCastsByParent.requestSerialize,
      castServiceAttrs().getCastsByParent.responseDeserialize,
      request
    );

    return promisifyMessageStream<CastAddModel>(stream);
  }

  async getCastsByMention(fid: Uint8Array): Promise<CastAddModel[]> {
    const builder = new Builder(1);
    const requestT = new GetCastsByMentionRequestT(new UserIdT(Array.from(fid)));
    builder.finish(requestT.pack(builder));
    const request = GetCastsByMentionRequest.getRootAsGetCastsByMentionRequest(new ByteBuffer(builder.asUint8Array()));

    const stream = this.client.makeServerStreamRequest(
      '/getCastsByMention',
      castServiceAttrs().getCastsByMention.requestSerialize,
      castServiceAttrs().getCastsByMention.responseDeserialize,
      request
    );

    return promisifyMessageStream<CastAddModel>(stream);
  }
}

export default Client;
