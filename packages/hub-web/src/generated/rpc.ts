/* eslint-disable */
import { grpc } from '@improbable-eng/grpc-web';
import { BrowserHeaders } from 'browser-headers';
import Long from 'long';
import _m0 from 'protobufjs/minimal';
import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';
import { HubEvent, HubEventType, hubEventTypeFromJSON, hubEventTypeToJSON } from './hub_event';
import { IdRegistryEvent } from './id_registry_event';
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
import { NameRegistryEvent } from './name_registry_event';

export interface Empty {}

export interface SubscribeRequest {
  eventTypes: HubEventType[];
  fromId?: number | undefined;
}

export interface EventRequest {
  id: number;
}

/** Response Types for the Sync RPC Methods */
export interface HubInfoResponse {
  version: string;
  isSynced: boolean;
  nickname: string;
  rootHash: string;
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
  castId: CastId | undefined;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface ReactionRequest {
  fid: number;
  reactionType: ReactionType;
  castId: CastId | undefined;
}

export interface ReactionsByFidRequest {
  fid: number;
  reactionType?: ReactionType | undefined;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface ReactionsByCastRequest {
  castId: CastId | undefined;
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

function createBaseHubInfoResponse(): HubInfoResponse {
  return { version: '', isSynced: false, nickname: '', rootHash: '' };
}

export const HubInfoResponse = {
  encode(message: HubInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.version !== '') {
      writer.uint32(10).string(message.version);
    }
    if (message.isSynced === true) {
      writer.uint32(16).bool(message.isSynced);
    }
    if (message.nickname !== '') {
      writer.uint32(26).string(message.nickname);
    }
    if (message.rootHash !== '') {
      writer.uint32(34).string(message.rootHash);
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

          message.isSynced = reader.bool();
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
      isSynced: isSet(object.isSynced) ? Boolean(object.isSynced) : false,
      nickname: isSet(object.nickname) ? String(object.nickname) : '',
      rootHash: isSet(object.rootHash) ? String(object.rootHash) : '',
    };
  },

  toJSON(message: HubInfoResponse): unknown {
    const obj: any = {};
    message.version !== undefined && (obj.version = message.version);
    message.isSynced !== undefined && (obj.isSynced = message.isSynced);
    message.nickname !== undefined && (obj.nickname = message.nickname);
    message.rootHash !== undefined && (obj.rootHash = message.rootHash);
    return obj;
  },

  create<I extends Exact<DeepPartial<HubInfoResponse>, I>>(base?: I): HubInfoResponse {
    return HubInfoResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<HubInfoResponse>, I>>(object: I): HubInfoResponse {
    const message = createBaseHubInfoResponse();
    message.version = object.version ?? '';
    message.isSynced = object.isSynced ?? false;
    message.nickname = object.nickname ?? '';
    message.rootHash = object.rootHash ?? '';
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
  return { castId: undefined, pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const CastsByParentRequest = {
  encode(message: CastsByParentRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.castId !== undefined) {
      CastId.encode(message.castId, writer.uint32(10).fork()).ldelim();
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

          message.castId = CastId.decode(reader, reader.uint32());
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
      castId: isSet(object.castId) ? CastId.fromJSON(object.castId) : undefined,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: CastsByParentRequest): unknown {
    const obj: any = {};
    message.castId !== undefined && (obj.castId = message.castId ? CastId.toJSON(message.castId) : undefined);
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
    message.castId =
      object.castId !== undefined && object.castId !== null ? CastId.fromPartial(object.castId) : undefined;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseReactionRequest(): ReactionRequest {
  return { fid: 0, reactionType: 0, castId: undefined };
}

export const ReactionRequest = {
  encode(message: ReactionRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.reactionType !== 0) {
      writer.uint32(16).int32(message.reactionType);
    }
    if (message.castId !== undefined) {
      CastId.encode(message.castId, writer.uint32(26).fork()).ldelim();
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

          message.castId = CastId.decode(reader, reader.uint32());
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
      castId: isSet(object.castId) ? CastId.fromJSON(object.castId) : undefined,
    };
  },

  toJSON(message: ReactionRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.reactionType !== undefined && (obj.reactionType = reactionTypeToJSON(message.reactionType));
    message.castId !== undefined && (obj.castId = message.castId ? CastId.toJSON(message.castId) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ReactionRequest>, I>>(base?: I): ReactionRequest {
    return ReactionRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ReactionRequest>, I>>(object: I): ReactionRequest {
    const message = createBaseReactionRequest();
    message.fid = object.fid ?? 0;
    message.reactionType = object.reactionType ?? 0;
    message.castId =
      object.castId !== undefined && object.castId !== null ? CastId.fromPartial(object.castId) : undefined;
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

function createBaseReactionsByCastRequest(): ReactionsByCastRequest {
  return { castId: undefined, reactionType: undefined, pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const ReactionsByCastRequest = {
  encode(message: ReactionsByCastRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.castId !== undefined) {
      CastId.encode(message.castId, writer.uint32(10).fork()).ldelim();
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

  decode(input: _m0.Reader | Uint8Array, length?: number): ReactionsByCastRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReactionsByCastRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.castId = CastId.decode(reader, reader.uint32());
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

  fromJSON(object: any): ReactionsByCastRequest {
    return {
      castId: isSet(object.castId) ? CastId.fromJSON(object.castId) : undefined,
      reactionType: isSet(object.reactionType) ? reactionTypeFromJSON(object.reactionType) : undefined,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: ReactionsByCastRequest): unknown {
    const obj: any = {};
    message.castId !== undefined && (obj.castId = message.castId ? CastId.toJSON(message.castId) : undefined);
    message.reactionType !== undefined &&
      (obj.reactionType = message.reactionType !== undefined ? reactionTypeToJSON(message.reactionType) : undefined);
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<ReactionsByCastRequest>, I>>(base?: I): ReactionsByCastRequest {
    return ReactionsByCastRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ReactionsByCastRequest>, I>>(object: I): ReactionsByCastRequest {
    const message = createBaseReactionsByCastRequest();
    message.castId =
      object.castId !== undefined && object.castId !== null ? CastId.fromPartial(object.castId) : undefined;
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

export interface HubService {
  /** Submit Methods */
  SubmitMessage(request: DeepPartial<Message>, metadata?: grpc.Metadata): Promise<Message>;
  /** Event Methods */
  Subscribe(request: DeepPartial<SubscribeRequest>, metadata?: grpc.Metadata): Observable<HubEvent>;
  GetEvent(request: DeepPartial<EventRequest>, metadata?: grpc.Metadata): Promise<HubEvent>;
  /** Casts */
  GetCast(request: DeepPartial<CastId>, metadata?: grpc.Metadata): Promise<Message>;
  GetCastsByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetCastsByParent(request: DeepPartial<CastsByParentRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetCastsByMention(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  /** Reactions */
  GetReaction(request: DeepPartial<ReactionRequest>, metadata?: grpc.Metadata): Promise<Message>;
  GetReactionsByFid(request: DeepPartial<ReactionsByFidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetReactionsByCast(request: DeepPartial<ReactionsByCastRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  /** User Data */
  GetUserData(request: DeepPartial<UserDataRequest>, metadata?: grpc.Metadata): Promise<Message>;
  GetUserDataByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetNameRegistryEvent(
    request: DeepPartial<NameRegistryEventRequest>,
    metadata?: grpc.Metadata
  ): Promise<NameRegistryEvent>;
  /** Verifications */
  GetVerification(request: DeepPartial<VerificationRequest>, metadata?: grpc.Metadata): Promise<Message>;
  GetVerificationsByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  /** Signer */
  GetSigner(request: DeepPartial<SignerRequest>, metadata?: grpc.Metadata): Promise<Message>;
  GetSignersByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetIdRegistryEvent(request: DeepPartial<IdRegistryEventRequest>, metadata?: grpc.Metadata): Promise<IdRegistryEvent>;
  GetIdRegistryEventByAddress(
    request: DeepPartial<IdRegistryEventByAddressRequest>,
    metadata?: grpc.Metadata
  ): Promise<IdRegistryEvent>;
  GetFids(request: DeepPartial<FidsRequest>, metadata?: grpc.Metadata): Promise<FidsResponse>;
  /** Bulk Methods */
  GetAllCastMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetAllReactionMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetAllVerificationMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpc.Metadata
  ): Promise<MessagesResponse>;
  GetAllSignerMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetAllUserDataMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  /** Sync Methods */
  GetInfo(request: DeepPartial<Empty>, metadata?: grpc.Metadata): Promise<HubInfoResponse>;
  GetAllSyncIdsByPrefix(request: DeepPartial<TrieNodePrefix>, metadata?: grpc.Metadata): Promise<SyncIds>;
  GetAllMessagesBySyncIds(request: DeepPartial<SyncIds>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetSyncMetadataByPrefix(
    request: DeepPartial<TrieNodePrefix>,
    metadata?: grpc.Metadata
  ): Promise<TrieNodeMetadataResponse>;
  GetSyncSnapshotByPrefix(
    request: DeepPartial<TrieNodePrefix>,
    metadata?: grpc.Metadata
  ): Promise<TrieNodeSnapshotResponse>;
}

export class HubServiceClientImpl implements HubService {
  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.SubmitMessage = this.SubmitMessage.bind(this);
    this.Subscribe = this.Subscribe.bind(this);
    this.GetEvent = this.GetEvent.bind(this);
    this.GetCast = this.GetCast.bind(this);
    this.GetCastsByFid = this.GetCastsByFid.bind(this);
    this.GetCastsByParent = this.GetCastsByParent.bind(this);
    this.GetCastsByMention = this.GetCastsByMention.bind(this);
    this.GetReaction = this.GetReaction.bind(this);
    this.GetReactionsByFid = this.GetReactionsByFid.bind(this);
    this.GetReactionsByCast = this.GetReactionsByCast.bind(this);
    this.GetUserData = this.GetUserData.bind(this);
    this.GetUserDataByFid = this.GetUserDataByFid.bind(this);
    this.GetNameRegistryEvent = this.GetNameRegistryEvent.bind(this);
    this.GetVerification = this.GetVerification.bind(this);
    this.GetVerificationsByFid = this.GetVerificationsByFid.bind(this);
    this.GetSigner = this.GetSigner.bind(this);
    this.GetSignersByFid = this.GetSignersByFid.bind(this);
    this.GetIdRegistryEvent = this.GetIdRegistryEvent.bind(this);
    this.GetIdRegistryEventByAddress = this.GetIdRegistryEventByAddress.bind(this);
    this.GetFids = this.GetFids.bind(this);
    this.GetAllCastMessagesByFid = this.GetAllCastMessagesByFid.bind(this);
    this.GetAllReactionMessagesByFid = this.GetAllReactionMessagesByFid.bind(this);
    this.GetAllVerificationMessagesByFid = this.GetAllVerificationMessagesByFid.bind(this);
    this.GetAllSignerMessagesByFid = this.GetAllSignerMessagesByFid.bind(this);
    this.GetAllUserDataMessagesByFid = this.GetAllUserDataMessagesByFid.bind(this);
    this.GetInfo = this.GetInfo.bind(this);
    this.GetAllSyncIdsByPrefix = this.GetAllSyncIdsByPrefix.bind(this);
    this.GetAllMessagesBySyncIds = this.GetAllMessagesBySyncIds.bind(this);
    this.GetSyncMetadataByPrefix = this.GetSyncMetadataByPrefix.bind(this);
    this.GetSyncSnapshotByPrefix = this.GetSyncSnapshotByPrefix.bind(this);
  }

  SubmitMessage(request: DeepPartial<Message>, metadata?: grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceSubmitMessageDesc, Message.fromPartial(request), metadata);
  }

  Subscribe(request: DeepPartial<SubscribeRequest>, metadata?: grpc.Metadata): Observable<HubEvent> {
    return this.rpc.invoke(HubServiceSubscribeDesc, SubscribeRequest.fromPartial(request), metadata);
  }

  GetEvent(request: DeepPartial<EventRequest>, metadata?: grpc.Metadata): Promise<HubEvent> {
    return this.rpc.unary(HubServiceGetEventDesc, EventRequest.fromPartial(request), metadata);
  }

  GetCast(request: DeepPartial<CastId>, metadata?: grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetCastDesc, CastId.fromPartial(request), metadata);
  }

  GetCastsByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetCastsByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetCastsByParent(request: DeepPartial<CastsByParentRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetCastsByParentDesc, CastsByParentRequest.fromPartial(request), metadata);
  }

  GetCastsByMention(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetCastsByMentionDesc, FidRequest.fromPartial(request), metadata);
  }

  GetReaction(request: DeepPartial<ReactionRequest>, metadata?: grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetReactionDesc, ReactionRequest.fromPartial(request), metadata);
  }

  GetReactionsByFid(request: DeepPartial<ReactionsByFidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetReactionsByFidDesc, ReactionsByFidRequest.fromPartial(request), metadata);
  }

  GetReactionsByCast(
    request: DeepPartial<ReactionsByCastRequest>,
    metadata?: grpc.Metadata
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetReactionsByCastDesc, ReactionsByCastRequest.fromPartial(request), metadata);
  }

  GetUserData(request: DeepPartial<UserDataRequest>, metadata?: grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetUserDataDesc, UserDataRequest.fromPartial(request), metadata);
  }

  GetUserDataByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetUserDataByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetNameRegistryEvent(
    request: DeepPartial<NameRegistryEventRequest>,
    metadata?: grpc.Metadata
  ): Promise<NameRegistryEvent> {
    return this.rpc.unary(HubServiceGetNameRegistryEventDesc, NameRegistryEventRequest.fromPartial(request), metadata);
  }

  GetVerification(request: DeepPartial<VerificationRequest>, metadata?: grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetVerificationDesc, VerificationRequest.fromPartial(request), metadata);
  }

  GetVerificationsByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetVerificationsByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetSigner(request: DeepPartial<SignerRequest>, metadata?: grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetSignerDesc, SignerRequest.fromPartial(request), metadata);
  }

  GetSignersByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetSignersByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetIdRegistryEvent(request: DeepPartial<IdRegistryEventRequest>, metadata?: grpc.Metadata): Promise<IdRegistryEvent> {
    return this.rpc.unary(HubServiceGetIdRegistryEventDesc, IdRegistryEventRequest.fromPartial(request), metadata);
  }

  GetIdRegistryEventByAddress(
    request: DeepPartial<IdRegistryEventByAddressRequest>,
    metadata?: grpc.Metadata
  ): Promise<IdRegistryEvent> {
    return this.rpc.unary(
      HubServiceGetIdRegistryEventByAddressDesc,
      IdRegistryEventByAddressRequest.fromPartial(request),
      metadata
    );
  }

  GetFids(request: DeepPartial<FidsRequest>, metadata?: grpc.Metadata): Promise<FidsResponse> {
    return this.rpc.unary(HubServiceGetFidsDesc, FidsRequest.fromPartial(request), metadata);
  }

  GetAllCastMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllCastMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetAllReactionMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllReactionMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetAllVerificationMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpc.Metadata
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllVerificationMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetAllSignerMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllSignerMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetAllUserDataMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllUserDataMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetInfo(request: DeepPartial<Empty>, metadata?: grpc.Metadata): Promise<HubInfoResponse> {
    return this.rpc.unary(HubServiceGetInfoDesc, Empty.fromPartial(request), metadata);
  }

  GetAllSyncIdsByPrefix(request: DeepPartial<TrieNodePrefix>, metadata?: grpc.Metadata): Promise<SyncIds> {
    return this.rpc.unary(HubServiceGetAllSyncIdsByPrefixDesc, TrieNodePrefix.fromPartial(request), metadata);
  }

  GetAllMessagesBySyncIds(request: DeepPartial<SyncIds>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllMessagesBySyncIdsDesc, SyncIds.fromPartial(request), metadata);
  }

  GetSyncMetadataByPrefix(
    request: DeepPartial<TrieNodePrefix>,
    metadata?: grpc.Metadata
  ): Promise<TrieNodeMetadataResponse> {
    return this.rpc.unary(HubServiceGetSyncMetadataByPrefixDesc, TrieNodePrefix.fromPartial(request), metadata);
  }

  GetSyncSnapshotByPrefix(
    request: DeepPartial<TrieNodePrefix>,
    metadata?: grpc.Metadata
  ): Promise<TrieNodeSnapshotResponse> {
    return this.rpc.unary(HubServiceGetSyncSnapshotByPrefixDesc, TrieNodePrefix.fromPartial(request), metadata);
  }
}

export const HubServiceDesc = { serviceName: 'HubService' };

export const HubServiceSubmitMessageDesc: UnaryMethodDefinitionish = {
  methodName: 'SubmitMessage',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return Message.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Message.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceSubscribeDesc: UnaryMethodDefinitionish = {
  methodName: 'Subscribe',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: true,
  requestType: {
    serializeBinary() {
      return SubscribeRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = HubEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetEventDesc: UnaryMethodDefinitionish = {
  methodName: 'GetEvent',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return EventRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = HubEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetCastDesc: UnaryMethodDefinitionish = {
  methodName: 'GetCast',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return CastId.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Message.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetCastsByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetCastsByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetCastsByParentDesc: UnaryMethodDefinitionish = {
  methodName: 'GetCastsByParent',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return CastsByParentRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetCastsByMentionDesc: UnaryMethodDefinitionish = {
  methodName: 'GetCastsByMention',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetReactionDesc: UnaryMethodDefinitionish = {
  methodName: 'GetReaction',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ReactionRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Message.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetReactionsByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetReactionsByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ReactionsByFidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetReactionsByCastDesc: UnaryMethodDefinitionish = {
  methodName: 'GetReactionsByCast',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ReactionsByCastRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetUserDataDesc: UnaryMethodDefinitionish = {
  methodName: 'GetUserData',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return UserDataRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Message.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetUserDataByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetUserDataByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetNameRegistryEventDesc: UnaryMethodDefinitionish = {
  methodName: 'GetNameRegistryEvent',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return NameRegistryEventRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = NameRegistryEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetVerificationDesc: UnaryMethodDefinitionish = {
  methodName: 'GetVerification',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return VerificationRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Message.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetVerificationsByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetVerificationsByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetSignerDesc: UnaryMethodDefinitionish = {
  methodName: 'GetSigner',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return SignerRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Message.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetSignersByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetSignersByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetIdRegistryEventDesc: UnaryMethodDefinitionish = {
  methodName: 'GetIdRegistryEvent',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return IdRegistryEventRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = IdRegistryEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetIdRegistryEventByAddressDesc: UnaryMethodDefinitionish = {
  methodName: 'GetIdRegistryEventByAddress',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return IdRegistryEventByAddressRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = IdRegistryEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetFidsDesc: UnaryMethodDefinitionish = {
  methodName: 'GetFids',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidsRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = FidsResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetAllCastMessagesByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetAllCastMessagesByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetAllReactionMessagesByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetAllReactionMessagesByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetAllVerificationMessagesByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetAllVerificationMessagesByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetAllSignerMessagesByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetAllSignerMessagesByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetAllUserDataMessagesByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetAllUserDataMessagesByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetInfoDesc: UnaryMethodDefinitionish = {
  methodName: 'GetInfo',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return Empty.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = HubInfoResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetAllSyncIdsByPrefixDesc: UnaryMethodDefinitionish = {
  methodName: 'GetAllSyncIdsByPrefix',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return TrieNodePrefix.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = SyncIds.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetAllMessagesBySyncIdsDesc: UnaryMethodDefinitionish = {
  methodName: 'GetAllMessagesBySyncIds',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return SyncIds.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetSyncMetadataByPrefixDesc: UnaryMethodDefinitionish = {
  methodName: 'GetSyncMetadataByPrefix',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return TrieNodePrefix.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = TrieNodeMetadataResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetSyncSnapshotByPrefixDesc: UnaryMethodDefinitionish = {
  methodName: 'GetSyncSnapshotByPrefix',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return TrieNodePrefix.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = TrieNodeSnapshotResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export interface AdminService {
  RebuildSyncTrie(request: DeepPartial<Empty>, metadata?: grpc.Metadata): Promise<Empty>;
  DeleteAllMessagesFromDb(request: DeepPartial<Empty>, metadata?: grpc.Metadata): Promise<Empty>;
  SubmitIdRegistryEvent(request: DeepPartial<IdRegistryEvent>, metadata?: grpc.Metadata): Promise<IdRegistryEvent>;
  SubmitNameRegistryEvent(
    request: DeepPartial<NameRegistryEvent>,
    metadata?: grpc.Metadata
  ): Promise<NameRegistryEvent>;
}

export class AdminServiceClientImpl implements AdminService {
  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.RebuildSyncTrie = this.RebuildSyncTrie.bind(this);
    this.DeleteAllMessagesFromDb = this.DeleteAllMessagesFromDb.bind(this);
    this.SubmitIdRegistryEvent = this.SubmitIdRegistryEvent.bind(this);
    this.SubmitNameRegistryEvent = this.SubmitNameRegistryEvent.bind(this);
  }

  RebuildSyncTrie(request: DeepPartial<Empty>, metadata?: grpc.Metadata): Promise<Empty> {
    return this.rpc.unary(AdminServiceRebuildSyncTrieDesc, Empty.fromPartial(request), metadata);
  }

  DeleteAllMessagesFromDb(request: DeepPartial<Empty>, metadata?: grpc.Metadata): Promise<Empty> {
    return this.rpc.unary(AdminServiceDeleteAllMessagesFromDbDesc, Empty.fromPartial(request), metadata);
  }

  SubmitIdRegistryEvent(request: DeepPartial<IdRegistryEvent>, metadata?: grpc.Metadata): Promise<IdRegistryEvent> {
    return this.rpc.unary(AdminServiceSubmitIdRegistryEventDesc, IdRegistryEvent.fromPartial(request), metadata);
  }

  SubmitNameRegistryEvent(
    request: DeepPartial<NameRegistryEvent>,
    metadata?: grpc.Metadata
  ): Promise<NameRegistryEvent> {
    return this.rpc.unary(AdminServiceSubmitNameRegistryEventDesc, NameRegistryEvent.fromPartial(request), metadata);
  }
}

export const AdminServiceDesc = { serviceName: 'AdminService' };

export const AdminServiceRebuildSyncTrieDesc: UnaryMethodDefinitionish = {
  methodName: 'RebuildSyncTrie',
  service: AdminServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return Empty.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Empty.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const AdminServiceDeleteAllMessagesFromDbDesc: UnaryMethodDefinitionish = {
  methodName: 'DeleteAllMessagesFromDb',
  service: AdminServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return Empty.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Empty.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const AdminServiceSubmitIdRegistryEventDesc: UnaryMethodDefinitionish = {
  methodName: 'SubmitIdRegistryEvent',
  service: AdminServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return IdRegistryEvent.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = IdRegistryEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const AdminServiceSubmitNameRegistryEventDesc: UnaryMethodDefinitionish = {
  methodName: 'SubmitNameRegistryEvent',
  service: AdminServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return NameRegistryEvent.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = NameRegistryEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

interface UnaryMethodDefinitionishR extends grpc.UnaryMethodDefinition<any, any> {
  requestStream: any;
  responseStream: any;
}

type UnaryMethodDefinitionish = UnaryMethodDefinitionishR;

interface Rpc {
  unary<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    request: any,
    metadata: grpc.Metadata | undefined
  ): Promise<any>;
  invoke<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    request: any,
    metadata: grpc.Metadata | undefined
  ): Observable<any>;
}

export class GrpcWebImpl {
  private host: string;
  private options: {
    transport?: grpc.TransportFactory;
    streamingTransport?: grpc.TransportFactory;
    debug?: boolean;
    metadata?: grpc.Metadata;
    upStreamRetryCodes?: number[];
  };

  constructor(
    host: string,
    options: {
      transport?: grpc.TransportFactory;
      streamingTransport?: grpc.TransportFactory;
      debug?: boolean;
      metadata?: grpc.Metadata;
      upStreamRetryCodes?: number[];
    }
  ) {
    this.host = host;
    this.options = options;
  }

  unary<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    _request: any,
    metadata: grpc.Metadata | undefined
  ): Promise<any> {
    const request = { ..._request, ...methodDesc.requestType };
    const maybeCombinedMetadata =
      metadata && this.options.metadata
        ? new BrowserHeaders({ ...this.options?.metadata.headersMap, ...metadata?.headersMap })
        : metadata || this.options.metadata;
    return new Promise((resolve, reject) => {
      grpc.unary(methodDesc, {
        request,
        host: this.host,
        metadata: maybeCombinedMetadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (response.status === grpc.Code.OK) {
            resolve(response.message!.toObject());
          } else {
            const err = new GrpcWebError(response.statusMessage, response.status, response.trailers);
            reject(err);
          }
        },
      });
    });
  }

  invoke<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    _request: any,
    metadata: grpc.Metadata | undefined
  ): Observable<any> {
    const upStreamCodes = this.options.upStreamRetryCodes || [];
    const DEFAULT_TIMEOUT_TIME: number = 3_000;
    const request = { ..._request, ...methodDesc.requestType };
    const maybeCombinedMetadata =
      metadata && this.options.metadata
        ? new BrowserHeaders({ ...this.options?.metadata.headersMap, ...metadata?.headersMap })
        : metadata || this.options.metadata;
    return new Observable((observer) => {
      const upStream = () => {
        const client = grpc.invoke(methodDesc, {
          host: this.host,
          request,
          transport: this.options.streamingTransport || this.options.transport,
          metadata: maybeCombinedMetadata,
          debug: this.options.debug,
          onMessage: (next) => observer.next(next),
          onEnd: (code: grpc.Code, message: string, trailers: grpc.Metadata) => {
            if (code === 0) {
              observer.complete();
            } else if (upStreamCodes.includes(code)) {
              setTimeout(upStream, DEFAULT_TIMEOUT_TIME);
            } else {
              const err = new Error(message) as any;
              err.code = code;
              err.metadata = trailers;
              observer.error(err);
            }
          },
        });
        observer.add(() => {
          if (!observer.closed) {
            return client.close();
          }
        });
      };
      upStream();
    }).pipe(share());
  }
}

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

export class GrpcWebError extends tsProtoGlobalThis.Error {
  constructor(message: string, public code: grpc.Code, public metadata: grpc.Metadata) {
    super(message);
  }
}
