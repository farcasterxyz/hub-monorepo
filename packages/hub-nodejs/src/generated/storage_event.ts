/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export enum StorageRegistryEventType {
  NONE = 0,
  RENT = 1,
  SET_PRICE = 2,
  SET_MAX_UNITS = 3,
  SET_DEPRECATION_TIMESTAMP = 4,
  SET_GRACE_PERIOD = 5,
}

export function storageRegistryEventTypeFromJSON(object: any): StorageRegistryEventType {
  switch (object) {
    case 0:
    case "STORAGE_REGISTRY_EVENT_TYPE_NONE":
      return StorageRegistryEventType.NONE;
    case 1:
    case "STORAGE_REGISTRY_EVENT_TYPE_RENT":
      return StorageRegistryEventType.RENT;
    case 2:
    case "STORAGE_REGISTRY_EVENT_TYPE_SET_PRICE":
      return StorageRegistryEventType.SET_PRICE;
    case 3:
    case "STORAGE_REGISTRY_EVENT_TYPE_SET_MAX_UNITS":
      return StorageRegistryEventType.SET_MAX_UNITS;
    case 4:
    case "STORAGE_REGISTRY_EVENT_TYPE_SET_DEPRECATION_TIMESTAMP":
      return StorageRegistryEventType.SET_DEPRECATION_TIMESTAMP;
    case 5:
    case "STORAGE_REGISTRY_EVENT_TYPE_SET_GRACE_PERIOD":
      return StorageRegistryEventType.SET_GRACE_PERIOD;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum StorageRegistryEventType");
  }
}

export function storageRegistryEventTypeToJSON(object: StorageRegistryEventType): string {
  switch (object) {
    case StorageRegistryEventType.NONE:
      return "STORAGE_REGISTRY_EVENT_TYPE_NONE";
    case StorageRegistryEventType.RENT:
      return "STORAGE_REGISTRY_EVENT_TYPE_RENT";
    case StorageRegistryEventType.SET_PRICE:
      return "STORAGE_REGISTRY_EVENT_TYPE_SET_PRICE";
    case StorageRegistryEventType.SET_MAX_UNITS:
      return "STORAGE_REGISTRY_EVENT_TYPE_SET_MAX_UNITS";
    case StorageRegistryEventType.SET_DEPRECATION_TIMESTAMP:
      return "STORAGE_REGISTRY_EVENT_TYPE_SET_DEPRECATION_TIMESTAMP";
    case StorageRegistryEventType.SET_GRACE_PERIOD:
      return "STORAGE_REGISTRY_EVENT_TYPE_SET_GRACE_PERIOD";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum StorageRegistryEventType");
  }
}

export interface RentRegistryEvent {
  blockNumber: number;
  blockHash: Uint8Array;
  transactionHash: Uint8Array;
  logIndex: number;
  payer: Uint8Array;
  fid: number;
  type: StorageRegistryEventType;
  units: number;
  expiry: number;
}

export interface StorageAdminRegistryEvent {
  blockNumber: number;
  blockHash: Uint8Array;
  transactionHash: Uint8Array;
  logIndex: number;
  timestamp: number;
  from: Uint8Array;
  type: StorageRegistryEventType;
  value: Uint8Array;
}

function createBaseRentRegistryEvent(): RentRegistryEvent {
  return {
    blockNumber: 0,
    blockHash: new Uint8Array(),
    transactionHash: new Uint8Array(),
    logIndex: 0,
    payer: new Uint8Array(),
    fid: 0,
    type: 0,
    units: 0,
    expiry: 0,
  };
}

