/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';

export interface HubState {
  lastEthBlock: number;
  lastFnameProof: number;
}

function createBaseHubState(): HubState {
  return { lastEthBlock: 0, lastFnameProof: 0 };
}

export const HubState = {
  encode(message: HubState, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.lastEthBlock !== 0) {
      writer.uint32(8).uint32(message.lastEthBlock);
    }
    if (message.lastFnameProof !== 0) {
      writer.uint32(16).uint64(message.lastFnameProof);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): HubState {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHubState();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.lastEthBlock = reader.uint32();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.lastFnameProof = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): HubState {
    return {
      lastEthBlock: isSet(object.lastEthBlock) ? Number(object.lastEthBlock) : 0,
      lastFnameProof: isSet(object.lastFnameProof) ? Number(object.lastFnameProof) : 0,
    };
  },

  toJSON(message: HubState): unknown {
    const obj: any = {};
    message.lastEthBlock !== undefined && (obj.lastEthBlock = Math.round(message.lastEthBlock));
    message.lastFnameProof !== undefined && (obj.lastFnameProof = Math.round(message.lastFnameProof));
    return obj;
  },

  create<I extends Exact<DeepPartial<HubState>, I>>(base?: I): HubState {
    return HubState.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<HubState>, I>>(object: I): HubState {
    const message = createBaseHubState();
    message.lastEthBlock = object.lastEthBlock ?? 0;
    message.lastFnameProof = object.lastFnameProof ?? 0;
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
