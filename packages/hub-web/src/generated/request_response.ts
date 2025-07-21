/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { ShardChunk } from "./blocks";
import { ContactInfoBody } from "./gossip";
import { HubEvent, HubEventType, hubEventTypeFromJSON, hubEventTypeToJSON } from "./hub_event";
import {
  CastId,
  Message,
  ReactionType,
  reactionTypeFromJSON,
  reactionTypeToJSON,
  UserDataType,
  userDataTypeFromJSON,
  userDataTypeToJSON,
} from "./message";
import {
  OnChainEvent,
  OnChainEventType,
  onChainEventTypeFromJSON,
  onChainEventTypeToJSON,
  TierType,
  tierTypeFromJSON,
  tierTypeToJSON,
} from "./onchain_event";
import { UserNameProof } from "./username_proof";

export enum StoreType {
  NONE = 0,
  CASTS = 1,
  LINKS = 2,
  REACTIONS = 3,
  USER_DATA = 4,
  VERIFICATIONS = 5,
  USERNAME_PROOFS = 6,
}

export function storeTypeFromJSON(object: any): StoreType {
  switch (object) {
    case 0:
    case "STORE_TYPE_NONE":
      return StoreType.NONE;
    case 1:
    case "STORE_TYPE_CASTS":
      return StoreType.CASTS;
    case 2:
    case "STORE_TYPE_LINKS":
      return StoreType.LINKS;
    case 3:
    case "STORE_TYPE_REACTIONS":
      return StoreType.REACTIONS;
    case 4:
    case "STORE_TYPE_USER_DATA":
      return StoreType.USER_DATA;
    case 5:
    case "STORE_TYPE_VERIFICATIONS":
      return StoreType.VERIFICATIONS;
    case 6:
    case "STORE_TYPE_USERNAME_PROOFS":
      return StoreType.USERNAME_PROOFS;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum StoreType");
  }
}

export function storeTypeToJSON(object: StoreType): string {
  switch (object) {
    case StoreType.NONE:
      return "STORE_TYPE_NONE";
    case StoreType.CASTS:
      return "STORE_TYPE_CASTS";
    case StoreType.LINKS:
      return "STORE_TYPE_LINKS";
    case StoreType.REACTIONS:
      return "STORE_TYPE_REACTIONS";
    case StoreType.USER_DATA:
      return "STORE_TYPE_USER_DATA";
    case StoreType.VERIFICATIONS:
      return "STORE_TYPE_VERIFICATIONS";
    case StoreType.USERNAME_PROOFS:
      return "STORE_TYPE_USERNAME_PROOFS";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum StoreType");
  }
}

export enum StorageUnitType {
  UNIT_TYPE_LEGACY = 0,
  UNIT_TYPE_2024 = 1,
  UNIT_TYPE_2025 = 2,
}

export function storageUnitTypeFromJSON(object: any): StorageUnitType {
  switch (object) {
    case 0:
    case "UNIT_TYPE_LEGACY":
      return StorageUnitType.UNIT_TYPE_LEGACY;
    case 1:
    case "UNIT_TYPE_2024":
      return StorageUnitType.UNIT_TYPE_2024;
    case 2:
    case "UNIT_TYPE_2025":
      return StorageUnitType.UNIT_TYPE_2025;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum StorageUnitType");
  }
}

export function storageUnitTypeToJSON(object: StorageUnitType): string {
  switch (object) {
    case StorageUnitType.UNIT_TYPE_LEGACY:
      return "UNIT_TYPE_LEGACY";
    case StorageUnitType.UNIT_TYPE_2024:
      return "UNIT_TYPE_2024";
    case StorageUnitType.UNIT_TYPE_2025:
      return "UNIT_TYPE_2025";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum StorageUnitType");
  }
}

export interface BlocksRequest {
  shardId: number;
  startBlockNumber: number;
  stopBlockNumber?: number | undefined;
}

export interface ShardChunksRequest {
  shardId: number;
  startBlockNumber: number;
  stopBlockNumber?: number | undefined;
}

export interface ShardChunksResponse {
  shardChunks: ShardChunk[];
}

export interface SubscribeRequest {
  eventTypes: HubEventType[];
  fromId?:
    | number
    | undefined;
  /** optional uint32 total_shards = 3; // Not required for snapchain */
  shardIndex?: number | undefined;
}

export interface DbStats {
  numMessages: number;
  numFidRegistrations: number;
  approxSize: number;
}

export interface ShardInfo {
  shardId: number;
  maxHeight: number;
  numMessages: number;
  numFidRegistrations: number;
  approxSize: number;
  blockDelay: number;
  mempoolSize: number;
}

export interface GetInfoRequest {
}

/** Response Types for the Sync RPC Methods */
export interface GetInfoResponse {
  version: string;
  dbStats: DbStats | undefined;
  peerId: string;
  numShards: number;
  shardInfos: ShardInfo[];
}

export interface EventRequest {
  id: number;
  shardIndex: number;
}

