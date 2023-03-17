import * as grpc from '@grpc/grpc-js';
import { AdminServiceClient, HubServiceClient } from './generated/rpc/service';

export { Metadata, Server, ServerCredentials, status } from '@grpc/grpc-js';
export type { CallOptions, Client, ClientReadableStream, ClientUnaryCall, ServiceError } from '@grpc/grpc-js';
export * from './generated/messages/gossip';
export * from './generated/messages/hub_event';
export * from './generated/messages/hub_state';
export * from './generated/messages/id_registry_event';
export * from './generated/messages/job';
export * from './generated/messages/message';
export * from './generated/messages/name_registry_event';
export * from './generated/messages/sync_trie';
export * from './generated/rpc/service';
export * from './typeguards';
export * from './types';

export const getServer = (): grpc.Server => {
  const server = new grpc.Server();

  return server;
};

export const getClient = async (address: string): Promise<HubServiceClient> => {
  return new Promise((resolve) => {
    try {
      const sslClientResult = getSSLClient(address);
      if (sslClientResult) {
        sslClientResult.waitForReady(Date.now() + 1000, (err) => {
          if (!err) {
            resolve(sslClientResult);
          }
        });
      }
    } catch (e) {
      // Fall back to insecure client
    }

    resolve(getInsecureClient(address));
  });
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
