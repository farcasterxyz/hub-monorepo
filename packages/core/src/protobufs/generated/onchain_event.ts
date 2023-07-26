/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export enum OnChainEventType {
  EVENT_TYPE_NONE = 0,
  EVENT_TYPE_SIGNER = 1,
  EVENT_TYPE_SIGNER_MIGRATED = 2,
}

export function onChainEventTypeFromJSON(object: any): OnChainEventType {
  switch (object) {
    case 0:
    case "EVENT_TYPE_NONE":
      return OnChainEventType.EVENT_TYPE_NONE;
    case 1:
    case "EVENT_TYPE_SIGNER":
      return OnChainEventType.EVENT_TYPE_SIGNER;
    case 2:
    case "EVENT_TYPE_SIGNER_MIGRATED":
      return OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum OnChainEventType");
  }
}

export function onChainEventTypeToJSON(object: OnChainEventType): string {
  switch (object) {
    case OnChainEventType.EVENT_TYPE_NONE:
      return "EVENT_TYPE_NONE";
    case OnChainEventType.EVENT_TYPE_SIGNER:
      return "EVENT_TYPE_SIGNER";
    case OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED:
      return "EVENT_TYPE_SIGNER_MIGRATED";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum OnChainEventType");
  }
}

export enum KeyRegistryEventType {
  NONE = 0,
  ADD = 1,
  REMOVE = 2,
  ADMIN_RESET = 3,
}

export function keyRegistryEventTypeFromJSON(object: any): KeyRegistryEventType {
  switch (object) {
    case 0:
    case "KEY_REGISTRY_EVENT_TYPE_NONE":
      return KeyRegistryEventType.NONE;
    case 1:
    case "KEY_REGISTRY_EVENT_TYPE_ADD":
      return KeyRegistryEventType.ADD;
    case 2:
    case "KEY_REGISTRY_EVENT_TYPE_REMOVE":
      return KeyRegistryEventType.REMOVE;
    case 3:
    case "KEY_REGISTRY_EVENT_TYPE_ADMIN_RESET":
      return KeyRegistryEventType.ADMIN_RESET;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum KeyRegistryEventType");
  }
}

export function keyRegistryEventTypeToJSON(object: KeyRegistryEventType): string {
  switch (object) {
    case KeyRegistryEventType.NONE:
      return "KEY_REGISTRY_EVENT_TYPE_NONE";
    case KeyRegistryEventType.ADD:
      return "KEY_REGISTRY_EVENT_TYPE_ADD";
    case KeyRegistryEventType.REMOVE:
      return "KEY_REGISTRY_EVENT_TYPE_REMOVE";
    case KeyRegistryEventType.ADMIN_RESET:
      return "KEY_REGISTRY_EVENT_TYPE_ADMIN_RESET";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum KeyRegistryEventType");
  }
}

export interface OnChainEvent {
  type: OnChainEventType;
  chainId: number;
  blockNumber: number;
  blockHash: Uint8Array;
  blockTimestamp: number;
  transactionHash: Uint8Array;
  logIndex: number;
  fid: number;
  keyRegistryBody?: KeyRegistryBody | undefined;
}

export interface KeyRegistryBody {
  key: Uint8Array;
  scheme: number;
  eventType: KeyRegistryEventType;
}

function createBaseOnChainEvent(): OnChainEvent {
  return {
    type: 0,
    chainId: 0,
    blockNumber: 0,
    blockHash: new Uint8Array(),
    blockTimestamp: 0,
    transactionHash: new Uint8Array(),
    logIndex: 0,
    fid: 0,
    keyRegistryBody: undefined,
  };
}

