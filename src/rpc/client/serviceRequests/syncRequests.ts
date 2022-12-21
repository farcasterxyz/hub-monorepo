import { Builder, ByteBuffer } from 'flatbuffers';
import { GetAllMessagesByFidRequest, GetAllMessagesByFidRequestT } from '~/flatbuffers/generated/rpc_generated';

export const createSyncRequest = (fid: Uint8Array): GetAllMessagesByFidRequest => {
  const builder = new Builder(1);
  const requestT = new GetAllMessagesByFidRequestT(Array.from(fid));
  builder.finish(requestT.pack(builder));
  return GetAllMessagesByFidRequest.getRootAsGetAllMessagesByFidRequest(new ByteBuffer(builder.asUint8Array()));
};
