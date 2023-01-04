import * as flatbuffers from '@hub/flatbuffers';
import { CastId, UserId } from '@hub/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';

export const castRequests = {
  getCast: (fid: Uint8Array, tsHash: Uint8Array): flatbuffers.GetCastRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetCastRequestT(Array.from(fid), Array.from(tsHash));
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetCastRequest.getRootAsGetCastRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getCastsByFid: (fid: Uint8Array): flatbuffers.GetCastsByFidRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetCastsByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetCastsByFidRequest.getRootAsGetCastsByFidRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getCastsByParent: (parent: CastId): flatbuffers.GetCastsByParentRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetCastsByParentRequestT(parent.unpack());
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetCastsByParentRequest.getRootAsGetCastsByParentRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getCastsByMention: (mention: UserId): flatbuffers.GetCastsByMentionRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetCastsByMentionRequestT(mention.unpack());
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetCastsByMentionRequest.getRootAsGetCastsByMentionRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },
};
