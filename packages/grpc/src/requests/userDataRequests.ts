import * as flatbuffers from '@farcaster/flatbuffers';
import { UserDataType } from '@farcaster/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';

export const userDataRequests = {
  getUserData: (fid: Uint8Array, type: UserDataType): flatbuffers.GetUserDataRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetUserDataRequestT(Array.from(fid), type);
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetUserDataRequest.getRootAsGetUserDataRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getUserDataByFid: (fid: Uint8Array): flatbuffers.GetUserDataByFidRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetUserDataByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetUserDataByFidRequest.getRootAsGetUserDataByFidRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getNameRegistryEvent: (fname: Uint8Array): flatbuffers.GetNameRegistryEventRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetNameRegistryEventRequestT(Array.from(fname));
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetNameRegistryEventRequest.getRootAsGetNameRegistryEventRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },
};
