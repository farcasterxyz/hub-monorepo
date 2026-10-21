/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export enum OnChainEventType {
  EVENT_TYPE_NONE = 0,
  EVENT_TYPE_SIGNER = 1,
  EVENT_TYPE_SIGNER_MIGRATED = 2,
  EVENT_TYPE_ID_REGISTER = 3,
  EVENT_TYPE_STORAGE_RENT = 4,
  EVENT_TYPE_TIER_PURCHASE = 5,
  EVENT_TYPE_CHANNEL_REGISTER = 6,
}

export function onChainEventTypeFromJSON(object: any): OnChainEventType {
  switch (object) {
    case 0:
    case "EVENT_TYPE_NONE":
      return OnChainEventType.EVENT_TYPE_NONE;
    case 1:
    case "EVENT_TYPE_SIGNER":
      return OnChainEventType.EVENT_TYPE_SIGNER;
    case 2:
    case "EVENT_TYPE_SIGNER_MIGRATED":
      return OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED;
    case 3:
    case "EVENT_TYPE_ID_REGISTER":
      return OnChainEventType.EVENT_TYPE_ID_REGISTER;
    case 4:
    case "EVENT_TYPE_STORAGE_RENT":
      return OnChainEventType.EVENT_TYPE_STORAGE_RENT;
    case 5:
    case "EVENT_TYPE_TIER_PURCHASE":
      return OnChainEventType.EVENT_TYPE_TIER_PURCHASE;
    case 6:
    case "EVENT_TYPE_CHANNEL_REGISTER":
      return OnChainEventType.EVENT_TYPE_CHANNEL_REGISTER;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum OnChainEventType");
  }
}

export function onChainEventTypeToJSON(object: OnChainEventType): string {
  switch (object) {
    case OnChainEventType.EVENT_TYPE_NONE:
      return "EVENT_TYPE_NONE";
    case OnChainEventType.EVENT_TYPE_SIGNER:
      return "EVENT_TYPE_SIGNER";
    case OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED:
      return "EVENT_TYPE_SIGNER_MIGRATED";
    case OnChainEventType.EVENT_TYPE_ID_REGISTER:
      return "EVENT_TYPE_ID_REGISTER";
    case OnChainEventType.EVENT_TYPE_STORAGE_RENT:
      return "EVENT_TYPE_STORAGE_RENT";
    case OnChainEventType.EVENT_TYPE_TIER_PURCHASE:
      return "EVENT_TYPE_TIER_PURCHASE";
    case OnChainEventType.EVENT_TYPE_CHANNEL_REGISTER:
      return "EVENT_TYPE_CHANNEL_REGISTER";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum OnChainEventType");
  }
}

export enum ChannelRegisterEventType {
  NONE = 0,
  REGISTER = 1,
  RENEW = 2,
  TRANSFER = 3,
}

export function channelRegisterEventTypeFromJSON(object: any): ChannelRegisterEventType {
  switch (object) {
    case 0:
    case "CHANNEL_REGISTER_EVENT_TYPE_NONE":
      return ChannelRegisterEventType.NONE;
    case 1:
    case "CHANNEL_REGISTER_EVENT_TYPE_REGISTER":
      return ChannelRegisterEventType.REGISTER;
    case 2:
    case "CHANNEL_REGISTER_EVENT_TYPE_RENEW":
      return ChannelRegisterEventType.RENEW;
    case 3:
    case "CHANNEL_REGISTER_EVENT_TYPE_TRANSFER":
      return ChannelRegisterEventType.TRANSFER;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum ChannelRegisterEventType");
  }
}

export function channelRegisterEventTypeToJSON(object: ChannelRegisterEventType): string {
  switch (object) {
    case ChannelRegisterEventType.NONE:
      return "CHANNEL_REGISTER_EVENT_TYPE_NONE";
    case ChannelRegisterEventType.REGISTER:
      return "CHANNEL_REGISTER_EVENT_TYPE_REGISTER";
    case ChannelRegisterEventType.RENEW:
      return "CHANNEL_REGISTER_EVENT_TYPE_RENEW";
    case ChannelRegisterEventType.TRANSFER:
      return "CHANNEL_REGISTER_EVENT_TYPE_TRANSFER";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum ChannelRegisterEventType");
  }
}

