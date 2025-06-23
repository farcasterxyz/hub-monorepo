import { HubServiceClient } from "./generated/rpc";
import { AdminServiceClient } from "./generated/admin_rpc";
import * as grpc from "@grpc/grpc-js";
import { Metadata } from "@grpc/grpc-js";
import type {
  CallOptions,
  Client,
  ClientDuplexStream,
  ClientReadableStream,
  ClientUnaryCall,
  ServiceError,
} from "@grpc/grpc-js";
import { err, ok } from "neverthrow";
import { HubError, HubErrorCode, HubResult } from "@farcaster/core";

const fromServiceError = (err: ServiceError): HubError => {
  let context = err.details;
  if (err.code === 14 && err.details === "No connection established") {
    context = `Connection failed: please check that the hub’s address, ports and authentication config are correct. ${context}`;
  }
  const hubErrorCode = err.metadata.get("errCode")[0] || err.metadata.get("x-err-code")[0];
  return new HubError(hubErrorCode as HubErrorCode, context);
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
  callback: (err: ServiceError | null, res?: U) => void,
) => ClientUnaryCall;

type OriginalStream<T, U> = (
  request: T,
  metadata?: Metadata,
  options?: Partial<CallOptions>,
) => ClientReadableStream<U>;

type OriginalDuplexStream<T, U> = (metadata?: Metadata, options?: Partial<CallOptions>) => ClientDuplexStream<T, U>;

type PromisifiedUnaryCall<T, U> = (
  request: T,
  metadata?: Metadata,
  options?: Partial<CallOptions>,
) => Promise<HubResult<U>>;

type PromisifiedStream<T, U> = (
  request: T,
  metadata?: Metadata,
  options?: Partial<CallOptions>,
) => Promise<HubResult<ClientReadableStream<U>>>;

type PromisifiedDuplexStream<T, U> = (
  metadata?: Metadata,
  options?: Partial<CallOptions>,
) => Promise<HubResult<ClientDuplexStream<T, U>>>;

type PromisifiedClient<C> = { $: C; close: () => void } & {
  [prop in Exclude<keyof C, keyof Client>]: C[prop] extends OriginalDuplexStream<infer T, infer U>
    ? PromisifiedDuplexStream<T, U>
    : C[prop] extends OriginalStream<infer T, infer U>
    ? PromisifiedStream<T, U>
    : C[prop] extends OriginalUnaryCall<infer T, infer U>
    ? PromisifiedUnaryCall<T, U>
    : never;
};

const promisifyClient = <C extends Client>(client: C) => {
  return new Proxy(client, {
    get: (target, descriptor) => {
      const key = descriptor as keyof PromisifiedClient<C>;

      if (key === "$") return target;

      if (key === "close") return () => target.close;

      const func = target[key];
      // biome-ignore lint/suspicious/noExplicitAny: any is needed here because of the grpc-js types
      if (typeof func === "function" && (func as any).responseStream === false) {
        return (...args: unknown[]) =>
          new Promise((resolve, _reject) =>
            func.call(
              target,
              ...[
                ...args,
                (e: unknown, res: unknown) =>
                  e ? resolve(err(fromServiceError(e as ServiceError))) : resolve(ok(res)),
              ],
            ),
          );
      }

      // biome-ignore lint/suspicious/noExplicitAny: any is needed here because of the grpc-js types
      if (typeof func === "function" && (func as any).responseStream === true) {
        return (...args: unknown[]) => {
          return new Promise((resolve) => {
            const stream = func.call(target, ...args);

            stream.on("error", (e: unknown) => {
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

export const getSSLHubRpcClient = (address: string, options?: Partial<grpc.ClientOptions>): HubRpcClient => {
  return promisifyClient(getSSLClient(address, options));
};

export const getInsecureHubRpcClient = (address: string, options?: Partial<grpc.ClientOptions>): HubRpcClient => {
  return promisifyClient(getInsecureClient(address, options));
};

export type AdminRpcClient = PromisifiedClient<AdminServiceClient>;

export const getAdminRpcClient = async (address: string): Promise<AdminRpcClient> => {
  return promisifyClient(getAdminClient(address));
};

export const getAuthMetadata = (username: string, password: string): Metadata => {
  const metadata = new Metadata();
  metadata.set("authorization", `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`);
  return metadata;
};

export const getServer = (): grpc.Server => {
  // Set up timeouts for keepalive. This will cause the server to send keepalive message every 10 seconds,
  // and close the connection if the client does not respond within 5 seconds.
  // TODO: We should also consider setting up max_connection_age_ms.
  // max_connection_age_ms will interfere with subscribe() which is a long-lived call, but maybe we should
  // set it anyway.
  const server = new grpc.Server({
    "grpc.keepalive_time_ms": 10 * 1000,
    "grpc.keepalive_timeout_ms": 5 * 1000,
    "grpc.client_idle_timeout_ms": 60 * 1000,
  });

  return server;
};

export const getSSLClient = (address: string, options?: Partial<grpc.ClientOptions>): HubServiceClient => {
  if (!address) throw new Error("Hub address not specified");
  return new HubServiceClient(address, grpc.credentials.createSsl(), { ...options });
};

export const getInsecureClient = (address: string, options?: Partial<grpc.ClientOptions>): HubServiceClient => {
  if (!address) throw new Error("Hub address not specified");
  return new HubServiceClient(address, grpc.credentials.createInsecure(), { ...options });
};

export const getAdminClient = (address: string, options?: Partial<grpc.ClientOptions>): AdminServiceClient => {
  if (!address) throw new Error("Hub address not specified");
  return new AdminServiceClient(address, grpc.credentials.createInsecure(), { ...options });
};

export function createDefaultMetadataKeyInterceptor(key: string, value: string) {
  return function metadataKeyInterceptor(options: grpc.InterceptorOptions, nextCall: grpc.NextCall) {
    const requester = {
      start: function (
        metadata: grpc.Metadata,
        listener: grpc.Listener,
        next: (metadata: grpc.Metadata, listener: grpc.Listener) => void,
      ) {
        if (metadata.get(key).length === 0) {
          metadata.set(key, value);
        }
        next(metadata, listener);
      },
    };
    return new grpc.InterceptingCall(nextCall(options), requester);
  };
}
