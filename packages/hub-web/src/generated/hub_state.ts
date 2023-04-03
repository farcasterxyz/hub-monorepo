/* eslint-disable */
import _m0 from 'protobufjs/minimal';

export interface HubState {
  lastEthBlock: number;
}

function createBaseHubState(): HubState {
  return { lastEthBlock: 0 };
}

export const HubState = {
  encode(message: HubState, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.lastEthBlock !== 0) {
      writer.uint32(8).uint32(message.lastEthBlock);
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
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): HubState {
    return { lastEthBlock: isSet(object.lastEthBlock) ? Number(object.lastEthBlock) : 0 };
  },

  toJSON(message: HubState): unknown {
    const obj: any = {};
    message.lastEthBlock !== undefined && (obj.lastEthBlock = Math.round(message.lastEthBlock));
    return obj;
  },

  create<I extends Exact<DeepPartial<HubState>, I>>(base?: I): HubState {
    return HubState.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<HubState>, I>>(object: I): HubState {
    const message = createBaseHubState();
    message.lastEthBlock = object.lastEthBlock ?? 0;
    return message;
  },
};

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