export interface FidRequest {
  fid: number;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface FidTimestampRequest {
  fid: number;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
  startTimestamp?: number | undefined;
  stopTimestamp?: number | undefined;
}

export interface FidsRequest {
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
  shardId: number;
}

export interface FidsResponse {
  fids: number[];
  nextPageToken?: Uint8Array | undefined;
}

export interface MessagesResponse {
  messages: Message[];
  nextPageToken?: Uint8Array | undefined;
}

export interface CastsByParentRequest {
  parentCastId?: CastId | undefined;
  parentUrl?: string | undefined;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface ReactionRequest {
  fid: number;
  reactionType: ReactionType;
  targetCastId?: CastId | undefined;
  targetUrl?: string | undefined;
}

export interface ReactionsByFidRequest {
  fid: number;
  reactionType?: ReactionType | undefined;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface ReactionsByTargetRequest {
  targetCastId?: CastId | undefined;
  targetUrl?: string | undefined;
  reactionType?: ReactionType | undefined;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface UserDataRequest {
  fid: number;
  userDataType: UserDataType;
}

export interface OnChainEventRequest {
  fid: number;
  eventType: OnChainEventType;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface OnChainEventResponse {
  events: OnChainEvent[];
  nextPageToken?: Uint8Array | undefined;
}

export interface TierDetails {
  tierType: TierType;
  expiresAt: number;
}

export interface StorageLimitsResponse {
  limits: StorageLimit[];
  units: number;
  unitDetails: StorageUnitDetails[];
  tierSubscriptions: TierDetails[];
}

export interface StorageUnitDetails {
  unitType: StorageUnitType;
  unitSize: number;
}

export interface StorageLimit {
  storeType: StoreType;
  name: string;
  limit: number;
  used: number;
  earliestTimestamp: number;
  earliestHash: Uint8Array;
}

export interface UsernameProofRequest {
  name: Uint8Array;
}

export interface UsernameProofsResponse {
  proofs: UserNameProof[];
}

export interface ValidationResponse {
  valid: boolean;
  message: Message | undefined;
}

export interface VerificationRequest {
  fid: number;
  address: Uint8Array;
}

export interface SignerRequest {
  fid: number;
  signer: Uint8Array;
}

export interface LinkRequest {
  fid: number;
  linkType: string;
  targetFid?: number | undefined;
}

export interface LinksByFidRequest {
  fid: number;
  linkType?: string | undefined;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface LinksByTargetRequest {
  targetFid?: number | undefined;
  linkType?: string | undefined;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface IdRegistryEventByAddressRequest {
  address: Uint8Array;
}

export interface SubmitBulkMessagesRequest {
  messages: Message[];
}

export interface MessageError {
  hash: Uint8Array;
  errCode: string;
  message: string;
}

export interface BulkMessageResponse {
  message?: Message | undefined;
  messageError?: MessageError | undefined;
}

export interface SubmitBulkMessagesResponse {
  messages: BulkMessageResponse[];
}

export interface TrieNodeMetadataRequest {
  shardId: number;
  prefix: Uint8Array;
}

export interface TrieNodeMetadataResponse {
  prefix: Uint8Array;
  numMessages: number;
  hash: string;
  children: TrieNodeMetadataResponse[];
}

export interface EventsRequest {
  startId: number;
  shardIndex?: number | undefined;
  stopId?: number | undefined;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface EventsResponse {
  events: HubEvent[];
  nextPageToken?: Uint8Array | undefined;
}

export interface FidAddressTypeRequest {
  fid: number;
  address: Uint8Array;
}

export interface FidAddressTypeResponse {
  isCustody: boolean;
  isAuth: boolean;
  isVerified: boolean;
}

export interface GetConnectedPeersRequest {
}

export interface GetConnectedPeersResponse {
  contacts: ContactInfoBody[];
}

function createBaseBlocksRequest(): BlocksRequest {
  return { shardId: 0, startBlockNumber: 0, stopBlockNumber: undefined };
}

export const BlocksRequest = {
  encode(message: BlocksRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.shardId !== 0) {
      writer.uint32(8).uint32(message.shardId);
    }
    if (message.startBlockNumber !== 0) {
      writer.uint32(16).uint64(message.startBlockNumber);
    }
    if (message.stopBlockNumber !== undefined) {
      writer.uint32(24).uint64(message.stopBlockNumber);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BlocksRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBlocksRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.shardId = reader.uint32();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.startBlockNumber = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.stopBlockNumber = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BlocksRequest {
    return {
      shardId: isSet(object.shardId) ? Number(object.shardId) : 0,
      startBlockNumber: isSet(object.startBlockNumber) ? Number(object.startBlockNumber) : 0,
      stopBlockNumber: isSet(object.stopBlockNumber) ? Number(object.stopBlockNumber) : undefined,
    };
  },

  toJSON(message: BlocksRequest): unknown {
    const obj: any = {};
    message.shardId !== undefined && (obj.shardId = Math.round(message.shardId));
    message.startBlockNumber !== undefined && (obj.startBlockNumber = Math.round(message.startBlockNumber));
    message.stopBlockNumber !== undefined && (obj.stopBlockNumber = Math.round(message.stopBlockNumber));
    return obj;
  },

  create<I extends Exact<DeepPartial<BlocksRequest>, I>>(base?: I): BlocksRequest {
    return BlocksRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<BlocksRequest>, I>>(object: I): BlocksRequest {
    const message = createBaseBlocksRequest();
    message.shardId = object.shardId ?? 0;
    message.startBlockNumber = object.startBlockNumber ?? 0;
    message.stopBlockNumber = object.stopBlockNumber ?? undefined;
    return message;
  },
};

function createBaseShardChunksRequest(): ShardChunksRequest {
  return { shardId: 0, startBlockNumber: 0, stopBlockNumber: undefined };
}

export const ShardChunksRequest = {
  encode(message: ShardChunksRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.shardId !== 0) {
      writer.uint32(8).uint32(message.shardId);
    }
    if (message.startBlockNumber !== 0) {
      writer.uint32(16).uint64(message.startBlockNumber);
    }
    if (message.stopBlockNumber !== undefined) {
      writer.uint32(24).uint64(message.stopBlockNumber);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ShardChunksRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseShardChunksRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.shardId = reader.uint32();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.startBlockNumber = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.stopBlockNumber = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ShardChunksRequest {
    return {
      shardId: isSet(object.shardId) ? Number(object.shardId) : 0,
      startBlockNumber: isSet(object.startBlockNumber) ? Number(object.startBlockNumber) : 0,
      stopBlockNumber: isSet(object.stopBlockNumber) ? Number(object.stopBlockNumber) : undefined,
    };
  },

  toJSON(message: ShardChunksRequest): unknown {
    const obj: any = {};
    message.shardId !== undefined && (obj.shardId = Math.round(message.shardId));
    message.startBlockNumber !== undefined && (obj.startBlockNumber = Math.round(message.startBlockNumber));
    message.stopBlockNumber !== undefined && (obj.stopBlockNumber = Math.round(message.stopBlockNumber));
    return obj;
  },

  create<I extends Exact<DeepPartial<ShardChunksRequest>, I>>(base?: I): ShardChunksRequest {
    return ShardChunksRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ShardChunksRequest>, I>>(object: I): ShardChunksRequest {
    const message = createBaseShardChunksRequest();
    message.shardId = object.shardId ?? 0;
    message.startBlockNumber = object.startBlockNumber ?? 0;
    message.stopBlockNumber = object.stopBlockNumber ?? undefined;
    return message;
  },
};

function createBaseShardChunksResponse(): ShardChunksResponse {
  return { shardChunks: [] };
}

export const ShardChunksResponse = {
  encode(message: ShardChunksResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.shardChunks) {
      ShardChunk.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ShardChunksResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseShardChunksResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.shardChunks.push(ShardChunk.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ShardChunksResponse {
    return {
      shardChunks: Array.isArray(object?.shardChunks) ? object.shardChunks.map((e: any) => ShardChunk.fromJSON(e)) : [],
    };
  },

  toJSON(message: ShardChunksResponse): unknown {
    const obj: any = {};
    if (message.shardChunks) {
      obj.shardChunks = message.shardChunks.map((e) => e ? ShardChunk.toJSON(e) : undefined);
    } else {
      obj.shardChunks = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ShardChunksResponse>, I>>(base?: I): ShardChunksResponse {
    return ShardChunksResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ShardChunksResponse>, I>>(object: I): ShardChunksResponse {
    const message = createBaseShardChunksResponse();
    message.shardChunks = object.shardChunks?.map((e) => ShardChunk.fromPartial(e)) || [];
    return message;
  },
};

function createBaseSubscribeRequest(): SubscribeRequest {
  return { eventTypes: [], fromId: undefined, shardIndex: undefined };
}

export const SubscribeRequest = {
  encode(message: SubscribeRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    writer.uint32(10).fork();
    for (const v of message.eventTypes) {
      writer.int32(v);
    }
    writer.ldelim();
    if (message.fromId !== undefined) {
      writer.uint32(16).uint64(message.fromId);
    }
    if (message.shardIndex !== undefined) {
      writer.uint32(32).uint32(message.shardIndex);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag == 8) {
            message.eventTypes.push(reader.int32() as any);
            continue;
          }

          if (tag == 10) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.eventTypes.push(reader.int32() as any);
            }

            continue;
          }

          break;
        case 2:
          if (tag != 16) {
            break;
          }

          message.fromId = longToNumber(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.shardIndex = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequest {
    return {
      eventTypes: Array.isArray(object?.eventTypes) ? object.eventTypes.map((e: any) => hubEventTypeFromJSON(e)) : [],
      fromId: isSet(object.fromId) ? Number(object.fromId) : undefined,
      shardIndex: isSet(object.shardIndex) ? Number(object.shardIndex) : undefined,
    };
  },

  toJSON(message: SubscribeRequest): unknown {
    const obj: any = {};
    if (message.eventTypes) {
      obj.eventTypes = message.eventTypes.map((e) => hubEventTypeToJSON(e));
    } else {
      obj.eventTypes = [];
    }
    message.fromId !== undefined && (obj.fromId = Math.round(message.fromId));
    message.shardIndex !== undefined && (obj.shardIndex = Math.round(message.shardIndex));
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequest>, I>>(base?: I): SubscribeRequest {
    return SubscribeRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequest>, I>>(object: I): SubscribeRequest {
    const message = createBaseSubscribeRequest();
    message.eventTypes = object.eventTypes?.map((e) => e) || [];
    message.fromId = object.fromId ?? undefined;
    message.shardIndex = object.shardIndex ?? undefined;
    return message;
  },
};

function createBaseDbStats(): DbStats {
  return { numMessages: 0, numFidRegistrations: 0, approxSize: 0 };
}

export const DbStats = {
  encode(message: DbStats, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.numMessages !== 0) {
      writer.uint32(8).uint64(message.numMessages);
    }
    if (message.numFidRegistrations !== 0) {
      writer.uint32(16).uint64(message.numFidRegistrations);
    }
    if (message.approxSize !== 0) {
      writer.uint32(32).uint64(message.approxSize);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DbStats {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDbStats();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.numMessages = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.numFidRegistrations = longToNumber(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.approxSize = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DbStats {
    return {
      numMessages: isSet(object.numMessages) ? Number(object.numMessages) : 0,
      numFidRegistrations: isSet(object.numFidRegistrations) ? Number(object.numFidRegistrations) : 0,
      approxSize: isSet(object.approxSize) ? Number(object.approxSize) : 0,
    };
  },

  toJSON(message: DbStats): unknown {
    const obj: any = {};
    message.numMessages !== undefined && (obj.numMessages = Math.round(message.numMessages));
    message.numFidRegistrations !== undefined && (obj.numFidRegistrations = Math.round(message.numFidRegistrations));
    message.approxSize !== undefined && (obj.approxSize = Math.round(message.approxSize));
    return obj;
  },

  create<I extends Exact<DeepPartial<DbStats>, I>>(base?: I): DbStats {
    return DbStats.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<DbStats>, I>>(object: I): DbStats {
    const message = createBaseDbStats();
    message.numMessages = object.numMessages ?? 0;
    message.numFidRegistrations = object.numFidRegistrations ?? 0;
    message.approxSize = object.approxSize ?? 0;
    return message;
  },
};

function createBaseShardInfo(): ShardInfo {
  return {
    shardId: 0,
    maxHeight: 0,
    numMessages: 0,
    numFidRegistrations: 0,
    approxSize: 0,
    blockDelay: 0,
    mempoolSize: 0,
  };
}

export const ShardInfo = {
  encode(message: ShardInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.shardId !== 0) {
      writer.uint32(8).uint32(message.shardId);
    }
    if (message.maxHeight !== 0) {
      writer.uint32(16).uint64(message.maxHeight);
    }
    if (message.numMessages !== 0) {
      writer.uint32(24).uint64(message.numMessages);
    }
    if (message.numFidRegistrations !== 0) {
      writer.uint32(32).uint64(message.numFidRegistrations);
    }
    if (message.approxSize !== 0) {
      writer.uint32(40).uint64(message.approxSize);
    }
    if (message.blockDelay !== 0) {
      writer.uint32(48).uint64(message.blockDelay);
    }
    if (message.mempoolSize !== 0) {
      writer.uint32(56).uint64(message.mempoolSize);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ShardInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseShardInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.shardId = reader.uint32();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.maxHeight = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.numMessages = longToNumber(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.numFidRegistrations = longToNumber(reader.uint64() as Long);
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.approxSize = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.blockDelay = longToNumber(reader.uint64() as Long);
          continue;
        case 7:
          if (tag != 56) {
            break;
          }

          message.mempoolSize = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ShardInfo {
    return {
      shardId: isSet(object.shardId) ? Number(object.shardId) : 0,
      maxHeight: isSet(object.maxHeight) ? Number(object.maxHeight) : 0,
      numMessages: isSet(object.numMessages) ? Number(object.numMessages) : 0,
      numFidRegistrations: isSet(object.numFidRegistrations) ? Number(object.numFidRegistrations) : 0,
      approxSize: isSet(object.approxSize) ? Number(object.approxSize) : 0,
      blockDelay: isSet(object.blockDelay) ? Number(object.blockDelay) : 0,
      mempoolSize: isSet(object.mempoolSize) ? Number(object.mempoolSize) : 0,
    };
  },

  toJSON(message: ShardInfo): unknown {
    const obj: any = {};
    message.shardId !== undefined && (obj.shardId = Math.round(message.shardId));
    message.maxHeight !== undefined && (obj.maxHeight = Math.round(message.maxHeight));
    message.numMessages !== undefined && (obj.numMessages = Math.round(message.numMessages));
    message.numFidRegistrations !== undefined && (obj.numFidRegistrations = Math.round(message.numFidRegistrations));
    message.approxSize !== undefined && (obj.approxSize = Math.round(message.approxSize));
    message.blockDelay !== undefined && (obj.blockDelay = Math.round(message.blockDelay));
    message.mempoolSize !== undefined && (obj.mempoolSize = Math.round(message.mempoolSize));
    return obj;
  },

  create<I extends Exact<DeepPartial<ShardInfo>, I>>(base?: I): ShardInfo {
    return ShardInfo.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ShardInfo>, I>>(object: I): ShardInfo {
    const message = createBaseShardInfo();
    message.shardId = object.shardId ?? 0;
    message.maxHeight = object.maxHeight ?? 0;
    message.numMessages = object.numMessages ?? 0;
    message.numFidRegistrations = object.numFidRegistrations ?? 0;
    message.approxSize = object.approxSize ?? 0;
    message.blockDelay = object.blockDelay ?? 0;
    message.mempoolSize = object.mempoolSize ?? 0;
    return message;
  },
};

function createBaseGetInfoRequest(): GetInfoRequest {
  return {};
}

export const GetInfoRequest = {
  encode(_: GetInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetInfoRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetInfoRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetInfoRequest {
    return {};
  },

  toJSON(_: GetInfoRequest): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<GetInfoRequest>, I>>(base?: I): GetInfoRequest {
    return GetInfoRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetInfoRequest>, I>>(_: I): GetInfoRequest {
    const message = createBaseGetInfoRequest();
    return message;
  },
};

function createBaseGetInfoResponse(): GetInfoResponse {
  return { version: "", dbStats: undefined, peerId: "", numShards: 0, shardInfos: [] };
}

export const GetInfoResponse = {
  encode(message: GetInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.version !== "") {
      writer.uint32(10).string(message.version);
    }
    if (message.dbStats !== undefined) {
      DbStats.encode(message.dbStats, writer.uint32(42).fork()).ldelim();
    }
    if (message.peerId !== "") {
      writer.uint32(50).string(message.peerId);
    }
    if (message.numShards !== 0) {
      writer.uint32(64).uint32(message.numShards);
    }
    for (const v of message.shardInfos) {
      ShardInfo.encode(v!, writer.uint32(74).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetInfoResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.version = reader.string();
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.dbStats = DbStats.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.peerId = reader.string();
          continue;
        case 8:
          if (tag != 64) {
            break;
          }

          message.numShards = reader.uint32();
          continue;
        case 9:
          if (tag != 74) {
            break;
          }

          message.shardInfos.push(ShardInfo.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetInfoResponse {
    return {
      version: isSet(object.version) ? String(object.version) : "",
      dbStats: isSet(object.dbStats) ? DbStats.fromJSON(object.dbStats) : undefined,
      peerId: isSet(object.peerId) ? String(object.peerId) : "",
      numShards: isSet(object.numShards) ? Number(object.numShards) : 0,
      shardInfos: Array.isArray(object?.shardInfos) ? object.shardInfos.map((e: any) => ShardInfo.fromJSON(e)) : [],
    };
  },

  toJSON(message: GetInfoResponse): unknown {
    const obj: any = {};
    message.version !== undefined && (obj.version = message.version);
    message.dbStats !== undefined && (obj.dbStats = message.dbStats ? DbStats.toJSON(message.dbStats) : undefined);
    message.peerId !== undefined && (obj.peerId = message.peerId);
    message.numShards !== undefined && (obj.numShards = Math.round(message.numShards));
    if (message.shardInfos) {
      obj.shardInfos = message.shardInfos.map((e) => e ? ShardInfo.toJSON(e) : undefined);
    } else {
      obj.shardInfos = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetInfoResponse>, I>>(base?: I): GetInfoResponse {
    return GetInfoResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetInfoResponse>, I>>(object: I): GetInfoResponse {
    const message = createBaseGetInfoResponse();
    message.version = object.version ?? "";
    message.dbStats = (object.dbStats !== undefined && object.dbStats !== null)
      ? DbStats.fromPartial(object.dbStats)
      : undefined;
    message.peerId = object.peerId ?? "";
    message.numShards = object.numShards ?? 0;
    message.shardInfos = object.shardInfos?.map((e) => ShardInfo.fromPartial(e)) || [];
    return message;
  },
};

function createBaseEventRequest(): EventRequest {
  return { id: 0, shardIndex: 0 };
}

export const EventRequest = {
  encode(message: EventRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== 0) {
      writer.uint32(8).uint64(message.id);
    }
    if (message.shardIndex !== 0) {
      writer.uint32(40).uint32(message.shardIndex);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.id = longToNumber(reader.uint64() as Long);
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.shardIndex = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventRequest {
    return {
      id: isSet(object.id) ? Number(object.id) : 0,
      shardIndex: isSet(object.shardIndex) ? Number(object.shardIndex) : 0,
    };
  },

  toJSON(message: EventRequest): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = Math.round(message.id));
    message.shardIndex !== undefined && (obj.shardIndex = Math.round(message.shardIndex));
    return obj;
  },

  create<I extends Exact<DeepPartial<EventRequest>, I>>(base?: I): EventRequest {
    return EventRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventRequest>, I>>(object: I): EventRequest {
    const message = createBaseEventRequest();
    message.id = object.id ?? 0;
    message.shardIndex = object.shardIndex ?? 0;
    return message;
  },
};

function createBaseFidRequest(): FidRequest {
  return { fid: 0, pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const FidRequest = {
  encode(message: FidRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(16).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(26).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(32).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FidRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFidRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FidRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: FidRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<FidRequest>, I>>(base?: I): FidRequest {
    return FidRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FidRequest>, I>>(object: I): FidRequest {
    const message = createBaseFidRequest();
    message.fid = object.fid ?? 0;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseFidTimestampRequest(): FidTimestampRequest {
  return {
    fid: 0,
    pageSize: undefined,
    pageToken: undefined,
    reverse: undefined,
    startTimestamp: undefined,
    stopTimestamp: undefined,
  };
}

export const FidTimestampRequest = {
  encode(message: FidTimestampRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(16).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(26).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(32).bool(message.reverse);
    }
    if (message.startTimestamp !== undefined) {
      writer.uint32(40).uint64(message.startTimestamp);
    }
    if (message.stopTimestamp !== undefined) {
      writer.uint32(48).uint64(message.stopTimestamp);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FidTimestampRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFidTimestampRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.reverse = reader.bool();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.startTimestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.stopTimestamp = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FidTimestampRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
      startTimestamp: isSet(object.startTimestamp) ? Number(object.startTimestamp) : undefined,
      stopTimestamp: isSet(object.stopTimestamp) ? Number(object.stopTimestamp) : undefined,
    };
  },

  toJSON(message: FidTimestampRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    message.startTimestamp !== undefined && (obj.startTimestamp = Math.round(message.startTimestamp));
    message.stopTimestamp !== undefined && (obj.stopTimestamp = Math.round(message.stopTimestamp));
    return obj;
  },

  create<I extends Exact<DeepPartial<FidTimestampRequest>, I>>(base?: I): FidTimestampRequest {
    return FidTimestampRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FidTimestampRequest>, I>>(object: I): FidTimestampRequest {
    const message = createBaseFidTimestampRequest();
    message.fid = object.fid ?? 0;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    message.startTimestamp = object.startTimestamp ?? undefined;
    message.stopTimestamp = object.stopTimestamp ?? undefined;
    return message;
  },
};

function createBaseFidsRequest(): FidsRequest {
  return { pageSize: undefined, pageToken: undefined, reverse: undefined, shardId: 0 };
}

export const FidsRequest = {
  encode(message: FidsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.pageSize !== undefined) {
      writer.uint32(8).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(18).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(24).bool(message.reverse);
    }
    if (message.shardId !== 0) {
      writer.uint32(32).uint32(message.shardId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FidsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFidsRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.reverse = reader.bool();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.shardId = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FidsRequest {
    return {
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
      shardId: isSet(object.shardId) ? Number(object.shardId) : 0,
    };
  },

  toJSON(message: FidsRequest): unknown {
    const obj: any = {};
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    message.shardId !== undefined && (obj.shardId = Math.round(message.shardId));
    return obj;
  },

  create<I extends Exact<DeepPartial<FidsRequest>, I>>(base?: I): FidsRequest {
    return FidsRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FidsRequest>, I>>(object: I): FidsRequest {
    const message = createBaseFidsRequest();
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    message.shardId = object.shardId ?? 0;
    return message;
  },
};

function createBaseFidsResponse(): FidsResponse {
  return { fids: [], nextPageToken: undefined };
}

export const FidsResponse = {
  encode(message: FidsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    writer.uint32(10).fork();
    for (const v of message.fids) {
      writer.uint64(v);
    }
    writer.ldelim();
    if (message.nextPageToken !== undefined) {
      writer.uint32(18).bytes(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FidsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFidsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag == 8) {
            message.fids.push(longToNumber(reader.uint64() as Long));
            continue;
          }

          if (tag == 10) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.fids.push(longToNumber(reader.uint64() as Long));
            }

            continue;
          }

          break;
        case 2:
          if (tag != 18) {
            break;
          }

          message.nextPageToken = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FidsResponse {
    return {
      fids: Array.isArray(object?.fids) ? object.fids.map((e: any) => Number(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? bytesFromBase64(object.nextPageToken) : undefined,
    };
  },

  toJSON(message: FidsResponse): unknown {
    const obj: any = {};
    if (message.fids) {
      obj.fids = message.fids.map((e) => Math.round(e));
    } else {
      obj.fids = [];
    }
    message.nextPageToken !== undefined &&
      (obj.nextPageToken = message.nextPageToken !== undefined ? base64FromBytes(message.nextPageToken) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<FidsResponse>, I>>(base?: I): FidsResponse {
    return FidsResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FidsResponse>, I>>(object: I): FidsResponse {
    const message = createBaseFidsResponse();
    message.fids = object.fids?.map((e) => e) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    return message;
  },
};

function createBaseMessagesResponse(): MessagesResponse {
  return { messages: [], nextPageToken: undefined };
}

export const MessagesResponse = {
  encode(message: MessagesResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.messages) {
      Message.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== undefined) {
      writer.uint32(18).bytes(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MessagesResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMessagesResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.messages.push(Message.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.nextPageToken = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MessagesResponse {
    return {
      messages: Array.isArray(object?.messages) ? object.messages.map((e: any) => Message.fromJSON(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? bytesFromBase64(object.nextPageToken) : undefined,
    };
  },

  toJSON(message: MessagesResponse): unknown {
    const obj: any = {};
    if (message.messages) {
      obj.messages = message.messages.map((e) => e ? Message.toJSON(e) : undefined);
    } else {
      obj.messages = [];
    }
    message.nextPageToken !== undefined &&
      (obj.nextPageToken = message.nextPageToken !== undefined ? base64FromBytes(message.nextPageToken) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<MessagesResponse>, I>>(base?: I): MessagesResponse {
    return MessagesResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MessagesResponse>, I>>(object: I): MessagesResponse {
    const message = createBaseMessagesResponse();
    message.messages = object.messages?.map((e) => Message.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    return message;
  },
};

function createBaseCastsByParentRequest(): CastsByParentRequest {
  return {
    parentCastId: undefined,
    parentUrl: undefined,
    pageSize: undefined,
    pageToken: undefined,
    reverse: undefined,
  };
}

export const CastsByParentRequest = {
  encode(message: CastsByParentRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.parentCastId !== undefined) {
      CastId.encode(message.parentCastId, writer.uint32(10).fork()).ldelim();
    }
    if (message.parentUrl !== undefined) {
      writer.uint32(42).string(message.parentUrl);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(16).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(26).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(32).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CastsByParentRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCastsByParentRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.parentCastId = CastId.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.parentUrl = reader.string();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): CastsByParentRequest {
    return {
      parentCastId: isSet(object.parentCastId) ? CastId.fromJSON(object.parentCastId) : undefined,
      parentUrl: isSet(object.parentUrl) ? String(object.parentUrl) : undefined,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: CastsByParentRequest): unknown {
    const obj: any = {};
    message.parentCastId !== undefined &&
      (obj.parentCastId = message.parentCastId ? CastId.toJSON(message.parentCastId) : undefined);
    message.parentUrl !== undefined && (obj.parentUrl = message.parentUrl);
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<CastsByParentRequest>, I>>(base?: I): CastsByParentRequest {
    return CastsByParentRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<CastsByParentRequest>, I>>(object: I): CastsByParentRequest {
    const message = createBaseCastsByParentRequest();
    message.parentCastId = (object.parentCastId !== undefined && object.parentCastId !== null)
      ? CastId.fromPartial(object.parentCastId)
      : undefined;
    message.parentUrl = object.parentUrl ?? undefined;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseReactionRequest(): ReactionRequest {
  return { fid: 0, reactionType: 0, targetCastId: undefined, targetUrl: undefined };
}

export const ReactionRequest = {
  encode(message: ReactionRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.reactionType !== 0) {
      writer.uint32(16).int32(message.reactionType);
    }
    if (message.targetCastId !== undefined) {
      CastId.encode(message.targetCastId, writer.uint32(26).fork()).ldelim();
    }
    if (message.targetUrl !== undefined) {
      writer.uint32(34).string(message.targetUrl);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ReactionRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReactionRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.reactionType = reader.int32() as any;
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.targetCastId = CastId.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.targetUrl = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ReactionRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      reactionType: isSet(object.reactionType) ? reactionTypeFromJSON(object.reactionType) : 0,
      targetCastId: isSet(object.targetCastId) ? CastId.fromJSON(object.targetCastId) : undefined,
      targetUrl: isSet(object.targetUrl) ? String(object.targetUrl) : undefined,
    };
  },

  toJSON(message: ReactionRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.reactionType !== undefined && (obj.reactionType = reactionTypeToJSON(message.reactionType));
    message.targetCastId !== undefined &&
      (obj.targetCastId = message.targetCastId ? CastId.toJSON(message.targetCastId) : undefined);
    message.targetUrl !== undefined && (obj.targetUrl = message.targetUrl);
    return obj;
  },

  create<I extends Exact<DeepPartial<ReactionRequest>, I>>(base?: I): ReactionRequest {
    return ReactionRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ReactionRequest>, I>>(object: I): ReactionRequest {
    const message = createBaseReactionRequest();
    message.fid = object.fid ?? 0;
    message.reactionType = object.reactionType ?? 0;
    message.targetCastId = (object.targetCastId !== undefined && object.targetCastId !== null)
      ? CastId.fromPartial(object.targetCastId)
      : undefined;
    message.targetUrl = object.targetUrl ?? undefined;
    return message;
  },
};

function createBaseReactionsByFidRequest(): ReactionsByFidRequest {
  return { fid: 0, reactionType: undefined, pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const ReactionsByFidRequest = {
  encode(message: ReactionsByFidRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.reactionType !== undefined) {
      writer.uint32(16).int32(message.reactionType);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(24).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(34).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(40).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ReactionsByFidRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReactionsByFidRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.reactionType = reader.int32() as any;
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ReactionsByFidRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      reactionType: isSet(object.reactionType) ? reactionTypeFromJSON(object.reactionType) : undefined,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: ReactionsByFidRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.reactionType !== undefined &&
      (obj.reactionType = message.reactionType !== undefined ? reactionTypeToJSON(message.reactionType) : undefined);
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<ReactionsByFidRequest>, I>>(base?: I): ReactionsByFidRequest {
    return ReactionsByFidRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ReactionsByFidRequest>, I>>(object: I): ReactionsByFidRequest {
    const message = createBaseReactionsByFidRequest();
    message.fid = object.fid ?? 0;
    message.reactionType = object.reactionType ?? undefined;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseReactionsByTargetRequest(): ReactionsByTargetRequest {
  return {
    targetCastId: undefined,
    targetUrl: undefined,
    reactionType: undefined,
    pageSize: undefined,
    pageToken: undefined,
    reverse: undefined,
  };
}

export const ReactionsByTargetRequest = {
  encode(message: ReactionsByTargetRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.targetCastId !== undefined) {
      CastId.encode(message.targetCastId, writer.uint32(10).fork()).ldelim();
    }
    if (message.targetUrl !== undefined) {
      writer.uint32(50).string(message.targetUrl);
    }
    if (message.reactionType !== undefined) {
      writer.uint32(16).int32(message.reactionType);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(24).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(34).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(40).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ReactionsByTargetRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReactionsByTargetRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.targetCastId = CastId.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.targetUrl = reader.string();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.reactionType = reader.int32() as any;
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ReactionsByTargetRequest {
    return {
      targetCastId: isSet(object.targetCastId) ? CastId.fromJSON(object.targetCastId) : undefined,
      targetUrl: isSet(object.targetUrl) ? String(object.targetUrl) : undefined,
      reactionType: isSet(object.reactionType) ? reactionTypeFromJSON(object.reactionType) : undefined,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: ReactionsByTargetRequest): unknown {
    const obj: any = {};
    message.targetCastId !== undefined &&
      (obj.targetCastId = message.targetCastId ? CastId.toJSON(message.targetCastId) : undefined);
    message.targetUrl !== undefined && (obj.targetUrl = message.targetUrl);
    message.reactionType !== undefined &&
      (obj.reactionType = message.reactionType !== undefined ? reactionTypeToJSON(message.reactionType) : undefined);
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<ReactionsByTargetRequest>, I>>(base?: I): ReactionsByTargetRequest {
    return ReactionsByTargetRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ReactionsByTargetRequest>, I>>(object: I): ReactionsByTargetRequest {
    const message = createBaseReactionsByTargetRequest();
    message.targetCastId = (object.targetCastId !== undefined && object.targetCastId !== null)
      ? CastId.fromPartial(object.targetCastId)
      : undefined;
    message.targetUrl = object.targetUrl ?? undefined;
    message.reactionType = object.reactionType ?? undefined;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseUserDataRequest(): UserDataRequest {
  return { fid: 0, userDataType: 0 };
}

export const UserDataRequest = {
  encode(message: UserDataRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.userDataType !== 0) {
      writer.uint32(16).int32(message.userDataType);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UserDataRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUserDataRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.userDataType = reader.int32() as any;
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UserDataRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      userDataType: isSet(object.userDataType) ? userDataTypeFromJSON(object.userDataType) : 0,
    };
  },

  toJSON(message: UserDataRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.userDataType !== undefined && (obj.userDataType = userDataTypeToJSON(message.userDataType));
    return obj;
  },

  create<I extends Exact<DeepPartial<UserDataRequest>, I>>(base?: I): UserDataRequest {
    return UserDataRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<UserDataRequest>, I>>(object: I): UserDataRequest {
    const message = createBaseUserDataRequest();
    message.fid = object.fid ?? 0;
    message.userDataType = object.userDataType ?? 0;
    return message;
  },
};

function createBaseOnChainEventRequest(): OnChainEventRequest {
  return { fid: 0, eventType: 0, pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const OnChainEventRequest = {
  encode(message: OnChainEventRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.eventType !== 0) {
      writer.uint32(16).int32(message.eventType);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(24).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(34).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(40).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OnChainEventRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOnChainEventRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.eventType = reader.int32() as any;
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): OnChainEventRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      eventType: isSet(object.eventType) ? onChainEventTypeFromJSON(object.eventType) : 0,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: OnChainEventRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.eventType !== undefined && (obj.eventType = onChainEventTypeToJSON(message.eventType));
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<OnChainEventRequest>, I>>(base?: I): OnChainEventRequest {
    return OnChainEventRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<OnChainEventRequest>, I>>(object: I): OnChainEventRequest {
    const message = createBaseOnChainEventRequest();
    message.fid = object.fid ?? 0;
    message.eventType = object.eventType ?? 0;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseOnChainEventResponse(): OnChainEventResponse {
  return { events: [], nextPageToken: undefined };
}

export const OnChainEventResponse = {
  encode(message: OnChainEventResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.events) {
      OnChainEvent.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== undefined) {
      writer.uint32(18).bytes(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OnChainEventResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOnChainEventResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.events.push(OnChainEvent.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.nextPageToken = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): OnChainEventResponse {
    return {
      events: Array.isArray(object?.events) ? object.events.map((e: any) => OnChainEvent.fromJSON(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? bytesFromBase64(object.nextPageToken) : undefined,
    };
  },

  toJSON(message: OnChainEventResponse): unknown {
    const obj: any = {};
    if (message.events) {
      obj.events = message.events.map((e) => e ? OnChainEvent.toJSON(e) : undefined);
    } else {
      obj.events = [];
    }
    message.nextPageToken !== undefined &&
      (obj.nextPageToken = message.nextPageToken !== undefined ? base64FromBytes(message.nextPageToken) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<OnChainEventResponse>, I>>(base?: I): OnChainEventResponse {
    return OnChainEventResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<OnChainEventResponse>, I>>(object: I): OnChainEventResponse {
    const message = createBaseOnChainEventResponse();
    message.events = object.events?.map((e) => OnChainEvent.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    return message;
  },
};

function createBaseTierDetails(): TierDetails {
  return { tierType: 0, expiresAt: 0 };
}

export const TierDetails = {
  encode(message: TierDetails, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.tierType !== 0) {
      writer.uint32(8).int32(message.tierType);
    }
    if (message.expiresAt !== 0) {
      writer.uint32(16).uint64(message.expiresAt);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TierDetails {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTierDetails();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.tierType = reader.int32() as any;
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.expiresAt = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TierDetails {
    return {
      tierType: isSet(object.tierType) ? tierTypeFromJSON(object.tierType) : 0,
      expiresAt: isSet(object.expiresAt) ? Number(object.expiresAt) : 0,
    };
  },

  toJSON(message: TierDetails): unknown {
    const obj: any = {};
    message.tierType !== undefined && (obj.tierType = tierTypeToJSON(message.tierType));
    message.expiresAt !== undefined && (obj.expiresAt = Math.round(message.expiresAt));
    return obj;
  },

  create<I extends Exact<DeepPartial<TierDetails>, I>>(base?: I): TierDetails {
    return TierDetails.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TierDetails>, I>>(object: I): TierDetails {
    const message = createBaseTierDetails();
    message.tierType = object.tierType ?? 0;
    message.expiresAt = object.expiresAt ?? 0;
    return message;
  },
};

function createBaseStorageLimitsResponse(): StorageLimitsResponse {
  return { limits: [], units: 0, unitDetails: [], tierSubscriptions: [] };
}

export const StorageLimitsResponse = {
  encode(message: StorageLimitsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.limits) {
      StorageLimit.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.units !== 0) {
      writer.uint32(16).uint32(message.units);
    }
    for (const v of message.unitDetails) {
      StorageUnitDetails.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.tierSubscriptions) {
      TierDetails.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StorageLimitsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStorageLimitsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.limits.push(StorageLimit.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.units = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.unitDetails.push(StorageUnitDetails.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.tierSubscriptions.push(TierDetails.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): StorageLimitsResponse {
    return {
      limits: Array.isArray(object?.limits) ? object.limits.map((e: any) => StorageLimit.fromJSON(e)) : [],
      units: isSet(object.units) ? Number(object.units) : 0,
      unitDetails: Array.isArray(object?.unitDetails)
        ? object.unitDetails.map((e: any) => StorageUnitDetails.fromJSON(e))
        : [],
      tierSubscriptions: Array.isArray(object?.tierSubscriptions)
        ? object.tierSubscriptions.map((e: any) => TierDetails.fromJSON(e))
        : [],
    };
  },

  toJSON(message: StorageLimitsResponse): unknown {
    const obj: any = {};
    if (message.limits) {
      obj.limits = message.limits.map((e) => e ? StorageLimit.toJSON(e) : undefined);
    } else {
      obj.limits = [];
    }
    message.units !== undefined && (obj.units = Math.round(message.units));
    if (message.unitDetails) {
      obj.unitDetails = message.unitDetails.map((e) => e ? StorageUnitDetails.toJSON(e) : undefined);
    } else {
      obj.unitDetails = [];
    }
    if (message.tierSubscriptions) {
      obj.tierSubscriptions = message.tierSubscriptions.map((e) => e ? TierDetails.toJSON(e) : undefined);
    } else {
      obj.tierSubscriptions = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<StorageLimitsResponse>, I>>(base?: I): StorageLimitsResponse {
    return StorageLimitsResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<StorageLimitsResponse>, I>>(object: I): StorageLimitsResponse {
    const message = createBaseStorageLimitsResponse();
    message.limits = object.limits?.map((e) => StorageLimit.fromPartial(e)) || [];
    message.units = object.units ?? 0;
    message.unitDetails = object.unitDetails?.map((e) => StorageUnitDetails.fromPartial(e)) || [];
    message.tierSubscriptions = object.tierSubscriptions?.map((e) => TierDetails.fromPartial(e)) || [];
    return message;
  },
};

function createBaseStorageUnitDetails(): StorageUnitDetails {
  return { unitType: 0, unitSize: 0 };
}

export const StorageUnitDetails = {
  encode(message: StorageUnitDetails, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.unitType !== 0) {
      writer.uint32(8).int32(message.unitType);
    }
    if (message.unitSize !== 0) {
      writer.uint32(16).uint32(message.unitSize);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StorageUnitDetails {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStorageUnitDetails();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.unitType = reader.int32() as any;
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.unitSize = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): StorageUnitDetails {
    return {
      unitType: isSet(object.unitType) ? storageUnitTypeFromJSON(object.unitType) : 0,
      unitSize: isSet(object.unitSize) ? Number(object.unitSize) : 0,
    };
  },

  toJSON(message: StorageUnitDetails): unknown {
    const obj: any = {};
    message.unitType !== undefined && (obj.unitType = storageUnitTypeToJSON(message.unitType));
    message.unitSize !== undefined && (obj.unitSize = Math.round(message.unitSize));
    return obj;
  },

  create<I extends Exact<DeepPartial<StorageUnitDetails>, I>>(base?: I): StorageUnitDetails {
    return StorageUnitDetails.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<StorageUnitDetails>, I>>(object: I): StorageUnitDetails {
    const message = createBaseStorageUnitDetails();
    message.unitType = object.unitType ?? 0;
    message.unitSize = object.unitSize ?? 0;
    return message;
  },
};

function createBaseStorageLimit(): StorageLimit {
  return { storeType: 0, name: "", limit: 0, used: 0, earliestTimestamp: 0, earliestHash: new Uint8Array() };
}

export const StorageLimit = {
  encode(message: StorageLimit, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.storeType !== 0) {
      writer.uint32(8).int32(message.storeType);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.limit !== 0) {
      writer.uint32(24).uint64(message.limit);
    }
    if (message.used !== 0) {
      writer.uint32(32).uint64(message.used);
    }
    if (message.earliestTimestamp !== 0) {
      writer.uint32(40).uint64(message.earliestTimestamp);
    }
    if (message.earliestHash.length !== 0) {
      writer.uint32(50).bytes(message.earliestHash);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StorageLimit {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStorageLimit();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.storeType = reader.int32() as any;
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.name = reader.string();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.limit = longToNumber(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.used = longToNumber(reader.uint64() as Long);
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.earliestTimestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.earliestHash = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): StorageLimit {
    return {
      storeType: isSet(object.storeType) ? storeTypeFromJSON(object.storeType) : 0,
      name: isSet(object.name) ? String(object.name) : "",
      limit: isSet(object.limit) ? Number(object.limit) : 0,
      used: isSet(object.used) ? Number(object.used) : 0,
      earliestTimestamp: isSet(object.earliestTimestamp) ? Number(object.earliestTimestamp) : 0,
      earliestHash: isSet(object.earliestHash) ? bytesFromBase64(object.earliestHash) : new Uint8Array(),
    };
  },

  toJSON(message: StorageLimit): unknown {
    const obj: any = {};
    message.storeType !== undefined && (obj.storeType = storeTypeToJSON(message.storeType));
    message.name !== undefined && (obj.name = message.name);
    message.limit !== undefined && (obj.limit = Math.round(message.limit));
    message.used !== undefined && (obj.used = Math.round(message.used));
    message.earliestTimestamp !== undefined && (obj.earliestTimestamp = Math.round(message.earliestTimestamp));
    message.earliestHash !== undefined &&
      (obj.earliestHash = base64FromBytes(
        message.earliestHash !== undefined ? message.earliestHash : new Uint8Array(),
      ));
    return obj;
  },

  create<I extends Exact<DeepPartial<StorageLimit>, I>>(base?: I): StorageLimit {
    return StorageLimit.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<StorageLimit>, I>>(object: I): StorageLimit {
    const message = createBaseStorageLimit();
    message.storeType = object.storeType ?? 0;
    message.name = object.name ?? "";
    message.limit = object.limit ?? 0;
    message.used = object.used ?? 0;
    message.earliestTimestamp = object.earliestTimestamp ?? 0;
    message.earliestHash = object.earliestHash ?? new Uint8Array();
    return message;
  },
};

function createBaseUsernameProofRequest(): UsernameProofRequest {
  return { name: new Uint8Array() };
}

export const UsernameProofRequest = {
  encode(message: UsernameProofRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name.length !== 0) {
      writer.uint32(10).bytes(message.name);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UsernameProofRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUsernameProofRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.name = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UsernameProofRequest {
    return { name: isSet(object.name) ? bytesFromBase64(object.name) : new Uint8Array() };
  },

  toJSON(message: UsernameProofRequest): unknown {
    const obj: any = {};
    message.name !== undefined &&
      (obj.name = base64FromBytes(message.name !== undefined ? message.name : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<UsernameProofRequest>, I>>(base?: I): UsernameProofRequest {
    return UsernameProofRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<UsernameProofRequest>, I>>(object: I): UsernameProofRequest {
    const message = createBaseUsernameProofRequest();
    message.name = object.name ?? new Uint8Array();
    return message;
  },
};

function createBaseUsernameProofsResponse(): UsernameProofsResponse {
  return { proofs: [] };
}

export const UsernameProofsResponse = {
  encode(message: UsernameProofsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.proofs) {
      UserNameProof.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UsernameProofsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUsernameProofsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.proofs.push(UserNameProof.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UsernameProofsResponse {
    return { proofs: Array.isArray(object?.proofs) ? object.proofs.map((e: any) => UserNameProof.fromJSON(e)) : [] };
  },

  toJSON(message: UsernameProofsResponse): unknown {
    const obj: any = {};
    if (message.proofs) {
      obj.proofs = message.proofs.map((e) => e ? UserNameProof.toJSON(e) : undefined);
    } else {
      obj.proofs = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<UsernameProofsResponse>, I>>(base?: I): UsernameProofsResponse {
    return UsernameProofsResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<UsernameProofsResponse>, I>>(object: I): UsernameProofsResponse {
    const message = createBaseUsernameProofsResponse();
    message.proofs = object.proofs?.map((e) => UserNameProof.fromPartial(e)) || [];
    return message;
  },
};

function createBaseValidationResponse(): ValidationResponse {
  return { valid: false, message: undefined };
}

export const ValidationResponse = {
  encode(message: ValidationResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.valid === true) {
      writer.uint32(8).bool(message.valid);
    }
    if (message.message !== undefined) {
      Message.encode(message.message, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ValidationResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseValidationResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.valid = reader.bool();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.message = Message.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ValidationResponse {
    return {
      valid: isSet(object.valid) ? Boolean(object.valid) : false,
      message: isSet(object.message) ? Message.fromJSON(object.message) : undefined,
    };
  },

  toJSON(message: ValidationResponse): unknown {
    const obj: any = {};
    message.valid !== undefined && (obj.valid = message.valid);
    message.message !== undefined && (obj.message = message.message ? Message.toJSON(message.message) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ValidationResponse>, I>>(base?: I): ValidationResponse {
    return ValidationResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ValidationResponse>, I>>(object: I): ValidationResponse {
    const message = createBaseValidationResponse();
    message.valid = object.valid ?? false;
    message.message = (object.message !== undefined && object.message !== null)
      ? Message.fromPartial(object.message)
      : undefined;
    return message;
  },
};

function createBaseVerificationRequest(): VerificationRequest {
  return { fid: 0, address: new Uint8Array() };
}

export const VerificationRequest = {
  encode(message: VerificationRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.address.length !== 0) {
      writer.uint32(18).bytes(message.address);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VerificationRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVerificationRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.address = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): VerificationRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      address: isSet(object.address) ? bytesFromBase64(object.address) : new Uint8Array(),
    };
  },

  toJSON(message: VerificationRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.address !== undefined &&
      (obj.address = base64FromBytes(message.address !== undefined ? message.address : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<VerificationRequest>, I>>(base?: I): VerificationRequest {
    return VerificationRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<VerificationRequest>, I>>(object: I): VerificationRequest {
    const message = createBaseVerificationRequest();
    message.fid = object.fid ?? 0;
    message.address = object.address ?? new Uint8Array();
    return message;
  },
};

function createBaseSignerRequest(): SignerRequest {
  return { fid: 0, signer: new Uint8Array() };
}

export const SignerRequest = {
  encode(message: SignerRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.signer.length !== 0) {
      writer.uint32(18).bytes(message.signer);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SignerRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignerRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.signer = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SignerRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      signer: isSet(object.signer) ? bytesFromBase64(object.signer) : new Uint8Array(),
    };
  },

  toJSON(message: SignerRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.signer !== undefined &&
      (obj.signer = base64FromBytes(message.signer !== undefined ? message.signer : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<SignerRequest>, I>>(base?: I): SignerRequest {
    return SignerRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SignerRequest>, I>>(object: I): SignerRequest {
    const message = createBaseSignerRequest();
    message.fid = object.fid ?? 0;
    message.signer = object.signer ?? new Uint8Array();
    return message;
  },
};

function createBaseLinkRequest(): LinkRequest {
  return { fid: 0, linkType: "", targetFid: undefined };
}

export const LinkRequest = {
  encode(message: LinkRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.linkType !== "") {
      writer.uint32(18).string(message.linkType);
    }
    if (message.targetFid !== undefined) {
      writer.uint32(24).uint64(message.targetFid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LinkRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLinkRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.linkType = reader.string();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.targetFid = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LinkRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      linkType: isSet(object.linkType) ? String(object.linkType) : "",
      targetFid: isSet(object.targetFid) ? Number(object.targetFid) : undefined,
    };
  },

  toJSON(message: LinkRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.linkType !== undefined && (obj.linkType = message.linkType);
    message.targetFid !== undefined && (obj.targetFid = Math.round(message.targetFid));
    return obj;
  },

  create<I extends Exact<DeepPartial<LinkRequest>, I>>(base?: I): LinkRequest {
    return LinkRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<LinkRequest>, I>>(object: I): LinkRequest {
    const message = createBaseLinkRequest();
    message.fid = object.fid ?? 0;
    message.linkType = object.linkType ?? "";
    message.targetFid = object.targetFid ?? undefined;
    return message;
  },
};

function createBaseLinksByFidRequest(): LinksByFidRequest {
  return { fid: 0, linkType: undefined, pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const LinksByFidRequest = {
  encode(message: LinksByFidRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.linkType !== undefined) {
      writer.uint32(18).string(message.linkType);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(24).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(34).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(40).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LinksByFidRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLinksByFidRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.linkType = reader.string();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LinksByFidRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      linkType: isSet(object.linkType) ? String(object.linkType) : undefined,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: LinksByFidRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.linkType !== undefined && (obj.linkType = message.linkType);
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<LinksByFidRequest>, I>>(base?: I): LinksByFidRequest {
    return LinksByFidRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<LinksByFidRequest>, I>>(object: I): LinksByFidRequest {
    const message = createBaseLinksByFidRequest();
    message.fid = object.fid ?? 0;
    message.linkType = object.linkType ?? undefined;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseLinksByTargetRequest(): LinksByTargetRequest {
  return { targetFid: undefined, linkType: undefined, pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const LinksByTargetRequest = {
  encode(message: LinksByTargetRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.targetFid !== undefined) {
      writer.uint32(8).uint64(message.targetFid);
    }
    if (message.linkType !== undefined) {
      writer.uint32(18).string(message.linkType);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(24).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(34).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(40).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LinksByTargetRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLinksByTargetRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.targetFid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.linkType = reader.string();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LinksByTargetRequest {
    return {
      targetFid: isSet(object.targetFid) ? Number(object.targetFid) : undefined,
      linkType: isSet(object.linkType) ? String(object.linkType) : undefined,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: LinksByTargetRequest): unknown {
    const obj: any = {};
    message.targetFid !== undefined && (obj.targetFid = Math.round(message.targetFid));
    message.linkType !== undefined && (obj.linkType = message.linkType);
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<LinksByTargetRequest>, I>>(base?: I): LinksByTargetRequest {
    return LinksByTargetRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<LinksByTargetRequest>, I>>(object: I): LinksByTargetRequest {
    const message = createBaseLinksByTargetRequest();
    message.targetFid = object.targetFid ?? undefined;
    message.linkType = object.linkType ?? undefined;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseIdRegistryEventByAddressRequest(): IdRegistryEventByAddressRequest {
  return { address: new Uint8Array() };
}

export const IdRegistryEventByAddressRequest = {
  encode(message: IdRegistryEventByAddressRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address.length !== 0) {
      writer.uint32(10).bytes(message.address);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): IdRegistryEventByAddressRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseIdRegistryEventByAddressRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.address = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): IdRegistryEventByAddressRequest {
    return { address: isSet(object.address) ? bytesFromBase64(object.address) : new Uint8Array() };
  },

  toJSON(message: IdRegistryEventByAddressRequest): unknown {
    const obj: any = {};
    message.address !== undefined &&
      (obj.address = base64FromBytes(message.address !== undefined ? message.address : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<IdRegistryEventByAddressRequest>, I>>(base?: I): IdRegistryEventByAddressRequest {
    return IdRegistryEventByAddressRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<IdRegistryEventByAddressRequest>, I>>(
    object: I,
  ): IdRegistryEventByAddressRequest {
    const message = createBaseIdRegistryEventByAddressRequest();
    message.address = object.address ?? new Uint8Array();
    return message;
  },
};

function createBaseSubmitBulkMessagesRequest(): SubmitBulkMessagesRequest {
  return { messages: [] };
}

export const SubmitBulkMessagesRequest = {
  encode(message: SubmitBulkMessagesRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.messages) {
      Message.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubmitBulkMessagesRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubmitBulkMessagesRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.messages.push(Message.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SubmitBulkMessagesRequest {
    return { messages: Array.isArray(object?.messages) ? object.messages.map((e: any) => Message.fromJSON(e)) : [] };
  },

  toJSON(message: SubmitBulkMessagesRequest): unknown {
    const obj: any = {};
    if (message.messages) {
      obj.messages = message.messages.map((e) => e ? Message.toJSON(e) : undefined);
    } else {
      obj.messages = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SubmitBulkMessagesRequest>, I>>(base?: I): SubmitBulkMessagesRequest {
    return SubmitBulkMessagesRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubmitBulkMessagesRequest>, I>>(object: I): SubmitBulkMessagesRequest {
    const message = createBaseSubmitBulkMessagesRequest();
    message.messages = object.messages?.map((e) => Message.fromPartial(e)) || [];
    return message;
  },
};

function createBaseMessageError(): MessageError {
  return { hash: new Uint8Array(), errCode: "", message: "" };
}

export const MessageError = {
  encode(message: MessageError, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.hash.length !== 0) {
      writer.uint32(10).bytes(message.hash);
    }
    if (message.errCode !== "") {
      writer.uint32(18).string(message.errCode);
    }
    if (message.message !== "") {
      writer.uint32(26).string(message.message);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MessageError {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMessageError();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.hash = reader.bytes();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.errCode = reader.string();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.message = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MessageError {
    return {
      hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(),
      errCode: isSet(object.errCode) ? String(object.errCode) : "",
      message: isSet(object.message) ? String(object.message) : "",
    };
  },

  toJSON(message: MessageError): unknown {
    const obj: any = {};
    message.hash !== undefined &&
      (obj.hash = base64FromBytes(message.hash !== undefined ? message.hash : new Uint8Array()));
    message.errCode !== undefined && (obj.errCode = message.errCode);
    message.message !== undefined && (obj.message = message.message);
    return obj;
  },

  create<I extends Exact<DeepPartial<MessageError>, I>>(base?: I): MessageError {
    return MessageError.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MessageError>, I>>(object: I): MessageError {
    const message = createBaseMessageError();
    message.hash = object.hash ?? new Uint8Array();
    message.errCode = object.errCode ?? "";
    message.message = object.message ?? "";
    return message;
  },
};

function createBaseBulkMessageResponse(): BulkMessageResponse {
  return { message: undefined, messageError: undefined };
}

export const BulkMessageResponse = {
  encode(message: BulkMessageResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.message !== undefined) {
      Message.encode(message.message, writer.uint32(10).fork()).ldelim();
    }
    if (message.messageError !== undefined) {
      MessageError.encode(message.messageError, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BulkMessageResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBulkMessageResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.message = Message.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.messageError = MessageError.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BulkMessageResponse {
    return {
      message: isSet(object.message) ? Message.fromJSON(object.message) : undefined,
      messageError: isSet(object.messageError) ? MessageError.fromJSON(object.messageError) : undefined,
    };
  },

  toJSON(message: BulkMessageResponse): unknown {
    const obj: any = {};
    message.message !== undefined && (obj.message = message.message ? Message.toJSON(message.message) : undefined);
    message.messageError !== undefined &&
      (obj.messageError = message.messageError ? MessageError.toJSON(message.messageError) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<BulkMessageResponse>, I>>(base?: I): BulkMessageResponse {
    return BulkMessageResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<BulkMessageResponse>, I>>(object: I): BulkMessageResponse {
    const message = createBaseBulkMessageResponse();
    message.message = (object.message !== undefined && object.message !== null)
      ? Message.fromPartial(object.message)
      : undefined;
    message.messageError = (object.messageError !== undefined && object.messageError !== null)
      ? MessageError.fromPartial(object.messageError)
      : undefined;
    return message;
  },
};

function createBaseSubmitBulkMessagesResponse(): SubmitBulkMessagesResponse {
  return { messages: [] };
}

export const SubmitBulkMessagesResponse = {
  encode(message: SubmitBulkMessagesResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.messages) {
      BulkMessageResponse.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubmitBulkMessagesResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubmitBulkMessagesResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.messages.push(BulkMessageResponse.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SubmitBulkMessagesResponse {
    return {
      messages: Array.isArray(object?.messages) ? object.messages.map((e: any) => BulkMessageResponse.fromJSON(e)) : [],
    };
  },

  toJSON(message: SubmitBulkMessagesResponse): unknown {
    const obj: any = {};
    if (message.messages) {
      obj.messages = message.messages.map((e) => e ? BulkMessageResponse.toJSON(e) : undefined);
    } else {
      obj.messages = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SubmitBulkMessagesResponse>, I>>(base?: I): SubmitBulkMessagesResponse {
    return SubmitBulkMessagesResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubmitBulkMessagesResponse>, I>>(object: I): SubmitBulkMessagesResponse {
    const message = createBaseSubmitBulkMessagesResponse();
    message.messages = object.messages?.map((e) => BulkMessageResponse.fromPartial(e)) || [];
    return message;
  },
};

function createBaseTrieNodeMetadataRequest(): TrieNodeMetadataRequest {
  return { shardId: 0, prefix: new Uint8Array() };
}

export const TrieNodeMetadataRequest = {
  encode(message: TrieNodeMetadataRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.shardId !== 0) {
      writer.uint32(8).uint32(message.shardId);
    }
    if (message.prefix.length !== 0) {
      writer.uint32(18).bytes(message.prefix);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TrieNodeMetadataRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTrieNodeMetadataRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.shardId = reader.uint32();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.prefix = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TrieNodeMetadataRequest {
    return {
      shardId: isSet(object.shardId) ? Number(object.shardId) : 0,
      prefix: isSet(object.prefix) ? bytesFromBase64(object.prefix) : new Uint8Array(),
    };
  },

  toJSON(message: TrieNodeMetadataRequest): unknown {
    const obj: any = {};
    message.shardId !== undefined && (obj.shardId = Math.round(message.shardId));
    message.prefix !== undefined &&
      (obj.prefix = base64FromBytes(message.prefix !== undefined ? message.prefix : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<TrieNodeMetadataRequest>, I>>(base?: I): TrieNodeMetadataRequest {
    return TrieNodeMetadataRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TrieNodeMetadataRequest>, I>>(object: I): TrieNodeMetadataRequest {
    const message = createBaseTrieNodeMetadataRequest();
    message.shardId = object.shardId ?? 0;
    message.prefix = object.prefix ?? new Uint8Array();
    return message;
  },
};

function createBaseTrieNodeMetadataResponse(): TrieNodeMetadataResponse {
  return { prefix: new Uint8Array(), numMessages: 0, hash: "", children: [] };
}

export const TrieNodeMetadataResponse = {
  encode(message: TrieNodeMetadataResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.prefix.length !== 0) {
      writer.uint32(10).bytes(message.prefix);
    }
    if (message.numMessages !== 0) {
      writer.uint32(16).uint64(message.numMessages);
    }
    if (message.hash !== "") {
      writer.uint32(26).string(message.hash);
    }
    for (const v of message.children) {
      TrieNodeMetadataResponse.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TrieNodeMetadataResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTrieNodeMetadataResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.prefix = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.numMessages = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.hash = reader.string();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.children.push(TrieNodeMetadataResponse.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TrieNodeMetadataResponse {
    return {
      prefix: isSet(object.prefix) ? bytesFromBase64(object.prefix) : new Uint8Array(),
      numMessages: isSet(object.numMessages) ? Number(object.numMessages) : 0,
      hash: isSet(object.hash) ? String(object.hash) : "",
      children: Array.isArray(object?.children)
        ? object.children.map((e: any) => TrieNodeMetadataResponse.fromJSON(e))
        : [],
    };
  },

  toJSON(message: TrieNodeMetadataResponse): unknown {
    const obj: any = {};
    message.prefix !== undefined &&
      (obj.prefix = base64FromBytes(message.prefix !== undefined ? message.prefix : new Uint8Array()));
    message.numMessages !== undefined && (obj.numMessages = Math.round(message.numMessages));
    message.hash !== undefined && (obj.hash = message.hash);
    if (message.children) {
      obj.children = message.children.map((e) => e ? TrieNodeMetadataResponse.toJSON(e) : undefined);
    } else {
      obj.children = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<TrieNodeMetadataResponse>, I>>(base?: I): TrieNodeMetadataResponse {
    return TrieNodeMetadataResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TrieNodeMetadataResponse>, I>>(object: I): TrieNodeMetadataResponse {
    const message = createBaseTrieNodeMetadataResponse();
    message.prefix = object.prefix ?? new Uint8Array();
    message.numMessages = object.numMessages ?? 0;
    message.hash = object.hash ?? "";
    message.children = object.children?.map((e) => TrieNodeMetadataResponse.fromPartial(e)) || [];
    return message;
  },
};

function createBaseEventsRequest(): EventsRequest {
  return {
    startId: 0,
    shardIndex: undefined,
    stopId: undefined,
    pageSize: undefined,
    pageToken: undefined,
    reverse: undefined,
  };
}

export const EventsRequest = {
  encode(message: EventsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.startId !== 0) {
      writer.uint32(8).uint64(message.startId);
    }
    if (message.shardIndex !== undefined) {
      writer.uint32(16).uint32(message.shardIndex);
    }
    if (message.stopId !== undefined) {
      writer.uint32(24).uint64(message.stopId);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(32).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(42).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(48).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventsRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.startId = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.shardIndex = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.stopId = longToNumber(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventsRequest {
    return {
      startId: isSet(object.startId) ? Number(object.startId) : 0,
      shardIndex: isSet(object.shardIndex) ? Number(object.shardIndex) : undefined,
      stopId: isSet(object.stopId) ? Number(object.stopId) : undefined,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: EventsRequest): unknown {
    const obj: any = {};
    message.startId !== undefined && (obj.startId = Math.round(message.startId));
    message.shardIndex !== undefined && (obj.shardIndex = Math.round(message.shardIndex));
    message.stopId !== undefined && (obj.stopId = Math.round(message.stopId));
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<EventsRequest>, I>>(base?: I): EventsRequest {
    return EventsRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventsRequest>, I>>(object: I): EventsRequest {
    const message = createBaseEventsRequest();
    message.startId = object.startId ?? 0;
    message.shardIndex = object.shardIndex ?? undefined;
    message.stopId = object.stopId ?? undefined;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseEventsResponse(): EventsResponse {
  return { events: [], nextPageToken: undefined };
}

export const EventsResponse = {
  encode(message: EventsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.events) {
      HubEvent.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== undefined) {
      writer.uint32(18).bytes(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.events.push(HubEvent.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.nextPageToken = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventsResponse {
    return {
      events: Array.isArray(object?.events) ? object.events.map((e: any) => HubEvent.fromJSON(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? bytesFromBase64(object.nextPageToken) : undefined,
    };
  },

  toJSON(message: EventsResponse): unknown {
    const obj: any = {};
    if (message.events) {
      obj.events = message.events.map((e) => e ? HubEvent.toJSON(e) : undefined);
    } else {
      obj.events = [];
    }
    message.nextPageToken !== undefined &&
      (obj.nextPageToken = message.nextPageToken !== undefined ? base64FromBytes(message.nextPageToken) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<EventsResponse>, I>>(base?: I): EventsResponse {
    return EventsResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventsResponse>, I>>(object: I): EventsResponse {
    const message = createBaseEventsResponse();
    message.events = object.events?.map((e) => HubEvent.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    return message;
  },
};

function createBaseFidAddressTypeRequest(): FidAddressTypeRequest {
  return { fid: 0, address: new Uint8Array() };
}

export const FidAddressTypeRequest = {
  encode(message: FidAddressTypeRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.address.length !== 0) {
      writer.uint32(18).bytes(message.address);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FidAddressTypeRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFidAddressTypeRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.address = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FidAddressTypeRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      address: isSet(object.address) ? bytesFromBase64(object.address) : new Uint8Array(),
    };
  },

  toJSON(message: FidAddressTypeRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.address !== undefined &&
      (obj.address = base64FromBytes(message.address !== undefined ? message.address : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<FidAddressTypeRequest>, I>>(base?: I): FidAddressTypeRequest {
    return FidAddressTypeRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FidAddressTypeRequest>, I>>(object: I): FidAddressTypeRequest {
    const message = createBaseFidAddressTypeRequest();
    message.fid = object.fid ?? 0;
    message.address = object.address ?? new Uint8Array();
    return message;
  },
};

function createBaseFidAddressTypeResponse(): FidAddressTypeResponse {
  return { isCustody: false, isAuth: false, isVerified: false };
}

export const FidAddressTypeResponse = {
  encode(message: FidAddressTypeResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.isCustody === true) {
      writer.uint32(8).bool(message.isCustody);
    }
    if (message.isAuth === true) {
      writer.uint32(16).bool(message.isAuth);
    }
    if (message.isVerified === true) {
      writer.uint32(24).bool(message.isVerified);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FidAddressTypeResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFidAddressTypeResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.isCustody = reader.bool();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.isAuth = reader.bool();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.isVerified = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FidAddressTypeResponse {
    return {
      isCustody: isSet(object.isCustody) ? Boolean(object.isCustody) : false,
      isAuth: isSet(object.isAuth) ? Boolean(object.isAuth) : false,
      isVerified: isSet(object.isVerified) ? Boolean(object.isVerified) : false,
    };
  },

  toJSON(message: FidAddressTypeResponse): unknown {
    const obj: any = {};
    message.isCustody !== undefined && (obj.isCustody = message.isCustody);
    message.isAuth !== undefined && (obj.isAuth = message.isAuth);
    message.isVerified !== undefined && (obj.isVerified = message.isVerified);
    return obj;
  },

  create<I extends Exact<DeepPartial<FidAddressTypeResponse>, I>>(base?: I): FidAddressTypeResponse {
    return FidAddressTypeResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FidAddressTypeResponse>, I>>(object: I): FidAddressTypeResponse {
    const message = createBaseFidAddressTypeResponse();
    message.isCustody = object.isCustody ?? false;
    message.isAuth = object.isAuth ?? false;
    message.isVerified = object.isVerified ?? false;
    return message;
  },
};

function createBaseGetConnectedPeersRequest(): GetConnectedPeersRequest {
  return {};
}

export const GetConnectedPeersRequest = {
  encode(_: GetConnectedPeersRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetConnectedPeersRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetConnectedPeersRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetConnectedPeersRequest {
    return {};
  },

  toJSON(_: GetConnectedPeersRequest): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<GetConnectedPeersRequest>, I>>(base?: I): GetConnectedPeersRequest {
    return GetConnectedPeersRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetConnectedPeersRequest>, I>>(_: I): GetConnectedPeersRequest {
    const message = createBaseGetConnectedPeersRequest();
    return message;
  },
};

function createBaseGetConnectedPeersResponse(): GetConnectedPeersResponse {
  return { contacts: [] };
}

export const GetConnectedPeersResponse = {
  encode(message: GetConnectedPeersResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.contacts) {
      ContactInfoBody.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetConnectedPeersResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetConnectedPeersResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.contacts.push(ContactInfoBody.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetConnectedPeersResponse {
    return {
      contacts: Array.isArray(object?.contacts) ? object.contacts.map((e: any) => ContactInfoBody.fromJSON(e)) : [],
    };
  },

  toJSON(message: GetConnectedPeersResponse): unknown {
    const obj: any = {};
    if (message.contacts) {
      obj.contacts = message.contacts.map((e) => e ? ContactInfoBody.toJSON(e) : undefined);
    } else {
      obj.contacts = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetConnectedPeersResponse>, I>>(base?: I): GetConnectedPeersResponse {
    return GetConnectedPeersResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetConnectedPeersResponse>, I>>(object: I): GetConnectedPeersResponse {
    const message = createBaseGetConnectedPeersResponse();
    message.contacts = object.contacts?.map((e) => ContactInfoBody.fromPartial(e)) || [];
    return message;
  },
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw "Unable to locate global object";
})();

function bytesFromBase64(b64: string): Uint8Array {
  if (tsProtoGlobalThis.Buffer) {
    return Uint8Array.from(tsProtoGlobalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = tsProtoGlobalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if (tsProtoGlobalThis.Buffer) {
    return tsProtoGlobalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(String.fromCharCode(byte));
    });
    return tsProtoGlobalThis.btoa(bin.join(""));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new tsProtoGlobalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
