/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { FarcasterNetwork, farcasterNetworkFromJSON, farcasterNetworkToJSON, Message } from "./message";

export enum GossipVersion {
  V1 = 0,
  V1_1 = 1,
}

export function gossipVersionFromJSON(object: any): GossipVersion {
  switch (object) {
    case 0:
    case "GOSSIP_VERSION_V1":
      return GossipVersion.V1;
    case 1:
    case "GOSSIP_VERSION_V1_1":
      return GossipVersion.V1_1;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum GossipVersion");
  }
}

export function gossipVersionToJSON(object: GossipVersion): string {
  switch (object) {
    case GossipVersion.V1:
      return "GOSSIP_VERSION_V1";
    case GossipVersion.V1_1:
      return "GOSSIP_VERSION_V1_1";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum GossipVersion");
  }
}

export interface GossipAddressInfo {
  address: string;
  family: number;
  port: number;
  dnsName: string;
}

export interface ContactInfoContentBody {
  gossipAddress: GossipAddressInfo | undefined;
  rpcAddress: GossipAddressInfo | undefined;
  excludedHashes: string[];
  count: number;
  hubVersion: string;
  network: FarcasterNetwork;
  appVersion: string;
  timestamp: number;
  fid: number;
}

export interface ContactInfoContent {
  gossipAddress: GossipAddressInfo | undefined;
  rpcAddress: GossipAddressInfo | undefined;
  excludedHashes: string[];
  count: number;
  hubVersion: string;
  network: FarcasterNetwork;
  appVersion: string;
  timestamp: number;
  fid: number;
  body:
    | ContactInfoContentBody
    | undefined;
  /** Signature of the message digest */
  signature: Uint8Array;
  /** Public key of the peer that originated the contact info */
  signer: Uint8Array;
  /** Optional alternative serialization used for signing */
  dataBytes?: Uint8Array | undefined;
}

export interface PingMessageBody {
  pingOriginPeerId: Uint8Array;
  pingTimestamp: number;
}

export interface AckMessageBody {
  pingOriginPeerId: Uint8Array;
  ackOriginPeerId: Uint8Array;
  pingTimestamp: number;
  ackTimestamp: number;
}

export interface NetworkLatencyMessage {
  pingMessage?: PingMessageBody | undefined;
  ackMessage?: AckMessageBody | undefined;
}

export interface MessageBundle {
  hash: Uint8Array;
  messages: Message[];
}

export interface GossipMessage {
  message?:
    | Message
    | undefined;
  /**
   * Deprecated
   *  IdRegistryEvent id_registry_event = 2;
   */
  contactInfoContent?: ContactInfoContent | undefined;
  networkLatencyMessage?: NetworkLatencyMessage | undefined;
  messageBundle?: MessageBundle | undefined;
  topics: string[];
  peerId: Uint8Array;
  version: GossipVersion;
  /** Farcaster epoch timestamp in seconds when this message was first created */
  timestamp: number;
}

function createBaseGossipAddressInfo(): GossipAddressInfo {
  return { address: "", family: 0, port: 0, dnsName: "" };
}

