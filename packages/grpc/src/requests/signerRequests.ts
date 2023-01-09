import * as flatbuffers from '@farcaster/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';

export const signerRequests = {
  getSigner: (fid: Uint8Array, signer: Uint8Array): flatbuffers.GetSignerRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetSignerRequestT(Array.from(fid), Array.from(signer));
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetSignerRequest.getRootAsGetSignerRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getSignersByFid: (fid: Uint8Array): flatbuffers.GetSignersByFidRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetSignersByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetSignersByFidRequest.getRootAsGetSignersByFidRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getCustodyEvent: (fid: Uint8Array): flatbuffers.GetCustodyEventRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetCustodyEventRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetCustodyEventRequest.getRootAsGetCustodyEventRequest(new ByteBuffer(builder.asUint8Array()));
  },
};
