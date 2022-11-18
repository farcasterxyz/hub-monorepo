import grpc from '@grpc/grpc-js';
import Engine from '~/storage/engine/flatbuffers';
import { MessagesResponse } from '~/utils/generated/rpc_generated';
import { defaultMethod, toMessagesResponse, toServiceError } from '~/network/rpc/flatbuffers/server';
import { toByteBuffer } from '~/storage/flatbuffers/utils';
import { HubError } from '~/utils/hubErrors';
import { Builder, ByteBuffer } from 'flatbuffers';
import {
  CastAddModel,
  CastRemoveModel,
  FollowAddModel,
  FollowRemoveModel,
  ReactionAddModel,
  ReactionRemoveModel,
  SignerAddModel,
  SignerRemoveModel,
  UserDataAddModel,
  VerificationAddEthAddressModel,
  VerificationRemoveModel,
} from '~/storage/flatbuffers/types';
import {
  GetAllMessagesByFidRequest,
  GetAllMessagesByFidRequestT,
} from '~/utils/generated/farcaster/get-all-messages-by-fid-request';

const defaultSyncMethod = () => {
  return {
    ...defaultMethod,
    requestDeserialize: (buffer: Buffer): GetAllMessagesByFidRequest => {
      return GetAllMessagesByFidRequest.getRootAsGetAllMessagesByFidRequest(toByteBuffer(buffer));
    },
    responseDeserialize: (buffer: Buffer): MessagesResponse => {
      return MessagesResponse.getRootAsMessagesResponse(toByteBuffer(buffer));
    },
  };
};

export const syncServiceMethods = () => {
  return {
    getAllCastMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllCastMessagesByFid',
    },

    getAllFollowMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllFollowMessagesByFid',
    },

    getAllReactionMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllReactionMessagesByFid',
    },

    getAllVerificationMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllVerificationMessagesByFid',
    },

    getAllSignerMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllSigneressagesByFid',
    },

    getAllUserDataMessagesByFid: {
      ...defaultSyncMethod(),
      path: '/getAllUserDataMessagesByFid',
    },
  };
};

export const syncServiceImpls = (engine: Engine) => {
  return {
    getAllCastMessagesByFid: async (
      call: grpc.ServerUnaryCall<GetAllMessagesByFidRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const result = await engine.getAllCastMessagesByFid(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (messages: (CastAddModel | CastRemoveModel)[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getAllFollowMessagesByFid: async (
      call: grpc.ServerUnaryCall<GetAllMessagesByFidRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const result = await engine.getAllFollowMessagesByFid(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (messages: (FollowAddModel | FollowRemoveModel)[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getAllReactionMessagesByFid: async (
      call: grpc.ServerUnaryCall<GetAllMessagesByFidRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const result = await engine.getAllReactionMessagesByFid(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (messages: (ReactionAddModel | ReactionRemoveModel)[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getAllVerificationMessagesByFid: async (
      call: grpc.ServerUnaryCall<GetAllMessagesByFidRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const result = await engine.getAllVerificationMessagesByFid(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (messages: (VerificationAddEthAddressModel | VerificationRemoveModel)[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getAllSignerMessagesByFid: async (
      call: grpc.ServerUnaryCall<GetAllMessagesByFidRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const result = await engine.getAllSignerMessagesByFid(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (messages: (SignerAddModel | SignerRemoveModel)[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },

    getAllUserDataMessagesByFid: async (
      call: grpc.ServerUnaryCall<GetAllMessagesByFidRequest, MessagesResponse>,
      callback: grpc.sendUnaryData<MessagesResponse>
    ) => {
      const result = await engine.getUserDataByFid(call.request.fidArray() ?? new Uint8Array());
      result.match(
        (messages: UserDataAddModel[]) => {
          callback(null, toMessagesResponse(messages));
        },
        (err: HubError) => {
          callback(toServiceError(err));
        }
      );
    },
  };
};

export const createSyncServiceRequest = (fid: Uint8Array): GetAllMessagesByFidRequest => {
  const builder = new Builder(1);
  const requestT = new GetAllMessagesByFidRequestT(Array.from(fid));
  builder.finish(requestT.pack(builder));
  return GetAllMessagesByFidRequest.getRootAsGetAllMessagesByFidRequest(new ByteBuffer(builder.asUint8Array()));
};