export const RentRegistryEvent = {
  encode(message: RentRegistryEvent, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.blockNumber !== 0) {
      writer.uint32(8).uint32(message.blockNumber);
    }
    if (message.blockHash.length !== 0) {
      writer.uint32(18).bytes(message.blockHash);
    }
    if (message.transactionHash.length !== 0) {
      writer.uint32(26).bytes(message.transactionHash);
    }
    if (message.logIndex !== 0) {
      writer.uint32(32).uint32(message.logIndex);
    }
    if (message.payer.length !== 0) {
      writer.uint32(42).bytes(message.payer);
    }
    if (message.fid !== 0) {
      writer.uint32(48).uint64(message.fid);
    }
    if (message.type !== 0) {
      writer.uint32(56).int32(message.type);
    }
    if (message.units !== 0) {
      writer.uint32(64).uint32(message.units);
    }
    if (message.expiry !== 0) {
      writer.uint32(72).uint32(message.expiry);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RentRegistryEvent {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRentRegistryEvent();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.blockNumber = reader.uint32();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.blockHash = reader.bytes();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.transactionHash = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.logIndex = reader.uint32();
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.payer = reader.bytes();
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 7:
          if (tag != 56) {
            break;
          }

          message.type = reader.int32() as any;
          continue;
        case 8:
          if (tag != 64) {
            break;
          }

          message.units = reader.uint32();
          continue;
        case 9:
          if (tag != 72) {
            break;
          }

          message.expiry = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): RentRegistryEvent {
    return {
      blockNumber: isSet(object.blockNumber) ? Number(object.blockNumber) : 0,
      blockHash: isSet(object.blockHash) ? bytesFromBase64(object.blockHash) : new Uint8Array(),
      transactionHash: isSet(object.transactionHash) ? bytesFromBase64(object.transactionHash) : new Uint8Array(),
      logIndex: isSet(object.logIndex) ? Number(object.logIndex) : 0,
      payer: isSet(object.payer) ? bytesFromBase64(object.payer) : new Uint8Array(),
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      type: isSet(object.type) ? storageRegistryEventTypeFromJSON(object.type) : 0,
      units: isSet(object.units) ? Number(object.units) : 0,
      expiry: isSet(object.expiry) ? Number(object.expiry) : 0,
    };
  },

  toJSON(message: RentRegistryEvent): unknown {
    const obj: any = {};
    message.blockNumber !== undefined && (obj.blockNumber = Math.round(message.blockNumber));
    message.blockHash !== undefined &&
      (obj.blockHash = base64FromBytes(message.blockHash !== undefined ? message.blockHash : new Uint8Array()));
    message.transactionHash !== undefined &&
      (obj.transactionHash = base64FromBytes(
        message.transactionHash !== undefined ? message.transactionHash : new Uint8Array(),
      ));
    message.logIndex !== undefined && (obj.logIndex = Math.round(message.logIndex));
    message.payer !== undefined &&
      (obj.payer = base64FromBytes(message.payer !== undefined ? message.payer : new Uint8Array()));
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.type !== undefined && (obj.type = storageRegistryEventTypeToJSON(message.type));
    message.units !== undefined && (obj.units = Math.round(message.units));
    message.expiry !== undefined && (obj.expiry = Math.round(message.expiry));
    return obj;
  },

  create<I extends Exact<DeepPartial<RentRegistryEvent>, I>>(base?: I): RentRegistryEvent {
    return RentRegistryEvent.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<RentRegistryEvent>, I>>(object: I): RentRegistryEvent {
    const message = createBaseRentRegistryEvent();
    message.blockNumber = object.blockNumber ?? 0;
    message.blockHash = object.blockHash ?? new Uint8Array();
    message.transactionHash = object.transactionHash ?? new Uint8Array();
    message.logIndex = object.logIndex ?? 0;
    message.payer = object.payer ?? new Uint8Array();
    message.fid = object.fid ?? 0;
    message.type = object.type ?? 0;
    message.units = object.units ?? 0;
    message.expiry = object.expiry ?? 0;
    return message;
  },
};

function createBaseStorageAdminRegistryEvent(): StorageAdminRegistryEvent {
  return {
    blockNumber: 0,
    blockHash: new Uint8Array(),
    transactionHash: new Uint8Array(),
    logIndex: 0,
    timestamp: 0,
    from: new Uint8Array(),
    type: 0,
    value: new Uint8Array(),
  };
}

export const StorageAdminRegistryEvent = {
  encode(message: StorageAdminRegistryEvent, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.blockNumber !== 0) {
      writer.uint32(8).uint32(message.blockNumber);
    }
    if (message.blockHash.length !== 0) {
      writer.uint32(18).bytes(message.blockHash);
    }
    if (message.transactionHash.length !== 0) {
      writer.uint32(26).bytes(message.transactionHash);
    }
    if (message.logIndex !== 0) {
      writer.uint32(32).uint32(message.logIndex);
    }
    if (message.timestamp !== 0) {
      writer.uint32(40).uint64(message.timestamp);
    }
    if (message.from.length !== 0) {
      writer.uint32(50).bytes(message.from);
    }
    if (message.type !== 0) {
      writer.uint32(56).int32(message.type);
    }
    if (message.value.length !== 0) {
      writer.uint32(66).bytes(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StorageAdminRegistryEvent {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStorageAdminRegistryEvent();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.blockNumber = reader.uint32();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.blockHash = reader.bytes();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.transactionHash = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.logIndex = reader.uint32();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.timestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.from = reader.bytes();
          continue;
        case 7:
          if (tag != 56) {
            break;
          }

          message.type = reader.int32() as any;
          continue;
        case 8:
          if (tag != 66) {
            break;
          }

          message.value = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): StorageAdminRegistryEvent {
    return {
      blockNumber: isSet(object.blockNumber) ? Number(object.blockNumber) : 0,
      blockHash: isSet(object.blockHash) ? bytesFromBase64(object.blockHash) : new Uint8Array(),
      transactionHash: isSet(object.transactionHash) ? bytesFromBase64(object.transactionHash) : new Uint8Array(),
      logIndex: isSet(object.logIndex) ? Number(object.logIndex) : 0,
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      from: isSet(object.from) ? bytesFromBase64(object.from) : new Uint8Array(),
      type: isSet(object.type) ? storageRegistryEventTypeFromJSON(object.type) : 0,
      value: isSet(object.value) ? bytesFromBase64(object.value) : new Uint8Array(),
    };
  },

  toJSON(message: StorageAdminRegistryEvent): unknown {
    const obj: any = {};
    message.blockNumber !== undefined && (obj.blockNumber = Math.round(message.blockNumber));
    message.blockHash !== undefined &&
      (obj.blockHash = base64FromBytes(message.blockHash !== undefined ? message.blockHash : new Uint8Array()));
    message.transactionHash !== undefined &&
      (obj.transactionHash = base64FromBytes(
        message.transactionHash !== undefined ? message.transactionHash : new Uint8Array(),
      ));
    message.logIndex !== undefined && (obj.logIndex = Math.round(message.logIndex));
    message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
    message.from !== undefined &&
      (obj.from = base64FromBytes(message.from !== undefined ? message.from : new Uint8Array()));
    message.type !== undefined && (obj.type = storageRegistryEventTypeToJSON(message.type));
    message.value !== undefined &&
      (obj.value = base64FromBytes(message.value !== undefined ? message.value : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<StorageAdminRegistryEvent>, I>>(base?: I): StorageAdminRegistryEvent {
    return StorageAdminRegistryEvent.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<StorageAdminRegistryEvent>, I>>(object: I): StorageAdminRegistryEvent {
    const message = createBaseStorageAdminRegistryEvent();
    message.blockNumber = object.blockNumber ?? 0;
    message.blockHash = object.blockHash ?? new Uint8Array();
    message.transactionHash = object.transactionHash ?? new Uint8Array();
    message.logIndex = object.logIndex ?? 0;
    message.timestamp = object.timestamp ?? 0;
    message.from = object.from ?? new Uint8Array();
    message.type = object.type ?? 0;
    message.value = object.value ?? new Uint8Array();
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
