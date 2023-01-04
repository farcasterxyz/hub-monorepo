import * as flatbuffers from '@hub/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';

export const syncRequests = {
  createSyncRequest: (fid: Uint8Array): flatbuffers.GetAllMessagesByFidRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetAllMessagesByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetAllMessagesByFidRequest.getRootAsGetAllMessagesByFidRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },

  createByPrefixRequest: (prefix: Uint8Array): flatbuffers.GetTrieNodesByPrefixRequest => {
    const builder = new Builder(1);
    const requestT = new flatbuffers.GetTrieNodesByPrefixRequestT(Array.from(prefix));
    builder.finish(requestT.pack(builder));
    return flatbuffers.GetTrieNodesByPrefixRequest.getRootAsGetTrieNodesByPrefixRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },

  getAllMessagesByHashesRequest: (hashes: Uint8Array[]): flatbuffers.GetAllMessagesBySyncIdsRequest => {
    const hashes_list = hashes.map((hash) => new flatbuffers.SyncIdHashT(Array.from(hash)));

    const builder = new Builder(1);
    const hashesT = new flatbuffers.GetAllMessagesBySyncIdsRequestT(hashes_list);
    builder.finish(hashesT.pack(builder));
    return flatbuffers.GetAllMessagesBySyncIdsRequest.getRootAsGetAllMessagesBySyncIdsRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },
};
