import { Builder, ByteBuffer } from 'flatbuffers';
import { CastId, ReactionType } from '~/flatbuffers/generated/message_generated';
import * as rpc_generated from '~/flatbuffers/generated/rpc_generated';

export const reactionRequests = {
  getReaction: (fid: Uint8Array, type: ReactionType, cast: CastId): rpc_generated.GetReactionRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetReactionRequestT(Array.from(fid), type, cast.unpack());
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetReactionRequest.getRootAsGetReactionRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getReactionsByFid: (fid: Uint8Array, type?: ReactionType): rpc_generated.GetReactionsByFidRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetReactionsByFidRequestT(Array.from(fid), type);
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetReactionsByFidRequest.getRootAsGetReactionsByFidRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },

  getReactionsByCast: (cast: CastId, type?: ReactionType): rpc_generated.GetReactionsByCastRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetReactionsByCastRequestT(cast.unpack(), type);
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetReactionsByCastRequest.getRootAsGetReactionsByCastRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },
};
