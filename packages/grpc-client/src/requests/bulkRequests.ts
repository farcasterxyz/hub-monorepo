import * as flatbuffers from '@hub/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';

export const bulkRequests = {
  createMessagesByFidRequest: (fid: Uint8Array): flatbuffers.GetAllMessagesByFidRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetAllMessagesByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetAllMessagesByFidRequest.getRootAsGetAllMessagesByFidRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },
};
