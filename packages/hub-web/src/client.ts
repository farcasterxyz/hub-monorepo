import { HubService, HubServiceClientImpl, GrpcWebError, GrpcWebImpl } from "./generated/rpc";

import { AdminService, AdminServiceClientImpl } from "./generated/admin_rpc";

import grpcWeb from "@improbable-eng/grpc-web";
import { err, ok } from "neverthrow";
import { HubError, HubErrorCode, HubResult } from "@farcaster/core";
import { Observable } from "rxjs";

export { Observable } from "rxjs";

const grpcCodeToHubErrorCode = (code: grpcWeb.grpc.Code): HubErrorCode => {
  switch (code) {
    case grpcWeb.grpc.Code.Unauthenticated:
      return "unauthenticated";
    case grpcWeb.grpc.Code.PermissionDenied:
      return "unauthorized";
    case grpcWeb.grpc.Code.InvalidArgument:
      return "bad_request";
    case grpcWeb.grpc.Code.NotFound:
      return "not_found";
    case grpcWeb.grpc.Code.Unavailable:
      return "unavailable";
    default:
      return "unknown";
  }
};

const fromServiceError = (err: GrpcWebError): HubError => {
  let context = err["message"];

  // due to envoy, the error for no connection is Response closed without headers
  if (err.code === 2 && context === "Response closed without headers") {
    context = `Connection failed: please check that the hub’s address, ports and authentication config are correct. ${context}`;
    return new HubError("unavailable" as HubErrorCode, context);
  }

  // derive from grpc error code as fallback
  return new HubError((err.metadata?.get("errcode")[0] as HubErrorCode) || grpcCodeToHubErrorCode(err.code), context);
};

// wrap grpc-web client with HubResult to make sure APIs are consistent with hub-nodejs
type OriginalUnaryCall<T, U> = (request: T, metadata?: grpcWeb.grpc.Metadata) => Promise<U>;

type WrappedUnaryCall<T, U> = (request: T, metadata?: grpcWeb.grpc.Metadata) => Promise<HubResult<U>>;

type OriginalStream<T, U> = (request: T, metadata?: grpcWeb.grpc.Metadata) => Observable<U>;

type WrappedStream<T, U> = (request: T, metadata?: grpcWeb.grpc.Metadata) => HubResult<Observable<U>>;

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

      if (key === "$") return target;

      const func = target[key];
      if (typeof func === "function") {
        return (...args: unknown[]) => {
          const result = func.call(target, ...args);
          if (result instanceof Promise) {
            // biome-ignore lint/suspicious/noExplicitAny: legacy from eslint migration
            return (result as Promise<any>).then(
              (res) => ok(res),
              (e) => err(fromServiceError(e as GrpcWebError)),
            );
          }

          return ok(result);
        };
      }
      return func;
    },
  }) as unknown as WrappedClient<C>;
};

export type HubRpcClient = WrappedClient<HubService>;

export const getHubRpcClient = (...args: Parameters<typeof getRpcWebClient>): HubRpcClient => {
  return wrapClient(new HubServiceClientImpl(getRpcWebClient(...args)));
};

export type AdminRpcClient = WrappedClient<AdminService>;

export const getAdminRpcClient = (...args: Parameters<typeof getRpcWebClient>): AdminRpcClient => {
  return wrapClient(new AdminServiceClientImpl(getRpcWebClient(...args)));
};

const getRpcWebClient = (...args: ConstructorParameters<typeof GrpcWebImpl>): GrpcWebImpl => {
  return new GrpcWebImpl(...args);
};

export const getAuthMetadata = (username: string, password: string): grpcWeb.grpc.Metadata => {
  const metadata = new grpcWeb.grpc.Metadata();
  if (typeof btoa === "undefined") {
    // nodejs
    metadata.set("authorization", `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`);
  } else {
    // browser
    metadata.set("authorization", `Basic ${btoa(`${username}:${password}`)}`);
  }
  return metadata;
};
