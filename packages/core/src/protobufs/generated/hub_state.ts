/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export interface ValidateOrRevokeJobState {
  /** The (Farcaster time epoch) timestamp where the last job started */
  lastJobTimestamp: number;
  /** The last FID to complete successfully. If this is 0, then the last job finished successfully */
  lastFid: number;
}

export interface HubState {
  /** uint32 last_eth_block = 1; // Deprecated */
  lastFnameProof: number;
  lastL2Block: number;
  /** bool syncEvents = 4; // Deprecated */
  validateOrRevokeState: ValidateOrRevokeJobState | undefined;
}

function createBaseValidateOrRevokeJobState(): ValidateOrRevokeJobState {
  return { lastJobTimestamp: 0, lastFid: 0 };
}

export const ValidateOrRevokeJobState = {
  encode(message: ValidateOrRevokeJobState, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.lastJobTimestamp !== 0) {
      writer.uint32(8).uint32(message.lastJobTimestamp);
    }
    if (message.lastFid !== 0) {
      writer.uint32(16).uint32(message.lastFid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ValidateOrRevokeJobState {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseValidateOrRevokeJobState();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.lastJobTimestamp = reader.uint32();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.lastFid = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ValidateOrRevokeJobState {
    return {
      lastJobTimestamp: isSet(object.lastJobTimestamp) ? Number(object.lastJobTimestamp) : 0,
      lastFid: isSet(object.lastFid) ? Number(object.lastFid) : 0,
    };
  },

  toJSON(message: ValidateOrRevokeJobState): unknown {
    const obj: any = {};
    message.lastJobTimestamp !== undefined && (obj.lastJobTimestamp = Math.round(message.lastJobTimestamp));
    message.lastFid !== undefined && (obj.lastFid = Math.round(message.lastFid));
    return obj;
  },

  create<I extends Exact<DeepPartial<ValidateOrRevokeJobState>, I>>(base?: I): ValidateOrRevokeJobState {
    return ValidateOrRevokeJobState.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ValidateOrRevokeJobState>, I>>(object: I): ValidateOrRevokeJobState {
    const message = createBaseValidateOrRevokeJobState();
    message.lastJobTimestamp = object.lastJobTimestamp ?? 0;
    message.lastFid = object.lastFid ?? 0;
    return message;
  },
};

function createBaseHubState(): HubState {
  return { lastFnameProof: 0, lastL2Block: 0, validateOrRevokeState: undefined };
}

export const HubState = {
  encode(message: HubState, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.lastFnameProof !== 0) {
      writer.uint32(16).uint64(message.lastFnameProof);
    }
    if (message.lastL2Block !== 0) {
      writer.uint32(24).uint64(message.lastL2Block);
    }
    if (message.validateOrRevokeState !== undefined) {
      ValidateOrRevokeJobState.encode(message.validateOrRevokeState, writer.uint32(42).fork()).ldelim();
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
        case 2:
          if (tag != 16) {
            break;
          }

          message.lastFnameProof = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.lastL2Block = longToNumber(reader.uint64() as Long);
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.validateOrRevokeState = ValidateOrRevokeJobState.decode(reader, reader.uint32());
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
      lastFnameProof: isSet(object.lastFnameProof) ? Number(object.lastFnameProof) : 0,
      lastL2Block: isSet(object.lastL2Block) ? Number(object.lastL2Block) : 0,
      validateOrRevokeState: isSet(object.validateOrRevokeState)
        ? ValidateOrRevokeJobState.fromJSON(object.validateOrRevokeState)
        : undefined,
    };
  },

  toJSON(message: HubState): unknown {
    const obj: any = {};
    message.lastFnameProof !== undefined && (obj.lastFnameProof = Math.round(message.lastFnameProof));
    message.lastL2Block !== undefined && (obj.lastL2Block = Math.round(message.lastL2Block));
    message.validateOrRevokeState !== undefined && (obj.validateOrRevokeState = message.validateOrRevokeState
      ? ValidateOrRevokeJobState.toJSON(message.validateOrRevokeState)
      : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<HubState>, I>>(base?: I): HubState {
    return HubState.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<HubState>, I>>(object: I): HubState {
    const message = createBaseHubState();
    message.lastFnameProof = object.lastFnameProof ?? 0;
    message.lastL2Block = object.lastL2Block ?? 0;
    message.validateOrRevokeState =
      (object.validateOrRevokeState !== undefined && object.validateOrRevokeState !== null)
        ? ValidateOrRevokeJobState.fromPartial(object.validateOrRevokeState)
        : undefined;
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
