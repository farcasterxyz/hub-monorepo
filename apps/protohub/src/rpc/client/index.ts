import {
  CallOptions,
  Client,
  ClientUnaryCall,
  getClient,
  HubServiceClient,
  Metadata,
  ServiceError,
} from '@farcaster/protobufs';
import { HubError, HubErrorCode, HubResult } from '@farcaster/protoutils';
import { err, ok } from 'neverthrow';

const fromServiceError = (err: ServiceError): HubError => {
  return new HubError(err.metadata.get('errCode')[0] as HubErrorCode, err.details);
};

// grpc-js generates a Client stub that uses callbacks for async calls. Callbacks are
// not very easy to use, and make writing tests harder, so we wrap the client in a
// Proxy that returns Promises instead of callbacks. By Using a Proxy, we can keep the
// same API as the original client, and we can also keep the same type definitions,
// which ensures type safety.

type OriginalCall<T, U> = (
  request: T,
  metadata: Metadata,
  options: Partial<CallOptions>,
  callback: (err: ServiceError | null, res?: U) => void
) => ClientUnaryCall;

type PromisifiedCall<T, U> = (request: T, metadata?: Metadata, options?: Partial<CallOptions>) => Promise<HubResult<U>>;

export type PromisifiedClient<C> = { $: C } & {
  [prop in Exclude<keyof C, keyof Client>]: C[prop] extends OriginalCall<infer T, infer U>
    ? PromisifiedCall<T, U>
    : never;
};

// eslint-disable-next-line prefer-arrow-functions/prefer-arrow-functions
export function promisifyClient<C extends Client>(client: C) {
  return new Proxy(client, {
    get: (target, descriptor) => {
      const key = descriptor as keyof PromisifiedClient<C>;

      if (key === '$') return target;

      const func = target[key];
      if (typeof func === 'function') {
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

      return func;
    },
  }) as unknown as PromisifiedClient<C>;
}

export type HubRpcClient = PromisifiedClient<HubServiceClient>;

export const getHubRpcClient = (address: string): HubRpcClient => {
  return promisifyClient(getClient(address));
};
