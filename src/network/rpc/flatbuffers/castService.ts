import grpc from '@grpc/grpc-js';
import Engine from '~/storage/engine/flatbuffers';
import { GetCastRequest, GetCastsByUserRequest } from '~/utils/generated/rpc_generated';
import { defaultMethodDefinition } from '~/network/rpc/flatbuffers/server';
import { toByteBuffer } from '~/storage/flatbuffers/utils';
import { GetCastsByParentRequest } from '~/utils/generated/farcaster/get-casts-by-parent-request';
import { GetCastsByMentionRequest } from '~/utils/generated/farcaster/get-casts-by-mention-request';
import { Message } from '~/utils/generated/message_generated';
import { CastAddModel } from '~/storage/flatbuffers/types';
import { FarcasterError } from '~/utils/errors';

export type CastServiceRequest =
  | GetCastsByUserRequest
  | GetCastRequest
  | GetCastsByParentRequest
  | GetCastsByMentionRequest;

export const castServiceAttrs = () => {
  return {
    getCastsByUser: {
      ...defaultMethodDefinition,
      path: '/getCastsByUser',
      responseStream: true,
      requestDeserialize: (buffer: Buffer): GetCastsByUserRequest => {
        return GetCastsByUserRequest.getRootAsGetCastsByUserRequest(toByteBuffer(buffer));
      },
    },

    getCast: {
      ...defaultMethodDefinition,
      path: '/getCast',
      requestDeserialize: (buffer: Buffer): GetCastRequest => {
        return GetCastRequest.getRootAsGetCastRequest(toByteBuffer(buffer));
      },
    },

    getCastsByParent: {
      ...defaultMethodDefinition,
      path: '/getCastsByParent',
      responseStream: true,
      requestDeserialize: (buffer: Buffer): GetCastsByParentRequest => {
        return GetCastsByParentRequest.getRootAsGetCastsByParentRequest(toByteBuffer(buffer));
      },
    },

    getCastsByMention: {
      ...defaultMethodDefinition,
      path: '/getCastsByMention',
      responseStream: true,
      requestDeserialize: (buffer: Buffer): GetCastsByMentionRequest => {
        return GetCastsByMentionRequest.getRootAsGetCastsByMentionRequest(toByteBuffer(buffer));
      },
    },
  };
};

export const castServiceImpls = (engine: Engine) => {
  return {
    getCastsByUser: async (call: grpc.ServerWritableStream<GetCastsByUserRequest, Message>) => {
      // TODO: typecheck params
      const castsResult = await engine.getCastsByUser(call.request.user()?.fidArray() ?? new Uint8Array());
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
      const castAddResult = await engine.getCast(
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

    getCastsByParent: async (call: grpc.ServerWritableStream<GetCastsByParentRequest, Message>) => {
      // TODO: typecheck params
      const castsResult = await engine.getCastsByParent(
        call.request.parent()?.fidArray() ?? new Uint8Array(),
        call.request.parent()?.tsHashArray() ?? new Uint8Array()
      );
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

    getCastsByMention: async (call: grpc.ServerWritableStream<GetCastsByMentionRequest, Message>) => {
      // TODO: typecheck params
      const castsResult = await engine.getCastsByMention(call.request.mention()?.fidArray() ?? new Uint8Array());
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
  };
};
