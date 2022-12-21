import { Builder, ByteBuffer } from 'flatbuffers';
import * as rpc_generated from '~/flatbuffers/generated/rpc_generated';

export const verificationRequests = {
  getVerification: (fid: Uint8Array, address: Uint8Array): rpc_generated.GetVerificationRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetVerificationRequestT(Array.from(fid), Array.from(address));
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetVerificationRequest.getRootAsGetVerificationRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getVerificationsByFid: (fid: Uint8Array): rpc_generated.GetVerificationsByFidRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetVerificationsByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetVerificationsByFidRequest.getRootAsGetVerificationsByFidRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },
};
