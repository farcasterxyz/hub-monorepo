/* eslint-disable */
import _m0 from "protobufjs/minimal";

export interface RevokeMessagesBySignerJobPayload {
  fid: number;
  signer: Uint8Array;
}

export interface UpdateNameRegistryEventExpiryJobPayload {
  fname: Uint8Array;
}

function createBaseRevokeMessagesBySignerJobPayload(): RevokeMessagesBySignerJobPayload {
  return { fid: 0, signer: new Uint8Array() };
}

export const RevokeMessagesBySignerJobPayload = {
  encode(message: RevokeMessagesBySignerJobPayload, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint32(message.fid);
    }
    if (message.signer.length !== 0) {
      writer.uint32(18).bytes(message.signer);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RevokeMessagesBySignerJobPayload {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRevokeMessagesBySignerJobPayload();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = reader.uint32();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.signer = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): RevokeMessagesBySignerJobPayload {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      signer: isSet(object.signer) ? bytesFromBase64(object.signer) : new Uint8Array(),
    };
  },

  toJSON(message: RevokeMessagesBySignerJobPayload): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.signer !== undefined &&
      (obj.signer = base64FromBytes(message.signer !== undefined ? message.signer : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<RevokeMessagesBySignerJobPayload>, I>>(
    base?: I,
  ): RevokeMessagesBySignerJobPayload {
    return RevokeMessagesBySignerJobPayload.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<RevokeMessagesBySignerJobPayload>, I>>(
    object: I,
  ): RevokeMessagesBySignerJobPayload {
    const message = createBaseRevokeMessagesBySignerJobPayload();
    message.fid = object.fid ?? 0;
    message.signer = object.signer ?? new Uint8Array();
    return message;
  },
};

function createBaseUpdateNameRegistryEventExpiryJobPayload(): UpdateNameRegistryEventExpiryJobPayload {
  return { fname: new Uint8Array() };
}

export const UpdateNameRegistryEventExpiryJobPayload = {
  encode(message: UpdateNameRegistryEventExpiryJobPayload, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fname.length !== 0) {
      writer.uint32(10).bytes(message.fname);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UpdateNameRegistryEventExpiryJobPayload {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUpdateNameRegistryEventExpiryJobPayload();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.fname = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UpdateNameRegistryEventExpiryJobPayload {
    return { fname: isSet(object.fname) ? bytesFromBase64(object.fname) : new Uint8Array() };
  },

  toJSON(message: UpdateNameRegistryEventExpiryJobPayload): unknown {
    const obj: any = {};
    message.fname !== undefined &&
      (obj.fname = base64FromBytes(message.fname !== undefined ? message.fname : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<UpdateNameRegistryEventExpiryJobPayload>, I>>(
    base?: I,
  ): UpdateNameRegistryEventExpiryJobPayload {
    return UpdateNameRegistryEventExpiryJobPayload.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<UpdateNameRegistryEventExpiryJobPayload>, I>>(
    object: I,
  ): UpdateNameRegistryEventExpiryJobPayload {
    const message = createBaseUpdateNameRegistryEventExpiryJobPayload();
    message.fname = object.fname ?? new Uint8Array();
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

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
