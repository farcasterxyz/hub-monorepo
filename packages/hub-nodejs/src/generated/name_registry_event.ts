/* eslint-disable */
import _m0 from 'protobufjs/minimal';

export enum NameRegistryEventType {
  NONE = 0,
  TRANSFER = 1,
  RENEW = 2,
}

export function nameRegistryEventTypeFromJSON(object: any): NameRegistryEventType {
  switch (object) {
    case 0:
    case 'NAME_REGISTRY_EVENT_TYPE_NONE':
      return NameRegistryEventType.NONE;
    case 1:
    case 'NAME_REGISTRY_EVENT_TYPE_TRANSFER':
      return NameRegistryEventType.TRANSFER;
    case 2:
    case 'NAME_REGISTRY_EVENT_TYPE_RENEW':
      return NameRegistryEventType.RENEW;
    default:
      throw new tsProtoGlobalThis.Error('Unrecognized enum value ' + object + ' for enum NameRegistryEventType');
  }
}

export function nameRegistryEventTypeToJSON(object: NameRegistryEventType): string {
  switch (object) {
    case NameRegistryEventType.NONE:
      return 'NAME_REGISTRY_EVENT_TYPE_NONE';
    case NameRegistryEventType.TRANSFER:
      return 'NAME_REGISTRY_EVENT_TYPE_TRANSFER';
    case NameRegistryEventType.RENEW:
      return 'NAME_REGISTRY_EVENT_TYPE_RENEW';
    default:
      throw new tsProtoGlobalThis.Error('Unrecognized enum value ' + object + ' for enum NameRegistryEventType');
  }
}

export interface NameRegistryEvent {
  blockNumber: number;
  blockHash: Uint8Array;
  transactionHash: Uint8Array;
  logIndex: number;
  fname: Uint8Array;
  from: Uint8Array;
  to: Uint8Array;
  type: NameRegistryEventType;
  expiry: number;
}

function createBaseNameRegistryEvent(): NameRegistryEvent {
  return {
    blockNumber: 0,
    blockHash: new Uint8Array(),
    transactionHash: new Uint8Array(),
    logIndex: 0,
    fname: new Uint8Array(),
    from: new Uint8Array(),
    to: new Uint8Array(),
    type: 0,
    expiry: 0,
  };
}

export const NameRegistryEvent = {
  encode(message: NameRegistryEvent, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
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
    if (message.fname.length !== 0) {
      writer.uint32(42).bytes(message.fname);
    }
    if (message.from.length !== 0) {
      writer.uint32(50).bytes(message.from);
    }
    if (message.to.length !== 0) {
      writer.uint32(58).bytes(message.to);
    }
    if (message.type !== 0) {
      writer.uint32(64).int32(message.type);
    }
    if (message.expiry !== 0) {
      writer.uint32(72).uint32(message.expiry);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): NameRegistryEvent {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseNameRegistryEvent();
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

          message.fname = reader.bytes();
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.from = reader.bytes();
          continue;
        case 7:
          if (tag != 58) {
            break;
          }

          message.to = reader.bytes();
          continue;
        case 8:
          if (tag != 64) {
            break;
          }

          message.type = reader.int32() as any;
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

  fromJSON(object: any): NameRegistryEvent {
    return {
      blockNumber: isSet(object.blockNumber) ? Number(object.blockNumber) : 0,
      blockHash: isSet(object.blockHash) ? bytesFromBase64(object.blockHash) : new Uint8Array(),
      transactionHash: isSet(object.transactionHash) ? bytesFromBase64(object.transactionHash) : new Uint8Array(),
      logIndex: isSet(object.logIndex) ? Number(object.logIndex) : 0,
      fname: isSet(object.fname) ? bytesFromBase64(object.fname) : new Uint8Array(),
      from: isSet(object.from) ? bytesFromBase64(object.from) : new Uint8Array(),
      to: isSet(object.to) ? bytesFromBase64(object.to) : new Uint8Array(),
      type: isSet(object.type) ? nameRegistryEventTypeFromJSON(object.type) : 0,
      expiry: isSet(object.expiry) ? Number(object.expiry) : 0,
    };
  },

  toJSON(message: NameRegistryEvent): unknown {
    const obj: any = {};
    message.blockNumber !== undefined && (obj.blockNumber = Math.round(message.blockNumber));
    message.blockHash !== undefined &&
      (obj.blockHash = base64FromBytes(message.blockHash !== undefined ? message.blockHash : new Uint8Array()));
    message.transactionHash !== undefined &&
      (obj.transactionHash = base64FromBytes(
        message.transactionHash !== undefined ? message.transactionHash : new Uint8Array()
      ));
    message.logIndex !== undefined && (obj.logIndex = Math.round(message.logIndex));
    message.fname !== undefined &&
      (obj.fname = base64FromBytes(message.fname !== undefined ? message.fname : new Uint8Array()));
    message.from !== undefined &&
      (obj.from = base64FromBytes(message.from !== undefined ? message.from : new Uint8Array()));
    message.to !== undefined && (obj.to = base64FromBytes(message.to !== undefined ? message.to : new Uint8Array()));
    message.type !== undefined && (obj.type = nameRegistryEventTypeToJSON(message.type));
    message.expiry !== undefined && (obj.expiry = Math.round(message.expiry));
    return obj;
  },

  create<I extends Exact<DeepPartial<NameRegistryEvent>, I>>(base?: I): NameRegistryEvent {
    return NameRegistryEvent.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<NameRegistryEvent>, I>>(object: I): NameRegistryEvent {
    const message = createBaseNameRegistryEvent();
    message.blockNumber = object.blockNumber ?? 0;
    message.blockHash = object.blockHash ?? new Uint8Array();
    message.transactionHash = object.transactionHash ?? new Uint8Array();
    message.logIndex = object.logIndex ?? 0;
    message.fname = object.fname ?? new Uint8Array();
    message.from = object.from ?? new Uint8Array();
    message.to = object.to ?? new Uint8Array();
    message.type = object.type ?? 0;
    message.expiry = object.expiry ?? 0;
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

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
