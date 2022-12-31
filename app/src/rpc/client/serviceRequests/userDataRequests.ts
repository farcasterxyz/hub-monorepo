import * as rpc_generated from '@hub/flatbuffers';
import { UserDataType } from '@hub/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';

export const userDataRequests = {
  getUserData: (fid: Uint8Array, type: UserDataType): rpc_generated.GetUserDataRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetUserDataRequestT(Array.from(fid), type);
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetUserDataRequest.getRootAsGetUserDataRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getUserDataByFid: (fid: Uint8Array): rpc_generated.GetUserDataByFidRequest => {
    const builder = new Builder(1);
    const requestT = new rpc_generated.GetUserDataByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return rpc_generated.GetUserDataByFidRequest.getRootAsGetUserDataByFidRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },
};