export const GossipAddressInfo = {
  encode(message: GossipAddressInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== "") {
      writer.uint32(10).string(message.address);
    }
    if (message.family !== 0) {
      writer.uint32(16).uint32(message.family);
    }
    if (message.port !== 0) {
      writer.uint32(24).uint32(message.port);
    }
    if (message.dnsName !== "") {
      writer.uint32(34).string(message.dnsName);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GossipAddressInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGossipAddressInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.address = reader.string();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.family = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.port = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.dnsName = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GossipAddressInfo {
    return {
      address: isSet(object.address) ? String(object.address) : "",
      family: isSet(object.family) ? Number(object.family) : 0,
      port: isSet(object.port) ? Number(object.port) : 0,
      dnsName: isSet(object.dnsName) ? String(object.dnsName) : "",
    };
  },

  toJSON(message: GossipAddressInfo): unknown {
    const obj: any = {};
    message.address !== undefined && (obj.address = message.address);
    message.family !== undefined && (obj.family = Math.round(message.family));
    message.port !== undefined && (obj.port = Math.round(message.port));
    message.dnsName !== undefined && (obj.dnsName = message.dnsName);
    return obj;
  },

  create<I extends Exact<DeepPartial<GossipAddressInfo>, I>>(base?: I): GossipAddressInfo {
    return GossipAddressInfo.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GossipAddressInfo>, I>>(object: I): GossipAddressInfo {
    const message = createBaseGossipAddressInfo();
    message.address = object.address ?? "";
    message.family = object.family ?? 0;
    message.port = object.port ?? 0;
    message.dnsName = object.dnsName ?? "";
    return message;
  },
};

function createBaseContactInfoContentBody(): ContactInfoContentBody {
  return {
    gossipAddress: undefined,
    rpcAddress: undefined,
    excludedHashes: [],
    count: 0,
    hubVersion: "",
    network: 0,
    appVersion: "",
    timestamp: 0,
    fid: 0,
  };
}

export const ContactInfoContentBody = {
  encode(message: ContactInfoContentBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.gossipAddress !== undefined) {
      GossipAddressInfo.encode(message.gossipAddress, writer.uint32(10).fork()).ldelim();
    }
    if (message.rpcAddress !== undefined) {
      GossipAddressInfo.encode(message.rpcAddress, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.excludedHashes) {
      writer.uint32(26).string(v!);
    }
    if (message.count !== 0) {
      writer.uint32(32).uint32(message.count);
    }
    if (message.hubVersion !== "") {
      writer.uint32(42).string(message.hubVersion);
    }
    if (message.network !== 0) {
      writer.uint32(48).int32(message.network);
    }
    if (message.appVersion !== "") {
      writer.uint32(58).string(message.appVersion);
    }
    if (message.timestamp !== 0) {
      writer.uint32(64).uint64(message.timestamp);
    }
    if (message.fid !== 0) {
      writer.uint32(72).uint64(message.fid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ContactInfoContentBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseContactInfoContentBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.gossipAddress = GossipAddressInfo.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.rpcAddress = GossipAddressInfo.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.excludedHashes.push(reader.string());
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.count = reader.uint32();
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.hubVersion = reader.string();
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.network = reader.int32() as any;
          continue;
        case 7:
          if (tag != 58) {
            break;
          }

          message.appVersion = reader.string();
          continue;
        case 8:
          if (tag != 64) {
            break;
          }

          message.timestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 9:
          if (tag != 72) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ContactInfoContentBody {
    return {
      gossipAddress: isSet(object.gossipAddress) ? GossipAddressInfo.fromJSON(object.gossipAddress) : undefined,
      rpcAddress: isSet(object.rpcAddress) ? GossipAddressInfo.fromJSON(object.rpcAddress) : undefined,
      excludedHashes: Array.isArray(object?.excludedHashes) ? object.excludedHashes.map((e: any) => String(e)) : [],
      count: isSet(object.count) ? Number(object.count) : 0,
      hubVersion: isSet(object.hubVersion) ? String(object.hubVersion) : "",
      network: isSet(object.network) ? farcasterNetworkFromJSON(object.network) : 0,
      appVersion: isSet(object.appVersion) ? String(object.appVersion) : "",
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      fid: isSet(object.fid) ? Number(object.fid) : 0,
    };
  },

  toJSON(message: ContactInfoContentBody): unknown {
    const obj: any = {};
    message.gossipAddress !== undefined &&
      (obj.gossipAddress = message.gossipAddress ? GossipAddressInfo.toJSON(message.gossipAddress) : undefined);
    message.rpcAddress !== undefined &&
      (obj.rpcAddress = message.rpcAddress ? GossipAddressInfo.toJSON(message.rpcAddress) : undefined);
    if (message.excludedHashes) {
      obj.excludedHashes = message.excludedHashes.map((e) => e);
    } else {
      obj.excludedHashes = [];
    }
    message.count !== undefined && (obj.count = Math.round(message.count));
    message.hubVersion !== undefined && (obj.hubVersion = message.hubVersion);
    message.network !== undefined && (obj.network = farcasterNetworkToJSON(message.network));
    message.appVersion !== undefined && (obj.appVersion = message.appVersion);
    message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    return obj;
  },

  create<I extends Exact<DeepPartial<ContactInfoContentBody>, I>>(base?: I): ContactInfoContentBody {
    return ContactInfoContentBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ContactInfoContentBody>, I>>(object: I): ContactInfoContentBody {
    const message = createBaseContactInfoContentBody();
    message.gossipAddress = (object.gossipAddress !== undefined && object.gossipAddress !== null)
      ? GossipAddressInfo.fromPartial(object.gossipAddress)
      : undefined;
    message.rpcAddress = (object.rpcAddress !== undefined && object.rpcAddress !== null)
      ? GossipAddressInfo.fromPartial(object.rpcAddress)
      : undefined;
    message.excludedHashes = object.excludedHashes?.map((e) => e) || [];
    message.count = object.count ?? 0;
    message.hubVersion = object.hubVersion ?? "";
    message.network = object.network ?? 0;
    message.appVersion = object.appVersion ?? "";
    message.timestamp = object.timestamp ?? 0;
    message.fid = object.fid ?? 0;
    return message;
  },
};

function createBaseContactInfoContent(): ContactInfoContent {
  return {
    gossipAddress: undefined,
    rpcAddress: undefined,
    excludedHashes: [],
    count: 0,
    hubVersion: "",
    network: 0,
    appVersion: "",
    timestamp: 0,
    fid: 0,
    body: undefined,
    signature: new Uint8Array(),
    signer: new Uint8Array(),
    dataBytes: undefined,
  };
}

export const ContactInfoContent = {
  encode(message: ContactInfoContent, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.gossipAddress !== undefined) {
      GossipAddressInfo.encode(message.gossipAddress, writer.uint32(10).fork()).ldelim();
    }
    if (message.rpcAddress !== undefined) {
      GossipAddressInfo.encode(message.rpcAddress, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.excludedHashes) {
      writer.uint32(26).string(v!);
    }
    if (message.count !== 0) {
      writer.uint32(32).uint32(message.count);
    }
    if (message.hubVersion !== "") {
      writer.uint32(42).string(message.hubVersion);
    }
    if (message.network !== 0) {
      writer.uint32(48).int32(message.network);
    }
    if (message.appVersion !== "") {
      writer.uint32(58).string(message.appVersion);
    }
    if (message.timestamp !== 0) {
      writer.uint32(64).uint64(message.timestamp);
    }
    if (message.fid !== 0) {
      writer.uint32(72).uint64(message.fid);
    }
    if (message.body !== undefined) {
      ContactInfoContentBody.encode(message.body, writer.uint32(82).fork()).ldelim();
    }
    if (message.signature.length !== 0) {
      writer.uint32(90).bytes(message.signature);
    }
    if (message.signer.length !== 0) {
      writer.uint32(98).bytes(message.signer);
    }
    if (message.dataBytes !== undefined) {
      writer.uint32(106).bytes(message.dataBytes);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ContactInfoContent {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseContactInfoContent();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.gossipAddress = GossipAddressInfo.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.rpcAddress = GossipAddressInfo.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.excludedHashes.push(reader.string());
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.count = reader.uint32();
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.hubVersion = reader.string();
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.network = reader.int32() as any;
          continue;
        case 7:
          if (tag != 58) {
            break;
          }

          message.appVersion = reader.string();
          continue;
        case 8:
          if (tag != 64) {
            break;
          }

          message.timestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 9:
          if (tag != 72) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 10:
          if (tag != 82) {
            break;
          }

          message.body = ContactInfoContentBody.decode(reader, reader.uint32());
          continue;
        case 11:
          if (tag != 90) {
            break;
          }

          message.signature = reader.bytes();
          continue;
        case 12:
          if (tag != 98) {
            break;
          }

          message.signer = reader.bytes();
          continue;
        case 13:
          if (tag != 106) {
            break;
          }

          message.dataBytes = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ContactInfoContent {
    return {
      gossipAddress: isSet(object.gossipAddress) ? GossipAddressInfo.fromJSON(object.gossipAddress) : undefined,
      rpcAddress: isSet(object.rpcAddress) ? GossipAddressInfo.fromJSON(object.rpcAddress) : undefined,
      excludedHashes: Array.isArray(object?.excludedHashes) ? object.excludedHashes.map((e: any) => String(e)) : [],
      count: isSet(object.count) ? Number(object.count) : 0,
      hubVersion: isSet(object.hubVersion) ? String(object.hubVersion) : "",
      network: isSet(object.network) ? farcasterNetworkFromJSON(object.network) : 0,
      appVersion: isSet(object.appVersion) ? String(object.appVersion) : "",
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      body: isSet(object.body) ? ContactInfoContentBody.fromJSON(object.body) : undefined,
      signature: isSet(object.signature) ? bytesFromBase64(object.signature) : new Uint8Array(),
      signer: isSet(object.signer) ? bytesFromBase64(object.signer) : new Uint8Array(),
      dataBytes: isSet(object.dataBytes) ? bytesFromBase64(object.dataBytes) : undefined,
    };
  },

  toJSON(message: ContactInfoContent): unknown {
    const obj: any = {};
    message.gossipAddress !== undefined &&
      (obj.gossipAddress = message.gossipAddress ? GossipAddressInfo.toJSON(message.gossipAddress) : undefined);
    message.rpcAddress !== undefined &&
      (obj.rpcAddress = message.rpcAddress ? GossipAddressInfo.toJSON(message.rpcAddress) : undefined);
    if (message.excludedHashes) {
      obj.excludedHashes = message.excludedHashes.map((e) => e);
    } else {
      obj.excludedHashes = [];
    }
    message.count !== undefined && (obj.count = Math.round(message.count));
    message.hubVersion !== undefined && (obj.hubVersion = message.hubVersion);
    message.network !== undefined && (obj.network = farcasterNetworkToJSON(message.network));
    message.appVersion !== undefined && (obj.appVersion = message.appVersion);
    message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.body !== undefined && (obj.body = message.body ? ContactInfoContentBody.toJSON(message.body) : undefined);
    message.signature !== undefined &&
      (obj.signature = base64FromBytes(message.signature !== undefined ? message.signature : new Uint8Array()));
    message.signer !== undefined &&
      (obj.signer = base64FromBytes(message.signer !== undefined ? message.signer : new Uint8Array()));
    message.dataBytes !== undefined &&
      (obj.dataBytes = message.dataBytes !== undefined ? base64FromBytes(message.dataBytes) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ContactInfoContent>, I>>(base?: I): ContactInfoContent {
    return ContactInfoContent.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ContactInfoContent>, I>>(object: I): ContactInfoContent {
    const message = createBaseContactInfoContent();
    message.gossipAddress = (object.gossipAddress !== undefined && object.gossipAddress !== null)
      ? GossipAddressInfo.fromPartial(object.gossipAddress)
      : undefined;
    message.rpcAddress = (object.rpcAddress !== undefined && object.rpcAddress !== null)
      ? GossipAddressInfo.fromPartial(object.rpcAddress)
      : undefined;
    message.excludedHashes = object.excludedHashes?.map((e) => e) || [];
    message.count = object.count ?? 0;
    message.hubVersion = object.hubVersion ?? "";
    message.network = object.network ?? 0;
    message.appVersion = object.appVersion ?? "";
    message.timestamp = object.timestamp ?? 0;
    message.fid = object.fid ?? 0;
    message.body = (object.body !== undefined && object.body !== null)
      ? ContactInfoContentBody.fromPartial(object.body)
      : undefined;
    message.signature = object.signature ?? new Uint8Array();
    message.signer = object.signer ?? new Uint8Array();
    message.dataBytes = object.dataBytes ?? undefined;
    return message;
  },
};

function createBasePingMessageBody(): PingMessageBody {
  return { pingOriginPeerId: new Uint8Array(), pingTimestamp: 0 };
}

export const PingMessageBody = {
  encode(message: PingMessageBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.pingOriginPeerId.length !== 0) {
      writer.uint32(10).bytes(message.pingOriginPeerId);
    }
    if (message.pingTimestamp !== 0) {
      writer.uint32(16).uint64(message.pingTimestamp);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PingMessageBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePingMessageBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.pingOriginPeerId = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.pingTimestamp = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PingMessageBody {
    return {
      pingOriginPeerId: isSet(object.pingOriginPeerId) ? bytesFromBase64(object.pingOriginPeerId) : new Uint8Array(),
      pingTimestamp: isSet(object.pingTimestamp) ? Number(object.pingTimestamp) : 0,
    };
  },

  toJSON(message: PingMessageBody): unknown {
    const obj: any = {};
    message.pingOriginPeerId !== undefined &&
      (obj.pingOriginPeerId = base64FromBytes(
        message.pingOriginPeerId !== undefined ? message.pingOriginPeerId : new Uint8Array(),
      ));
    message.pingTimestamp !== undefined && (obj.pingTimestamp = Math.round(message.pingTimestamp));
    return obj;
  },

  create<I extends Exact<DeepPartial<PingMessageBody>, I>>(base?: I): PingMessageBody {
    return PingMessageBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<PingMessageBody>, I>>(object: I): PingMessageBody {
    const message = createBasePingMessageBody();
    message.pingOriginPeerId = object.pingOriginPeerId ?? new Uint8Array();
    message.pingTimestamp = object.pingTimestamp ?? 0;
    return message;
  },
};

function createBaseAckMessageBody(): AckMessageBody {
  return { pingOriginPeerId: new Uint8Array(), ackOriginPeerId: new Uint8Array(), pingTimestamp: 0, ackTimestamp: 0 };
}

export const AckMessageBody = {
  encode(message: AckMessageBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.pingOriginPeerId.length !== 0) {
      writer.uint32(10).bytes(message.pingOriginPeerId);
    }
    if (message.ackOriginPeerId.length !== 0) {
      writer.uint32(18).bytes(message.ackOriginPeerId);
    }
    if (message.pingTimestamp !== 0) {
      writer.uint32(24).uint64(message.pingTimestamp);
    }
    if (message.ackTimestamp !== 0) {
      writer.uint32(32).uint64(message.ackTimestamp);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AckMessageBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAckMessageBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.pingOriginPeerId = reader.bytes();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.ackOriginPeerId = reader.bytes();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.pingTimestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.ackTimestamp = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): AckMessageBody {
    return {
      pingOriginPeerId: isSet(object.pingOriginPeerId) ? bytesFromBase64(object.pingOriginPeerId) : new Uint8Array(),
      ackOriginPeerId: isSet(object.ackOriginPeerId) ? bytesFromBase64(object.ackOriginPeerId) : new Uint8Array(),
      pingTimestamp: isSet(object.pingTimestamp) ? Number(object.pingTimestamp) : 0,
      ackTimestamp: isSet(object.ackTimestamp) ? Number(object.ackTimestamp) : 0,
    };
  },

  toJSON(message: AckMessageBody): unknown {
    const obj: any = {};
    message.pingOriginPeerId !== undefined &&
      (obj.pingOriginPeerId = base64FromBytes(
        message.pingOriginPeerId !== undefined ? message.pingOriginPeerId : new Uint8Array(),
      ));
    message.ackOriginPeerId !== undefined &&
      (obj.ackOriginPeerId = base64FromBytes(
        message.ackOriginPeerId !== undefined ? message.ackOriginPeerId : new Uint8Array(),
      ));
    message.pingTimestamp !== undefined && (obj.pingTimestamp = Math.round(message.pingTimestamp));
    message.ackTimestamp !== undefined && (obj.ackTimestamp = Math.round(message.ackTimestamp));
    return obj;
  },

  create<I extends Exact<DeepPartial<AckMessageBody>, I>>(base?: I): AckMessageBody {
    return AckMessageBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<AckMessageBody>, I>>(object: I): AckMessageBody {
    const message = createBaseAckMessageBody();
    message.pingOriginPeerId = object.pingOriginPeerId ?? new Uint8Array();
    message.ackOriginPeerId = object.ackOriginPeerId ?? new Uint8Array();
    message.pingTimestamp = object.pingTimestamp ?? 0;
    message.ackTimestamp = object.ackTimestamp ?? 0;
    return message;
  },
};

function createBaseNetworkLatencyMessage(): NetworkLatencyMessage {
  return { pingMessage: undefined, ackMessage: undefined };
}

export const NetworkLatencyMessage = {
  encode(message: NetworkLatencyMessage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.pingMessage !== undefined) {
      PingMessageBody.encode(message.pingMessage, writer.uint32(18).fork()).ldelim();
    }
    if (message.ackMessage !== undefined) {
      AckMessageBody.encode(message.ackMessage, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): NetworkLatencyMessage {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseNetworkLatencyMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          if (tag != 18) {
            break;
          }

          message.pingMessage = PingMessageBody.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.ackMessage = AckMessageBody.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): NetworkLatencyMessage {
    return {
      pingMessage: isSet(object.pingMessage) ? PingMessageBody.fromJSON(object.pingMessage) : undefined,
      ackMessage: isSet(object.ackMessage) ? AckMessageBody.fromJSON(object.ackMessage) : undefined,
    };
  },

  toJSON(message: NetworkLatencyMessage): unknown {
    const obj: any = {};
    message.pingMessage !== undefined &&
      (obj.pingMessage = message.pingMessage ? PingMessageBody.toJSON(message.pingMessage) : undefined);
    message.ackMessage !== undefined &&
      (obj.ackMessage = message.ackMessage ? AckMessageBody.toJSON(message.ackMessage) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<NetworkLatencyMessage>, I>>(base?: I): NetworkLatencyMessage {
    return NetworkLatencyMessage.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<NetworkLatencyMessage>, I>>(object: I): NetworkLatencyMessage {
    const message = createBaseNetworkLatencyMessage();
    message.pingMessage = (object.pingMessage !== undefined && object.pingMessage !== null)
      ? PingMessageBody.fromPartial(object.pingMessage)
      : undefined;
    message.ackMessage = (object.ackMessage !== undefined && object.ackMessage !== null)
      ? AckMessageBody.fromPartial(object.ackMessage)
      : undefined;
    return message;
  },
};

function createBaseMessageBundle(): MessageBundle {
  return { hash: new Uint8Array(), messages: [] };
}

export const MessageBundle = {
  encode(message: MessageBundle, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.hash.length !== 0) {
      writer.uint32(10).bytes(message.hash);
    }
    for (const v of message.messages) {
      Message.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MessageBundle {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMessageBundle();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.hash = reader.bytes();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.messages.push(Message.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MessageBundle {
    return {
      hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(),
      messages: Array.isArray(object?.messages) ? object.messages.map((e: any) => Message.fromJSON(e)) : [],
    };
  },

  toJSON(message: MessageBundle): unknown {
    const obj: any = {};
    message.hash !== undefined &&
      (obj.hash = base64FromBytes(message.hash !== undefined ? message.hash : new Uint8Array()));
    if (message.messages) {
      obj.messages = message.messages.map((e) => e ? Message.toJSON(e) : undefined);
    } else {
      obj.messages = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<MessageBundle>, I>>(base?: I): MessageBundle {
    return MessageBundle.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MessageBundle>, I>>(object: I): MessageBundle {
    const message = createBaseMessageBundle();
    message.hash = object.hash ?? new Uint8Array();
    message.messages = object.messages?.map((e) => Message.fromPartial(e)) || [];
    return message;
  },
};

function createBaseGossipMessage(): GossipMessage {
  return {
    message: undefined,
    contactInfoContent: undefined,
    networkLatencyMessage: undefined,
    messageBundle: undefined,
    topics: [],
    peerId: new Uint8Array(),
    version: 0,
    timestamp: 0,
  };
}

export const GossipMessage = {
  encode(message: GossipMessage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.message !== undefined) {
      Message.encode(message.message, writer.uint32(10).fork()).ldelim();
    }
    if (message.contactInfoContent !== undefined) {
      ContactInfoContent.encode(message.contactInfoContent, writer.uint32(26).fork()).ldelim();
    }
    if (message.networkLatencyMessage !== undefined) {
      NetworkLatencyMessage.encode(message.networkLatencyMessage, writer.uint32(58).fork()).ldelim();
    }
    if (message.messageBundle !== undefined) {
      MessageBundle.encode(message.messageBundle, writer.uint32(74).fork()).ldelim();
    }
    for (const v of message.topics) {
      writer.uint32(34).string(v!);
    }
    if (message.peerId.length !== 0) {
      writer.uint32(42).bytes(message.peerId);
    }
    if (message.version !== 0) {
      writer.uint32(48).int32(message.version);
    }
    if (message.timestamp !== 0) {
      writer.uint32(64).uint32(message.timestamp);
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

          message.message = Message.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.contactInfoContent = ContactInfoContent.decode(reader, reader.uint32());
          continue;
        case 7:
          if (tag != 58) {
            break;
          }

          message.networkLatencyMessage = NetworkLatencyMessage.decode(reader, reader.uint32());
          continue;
        case 9:
          if (tag != 74) {
            break;
          }

          message.messageBundle = MessageBundle.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.topics.push(reader.string());
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.peerId = reader.bytes();
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.version = reader.int32() as any;
          continue;
        case 8:
          if (tag != 64) {
            break;
          }

          message.timestamp = reader.uint32();
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
      message: isSet(object.message) ? Message.fromJSON(object.message) : undefined,
      contactInfoContent: isSet(object.contactInfoContent)
        ? ContactInfoContent.fromJSON(object.contactInfoContent)
        : undefined,
      networkLatencyMessage: isSet(object.networkLatencyMessage)
        ? NetworkLatencyMessage.fromJSON(object.networkLatencyMessage)
        : undefined,
      messageBundle: isSet(object.messageBundle) ? MessageBundle.fromJSON(object.messageBundle) : undefined,
      topics: Array.isArray(object?.topics) ? object.topics.map((e: any) => String(e)) : [],
      peerId: isSet(object.peerId) ? bytesFromBase64(object.peerId) : new Uint8Array(),
      version: isSet(object.version) ? gossipVersionFromJSON(object.version) : 0,
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
    };
  },

  toJSON(message: GossipMessage): unknown {
    const obj: any = {};
    message.message !== undefined && (obj.message = message.message ? Message.toJSON(message.message) : undefined);
    message.contactInfoContent !== undefined && (obj.contactInfoContent = message.contactInfoContent
      ? ContactInfoContent.toJSON(message.contactInfoContent)
      : undefined);
    message.networkLatencyMessage !== undefined && (obj.networkLatencyMessage = message.networkLatencyMessage
      ? NetworkLatencyMessage.toJSON(message.networkLatencyMessage)
      : undefined);
    message.messageBundle !== undefined &&
      (obj.messageBundle = message.messageBundle ? MessageBundle.toJSON(message.messageBundle) : undefined);
    if (message.topics) {
      obj.topics = message.topics.map((e) => e);
    } else {
      obj.topics = [];
    }
    message.peerId !== undefined &&
      (obj.peerId = base64FromBytes(message.peerId !== undefined ? message.peerId : new Uint8Array()));
    message.version !== undefined && (obj.version = gossipVersionToJSON(message.version));
    message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
    return obj;
  },

  create<I extends Exact<DeepPartial<GossipMessage>, I>>(base?: I): GossipMessage {
    return GossipMessage.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GossipMessage>, I>>(object: I): GossipMessage {
    const message = createBaseGossipMessage();
    message.message = (object.message !== undefined && object.message !== null)
      ? Message.fromPartial(object.message)
      : undefined;
    message.contactInfoContent = (object.contactInfoContent !== undefined && object.contactInfoContent !== null)
      ? ContactInfoContent.fromPartial(object.contactInfoContent)
      : undefined;
    message.networkLatencyMessage =
      (object.networkLatencyMessage !== undefined && object.networkLatencyMessage !== null)
        ? NetworkLatencyMessage.fromPartial(object.networkLatencyMessage)
        : undefined;
    message.messageBundle = (object.messageBundle !== undefined && object.messageBundle !== null)
      ? MessageBundle.fromPartial(object.messageBundle)
      : undefined;
    message.topics = object.topics?.map((e) => e) || [];
    message.peerId = object.peerId ?? new Uint8Array();
    message.version = object.version ?? 0;
    message.timestamp = object.timestamp ?? 0;
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
