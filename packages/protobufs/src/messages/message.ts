/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

/** Type of hashing scheme used to produce a digest of MessageData */
export enum HashScheme {
  NONE = 0,
  /** BLAKE3 - Default scheme for hashing MessageData */
  BLAKE3 = 1,
}

export function hashSchemeFromJSON(object: any): HashScheme {
  switch (object) {
    case 0:
    case "HASH_SCHEME_NONE":
      return HashScheme.NONE;
    case 1:
    case "HASH_SCHEME_BLAKE3":
      return HashScheme.BLAKE3;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum HashScheme");
  }
}

export function hashSchemeToJSON(object: HashScheme): string {
  switch (object) {
    case HashScheme.NONE:
      return "HASH_SCHEME_NONE";
    case HashScheme.BLAKE3:
      return "HASH_SCHEME_BLAKE3";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum HashScheme");
  }
}

/** Type of signature scheme used to sign the Message hash */
export enum SignatureScheme {
  NONE = 0,
  /** ED25519 - Ed25519 signature (default) */
  ED25519 = 1,
  /** EIP712 - ECDSA signature using EIP-712 scheme */
  EIP712 = 2,
}

export function signatureSchemeFromJSON(object: any): SignatureScheme {
  switch (object) {
    case 0:
    case "SIGNATURE_SCHEME_NONE":
      return SignatureScheme.NONE;
    case 1:
    case "SIGNATURE_SCHEME_ED25519":
      return SignatureScheme.ED25519;
    case 2:
    case "SIGNATURE_SCHEME_EIP712":
      return SignatureScheme.EIP712;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum SignatureScheme");
  }
}

export function signatureSchemeToJSON(object: SignatureScheme): string {
  switch (object) {
    case SignatureScheme.NONE:
      return "SIGNATURE_SCHEME_NONE";
    case SignatureScheme.ED25519:
      return "SIGNATURE_SCHEME_ED25519";
    case SignatureScheme.EIP712:
      return "SIGNATURE_SCHEME_EIP712";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum SignatureScheme");
  }
}

/** Type of the MessageBody */
export enum MessageType {
  NONE = 0,
  /** CAST_ADD - Add a new Cast */
  CAST_ADD = 1,
  /** CAST_REMOVE - Remove an existing Cast */
  CAST_REMOVE = 2,
  /** REACTION_ADD - Add a Reaction to a Cast */
  REACTION_ADD = 3,
  /** REACTION_REMOVE - Remove a Reaction from a Cast */
  REACTION_REMOVE = 4,
  /** VERIFICATION_ADD_ETH_ADDRESS - Add a Verification of an Ethereum Address */
  VERIFICATION_ADD_ETH_ADDRESS = 7,
  /** VERIFICATION_REMOVE - Remove a Verification */
  VERIFICATION_REMOVE = 8,
  /** SIGNER_ADD - Add a new Ed25519 key pair that signs messages for a user */
  SIGNER_ADD = 9,
  /** SIGNER_REMOVE - Remove an Ed25519 key pair that signs messages for a user */
  SIGNER_REMOVE = 10,
  /** USER_DATA_ADD - Add metadata about a user */
  USER_DATA_ADD = 11,
}

export function messageTypeFromJSON(object: any): MessageType {
  switch (object) {
    case 0:
    case "MESSAGE_TYPE_NONE":
      return MessageType.NONE;
    case 1:
    case "MESSAGE_TYPE_CAST_ADD":
      return MessageType.CAST_ADD;
    case 2:
    case "MESSAGE_TYPE_CAST_REMOVE":
      return MessageType.CAST_REMOVE;
    case 3:
    case "MESSAGE_TYPE_REACTION_ADD":
      return MessageType.REACTION_ADD;
    case 4:
    case "MESSAGE_TYPE_REACTION_REMOVE":
      return MessageType.REACTION_REMOVE;
    case 7:
    case "MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS":
      return MessageType.VERIFICATION_ADD_ETH_ADDRESS;
    case 8:
    case "MESSAGE_TYPE_VERIFICATION_REMOVE":
      return MessageType.VERIFICATION_REMOVE;
    case 9:
    case "MESSAGE_TYPE_SIGNER_ADD":
      return MessageType.SIGNER_ADD;
    case 10:
    case "MESSAGE_TYPE_SIGNER_REMOVE":
      return MessageType.SIGNER_REMOVE;
    case 11:
    case "MESSAGE_TYPE_USER_DATA_ADD":
      return MessageType.USER_DATA_ADD;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum MessageType");
  }
}

