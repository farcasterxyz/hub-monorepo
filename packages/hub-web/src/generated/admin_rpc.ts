/* eslint-disable */
import { grpc } from "@improbable-eng/grpc-web";
import { BrowserHeaders } from "browser-headers";
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

export interface RetryFnameRequest {
  fid?: number | undefined;
  fname?: string | undefined;
}

export interface UploadSnapshotRequest {
  shardIndexes: number[];
}

export interface RunOnchainEventsMigrationRequest {
  shardId: number;
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

function createBaseRetryFnameRequest(): RetryFnameRequest {
  return { fid: undefined, fname: undefined };
}

export const RetryFnameRequest = {
  encode(message: RetryFnameRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== undefined) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.fname !== undefined) {
      writer.uint32(18).string(message.fname);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RetryFnameRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRetryFnameRequest();
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

          message.fname = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): RetryFnameRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : undefined,
      fname: isSet(object.fname) ? String(object.fname) : undefined,
    };
  },

  toJSON(message: RetryFnameRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.fname !== undefined && (obj.fname = message.fname);
    return obj;
  },

  create<I extends Exact<DeepPartial<RetryFnameRequest>, I>>(base?: I): RetryFnameRequest {
    return RetryFnameRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<RetryFnameRequest>, I>>(object: I): RetryFnameRequest {
    const message = createBaseRetryFnameRequest();
    message.fid = object.fid ?? undefined;
    message.fname = object.fname ?? undefined;
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

function createBaseRunOnchainEventsMigrationRequest(): RunOnchainEventsMigrationRequest {
  return { shardId: 0 };
}

export const RunOnchainEventsMigrationRequest = {
  encode(message: RunOnchainEventsMigrationRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.shardId !== 0) {
      writer.uint32(8).uint64(message.shardId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RunOnchainEventsMigrationRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRunOnchainEventsMigrationRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.shardId = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): RunOnchainEventsMigrationRequest {
    return { shardId: isSet(object.shardId) ? Number(object.shardId) : 0 };
  },

  toJSON(message: RunOnchainEventsMigrationRequest): unknown {
    const obj: any = {};
    message.shardId !== undefined && (obj.shardId = Math.round(message.shardId));
    return obj;
  },

  create<I extends Exact<DeepPartial<RunOnchainEventsMigrationRequest>, I>>(
    base?: I,
  ): RunOnchainEventsMigrationRequest {
    return RunOnchainEventsMigrationRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<RunOnchainEventsMigrationRequest>, I>>(
    object: I,
  ): RunOnchainEventsMigrationRequest {
    const message = createBaseRunOnchainEventsMigrationRequest();
    message.shardId = object.shardId ?? 0;
    return message;
  },
};

export interface AdminService {
  submitOnChainEvent(request: DeepPartial<OnChainEvent>, metadata?: grpc.Metadata): Promise<OnChainEvent>;
  submitUserNameProof(request: DeepPartial<UserNameProof>, metadata?: grpc.Metadata): Promise<UserNameProof>;
  uploadSnapshot(request: DeepPartial<UploadSnapshotRequest>, metadata?: grpc.Metadata): Promise<Empty>;
  retryOnchainEvents(request: DeepPartial<RetryOnchainEventsRequest>, metadata?: grpc.Metadata): Promise<Empty>;
  retryFnameEvents(request: DeepPartial<RetryFnameRequest>, metadata?: grpc.Metadata): Promise<Empty>;
  runOnchainEventsMigration(
    request: DeepPartial<RunOnchainEventsMigrationRequest>,
    metadata?: grpc.Metadata,
  ): Promise<Empty>;
}

export class AdminServiceClientImpl implements AdminService {
  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.submitOnChainEvent = this.submitOnChainEvent.bind(this);
    this.submitUserNameProof = this.submitUserNameProof.bind(this);
    this.uploadSnapshot = this.uploadSnapshot.bind(this);
    this.retryOnchainEvents = this.retryOnchainEvents.bind(this);
    this.retryFnameEvents = this.retryFnameEvents.bind(this);
    this.runOnchainEventsMigration = this.runOnchainEventsMigration.bind(this);
  }

  submitOnChainEvent(request: DeepPartial<OnChainEvent>, metadata?: grpc.Metadata): Promise<OnChainEvent> {
    return this.rpc.unary(AdminServiceSubmitOnChainEventDesc, OnChainEvent.fromPartial(request), metadata);
  }

  submitUserNameProof(request: DeepPartial<UserNameProof>, metadata?: grpc.Metadata): Promise<UserNameProof> {
    return this.rpc.unary(AdminServiceSubmitUserNameProofDesc, UserNameProof.fromPartial(request), metadata);
  }

  uploadSnapshot(request: DeepPartial<UploadSnapshotRequest>, metadata?: grpc.Metadata): Promise<Empty> {
    return this.rpc.unary(AdminServiceUploadSnapshotDesc, UploadSnapshotRequest.fromPartial(request), metadata);
  }

  retryOnchainEvents(request: DeepPartial<RetryOnchainEventsRequest>, metadata?: grpc.Metadata): Promise<Empty> {
    return this.rpc.unary(AdminServiceRetryOnchainEventsDesc, RetryOnchainEventsRequest.fromPartial(request), metadata);
  }

  retryFnameEvents(request: DeepPartial<RetryFnameRequest>, metadata?: grpc.Metadata): Promise<Empty> {
    return this.rpc.unary(AdminServiceRetryFnameEventsDesc, RetryFnameRequest.fromPartial(request), metadata);
  }

  runOnchainEventsMigration(
    request: DeepPartial<RunOnchainEventsMigrationRequest>,
    metadata?: grpc.Metadata,
  ): Promise<Empty> {
    return this.rpc.unary(
      AdminServiceRunOnchainEventsMigrationDesc,
      RunOnchainEventsMigrationRequest.fromPartial(request),
      metadata,
    );
  }
}

export const AdminServiceDesc = { serviceName: "AdminService" };

export const AdminServiceSubmitOnChainEventDesc: UnaryMethodDefinitionish = {
  methodName: "SubmitOnChainEvent",
  service: AdminServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return OnChainEvent.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = OnChainEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const AdminServiceSubmitUserNameProofDesc: UnaryMethodDefinitionish = {
  methodName: "SubmitUserNameProof",
  service: AdminServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return UserNameProof.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = UserNameProof.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const AdminServiceUploadSnapshotDesc: UnaryMethodDefinitionish = {
  methodName: "UploadSnapshot",
  service: AdminServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return UploadSnapshotRequest.encode(this).finish();
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

export const AdminServiceRetryOnchainEventsDesc: UnaryMethodDefinitionish = {
  methodName: "RetryOnchainEvents",
  service: AdminServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return RetryOnchainEventsRequest.encode(this).finish();
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

export const AdminServiceRetryFnameEventsDesc: UnaryMethodDefinitionish = {
  methodName: "RetryFnameEvents",
  service: AdminServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return RetryFnameRequest.encode(this).finish();
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

export const AdminServiceRunOnchainEventsMigrationDesc: UnaryMethodDefinitionish = {
  methodName: "RunOnchainEventsMigration",
  service: AdminServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return RunOnchainEventsMigrationRequest.encode(this).finish();
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

interface UnaryMethodDefinitionishR extends grpc.UnaryMethodDefinition<any, any> {
  requestStream: any;
  responseStream: any;
}

type UnaryMethodDefinitionish = UnaryMethodDefinitionishR;

interface Rpc {
  unary<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    request: any,
    metadata: grpc.Metadata | undefined,
  ): Promise<any>;
}

export class GrpcWebImpl {
  private host: string;
  private options: {
    transport?: grpc.TransportFactory;

    debug?: boolean;
    metadata?: grpc.Metadata;
    upStreamRetryCodes?: number[];
  };

  constructor(
    host: string,
    options: {
      transport?: grpc.TransportFactory;

      debug?: boolean;
      metadata?: grpc.Metadata;
      upStreamRetryCodes?: number[];
    },
  ) {
    this.host = host;
    this.options = options;
  }

  unary<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    _request: any,
    metadata: grpc.Metadata | undefined,
  ): Promise<any> {
    const request = { ..._request, ...methodDesc.requestType };
    const maybeCombinedMetadata = metadata && this.options.metadata
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
}

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

export class GrpcWebError extends tsProtoGlobalThis.Error {
  constructor(message: string, public code: grpc.Code, public metadata: grpc.Metadata) {
    super(message);
  }
}
