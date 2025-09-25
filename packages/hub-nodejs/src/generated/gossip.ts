/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { ConsensusMessage, FullProposal, MempoolMessage, ReadNodeMessage, StatusMessage } from "./blocks";
import { FarcasterNetwork, farcasterNetworkFromJSON, farcasterNetworkToJSON } from "./message";

export interface ContactInfoBody {
  gossipAddress: string;
  peerId: Uint8Array;
  snapchainVersion: string;
  network: FarcasterNetwork;
  timestamp: number;
  announceRpcAddress: string;
}

export interface ContactInfo {
  body: ContactInfoBody | undefined;
}

export interface GossipMessage {
  consensus?: ConsensusMessage | undefined;
  fullProposal?: FullProposal | undefined;
  mempoolMessage?: MempoolMessage | undefined;
  status?: StatusMessage | undefined;
  readNodeMessage?: ReadNodeMessage | undefined;
  contactInfoMessage?: ContactInfo | undefined;
}

function createBaseContactInfoBody(): ContactInfoBody {
  return {
    gossipAddress: "",
    peerId: new Uint8Array(),
    snapchainVersion: "",
    network: 0,
    timestamp: 0,
    announceRpcAddress: "",
  };
}

export const ContactInfoBody = {
  encode(message: ContactInfoBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.gossipAddress !== "") {
      writer.uint32(10).string(message.gossipAddress);
    }
    if (message.peerId.length !== 0) {
      writer.uint32(18).bytes(message.peerId);
    }
    if (message.snapchainVersion !== "") {
      writer.uint32(26).string(message.snapchainVersion);
    }
    if (message.network !== 0) {
      writer.uint32(32).int32(message.network);
    }
    if (message.timestamp !== 0) {
      writer.uint32(40).uint64(message.timestamp);
    }
    if (message.announceRpcAddress !== "") {
      writer.uint32(50).string(message.announceRpcAddress);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ContactInfoBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseContactInfoBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.gossipAddress = reader.string();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.peerId = reader.bytes();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.snapchainVersion = reader.string();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.network = reader.int32() as any;
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.timestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.announceRpcAddress = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ContactInfoBody {
    return {
      gossipAddress: isSet(object.gossipAddress) ? String(object.gossipAddress) : "",
      peerId: isSet(object.peerId) ? bytesFromBase64(object.peerId) : new Uint8Array(),
      snapchainVersion: isSet(object.snapchainVersion) ? String(object.snapchainVersion) : "",
      network: isSet(object.network) ? farcasterNetworkFromJSON(object.network) : 0,
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      announceRpcAddress: isSet(object.announceRpcAddress) ? String(object.announceRpcAddress) : "",
    };
  },

  toJSON(message: ContactInfoBody): unknown {
    const obj: any = {};
    message.gossipAddress !== undefined && (obj.gossipAddress = message.gossipAddress);
    message.peerId !== undefined &&
      (obj.peerId = base64FromBytes(message.peerId !== undefined ? message.peerId : new Uint8Array()));
    message.snapchainVersion !== undefined && (obj.snapchainVersion = message.snapchainVersion);
    message.network !== undefined && (obj.network = farcasterNetworkToJSON(message.network));
    message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
    message.announceRpcAddress !== undefined && (obj.announceRpcAddress = message.announceRpcAddress);
    return obj;
  },

  create<I extends Exact<DeepPartial<ContactInfoBody>, I>>(base?: I): ContactInfoBody {
    return ContactInfoBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ContactInfoBody>, I>>(object: I): ContactInfoBody {
    const message = createBaseContactInfoBody();
    message.gossipAddress = object.gossipAddress ?? "";
    message.peerId = object.peerId ?? new Uint8Array();
    message.snapchainVersion = object.snapchainVersion ?? "";
    message.network = object.network ?? 0;
    message.timestamp = object.timestamp ?? 0;
    message.announceRpcAddress = object.announceRpcAddress ?? "";
    return message;
  },
};

function createBaseContactInfo(): ContactInfo {
  return { body: undefined };
}

export const ContactInfo = {
  encode(message: ContactInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.body !== undefined) {
      ContactInfoBody.encode(message.body, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ContactInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseContactInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.body = ContactInfoBody.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ContactInfo {
    return { body: isSet(object.body) ? ContactInfoBody.fromJSON(object.body) : undefined };
  },

  toJSON(message: ContactInfo): unknown {
    const obj: any = {};
    message.body !== undefined && (obj.body = message.body ? ContactInfoBody.toJSON(message.body) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ContactInfo>, I>>(base?: I): ContactInfo {
    return ContactInfo.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ContactInfo>, I>>(object: I): ContactInfo {
    const message = createBaseContactInfo();
    message.body = (object.body !== undefined && object.body !== null)
      ? ContactInfoBody.fromPartial(object.body)
      : undefined;
    return message;
  },
};

function createBaseGossipMessage(): GossipMessage {
  return {
    consensus: undefined,
    fullProposal: undefined,
    mempoolMessage: undefined,
    status: undefined,
    readNodeMessage: undefined,
    contactInfoMessage: undefined,
  };
}

export const GossipMessage = {
  encode(message: GossipMessage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.consensus !== undefined) {
      ConsensusMessage.encode(message.consensus, writer.uint32(10).fork()).ldelim();
    }
    if (message.fullProposal !== undefined) {
      FullProposal.encode(message.fullProposal, writer.uint32(18).fork()).ldelim();
    }
    if (message.mempoolMessage !== undefined) {
      MempoolMessage.encode(message.mempoolMessage, writer.uint32(26).fork()).ldelim();
    }
    if (message.status !== undefined) {
      StatusMessage.encode(message.status, writer.uint32(34).fork()).ldelim();
    }
    if (message.readNodeMessage !== undefined) {
      ReadNodeMessage.encode(message.readNodeMessage, writer.uint32(42).fork()).ldelim();
    }
    if (message.contactInfoMessage !== undefined) {
      ContactInfo.encode(message.contactInfoMessage, writer.uint32(50).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GossipMessage {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGossipMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.consensus = ConsensusMessage.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.fullProposal = FullProposal.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.mempoolMessage = MempoolMessage.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.status = StatusMessage.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.readNodeMessage = ReadNodeMessage.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.contactInfoMessage = ContactInfo.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GossipMessage {
    return {
      consensus: isSet(object.consensus) ? ConsensusMessage.fromJSON(object.consensus) : undefined,
      fullProposal: isSet(object.fullProposal) ? FullProposal.fromJSON(object.fullProposal) : undefined,
      mempoolMessage: isSet(object.mempoolMessage) ? MempoolMessage.fromJSON(object.mempoolMessage) : undefined,
      status: isSet(object.status) ? StatusMessage.fromJSON(object.status) : undefined,
      readNodeMessage: isSet(object.readNodeMessage) ? ReadNodeMessage.fromJSON(object.readNodeMessage) : undefined,
      contactInfoMessage: isSet(object.contactInfoMessage)
        ? ContactInfo.fromJSON(object.contactInfoMessage)
        : undefined,
    };
  },

  toJSON(message: GossipMessage): unknown {
    const obj: any = {};
    message.consensus !== undefined &&
      (obj.consensus = message.consensus ? ConsensusMessage.toJSON(message.consensus) : undefined);
    message.fullProposal !== undefined &&
      (obj.fullProposal = message.fullProposal ? FullProposal.toJSON(message.fullProposal) : undefined);
    message.mempoolMessage !== undefined &&
      (obj.mempoolMessage = message.mempoolMessage ? MempoolMessage.toJSON(message.mempoolMessage) : undefined);
    message.status !== undefined && (obj.status = message.status ? StatusMessage.toJSON(message.status) : undefined);
    message.readNodeMessage !== undefined &&
      (obj.readNodeMessage = message.readNodeMessage ? ReadNodeMessage.toJSON(message.readNodeMessage) : undefined);
    message.contactInfoMessage !== undefined &&
      (obj.contactInfoMessage = message.contactInfoMessage
        ? ContactInfo.toJSON(message.contactInfoMessage)
        : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<GossipMessage>, I>>(base?: I): GossipMessage {
    return GossipMessage.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GossipMessage>, I>>(object: I): GossipMessage {
    const message = createBaseGossipMessage();
    message.consensus = (object.consensus !== undefined && object.consensus !== null)
      ? ConsensusMessage.fromPartial(object.consensus)
      : undefined;
    message.fullProposal = (object.fullProposal !== undefined && object.fullProposal !== null)
      ? FullProposal.fromPartial(object.fullProposal)
      : undefined;
    message.mempoolMessage = (object.mempoolMessage !== undefined && object.mempoolMessage !== null)
      ? MempoolMessage.fromPartial(object.mempoolMessage)
      : undefined;
    message.status = (object.status !== undefined && object.status !== null)
      ? StatusMessage.fromPartial(object.status)
      : undefined;
    message.readNodeMessage = (object.readNodeMessage !== undefined && object.readNodeMessage !== null)
      ? ReadNodeMessage.fromPartial(object.readNodeMessage)
      : undefined;
    message.contactInfoMessage = (object.contactInfoMessage !== undefined && object.contactInfoMessage !== null)
      ? ContactInfo.fromPartial(object.contactInfoMessage)
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
