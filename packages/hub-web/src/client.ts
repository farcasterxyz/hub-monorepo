import { GrpcWebImpl, HubServiceClientImpl } from './generated/rpc';
import { NodeHttpTransport } from '@improbable-eng/grpc-web-node-http-transport';

export type RpcWebClient = typeof HubServiceClientImpl;

export const getRpcWebClient = (url: string, isBrowser = true): HubServiceClientImpl => {
  return new HubServiceClientImpl(new GrpcWebImpl(url, isBrowser ? {} : { transport: NodeHttpTransport() }));
};
