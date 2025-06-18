import type { DeleteQueryBuilder, InsertQueryBuilder, SelectQueryBuilder, UpdateQueryBuilder } from "kysely";
import { format as formatSql } from "sql-formatter";
import { bytesToBase58, fromFarcasterTime, type Message, MessageType, Protocol } from "@farcaster/hub-nodejs";
import type { MessageBodyJson, VerificationProtocol } from "./shuttle/db.ts";

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

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function bytesToHex(value: Uint8Array): `0x${string}` {
  return `0x${Buffer.from(value).toString("hex")}`;
}

export function farcasterTimeToDate(time: number): Date;
export function farcasterTimeToDate(time: null): null;
export function farcasterTimeToDate(time: undefined): undefined;
export function farcasterTimeToDate(time: number | null | undefined): Date | null | undefined {
  if (time === undefined) return undefined;
  if (time === null) return null;
  const result = fromFarcasterTime(time);
  if (result.isErr()) throw result.error;
  return new Date(result.value);
}

export function protocolBytesToString(bytes: Uint8Array, protocol: Protocol | VerificationProtocol): string {
  switch (protocol) {
    case Protocol.ETHEREUM:
    case "ethereum":
      return bytesToHex(bytes);
    case Protocol.SOLANA:
    case "solana":
      return bytesToBase58(bytes)._unsafeUnwrap();
    default:
      throw new Error(`Unexpected protocol: ${protocol}`);
  }
}

export function hubProtocolToVerificationProtocol(protocol: Protocol): VerificationProtocol {
  switch (protocol) {
    case Protocol.ETHEREUM:
      return "ethereum";
    case Protocol.SOLANA:
      return "solana";
  }
}

export function convertProtobufMessageBodyToJson(message: Message): MessageBodyJson {
  let body: MessageBodyJson;
  switch (message.data?.type) {
    case MessageType.CAST_ADD: {
      if (!message.data.castAddBody) throw new Error("Missing castAddBody");
      const {
        embeds: embedsFromCastAddBody,
        mentions,
        mentionsPositions,
        text,
        parentCastId,
        parentUrl,
        type,
      } = message.data.castAddBody;

      const embeds: string[] = [];

      for (const embed of embedsFromCastAddBody) {
        if (typeof embed.castId !== "undefined") {
          embeds.push(bytesToHex(embed.castId.hash));
        }
        // We are going "one of" approach on the embed Cast Id and URL.
        // If both are set its likely a client attributing itself with the same
        // cast information. If it is a different URL representing a different cast
        // that would be inaccurate way to push data to the protocol anyway.
        // Eventually we may want to attribute which client quoted cast was shared
        // from - but that will require a data model change on how messages are stored.
        else if (typeof embed.url !== "undefined") {
          embeds.push(embed.url);
        }
      }

      body = {
        embeds: embeds,
        mentions,
        mentionsPositions,
        text,
        type,
        parent: parentCastId ? { fid: parentCastId.fid, hash: bytesToHex(parentCastId.hash) } : parentUrl,
      };
      break;
    }
    case MessageType.CAST_REMOVE: {
      if (!message.data.castRemoveBody) throw new Error("Missing castRemoveBody");
      const { targetHash } = message.data.castRemoveBody;
      body = { targetHash: bytesToHex(targetHash) };
      break;
    }
    case MessageType.REACTION_ADD:
    case MessageType.REACTION_REMOVE: {
      if (!message.data.reactionBody) throw new Error("Missing reactionBody");
      if (message.data.reactionBody.targetCastId) {
        const {
          type,
          targetCastId: { fid, hash },
        } = message.data.reactionBody;
        body = { type, target: { fid, hash: bytesToHex(hash) } };
      } else if (message.data.reactionBody.targetUrl) {
        const { type, targetUrl } = message.data.reactionBody;
        body = { type, target: targetUrl };
      } else {
        throw new Error("Missing targetCastId and targetUrl on reactionBody");
      }
      break;
    }
    case MessageType.LINK_ADD:
    case MessageType.LINK_REMOVE: {
      if (!message.data.linkBody) throw new Error("Missing linkBody");
      const target = message.data.linkBody.targetFid;
      if (!target) throw new Error("Missing linkBody target");
      const { type, targetFid, displayTimestamp } = message.data.linkBody;
      body = { type, targetFid };
      if (displayTimestamp) {
        const displayTimestampUnixResult = fromFarcasterTime(displayTimestamp);
        if (displayTimestampUnixResult.isErr()) throw displayTimestampUnixResult.error;
        body.displayTimestamp = displayTimestampUnixResult.value;
      }
      break;
    }
    case MessageType.LINK_COMPACT_STATE: {
      if (!message.data.linkCompactStateBody) throw new Error("Missing linkCompactStateBody");
      const { type, targetFids } = message.data.linkCompactStateBody;
      body = { type, targetFids };
      break;
    }
    case MessageType.VERIFICATION_ADD_ETH_ADDRESS: {
      if (!message.data.verificationAddAddressBody) {
        throw new Error("Missing verificationAddAddressBody");
      }
      const { address, claimSignature, blockHash, protocol } = message.data.verificationAddAddressBody;
      body = {
        address: protocolBytesToString(address, protocol),
        claimSignature: protocolBytesToString(claimSignature, protocol),
        blockHash: protocolBytesToString(blockHash, protocol),
        protocol: hubProtocolToVerificationProtocol(protocol),
      };
      break;
    }
    case MessageType.VERIFICATION_REMOVE: {
      if (!message.data.verificationRemoveBody) throw new Error("Missing verificationRemoveBody");
      const { address, protocol } = message.data.verificationRemoveBody;
      body = {
        address: protocolBytesToString(address, protocol),
        protocol: hubProtocolToVerificationProtocol(protocol),
      };
      break;
    }
    case MessageType.USER_DATA_ADD: {
      if (!message.data.userDataBody) throw new Error("Missing userDataBody");
      const { type, value } = message.data.userDataBody;
      body = { type, value };
      break;
    }
    case MessageType.USERNAME_PROOF: {
      if (!message.data.usernameProofBody) throw new Error("Missing usernameProofBody");
      const { timestamp, name, owner, signature, fid, type } = message.data.usernameProofBody;
      body = {
        timestamp,
        name: bytesToHex(name),
        owner: bytesToHex(owner),
        signature: bytesToHex(signature),
        fid,
        type,
      };
      break;
    }
    case MessageType.LEND_STORAGE: {
      if (!message.data.lendStorageBody) throw new Error("Missing lendStorageBody");
      const { toFid, numUnits, unitType } = message.data.lendStorageBody;
      body = {
        toFid,
        numUnits,
        unitType,
      };
      break;
    }
    default:
      // TODO: Once we update types in upstream @farcaster/hub-nodejs, switch to this
      // assertUnreachable(message.data.type);
      throw new Error(`Unknown message type ${message.data?.type}`);
  }

  return body;
}

// biome-ignore lint/suspicious/noExplicitAny: generic
export async function inBatchesOf<T>(items: T[], batchSize: number, fn: (batch: T[]) => any) {
  let offset = 0;
  while (offset < items.length) {
    const batch = items.slice(offset, offset + batchSize);
    await fn(batch);
    offset += batchSize;
  }
}
