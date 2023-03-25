import {
  AdminServiceClient,
  CallOptions,
  Client,
  ClientReadableStream,
  ClientUnaryCall,
  getAdminClient,
  getInsecureClient,
  getSSLClient,
  HubServiceClient,
  Metadata,
  ServiceError,
} from '@farcaster/protobufs';
import { err, ok } from 'neverthrow';
import { HubError, HubErrorCode, HubResult } from './errors';

const fromServiceError = (err: ServiceError): HubError => {
  let context = err.details;
  if (err.code === 14 && err.details === 'No connection established') {
    context =
      'Connection failed: please check that the hub’s address, ports and authentication config are correct. ' + context;
  }
  return new HubError(err.metadata.get('errCode')[0] as HubErrorCode, context);
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
              return e; // TODO: improve stream error handling
            });

            resolve(ok(stream));
          });
        };
      }

      return func;
    },
  }) as unknown as PromisifiedClient<C>;
};

export type HubRpcClient = PromisifiedClient<HubServiceClient>;

export const getSSLHubRpcClient = (address: string): HubRpcClient => {
  return promisifyClient(getSSLClient(address));
};

export const getInsecureHubRpcClient = (address: string): HubRpcClient => {
  return promisifyClient(getInsecureClient(address));
};

export type AdminRpcClient = PromisifiedClient<AdminServiceClient>;

export const getAdminRpcClient = async (address: string): Promise<AdminRpcClient> => {
  return promisifyClient(await getAdminClient(address));
};

export const getAuthMetadata = (username: string, password: string): Metadata => {
  const metadata = new Metadata();
  metadata.set('authorization', `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`);
  return metadata;
};
