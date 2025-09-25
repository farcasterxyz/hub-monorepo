/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { Block, FnameTransfer, ShardChunk } from "./blocks";
import { Message } from "./message";
import { OnChainEvent } from "./onchain_event";

export interface GetShardSnapshotMetadataRequest {
  shardId: number;
}

export interface ShardSnapshotMetadata {
  shardId: number;
  height: number;
  timestamp: number;
  shardChunk?: ShardChunk | undefined;
  block?: Block | undefined;
  numItems: number;
}

export interface GetShardSnapshotMetadataResponse {
  snapshots: ShardSnapshotMetadata[];
}

export interface GetShardTransactionsRequest {
  /**
   * Shard + height of the snapshot. Only those combinations returned from the `GetShardSnapshotMetadata`
   * are valid
   */
  shardId: number;
  height: number;
  /** The trie prefix to iterate under. Only leaf node keys under this sub tree will be returned. */
  trieVirtualShard: number;
  /** If NONE, then start from the left-most leaf node under the prefix */
  pageToken?: string | undefined;
}

export interface GetShardTransactionsResponse {
  /** List of trie keys and its associated message */
  trieMessages: ShardTrieEntryWithMessage[];
  /**
   * For each (unique) FID that was sent in `messages` above, that FID's account root
   * hash in the trie.
   */
  fidAccountRoots: FidAccountRootHash[];
  /** If this is None, all entries under the prefix have been returned */
  nextPageToken?: string | undefined;
}

export interface ShardTrieEntryWithMessage {
  /** The trie key of the leaf node. */
  trieKey: Uint8Array;
  userMessage?: Message | undefined;
  onChainEvent?: OnChainEvent | undefined;
  fnameTransfer?: FnameTransfer | undefined;
}

export interface FidAccountRootHash {
  fid: number;
  accountRootHash: Uint8Array;
  numMessages: number;
}

export interface ReplicationTriePartStatus {
  shardId: number;
  height: number;
  virtualTrieShard: number;
  nextPageToken?:
    | string
    | undefined;
  /** These fields are used by the client to store the progress in the DB */
  lastResponse: number;
  /** The last FID processed (to continue from last pass) */
  lastFid?: number | undefined;
}

function createBaseGetShardSnapshotMetadataRequest(): GetShardSnapshotMetadataRequest {
  return { shardId: 0 };
}

