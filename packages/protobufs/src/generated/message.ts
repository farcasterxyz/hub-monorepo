/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export enum MessageType {
  None = 0,
  CastAdd = 1,
  CastRemove = 2,
  ReactionAdd = 3,
  ReactionRemove = 4,
  AmpAdd = 5,
  AmpRemove = 6,
  VerificationAddEthAddress = 7,
  VerificationRemove = 8,
  SignerAdd = 9,
  SignerRemove = 10,
  UserDataAdd = 11,
  UNRECOGNIZED = -1,
}

export function messageTypeFromJSON(object: any): MessageType {
  switch (object) {
    case 0:
    case "None":
      return MessageType.None;
    case 1:
    case "CastAdd":
      return MessageType.CastAdd;
    case 2:
    case "CastRemove":
      return MessageType.CastRemove;
    case 3:
    case "ReactionAdd":
      return MessageType.ReactionAdd;
    case 4:
    case "ReactionRemove":
      return MessageType.ReactionRemove;
    case 5:
    case "AmpAdd":
      return MessageType.AmpAdd;
    case 6:
    case "AmpRemove":
      return MessageType.AmpRemove;
    case 7:
    case "VerificationAddEthAddress":
      return MessageType.VerificationAddEthAddress;
    case 8:
    case "VerificationRemove":
      return MessageType.VerificationRemove;
    case 9:
    case "SignerAdd":
      return MessageType.SignerAdd;
    case 10:
    case "SignerRemove":
      return MessageType.SignerRemove;
    case 11:
    case "UserDataAdd":
      return MessageType.UserDataAdd;
    case -1:
    case "UNRECOGNIZED":
    default:
      return MessageType.UNRECOGNIZED;
  }
}