export enum TierType {
  None = 0,
  Pro = 1,
}

export function tierTypeFromJSON(object: any): TierType {
  switch (object) {
    case 0:
    case "None":
      return TierType.None;
    case 1:
    case "Pro":
      return TierType.Pro;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum TierType");
  }
}

export function tierTypeToJSON(object: TierType): string {
  switch (object) {
    case TierType.None:
      return "None";
    case TierType.Pro:
      return "Pro";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum TierType");
  }
}

export enum SignerEventType {
  NONE = 0,
  ADD = 1,
  REMOVE = 2,
  ADMIN_RESET = 3,
}

export function signerEventTypeFromJSON(object: any): SignerEventType {
  switch (object) {
    case 0:
    case "SIGNER_EVENT_TYPE_NONE":
      return SignerEventType.NONE;
    case 1:
    case "SIGNER_EVENT_TYPE_ADD":
      return SignerEventType.ADD;
    case 2:
    case "SIGNER_EVENT_TYPE_REMOVE":
      return SignerEventType.REMOVE;
    case 3:
    case "SIGNER_EVENT_TYPE_ADMIN_RESET":
      return SignerEventType.ADMIN_RESET;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum SignerEventType");
  }
}

export function signerEventTypeToJSON(object: SignerEventType): string {
  switch (object) {
    case SignerEventType.NONE:
      return "SIGNER_EVENT_TYPE_NONE";
    case SignerEventType.ADD:
      return "SIGNER_EVENT_TYPE_ADD";
    case SignerEventType.REMOVE:
      return "SIGNER_EVENT_TYPE_REMOVE";
    case SignerEventType.ADMIN_RESET:
      return "SIGNER_EVENT_TYPE_ADMIN_RESET";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum SignerEventType");
  }
}

export enum IdRegisterEventType {
  NONE = 0,
  REGISTER = 1,
  TRANSFER = 2,
  CHANGE_RECOVERY = 3,
}

export function idRegisterEventTypeFromJSON(object: any): IdRegisterEventType {
  switch (object) {
    case 0:
    case "ID_REGISTER_EVENT_TYPE_NONE":
      return IdRegisterEventType.NONE;
    case 1:
    case "ID_REGISTER_EVENT_TYPE_REGISTER":
      return IdRegisterEventType.REGISTER;
    case 2:
    case "ID_REGISTER_EVENT_TYPE_TRANSFER":
      return IdRegisterEventType.TRANSFER;
    case 3:
    case "ID_REGISTER_EVENT_TYPE_CHANGE_RECOVERY":
      return IdRegisterEventType.CHANGE_RECOVERY;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum IdRegisterEventType");
  }
}

export function idRegisterEventTypeToJSON(object: IdRegisterEventType): string {
  switch (object) {
    case IdRegisterEventType.NONE:
      return "ID_REGISTER_EVENT_TYPE_NONE";
    case IdRegisterEventType.REGISTER:
      return "ID_REGISTER_EVENT_TYPE_REGISTER";
    case IdRegisterEventType.TRANSFER:
      return "ID_REGISTER_EVENT_TYPE_TRANSFER";
    case IdRegisterEventType.CHANGE_RECOVERY:
      return "ID_REGISTER_EVENT_TYPE_CHANGE_RECOVERY";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum IdRegisterEventType");
  }
}

export interface OnChainEvent {
  type: OnChainEventType;
  chainId: number;
  blockNumber: number;
  blockHash: Uint8Array;
  blockTimestamp: number;
  transactionHash: Uint8Array;
  logIndex: number;
  fid: number;
  signerEventBody?: SignerEventBody | undefined;
  signerMigratedEventBody?: SignerMigratedEventBody | undefined;
  idRegisterEventBody?: IdRegisterEventBody | undefined;
  storageRentEventBody?: StorageRentEventBody | undefined;
  tierPurchaseEventBody?: TierPurchaseBody | undefined;
  channelRegisterEventBody?: ChannelRegisterBody | undefined;
  txIndex: number;
  version: number;
}

