/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';

export enum IdRegistryEventType {
  NONE = 0,
  REGISTER = 1,
  TRANSFER = 2,
}

export function idRegistryEventTypeFromJSON(object: any): IdRegistryEventType {
  switch (object) {
    case 0:
    case 'ID_REGISTRY_EVENT_TYPE_NONE':
      return IdRegistryEventType.NONE;
    case 1:
    case 'ID_REGISTRY_EVENT_TYPE_REGISTER':
      return IdRegistryEventType.REGISTER;
    case 2:
    case 'ID_REGISTRY_EVENT_TYPE_TRANSFER':
      return IdRegistryEventType.TRANSFER;
    default:
      throw new tsProtoGlobalThis.Error('Unrecognized enum value ' + object + ' for enum IdRegistryEventType');
  }
}

export function idRegistryEventTypeToJSON(object: IdRegistryEventType): string {
  switch (object) {
    case IdRegistryEventType.NONE:
      return 'ID_REGISTRY_EVENT_TYPE_NONE';
    case IdRegistryEventType.REGISTER:
      return 'ID_REGISTRY_EVENT_TYPE_REGISTER';
    case IdRegistryEventType.TRANSFER:
      return 'ID_REGISTRY_EVENT_TYPE_TRANSFER';
    default:
      throw new tsProtoGlobalThis.Error('Unrecognized enum value ' + object + ' for enum IdRegistryEventType');
  }
}

export interface IdRegistryEvent {
  blockNumber: number;
  blockHash: Uint8Array;
  transactionHash: Uint8Array;
  logIndex: number;
  fid: number;
  to: Uint8Array;
  type: IdRegistryEventType;
  from: Uint8Array;
}

function createBaseIdRegistryEvent(): IdRegistryEvent {
  return {
    blockNumber: 0,
    blockHash: new Uint8Array(),
    transactionHash: new Uint8Array(),
    logIndex: 0,
    fid: 0,
    to: new Uint8Array(),
    type: 0,
    from: new Uint8Array(),
  };
}

export const IdRegistryEvent = {
  encode(message: IdRegistryEvent, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
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
    if (message.fid !== 0) {
      writer.uint32(40).uint64(message.fid);
    }
    if (message.to.length !== 0) {
      writer.uint32(50).bytes(message.to);
    }
    if (message.type !== 0) {
      writer.uint32(56).int32(message.type);
    }
    if (message.from.length !== 0) {
      writer.uint32(66).bytes(message.from);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): IdRegistryEvent {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseIdRegistryEvent();
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

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.to = reader.bytes();
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

          message.from = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): IdRegistryEvent {
    return {
      blockNumber: isSet(object.blockNumber) ? Number(object.blockNumber) : 0,
      blockHash: isSet(object.blockHash) ? bytesFromBase64(object.blockHash) : new Uint8Array(),
      transactionHash: isSet(object.transactionHash) ? bytesFromBase64(object.transactionHash) : new Uint8Array(),
      logIndex: isSet(object.logIndex) ? Number(object.logIndex) : 0,
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      to: isSet(object.to) ? bytesFromBase64(object.to) : new Uint8Array(),
      type: isSet(object.type) ? idRegistryEventTypeFromJSON(object.type) : 0,
      from: isSet(object.from) ? bytesFromBase64(object.from) : new Uint8Array(),
    };
  },

  toJSON(message: IdRegistryEvent): unknown {
    const obj: any = {};
    message.blockNumber !== undefined && (obj.blockNumber = Math.round(message.blockNumber));
    message.blockHash !== undefined &&
      (obj.blockHash = base64FromBytes(message.blockHash !== undefined ? message.blockHash : new Uint8Array()));
    message.transactionHash !== undefined &&
      (obj.transactionHash = base64FromBytes(
        message.transactionHash !== undefined ? message.transactionHash : new Uint8Array()
      ));
    message.logIndex !== undefined && (obj.logIndex = Math.round(message.logIndex));
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.to !== undefined && (obj.to = base64FromBytes(message.to !== undefined ? message.to : new Uint8Array()));
    message.type !== undefined && (obj.type = idRegistryEventTypeToJSON(message.type));
    message.from !== undefined &&
      (obj.from = base64FromBytes(message.from !== undefined ? message.from : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<IdRegistryEvent>, I>>(base?: I): IdRegistryEvent {
    return IdRegistryEvent.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<IdRegistryEvent>, I>>(object: I): IdRegistryEvent {
    const message = createBaseIdRegistryEvent();
    message.blockNumber = object.blockNumber ?? 0;
    message.blockHash = object.blockHash ?? new Uint8Array();
    message.transactionHash = object.transactionHash ?? new Uint8Array();
    message.logIndex = object.logIndex ?? 0;
    message.fid = object.fid ?? 0;
    message.to = object.to ?? new Uint8Array();
    message.type = object.type ?? 0;
    message.from = object.from ?? new Uint8Array();
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
