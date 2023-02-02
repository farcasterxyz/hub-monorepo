import {
  CallOptions,
  Client,
  ClientReadableStream,
  ClientUnaryCall,
  getClient,
  HubServiceClient,
  Metadata,
  ServiceError,
} from '@farcaster/grpc';
import { err, ok } from 'neverthrow';
import { HubError, HubErrorCode, HubResult } from './errors';

const fromServiceError = (err: ServiceError): HubError => {
  return new HubError(err.metadata.get('errCode')[0] as HubErrorCode, err.details);
};

// grpc-js generates a Client stub that uses callbacks for async calls. Callbacks are
// not very easy to use, and make writing tests harder, so we wrap the client in a
// Proxy that returns Promises instead of callbacks. By Using a Proxy, we can keep the
// same API as the original client, and we can also keep the same type definitions,
// which ensures type safety.

type OriginalUnaryCall<T, U> = (
  request: T,
  metadata: Metadata,
  options: Partial<CallOptions>,
  callback: (err: ServiceError | null, res?: U) => void
) => ClientUnaryCall;

type OriginalStream<T, U> = (
  request: T,
  metadata?: Metadata,
  options?: Partial<CallOptions>
) => ClientReadableStream<U>;

type PromisifiedUnaryCall<T, U> = (
  request: T,
  metadata?: Metadata,
  options?: Partial<CallOptions>
) => Promise<HubResult<U>>;

type PromisifiedStream<T, U> = (
  request: T,
  metadata?: Metadata,
  options?: Partial<CallOptions>
) => Promise<HubResult<ClientReadableStream<U>>>;

type PromisifiedClient<C> = { $: C } & {
  [prop in Exclude<keyof C, keyof Client>]: C[prop] extends OriginalStream<infer T, infer U>
    ? PromisifiedStream<T, U>
    : C[prop] extends OriginalUnaryCall<infer T, infer U>
    ? PromisifiedUnaryCall<T, U>
    : never;
};

const promisifyClient = <C extends Client>(client: C) => {
  return new Proxy(client, {
    get: (target, descriptor) => {
      const key = descriptor as keyof PromisifiedClient<C>;

      if (key === '$') return target;

      // eslint-disable-next-line security/detect-object-injection
      const func = target[key];
      if (typeof func === 'function' && (func as any).responseStream === false) {
        return (...args: unknown[]) =>
          new Promise((resolve, _reject) =>
            func.call(
              target,
              ...[
                ...args,
                (e: unknown, res: unknown) =>
                  e ? resolve(err(fromServiceError(e as ServiceError))) : resolve(ok(res)),
              ]
            )
          );
      }

      if (typeof func === 'function' && (func as any).responseStream === true) {
        return (...args: unknown[]) => {
          return new Promise((resolve) => {
            const stream = func.call(target, ...args);

            stream.on('error', (e: unknown) => {
              return e; // Suppress exceptions
            });

            const timeout = setTimeout(() => {
              stream.cancel(); // Cancel if not connected within timeout
              resolve(err(new HubError('unavailable.network_failure', 'subscribe timed out')));
            }, 1_000);

            stream.on('metadata', (metadata: Metadata) => {
              clearTimeout(timeout);
              if (metadata.get('status')[0] === 'ready') {
                resolve(ok(stream));
              } else {
                resolve(err(new HubError('unavailable.network_failure', 'subscribe failed')));
              }
            });
          });
        };
      }

      return func;
    },
  }) as unknown as PromisifiedClient<C>;
};

export type HubRpcClient = PromisifiedClient<HubServiceClient>;

export const getHubRpcClient = (address: string): HubRpcClient => {
  return promisifyClient(getClient(address));
};
