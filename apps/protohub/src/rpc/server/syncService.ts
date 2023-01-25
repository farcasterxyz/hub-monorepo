import { getServer, SyncServiceServer, SyncServiceService } from '@farcaster/protobufs';

export const SyncServiceGrpc: SyncServiceServer = {
  getInfo: (_call, _callback) => {
    // Not implemented
  },
  getAllSyncIdsByPrefix: (_call, _callback) => {
    // Not implemented
  },
  getAllMessagesBySyncIds: (_call) => {
    // Not implemented
  },
  getSyncMetadataByPrefix: (_call, _callback) => {
    // Not implemented
  },
  getSyncSnapshotByPrefix: (_call, _callback) => {
    // Not implemented
  },
};

const server = getServer();
server.addService(SyncServiceService, SyncServiceGrpc);
