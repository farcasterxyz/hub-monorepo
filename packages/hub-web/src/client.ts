import { HubService, HubServiceClientImpl, GrpcWebError, GrpcWebImpl } from './generated/rpc';
import { NodeHttpTransport } from '@improbable-eng/grpc-web-node-http-transport';

import { grpc } from '@improbable-eng/grpc-web';
import { err, ok } from 'neverthrow';
import { HubError, HubErrorCode, HubResult } from '@farcaster/utils';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

const fromServiceError = (err: GrpcWebError): HubError => {
  let context = err['message'];
  if (err.code === 14 && context === 'No connection established') {
    context =
      'Connection failed: please check that the hub’s address, ports and authentication config are correct. ' + context;
    return new HubError('unavailable' as HubErrorCode, context);
  }

  // TODO: grpc error code to HubErrorCode
  return new HubError('unknown' as HubErrorCode, context);
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

export type RpcWebClient = WrappedClient<HubService>;

export const getRpcWebClient = (url: string, isBrowser = true): WrappedClient<HubService> => {
  return wrapClient(
    new HubServiceClientImpl(new GrpcWebImpl(url, isBrowser ? {} : { transport: NodeHttpTransport() }))
  );
};
