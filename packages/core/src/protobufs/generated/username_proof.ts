/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';

export enum UserNameType {
  USERNAME_TYPE_NONE = 0,
  USERNAME_TYPE_FNAME = 1,
}

export function userNameTypeFromJSON(object: any): UserNameType {
  switch (object) {
    case 0:
    case 'USERNAME_TYPE_NONE':
      return UserNameType.USERNAME_TYPE_NONE;
    case 1:
    case 'USERNAME_TYPE_FNAME':
      return UserNameType.USERNAME_TYPE_FNAME;
    default:
      throw new tsProtoGlobalThis.Error('Unrecognized enum value ' + object + ' for enum UserNameType');
  }
}

export function userNameTypeToJSON(object: UserNameType): string {
  switch (object) {
    case UserNameType.USERNAME_TYPE_NONE:
      return 'USERNAME_TYPE_NONE';
    case UserNameType.USERNAME_TYPE_FNAME:
      return 'USERNAME_TYPE_FNAME';
    default:
      throw new tsProtoGlobalThis.Error('Unrecognized enum value ' + object + ' for enum UserNameType');
  }
}

export interface UserNameProof {
  timestamp: number;
  name: Uint8Array;
  owner: Uint8Array;
  signature: Uint8Array;
  fid: number;
  type: UserNameType;
}

function createBaseUserNameProof(): UserNameProof {
  return {
    timestamp: 0,
    name: new Uint8Array(),
    owner: new Uint8Array(),
    signature: new Uint8Array(),
    fid: 0,
    type: 0,
  };
}

export const UserNameProof = {
  encode(message: UserNameProof, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.timestamp !== 0) {
      writer.uint32(8).uint64(message.timestamp);
    }
    if (message.name.length !== 0) {
      writer.uint32(18).bytes(message.name);
    }
    if (message.owner.length !== 0) {
      writer.uint32(26).bytes(message.owner);
    }
    if (message.signature.length !== 0) {
      writer.uint32(34).bytes(message.signature);
    }
    if (message.fid !== 0) {
      writer.uint32(40).uint64(message.fid);
    }
    if (message.type !== 0) {
      writer.uint32(48).int32(message.type);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UserNameProof {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUserNameProof();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.timestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.name = reader.bytes();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.owner = reader.bytes();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.signature = reader.bytes();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.type = reader.int32() as any;
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UserNameProof {
    return {
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      name: isSet(object.name) ? bytesFromBase64(object.name) : new Uint8Array(),
      owner: isSet(object.owner) ? bytesFromBase64(object.owner) : new Uint8Array(),
      signature: isSet(object.signature) ? bytesFromBase64(object.signature) : new Uint8Array(),
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      type: isSet(object.type) ? userNameTypeFromJSON(object.type) : 0,
    };
  },

  toJSON(message: UserNameProof): unknown {
    const obj: any = {};
    message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
    message.name !== undefined &&
      (obj.name = base64FromBytes(message.name !== undefined ? message.name : new Uint8Array()));
    message.owner !== undefined &&
      (obj.owner = base64FromBytes(message.owner !== undefined ? message.owner : new Uint8Array()));
    message.signature !== undefined &&
      (obj.signature = base64FromBytes(message.signature !== undefined ? message.signature : new Uint8Array()));
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.type !== undefined && (obj.type = userNameTypeToJSON(message.type));
    return obj;
  },

  create<I extends Exact<DeepPartial<UserNameProof>, I>>(base?: I): UserNameProof {
    return UserNameProof.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<UserNameProof>, I>>(object: I): UserNameProof {
    const message = createBaseUserNameProof();
    message.timestamp = object.timestamp ?? 0;
    message.name = object.name ?? new Uint8Array();
    message.owner = object.owner ?? new Uint8Array();
    message.signature = object.signature ?? new Uint8Array();
    message.fid = object.fid ?? 0;
    message.type = object.type ?? 0;
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