export function messageTypeToJSON(object: MessageType): string {
  switch (object) {
    case MessageType.NONE:
      return "MESSAGE_TYPE_NONE";
    case MessageType.CAST_ADD:
      return "MESSAGE_TYPE_CAST_ADD";
    case MessageType.CAST_REMOVE:
      return "MESSAGE_TYPE_CAST_REMOVE";
    case MessageType.REACTION_ADD:
      return "MESSAGE_TYPE_REACTION_ADD";
    case MessageType.REACTION_REMOVE:
      return "MESSAGE_TYPE_REACTION_REMOVE";
    case MessageType.VERIFICATION_ADD_ETH_ADDRESS:
      return "MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS";
    case MessageType.VERIFICATION_REMOVE:
      return "MESSAGE_TYPE_VERIFICATION_REMOVE";
    case MessageType.SIGNER_ADD:
      return "MESSAGE_TYPE_SIGNER_ADD";
    case MessageType.SIGNER_REMOVE:
      return "MESSAGE_TYPE_SIGNER_REMOVE";
    case MessageType.USER_DATA_ADD:
      return "MESSAGE_TYPE_USER_DATA_ADD";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum MessageType");
  }
}

/** Farcaster network the message is intended for */
export enum FarcasterNetwork {
  NONE = 0,
  /** MAINNET - Public primary network */
  MAINNET = 1,
  /** TESTNET - Public test network */
  TESTNET = 2,
  /** DEVNET - Private test network */
  DEVNET = 3,
}

export function farcasterNetworkFromJSON(object: any): FarcasterNetwork {
  switch (object) {
    case 0:
    case "FARCASTER_NETWORK_NONE":
      return FarcasterNetwork.NONE;
    case 1:
    case "FARCASTER_NETWORK_MAINNET":
      return FarcasterNetwork.MAINNET;
    case 2:
    case "FARCASTER_NETWORK_TESTNET":
      return FarcasterNetwork.TESTNET;
    case 3:
    case "FARCASTER_NETWORK_DEVNET":
      return FarcasterNetwork.DEVNET;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum FarcasterNetwork");
  }
}

export function farcasterNetworkToJSON(object: FarcasterNetwork): string {
  switch (object) {
    case FarcasterNetwork.NONE:
      return "FARCASTER_NETWORK_NONE";
    case FarcasterNetwork.MAINNET:
      return "FARCASTER_NETWORK_MAINNET";
    case FarcasterNetwork.TESTNET:
      return "FARCASTER_NETWORK_TESTNET";
    case FarcasterNetwork.DEVNET:
      return "FARCASTER_NETWORK_DEVNET";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum FarcasterNetwork");
  }
}

/** Type of UserData */
export enum UserDataType {
  NONE = 0,
  /** PFP - Profile Picture for the user */
  PFP = 1,
  /** DISPLAY - Display Name for the user */
  DISPLAY = 2,
  /** BIO - Bio for the user */
  BIO = 3,
  /** URL - URL of the user */
  URL = 5,
  /** FNAME - Preferred Farcaster Name for the user */
  FNAME = 6,
}

export function userDataTypeFromJSON(object: any): UserDataType {
  switch (object) {
    case 0:
    case "USER_DATA_TYPE_NONE":
      return UserDataType.NONE;
    case 1:
    case "USER_DATA_TYPE_PFP":
      return UserDataType.PFP;
    case 2:
    case "USER_DATA_TYPE_DISPLAY":
      return UserDataType.DISPLAY;
    case 3:
    case "USER_DATA_TYPE_BIO":
      return UserDataType.BIO;
    case 5:
    case "USER_DATA_TYPE_URL":
      return UserDataType.URL;
    case 6:
    case "USER_DATA_TYPE_FNAME":
      return UserDataType.FNAME;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum UserDataType");
  }
}

export function userDataTypeToJSON(object: UserDataType): string {
  switch (object) {
    case UserDataType.NONE:
      return "USER_DATA_TYPE_NONE";
    case UserDataType.PFP:
      return "USER_DATA_TYPE_PFP";
    case UserDataType.DISPLAY:
      return "USER_DATA_TYPE_DISPLAY";
    case UserDataType.BIO:
      return "USER_DATA_TYPE_BIO";
    case UserDataType.URL:
      return "USER_DATA_TYPE_URL";
    case UserDataType.FNAME:
      return "USER_DATA_TYPE_FNAME";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum UserDataType");
  }
}

