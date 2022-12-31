import { GetAllMessagesByFidRequest, GetAllMessagesByFidRequestT } from '@hub/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';

export const createSyncRequest = (fid: Uint8Array): GetAllMessagesByFidRequest => {
  const builder = new Builder(1);
  const requestT = new GetAllMessagesByFidRequestT(Array.from(fid));
  builder.finish(requestT.pack(builder));
  return GetAllMessagesByFidRequest.getRootAsGetAllMessagesByFidRequest(new ByteBuffer(builder.asUint8Array()));
};