export function messageTypeToJSON(object: MessageType): string {
  switch (object) {
    case MessageType.None:
      return "None";
    case MessageType.CastAdd:
      return "CastAdd";
    case MessageType.CastRemove:
      return "CastRemove";
    case MessageType.ReactionAdd:
      return "ReactionAdd";
    case MessageType.ReactionRemove:
      return "ReactionRemove";
    case MessageType.AmpAdd:
      return "AmpAdd";
    case MessageType.AmpRemove:
      return "AmpRemove";
    case MessageType.VerificationAddEthAddress:
      return "VerificationAddEthAddress";
    case MessageType.VerificationRemove:
      return "VerificationRemove";
    case MessageType.SignerAdd:
      return "SignerAdd";
    case MessageType.SignerRemove:
      return "SignerRemove";
    case MessageType.UserDataAdd:
      return "UserDataAdd";
    case MessageType.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export enum SignatureScheme {
  DefaultSignatureScheme = 0,
  Ed25519 = 1,
  Eip712 = 2,
  UNRECOGNIZED = -1,
}

export function signatureSchemeFromJSON(object: any): SignatureScheme {
  switch (object) {
    case 0:
    case "DefaultSignatureScheme":
      return SignatureScheme.DefaultSignatureScheme;
    case 1:
    case "Ed25519":
      return SignatureScheme.Ed25519;
    case 2:
    case "Eip712":
      return SignatureScheme.Eip712;
    case -1:
    case "UNRECOGNIZED":
    default:
      return SignatureScheme.UNRECOGNIZED;
  }
}

export function signatureSchemeToJSON(object: SignatureScheme): string {
  switch (object) {
    case SignatureScheme.DefaultSignatureScheme:
      return "DefaultSignatureScheme";
    case SignatureScheme.Ed25519:
      return "Ed25519";
    case SignatureScheme.Eip712:
      return "Eip712";
    case SignatureScheme.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export enum HashScheme {
  DefaultHashScheme = 0,
  Blake3 = 1,
  UNRECOGNIZED = -1,
}

export function hashSchemeFromJSON(object: any): HashScheme {
  switch (object) {
    case 0:
    case "DefaultHashScheme":
      return HashScheme.DefaultHashScheme;
    case 1:
    case "Blake3":
      return HashScheme.Blake3;
    case -1:
    case "UNRECOGNIZED":
    default:
      return HashScheme.UNRECOGNIZED;
  }
}

export function hashSchemeToJSON(object: HashScheme): string {
  switch (object) {
    case HashScheme.DefaultHashScheme:
      return "DefaultHashScheme";
    case HashScheme.Blake3:
      return "Blake3";
    case HashScheme.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export enum FarcasterNetwork {
  DefaultFarcasterNetwork = 0,
  Mainnet = 1,
  Testnet = 2,
  Devnet = 3,
  UNRECOGNIZED = -1,
}

export function farcasterNetworkFromJSON(object: any): FarcasterNetwork {
  switch (object) {
    case 0:
    case "DefaultFarcasterNetwork":
      return FarcasterNetwork.DefaultFarcasterNetwork;
    case 1:
    case "Mainnet":
      return FarcasterNetwork.Mainnet;
    case 2:
    case "Testnet":
      return FarcasterNetwork.Testnet;
    case 3:
    case "Devnet":
      return FarcasterNetwork.Devnet;
    case -1:
    case "UNRECOGNIZED":
    default:
      return FarcasterNetwork.UNRECOGNIZED;
  }
}

export function farcasterNetworkToJSON(object: FarcasterNetwork): string {
  switch (object) {
    case FarcasterNetwork.DefaultFarcasterNetwork:
      return "DefaultFarcasterNetwork";
    case FarcasterNetwork.Mainnet:
      return "Mainnet";
    case FarcasterNetwork.Testnet:
      return "Testnet";
    case FarcasterNetwork.Devnet:
      return "Devnet";
    case FarcasterNetwork.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface CastId {
  fid: Uint8Array;
  tsHash: Uint8Array;
}

export interface UserId {
  fid: Uint8Array;
}

export interface CastAddBody {
  embeds: string[];
  mentions: UserId[];
  castId?: CastId | undefined;
  text: string;
}

export interface MessageData {
  castAddBody?: CastAddBody | undefined;
  type: MessageType;
  timestamp: number;
  fid: Uint8Array;
  network: FarcasterNetwork;
}

export interface Message {
  data: Uint8Array;
  hash: Uint8Array;
  hashScheme: HashScheme;
  signature: Uint8Array;
  signatureScheme: SignatureScheme;
  signer: Uint8Array;
}

function createBaseCastId(): CastId {
  return { fid: new Uint8Array(), tsHash: new Uint8Array() };
}

export const CastId = {
  encode(message: CastId, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid.length !== 0) {
      writer.uint32(10).bytes(message.fid);
    }
    if (message.tsHash.length !== 0) {
      writer.uint32(18).bytes(message.tsHash);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CastId {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCastId();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.fid = reader.bytes();
          break;
        case 2:
          message.tsHash = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): CastId {
    return {
      fid: isSet(object.fid) ? bytesFromBase64(object.fid) : new Uint8Array(),
      tsHash: isSet(object.tsHash) ? bytesFromBase64(object.tsHash) : new Uint8Array(),
    };
  },

  toJSON(message: CastId): unknown {
    const obj: any = {};
    message.fid !== undefined &&
      (obj.fid = base64FromBytes(message.fid !== undefined ? message.fid : new Uint8Array()));
    message.tsHash !== undefined &&
      (obj.tsHash = base64FromBytes(message.tsHash !== undefined ? message.tsHash : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<CastId>, I>>(base?: I): CastId {
    return CastId.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<CastId>, I>>(object: I): CastId {
    const message = createBaseCastId();
    message.fid = object.fid ?? new Uint8Array();
    message.tsHash = object.tsHash ?? new Uint8Array();
    return message;
  },
};

function createBaseUserId(): UserId {
  return { fid: new Uint8Array() };
}

export const UserId = {
  encode(message: UserId, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid.length !== 0) {
      writer.uint32(10).bytes(message.fid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UserId {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUserId();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.fid = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): UserId {
    return { fid: isSet(object.fid) ? bytesFromBase64(object.fid) : new Uint8Array() };
  },

  toJSON(message: UserId): unknown {
    const obj: any = {};
    message.fid !== undefined &&
      (obj.fid = base64FromBytes(message.fid !== undefined ? message.fid : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<UserId>, I>>(base?: I): UserId {
    return UserId.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<UserId>, I>>(object: I): UserId {
    const message = createBaseUserId();
    message.fid = object.fid ?? new Uint8Array();
    return message;
  },
};

function createBaseCastAddBody(): CastAddBody {
  return { embeds: [], mentions: [], castId: undefined, text: "" };
}

export const CastAddBody = {
  encode(message: CastAddBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.embeds) {
      writer.uint32(10).string(v!);
    }
    for (const v of message.mentions) {
      UserId.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.castId !== undefined) {
      CastId.encode(message.castId, writer.uint32(26).fork()).ldelim();
    }
    if (message.text !== "") {
      writer.uint32(34).string(message.text);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CastAddBody {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCastAddBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.embeds.push(reader.string());
          break;
        case 2:
          message.mentions.push(UserId.decode(reader, reader.uint32()));
          break;
        case 3:
          message.castId = CastId.decode(reader, reader.uint32());
          break;
        case 4:
          message.text = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): CastAddBody {
    return {
      embeds: Array.isArray(object?.embeds) ? object.embeds.map((e: any) => String(e)) : [],
      mentions: Array.isArray(object?.mentions) ? object.mentions.map((e: any) => UserId.fromJSON(e)) : [],
      castId: isSet(object.castId) ? CastId.fromJSON(object.castId) : undefined,
      text: isSet(object.text) ? String(object.text) : "",
    };
  },

  toJSON(message: CastAddBody): unknown {
    const obj: any = {};
    if (message.embeds) {
      obj.embeds = message.embeds.map((e) => e);
    } else {
      obj.embeds = [];
    }
    if (message.mentions) {
      obj.mentions = message.mentions.map((e) => e ? UserId.toJSON(e) : undefined);
    } else {
      obj.mentions = [];
    }
    message.castId !== undefined && (obj.castId = message.castId ? CastId.toJSON(message.castId) : undefined);
    message.text !== undefined && (obj.text = message.text);
    return obj;
  },

  create<I extends Exact<DeepPartial<CastAddBody>, I>>(base?: I): CastAddBody {
    return CastAddBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<CastAddBody>, I>>(object: I): CastAddBody {
    const message = createBaseCastAddBody();
    message.embeds = object.embeds?.map((e) => e) || [];
    message.mentions = object.mentions?.map((e) => UserId.fromPartial(e)) || [];
    message.castId = (object.castId !== undefined && object.castId !== null)
      ? CastId.fromPartial(object.castId)
      : undefined;
    message.text = object.text ?? "";
    return message;
  },
};

function createBaseMessageData(): MessageData {
  return { castAddBody: undefined, type: 0, timestamp: 0, fid: new Uint8Array(), network: 0 };
}

export const MessageData = {
  encode(message: MessageData, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.castAddBody !== undefined) {
      CastAddBody.encode(message.castAddBody, writer.uint32(10).fork()).ldelim();
    }
    if (message.type !== 0) {
      writer.uint32(16).int32(message.type);
    }
    if (message.timestamp !== 0) {
      writer.uint32(24).uint32(message.timestamp);
    }
    if (message.fid.length !== 0) {
      writer.uint32(34).bytes(message.fid);
    }
    if (message.network !== 0) {
      writer.uint32(40).int32(message.network);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MessageData {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMessageData();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.castAddBody = CastAddBody.decode(reader, reader.uint32());
          break;
        case 2:
          message.type = reader.int32() as any;
          break;
        case 3:
          message.timestamp = reader.uint32();
          break;
        case 4:
          message.fid = reader.bytes();
          break;
        case 5:
          message.network = reader.int32() as any;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): MessageData {
    return {
      castAddBody: isSet(object.castAddBody) ? CastAddBody.fromJSON(object.castAddBody) : undefined,
      type: isSet(object.type) ? messageTypeFromJSON(object.type) : 0,
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      fid: isSet(object.fid) ? bytesFromBase64(object.fid) : new Uint8Array(),
      network: isSet(object.network) ? farcasterNetworkFromJSON(object.network) : 0,
    };
  },

  toJSON(message: MessageData): unknown {
    const obj: any = {};
    message.castAddBody !== undefined &&
      (obj.castAddBody = message.castAddBody ? CastAddBody.toJSON(message.castAddBody) : undefined);
    message.type !== undefined && (obj.type = messageTypeToJSON(message.type));
    message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
    message.fid !== undefined &&
      (obj.fid = base64FromBytes(message.fid !== undefined ? message.fid : new Uint8Array()));
    message.network !== undefined && (obj.network = farcasterNetworkToJSON(message.network));
    return obj;
  },

  create<I extends Exact<DeepPartial<MessageData>, I>>(base?: I): MessageData {
    return MessageData.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MessageData>, I>>(object: I): MessageData {
    const message = createBaseMessageData();
    message.castAddBody = (object.castAddBody !== undefined && object.castAddBody !== null)
      ? CastAddBody.fromPartial(object.castAddBody)
      : undefined;
    message.type = object.type ?? 0;
    message.timestamp = object.timestamp ?? 0;
    message.fid = object.fid ?? new Uint8Array();
    message.network = object.network ?? 0;
    return message;
  },
};

function createBaseMessage(): Message {
  return {
    data: new Uint8Array(),
    hash: new Uint8Array(),
    hashScheme: 0,
    signature: new Uint8Array(),
    signatureScheme: 0,
    signer: new Uint8Array(),
  };
}

export const Message = {
  encode(message: Message, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.data.length !== 0) {
      writer.uint32(10).bytes(message.data);
    }
    if (message.hash.length !== 0) {
      writer.uint32(18).bytes(message.hash);
    }
    if (message.hashScheme !== 0) {
      writer.uint32(24).int32(message.hashScheme);
    }
    if (message.signature.length !== 0) {
      writer.uint32(34).bytes(message.signature);
    }
    if (message.signatureScheme !== 0) {
      writer.uint32(40).int32(message.signatureScheme);
    }
    if (message.signer.length !== 0) {
      writer.uint32(50).bytes(message.signer);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Message {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.data = reader.bytes();
          break;
        case 2:
          message.hash = reader.bytes();
          break;
        case 3:
          message.hashScheme = reader.int32() as any;
          break;
        case 4:
          message.signature = reader.bytes();
          break;
        case 5:
          message.signatureScheme = reader.int32() as any;
          break;
        case 6:
          message.signer = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Message {
    return {
      data: isSet(object.data) ? bytesFromBase64(object.data) : new Uint8Array(),
      hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(),
      hashScheme: isSet(object.hashScheme) ? hashSchemeFromJSON(object.hashScheme) : 0,
      signature: isSet(object.signature) ? bytesFromBase64(object.signature) : new Uint8Array(),
      signatureScheme: isSet(object.signatureScheme) ? signatureSchemeFromJSON(object.signatureScheme) : 0,
      signer: isSet(object.signer) ? bytesFromBase64(object.signer) : new Uint8Array(),
    };
  },

  toJSON(message: Message): unknown {
    const obj: any = {};
    message.data !== undefined &&
      (obj.data = base64FromBytes(message.data !== undefined ? message.data : new Uint8Array()));
    message.hash !== undefined &&
      (obj.hash = base64FromBytes(message.hash !== undefined ? message.hash : new Uint8Array()));
    message.hashScheme !== undefined && (obj.hashScheme = hashSchemeToJSON(message.hashScheme));
    message.signature !== undefined &&
      (obj.signature = base64FromBytes(message.signature !== undefined ? message.signature : new Uint8Array()));
    message.signatureScheme !== undefined && (obj.signatureScheme = signatureSchemeToJSON(message.signatureScheme));
    message.signer !== undefined &&
      (obj.signer = base64FromBytes(message.signer !== undefined ? message.signer : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<Message>, I>>(base?: I): Message {
    return Message.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Message>, I>>(object: I): Message {
    const message = createBaseMessage();
    message.data = object.data ?? new Uint8Array();
    message.hash = object.hash ?? new Uint8Array();
    message.hashScheme = object.hashScheme ?? 0;
    message.signature = object.signature ?? new Uint8Array();
    message.signatureScheme = object.signatureScheme ?? 0;
    message.signer = object.signer ?? new Uint8Array();
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

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
