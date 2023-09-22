import {
  HubError,
  HubEvent,
  HubResult,
  HubServiceServer,
  Message,
  MessagesResponse,
  OnChainEvent,
  OnChainEventResponse,
  StorageLimitsResponse,
  UserNameProof,
  UsernameProofsResponse,
  bytesToHexString,
  hexStringToBytes,
  onChainEventTypeFromJSON,
  reactionTypeFromJSON,
  sendUnaryData,
  userDataTypeFromJSON,
  utf8StringToBytes,
} from "@farcaster/hub-nodejs";
import { Metadata, ServerUnaryCall } from "@grpc/grpc-js";
import fastify from "fastify";
import { Result, err, ok } from "neverthrow";
import { logger } from "../utils/logger.js";
import { PageOptions } from "../storage/stores/types.js";
import { DeepPartial } from "../storage/stores/store.js";
import Engine from "../storage/engine/index.js";

const log = logger.child({ component: "HttpAPIServer" });

// Some typescript type magic to automatically get types for the grpc methods
// so that we don't have to manually keep them in sync, and we get type checking

// For a function call like getCast(call: ServerUnaryCall<_>, response), this will extract the ServerUnaryCall<_> type
type FirstParameter<T> = T extends (arg1: infer U, ...args: unknown[]) => unknown ? U : never;

// For a string like "getCast", this will extract the call type, e.g. ServerUnaryCall<CastId, Message>
type CallTypeForMethod<M extends keyof HubServiceServer> = FirstParameter<HubServiceServer[M]>;

// For a type like ServerUnaryCall<CastId, Message>, this will extract the CastId type
type FirstGenericType<T> = T extends ServerUnaryCall<infer U, unknown> ? U : never;

// For a string like "getCast", this will extract the CastId type
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
  metadata?: Metadata,
): CallTypeForMethod<M> {
  return {
    request: params,
    metadata,
    getPeer: () => request.ip,
  } as CallTypeForMethod<M>;
}

// Generic handler for grpc methods's responses
function handleResponse<M>(reply: fastify.FastifyReply, obj: StaticEncodable<M>): sendUnaryData<M> {
  return (err, response) => {
    if (err) {
      reply.code(400).type("application/json").send(JSON.stringify(err));
    } else {
      if (response) {
        // Convert the protobuf object to JSON
        const json = protoToJSON(response, obj);
        reply.send(json);
      } else {
        reply.send(err);
      }
    }
  };
}

function convertB64ToHex(str: string): string {
  try {
    // Try to convert the string from base64 to hex
    const bytesBuf = Buffer.from(str, "base64");

    // Check if the decoded base64 string can be converted back to the original base64 string
    // If it can, return the hex string, otherwise return the original string
    return bytesBuf.toString("base64") === str ? bytesToHexString(bytesBuf).unwrapOr("") : str;
  } catch {
    // If an error occurs, return the original string
    return str;
  }
}

/**
 * The protobuf format specifies encoding bytes as base64 strings, but we want to return hex strings
 * to be consistent with the rest of the API, so we need to convert the base64 strings to hex strings
 * before returning them.
 */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function transformHash(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // These are the target keys that are base64 encoded, which should be converted to hex
  const toHexKeys = [
    "hash",
    "address",
    "signer",
    "blockHash",
    "transactionHash",
    "key",
    "owner",
    "to",
    "from",
    "recoveryAddress",
  ];

  // Convert these target keys to strings
  const toStringKeys = ["name"];

  for (const key in obj) {
    // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
    if (obj.hasOwnProperty(key)) {
      if (toHexKeys.includes(key) && typeof obj[key] === "string") {
        obj[key] = convertB64ToHex(obj[key]);
      } else if (toStringKeys.includes(key) && typeof obj[key] === "string") {
        obj[key] = Buffer.from(obj[key], "base64").toString("utf-8");
      } else if (typeof obj[key] === "object") {
        transformHash(obj[key]);
      }
    }
  }

  return obj;
}