export const OnChainEvent = {
  encode(message: OnChainEvent, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== 0) {
      writer.uint32(8).int32(message.type);
    }
    if (message.chainId !== 0) {
      writer.uint32(16).uint32(message.chainId);
    }
    if (message.blockNumber !== 0) {
      writer.uint32(24).uint32(message.blockNumber);
    }
    if (message.blockHash.length !== 0) {
      writer.uint32(34).bytes(message.blockHash);
    }
    if (message.blockTimestamp !== 0) {
      writer.uint32(40).uint64(message.blockTimestamp);
    }
    if (message.transactionHash.length !== 0) {
      writer.uint32(50).bytes(message.transactionHash);
    }
    if (message.logIndex !== 0) {
      writer.uint32(56).uint32(message.logIndex);
    }
    if (message.fid !== 0) {
      writer.uint32(64).uint64(message.fid);
    }
    if (message.keyRegistryBody !== undefined) {
      KeyRegistryBody.encode(message.keyRegistryBody, writer.uint32(74).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OnChainEvent {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOnChainEvent();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.type = reader.int32() as any;
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.chainId = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.blockNumber = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.blockHash = reader.bytes();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.blockTimestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.transactionHash = reader.bytes();
          continue;
        case 7:
          if (tag != 56) {
            break;
          }

          message.logIndex = reader.uint32();
          continue;
        case 8:
          if (tag != 64) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 9:
          if (tag != 74) {
            break;
          }

          message.keyRegistryBody = KeyRegistryBody.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): OnChainEvent {
    return {
      type: isSet(object.type) ? onChainEventTypeFromJSON(object.type) : 0,
      chainId: isSet(object.chainId) ? Number(object.chainId) : 0,
      blockNumber: isSet(object.blockNumber) ? Number(object.blockNumber) : 0,
      blockHash: isSet(object.blockHash) ? bytesFromBase64(object.blockHash) : new Uint8Array(),
      blockTimestamp: isSet(object.blockTimestamp) ? Number(object.blockTimestamp) : 0,
      transactionHash: isSet(object.transactionHash) ? bytesFromBase64(object.transactionHash) : new Uint8Array(),
      logIndex: isSet(object.logIndex) ? Number(object.logIndex) : 0,
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      keyRegistryBody: isSet(object.keyRegistryBody) ? KeyRegistryBody.fromJSON(object.keyRegistryBody) : undefined,
    };
  },

  toJSON(message: OnChainEvent): unknown {
    const obj: any = {};
    message.type !== undefined && (obj.type = onChainEventTypeToJSON(message.type));
    message.chainId !== undefined && (obj.chainId = Math.round(message.chainId));
    message.blockNumber !== undefined && (obj.blockNumber = Math.round(message.blockNumber));
    message.blockHash !== undefined &&
      (obj.blockHash = base64FromBytes(message.blockHash !== undefined ? message.blockHash : new Uint8Array()));
    message.blockTimestamp !== undefined && (obj.blockTimestamp = Math.round(message.blockTimestamp));
    message.transactionHash !== undefined &&
      (obj.transactionHash = base64FromBytes(
        message.transactionHash !== undefined ? message.transactionHash : new Uint8Array(),
      ));
    message.logIndex !== undefined && (obj.logIndex = Math.round(message.logIndex));
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.keyRegistryBody !== undefined &&
      (obj.keyRegistryBody = message.keyRegistryBody ? KeyRegistryBody.toJSON(message.keyRegistryBody) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<OnChainEvent>, I>>(base?: I): OnChainEvent {
    return OnChainEvent.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<OnChainEvent>, I>>(object: I): OnChainEvent {
    const message = createBaseOnChainEvent();
    message.type = object.type ?? 0;
    message.chainId = object.chainId ?? 0;
    message.blockNumber = object.blockNumber ?? 0;
    message.blockHash = object.blockHash ?? new Uint8Array();
    message.blockTimestamp = object.blockTimestamp ?? 0;
    message.transactionHash = object.transactionHash ?? new Uint8Array();
    message.logIndex = object.logIndex ?? 0;
    message.fid = object.fid ?? 0;
    message.keyRegistryBody = (object.keyRegistryBody !== undefined && object.keyRegistryBody !== null)
      ? KeyRegistryBody.fromPartial(object.keyRegistryBody)
      : undefined;
    return message;
  },
};

function createBaseKeyRegistryBody(): KeyRegistryBody {
  return { key: new Uint8Array(), scheme: 0, eventType: 0 };
}

export const KeyRegistryBody = {
  encode(message: KeyRegistryBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key.length !== 0) {
      writer.uint32(10).bytes(message.key);
    }
    if (message.scheme !== 0) {
      writer.uint32(16).uint32(message.scheme);
    }
    if (message.eventType !== 0) {
      writer.uint32(24).int32(message.eventType);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): KeyRegistryBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseKeyRegistryBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.key = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.scheme = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.eventType = reader.int32() as any;
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): KeyRegistryBody {
    return {
      key: isSet(object.key) ? bytesFromBase64(object.key) : new Uint8Array(),
      scheme: isSet(object.scheme) ? Number(object.scheme) : 0,
      eventType: isSet(object.eventType) ? keyRegistryEventTypeFromJSON(object.eventType) : 0,
    };
  },

  toJSON(message: KeyRegistryBody): unknown {
    const obj: any = {};
    message.key !== undefined &&
      (obj.key = base64FromBytes(message.key !== undefined ? message.key : new Uint8Array()));
    message.scheme !== undefined && (obj.scheme = Math.round(message.scheme));
    message.eventType !== undefined && (obj.eventType = keyRegistryEventTypeToJSON(message.eventType));
    return obj;
  },

  create<I extends Exact<DeepPartial<KeyRegistryBody>, I>>(base?: I): KeyRegistryBody {
    return KeyRegistryBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<KeyRegistryBody>, I>>(object: I): KeyRegistryBody {
    const message = createBaseKeyRegistryBody();
    message.key = object.key ?? new Uint8Array();
    message.scheme = object.scheme ?? 0;
    message.eventType = object.eventType ?? 0;
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