export const GetShardSnapshotMetadataRequest = {
  encode(message: GetShardSnapshotMetadataRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.shardId !== 0) {
      writer.uint32(8).uint32(message.shardId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetShardSnapshotMetadataRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetShardSnapshotMetadataRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
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

  fromJSON(object: any): GetShardSnapshotMetadataRequest {
    return { shardId: isSet(object.shardId) ? Number(object.shardId) : 0 };
  },

  toJSON(message: GetShardSnapshotMetadataRequest): unknown {
    const obj: any = {};
    message.shardId !== undefined && (obj.shardId = Math.round(message.shardId));
    return obj;
  },

  create<I extends Exact<DeepPartial<GetShardSnapshotMetadataRequest>, I>>(base?: I): GetShardSnapshotMetadataRequest {
    return GetShardSnapshotMetadataRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetShardSnapshotMetadataRequest>, I>>(
    object: I,
  ): GetShardSnapshotMetadataRequest {
    const message = createBaseGetShardSnapshotMetadataRequest();
    message.shardId = object.shardId ?? 0;
    return message;
  },
};

function createBaseShardSnapshotMetadata(): ShardSnapshotMetadata {
  return { shardId: 0, height: 0, timestamp: 0, shardChunk: undefined, block: undefined, numItems: 0 };
}

export const ShardSnapshotMetadata = {
  encode(message: ShardSnapshotMetadata, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.shardId !== 0) {
      writer.uint32(8).uint32(message.shardId);
    }
    if (message.height !== 0) {
      writer.uint32(16).uint64(message.height);
    }
    if (message.timestamp !== 0) {
      writer.uint32(24).uint64(message.timestamp);
    }
    if (message.shardChunk !== undefined) {
      ShardChunk.encode(message.shardChunk, writer.uint32(42).fork()).ldelim();
    }
    if (message.block !== undefined) {
      Block.encode(message.block, writer.uint32(50).fork()).ldelim();
    }
    if (message.numItems !== 0) {
      writer.uint32(56).uint64(message.numItems);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ShardSnapshotMetadata {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseShardSnapshotMetadata();
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

          message.height = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.timestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.shardChunk = ShardChunk.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.block = Block.decode(reader, reader.uint32());
          continue;
        case 7:
          if (tag != 56) {
            break;
          }

          message.numItems = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ShardSnapshotMetadata {
    return {
      shardId: isSet(object.shardId) ? Number(object.shardId) : 0,
      height: isSet(object.height) ? Number(object.height) : 0,
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      shardChunk: isSet(object.shardChunk) ? ShardChunk.fromJSON(object.shardChunk) : undefined,
      block: isSet(object.block) ? Block.fromJSON(object.block) : undefined,
      numItems: isSet(object.numItems) ? Number(object.numItems) : 0,
    };
  },

  toJSON(message: ShardSnapshotMetadata): unknown {
    const obj: any = {};
    message.shardId !== undefined && (obj.shardId = Math.round(message.shardId));
    message.height !== undefined && (obj.height = Math.round(message.height));
    message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
    message.shardChunk !== undefined &&
      (obj.shardChunk = message.shardChunk ? ShardChunk.toJSON(message.shardChunk) : undefined);
    message.block !== undefined && (obj.block = message.block ? Block.toJSON(message.block) : undefined);
    message.numItems !== undefined && (obj.numItems = Math.round(message.numItems));
    return obj;
  },

  create<I extends Exact<DeepPartial<ShardSnapshotMetadata>, I>>(base?: I): ShardSnapshotMetadata {
    return ShardSnapshotMetadata.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ShardSnapshotMetadata>, I>>(object: I): ShardSnapshotMetadata {
    const message = createBaseShardSnapshotMetadata();
    message.shardId = object.shardId ?? 0;
    message.height = object.height ?? 0;
    message.timestamp = object.timestamp ?? 0;
    message.shardChunk = (object.shardChunk !== undefined && object.shardChunk !== null)
      ? ShardChunk.fromPartial(object.shardChunk)
      : undefined;
    message.block = (object.block !== undefined && object.block !== null) ? Block.fromPartial(object.block) : undefined;
    message.numItems = object.numItems ?? 0;
    return message;
  },
};

function createBaseGetShardSnapshotMetadataResponse(): GetShardSnapshotMetadataResponse {
  return { snapshots: [] };
}

export const GetShardSnapshotMetadataResponse = {
  encode(message: GetShardSnapshotMetadataResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.snapshots) {
      ShardSnapshotMetadata.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetShardSnapshotMetadataResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetShardSnapshotMetadataResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.snapshots.push(ShardSnapshotMetadata.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetShardSnapshotMetadataResponse {
    return {
      snapshots: Array.isArray(object?.snapshots)
        ? object.snapshots.map((e: any) => ShardSnapshotMetadata.fromJSON(e))
        : [],
    };
  },

  toJSON(message: GetShardSnapshotMetadataResponse): unknown {
    const obj: any = {};
    if (message.snapshots) {
      obj.snapshots = message.snapshots.map((e) => e ? ShardSnapshotMetadata.toJSON(e) : undefined);
    } else {
      obj.snapshots = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetShardSnapshotMetadataResponse>, I>>(
    base?: I,
  ): GetShardSnapshotMetadataResponse {
    return GetShardSnapshotMetadataResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetShardSnapshotMetadataResponse>, I>>(
    object: I,
  ): GetShardSnapshotMetadataResponse {
    const message = createBaseGetShardSnapshotMetadataResponse();
    message.snapshots = object.snapshots?.map((e) => ShardSnapshotMetadata.fromPartial(e)) || [];
    return message;
  },
};

function createBaseGetShardTransactionsRequest(): GetShardTransactionsRequest {
  return { shardId: 0, height: 0, trieVirtualShard: 0, pageToken: undefined };
}

export const GetShardTransactionsRequest = {
  encode(message: GetShardTransactionsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.shardId !== 0) {
      writer.uint32(8).uint32(message.shardId);
    }
    if (message.height !== 0) {
      writer.uint32(16).uint64(message.height);
    }
    if (message.trieVirtualShard !== 0) {
      writer.uint32(24).uint32(message.trieVirtualShard);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(34).string(message.pageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetShardTransactionsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetShardTransactionsRequest();
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

          message.height = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.trieVirtualShard = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.pageToken = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetShardTransactionsRequest {
    return {
      shardId: isSet(object.shardId) ? Number(object.shardId) : 0,
      height: isSet(object.height) ? Number(object.height) : 0,
      trieVirtualShard: isSet(object.trieVirtualShard) ? Number(object.trieVirtualShard) : 0,
      pageToken: isSet(object.pageToken) ? String(object.pageToken) : undefined,
    };
  },

  toJSON(message: GetShardTransactionsRequest): unknown {
    const obj: any = {};
    message.shardId !== undefined && (obj.shardId = Math.round(message.shardId));
    message.height !== undefined && (obj.height = Math.round(message.height));
    message.trieVirtualShard !== undefined && (obj.trieVirtualShard = Math.round(message.trieVirtualShard));
    message.pageToken !== undefined && (obj.pageToken = message.pageToken);
    return obj;
  },

  create<I extends Exact<DeepPartial<GetShardTransactionsRequest>, I>>(base?: I): GetShardTransactionsRequest {
    return GetShardTransactionsRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetShardTransactionsRequest>, I>>(object: I): GetShardTransactionsRequest {
    const message = createBaseGetShardTransactionsRequest();
    message.shardId = object.shardId ?? 0;
    message.height = object.height ?? 0;
    message.trieVirtualShard = object.trieVirtualShard ?? 0;
    message.pageToken = object.pageToken ?? undefined;
    return message;
  },
};

function createBaseGetShardTransactionsResponse(): GetShardTransactionsResponse {
  return { trieMessages: [], fidAccountRoots: [], nextPageToken: undefined };
}

export const GetShardTransactionsResponse = {
  encode(message: GetShardTransactionsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.trieMessages) {
      ShardTrieEntryWithMessage.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.fidAccountRoots) {
      FidAccountRootHash.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.nextPageToken !== undefined) {
      writer.uint32(26).string(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetShardTransactionsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetShardTransactionsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.trieMessages.push(ShardTrieEntryWithMessage.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.fidAccountRoots.push(FidAccountRootHash.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.nextPageToken = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetShardTransactionsResponse {
    return {
      trieMessages: Array.isArray(object?.trieMessages)
        ? object.trieMessages.map((e: any) => ShardTrieEntryWithMessage.fromJSON(e))
        : [],
      fidAccountRoots: Array.isArray(object?.fidAccountRoots)
        ? object.fidAccountRoots.map((e: any) => FidAccountRootHash.fromJSON(e))
        : [],
      nextPageToken: isSet(object.nextPageToken) ? String(object.nextPageToken) : undefined,
    };
  },

  toJSON(message: GetShardTransactionsResponse): unknown {
    const obj: any = {};
    if (message.trieMessages) {
      obj.trieMessages = message.trieMessages.map((e) => e ? ShardTrieEntryWithMessage.toJSON(e) : undefined);
    } else {
      obj.trieMessages = [];
    }
    if (message.fidAccountRoots) {
      obj.fidAccountRoots = message.fidAccountRoots.map((e) => e ? FidAccountRootHash.toJSON(e) : undefined);
    } else {
      obj.fidAccountRoots = [];
    }
    message.nextPageToken !== undefined && (obj.nextPageToken = message.nextPageToken);
    return obj;
  },

  create<I extends Exact<DeepPartial<GetShardTransactionsResponse>, I>>(base?: I): GetShardTransactionsResponse {
    return GetShardTransactionsResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetShardTransactionsResponse>, I>>(object: I): GetShardTransactionsResponse {
    const message = createBaseGetShardTransactionsResponse();
    message.trieMessages = object.trieMessages?.map((e) => ShardTrieEntryWithMessage.fromPartial(e)) || [];
    message.fidAccountRoots = object.fidAccountRoots?.map((e) => FidAccountRootHash.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    return message;
  },
};

function createBaseShardTrieEntryWithMessage(): ShardTrieEntryWithMessage {
  return { trieKey: new Uint8Array(), userMessage: undefined, onChainEvent: undefined, fnameTransfer: undefined };
}

export const ShardTrieEntryWithMessage = {
  encode(message: ShardTrieEntryWithMessage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.trieKey.length !== 0) {
      writer.uint32(10).bytes(message.trieKey);
    }
    if (message.userMessage !== undefined) {
      Message.encode(message.userMessage, writer.uint32(18).fork()).ldelim();
    }
    if (message.onChainEvent !== undefined) {
      OnChainEvent.encode(message.onChainEvent, writer.uint32(26).fork()).ldelim();
    }
    if (message.fnameTransfer !== undefined) {
      FnameTransfer.encode(message.fnameTransfer, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ShardTrieEntryWithMessage {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseShardTrieEntryWithMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.trieKey = reader.bytes();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.userMessage = Message.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.onChainEvent = OnChainEvent.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.fnameTransfer = FnameTransfer.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ShardTrieEntryWithMessage {
    return {
      trieKey: isSet(object.trieKey) ? bytesFromBase64(object.trieKey) : new Uint8Array(),
      userMessage: isSet(object.userMessage) ? Message.fromJSON(object.userMessage) : undefined,
      onChainEvent: isSet(object.onChainEvent) ? OnChainEvent.fromJSON(object.onChainEvent) : undefined,
      fnameTransfer: isSet(object.fnameTransfer) ? FnameTransfer.fromJSON(object.fnameTransfer) : undefined,
    };
  },

  toJSON(message: ShardTrieEntryWithMessage): unknown {
    const obj: any = {};
    message.trieKey !== undefined &&
      (obj.trieKey = base64FromBytes(message.trieKey !== undefined ? message.trieKey : new Uint8Array()));
    message.userMessage !== undefined &&
      (obj.userMessage = message.userMessage ? Message.toJSON(message.userMessage) : undefined);
    message.onChainEvent !== undefined &&
      (obj.onChainEvent = message.onChainEvent ? OnChainEvent.toJSON(message.onChainEvent) : undefined);
    message.fnameTransfer !== undefined &&
      (obj.fnameTransfer = message.fnameTransfer ? FnameTransfer.toJSON(message.fnameTransfer) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ShardTrieEntryWithMessage>, I>>(base?: I): ShardTrieEntryWithMessage {
    return ShardTrieEntryWithMessage.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ShardTrieEntryWithMessage>, I>>(object: I): ShardTrieEntryWithMessage {
    const message = createBaseShardTrieEntryWithMessage();
    message.trieKey = object.trieKey ?? new Uint8Array();
    message.userMessage = (object.userMessage !== undefined && object.userMessage !== null)
      ? Message.fromPartial(object.userMessage)
      : undefined;
    message.onChainEvent = (object.onChainEvent !== undefined && object.onChainEvent !== null)
      ? OnChainEvent.fromPartial(object.onChainEvent)
      : undefined;
    message.fnameTransfer = (object.fnameTransfer !== undefined && object.fnameTransfer !== null)
      ? FnameTransfer.fromPartial(object.fnameTransfer)
      : undefined;
    return message;
  },
};

function createBaseFidAccountRootHash(): FidAccountRootHash {
  return { fid: 0, accountRootHash: new Uint8Array(), numMessages: 0 };
}

export const FidAccountRootHash = {
  encode(message: FidAccountRootHash, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.accountRootHash.length !== 0) {
      writer.uint32(18).bytes(message.accountRootHash);
    }
    if (message.numMessages !== 0) {
      writer.uint32(24).uint64(message.numMessages);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FidAccountRootHash {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFidAccountRootHash();
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

          message.accountRootHash = reader.bytes();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.numMessages = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FidAccountRootHash {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      accountRootHash: isSet(object.accountRootHash) ? bytesFromBase64(object.accountRootHash) : new Uint8Array(),
      numMessages: isSet(object.numMessages) ? Number(object.numMessages) : 0,
    };
  },

  toJSON(message: FidAccountRootHash): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.accountRootHash !== undefined &&
      (obj.accountRootHash = base64FromBytes(
        message.accountRootHash !== undefined ? message.accountRootHash : new Uint8Array(),
      ));
    message.numMessages !== undefined && (obj.numMessages = Math.round(message.numMessages));
    return obj;
  },

  create<I extends Exact<DeepPartial<FidAccountRootHash>, I>>(base?: I): FidAccountRootHash {
    return FidAccountRootHash.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FidAccountRootHash>, I>>(object: I): FidAccountRootHash {
    const message = createBaseFidAccountRootHash();
    message.fid = object.fid ?? 0;
    message.accountRootHash = object.accountRootHash ?? new Uint8Array();
    message.numMessages = object.numMessages ?? 0;
    return message;
  },
};

function createBaseReplicationTriePartStatus(): ReplicationTriePartStatus {
  return { shardId: 0, height: 0, virtualTrieShard: 0, nextPageToken: undefined, lastResponse: 0, lastFid: undefined };
}

export const ReplicationTriePartStatus = {
  encode(message: ReplicationTriePartStatus, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.shardId !== 0) {
      writer.uint32(8).uint32(message.shardId);
    }
    if (message.height !== 0) {
      writer.uint32(16).uint64(message.height);
    }
    if (message.virtualTrieShard !== 0) {
      writer.uint32(24).uint32(message.virtualTrieShard);
    }
    if (message.nextPageToken !== undefined) {
      writer.uint32(34).string(message.nextPageToken);
    }
    if (message.lastResponse !== 0) {
      writer.uint32(40).uint32(message.lastResponse);
    }
    if (message.lastFid !== undefined) {
      writer.uint32(48).uint64(message.lastFid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ReplicationTriePartStatus {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReplicationTriePartStatus();
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

          message.height = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.virtualTrieShard = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.nextPageToken = reader.string();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.lastResponse = reader.uint32();
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.lastFid = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ReplicationTriePartStatus {
    return {
      shardId: isSet(object.shardId) ? Number(object.shardId) : 0,
      height: isSet(object.height) ? Number(object.height) : 0,
      virtualTrieShard: isSet(object.virtualTrieShard) ? Number(object.virtualTrieShard) : 0,
      nextPageToken: isSet(object.nextPageToken) ? String(object.nextPageToken) : undefined,
      lastResponse: isSet(object.lastResponse) ? Number(object.lastResponse) : 0,
      lastFid: isSet(object.lastFid) ? Number(object.lastFid) : undefined,
    };
  },

  toJSON(message: ReplicationTriePartStatus): unknown {
    const obj: any = {};
    message.shardId !== undefined && (obj.shardId = Math.round(message.shardId));
    message.height !== undefined && (obj.height = Math.round(message.height));
    message.virtualTrieShard !== undefined && (obj.virtualTrieShard = Math.round(message.virtualTrieShard));
    message.nextPageToken !== undefined && (obj.nextPageToken = message.nextPageToken);
    message.lastResponse !== undefined && (obj.lastResponse = Math.round(message.lastResponse));
    message.lastFid !== undefined && (obj.lastFid = Math.round(message.lastFid));
    return obj;
  },

  create<I extends Exact<DeepPartial<ReplicationTriePartStatus>, I>>(base?: I): ReplicationTriePartStatus {
    return ReplicationTriePartStatus.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ReplicationTriePartStatus>, I>>(object: I): ReplicationTriePartStatus {
    const message = createBaseReplicationTriePartStatus();
    message.shardId = object.shardId ?? 0;
    message.height = object.height ?? 0;
    message.virtualTrieShard = object.virtualTrieShard ?? 0;
    message.nextPageToken = object.nextPageToken ?? undefined;
    message.lastResponse = object.lastResponse ?? 0;
    message.lastFid = object.lastFid ?? undefined;
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
