import {
  CastAddMessage,
  CastRemoveMessage,
  fromFarcasterTime,
  isIdRegisterOnChainEvent,
  isSignerMigratedOnChainEvent,
  isSignerOnChainEvent,
  isStorageRentOnChainEvent,
  LinkAddMessage,
  LinkRemoveMessage,
  Message,
  MessageType,
  OnChainEvent,
  OnChainEventType,
  Protocol,
  ReactionAddMessage,
  ReactionRemoveMessage,
  UserDataAddMessage,
  UsernameProofMessage,
  VerificationAddAddressMessage,
  VerificationRemoveMessage,
} from "@farcaster/hub-nodejs";
import { DeleteQueryBuilder, InsertQueryBuilder, SelectQueryBuilder, UpdateQueryBuilder } from "kysely";
import { format as formatSql } from "sql-formatter";
import { decodeAbiParameters } from "viem";
import {
  CastAddBodyJson,
  CastEmbedJson,
  CastRemoveBodyJson,
  ChainEventBodyJson,
  Hex,
  IdRegisterEventBodyJson,
  LinkBodyJson,
  LinkCompactStateBodyJson,
  MessageBodyJson,
  ReactionBodyJson,
  SignerEventBodyJson,
  SignerMigratedEventBodyJson,
  StorageRentEventBodyJson,
  UserDataBodyJson,
  UsernameProofBodyJson,
  VerificationAddEthAddressBodyJson,
  VerificationAddSolAddressBodyJson,
  VerificationRemoveBodyJson,
} from "./db.js";
import { AssertionError } from "./error.js";
import { Logger } from "./log.js";
import { threadId as workerThreadId } from "worker_threads";
import { pid } from "process";
import base58 from "bs58";

export type StoreMessageOperation = "merge" | "delete" | "prune" | "revoke";

export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

export const NULL_ETH_ADDRESS = Uint8Array.from(Buffer.from("0000000000000000000000000000000000000000", "hex"));

export function farcasterTimeToDate(time: undefined): undefined;
export function farcasterTimeToDate(time: null): null;
export function farcasterTimeToDate(time: number): Date;
export function farcasterTimeToDate(time: number | null | undefined): Date | null | undefined;
export function farcasterTimeToDate(time: number | null | undefined): Date | null | undefined {
  if (time === undefined) return undefined;
  if (time === null) return null;
  const result = fromFarcasterTime(time);
  if (result.isErr()) throw result.error;
  return new Date(result.value);
}

export function bytesToHex(bytes: undefined): undefined;
export function bytesToHex(bytes: null): null;
export function bytesToHex(bytes: Uint8Array): Hex;
export function bytesToHex(bytes: Uint8Array | null | undefined): Hex | null | undefined;
export function bytesToHex(bytes: Uint8Array | null | undefined): Hex | null | undefined {
  if (bytes === undefined) return undefined;
  if (bytes === null) return null;
  return `0x${Buffer.from(bytes).toString("hex")}`;
}

export function hexToBytes(string: undefined): undefined;
export function hexToBytes(string: null): null;
export function hexToBytes(string: Hex): Uint8Array;
export function hexToBytes(string: Hex | null | undefined): Uint8Array | null | undefined;
export function hexToBytes(string: Hex | null | undefined): Uint8Array | null | undefined {
  if (string === undefined) return undefined;
  if (string === null) return null;
  if (!string.startsWith("0x")) throw new AssertionError(`Hex string must start with 0x: ${string}`);
  return Buffer.from(string.slice(2), "hex");
}

const signedKeyRequestAbi = [
  {
    components: [
      {
        name: "requestFid",
        type: "uint256",
      },
      {
        name: "requestSigner",
        type: "address",
      },
      {
        name: "signature",
        type: "bytes",
      },
      {
        name: "deadline",
        type: "uint256",
      },
    ],
    name: "SignedKeyRequest",
    type: "tuple",
  },
] as const;

export function decodeSignedKeyRequestMetadata(metadata: Uint8Array) {
  return decodeAbiParameters(signedKeyRequestAbi, bytesToHex(metadata))[0];
}

