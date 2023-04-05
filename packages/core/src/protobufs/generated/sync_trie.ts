/* eslint-disable */
import _m0 from 'protobufjs/minimal';

export interface DbTrieNode {
  key: Uint8Array;
  childChars: number[];
  items: number;
  hash: Uint8Array;
}

function createBaseDbTrieNode(): DbTrieNode {
  return { key: new Uint8Array(), childChars: [], items: 0, hash: new Uint8Array() };
}

export const DbTrieNode = {
  encode(message: DbTrieNode, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key.length !== 0) {
      writer.uint32(10).bytes(message.key);
    }
    writer.uint32(18).fork();
    for (const v of message.childChars) {
      writer.uint32(v);
    }
    writer.ldelim();
    if (message.items !== 0) {
      writer.uint32(24).uint32(message.items);
    }
    if (message.hash.length !== 0) {
      writer.uint32(34).bytes(message.hash);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DbTrieNode {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDbTrieNode();
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
          if (tag == 16) {
            message.childChars.push(reader.uint32());
            continue;
          }

          if (tag == 18) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.childChars.push(reader.uint32());
            }

            continue;
          }

          break;
        case 3:
          if (tag != 24) {
            break;
          }

          message.items = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.hash = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DbTrieNode {
    return {
      key: isSet(object.key) ? bytesFromBase64(object.key) : new Uint8Array(),
      childChars: Array.isArray(object?.childChars) ? object.childChars.map((e: any) => Number(e)) : [],
      items: isSet(object.items) ? Number(object.items) : 0,
      hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(),
    };
  },

  toJSON(message: DbTrieNode): unknown {
    const obj: any = {};
    message.key !== undefined &&
      (obj.key = base64FromBytes(message.key !== undefined ? message.key : new Uint8Array()));
    if (message.childChars) {
      obj.childChars = message.childChars.map((e) => Math.round(e));
    } else {
      obj.childChars = [];
    }
    message.items !== undefined && (obj.items = Math.round(message.items));
    message.hash !== undefined &&
      (obj.hash = base64FromBytes(message.hash !== undefined ? message.hash : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<DbTrieNode>, I>>(base?: I): DbTrieNode {
    return DbTrieNode.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<DbTrieNode>, I>>(object: I): DbTrieNode {
    const message = createBaseDbTrieNode();
    message.key = object.key ?? new Uint8Array();
    message.childChars = object.childChars?.map((e) => e) || [];
    message.items = object.items ?? 0;
    message.hash = object.hash ?? new Uint8Array();
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
