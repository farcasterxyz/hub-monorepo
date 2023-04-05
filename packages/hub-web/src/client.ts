import {
  HubService,
  HubServiceClientImpl,
  GrpcWebError,
  GrpcWebImpl,
  AdminService,
  AdminServiceClientImpl,
} from './generated/rpc';
import { NodeHttpTransport } from '@improbable-eng/grpc-web-node-http-transport';

import { grpc } from '@improbable-eng/grpc-web';
import { err, ok } from 'neverthrow';
import { HubError, HubErrorCode, HubResult } from '@farcaster/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const Code = grpc.Code;
export const Metadata = grpc.Metadata;
export type { Observable } from 'rxjs';

const fromServiceError = (err: GrpcWebError): HubError => {
  let context = err['message'];

  if (err.code === 14 && context === 'No connection established') {
    context =
      'Connection failed: please check that the hub’s address, ports and authentication config are correct. ' + context;
    return new HubError('unavailable' as HubErrorCode, context);
  }

  return new HubError(err.metadata.get('errcode')[0] as HubErrorCode, context);
};

// wrap grpc-web client with HubResult to make sure APIs are consistent with hub-nodejs
type OriginalUnaryCall<T, U> = (request: T, metadata?: grpc.Metadata) => Promise<U>;

type WrappedUnaryCall<T, U> = (request: T, metadata?: grpc.Metadata) => Promise<HubResult<U>>;

type OriginalStream<T, U> = (request: T, metadata?: grpc.Metadata) => Observable<U>;

type WrappedStream<T, U> = (request: T, metadata?: grpc.Metadata) => Promise<HubResult<Observable<U>>>;

type WrappedClient<C> = { $: C } & {
  [prop in keyof C]: C[prop] extends OriginalUnaryCall<infer T, infer U>
    ? WrappedUnaryCall<T, U>
    : C[prop] extends OriginalStream<infer T, infer U>
    ? WrappedStream<T, U>
    : never;
};

const wrapClient = <C extends object>(client: C) => {
  return new Proxy(client, {
    get: (target, descriptor) => {
      const key = descriptor as keyof WrappedClient<C>;

      if (key === '$') return target;

      // eslint-disable-next-line security/detect-object-injection
      const func = target[key];
      if (typeof func === 'function') {
        return (...args: unknown[]) => {
          let result = func.call(target, ...args);
          if (result instanceof Promise) {
            return (result as Promise<any>).then(
              (res) => ok(res),
              (e) => err(fromServiceError(e as GrpcWebError))
            );
          }

          if (result instanceof Observable) {
            result = result.pipe(
              catchError((e, _caught) => {
                // TODO: investigate error handling
                return of(err(e));
              })
            );
            return ok(result);
          }
          return ok(result);
        };
      }
      return func;
    },
  }) as unknown as WrappedClient<C>;
};

export type HubRpcClient = WrappedClient<HubService>;

export const getHubRpcClient = (url: string, isBrowser = true): HubRpcClient => {
  return wrapClient(new HubServiceClientImpl(getRpcWebClient(url, isBrowser)));
};

export type AdminRpcClient = WrappedClient<AdminService>;

export const getAdminRpcClient = (url: string, isBrowser = true): AdminRpcClient => {
  return wrapClient(new AdminServiceClientImpl(getRpcWebClient(url, isBrowser)));
};

const getRpcWebClient = (address: string, isBrowser = true): GrpcWebImpl => {
  return new GrpcWebImpl(address, isBrowser ? {} : { transport: NodeHttpTransport() });
};

export const getAuthMetadata = (username: string, password: string): grpc.Metadata => {
  const metadata = new grpc.Metadata();
  if (typeof btoa === 'undefined') {
    // nodejs
    metadata.set('authorization', `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`);
  } else {
    // browswer
    metadata.set('authorization', `Basic ${btoa(`${username}:${password}`)}`);
  }
  return metadata;
};