export function convertProtobufMessageBodyToJson(message: CastAddMessage): CastAddBodyJson;
export function convertProtobufMessageBodyToJson(message: CastRemoveMessage): CastRemoveBodyJson;
export function convertProtobufMessageBodyToJson(message: ReactionAddMessage | ReactionRemoveMessage): ReactionBodyJson;
export function convertProtobufMessageBodyToJson(message: LinkAddMessage | LinkRemoveMessage): LinkBodyJson;
export function convertProtobufMessageBodyToJson(
  message: VerificationAddAddressMessage,
): VerificationAddEthAddressBodyJson;
export function convertProtobufMessageBodyToJson(message: VerificationRemoveMessage): VerificationRemoveBodyJson;
export function convertProtobufMessageBodyToJson(message: UserDataAddMessage): UserDataBodyJson;
export function convertProtobufMessageBodyToJson(message: UsernameProofMessage): UsernameProofBodyJson;
export function convertProtobufMessageBodyToJson(message: Message): MessageBodyJson;
export function convertProtobufMessageBodyToJson(message: Message): MessageBodyJson {
  if (!message.data) throw new AssertionError("Message has no data");

  switch (message.data?.type) {
    case MessageType.CAST_ADD: {
      if (!message.data.castAddBody) throw new Error("Missing castAddBody");
      const { embeds, embedsDeprecated, mentions, mentionsPositions, text, parentCastId, parentUrl } =
        message.data.castAddBody;

      const transformedEmbeds: CastEmbedJson[] = embedsDeprecated?.length
        ? embedsDeprecated.map((url) => ({ url }))
        : embeds.map(({ castId, url }) => {
            if (castId) return { castId: { fid: castId.fid, hash: bytesToHex(castId.hash) } };
            if (url) return { url };
            throw new AssertionError("Neither castId nor url is defined in embed");
          });

      return {
        embeds: transformedEmbeds,
        mentions,
        mentionsPositions,
        text,
        ...(parentCastId
          ? { parentCastId: { fid: parentCastId.fid, hash: bytesToHex(parentCastId.hash) } }
          : parentUrl
          ? { parentUrl }
          : {}),
      } satisfies CastAddBodyJson;
    }
    case MessageType.CAST_REMOVE: {
      if (!message.data.castRemoveBody) throw new Error("Missing castRemoveBody");
      const { targetHash } = message.data.castRemoveBody;
      return { targetHash: bytesToHex(targetHash) } satisfies CastRemoveBodyJson;
    }
    case MessageType.REACTION_ADD:
    case MessageType.REACTION_REMOVE: {
      if (!message.data.reactionBody) throw new Error("Missing reactionBody");
      if (message.data.reactionBody.targetCastId) {
        const {
          type,
          targetCastId: { fid, hash },
        } = message.data.reactionBody;
        return { type, targetCastId: { fid, hash: bytesToHex(hash) } } satisfies ReactionBodyJson;
      } else if (message.data.reactionBody.targetUrl) {
        const { type, targetUrl } = message.data.reactionBody;
        return { type, targetUrl } satisfies ReactionBodyJson;
      } else {
        throw new AssertionError("Missing targetCastId and targetUrl on reactionBody");
      }
    }
    case MessageType.LINK_COMPACT_STATE: {
      if (!message.data.linkCompactStateBody) throw new Error("Missing linkCompactStateBody");
      const targetFids = message.data.linkCompactStateBody.targetFids;
      if (!targetFids) throw new Error("Missing targetFids");
      const body: LinkCompactStateBodyJson = {
        type: message.data.linkCompactStateBody.type,
        targetFids: targetFids.map((fid) => fid),
      };
      return body;
    }
    case MessageType.LINK_ADD:
    case MessageType.LINK_REMOVE: {
      if (!message.data.linkBody) throw new Error("Missing linkBody");
      const target = message.data.linkBody.targetFid;
      if (!target) throw new Error("Missing linkBody target");
      const { type, targetFid, displayTimestamp } = message.data.linkBody;
      const body: LinkBodyJson = { type };
      if (targetFid) {
        body.targetFid = targetFid;
      }
      if (displayTimestamp) {
        body.displayTimestamp = fromFarcasterTime(displayTimestamp)._unsafeUnwrap();
      }
      return body;
    }
    case MessageType.VERIFICATION_ADD_ETH_ADDRESS: {
      if (!message.data.verificationAddAddressBody) {
        throw new Error("Missing verificationAddEthAddressBody");
      }
      const { address, claimSignature, blockHash, protocol } = message.data.verificationAddAddressBody;
      switch (protocol) {
        case Protocol.ETHEREUM:
          return {
            address: bytesToHex(address),
            claimSignature: bytesToHex(claimSignature),
            blockHash: bytesToHex(blockHash),
            protocol: Protocol.ETHEREUM,
          } satisfies VerificationAddEthAddressBodyJson;
        case Protocol.SOLANA:
          return {
            address: base58.encode(address),
            claimSignature: bytesToHex(claimSignature),
            blockHash: base58.encode(blockHash),
            protocol: Protocol.SOLANA,
          } satisfies VerificationAddSolAddressBodyJson;
        default:
          throw new AssertionError(`Unsupported protocol ${protocol}`);
      }
    }
    case MessageType.VERIFICATION_REMOVE: {
      if (!message.data.verificationRemoveBody) throw new Error("Missing verificationRemoveBody");
      const { address, protocol } = message.data.verificationRemoveBody;
      return {
        address: bytesToHex(address),
        protocol: protocol,
      } satisfies VerificationRemoveBodyJson;
    }
    case MessageType.USER_DATA_ADD: {
      if (!message.data.userDataBody) throw new Error("Missing userDataBody");
      const { type, value } = message.data.userDataBody;
      return { type, value } satisfies UserDataBodyJson;
    }
    case MessageType.USERNAME_PROOF: {
      if (!message.data.usernameProofBody) throw new Error("Missing usernameProofBody");
      const { timestamp, name, owner, signature, fid, type } = message.data.usernameProofBody;
      return {
        timestamp,
        name: bytesToHex(name),
        owner: bytesToHex(owner),
        signature: bytesToHex(signature),
        fid,
        type,
      } satisfies UsernameProofBodyJson;
    }
    case MessageType.FRAME_ACTION:
      throw new AssertionError("Unexpected FRAME_ACTION message type");
    case MessageType.NONE:
      throw new AssertionError("Message has no type");
    default:
      // If we're getting a type error on the line below, it means we've missed a case above.
      // Did we add a new message type?
      exhaustiveGuard(message.data?.type);
  }
}

