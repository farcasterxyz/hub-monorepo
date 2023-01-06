import * as flatbuffers from '@hub/flatbuffers';
import { UserId } from '@hub/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';

export const ampRequests = {
  getAmp: (fid: Uint8Array, user: UserId): flatbuffers.GetAmpRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetAmpRequestT(Array.from(fid), user.unpack());
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetAmpRequest.getRootAsGetAmpRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getAmpsByFid: (fid: Uint8Array): flatbuffers.GetAmpsByFidRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetAmpsByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetAmpsByFidRequest.getRootAsGetAmpsByFidRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getAmpsByUser: (user: UserId): flatbuffers.GetAmpsByUserRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetAmpsByUserRequestT(user.unpack());
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetAmpsByUserRequest.getRootAsGetAmpsByUserRequest(new ByteBuffer(builder.asUint8Array()));
  },
};
