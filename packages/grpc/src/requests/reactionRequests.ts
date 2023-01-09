import * as flatbuffers from '@farcaster/flatbuffers';
import { CastIdT, ReactionType } from '@farcaster/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';

export const reactionRequests = {
  getReaction: (fid: Uint8Array, type: ReactionType, cast: CastIdT): flatbuffers.GetReactionRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetReactionRequestT(Array.from(fid), type, cast);
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetReactionRequest.getRootAsGetReactionRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getReactionsByFid: (fid: Uint8Array, type?: ReactionType): flatbuffers.GetReactionsByFidRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetReactionsByFidRequestT(Array.from(fid), type);
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetReactionsByFidRequest.getRootAsGetReactionsByFidRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },

  getReactionsByCast: (cast: CastIdT, type?: ReactionType): flatbuffers.GetReactionsByCastRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetReactionsByCastRequestT(cast, type);
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetReactionsByCastRequest.getRootAsGetReactionsByCastRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },
};