export function convertOnChainEventBodyToJson(
  event: OnChainEvent & { type: OnChainEventType.EVENT_TYPE_SIGNER },
): SignerEventBodyJson;
export function convertOnChainEventBodyToJson(
  event: OnChainEvent & { type: OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED },
): SignerMigratedEventBodyJson;
export function convertOnChainEventBodyToJson(
  event: OnChainEvent & { type: OnChainEventType.EVENT_TYPE_ID_REGISTER },
): IdRegisterEventBodyJson;
export function convertOnChainEventBodyToJson(
  event: OnChainEvent & { type: OnChainEventType.EVENT_TYPE_STORAGE_RENT },
): StorageRentEventBodyJson;
export function convertOnChainEventBodyToJson(event: OnChainEvent): ChainEventBodyJson;
export function convertOnChainEventBodyToJson(event: OnChainEvent): ChainEventBodyJson {
  switch (event.type) {
    case OnChainEventType.EVENT_TYPE_SIGNER:
      if (!isSignerOnChainEvent(event)) throw new AssertionError(`Invalid SignerOnChainEvent: ${event}`);
      return {
        key: bytesToHex(event.signerEventBody.key),
        keyType: event.signerEventBody.keyType,
        eventType: event.signerEventBody.eventType,
        metadata: bytesToHex(event.signerEventBody.metadata),
        metadataType: event.signerEventBody.metadataType,
      } satisfies SignerEventBodyJson;
    case OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED:
      if (!isSignerMigratedOnChainEvent(event))
        throw new AssertionError(`Invalid SignerMigratedOnChainEvent: ${event}`);
      return {
        migratedAt: event.signerMigratedEventBody.migratedAt,
      } satisfies SignerMigratedEventBodyJson;
    case OnChainEventType.EVENT_TYPE_ID_REGISTER:
      if (!isIdRegisterOnChainEvent(event)) throw new AssertionError(`Invalid IdRegisterOnChainEvent: ${event}`);
      return {
        to: bytesToHex(event.idRegisterEventBody.to),
        eventType: event.idRegisterEventBody.eventType,
        from: bytesToHex(event.idRegisterEventBody.from),
        recoveryAddress: bytesToHex(event.idRegisterEventBody.recoveryAddress),
      } satisfies IdRegisterEventBodyJson;
    case OnChainEventType.EVENT_TYPE_STORAGE_RENT:
      if (!isStorageRentOnChainEvent(event)) throw new AssertionError(`Invalid StorageRentOnChainEvent: ${event}`);
      return {
        payer: bytesToHex(event.storageRentEventBody.payer),
        units: event.storageRentEventBody.units,
        expiry: event.storageRentEventBody.expiry,
      } satisfies StorageRentEventBodyJson;
    case OnChainEventType.EVENT_TYPE_NONE:
      throw new AssertionError("OnChainEvent has no type");
    default:
      // If we're getting a type error on the line below, it means we've missed a case above.
      // Did we add a new event type?
      exhaustiveGuard(event.type);
  }
}