/** Type of Reaction */
export enum ReactionType {
  NONE = 0,
  /** LIKE - Like the target cast */
  LIKE = 1,
  /** RECAST - Share target cast to the user's audience */
  RECAST = 2,
}

export function reactionTypeFromJSON(object: any): ReactionType {
  switch (object) {
    case 0:
    case "REACTION_TYPE_NONE":
      return ReactionType.NONE;
    case 1:
    case "REACTION_TYPE_LIKE":
      return ReactionType.LIKE;
    case 2:
    case "REACTION_TYPE_RECAST":
      return ReactionType.RECAST;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum ReactionType");
  }
}

export function reactionTypeToJSON(object: ReactionType): string {
  switch (object) {
    case ReactionType.NONE:
      return "REACTION_TYPE_NONE";
    case ReactionType.LIKE:
      return "REACTION_TYPE_LIKE";
    case ReactionType.RECAST:
      return "REACTION_TYPE_RECAST";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum ReactionType");
  }
}

/**
 * A Message is a delta operation on the Farcaster network. The message protobuf is an envelope
 * that wraps a MessageData object and contains a hash and signature which can verify its authenticity.
 */
export interface Message {
  /** Contents of the message */
  data:
    | MessageData
    | undefined;
  /** Hash digest of data */
  hash: Uint8Array;
  /** Hash scheme that produced the hash digest */
  hashScheme: HashScheme;
  /** Signature of the hash digest */
  signature: Uint8Array;
  /** Signature scheme that produced the signature */
  signatureScheme: SignatureScheme;
  /** Public key or address of the key pair that produced the signature */
  signer: Uint8Array;
}

/**
 * A MessageData object contains properties common to all messages and wraps a body object which
 * contains properties specific to the MessageType.
 */
export interface MessageData {
  /** Type of message contained in the body */
  type: MessageType;
  /** Farcaster ID of the user producing the message */
  fid: number;
  /** Farcaster epoch timestamp in seconds */
  timestamp: number;
  /** Farcaster network the message is intended for */
  network: FarcasterNetwork;
  castAddBody?: CastAddBody | undefined;
  castRemoveBody?: CastRemoveBody | undefined;
  reactionBody?: ReactionBody | undefined;
  verificationAddEthAddressBody?: VerificationAddEthAddressBody | undefined;
  verificationRemoveBody?: VerificationRemoveBody | undefined;
  signerAddBody?: SignerAddBody | undefined;
  userDataBody?: UserDataBody | undefined;
  signerRemoveBody?: SignerRemoveBody | undefined;
}

/** Adds an Ed25519 key pair that signs messages for a user */
export interface SignerAddBody {
  /** Public key of the Ed25519 key pair */
  signer: Uint8Array;
  /** Name of the key pair */
  name?: string | undefined;
}

/** Removes an Ed25519 key pair that signs messages for a user */
export interface SignerRemoveBody {
  /** Public key of the Ed25519 key pair */
  signer: Uint8Array;
}

/** Adds metadata about a user */
export interface UserDataBody {
  /** Type of metadata */
  type: UserDataType;
  /** Value of the metadata */
  value: string;
}

/** Adds a new Cast */
export interface CastAddBody {
  /** URLs to be embedded in the cast */
  embeds: string[];
  /** Fids mentioned in the cast */
  mentions: number[];
  /** Parent cast of the cast */
  parentCastId?:
    | CastId
    | undefined;
  /** Text of the cast */
  text: string;
  /** Positions of the mentions in the text */
  mentionsPositions: number[];
}

/** Removes an existing Cast */
export interface CastRemoveBody {
  /** Hash of the cast to remove */
  targetHash: Uint8Array;
}

/** Identifier used to look up a Cast */
export interface CastId {
  /** Fid of the user who created the cast */
  fid: number;
  /** Hash of the cast */
  hash: Uint8Array;
}

/** Adds or removes a Reaction from a Cast */
export interface ReactionBody {
  /** Type of reaction */
  type: ReactionType;
  /** CastId of the Cast to react to */
  targetCastId?: CastId | undefined;
}

/** Adds a Verification of ownership of an Ethereum Address */
export interface VerificationAddEthAddressBody {
  /** Ethereum address being verified */
  address: Uint8Array;
  /** Signature produced by the user's Ethereum address */
  ethSignature: Uint8Array;
  /** Hash of the latest Ethereum block when the signature was produced */
  blockHash: Uint8Array;
}

/** Removes a Verification of any type */
export interface VerificationRemoveBody {
  /** Address of the Verification to remove */
  address: Uint8Array;
}

