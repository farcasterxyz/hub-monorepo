import * as flatbuffers from '@farcaster/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';

export const eventRequests = {
  subscribeRequest: (types?: flatbuffers.EventType[]): flatbuffers.SubscribeRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.SubscribeRequestT(types);
    builder.finish(requestT.pack(builder));
    return flatbuffers.SubscribeRequest.getRootAsSubscribeRequest(new ByteBuffer(builder.asUint8Array()));
  },
};
