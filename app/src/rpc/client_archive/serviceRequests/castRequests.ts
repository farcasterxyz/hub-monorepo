import * as rpc_generated from '@hub/flatbuffers';
import { CastId, UserId } from '@hub/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';

export const castRequests = {
  getCast: (fid: Uint8Array, tsHash: Uint8Array): rpc_generated.GetCastRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetCastRequestT(Array.from(fid), Array.from(tsHash));
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetCastRequest.getRootAsGetCastRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getCastsByFid: (fid: Uint8Array): rpc_generated.GetCastsByFidRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetCastsByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetCastsByFidRequest.getRootAsGetCastsByFidRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getCastsByParent: (parent: CastId): rpc_generated.GetCastsByParentRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetCastsByParentRequestT(parent.unpack());
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetCastsByParentRequest.getRootAsGetCastsByParentRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },

  getCastsByMention: (mention: UserId): rpc_generated.GetCastsByMentionRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetCastsByMentionRequestT(mention.unpack());
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetCastsByMentionRequest.getRootAsGetCastsByMentionRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },
};