function createBaseMessage(): Message {
  return {
    data: undefined,
    hash: new Uint8Array(),
    hashScheme: 0,
    signature: new Uint8Array(),
    signatureScheme: 0,
    signer: new Uint8Array(),
  };
}

export const Message = {
  encode(message: Message, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.data !== undefined) {
      MessageData.encode(message.data, writer.uint32(10).fork()).ldelim();
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
          message.data = MessageData.decode(reader, reader.uint32());
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
      data: isSet(object.data) ? MessageData.fromJSON(object.data) : undefined,
      hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(),
      hashScheme: isSet(object.hashScheme) ? hashSchemeFromJSON(object.hashScheme) : 0,
      signature: isSet(object.signature) ? bytesFromBase64(object.signature) : new Uint8Array(),
      signatureScheme: isSet(object.signatureScheme) ? signatureSchemeFromJSON(object.signatureScheme) : 0,
      signer: isSet(object.signer) ? bytesFromBase64(object.signer) : new Uint8Array(),
    };
  },

  toJSON(message: Message): unknown {
    const obj: any = {};
    message.data !== undefined && (obj.data = message.data ? MessageData.toJSON(message.data) : undefined);
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
    message.data = (object.data !== undefined && object.data !== null)
      ? MessageData.fromPartial(object.data)
      : undefined;
    message.hash = object.hash ?? new Uint8Array();
    message.hashScheme = object.hashScheme ?? 0;
    message.signature = object.signature ?? new Uint8Array();
    message.signatureScheme = object.signatureScheme ?? 0;
    message.signer = object.signer ?? new Uint8Array();
    return message;
  },
};

function createBaseMessageData(): MessageData {
  return {
    type: 0,
    fid: 0,
    timestamp: 0,
    network: 0,
    castAddBody: undefined,
    castRemoveBody: undefined,
    reactionBody: undefined,
    verificationAddEthAddressBody: undefined,
    verificationRemoveBody: undefined,
    signerAddBody: undefined,
    userDataBody: undefined,
    signerRemoveBody: undefined,
  };
}

