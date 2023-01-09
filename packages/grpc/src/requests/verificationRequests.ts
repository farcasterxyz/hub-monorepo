import * as flatbuffers from '@farcaster/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';

export const verificationRequests = {
  getVerification: (fid: Uint8Array, address: Uint8Array): flatbuffers.GetVerificationRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetVerificationRequestT(Array.from(fid), Array.from(address));
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetVerificationRequest.getRootAsGetVerificationRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getVerificationsByFid: (fid: Uint8Array): flatbuffers.GetVerificationsByFidRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetVerificationsByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetVerificationsByFidRequest.getRootAsGetVerificationsByFidRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },
};