// Generic function to convert protobuf objects to JSON
export function protoToJSON<T>(message: T, obj: StaticEncodable<T>): unknown {
  return transformHash(obj.toJSON(message));
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
  engine: Engine;

  app = fastify();

  constructor(grpcImpl: HubServiceServer, engine: Engine) {
    this.grpcImpl = grpcImpl;
    this.engine = engine;

    // Handle binary data
    this.app.addContentTypeParser("application/octet-stream", { parseAs: "buffer" }, function (req, body, done) {
      done(null, body);
    });

    this.app.setErrorHandler((error, request, reply) => {
      log.error({ err: error, errMsg: error.message, request }, "Error in http request");
      reply.code(500).send({ error: error.message });
    });

    this.initHandlers();
  }

  getMetadataFromAuthString(authString: string | undefined): Metadata {
    const metadata = new Metadata();
    if (authString) {
      metadata.add("authorization", authString);
    }

    return metadata;
  }

  initHandlers() {
    //================Casts================
    // @doc-tag: /castById?fid=...&hash=...
    this.app.get<{ Querystring: { fid: string; hash: string } }>("/v1/castById", (request, reply) => {
      const { fid, hash } = request.query;

      const call = getCallObject("getCast", { fid: parseInt(fid), hash: hexStringToBytes(hash).unwrapOr([]) }, request);

      this.grpcImpl.getCast(call, handleResponse(reply, Message));
    });

    // @doc-tag: /castsByFid?fid=...
    this.app.get<{ Querystring: QueryPageParams & { fid: string } }>("/v1/castsByFid", (request, reply) => {
      const { fid } = request.query;
      const pageOptions = getPageOptions(request.query);

      const call = getCallObject("getAllCastMessagesByFid", { fid: parseInt(fid), ...pageOptions }, request);
      this.grpcImpl.getAllCastMessagesByFid(call, handleResponse(reply, MessagesResponse));
    });

    // @doc-tag: /castsByParent?fid=...&hash=...
    // @doc-tag: /castsByParent?url=...
    this.app.get<{ Querystring: QueryPageParams & { fid: string; hash: string; url: string } }>(
      "/v1/castsByParent",
      (request, reply) => {
        const { fid, hash, url } = request.query;
        const decodedUrl = decodeURIComponent(url);
        const pageOptions = getPageOptions(request.query);

        let parentCastId = undefined;
        if (fid && hash) {
          parentCastId = { fid: parseInt(fid), hash: hexStringToBytes(hash).unwrapOr([]) };
        }

        const call = getCallObject(
          "getCastsByParent",
          { parentUrl: decodedUrl, parentCastId, ...pageOptions },
          request,
        );
        this.grpcImpl.getCastsByParent(call, handleResponse(reply, MessagesResponse));
      },
    );

    // @doc-tag: /castsByMention?fid=...
    this.app.get<{ Querystring: QueryPageParams & { fid: string } }>("/v1/castsByMention", (request, reply) => {
      const { fid } = request.query;
      const pageOptions = getPageOptions(request.query);

      const call = getCallObject("getCastsByMention", { fid: parseInt(fid), ...pageOptions }, request);
      this.grpcImpl.getCastsByMention(call, handleResponse(reply, MessagesResponse));
    });

    //=================Reactions=================
    // @doc-tag: /reactionById?fid=...&target_fid=...&target_hash=...&reaction_type=...
    this.app.get<{
      Querystring: { reaction_type: string; fid: string; target_fid: string; target_hash: string };
    }>("/v1/reactionById", (request, reply) => {
      const { fid, target_fid, target_hash } = request.query;

      const call = getCallObject(
        "getReaction",
        {
          fid: parseInt(fid),
          targetCastId: { fid: parseInt(target_fid), hash: hexStringToBytes(target_hash).unwrapOr([]) },
          reactionType: getProtobufType(request.query.reaction_type, reactionTypeFromJSON) ?? 0,
        },
        request,
      );

      this.grpcImpl.getReaction(call, handleResponse(reply, Message));
    });

    // @doc-tag: /reactionsByFid?fid=...&reaction_type=...
    this.app.get<{ Querystring: { reaction_type: string; fid: string } & QueryPageParams }>(
      "/v1/reactionsByFid",
      (request, reply) => {
        const { fid } = request.query;
        const pageOptions = getPageOptions(request.query);

        const call = getCallObject(
          "getReactionsByFid",
          {
            fid: parseInt(fid),
            reactionType: getProtobufType(request.query.reaction_type, reactionTypeFromJSON),
            ...pageOptions,
          },
          request,
        );

        this.grpcImpl.getReactionsByFid(call, handleResponse(reply, MessagesResponse));
      },
    );

    // @doc-tag: /reactionsByCast?target_fid=...&target_hash=...&reaction_type=...
    this.app.get<{
      Querystring: { target_fid: string; target_hash: string; reaction_type: string } & QueryPageParams;
    }>("/v1/reactionsByCast", (request, reply) => {
      const { target_fid, target_hash } = request.query;
      const pageOptions = getPageOptions(request.query);

      const call = getCallObject(
        "getReactionsByCast",
        {
          targetCastId: { fid: parseInt(target_fid), hash: hexStringToBytes(target_hash).unwrapOr([]) },
          reactionType: getProtobufType(request.query.reaction_type, reactionTypeFromJSON),
          ...pageOptions,
        },
        request,
      );

      this.grpcImpl.getReactionsByCast(call, handleResponse(reply, MessagesResponse));
    });

    // @doc-tag: /reactionsByTarget?url=...&reaction_type=...
    this.app.get<{ Querystring: { url: string; reaction_type: string } & QueryPageParams }>(
      "/v1/reactionsByTarget",
      (request, reply) => {
        const { url } = request.query;
        const pageOptions = getPageOptions(request.query);

        const decodedUrl = decodeURIComponent(url);
        const call = getCallObject(
          "getReactionsByTarget",
          {
            targetUrl: decodedUrl,
            reactionType: getProtobufType(request.query.reaction_type, reactionTypeFromJSON),
            ...pageOptions,
          },
          request,
        );

        this.grpcImpl.getReactionsByTarget(call, handleResponse(reply, MessagesResponse));
      },
    );

    //=================Links=================
    // @doc-tag: /linkById?fid=...&target_fid=...&link_type=...
    this.app.get<{ Querystring: { link_type: string; fid: string; target_fid: string } }>(
      "/v1/linkById",
      (request, reply) => {
        const { fid, target_fid } = request.query;

        const call = getCallObject(
          "getLink",
          {
            fid: parseInt(fid),
            targetFid: parseInt(target_fid),
            linkType: request.query.link_type,
          },
          request,
        );

        this.grpcImpl.getLink(call, handleResponse(reply, Message));
      },
    );

    // @doc-tag: /linksByFid?fid=...&link_type=...
    this.app.get<{ Querystring: { link_type: string; fid: string } & QueryPageParams }>(
      "/v1/linksByFid",
      (request, reply) => {
        const { fid } = request.query;
        const pageOptions = getPageOptions(request.query);

        const call = getCallObject(
          "getLinksByFid",
          { fid: parseInt(fid), linkType: request.query.link_type, ...pageOptions },
          request,
        );

        this.grpcImpl.getLinksByFid(call, handleResponse(reply, MessagesResponse));
      },
    );

    // @doc-tag: /linksByTargetFid?target_fid=...&link_type=...
    this.app.get<{ Params: {}; Querystring: { link_type: string; target_fid: string } & QueryPageParams }>(
      "/v1/linksByTargetFid",
      (request, reply) => {
        const { target_fid } = request.query;
        const pageOptions = getPageOptions(request.query);

        const call = getCallObject(
          "getLinksByTarget",
          { targetFid: parseInt(target_fid), linkType: request.query.link_type, ...pageOptions },
          request,
        );

        this.grpcImpl.getLinksByTarget(call, handleResponse(reply, MessagesResponse));
      },
    );

    //==============User Data================
    // @doc-tag: /userDataByFid?fid=...&user_data_type=...
    this.app.get<{ Querystring: { fid: string; user_data_type: string } & QueryPageParams }>(
      "/v1/userDataByFid",
      (request, reply) => {
        const { fid } = request.query;
        const pageOptions = getPageOptions(request.query);
        const userDataType = getProtobufType(request.query.user_data_type, userDataTypeFromJSON);

        if (userDataType) {
          const call = getCallObject("getUserData", { fid: parseInt(fid), userDataType, ...pageOptions }, request);
          this.grpcImpl.getUserData(call, handleResponse(reply, Message));
        } else {
          const call = getCallObject("getUserDataByFid", { fid: parseInt(fid), ...pageOptions }, request);
          this.grpcImpl.getUserDataByFid(call, handleResponse(reply, MessagesResponse));
        }
      },
    );

    //=================Storage API================
    // @doc-tag: /storageLimitsByFid?fid=...
    this.app.get<{ Querystring: { fid: string } }>("/v1/storageLimitsByFid", (request, reply) => {
      const { fid } = request.query;

      const call = getCallObject("getCurrentStorageLimitsByFid", { fid: parseInt(fid) }, request);
      this.grpcImpl.getCurrentStorageLimitsByFid(call, handleResponse(reply, StorageLimitsResponse));
    });

    //===============Username Proofs=================
    // @doc-tag: /userNameProofByName?name=...
    this.app.get<{ Querystring: { name: string } }>("/v1/userNameProofByName", (request, reply) => {
      const { name } = request.query;

      const fnameBytes = utf8StringToBytes(name).unwrapOr(new Uint8Array());

      const call = getCallObject("getUsernameProof", { name: fnameBytes }, request);
      this.grpcImpl.getUsernameProof(call, handleResponse(reply, UserNameProof));
    });

    // @doc-tag: /usernameproofsByFid?fid=...
    this.app.get<{ Querystring: { fid: string } }>("/v1/usernameproofsByFid", (request, reply) => {
      const { fid } = request.query;

      const call = getCallObject("getUserNameProofsByFid", { fid: parseInt(fid) }, request);
      this.grpcImpl.getUserNameProofsByFid(call, handleResponse(reply, UsernameProofsResponse));
    });

    //=============Verifications================
    // @doc-tag: /verificationsByFid?fid=...&address=...
    this.app.get<{ Querystring: { fid: string; address: string } }>("/v1/verificationsByFid", (request, reply) => {
      const { fid, address } = request.query;

      if (address) {
        const call = getCallObject(
          "getVerification",
          { fid: parseInt(fid), address: hexStringToBytes(address).unwrapOr(new Uint8Array()) },
          request,
        );
        this.grpcImpl.getVerification(call, handleResponse(reply, Message));
      } else {
        const call = getCallObject("getVerificationsByFid", { fid: parseInt(fid) }, request);
        this.grpcImpl.getVerificationsByFid(call, handleResponse(reply, MessagesResponse));
      }
    });

    //================On Chain Events================
    // @doc-tag: /onChainSignersByFid?fid=...&signer=...
    this.app.get<{ Querystring: { signer: string; fid: string } & QueryPageParams }>(
      "/v1/onChainSignersByFid",
      (request, reply) => {
        const { fid, signer } = request.query;

        if (signer) {
          const call = getCallObject(
            "getOnChainSigner",
            { fid: parseInt(fid), signer: hexStringToBytes(signer).unwrapOr(new Uint8Array()) },
            request,
          );
          this.grpcImpl.getOnChainSigner(call, handleResponse(reply, OnChainEvent));
        } else {
          const pageOptions = getPageOptions(request.query);
          const call = getCallObject("getOnChainSignersByFid", { fid: parseInt(fid), ...pageOptions }, request);
          this.grpcImpl.getOnChainSignersByFid(call, handleResponse(reply, OnChainEventResponse));
        }
      },
    );

    // @doc-tag /onChainEventsByFid?fid=...&event_type=...
    this.app.get<{ Querystring: { fid: string; event_type: string } & QueryPageParams }>(
      "/v1/onChainEventsByFid",
      (request, reply) => {
        const { fid } = request.query;
        const pageOptions = getPageOptions(request.query);
        const eventType = getProtobufType(request.query.event_type, onChainEventTypeFromJSON) ?? 0;

        const call = getCallObject("getOnChainEvents", { fid: parseInt(fid), eventType, ...pageOptions }, request);
        this.grpcImpl.getOnChainEvents(call, handleResponse(reply, OnChainEventResponse));
      },
    );

    // @doc-tag /onChainIdRegistryEventByAddress?address=...
    this.app.get<{ Querystring: { address: string } }>("/v1/onChainIdRegistryEventByAddress", (request, reply) => {
      const { address } = request.query;

      const call = getCallObject(
        "getIdRegistryOnChainEventByAddress",
        { address: hexStringToBytes(address).unwrapOr(new Uint8Array()) },
        request,
      );
      this.grpcImpl.getIdRegistryOnChainEventByAddress(call, handleResponse(reply, OnChainEvent));
    });

    //==================Submit Message==================
    // @doc-tag: /submitMessage
    this.app.post<{ Body: Buffer }>("/v1/submitMessage", (request, reply) => {
      // Get the Body content-type
      const contentType = request.headers["content-type"] as string;

      let message;
      if (contentType === "application/octet-stream") {
        // The Posted Body is a serialized Message protobuf
        const parsedMessage = Result.fromThrowable(
          () => Message.decode(request.body),
          (e) => e as Error,
        )();

        if (parsedMessage.isErr()) {
          reply.code(400).send({
            error:
              "Could not parse Message. This API accepts only Message protobufs encoded into bytes (application/octet-stream)",
            errorDetail: parsedMessage.error.message,
          });
          return;
        } else {
          message = parsedMessage.value;
        }
      } else {
        reply.code(400).send({
          error: "Unsupported Media Type",
          errorDetail: `Content-Type ${contentType} is not supported`,
        });
        return;
      }

      // Grab and forward any authorization headers
      const metadata = this.getMetadataFromAuthString(request?.headers?.authorization);
      const call = getCallObject("submitMessage", message, request, metadata);
      this.grpcImpl.submitMessage(call, handleResponse(reply, Message));
    });

    //==================Events==================
    // @doc-tag: /eventById?event_id=...
    this.app.get<{ Querystring: { event_id: string } }>("/v1/eventById", (request, reply) => {
      const { event_id: id } = request.query;

      const call = getCallObject("getEvent", { id: parseInt(id) }, request);
      this.grpcImpl.getEvent(call, handleResponse(reply, HubEvent));
    });

    // @doc-tag /events?from_event_id=...
    this.app.get<{ Querystring: { from_event_id: string } }>("/v1/events", (request, reply) => {
      const { from_event_id } = request.query;

      this.engine.getEvents(parseInt(from_event_id)).then((resp) => {
        if (resp.isErr()) {
          reply.code(400).send({ error: resp.error.message });
        } else {
          const nextPageEventId = resp.value.nextPageEventId;
          const events = resp.value.events.map((event) => protoToJSON(event, HubEvent));
          reply.send({ nextPageEventId, events });
        }
      });
    });
  }

  async start(ip = "0.0.0.0", port = 0): Promise<HubResult<string>> {
    return new Promise((resolve) => {
      this.app.listen({ host: ip, port }, (e, address) => {
        if (e) {
          log.error({ err: e, errMsg: e.message }, "Failed to start http server");
          resolve(err(new HubError("unavailable.network_failure", `Failed to start http server: ${e.message}`)));
        }

        log.info({ address }, "Started http API server");
        resolve(ok(address));
      });
    });
  }

  async stop() {
    await this.app.close();
    log.info("Stopped http API server");
  }
}
