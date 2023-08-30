import {
  HubError,
  HubResult,
  HubServiceServer,
  Message,
  MessagesResponse,
  hexStringToBytes,
  reactionTypeFromJSON,
  sendUnaryData,
  userDataTypeFromJSON,
} from "@farcaster/hub-nodejs";
import fastify from "fastify";
import { Result, err, ok } from "neverthrow";
import { logger } from "../utils/logger.js";
import { PageOptions } from "storage/stores/types.js";
import { ServerUnaryCall } from "@grpc/grpc-js";
import { DeepPartial } from "storage/stores/store.js";

const log = logger.child({ component: "HttpAPIServer" });

// Some typescript type magic to automatically get types for the grpc methods
// so that we don't have to manually keep them in sync, and we get type checking

// For a function call like getCast(call: ServerUnaryCall<_>, response), this will extract the ServerUnaryCall<_> type
type FirstParameter<T> = T extends (arg1: infer U, ...args: unknown[]) => unknown ? U : never;

// For a method like getCast, this will extract the call type, e.g. ServerUnaryCall<CastId, Message>
type CallTypeForMethod<M extends keyof HubServiceServer> = FirstParameter<HubServiceServer[M]>;

// For a type like ServerUnaryCall<CastId, Message>, this will extract the CastId type
type FirstGenericType<T> = T extends ServerUnaryCall<infer U, unknown> ? U : never;

// For a method like getCast, this will extract the CastId type
type FirstTemplateParamType<M extends keyof HubServiceServer> = FirstGenericType<Parameters<HubServiceServer[M]>[0]>;

// Represents the static toJSON method of a protobuf message
type StaticEncodable<T> = {
  toJSON(message: T): unknown;
};

// Get the call Object for a given method
function getCallObject<M extends keyof HubServiceServer>(
  _method: M,
  params: DeepPartial<FirstTemplateParamType<M>>,
  request: fastify.FastifyRequest,
): CallTypeForMethod<M> {
  return {
    request: params,
    getPeer: () => request.ip,
  } as CallTypeForMethod<M>;
}

// Generic handler for grpc methods's responses
function handleResponse<M>(reply: fastify.FastifyReply, obj: StaticEncodable<M>): sendUnaryData<M> {
  return (err, response) => {
    if (err) {
      reply.code(400).send(JSON.stringify(err));
    } else {
      if (response) {
        reply.send(obj.toJSON(response));
      } else {
        reply.send(err);
      }
    }
  };
}

// Get a protobuf enum value from a string or number
function getProtobufType<T>(typeName: string, fn: (typeName: unknown) => T): T | undefined {
  const parsedTypeName = parseInt(typeName);
  return Result.fromThrowable(
    () => fn(isNaN(parsedTypeName) ? typeName : parsedTypeName),
    (e) => e,
  )().unwrapOr(undefined);
}

// Paging options that can be passed in as query parameters
type QueryPageParams = {
  pageSize?: number;
  pageToken?: string;
  reverse?: number | boolean;
};
function getPageOptions(query: QueryPageParams): PageOptions {
  // When passing in a page token, it's base64 encoded, so we need to decode it
  // however, the '+' character is not valid in a url, so it gets replaced with a space
  // and the base64 decoder doesn't like that, so we need to replace it with a '+' again
  // before decoding
  const pageToken = query.pageToken
    ? Uint8Array.from(Buffer.from(query.pageToken.replaceAll(" ", "+"), "base64"))
    : undefined;

  return {
    pageSize: query.pageSize ? parseInt(query.pageSize.toString()) : undefined,
    pageToken,
    reverse: query.reverse ? true : undefined,
  };
}

export class HttpAPIServer {
  grpcImpl: HubServiceServer;
  app = fastify();

  constructor(grpcImpl: HubServiceServer) {
    this.grpcImpl = grpcImpl;

    this.initHandlers();

    this.app.setErrorHandler((error, request, reply) => {
      log.error({ err: error, errMsg: error.message, request }, "Error in http request");
      reply.code(500).send({ error: error.message });
    });
  }

