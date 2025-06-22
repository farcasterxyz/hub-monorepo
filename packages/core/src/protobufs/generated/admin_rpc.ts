/* eslint-disable */
import {
  CallOptions,
  ChannelCredentials,
  Client,
  ClientOptions,
  ClientUnaryCall,
  handleUnaryCall,
  makeGenericClientConstructor,
  Metadata,
  ServiceError,
  UntypedServiceImplementation,
} from "@grpc/grpc-js";
import Long from "long";
import _m0 from "protobufjs/minimal";
import { OnChainEvent } from "./onchain_event";
import { UserNameProof } from "./username_proof";

export interface Empty {
}

export interface RetryBlockNumberRange {
  startBlockNumber: number;
  stopBlockNumber: number;
}

export interface RetryOnchainEventsRequest {
  fid?: number | undefined;
  blockRange?: RetryBlockNumberRange | undefined;
}

export interface UploadSnapshotRequest {
  shardIndexes: number[];
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

function createBaseRetryBlockNumberRange(): RetryBlockNumberRange {
  return { startBlockNumber: 0, stopBlockNumber: 0 };
}

export const RetryBlockNumberRange = {
  encode(message: RetryBlockNumberRange, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.startBlockNumber !== 0) {
      writer.uint32(8).uint64(message.startBlockNumber);
    }
    if (message.stopBlockNumber !== 0) {
      writer.uint32(16).uint64(message.stopBlockNumber);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RetryBlockNumberRange {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRetryBlockNumberRange();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.startBlockNumber = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
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

  fromJSON(object: any): RetryBlockNumberRange {
    return {
      startBlockNumber: isSet(object.startBlockNumber) ? Number(object.startBlockNumber) : 0,
      stopBlockNumber: isSet(object.stopBlockNumber) ? Number(object.stopBlockNumber) : 0,
    };
  },

  toJSON(message: RetryBlockNumberRange): unknown {
    const obj: any = {};
    message.startBlockNumber !== undefined && (obj.startBlockNumber = Math.round(message.startBlockNumber));
    message.stopBlockNumber !== undefined && (obj.stopBlockNumber = Math.round(message.stopBlockNumber));
    return obj;
  },

  create<I extends Exact<DeepPartial<RetryBlockNumberRange>, I>>(base?: I): RetryBlockNumberRange {
    return RetryBlockNumberRange.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<RetryBlockNumberRange>, I>>(object: I): RetryBlockNumberRange {
    const message = createBaseRetryBlockNumberRange();
    message.startBlockNumber = object.startBlockNumber ?? 0;
    message.stopBlockNumber = object.stopBlockNumber ?? 0;
    return message;
  },
};

function createBaseRetryOnchainEventsRequest(): RetryOnchainEventsRequest {
  return { fid: undefined, blockRange: undefined };
}

export const RetryOnchainEventsRequest = {
  encode(message: RetryOnchainEventsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== undefined) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.blockRange !== undefined) {
      RetryBlockNumberRange.encode(message.blockRange, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RetryOnchainEventsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRetryOnchainEventsRequest();
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

          message.blockRange = RetryBlockNumberRange.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): RetryOnchainEventsRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : undefined,
      blockRange: isSet(object.blockRange) ? RetryBlockNumberRange.fromJSON(object.blockRange) : undefined,
    };
  },

  toJSON(message: RetryOnchainEventsRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.blockRange !== undefined &&
      (obj.blockRange = message.blockRange ? RetryBlockNumberRange.toJSON(message.blockRange) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<RetryOnchainEventsRequest>, I>>(base?: I): RetryOnchainEventsRequest {
    return RetryOnchainEventsRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<RetryOnchainEventsRequest>, I>>(object: I): RetryOnchainEventsRequest {
    const message = createBaseRetryOnchainEventsRequest();
    message.fid = object.fid ?? undefined;
    message.blockRange = (object.blockRange !== undefined && object.blockRange !== null)
      ? RetryBlockNumberRange.fromPartial(object.blockRange)
      : undefined;
    return message;
  },
};

function createBaseUploadSnapshotRequest(): UploadSnapshotRequest {
  return { shardIndexes: [] };
}

export const UploadSnapshotRequest = {
  encode(message: UploadSnapshotRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    writer.uint32(10).fork();
    for (const v of message.shardIndexes) {
      writer.uint32(v);
    }
    writer.ldelim();
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UploadSnapshotRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUploadSnapshotRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag == 8) {
            message.shardIndexes.push(reader.uint32());
            continue;
          }

          if (tag == 10) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.shardIndexes.push(reader.uint32());
            }

            continue;
          }

          break;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UploadSnapshotRequest {
    return { shardIndexes: Array.isArray(object?.shardIndexes) ? object.shardIndexes.map((e: any) => Number(e)) : [] };
  },

  toJSON(message: UploadSnapshotRequest): unknown {
    const obj: any = {};
    if (message.shardIndexes) {
      obj.shardIndexes = message.shardIndexes.map((e) => Math.round(e));
    } else {
      obj.shardIndexes = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<UploadSnapshotRequest>, I>>(base?: I): UploadSnapshotRequest {
    return UploadSnapshotRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<UploadSnapshotRequest>, I>>(object: I): UploadSnapshotRequest {
    const message = createBaseUploadSnapshotRequest();
    message.shardIndexes = object.shardIndexes?.map((e) => e) || [];
    return message;
  },
};

export type AdminServiceService = typeof AdminServiceService;
export const AdminServiceService = {
  submitOnChainEvent: {
    path: "/AdminService/SubmitOnChainEvent",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: OnChainEvent) => Buffer.from(OnChainEvent.encode(value).finish()),
    requestDeserialize: (value: Buffer) => OnChainEvent.decode(value),
    responseSerialize: (value: OnChainEvent) => Buffer.from(OnChainEvent.encode(value).finish()),
    responseDeserialize: (value: Buffer) => OnChainEvent.decode(value),
  },
  submitUserNameProof: {
    path: "/AdminService/SubmitUserNameProof",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: UserNameProof) => Buffer.from(UserNameProof.encode(value).finish()),
    requestDeserialize: (value: Buffer) => UserNameProof.decode(value),
    responseSerialize: (value: UserNameProof) => Buffer.from(UserNameProof.encode(value).finish()),
    responseDeserialize: (value: Buffer) => UserNameProof.decode(value),
  },
  uploadSnapshot: {
    path: "/AdminService/UploadSnapshot",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: UploadSnapshotRequest) => Buffer.from(UploadSnapshotRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => UploadSnapshotRequest.decode(value),
    responseSerialize: (value: Empty) => Buffer.from(Empty.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Empty.decode(value),
  },
  retryOnchainEvents: {
    path: "/AdminService/RetryOnchainEvents",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: RetryOnchainEventsRequest) =>
      Buffer.from(RetryOnchainEventsRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => RetryOnchainEventsRequest.decode(value),
    responseSerialize: (value: Empty) => Buffer.from(Empty.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Empty.decode(value),
  },
} as const;

export interface AdminServiceServer extends UntypedServiceImplementation {
  submitOnChainEvent: handleUnaryCall<OnChainEvent, OnChainEvent>;
  submitUserNameProof: handleUnaryCall<UserNameProof, UserNameProof>;
  uploadSnapshot: handleUnaryCall<UploadSnapshotRequest, Empty>;
  retryOnchainEvents: handleUnaryCall<RetryOnchainEventsRequest, Empty>;
}

export interface AdminServiceClient extends Client {
  submitOnChainEvent(
    request: OnChainEvent,
    callback: (error: ServiceError | null, response: OnChainEvent) => void,
  ): ClientUnaryCall;
  submitOnChainEvent(
    request: OnChainEvent,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: OnChainEvent) => void,
  ): ClientUnaryCall;
  submitOnChainEvent(
    request: OnChainEvent,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: OnChainEvent) => void,
  ): ClientUnaryCall;
  submitUserNameProof(
    request: UserNameProof,
    callback: (error: ServiceError | null, response: UserNameProof) => void,
  ): ClientUnaryCall;
  submitUserNameProof(
    request: UserNameProof,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: UserNameProof) => void,
  ): ClientUnaryCall;
  submitUserNameProof(
    request: UserNameProof,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: UserNameProof) => void,
  ): ClientUnaryCall;
  uploadSnapshot(
    request: UploadSnapshotRequest,
    callback: (error: ServiceError | null, response: Empty) => void,
  ): ClientUnaryCall;
  uploadSnapshot(
    request: UploadSnapshotRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Empty) => void,
  ): ClientUnaryCall;
  uploadSnapshot(
    request: UploadSnapshotRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Empty) => void,
  ): ClientUnaryCall;
  retryOnchainEvents(
    request: RetryOnchainEventsRequest,
    callback: (error: ServiceError | null, response: Empty) => void,
  ): ClientUnaryCall;
  retryOnchainEvents(
    request: RetryOnchainEventsRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Empty) => void,
  ): ClientUnaryCall;
  retryOnchainEvents(
    request: RetryOnchainEventsRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Empty) => void,
  ): ClientUnaryCall;
}

export const AdminServiceClient = makeGenericClientConstructor(AdminServiceService, "AdminService") as unknown as {
  new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): AdminServiceClient;
  service: typeof AdminServiceService;
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
