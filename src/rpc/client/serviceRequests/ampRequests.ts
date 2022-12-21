import { Builder, ByteBuffer } from 'flatbuffers';
import { UserId } from '~/flatbuffers/generated/message_generated';
import * as rpc_generated from '~/flatbuffers/generated/rpc_generated';

export const ampRequests = {
  getAmp: (fid: Uint8Array, user: UserId): rpc_generated.GetAmpRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetAmpRequestT(Array.from(fid), user.unpack());
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetAmpRequest.getRootAsGetAmpRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getAmpsByFid: (fid: Uint8Array): rpc_generated.GetAmpsByFidRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetAmpsByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetAmpsByFidRequest.getRootAsGetAmpsByFidRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getAmpsByUser: (user: UserId): rpc_generated.GetAmpsByUserRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetAmpsByUserRequestT(user.unpack());
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetAmpsByUserRequest.getRootAsGetAmpsByUserRequest(new ByteBuffer(builder.asUint8Array()));
  },
};