export const MessageData = {
  encode(message: MessageData, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== 0) {
      writer.uint32(8).int32(message.type);
    }
    if (message.fid !== 0) {
      writer.uint32(16).uint64(message.fid);
    }
    if (message.timestamp !== 0) {
      writer.uint32(24).uint32(message.timestamp);
    }
    if (message.network !== 0) {
      writer.uint32(32).int32(message.network);
    }
    if (message.castAddBody !== undefined) {
      CastAddBody.encode(message.castAddBody, writer.uint32(42).fork()).ldelim();
    }
    if (message.castRemoveBody !== undefined) {
      CastRemoveBody.encode(message.castRemoveBody, writer.uint32(50).fork()).ldelim();
    }
    if (message.reactionBody !== undefined) {
      ReactionBody.encode(message.reactionBody, writer.uint32(58).fork()).ldelim();
    }
    if (message.verificationAddEthAddressBody !== undefined) {
      VerificationAddEthAddressBody.encode(message.verificationAddEthAddressBody, writer.uint32(74).fork()).ldelim();
    }
    if (message.verificationRemoveBody !== undefined) {
      VerificationRemoveBody.encode(message.verificationRemoveBody, writer.uint32(82).fork()).ldelim();
    }
    if (message.signerAddBody !== undefined) {
      SignerAddBody.encode(message.signerAddBody, writer.uint32(90).fork()).ldelim();
    }
    if (message.userDataBody !== undefined) {
      UserDataBody.encode(message.userDataBody, writer.uint32(98).fork()).ldelim();
    }
    if (message.signerRemoveBody !== undefined) {
      SignerRemoveBody.encode(message.signerRemoveBody, writer.uint32(106).fork()).ldelim();
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
          message.type = reader.int32() as any;
          break;
        case 2:
          message.fid = longToNumber(reader.uint64() as Long);
          break;
        case 3:
          message.timestamp = reader.uint32();
          break;
        case 4:
          message.network = reader.int32() as any;
          break;
        case 5:
          message.castAddBody = CastAddBody.decode(reader, reader.uint32());
          break;
        case 6:
          message.castRemoveBody = CastRemoveBody.decode(reader, reader.uint32());
          break;
        case 7:
          message.reactionBody = ReactionBody.decode(reader, reader.uint32());
          break;
        case 9:
          message.verificationAddEthAddressBody = VerificationAddEthAddressBody.decode(reader, reader.uint32());
          break;
        case 10:
          message.verificationRemoveBody = VerificationRemoveBody.decode(reader, reader.uint32());
          break;
        case 11:
          message.signerAddBody = SignerAddBody.decode(reader, reader.uint32());
          break;
        case 12:
          message.userDataBody = UserDataBody.decode(reader, reader.uint32());
          break;
        case 13:
          message.signerRemoveBody = SignerRemoveBody.decode(reader, reader.uint32());
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
      type: isSet(object.type) ? messageTypeFromJSON(object.type) : 0,
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      network: isSet(object.network) ? farcasterNetworkFromJSON(object.network) : 0,
      castAddBody: isSet(object.castAddBody) ? CastAddBody.fromJSON(object.castAddBody) : undefined,
      castRemoveBody: isSet(object.castRemoveBody) ? CastRemoveBody.fromJSON(object.castRemoveBody) : undefined,
      reactionBody: isSet(object.reactionBody) ? ReactionBody.fromJSON(object.reactionBody) : undefined,
      verificationAddEthAddressBody: isSet(object.verificationAddEthAddressBody)
        ? VerificationAddEthAddressBody.fromJSON(object.verificationAddEthAddressBody)
        : undefined,
      verificationRemoveBody: isSet(object.verificationRemoveBody)
        ? VerificationRemoveBody.fromJSON(object.verificationRemoveBody)
        : undefined,
      signerAddBody: isSet(object.signerAddBody) ? SignerAddBody.fromJSON(object.signerAddBody) : undefined,
      userDataBody: isSet(object.userDataBody) ? UserDataBody.fromJSON(object.userDataBody) : undefined,
      signerRemoveBody: isSet(object.signerRemoveBody) ? SignerRemoveBody.fromJSON(object.signerRemoveBody) : undefined,
    };
  },

  toJSON(message: MessageData): unknown {
    const obj: any = {};
    message.type !== undefined && (obj.type = messageTypeToJSON(message.type));
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
    message.network !== undefined && (obj.network = farcasterNetworkToJSON(message.network));
    message.castAddBody !== undefined &&
      (obj.castAddBody = message.castAddBody ? CastAddBody.toJSON(message.castAddBody) : undefined);
    message.castRemoveBody !== undefined &&
      (obj.castRemoveBody = message.castRemoveBody ? CastRemoveBody.toJSON(message.castRemoveBody) : undefined);
    message.reactionBody !== undefined &&
      (obj.reactionBody = message.reactionBody ? ReactionBody.toJSON(message.reactionBody) : undefined);
    message.verificationAddEthAddressBody !== undefined &&
      (obj.verificationAddEthAddressBody = message.verificationAddEthAddressBody
        ? VerificationAddEthAddressBody.toJSON(message.verificationAddEthAddressBody)
        : undefined);
    message.verificationRemoveBody !== undefined && (obj.verificationRemoveBody = message.verificationRemoveBody
      ? VerificationRemoveBody.toJSON(message.verificationRemoveBody)
      : undefined);
    message.signerAddBody !== undefined &&
      (obj.signerAddBody = message.signerAddBody ? SignerAddBody.toJSON(message.signerAddBody) : undefined);
    message.userDataBody !== undefined &&
      (obj.userDataBody = message.userDataBody ? UserDataBody.toJSON(message.userDataBody) : undefined);
    message.signerRemoveBody !== undefined &&
      (obj.signerRemoveBody = message.signerRemoveBody ? SignerRemoveBody.toJSON(message.signerRemoveBody) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<MessageData>, I>>(base?: I): MessageData {
    return MessageData.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MessageData>, I>>(object: I): MessageData {
    const message = createBaseMessageData();
    message.type = object.type ?? 0;
    message.fid = object.fid ?? 0;
    message.timestamp = object.timestamp ?? 0;
    message.network = object.network ?? 0;
    message.castAddBody = (object.castAddBody !== undefined && object.castAddBody !== null)
      ? CastAddBody.fromPartial(object.castAddBody)
      : undefined;
    message.castRemoveBody = (object.castRemoveBody !== undefined && object.castRemoveBody !== null)
      ? CastRemoveBody.fromPartial(object.castRemoveBody)
      : undefined;
    message.reactionBody = (object.reactionBody !== undefined && object.reactionBody !== null)
      ? ReactionBody.fromPartial(object.reactionBody)
      : undefined;
    message.verificationAddEthAddressBody =
      (object.verificationAddEthAddressBody !== undefined && object.verificationAddEthAddressBody !== null)
        ? VerificationAddEthAddressBody.fromPartial(object.verificationAddEthAddressBody)
        : undefined;
    message.verificationRemoveBody =
      (object.verificationRemoveBody !== undefined && object.verificationRemoveBody !== null)
        ? VerificationRemoveBody.fromPartial(object.verificationRemoveBody)
        : undefined;
    message.signerAddBody = (object.signerAddBody !== undefined && object.signerAddBody !== null)
      ? SignerAddBody.fromPartial(object.signerAddBody)
      : undefined;
    message.userDataBody = (object.userDataBody !== undefined && object.userDataBody !== null)
      ? UserDataBody.fromPartial(object.userDataBody)
      : undefined;
    message.signerRemoveBody = (object.signerRemoveBody !== undefined && object.signerRemoveBody !== null)
      ? SignerRemoveBody.fromPartial(object.signerRemoveBody)
      : undefined;
    return message;
  },
};

function createBaseSignerAddBody(): SignerAddBody {
  return { signer: new Uint8Array(), name: undefined };
}

export const SignerAddBody = {
  encode(message: SignerAddBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.signer.length !== 0) {
      writer.uint32(10).bytes(message.signer);
    }
    if (message.name !== undefined) {
      writer.uint32(18).string(message.name);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SignerAddBody {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignerAddBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.signer = reader.bytes();
          break;
        case 2:
          message.name = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SignerAddBody {
    return {
      signer: isSet(object.signer) ? bytesFromBase64(object.signer) : new Uint8Array(),
      name: isSet(object.name) ? String(object.name) : undefined,
    };
  },

  toJSON(message: SignerAddBody): unknown {
    const obj: any = {};
    message.signer !== undefined &&
      (obj.signer = base64FromBytes(message.signer !== undefined ? message.signer : new Uint8Array()));
    message.name !== undefined && (obj.name = message.name);
    return obj;
  },

  create<I extends Exact<DeepPartial<SignerAddBody>, I>>(base?: I): SignerAddBody {
    return SignerAddBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SignerAddBody>, I>>(object: I): SignerAddBody {
    const message = createBaseSignerAddBody();
    message.signer = object.signer ?? new Uint8Array();
    message.name = object.name ?? undefined;
    return message;
  },
};

function createBaseSignerRemoveBody(): SignerRemoveBody {
  return { signer: new Uint8Array() };
}

export const SignerRemoveBody = {
  encode(message: SignerRemoveBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.signer.length !== 0) {
      writer.uint32(10).bytes(message.signer);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SignerRemoveBody {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignerRemoveBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.signer = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SignerRemoveBody {
    return { signer: isSet(object.signer) ? bytesFromBase64(object.signer) : new Uint8Array() };
  },

  toJSON(message: SignerRemoveBody): unknown {
    const obj: any = {};
    message.signer !== undefined &&
      (obj.signer = base64FromBytes(message.signer !== undefined ? message.signer : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<SignerRemoveBody>, I>>(base?: I): SignerRemoveBody {
    return SignerRemoveBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SignerRemoveBody>, I>>(object: I): SignerRemoveBody {
    const message = createBaseSignerRemoveBody();
    message.signer = object.signer ?? new Uint8Array();
    return message;
  },
};

function createBaseUserDataBody(): UserDataBody {
  return { type: 0, value: "" };
}

export const UserDataBody = {
  encode(message: UserDataBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== 0) {
      writer.uint32(8).int32(message.type);
    }
    if (message.value !== "") {
      writer.uint32(18).string(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UserDataBody {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUserDataBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.type = reader.int32() as any;
          break;
        case 2:
          message.value = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): UserDataBody {
    return {
      type: isSet(object.type) ? userDataTypeFromJSON(object.type) : 0,
      value: isSet(object.value) ? String(object.value) : "",
    };
  },

  toJSON(message: UserDataBody): unknown {
    const obj: any = {};
    message.type !== undefined && (obj.type = userDataTypeToJSON(message.type));
    message.value !== undefined && (obj.value = message.value);
    return obj;
  },

  create<I extends Exact<DeepPartial<UserDataBody>, I>>(base?: I): UserDataBody {
    return UserDataBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<UserDataBody>, I>>(object: I): UserDataBody {
    const message = createBaseUserDataBody();
    message.type = object.type ?? 0;
    message.value = object.value ?? "";
    return message;
  },
};

function createBaseCastAddBody(): CastAddBody {
  return { embeds: [], mentions: [], parentCastId: undefined, text: "", mentionsPositions: [] };
}

export const CastAddBody = {
  encode(message: CastAddBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.embeds) {
      writer.uint32(10).string(v!);
    }
    writer.uint32(18).fork();
    for (const v of message.mentions) {
      writer.uint64(v);
    }
    writer.ldelim();
    if (message.parentCastId !== undefined) {
      CastId.encode(message.parentCastId, writer.uint32(26).fork()).ldelim();
    }
    if (message.text !== "") {
      writer.uint32(34).string(message.text);
    }
    writer.uint32(42).fork();
    for (const v of message.mentionsPositions) {
      writer.uint32(v);
    }
    writer.ldelim();
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
          if ((tag & 7) === 2) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.mentions.push(longToNumber(reader.uint64() as Long));
            }
          } else {
            message.mentions.push(longToNumber(reader.uint64() as Long));
          }
          break;
        case 3:
          message.parentCastId = CastId.decode(reader, reader.uint32());
          break;
        case 4:
          message.text = reader.string();
          break;
        case 5:
          if ((tag & 7) === 2) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.mentionsPositions.push(reader.uint32());
            }
          } else {
            message.mentionsPositions.push(reader.uint32());
          }
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
      mentions: Array.isArray(object?.mentions) ? object.mentions.map((e: any) => Number(e)) : [],
      parentCastId: isSet(object.parentCastId) ? CastId.fromJSON(object.parentCastId) : undefined,
      text: isSet(object.text) ? String(object.text) : "",
      mentionsPositions: Array.isArray(object?.mentionsPositions)
        ? object.mentionsPositions.map((e: any) => Number(e))
        : [],
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
      obj.mentions = message.mentions.map((e) => Math.round(e));
    } else {
      obj.mentions = [];
    }
    message.parentCastId !== undefined &&
      (obj.parentCastId = message.parentCastId ? CastId.toJSON(message.parentCastId) : undefined);
    message.text !== undefined && (obj.text = message.text);
    if (message.mentionsPositions) {
      obj.mentionsPositions = message.mentionsPositions.map((e) => Math.round(e));
    } else {
      obj.mentionsPositions = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<CastAddBody>, I>>(base?: I): CastAddBody {
    return CastAddBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<CastAddBody>, I>>(object: I): CastAddBody {
    const message = createBaseCastAddBody();
    message.embeds = object.embeds?.map((e) => e) || [];
    message.mentions = object.mentions?.map((e) => e) || [];
    message.parentCastId = (object.parentCastId !== undefined && object.parentCastId !== null)
      ? CastId.fromPartial(object.parentCastId)
      : undefined;
    message.text = object.text ?? "";
    message.mentionsPositions = object.mentionsPositions?.map((e) => e) || [];
    return message;
  },
};

function createBaseCastRemoveBody(): CastRemoveBody {
  return { targetHash: new Uint8Array() };
}

export const CastRemoveBody = {
  encode(message: CastRemoveBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.targetHash.length !== 0) {
      writer.uint32(10).bytes(message.targetHash);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CastRemoveBody {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCastRemoveBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.targetHash = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): CastRemoveBody {
    return { targetHash: isSet(object.targetHash) ? bytesFromBase64(object.targetHash) : new Uint8Array() };
  },

  toJSON(message: CastRemoveBody): unknown {
    const obj: any = {};
    message.targetHash !== undefined &&
      (obj.targetHash = base64FromBytes(message.targetHash !== undefined ? message.targetHash : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<CastRemoveBody>, I>>(base?: I): CastRemoveBody {
    return CastRemoveBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<CastRemoveBody>, I>>(object: I): CastRemoveBody {
    const message = createBaseCastRemoveBody();
    message.targetHash = object.targetHash ?? new Uint8Array();
    return message;
  },
};

function createBaseCastId(): CastId {
  return { fid: 0, hash: new Uint8Array() };
}

export const CastId = {
  encode(message: CastId, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.hash.length !== 0) {
      writer.uint32(18).bytes(message.hash);
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
          message.fid = longToNumber(reader.uint64() as Long);
          break;
        case 2:
          message.hash = reader.bytes();
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
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(),
    };
  },

  toJSON(message: CastId): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.hash !== undefined &&
      (obj.hash = base64FromBytes(message.hash !== undefined ? message.hash : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<CastId>, I>>(base?: I): CastId {
    return CastId.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<CastId>, I>>(object: I): CastId {
    const message = createBaseCastId();
    message.fid = object.fid ?? 0;
    message.hash = object.hash ?? new Uint8Array();
    return message;
  },
};

function createBaseReactionBody(): ReactionBody {
  return { type: 0, targetCastId: undefined };
}

export const ReactionBody = {
  encode(message: ReactionBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== 0) {
      writer.uint32(8).int32(message.type);
    }
    if (message.targetCastId !== undefined) {
      CastId.encode(message.targetCastId, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ReactionBody {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReactionBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.type = reader.int32() as any;
          break;
        case 2:
          message.targetCastId = CastId.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ReactionBody {
    return {
      type: isSet(object.type) ? reactionTypeFromJSON(object.type) : 0,
      targetCastId: isSet(object.targetCastId) ? CastId.fromJSON(object.targetCastId) : undefined,
    };
  },

  toJSON(message: ReactionBody): unknown {
    const obj: any = {};
    message.type !== undefined && (obj.type = reactionTypeToJSON(message.type));
    message.targetCastId !== undefined &&
      (obj.targetCastId = message.targetCastId ? CastId.toJSON(message.targetCastId) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ReactionBody>, I>>(base?: I): ReactionBody {
    return ReactionBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ReactionBody>, I>>(object: I): ReactionBody {
    const message = createBaseReactionBody();
    message.type = object.type ?? 0;
    message.targetCastId = (object.targetCastId !== undefined && object.targetCastId !== null)
      ? CastId.fromPartial(object.targetCastId)
      : undefined;
    return message;
  },
};

function createBaseVerificationAddEthAddressBody(): VerificationAddEthAddressBody {
  return { address: new Uint8Array(), ethSignature: new Uint8Array(), blockHash: new Uint8Array() };
}

export const VerificationAddEthAddressBody = {
  encode(message: VerificationAddEthAddressBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address.length !== 0) {
      writer.uint32(10).bytes(message.address);
    }
    if (message.ethSignature.length !== 0) {
      writer.uint32(18).bytes(message.ethSignature);
    }
    if (message.blockHash.length !== 0) {
      writer.uint32(26).bytes(message.blockHash);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VerificationAddEthAddressBody {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVerificationAddEthAddressBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.address = reader.bytes();
          break;
        case 2:
          message.ethSignature = reader.bytes();
          break;
        case 3:
          message.blockHash = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): VerificationAddEthAddressBody {
    return {
      address: isSet(object.address) ? bytesFromBase64(object.address) : new Uint8Array(),
      ethSignature: isSet(object.ethSignature) ? bytesFromBase64(object.ethSignature) : new Uint8Array(),
      blockHash: isSet(object.blockHash) ? bytesFromBase64(object.blockHash) : new Uint8Array(),
    };
  },

  toJSON(message: VerificationAddEthAddressBody): unknown {
    const obj: any = {};
    message.address !== undefined &&
      (obj.address = base64FromBytes(message.address !== undefined ? message.address : new Uint8Array()));
    message.ethSignature !== undefined &&
      (obj.ethSignature = base64FromBytes(
        message.ethSignature !== undefined ? message.ethSignature : new Uint8Array(),
      ));
    message.blockHash !== undefined &&
      (obj.blockHash = base64FromBytes(message.blockHash !== undefined ? message.blockHash : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<VerificationAddEthAddressBody>, I>>(base?: I): VerificationAddEthAddressBody {
    return VerificationAddEthAddressBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<VerificationAddEthAddressBody>, I>>(
    object: I,
  ): VerificationAddEthAddressBody {
    const message = createBaseVerificationAddEthAddressBody();
    message.address = object.address ?? new Uint8Array();
    message.ethSignature = object.ethSignature ?? new Uint8Array();
    message.blockHash = object.blockHash ?? new Uint8Array();
    return message;
  },
};

function createBaseVerificationRemoveBody(): VerificationRemoveBody {
  return { address: new Uint8Array() };
}

export const VerificationRemoveBody = {
  encode(message: VerificationRemoveBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address.length !== 0) {
      writer.uint32(10).bytes(message.address);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VerificationRemoveBody {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVerificationRemoveBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.address = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): VerificationRemoveBody {
    return { address: isSet(object.address) ? bytesFromBase64(object.address) : new Uint8Array() };
  },

  toJSON(message: VerificationRemoveBody): unknown {
    const obj: any = {};
    message.address !== undefined &&
      (obj.address = base64FromBytes(message.address !== undefined ? message.address : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<VerificationRemoveBody>, I>>(base?: I): VerificationRemoveBody {
    return VerificationRemoveBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<VerificationRemoveBody>, I>>(object: I): VerificationRemoveBody {
    const message = createBaseVerificationRemoveBody();
    message.address = object.address ?? new Uint8Array();
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