  initHandlers() {
    //================Casts================
    // /cast/:fid/:hash
    this.app.get<{ Params: { fid: string; hash: string } }>("/v1/cast/:fid/:hash", (request, reply) => {
      const { fid, hash } = request.params;

      const call = getCallObject(
        "getCast",
        { fid: parseInt(fid), hash: hexStringToBytes(hash)._unsafeUnwrap() },
        request,
      );

      this.grpcImpl.getCast(call, handleResponse(reply, Message));
    });

    this.app.get<{ Params: { fid: string }; Querystring: QueryPageParams }>("/v1/casts/:fid", (request, reply) => {
      const { fid } = request.params;
      const pageOptions = getPageOptions(request.query);

      const call = getCallObject("getAllCastMessagesByFid", { fid: parseInt(fid), ...pageOptions }, request);
      this.grpcImpl.getAllCastMessagesByFid(call, handleResponse(reply, MessagesResponse));
    });

    // /casts/parent/:fid/:hash
    this.app.get<{ Params: { fid: string; hash: string }; Querystring: QueryPageParams }>(
      "/v1/casts/parent/:fid/:hash",
      (request, reply) => {
        const { fid, hash } = request.params;
        const pageOptions = getPageOptions(request.query);

        const call = getCallObject(
          "getCastsByParent",
          {
            parentCastId: { fid: parseInt(fid), hash: hexStringToBytes(hash)._unsafeUnwrap() },
            ...pageOptions,
          },
          request,
        );

        this.grpcImpl.getCastsByParent(call, handleResponse(reply, MessagesResponse));
      },
    );

    // /casts/parent?url=...
    this.app.get<{ Querystring: QueryPageParams & { url: string } }>("/v1/casts/parent", (request, reply) => {
      const { url } = request.query;
      const pageOptions = getPageOptions(request.query);

      const decodedUrl = decodeURIComponent(url);
      const call = getCallObject("getCastsByParent", { parentUrl: decodedUrl, ...pageOptions }, request);
      this.grpcImpl.getCastsByParent(call, handleResponse(reply, MessagesResponse));
    });

    // /casts/mention/:fid
    this.app.get<{ Params: { fid: string }; Querystring: QueryPageParams }>(
      "/v1/casts/mention/:fid",
      (request, reply) => {
        const { fid } = request.params;
        const pageOptions = getPageOptions(request.query);

        const call = getCallObject("getCastsByMention", { fid: parseInt(fid), ...pageOptions }, request);
        this.grpcImpl.getCastsByMention(call, handleResponse(reply, MessagesResponse));
      },
    );

    //=================Reactions=================
    // /reactions/:fid/:target_fid/:target_hash?type=...
    this.app.get<{
      Params: { fid: string; target_fid: string; target_hash: string };
      Querystring: { reactionType: string };
    }>("/v1/reaction/:fid/:target_fid/:target_hash", (request, reply) => {
      const { fid, target_fid, target_hash } = request.params;

      const call = getCallObject(
        "getReaction",
        {
          fid: parseInt(fid),
          targetCastId: { fid: parseInt(target_fid), hash: hexStringToBytes(target_hash)._unsafeUnwrap() },
          reactionType: getProtobufType(request.query.reactionType, reactionTypeFromJSON) ?? 0,
        },
        request,
      );

      this.grpcImpl.getReaction(call, handleResponse(reply, Message));
    });

    // /reactions/:fid?type=...
    this.app.get<{ Params: { fid: string }; Querystring: { reactionType: string } & QueryPageParams }>(
      "/v1/reactions/:fid",
      (request, reply) => {
        const { fid } = request.params;
        const pageOptions = getPageOptions(request.query);

        const call = getCallObject(
          "getReactionsByFid",
          {
            fid: parseInt(fid),
            reactionType: getProtobufType(request.query.reactionType, reactionTypeFromJSON),
            ...pageOptions,
          },
          request,
        );

        this.grpcImpl.getReactionsByFid(call, handleResponse(reply, MessagesResponse));
      },
    );

    // /reactions/target/:target_fid/:target_hash?type=...
    this.app.get<{
      Params: { target_fid: string; target_hash: string };
      Querystring: { reactionType: string } & QueryPageParams;
    }>("/v1/reactions/target/:target_fid/:target_hash", (request, reply) => {
      const { target_fid, target_hash } = request.params;
      const pageOptions = getPageOptions(request.query);

      const call = getCallObject(
        "getReactionsByCast",
        {
          targetCastId: { fid: parseInt(target_fid), hash: hexStringToBytes(target_hash)._unsafeUnwrap() },
          reactionType: getProtobufType(request.query.reactionType, reactionTypeFromJSON),
          ...pageOptions,
        },
        request,
      );

      this.grpcImpl.getReactionsByCast(call, handleResponse(reply, MessagesResponse));
    });

    // /reactions/target?url=...&type=...
    this.app.get<{ Querystring: { url: string; reactionType: string } & QueryPageParams }>(
      "/v1/reactions/target",
      (request, reply) => {
        const { url } = request.query;
        const pageOptions = getPageOptions(request.query);

        const decodedUrl = decodeURIComponent(url);
        const call = getCallObject(
          "getReactionsByTarget",
          {
            targetUrl: decodedUrl,
            reactionType: getProtobufType(request.query.reactionType, reactionTypeFromJSON),
            ...pageOptions,
          },
          request,
        );

        this.grpcImpl.getReactionsByTarget(call, handleResponse(reply, MessagesResponse));
      },
    );

    //=================Links=================
    // /links/:fid/:target_fid?type=...
    this.app.get<{ Params: { fid: string; target_fid: string }; Querystring: { type: string } }>(
      "/v1/link/:fid/:target_fid",
      (request, reply) => {
        const { fid, target_fid } = request.params;

        const call = getCallObject(
          "getLink",
          {
            fid: parseInt(fid),
            targetFid: parseInt(target_fid),
            linkType: request.query.type,
          },
          request,
        );

        this.grpcImpl.getLink(call, handleResponse(reply, Message));
      },
    );

    // /links/:fid?type=...
    this.app.get<{ Params: { fid: string }; Querystring: { linkType: string } & QueryPageParams }>(
      "/v1/links/:fid",
      (request, reply) => {
        const { fid } = request.params;
        const pageOptions = getPageOptions(request.query);

        const call = getCallObject(
          "getLinksByFid",
          { fid: parseInt(fid), linkType: request.query.linkType, ...pageOptions },
          request,
        );

        this.grpcImpl.getLinksByFid(call, handleResponse(reply, MessagesResponse));
      },
    );

    // /links/target/:target_fid?type=...
    this.app.get<{ Params: { target_fid: string }; Querystring: { linkType: string } & QueryPageParams }>(
      "/v1/links/target/:target_fid",
      (request, reply) => {
        const { target_fid } = request.params;
        const pageOptions = getPageOptions(request.query);

        const call = getCallObject(
          "getLinksByTarget",
          { targetFid: parseInt(target_fid), linkType: request.query.linkType, ...pageOptions },
          request,
        );

        this.grpcImpl.getLinksByTarget(call, handleResponse(reply, MessagesResponse));
      },
    );

    //==============User Data================
    // /userdata/:fid?type=...
    this.app.get<{ Params: { fid: string }; Querystring: { type: string } & QueryPageParams }>(
      "/v1/userdata/:fid",
      (request, reply) => {
        const { fid } = request.params;
        const pageOptions = getPageOptions(request.query);
        const userDataType = getProtobufType(request.query.type, userDataTypeFromJSON);

        if (userDataType) {
          const call = getCallObject("getUserData", { fid: parseInt(fid), userDataType, ...pageOptions }, request);
          this.grpcImpl.getUserData(call, handleResponse(reply, Message));
        } else {
          const call = getCallObject("getUserDataByFid", { fid: parseInt(fid), ...pageOptions }, request);
          this.grpcImpl.getUserDataByFid(call, handleResponse(reply, MessagesResponse));
        }
      },
    );
  }

  async start(ip = "0.0.0.0", port = 0): Promise<HubResult<string>> {
    return new Promise((resolve) => {
      this.app.listen({ host: ip, port }, (e, address) => {
        if (e) {
          log.error({ err: e, errMsg: e.message }, "Failed to start http server");
          resolve(err(new HubError("unavailable.network_failure", `Failed to start http server: ${e.message}`)));
        }

        resolve(ok(address));
      });
    });
  }

  async stop() {
    await this.app.close();
  }
}