/**
 * Field-presence rules below are producer conventions (the connector), not
 * merge validity rules: the store checks them only as index-input gating, so
 * an event that fails those checks still merges as a raw onchain event — it
 * just builds no channel index entries.
 */
export interface ChannelRegisterBody {
  /**
   * Verbatim name from the registry event; label = keccak256(channel_key).
   * Empty for TRANSFER (the ERC-721 Transfer log carries only the tokenId).
   * The registry contract validates name length only, so non-UTF-8 names are
   * registrable onchain but unrepresentable here (proto3 string requires valid
   * UTF-8). Such logs fail ABI decode in the connector and are never minted as
   * events — deterministic on every node, and the dropped names are
   * untypeable in any client.
   */
  channelKey: string;
  /** Absolute unix timestamp in seconds. 0 for TRANSFER. */
  expiry: number;
  /** REGISTER: the registrant. TRANSFER: the receiving address. Empty for RENEW. */
  ownerAddress: Uint8Array;
  eventType: ChannelRegisterEventType;
  /**
   * keccak256(channel_key), equal to the ERC-721 tokenId. Present on all event
   * types — the join key tying REGISTER/RENEW/TRANSFER for one channel together.
   */
  label: Uint8Array;
}

export interface TierPurchaseBody {
  tierType: TierType;
  forDays: number;
  payer: Uint8Array;
}

export interface SignerEventBody {
  key: Uint8Array;
  keyType: number;
  eventType: SignerEventType;
  metadata: Uint8Array;
  metadataType: number;
}

export interface SignerMigratedEventBody {
  migratedAt: number;
}

export interface IdRegisterEventBody {
  to: Uint8Array;
  eventType: IdRegisterEventType;
  from: Uint8Array;
  recoveryAddress: Uint8Array;
}

export interface StorageRentEventBody {
  payer: Uint8Array;
  units: number;
  expiry: number;
}

function createBaseOnChainEvent(): OnChainEvent {
  return {
    type: 0,
    chainId: 0,
    blockNumber: 0,
    blockHash: new Uint8Array(),
    blockTimestamp: 0,
    transactionHash: new Uint8Array(),
    logIndex: 0,
    fid: 0,
    signerEventBody: undefined,
    signerMigratedEventBody: undefined,
    idRegisterEventBody: undefined,
    storageRentEventBody: undefined,
    tierPurchaseEventBody: undefined,
    channelRegisterEventBody: undefined,
    txIndex: 0,
    version: 0,
  };
}

