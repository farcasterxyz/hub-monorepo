import * as grpc from '@grpc/grpc-js';
import { AdminServiceClient, HubServiceClient } from './generated/rpc';

export { Metadata, Server, ServerCredentials, status } from '@grpc/grpc-js';
export type { CallOptions, Client, ClientReadableStream, ClientUnaryCall, ServiceError } from '@grpc/grpc-js';
export * from './generated/gossip';
export * from './generated/hub_event';
export * from './generated/hub_state';
export * from './generated/id_registry_event';
export * from './generated/job';
export * from './generated/message';
export * from './generated/name_registry_event';
export * from './generated/rpc';
export * from './generated/sync_trie';
export * from './typeguards';
export * from './types';

export const getServer = (): grpc.Server => {
  const server = new grpc.Server();

  return server;
};

export const getSSLClient = (address: string): HubServiceClient => {
  return new HubServiceClient(address, grpc.credentials.createSsl());
};

export const getInsecureClient = (address: string): HubServiceClient => {
  return new HubServiceClient(address, grpc.credentials.createInsecure());
};

export const getAdminClient = (address: string): AdminServiceClient => {
  return new AdminServiceClient(address, grpc.credentials.createInsecure());
};
