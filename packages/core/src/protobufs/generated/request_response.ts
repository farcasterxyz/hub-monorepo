/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';
import { HubEventType, hubEventTypeFromJSON, hubEventTypeToJSON } from './hub_event';
import {
  CastId,
  Message,
  ReactionType,
  reactionTypeFromJSON,
  reactionTypeToJSON,
  UserDataType,
  userDataTypeFromJSON,
  userDataTypeToJSON,
} from './message';

export interface Empty {}

export interface SubscribeRequest {
  eventTypes: HubEventType[];
  fromId?: number | undefined;
}

export interface EventRequest {
  id: number;
}

export interface HubInfoRequest {
  dbStats: boolean;
}

/** Response Types for the Sync RPC Methods */
export interface HubInfoResponse {
  version: string;
  isSyncing: boolean;
  nickname: string;
  rootHash: string;
  dbStats: DbStats | undefined;
}

export interface DbStats {
  numMessages: number;
  numFidEvents: number;
  numFnameEvents: number;
}

export interface SyncStatusRequest {
  peerId?: string | undefined;
}

export interface SyncStatusResponse {
  isSyncing: boolean;
  syncStatus: SyncStatus[];
}

export interface SyncStatus {
  peerId: string;
  inSync: string;
  shouldSync: boolean;
  divergencePrefix: string;
  divergenceSecondsAgo: number;
  theirMessages: number;
  ourMessages: number;
  lastBadSync: number;
}

export interface TrieNodeMetadataResponse {
  prefix: Uint8Array;
  numMessages: number;
  hash: string;
  children: TrieNodeMetadataResponse[];
}

export interface TrieNodeSnapshotResponse {
  prefix: Uint8Array;
  excludedHashes: string[];
  numMessages: number;
  rootHash: string;
}

export interface TrieNodePrefix {
  prefix: Uint8Array;
}

export interface SyncIds {
  syncIds: Uint8Array[];
}