export function exhaustiveGuard(value: never): never {
  throw new AssertionError(`Invalid value ${value} for exhaustive guard`);
}

export function threadId() {
  return workerThreadId;
}

export function processId() {
  return pid;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function extendStackTrace(
  err: unknown,
  stackError: Error,
  query?: // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
    | SelectQueryBuilder<any, any, any>
    // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
    | InsertQueryBuilder<any, any, any>
    // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
    | UpdateQueryBuilder<any, any, any, any>
    // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
    | DeleteQueryBuilder<any, any, any>,
): unknown {
  if (isStackHolder(err) && stackError.stack) {
    // Remove the first line that just says `Error`.
    const stackExtension = stackError.stack.split("\n").slice(1).join("\n");

    err.stack += `\n${stackExtension}`;

    // Add full SQL query that caused the error to make debugging easier
    if (query) {
      const { sql, parameters } = query.compile();
      const params = parameters.map((param) => {
        if (param === null) return "null";
        // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
        if (ArrayBuffer.isView(param)) return `'\\x${Buffer.from(param as any).toString("hex")}'`;
        if (param instanceof Date) return `'${param.toISOString()}'`;
        if (Array.isArray(param)) return JSON.stringify(param);
        switch (typeof param) {
          case "number":
          case "boolean":
            return param.toString();
          case "object":
            return JSON.stringify(param);
          default:
            return `'${param}'`;
        }
      });
      const indexedParams = Object.fromEntries(params.map((param, index) => [index + 1, param]));
      err.stack += `\n${formatSql(sql, { params: indexedParams, language: "postgresql" })}`;
    }

    return err;
  }
  return err;
}

interface StackHolder {
  stack: string;
}

function isStackHolder(obj: unknown): obj is StackHolder {
  // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
  return typeof obj === "object" && obj !== null && typeof (obj as any).stack === "string";
}

// How long to wait for finalizers to complete before forcibly terminating
const SHUTDOWN_TIMEOUT_MS = 10_000;
// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
const finalizers: Array<() => Promise<any>> = [];

export async function terminateProcess({ success, log }: { success: boolean; log: Logger }) {
  log.debug(`Terminating process. Running ${finalizers.length} finalizers...`);
  let completedFinalizers = 0;
  await Promise.race([
    Promise.all(
      finalizers.map(async (fn) => {
        await fn();
        completedFinalizers += 1;
        log.debug(`Finished ${completedFinalizers}/${finalizers.length} finalizers`);
      }),
    ),
    (async () => {
      await sleep(SHUTDOWN_TIMEOUT_MS);
      log.debug(`Finalizers took longer than ${SHUTDOWN_TIMEOUT_MS}ms to complete. Forcibly terminating.`);
    })(),
  ]);
  if (success) {
    process.exitCode = 0;
  } else if (process.exitCode === undefined) {
    process.exitCode = 1;
  }
  process.exit();
}

// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
export function onTerminate(fn: () => Promise<any>) {
  finalizers.push(fn);
}

function isHexEncoded(data: Uint8Array): boolean {
  // Regular expression to match hexadecimal character patterns
  const hexPattern = /^[0-9a-fA-F]+$/;
  // Convert the Uint8Array to a string to check against the pattern
  const dataString = String.fromCharCode(...data);
  return hexPattern.test(dataString) && data.length % 2 === 0;
}
export function toHexEncodedUint8Array(data: Uint8Array): Uint8Array {
  if (isHexEncoded(data)) {
    return data;
  }

  const hex = Buffer.from(data).toString("hex");
  return hexToBytes(`0x${hex}`);
}