export const OnChainEvent = {
  encode(message: OnChainEvent, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== 0) {
      writer.uint32(8).int32(message.type);
    }
    if (message.chainId !== 0) {
      writer.uint32(16).uint32(message.chainId);
    }
    if (message.blockNumber !== 0) {
      writer.uint32(24).uint32(message.blockNumber);
    }
    if (message.blockHash.length !== 0) {
      writer.uint32(34).bytes(message.blockHash);
    }
    if (message.blockTimestamp !== 0) {
      writer.uint32(40).uint64(message.blockTimestamp);
    }
    if (message.transactionHash.length !== 0) {
      writer.uint32(50).bytes(message.transactionHash);
    }
    if (message.logIndex !== 0) {
      writer.uint32(56).uint32(message.logIndex);
    }
    if (message.fid !== 0) {
      writer.uint32(64).uint64(message.fid);
    }
    if (message.signerEventBody !== undefined) {
      SignerEventBody.encode(message.signerEventBody, writer.uint32(74).fork()).ldelim();
    }
    if (message.signerMigratedEventBody !== undefined) {
      SignerMigratedEventBody.encode(message.signerMigratedEventBody, writer.uint32(82).fork()).ldelim();
    }
    if (message.idRegisterEventBody !== undefined) {
      IdRegisterEventBody.encode(message.idRegisterEventBody, writer.uint32(90).fork()).ldelim();
    }
    if (message.storageRentEventBody !== undefined) {
      StorageRentEventBody.encode(message.storageRentEventBody, writer.uint32(98).fork()).ldelim();
    }
    if (message.tierPurchaseEventBody !== undefined) {
      TierPurchaseBody.encode(message.tierPurchaseEventBody, writer.uint32(122).fork()).ldelim();
    }
    if (message.channelRegisterEventBody !== undefined) {
      ChannelRegisterBody.encode(message.channelRegisterEventBody, writer.uint32(130).fork()).ldelim();
    }
    if (message.txIndex !== 0) {
      writer.uint32(104).uint32(message.txIndex);
    }
    if (message.version !== 0) {
      writer.uint32(112).uint32(message.version);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OnChainEvent {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOnChainEvent();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.type = reader.int32() as any;
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.chainId = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.blockNumber = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.blockHash = reader.bytes();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.blockTimestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.transactionHash = reader.bytes();
          continue;
        case 7:
          if (tag != 56) {
            break;
          }

          message.logIndex = reader.uint32();
          continue;
        case 8:
          if (tag != 64) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 9:
          if (tag != 74) {
            break;
          }

          message.signerEventBody = SignerEventBody.decode(reader, reader.uint32());
          continue;
        case 10:
          if (tag != 82) {
            break;
          }

          message.signerMigratedEventBody = SignerMigratedEventBody.decode(reader, reader.uint32());
          continue;
        case 11:
          if (tag != 90) {
            break;
          }

          message.idRegisterEventBody = IdRegisterEventBody.decode(reader, reader.uint32());
          continue;
        case 12:
          if (tag != 98) {
            break;
          }

          message.storageRentEventBody = StorageRentEventBody.decode(reader, reader.uint32());
          continue;
        case 15:
          if (tag != 122) {
            break;
          }

          message.tierPurchaseEventBody = TierPurchaseBody.decode(reader, reader.uint32());
          continue;
        case 16:
          if (tag != 130) {
            break;
          }

          message.channelRegisterEventBody = ChannelRegisterBody.decode(reader, reader.uint32());
          continue;
        case 13:
          if (tag != 104) {
            break;
          }

          message.txIndex = reader.uint32();
          continue;
        case 14:
          if (tag != 112) {
            break;
          }

          message.version = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): OnChainEvent {
    return {
      type: isSet(object.type) ? onChainEventTypeFromJSON(object.type) : 0,
      chainId: isSet(object.chainId) ? Number(object.chainId) : 0,
      blockNumber: isSet(object.blockNumber) ? Number(object.blockNumber) : 0,
      blockHash: isSet(object.blockHash) ? bytesFromBase64(object.blockHash) : new Uint8Array(),
      blockTimestamp: isSet(object.blockTimestamp) ? Number(object.blockTimestamp) : 0,
      transactionHash: isSet(object.transactionHash) ? bytesFromBase64(object.transactionHash) : new Uint8Array(),
      logIndex: isSet(object.logIndex) ? Number(object.logIndex) : 0,
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      signerEventBody: isSet(object.signerEventBody) ? SignerEventBody.fromJSON(object.signerEventBody) : undefined,
      signerMigratedEventBody: isSet(object.signerMigratedEventBody)
        ? SignerMigratedEventBody.fromJSON(object.signerMigratedEventBody)
        : undefined,
      idRegisterEventBody: isSet(object.idRegisterEventBody)
        ? IdRegisterEventBody.fromJSON(object.idRegisterEventBody)
        : undefined,
      storageRentEventBody: isSet(object.storageRentEventBody)
        ? StorageRentEventBody.fromJSON(object.storageRentEventBody)
        : undefined,
      tierPurchaseEventBody: isSet(object.tierPurchaseEventBody)
        ? TierPurchaseBody.fromJSON(object.tierPurchaseEventBody)
        : undefined,
      channelRegisterEventBody: isSet(object.channelRegisterEventBody)
        ? ChannelRegisterBody.fromJSON(object.channelRegisterEventBody)
        : undefined,
      txIndex: isSet(object.txIndex) ? Number(object.txIndex) : 0,
      version: isSet(object.version) ? Number(object.version) : 0,
    };
  },

  toJSON(message: OnChainEvent): unknown {
    const obj: any = {};
    message.type !== undefined && (obj.type = onChainEventTypeToJSON(message.type));
    message.chainId !== undefined && (obj.chainId = Math.round(message.chainId));
    message.blockNumber !== undefined && (obj.blockNumber = Math.round(message.blockNumber));
    message.blockHash !== undefined &&
      (obj.blockHash = base64FromBytes(message.blockHash !== undefined ? message.blockHash : new Uint8Array()));
    message.blockTimestamp !== undefined && (obj.blockTimestamp = Math.round(message.blockTimestamp));
    message.transactionHash !== undefined &&
      (obj.transactionHash = base64FromBytes(
        message.transactionHash !== undefined ? message.transactionHash : new Uint8Array(),
      ));
    message.logIndex !== undefined && (obj.logIndex = Math.round(message.logIndex));
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.signerEventBody !== undefined &&
      (obj.signerEventBody = message.signerEventBody ? SignerEventBody.toJSON(message.signerEventBody) : undefined);
    message.signerMigratedEventBody !== undefined && (obj.signerMigratedEventBody = message.signerMigratedEventBody
      ? SignerMigratedEventBody.toJSON(message.signerMigratedEventBody)
      : undefined);
    message.idRegisterEventBody !== undefined && (obj.idRegisterEventBody = message.idRegisterEventBody
      ? IdRegisterEventBody.toJSON(message.idRegisterEventBody)
      : undefined);
    message.storageRentEventBody !== undefined && (obj.storageRentEventBody = message.storageRentEventBody
      ? StorageRentEventBody.toJSON(message.storageRentEventBody)
      : undefined);
    message.tierPurchaseEventBody !== undefined && (obj.tierPurchaseEventBody = message.tierPurchaseEventBody
      ? TierPurchaseBody.toJSON(message.tierPurchaseEventBody)
      : undefined);
    message.channelRegisterEventBody !== undefined && (obj.channelRegisterEventBody = message.channelRegisterEventBody
      ? ChannelRegisterBody.toJSON(message.channelRegisterEventBody)
      : undefined);
    message.txIndex !== undefined && (obj.txIndex = Math.round(message.txIndex));
    message.version !== undefined && (obj.version = Math.round(message.version));
    return obj;
  },

  create<I extends Exact<DeepPartial<OnChainEvent>, I>>(base?: I): OnChainEvent {
    return OnChainEvent.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<OnChainEvent>, I>>(object: I): OnChainEvent {
    const message = createBaseOnChainEvent();
    message.type = object.type ?? 0;
    message.chainId = object.chainId ?? 0;
    message.blockNumber = object.blockNumber ?? 0;
    message.blockHash = object.blockHash ?? new Uint8Array();
    message.blockTimestamp = object.blockTimestamp ?? 0;
    message.transactionHash = object.transactionHash ?? new Uint8Array();
    message.logIndex = object.logIndex ?? 0;
    message.fid = object.fid ?? 0;
    message.signerEventBody = (object.signerEventBody !== undefined && object.signerEventBody !== null)
      ? SignerEventBody.fromPartial(object.signerEventBody)
      : undefined;
    message.signerMigratedEventBody =
      (object.signerMigratedEventBody !== undefined && object.signerMigratedEventBody !== null)
        ? SignerMigratedEventBody.fromPartial(object.signerMigratedEventBody)
        : undefined;
    message.idRegisterEventBody = (object.idRegisterEventBody !== undefined && object.idRegisterEventBody !== null)
      ? IdRegisterEventBody.fromPartial(object.idRegisterEventBody)
      : undefined;
    message.storageRentEventBody = (object.storageRentEventBody !== undefined && object.storageRentEventBody !== null)
      ? StorageRentEventBody.fromPartial(object.storageRentEventBody)
      : undefined;
    message.tierPurchaseEventBody =
      (object.tierPurchaseEventBody !== undefined && object.tierPurchaseEventBody !== null)
        ? TierPurchaseBody.fromPartial(object.tierPurchaseEventBody)
        : undefined;
    message.channelRegisterEventBody =
      (object.channelRegisterEventBody !== undefined && object.channelRegisterEventBody !== null)
        ? ChannelRegisterBody.fromPartial(object.channelRegisterEventBody)
        : undefined;
    message.txIndex = object.txIndex ?? 0;
    message.version = object.version ?? 0;
    return message;
  },
};

function createBaseChannelRegisterBody(): ChannelRegisterBody {
  return { channelKey: "", expiry: 0, ownerAddress: new Uint8Array(), eventType: 0, label: new Uint8Array() };
}

export const ChannelRegisterBody = {
  encode(message: ChannelRegisterBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.channelKey !== "") {
      writer.uint32(10).string(message.channelKey);
    }
    if (message.expiry !== 0) {
      writer.uint32(16).uint64(message.expiry);
    }
    if (message.ownerAddress.length !== 0) {
      writer.uint32(26).bytes(message.ownerAddress);
    }
    if (message.eventType !== 0) {
      writer.uint32(32).int32(message.eventType);
    }
    if (message.label.length !== 0) {
      writer.uint32(42).bytes(message.label);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelRegisterBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelRegisterBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.channelKey = reader.string();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.expiry = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.ownerAddress = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.eventType = reader.int32() as any;
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.label = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelRegisterBody {
    return {
      channelKey: isSet(object.channelKey) ? String(object.channelKey) : "",
      expiry: isSet(object.expiry) ? Number(object.expiry) : 0,
      ownerAddress: isSet(object.ownerAddress) ? bytesFromBase64(object.ownerAddress) : new Uint8Array(),
      eventType: isSet(object.eventType) ? channelRegisterEventTypeFromJSON(object.eventType) : 0,
      label: isSet(object.label) ? bytesFromBase64(object.label) : new Uint8Array(),
    };
  },

  toJSON(message: ChannelRegisterBody): unknown {
    const obj: any = {};
    message.channelKey !== undefined && (obj.channelKey = message.channelKey);
    message.expiry !== undefined && (obj.expiry = Math.round(message.expiry));
    message.ownerAddress !== undefined &&
      (obj.ownerAddress = base64FromBytes(
        message.ownerAddress !== undefined ? message.ownerAddress : new Uint8Array(),
      ));
    message.eventType !== undefined && (obj.eventType = channelRegisterEventTypeToJSON(message.eventType));
    message.label !== undefined &&
      (obj.label = base64FromBytes(message.label !== undefined ? message.label : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelRegisterBody>, I>>(base?: I): ChannelRegisterBody {
    return ChannelRegisterBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelRegisterBody>, I>>(object: I): ChannelRegisterBody {
    const message = createBaseChannelRegisterBody();
    message.channelKey = object.channelKey ?? "";
    message.expiry = object.expiry ?? 0;
    message.ownerAddress = object.ownerAddress ?? new Uint8Array();
    message.eventType = object.eventType ?? 0;
    message.label = object.label ?? new Uint8Array();
    return message;
  },
};

function createBaseTierPurchaseBody(): TierPurchaseBody {
  return { tierType: 0, forDays: 0, payer: new Uint8Array() };
}

export const TierPurchaseBody = {
  encode(message: TierPurchaseBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.tierType !== 0) {
      writer.uint32(8).int32(message.tierType);
    }
    if (message.forDays !== 0) {
      writer.uint32(16).uint64(message.forDays);
    }
    if (message.payer.length !== 0) {
      writer.uint32(26).bytes(message.payer);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TierPurchaseBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTierPurchaseBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.tierType = reader.int32() as any;
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.forDays = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.payer = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TierPurchaseBody {
    return {
      tierType: isSet(object.tierType) ? tierTypeFromJSON(object.tierType) : 0,
      forDays: isSet(object.forDays) ? Number(object.forDays) : 0,
      payer: isSet(object.payer) ? bytesFromBase64(object.payer) : new Uint8Array(),
    };
  },

  toJSON(message: TierPurchaseBody): unknown {
    const obj: any = {};
    message.tierType !== undefined && (obj.tierType = tierTypeToJSON(message.tierType));
    message.forDays !== undefined && (obj.forDays = Math.round(message.forDays));
    message.payer !== undefined &&
      (obj.payer = base64FromBytes(message.payer !== undefined ? message.payer : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<TierPurchaseBody>, I>>(base?: I): TierPurchaseBody {
    return TierPurchaseBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TierPurchaseBody>, I>>(object: I): TierPurchaseBody {
    const message = createBaseTierPurchaseBody();
    message.tierType = object.tierType ?? 0;
    message.forDays = object.forDays ?? 0;
    message.payer = object.payer ?? new Uint8Array();
    return message;
  },
};

function createBaseSignerEventBody(): SignerEventBody {
  return { key: new Uint8Array(), keyType: 0, eventType: 0, metadata: new Uint8Array(), metadataType: 0 };
}

export const SignerEventBody = {
  encode(message: SignerEventBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key.length !== 0) {
      writer.uint32(10).bytes(message.key);
    }
    if (message.keyType !== 0) {
      writer.uint32(16).uint32(message.keyType);
    }
    if (message.eventType !== 0) {
      writer.uint32(24).int32(message.eventType);
    }
    if (message.metadata.length !== 0) {
      writer.uint32(34).bytes(message.metadata);
    }
    if (message.metadataType !== 0) {
      writer.uint32(40).uint32(message.metadataType);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SignerEventBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignerEventBody();
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
          if (tag != 16) {
            break;
          }

          message.keyType = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.eventType = reader.int32() as any;
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.metadata = reader.bytes();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.metadataType = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SignerEventBody {
    return {
      key: isSet(object.key) ? bytesFromBase64(object.key) : new Uint8Array(),
      keyType: isSet(object.keyType) ? Number(object.keyType) : 0,
      eventType: isSet(object.eventType) ? signerEventTypeFromJSON(object.eventType) : 0,
      metadata: isSet(object.metadata) ? bytesFromBase64(object.metadata) : new Uint8Array(),
      metadataType: isSet(object.metadataType) ? Number(object.metadataType) : 0,
    };
  },

  toJSON(message: SignerEventBody): unknown {
    const obj: any = {};
    message.key !== undefined &&
      (obj.key = base64FromBytes(message.key !== undefined ? message.key : new Uint8Array()));
    message.keyType !== undefined && (obj.keyType = Math.round(message.keyType));
    message.eventType !== undefined && (obj.eventType = signerEventTypeToJSON(message.eventType));
    message.metadata !== undefined &&
      (obj.metadata = base64FromBytes(message.metadata !== undefined ? message.metadata : new Uint8Array()));
    message.metadataType !== undefined && (obj.metadataType = Math.round(message.metadataType));
    return obj;
  },

  create<I extends Exact<DeepPartial<SignerEventBody>, I>>(base?: I): SignerEventBody {
    return SignerEventBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SignerEventBody>, I>>(object: I): SignerEventBody {
    const message = createBaseSignerEventBody();
    message.key = object.key ?? new Uint8Array();
    message.keyType = object.keyType ?? 0;
    message.eventType = object.eventType ?? 0;
    message.metadata = object.metadata ?? new Uint8Array();
    message.metadataType = object.metadataType ?? 0;
    return message;
  },
};

function createBaseSignerMigratedEventBody(): SignerMigratedEventBody {
  return { migratedAt: 0 };
}

export const SignerMigratedEventBody = {
  encode(message: SignerMigratedEventBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.migratedAt !== 0) {
      writer.uint32(8).uint32(message.migratedAt);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SignerMigratedEventBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignerMigratedEventBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.migratedAt = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SignerMigratedEventBody {
    return { migratedAt: isSet(object.migratedAt) ? Number(object.migratedAt) : 0 };
  },

  toJSON(message: SignerMigratedEventBody): unknown {
    const obj: any = {};
    message.migratedAt !== undefined && (obj.migratedAt = Math.round(message.migratedAt));
    return obj;
  },

  create<I extends Exact<DeepPartial<SignerMigratedEventBody>, I>>(base?: I): SignerMigratedEventBody {
    return SignerMigratedEventBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SignerMigratedEventBody>, I>>(object: I): SignerMigratedEventBody {
    const message = createBaseSignerMigratedEventBody();
    message.migratedAt = object.migratedAt ?? 0;
    return message;
  },
};

function createBaseIdRegisterEventBody(): IdRegisterEventBody {
  return { to: new Uint8Array(), eventType: 0, from: new Uint8Array(), recoveryAddress: new Uint8Array() };
}

export const IdRegisterEventBody = {
  encode(message: IdRegisterEventBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.to.length !== 0) {
      writer.uint32(10).bytes(message.to);
    }
    if (message.eventType !== 0) {
      writer.uint32(16).int32(message.eventType);
    }
    if (message.from.length !== 0) {
      writer.uint32(26).bytes(message.from);
    }
    if (message.recoveryAddress.length !== 0) {
      writer.uint32(34).bytes(message.recoveryAddress);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): IdRegisterEventBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseIdRegisterEventBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.to = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.eventType = reader.int32() as any;
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.from = reader.bytes();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.recoveryAddress = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): IdRegisterEventBody {
    return {
      to: isSet(object.to) ? bytesFromBase64(object.to) : new Uint8Array(),
      eventType: isSet(object.eventType) ? idRegisterEventTypeFromJSON(object.eventType) : 0,
      from: isSet(object.from) ? bytesFromBase64(object.from) : new Uint8Array(),
      recoveryAddress: isSet(object.recoveryAddress) ? bytesFromBase64(object.recoveryAddress) : new Uint8Array(),
    };
  },

  toJSON(message: IdRegisterEventBody): unknown {
    const obj: any = {};
    message.to !== undefined && (obj.to = base64FromBytes(message.to !== undefined ? message.to : new Uint8Array()));
    message.eventType !== undefined && (obj.eventType = idRegisterEventTypeToJSON(message.eventType));
    message.from !== undefined &&
      (obj.from = base64FromBytes(message.from !== undefined ? message.from : new Uint8Array()));
    message.recoveryAddress !== undefined &&
      (obj.recoveryAddress = base64FromBytes(
        message.recoveryAddress !== undefined ? message.recoveryAddress : new Uint8Array(),
      ));
    return obj;
  },

  create<I extends Exact<DeepPartial<IdRegisterEventBody>, I>>(base?: I): IdRegisterEventBody {
    return IdRegisterEventBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<IdRegisterEventBody>, I>>(object: I): IdRegisterEventBody {
    const message = createBaseIdRegisterEventBody();
    message.to = object.to ?? new Uint8Array();
    message.eventType = object.eventType ?? 0;
    message.from = object.from ?? new Uint8Array();
    message.recoveryAddress = object.recoveryAddress ?? new Uint8Array();
    return message;
  },
};

function createBaseStorageRentEventBody(): StorageRentEventBody {
  return { payer: new Uint8Array(), units: 0, expiry: 0 };
}

export const StorageRentEventBody = {
  encode(message: StorageRentEventBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.payer.length !== 0) {
      writer.uint32(10).bytes(message.payer);
    }
    if (message.units !== 0) {
      writer.uint32(16).uint32(message.units);
    }
    if (message.expiry !== 0) {
      writer.uint32(24).uint32(message.expiry);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StorageRentEventBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStorageRentEventBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.payer = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.units = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.expiry = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): StorageRentEventBody {
    return {
      payer: isSet(object.payer) ? bytesFromBase64(object.payer) : new Uint8Array(),
      units: isSet(object.units) ? Number(object.units) : 0,
      expiry: isSet(object.expiry) ? Number(object.expiry) : 0,
    };
  },

  toJSON(message: StorageRentEventBody): unknown {
    const obj: any = {};
    message.payer !== undefined &&
      (obj.payer = base64FromBytes(message.payer !== undefined ? message.payer : new Uint8Array()));
    message.units !== undefined && (obj.units = Math.round(message.units));
    message.expiry !== undefined && (obj.expiry = Math.round(message.expiry));
    return obj;
  },

  create<I extends Exact<DeepPartial<StorageRentEventBody>, I>>(base?: I): StorageRentEventBody {
    return StorageRentEventBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<StorageRentEventBody>, I>>(object: I): StorageRentEventBody {
    const message = createBaseStorageRentEventBody();
    message.payer = object.payer ?? new Uint8Array();
    message.units = object.units ?? 0;
    message.expiry = object.expiry ?? 0;
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
