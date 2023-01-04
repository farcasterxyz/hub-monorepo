import {
  GetAllMessagesByFidRequest,
  GetAllMessagesByFidRequestT,
  GetAllMessagesBySyncIdsRequest,
  GetAllMessagesBySyncIdsRequestT,
  GetTrieNodesByPrefixRequest,
  GetTrieNodesByPrefixRequestT,
  SyncIdHashT,
} from '@hub/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';

const syncRequests = {
  createSyncRequest: (fid: Uint8Array): GetAllMessagesByFidRequest => {
    const builder = new Builder(1);
    const requestT = new GetAllMessagesByFidRequestT(Array.from(fid));
    builder.finish(requestT.pack(builder));
    return GetAllMessagesByFidRequest.getRootAsGetAllMessagesByFidRequest(new ByteBuffer(builder.asUint8Array()));
  },

  createByPrefixRequest: (prefix: Uint8Array): GetTrieNodesByPrefixRequest => {
    const builder = new Builder(1);
    const requestT = new GetTrieNodesByPrefixRequestT(Array.from(prefix));
    builder.finish(requestT.pack(builder));
    return GetTrieNodesByPrefixRequest.getRootAsGetTrieNodesByPrefixRequest(new ByteBuffer(builder.asUint8Array()));
  },

  getAllMessagesByHashesRequest: (hashes: Uint8Array[]): GetAllMessagesBySyncIdsRequest => {
    const hashes_list = hashes.map((hash) => new SyncIdHashT(Array.from(hash)));

    const builder = new Builder(1);
    const hashesT = new GetAllMessagesBySyncIdsRequestT(hashes_list);
    builder.finish(hashesT.pack(builder));
    return GetAllMessagesBySyncIdsRequest.getRootAsGetAllMessagesBySyncIdsRequest(
      new ByteBuffer(builder.asUint8Array())
    );
  },
};

export default syncRequests;
