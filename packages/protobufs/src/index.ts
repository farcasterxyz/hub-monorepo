import * as grpc from '@grpc/grpc-js';

export * from './generated/gossip';
export * from './generated/hub_state';
export * from './generated/id_registry_event';
export * from './generated/message';
export * from './generated/rpc';
export * from './typeguards';
export * from './types';

export const getServer = (): grpc.Server => {
  const server = new grpc.Server();

  return server;
};
