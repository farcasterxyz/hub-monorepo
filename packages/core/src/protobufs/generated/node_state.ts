/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export interface OnChainEventState {
  lastL2Block: number;
}

export interface FnameState {
  lastFnameProof: number;
}

function createBaseOnChainEventState(): OnChainEventState {
  return { lastL2Block: 0 };
}

export const OnChainEventState = {
  encode(message: OnChainEventState, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.lastL2Block !== 0) {
      writer.uint32(24).uint64(message.lastL2Block);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OnChainEventState {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOnChainEventState();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 3:
          if (tag != 24) {
            break;
          }

          message.lastL2Block = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): OnChainEventState {
    return { lastL2Block: isSet(object.lastL2Block) ? Number(object.lastL2Block) : 0 };
  },

  toJSON(message: OnChainEventState): unknown {
    const obj: any = {};
    message.lastL2Block !== undefined && (obj.lastL2Block = Math.round(message.lastL2Block));
    return obj;
  },

  create<I extends Exact<DeepPartial<OnChainEventState>, I>>(base?: I): OnChainEventState {
    return OnChainEventState.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<OnChainEventState>, I>>(object: I): OnChainEventState {
    const message = createBaseOnChainEventState();
    message.lastL2Block = object.lastL2Block ?? 0;
    return message;
  },
};

function createBaseFnameState(): FnameState {
  return { lastFnameProof: 0 };
}

export const FnameState = {
  encode(message: FnameState, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.lastFnameProof !== 0) {
      writer.uint32(24).uint64(message.lastFnameProof);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FnameState {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFnameState();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 3:
          if (tag != 24) {
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

  fromJSON(object: any): FnameState {
    return { lastFnameProof: isSet(object.lastFnameProof) ? Number(object.lastFnameProof) : 0 };
  },

  toJSON(message: FnameState): unknown {
    const obj: any = {};
    message.lastFnameProof !== undefined && (obj.lastFnameProof = Math.round(message.lastFnameProof));
    return obj;
  },

  create<I extends Exact<DeepPartial<FnameState>, I>>(base?: I): FnameState {
    return FnameState.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FnameState>, I>>(object: I): FnameState {
    const message = createBaseFnameState();
    message.lastFnameProof = object.lastFnameProof ?? 0;
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
