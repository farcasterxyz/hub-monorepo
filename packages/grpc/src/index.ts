import { HubServiceClient } from '@farcaster/protobufs/src/generated/rpc';
import * as grpc from '@grpc/grpc-js';

export * from '@farcaster/protobufs/src/generated/gossip';
export * from '@farcaster/protobufs/src/generated/hub_state';
export * from '@farcaster/protobufs/src/generated/id_registry_event';
export * from '@farcaster/protobufs/src/generated/job';
export * from '@farcaster/protobufs/src/generated/message';
export * from '@farcaster/protobufs/src/generated/name_registry_event';
export * from '@farcaster/protobufs/src/generated/rpc';
export { Metadata, Server, ServerCredentials, status } from '@grpc/grpc-js';
export type { CallOptions, Client, ClientReadableStream, ClientUnaryCall, ServiceError } from '@grpc/grpc-js';
export * from './typeguards';
export * from './types';

export const getServer = (): grpc.Server => {
  const server = new grpc.Server();

  return server;
};

export const getClient = (address: string): HubServiceClient => {
  return new HubServiceClient(address, grpc.credentials.createInsecure());
};