export interface FidRequest {
  fid: number;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface FidsRequest {
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
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

export interface NameRegistryEventRequest {
  name: Uint8Array;
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

export interface IdRegistryEventRequest {
  fid: number;
}

export interface IdRegistryEventByAddressRequest {
  address: Uint8Array;
}

function createBaseEmpty(): Empty {
  return {};
}

export const Empty = {
  encode(_: Empty, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Empty {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEmpty();
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

  fromJSON(_: any): Empty {
    return {};
  },

  toJSON(_: Empty): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<Empty>, I>>(base?: I): Empty {
    return Empty.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Empty>, I>>(_: I): Empty {
    const message = createBaseEmpty();
    return message;
  },
};

function createBaseSubscribeRequest(): SubscribeRequest {
  return { eventTypes: [], fromId: undefined };
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
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequest>, I>>(base?: I): SubscribeRequest {
    return SubscribeRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequest>, I>>(object: I): SubscribeRequest {
    const message = createBaseSubscribeRequest();
    message.eventTypes = object.eventTypes?.map((e) => e) || [];
    message.fromId = object.fromId ?? undefined;
    return message;
  },
};

function createBaseEventRequest(): EventRequest {
  return { id: 0 };
}

export const EventRequest = {
  encode(message: EventRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== 0) {
      writer.uint32(8).uint64(message.id);
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
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventRequest {
    return { id: isSet(object.id) ? Number(object.id) : 0 };
  },

  toJSON(message: EventRequest): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = Math.round(message.id));
    return obj;
  },

  create<I extends Exact<DeepPartial<EventRequest>, I>>(base?: I): EventRequest {
    return EventRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventRequest>, I>>(object: I): EventRequest {
    const message = createBaseEventRequest();
    message.id = object.id ?? 0;
    return message;
  },
};

function createBaseHubInfoRequest(): HubInfoRequest {
  return { dbStats: false };
}

export const HubInfoRequest = {
  encode(message: HubInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.dbStats === true) {
      writer.uint32(8).bool(message.dbStats);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): HubInfoRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHubInfoRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.dbStats = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): HubInfoRequest {
    return { dbStats: isSet(object.dbStats) ? Boolean(object.dbStats) : false };
  },

  toJSON(message: HubInfoRequest): unknown {
    const obj: any = {};
    message.dbStats !== undefined && (obj.dbStats = message.dbStats);
    return obj;
  },

  create<I extends Exact<DeepPartial<HubInfoRequest>, I>>(base?: I): HubInfoRequest {
    return HubInfoRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<HubInfoRequest>, I>>(object: I): HubInfoRequest {
    const message = createBaseHubInfoRequest();
    message.dbStats = object.dbStats ?? false;
    return message;
  },
};

function createBaseHubInfoResponse(): HubInfoResponse {
  return { version: '', isSyncing: false, nickname: '', rootHash: '', dbStats: undefined };
}

export const HubInfoResponse = {
  encode(message: HubInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.version !== '') {
      writer.uint32(10).string(message.version);
    }
    if (message.isSyncing === true) {
      writer.uint32(16).bool(message.isSyncing);
    }
    if (message.nickname !== '') {
      writer.uint32(26).string(message.nickname);
    }
    if (message.rootHash !== '') {
      writer.uint32(34).string(message.rootHash);
    }
    if (message.dbStats !== undefined) {
      DbStats.encode(message.dbStats, writer.uint32(42).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): HubInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHubInfoResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.version = reader.string();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.isSyncing = reader.bool();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.nickname = reader.string();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.rootHash = reader.string();
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.dbStats = DbStats.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): HubInfoResponse {
    return {
      version: isSet(object.version) ? String(object.version) : '',
      isSyncing: isSet(object.isSyncing) ? Boolean(object.isSyncing) : false,
      nickname: isSet(object.nickname) ? String(object.nickname) : '',
      rootHash: isSet(object.rootHash) ? String(object.rootHash) : '',
      dbStats: isSet(object.dbStats) ? DbStats.fromJSON(object.dbStats) : undefined,
    };
  },

  toJSON(message: HubInfoResponse): unknown {
    const obj: any = {};
    message.version !== undefined && (obj.version = message.version);
    message.isSyncing !== undefined && (obj.isSyncing = message.isSyncing);
    message.nickname !== undefined && (obj.nickname = message.nickname);
    message.rootHash !== undefined && (obj.rootHash = message.rootHash);
    message.dbStats !== undefined && (obj.dbStats = message.dbStats ? DbStats.toJSON(message.dbStats) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<HubInfoResponse>, I>>(base?: I): HubInfoResponse {
    return HubInfoResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<HubInfoResponse>, I>>(object: I): HubInfoResponse {
    const message = createBaseHubInfoResponse();
    message.version = object.version ?? '';
    message.isSyncing = object.isSyncing ?? false;
    message.nickname = object.nickname ?? '';
    message.rootHash = object.rootHash ?? '';
    message.dbStats =
      object.dbStats !== undefined && object.dbStats !== null ? DbStats.fromPartial(object.dbStats) : undefined;
    return message;
  },
};

function createBaseDbStats(): DbStats {
  return { numMessages: 0, numFidEvents: 0, numFnameEvents: 0 };
}

export const DbStats = {
  encode(message: DbStats, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.numMessages !== 0) {
      writer.uint32(8).uint64(message.numMessages);
    }
    if (message.numFidEvents !== 0) {
      writer.uint32(16).uint64(message.numFidEvents);
    }
    if (message.numFnameEvents !== 0) {
      writer.uint32(24).uint64(message.numFnameEvents);
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

          message.numFidEvents = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.numFnameEvents = longToNumber(reader.uint64() as Long);
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
      numFidEvents: isSet(object.numFidEvents) ? Number(object.numFidEvents) : 0,
      numFnameEvents: isSet(object.numFnameEvents) ? Number(object.numFnameEvents) : 0,
    };
  },

  toJSON(message: DbStats): unknown {
    const obj: any = {};
    message.numMessages !== undefined && (obj.numMessages = Math.round(message.numMessages));
    message.numFidEvents !== undefined && (obj.numFidEvents = Math.round(message.numFidEvents));
    message.numFnameEvents !== undefined && (obj.numFnameEvents = Math.round(message.numFnameEvents));
    return obj;
  },

  create<I extends Exact<DeepPartial<DbStats>, I>>(base?: I): DbStats {
    return DbStats.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<DbStats>, I>>(object: I): DbStats {
    const message = createBaseDbStats();
    message.numMessages = object.numMessages ?? 0;
    message.numFidEvents = object.numFidEvents ?? 0;
    message.numFnameEvents = object.numFnameEvents ?? 0;
    return message;
  },
};

function createBaseSyncStatusRequest(): SyncStatusRequest {
  return { peerId: undefined };
}

export const SyncStatusRequest = {
  encode(message: SyncStatusRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.peerId !== undefined) {
      writer.uint32(10).string(message.peerId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SyncStatusRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncStatusRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.peerId = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SyncStatusRequest {
    return { peerId: isSet(object.peerId) ? String(object.peerId) : undefined };
  },

  toJSON(message: SyncStatusRequest): unknown {
    const obj: any = {};
    message.peerId !== undefined && (obj.peerId = message.peerId);
    return obj;
  },

  create<I extends Exact<DeepPartial<SyncStatusRequest>, I>>(base?: I): SyncStatusRequest {
    return SyncStatusRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SyncStatusRequest>, I>>(object: I): SyncStatusRequest {
    const message = createBaseSyncStatusRequest();
    message.peerId = object.peerId ?? undefined;
    return message;
  },
};

function createBaseSyncStatusResponse(): SyncStatusResponse {
  return { isSyncing: false, syncStatus: [] };
}

export const SyncStatusResponse = {
  encode(message: SyncStatusResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.isSyncing === true) {
      writer.uint32(8).bool(message.isSyncing);
    }
    for (const v of message.syncStatus) {
      SyncStatus.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SyncStatusResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncStatusResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.isSyncing = reader.bool();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.syncStatus.push(SyncStatus.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SyncStatusResponse {
    return {
      isSyncing: isSet(object.isSyncing) ? Boolean(object.isSyncing) : false,
      syncStatus: Array.isArray(object?.syncStatus) ? object.syncStatus.map((e: any) => SyncStatus.fromJSON(e)) : [],
    };
  },

  toJSON(message: SyncStatusResponse): unknown {
    const obj: any = {};
    message.isSyncing !== undefined && (obj.isSyncing = message.isSyncing);
    if (message.syncStatus) {
      obj.syncStatus = message.syncStatus.map((e) => (e ? SyncStatus.toJSON(e) : undefined));
    } else {
      obj.syncStatus = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SyncStatusResponse>, I>>(base?: I): SyncStatusResponse {
    return SyncStatusResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SyncStatusResponse>, I>>(object: I): SyncStatusResponse {
    const message = createBaseSyncStatusResponse();
    message.isSyncing = object.isSyncing ?? false;
    message.syncStatus = object.syncStatus?.map((e) => SyncStatus.fromPartial(e)) || [];
    return message;
  },
};

function createBaseSyncStatus(): SyncStatus {
  return {
    peerId: '',
    inSync: '',
    shouldSync: false,
    divergencePrefix: '',
    divergenceSecondsAgo: 0,
    theirMessages: 0,
    ourMessages: 0,
    lastBadSync: 0,
  };
}

export const SyncStatus = {
  encode(message: SyncStatus, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.peerId !== '') {
      writer.uint32(10).string(message.peerId);
    }
    if (message.inSync !== '') {
      writer.uint32(18).string(message.inSync);
    }
    if (message.shouldSync === true) {
      writer.uint32(24).bool(message.shouldSync);
    }
    if (message.divergencePrefix !== '') {
      writer.uint32(34).string(message.divergencePrefix);
    }
    if (message.divergenceSecondsAgo !== 0) {
      writer.uint32(40).int32(message.divergenceSecondsAgo);
    }
    if (message.theirMessages !== 0) {
      writer.uint32(48).uint64(message.theirMessages);
    }
    if (message.ourMessages !== 0) {
      writer.uint32(56).uint64(message.ourMessages);
    }
    if (message.lastBadSync !== 0) {
      writer.uint32(64).int64(message.lastBadSync);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SyncStatus {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncStatus();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.peerId = reader.string();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.inSync = reader.string();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.shouldSync = reader.bool();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.divergencePrefix = reader.string();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.divergenceSecondsAgo = reader.int32();
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.theirMessages = longToNumber(reader.uint64() as Long);
          continue;
        case 7:
          if (tag != 56) {
            break;
          }

          message.ourMessages = longToNumber(reader.uint64() as Long);
          continue;
        case 8:
          if (tag != 64) {
            break;
          }

          message.lastBadSync = longToNumber(reader.int64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SyncStatus {
    return {
      peerId: isSet(object.peerId) ? String(object.peerId) : '',
      inSync: isSet(object.inSync) ? String(object.inSync) : '',
      shouldSync: isSet(object.shouldSync) ? Boolean(object.shouldSync) : false,
      divergencePrefix: isSet(object.divergencePrefix) ? String(object.divergencePrefix) : '',
      divergenceSecondsAgo: isSet(object.divergenceSecondsAgo) ? Number(object.divergenceSecondsAgo) : 0,
      theirMessages: isSet(object.theirMessages) ? Number(object.theirMessages) : 0,
      ourMessages: isSet(object.ourMessages) ? Number(object.ourMessages) : 0,
      lastBadSync: isSet(object.lastBadSync) ? Number(object.lastBadSync) : 0,
    };
  },

  toJSON(message: SyncStatus): unknown {
    const obj: any = {};
    message.peerId !== undefined && (obj.peerId = message.peerId);
    message.inSync !== undefined && (obj.inSync = message.inSync);
    message.shouldSync !== undefined && (obj.shouldSync = message.shouldSync);
    message.divergencePrefix !== undefined && (obj.divergencePrefix = message.divergencePrefix);
    message.divergenceSecondsAgo !== undefined && (obj.divergenceSecondsAgo = Math.round(message.divergenceSecondsAgo));
    message.theirMessages !== undefined && (obj.theirMessages = Math.round(message.theirMessages));
    message.ourMessages !== undefined && (obj.ourMessages = Math.round(message.ourMessages));
    message.lastBadSync !== undefined && (obj.lastBadSync = Math.round(message.lastBadSync));
    return obj;
  },

  create<I extends Exact<DeepPartial<SyncStatus>, I>>(base?: I): SyncStatus {
    return SyncStatus.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SyncStatus>, I>>(object: I): SyncStatus {
    const message = createBaseSyncStatus();
    message.peerId = object.peerId ?? '';
    message.inSync = object.inSync ?? '';
    message.shouldSync = object.shouldSync ?? false;
    message.divergencePrefix = object.divergencePrefix ?? '';
    message.divergenceSecondsAgo = object.divergenceSecondsAgo ?? 0;
    message.theirMessages = object.theirMessages ?? 0;
    message.ourMessages = object.ourMessages ?? 0;
    message.lastBadSync = object.lastBadSync ?? 0;
    return message;
  },
};

function createBaseTrieNodeMetadataResponse(): TrieNodeMetadataResponse {
  return { prefix: new Uint8Array(), numMessages: 0, hash: '', children: [] };
}

export const TrieNodeMetadataResponse = {
  encode(message: TrieNodeMetadataResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.prefix.length !== 0) {
      writer.uint32(10).bytes(message.prefix);
    }
    if (message.numMessages !== 0) {
      writer.uint32(16).uint64(message.numMessages);
    }
    if (message.hash !== '') {
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
      hash: isSet(object.hash) ? String(object.hash) : '',
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
      obj.children = message.children.map((e) => (e ? TrieNodeMetadataResponse.toJSON(e) : undefined));
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
    message.hash = object.hash ?? '';
    message.children = object.children?.map((e) => TrieNodeMetadataResponse.fromPartial(e)) || [];
    return message;
  },
};

function createBaseTrieNodeSnapshotResponse(): TrieNodeSnapshotResponse {
  return { prefix: new Uint8Array(), excludedHashes: [], numMessages: 0, rootHash: '' };
}

export const TrieNodeSnapshotResponse = {
  encode(message: TrieNodeSnapshotResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.prefix.length !== 0) {
      writer.uint32(10).bytes(message.prefix);
    }
    for (const v of message.excludedHashes) {
      writer.uint32(18).string(v!);
    }
    if (message.numMessages !== 0) {
      writer.uint32(24).uint64(message.numMessages);
    }
    if (message.rootHash !== '') {
      writer.uint32(34).string(message.rootHash);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TrieNodeSnapshotResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTrieNodeSnapshotResponse();
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
          if (tag != 18) {
            break;
          }

          message.excludedHashes.push(reader.string());
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.numMessages = longToNumber(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.rootHash = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TrieNodeSnapshotResponse {
    return {
      prefix: isSet(object.prefix) ? bytesFromBase64(object.prefix) : new Uint8Array(),
      excludedHashes: Array.isArray(object?.excludedHashes) ? object.excludedHashes.map((e: any) => String(e)) : [],
      numMessages: isSet(object.numMessages) ? Number(object.numMessages) : 0,
      rootHash: isSet(object.rootHash) ? String(object.rootHash) : '',
    };
  },

  toJSON(message: TrieNodeSnapshotResponse): unknown {
    const obj: any = {};
    message.prefix !== undefined &&
      (obj.prefix = base64FromBytes(message.prefix !== undefined ? message.prefix : new Uint8Array()));
    if (message.excludedHashes) {
      obj.excludedHashes = message.excludedHashes.map((e) => e);
    } else {
      obj.excludedHashes = [];
    }
    message.numMessages !== undefined && (obj.numMessages = Math.round(message.numMessages));
    message.rootHash !== undefined && (obj.rootHash = message.rootHash);
    return obj;
  },

  create<I extends Exact<DeepPartial<TrieNodeSnapshotResponse>, I>>(base?: I): TrieNodeSnapshotResponse {
    return TrieNodeSnapshotResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TrieNodeSnapshotResponse>, I>>(object: I): TrieNodeSnapshotResponse {
    const message = createBaseTrieNodeSnapshotResponse();
    message.prefix = object.prefix ?? new Uint8Array();
    message.excludedHashes = object.excludedHashes?.map((e) => e) || [];
    message.numMessages = object.numMessages ?? 0;
    message.rootHash = object.rootHash ?? '';
    return message;
  },
};

function createBaseTrieNodePrefix(): TrieNodePrefix {
  return { prefix: new Uint8Array() };
}

export const TrieNodePrefix = {
  encode(message: TrieNodePrefix, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.prefix.length !== 0) {
      writer.uint32(10).bytes(message.prefix);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TrieNodePrefix {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTrieNodePrefix();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
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

  fromJSON(object: any): TrieNodePrefix {
    return { prefix: isSet(object.prefix) ? bytesFromBase64(object.prefix) : new Uint8Array() };
  },

  toJSON(message: TrieNodePrefix): unknown {
    const obj: any = {};
    message.prefix !== undefined &&
      (obj.prefix = base64FromBytes(message.prefix !== undefined ? message.prefix : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<TrieNodePrefix>, I>>(base?: I): TrieNodePrefix {
    return TrieNodePrefix.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TrieNodePrefix>, I>>(object: I): TrieNodePrefix {
    const message = createBaseTrieNodePrefix();
    message.prefix = object.prefix ?? new Uint8Array();
    return message;
  },
};

function createBaseSyncIds(): SyncIds {
  return { syncIds: [] };
}

export const SyncIds = {
  encode(message: SyncIds, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.syncIds) {
      writer.uint32(10).bytes(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SyncIds {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncIds();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.syncIds.push(reader.bytes());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SyncIds {
    return { syncIds: Array.isArray(object?.syncIds) ? object.syncIds.map((e: any) => bytesFromBase64(e)) : [] };
  },

  toJSON(message: SyncIds): unknown {
    const obj: any = {};
    if (message.syncIds) {
      obj.syncIds = message.syncIds.map((e) => base64FromBytes(e !== undefined ? e : new Uint8Array()));
    } else {
      obj.syncIds = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SyncIds>, I>>(base?: I): SyncIds {
    return SyncIds.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SyncIds>, I>>(object: I): SyncIds {
    const message = createBaseSyncIds();
    message.syncIds = object.syncIds?.map((e) => e) || [];
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

function createBaseFidsRequest(): FidsRequest {
  return { pageSize: undefined, pageToken: undefined, reverse: undefined };
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
    };
  },

  toJSON(message: FidsRequest): unknown {
    const obj: any = {};
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
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
      obj.messages = message.messages.map((e) => (e ? Message.toJSON(e) : undefined));
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
    message.parentCastId =
      object.parentCastId !== undefined && object.parentCastId !== null
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
    message.targetCastId =
      object.targetCastId !== undefined && object.targetCastId !== null
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
    message.targetCastId =
      object.targetCastId !== undefined && object.targetCastId !== null
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

function createBaseNameRegistryEventRequest(): NameRegistryEventRequest {
  return { name: new Uint8Array() };
}

export const NameRegistryEventRequest = {
  encode(message: NameRegistryEventRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name.length !== 0) {
      writer.uint32(10).bytes(message.name);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): NameRegistryEventRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseNameRegistryEventRequest();
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

  fromJSON(object: any): NameRegistryEventRequest {
    return { name: isSet(object.name) ? bytesFromBase64(object.name) : new Uint8Array() };
  },

  toJSON(message: NameRegistryEventRequest): unknown {
    const obj: any = {};
    message.name !== undefined &&
      (obj.name = base64FromBytes(message.name !== undefined ? message.name : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<NameRegistryEventRequest>, I>>(base?: I): NameRegistryEventRequest {
    return NameRegistryEventRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<NameRegistryEventRequest>, I>>(object: I): NameRegistryEventRequest {
    const message = createBaseNameRegistryEventRequest();
    message.name = object.name ?? new Uint8Array();
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
  return { fid: 0, linkType: '', targetFid: undefined };
}

export const LinkRequest = {
  encode(message: LinkRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.linkType !== '') {
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
      linkType: isSet(object.linkType) ? String(object.linkType) : '',
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
    message.linkType = object.linkType ?? '';
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

function createBaseIdRegistryEventRequest(): IdRegistryEventRequest {
  return { fid: 0 };
}

export const IdRegistryEventRequest = {
  encode(message: IdRegistryEventRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): IdRegistryEventRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseIdRegistryEventRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): IdRegistryEventRequest {
    return { fid: isSet(object.fid) ? Number(object.fid) : 0 };
  },

  toJSON(message: IdRegistryEventRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    return obj;
  },

  create<I extends Exact<DeepPartial<IdRegistryEventRequest>, I>>(base?: I): IdRegistryEventRequest {
    return IdRegistryEventRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<IdRegistryEventRequest>, I>>(object: I): IdRegistryEventRequest {
    const message = createBaseIdRegistryEventRequest();
    message.fid = object.fid ?? 0;
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
    object: I
  ): IdRegistryEventByAddressRequest {
    const message = createBaseIdRegistryEventByAddressRequest();
    message.address = object.address ?? new Uint8Array();
    return message;
  },
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw 'Unable to locate global object';
})();

function bytesFromBase64(b64: string): Uint8Array {
  if (tsProtoGlobalThis.Buffer) {
    return Uint8Array.from(tsProtoGlobalThis.Buffer.from(b64, 'base64'));
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
    return tsProtoGlobalThis.Buffer.from(arr).toString('base64');
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(String.fromCharCode(byte));
    });
    return tsProtoGlobalThis.btoa(bin.join(''));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new tsProtoGlobalThis.Error('Value is larger than Number.MAX_SAFE_INTEGER');
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
