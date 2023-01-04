import * as rpc_generated from '@hub/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';

export const signerRequests = {
  getSigner: (fid: Uint8Array, signer: Uint8Array): rpc_generated.GetSignerRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetSignerRequestT(Array.from(fid), Array.from(signer));
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetSignerRequest.getRootAsGetSignerRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getSignersByFid: (fid: Uint8Array): rpc_generated.GetSignersByFidRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetSignersByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetSignersByFidRequest.getRootAsGetSignersByFidRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getCustodyEvent: (fid: Uint8Array): rpc_generated.GetCustodyEventRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetCustodyEventRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetCustodyEventRequest.getRootAsGetCustodyEventRequest(new ByteBuffer(builder.asUint8Array()));
  },
};
