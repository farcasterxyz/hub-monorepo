import { getServer, HubServiceServer, HubServiceService } from '@farcaster/protobufs';

export const SyncServiceGrpc: HubServiceServer = {
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
  submitMessage: (_call) => {
    // Not implemented
  },
  subitIdRegistryEvent: (_call) => {
    // Not implemented
  },
  submitNameRegistryEvent: (_call) => {
    // Not implemented
  },
  getCast: (_call) => {
    // Not implemented
  },
  getCastsByFid: (_call) => {
    // Not implemented
  },
  getCastsByParent: (_call) => {
    // Not implemented
  },
  getCastsByMention: (_call) => {
    // Not implemented
  },
  getReaction: (_call) => {
    // Not implemented
  },
  getReactionsByFid: (_call) => {
    // Not implemented
  },
  getReactionsByCast: (_call) => {
    // Not implemented
  },
  getAmp: (_call) => {
    // Not implemented
  },
  getAmpsByFid: (_call) => {
    // Not implemented
  },
  getAmpsByUser: (_call) => {
    // Not implemented
  },
  getUserData: (_call) => {
    // Not implemented
  },
  getUserDataByFid: (_call) => {
    // Not implemented
  },
  getNameRegistryEvent: (_call) => {
    // Not implemented
  },
  getVerification: (_call) => {
    // Not implemented
  },
  getVerificationsByFid: (_call) => {
    // Not implemented
  },
  getSigner: (_call) => {
    // Not implemented
  },
  getSignersByFid: (_call) => {
    // Not implemented
  },
  getCustodyEvent: (_call) => {
    // Not implemented
  },
  getFids: (_call) => {
    // Not implemented
  },
  getAllCastMessagesByFid: (_call) => {
    // Not implemented
  },
  getAllReactionMessagesByFid: (_call) => {
    // Not implemented
  },
  getAllAmpMessagesByFid: (_call) => {
    // Not implemented
  },
  getAllVerificationMessagesByFid: (_call) => {
    // Not implemented
  },
  getAllSignerMessagesByFid: (_call) => {
    // Not implemented
  },
  getAllUserDataMessagesByFid: (_call) => {
    // Not implemented
  },
};

const server = getServer();
server.addService(HubServiceService, SyncServiceGrpc);
