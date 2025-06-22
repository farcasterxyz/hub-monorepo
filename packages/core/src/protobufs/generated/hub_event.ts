/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { Message } from "./message";
import { OnChainEvent } from "./onchain_event";
import { UserNameProof } from "./username_proof";

export enum HubEventType {
  NONE = 0,
  MERGE_MESSAGE = 1,
  PRUNE_MESSAGE = 2,
  REVOKE_MESSAGE = 3,
  /**
   * MERGE_USERNAME_PROOF - Deprecated
   *  HUB_EVENT_TYPE_MERGE_ID_REGISTRY_EVENT = 4;
   *  HUB_EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT = 5;
   */
  MERGE_USERNAME_PROOF = 6,
  /**
   * MERGE_ON_CHAIN_EVENT - Deprecated
   *  HUB_EVENT_TYPE_MERGE_RENT_REGISTRY_EVENT = 7;
   *  HUB_EVENT_TYPE_MERGE_STORAGE_ADMIN_REGISTRY_EVENT = 8;
   */
  MERGE_ON_CHAIN_EVENT = 9,
  MERGE_FAILURE = 10,
  BLOCK_CONFIRMED = 11,
}

export function hubEventTypeFromJSON(object: any): HubEventType {
  switch (object) {
    case 0:
    case "HUB_EVENT_TYPE_NONE":
      return HubEventType.NONE;
    case 1:
    case "HUB_EVENT_TYPE_MERGE_MESSAGE":
      return HubEventType.MERGE_MESSAGE;
    case 2:
    case "HUB_EVENT_TYPE_PRUNE_MESSAGE":
      return HubEventType.PRUNE_MESSAGE;
    case 3:
    case "HUB_EVENT_TYPE_REVOKE_MESSAGE":
      return HubEventType.REVOKE_MESSAGE;
    case 6:
    case "HUB_EVENT_TYPE_MERGE_USERNAME_PROOF":
      return HubEventType.MERGE_USERNAME_PROOF;
    case 9:
    case "HUB_EVENT_TYPE_MERGE_ON_CHAIN_EVENT":
      return HubEventType.MERGE_ON_CHAIN_EVENT;
    case 10:
    case "HUB_EVENT_TYPE_MERGE_FAILURE":
      return HubEventType.MERGE_FAILURE;
    case 11:
    case "HUB_EVENT_TYPE_BLOCK_CONFIRMED":
      return HubEventType.BLOCK_CONFIRMED;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum HubEventType");
  }
}

export function hubEventTypeToJSON(object: HubEventType): string {
  switch (object) {
    case HubEventType.NONE:
      return "HUB_EVENT_TYPE_NONE";
    case HubEventType.MERGE_MESSAGE:
      return "HUB_EVENT_TYPE_MERGE_MESSAGE";
    case HubEventType.PRUNE_MESSAGE:
      return "HUB_EVENT_TYPE_PRUNE_MESSAGE";
    case HubEventType.REVOKE_MESSAGE:
      return "HUB_EVENT_TYPE_REVOKE_MESSAGE";
    case HubEventType.MERGE_USERNAME_PROOF:
      return "HUB_EVENT_TYPE_MERGE_USERNAME_PROOF";
    case HubEventType.MERGE_ON_CHAIN_EVENT:
      return "HUB_EVENT_TYPE_MERGE_ON_CHAIN_EVENT";
    case HubEventType.MERGE_FAILURE:
      return "HUB_EVENT_TYPE_MERGE_FAILURE";
    case HubEventType.BLOCK_CONFIRMED:
      return "HUB_EVENT_TYPE_BLOCK_CONFIRMED";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum HubEventType");
  }
}

export interface MergeMessageBody {
  message: Message | undefined;
  deletedMessages: Message[];
}

export interface MergeFailureBody {
  message: Message | undefined;
  code: string;
  reason: string;
}

export interface PruneMessageBody {
  message: Message | undefined;
}

export interface RevokeMessageBody {
  message: Message | undefined;
}

export interface BlockConfirmedBody {
  blockNumber: number;
  shardIndex: number;
  timestamp: number;
  blockHash: Uint8Array;
  totalEvents: number;
}

export interface MergeOnChainEventBody {
  onChainEvent: OnChainEvent | undefined;
}

export interface MergeUserNameProofBody {
  usernameProof: UserNameProof | undefined;
  deletedUsernameProof: UserNameProof | undefined;
  usernameProofMessage: Message | undefined;
  deletedUsernameProofMessage: Message | undefined;
}

export interface HubEvent {
  type: HubEventType;
  id: number;
  mergeMessageBody?: MergeMessageBody | undefined;
  pruneMessageBody?: PruneMessageBody | undefined;
  revokeMessageBody?:
    | RevokeMessageBody
    | undefined;
  /**
   * Deprecated
   *    MergeIdRegistryEventBody merge_id_registry_event_body = 6;
   *    MergeNameRegistryEventBody merge_name_registry_event_body = 7;
   */
  mergeUsernameProofBody?:
    | MergeUserNameProofBody
    | undefined;
  /**
   * Deprecated
   *    MergeRentRegistryEventBody merge_rent_registry_event_body = 9;
   *    MergeStorageAdminRegistryEventBody merge_storage_admin_registry_event_body = 10;
   */
  mergeOnChainEventBody?: MergeOnChainEventBody | undefined;
  mergeFailure?: MergeFailureBody | undefined;
  blockConfirmedBody?: BlockConfirmedBody | undefined;
  blockNumber: number;
  shardIndex: number;
  timestamp: number;
}

function createBaseMergeMessageBody(): MergeMessageBody {
  return { message: undefined, deletedMessages: [] };
}

export const MergeMessageBody = {
  encode(message: MergeMessageBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.message !== undefined) {
      Message.encode(message.message, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.deletedMessages) {
      Message.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MergeMessageBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMergeMessageBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.message = Message.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.deletedMessages.push(Message.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MergeMessageBody {
    return {
      message: isSet(object.message) ? Message.fromJSON(object.message) : undefined,
      deletedMessages: Array.isArray(object?.deletedMessages)
        ? object.deletedMessages.map((e: any) => Message.fromJSON(e))
        : [],
    };
  },

  toJSON(message: MergeMessageBody): unknown {
    const obj: any = {};
    message.message !== undefined && (obj.message = message.message ? Message.toJSON(message.message) : undefined);
    if (message.deletedMessages) {
      obj.deletedMessages = message.deletedMessages.map((e) => e ? Message.toJSON(e) : undefined);
    } else {
      obj.deletedMessages = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<MergeMessageBody>, I>>(base?: I): MergeMessageBody {
    return MergeMessageBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MergeMessageBody>, I>>(object: I): MergeMessageBody {
    const message = createBaseMergeMessageBody();
    message.message = (object.message !== undefined && object.message !== null)
      ? Message.fromPartial(object.message)
      : undefined;
    message.deletedMessages = object.deletedMessages?.map((e) => Message.fromPartial(e)) || [];
    return message;
  },
};

function createBaseMergeFailureBody(): MergeFailureBody {
  return { message: undefined, code: "", reason: "" };
}

export const MergeFailureBody = {
  encode(message: MergeFailureBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.message !== undefined) {
      Message.encode(message.message, writer.uint32(10).fork()).ldelim();
    }
    if (message.code !== "") {
      writer.uint32(18).string(message.code);
    }
    if (message.reason !== "") {
      writer.uint32(26).string(message.reason);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MergeFailureBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMergeFailureBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.message = Message.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.code = reader.string();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.reason = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MergeFailureBody {
    return {
      message: isSet(object.message) ? Message.fromJSON(object.message) : undefined,
      code: isSet(object.code) ? String(object.code) : "",
      reason: isSet(object.reason) ? String(object.reason) : "",
    };
  },

  toJSON(message: MergeFailureBody): unknown {
    const obj: any = {};
    message.message !== undefined && (obj.message = message.message ? Message.toJSON(message.message) : undefined);
    message.code !== undefined && (obj.code = message.code);
    message.reason !== undefined && (obj.reason = message.reason);
    return obj;
  },

  create<I extends Exact<DeepPartial<MergeFailureBody>, I>>(base?: I): MergeFailureBody {
    return MergeFailureBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MergeFailureBody>, I>>(object: I): MergeFailureBody {
    const message = createBaseMergeFailureBody();
    message.message = (object.message !== undefined && object.message !== null)
      ? Message.fromPartial(object.message)
      : undefined;
    message.code = object.code ?? "";
    message.reason = object.reason ?? "";
    return message;
  },
};

function createBasePruneMessageBody(): PruneMessageBody {
  return { message: undefined };
}

export const PruneMessageBody = {
  encode(message: PruneMessageBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.message !== undefined) {
      Message.encode(message.message, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PruneMessageBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePruneMessageBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.message = Message.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): PruneMessageBody {
    return { message: isSet(object.message) ? Message.fromJSON(object.message) : undefined };
  },

  toJSON(message: PruneMessageBody): unknown {
    const obj: any = {};
    message.message !== undefined && (obj.message = message.message ? Message.toJSON(message.message) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<PruneMessageBody>, I>>(base?: I): PruneMessageBody {
    return PruneMessageBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<PruneMessageBody>, I>>(object: I): PruneMessageBody {
    const message = createBasePruneMessageBody();
    message.message = (object.message !== undefined && object.message !== null)
      ? Message.fromPartial(object.message)
      : undefined;
    return message;
  },
};

function createBaseRevokeMessageBody(): RevokeMessageBody {
  return { message: undefined };
}

export const RevokeMessageBody = {
  encode(message: RevokeMessageBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.message !== undefined) {
      Message.encode(message.message, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RevokeMessageBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRevokeMessageBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.message = Message.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): RevokeMessageBody {
    return { message: isSet(object.message) ? Message.fromJSON(object.message) : undefined };
  },

  toJSON(message: RevokeMessageBody): unknown {
    const obj: any = {};
    message.message !== undefined && (obj.message = message.message ? Message.toJSON(message.message) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<RevokeMessageBody>, I>>(base?: I): RevokeMessageBody {
    return RevokeMessageBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<RevokeMessageBody>, I>>(object: I): RevokeMessageBody {
    const message = createBaseRevokeMessageBody();
    message.message = (object.message !== undefined && object.message !== null)
      ? Message.fromPartial(object.message)
      : undefined;
    return message;
  },
};

function createBaseBlockConfirmedBody(): BlockConfirmedBody {
  return { blockNumber: 0, shardIndex: 0, timestamp: 0, blockHash: new Uint8Array(), totalEvents: 0 };
}

export const BlockConfirmedBody = {
  encode(message: BlockConfirmedBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.blockNumber !== 0) {
      writer.uint32(8).uint64(message.blockNumber);
    }
    if (message.shardIndex !== 0) {
      writer.uint32(16).uint32(message.shardIndex);
    }
    if (message.timestamp !== 0) {
      writer.uint32(24).uint64(message.timestamp);
    }
    if (message.blockHash.length !== 0) {
      writer.uint32(34).bytes(message.blockHash);
    }
    if (message.totalEvents !== 0) {
      writer.uint32(40).uint64(message.totalEvents);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BlockConfirmedBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBlockConfirmedBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.blockNumber = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.shardIndex = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.timestamp = longToNumber(reader.uint64() as Long);
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

          message.totalEvents = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BlockConfirmedBody {
    return {
      blockNumber: isSet(object.blockNumber) ? Number(object.blockNumber) : 0,
      shardIndex: isSet(object.shardIndex) ? Number(object.shardIndex) : 0,
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      blockHash: isSet(object.blockHash) ? bytesFromBase64(object.blockHash) : new Uint8Array(),
      totalEvents: isSet(object.totalEvents) ? Number(object.totalEvents) : 0,
    };
  },

  toJSON(message: BlockConfirmedBody): unknown {
    const obj: any = {};
    message.blockNumber !== undefined && (obj.blockNumber = Math.round(message.blockNumber));
    message.shardIndex !== undefined && (obj.shardIndex = Math.round(message.shardIndex));
    message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
    message.blockHash !== undefined &&
      (obj.blockHash = base64FromBytes(message.blockHash !== undefined ? message.blockHash : new Uint8Array()));
    message.totalEvents !== undefined && (obj.totalEvents = Math.round(message.totalEvents));
    return obj;
  },

  create<I extends Exact<DeepPartial<BlockConfirmedBody>, I>>(base?: I): BlockConfirmedBody {
    return BlockConfirmedBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<BlockConfirmedBody>, I>>(object: I): BlockConfirmedBody {
    const message = createBaseBlockConfirmedBody();
    message.blockNumber = object.blockNumber ?? 0;
    message.shardIndex = object.shardIndex ?? 0;
    message.timestamp = object.timestamp ?? 0;
    message.blockHash = object.blockHash ?? new Uint8Array();
    message.totalEvents = object.totalEvents ?? 0;
    return message;
  },
};

function createBaseMergeOnChainEventBody(): MergeOnChainEventBody {
  return { onChainEvent: undefined };
}

export const MergeOnChainEventBody = {
  encode(message: MergeOnChainEventBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.onChainEvent !== undefined) {
      OnChainEvent.encode(message.onChainEvent, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MergeOnChainEventBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMergeOnChainEventBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.onChainEvent = OnChainEvent.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MergeOnChainEventBody {
    return { onChainEvent: isSet(object.onChainEvent) ? OnChainEvent.fromJSON(object.onChainEvent) : undefined };
  },

  toJSON(message: MergeOnChainEventBody): unknown {
    const obj: any = {};
    message.onChainEvent !== undefined &&
      (obj.onChainEvent = message.onChainEvent ? OnChainEvent.toJSON(message.onChainEvent) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<MergeOnChainEventBody>, I>>(base?: I): MergeOnChainEventBody {
    return MergeOnChainEventBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MergeOnChainEventBody>, I>>(object: I): MergeOnChainEventBody {
    const message = createBaseMergeOnChainEventBody();
    message.onChainEvent = (object.onChainEvent !== undefined && object.onChainEvent !== null)
      ? OnChainEvent.fromPartial(object.onChainEvent)
      : undefined;
    return message;
  },
};

function createBaseMergeUserNameProofBody(): MergeUserNameProofBody {
  return {
    usernameProof: undefined,
    deletedUsernameProof: undefined,
    usernameProofMessage: undefined,
    deletedUsernameProofMessage: undefined,
  };
}

export const MergeUserNameProofBody = {
  encode(message: MergeUserNameProofBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.usernameProof !== undefined) {
      UserNameProof.encode(message.usernameProof, writer.uint32(10).fork()).ldelim();
    }
    if (message.deletedUsernameProof !== undefined) {
      UserNameProof.encode(message.deletedUsernameProof, writer.uint32(18).fork()).ldelim();
    }
    if (message.usernameProofMessage !== undefined) {
      Message.encode(message.usernameProofMessage, writer.uint32(26).fork()).ldelim();
    }
    if (message.deletedUsernameProofMessage !== undefined) {
      Message.encode(message.deletedUsernameProofMessage, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MergeUserNameProofBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMergeUserNameProofBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.usernameProof = UserNameProof.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.deletedUsernameProof = UserNameProof.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.usernameProofMessage = Message.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.deletedUsernameProofMessage = Message.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MergeUserNameProofBody {
    return {
      usernameProof: isSet(object.usernameProof) ? UserNameProof.fromJSON(object.usernameProof) : undefined,
      deletedUsernameProof: isSet(object.deletedUsernameProof)
        ? UserNameProof.fromJSON(object.deletedUsernameProof)
        : undefined,
      usernameProofMessage: isSet(object.usernameProofMessage)
        ? Message.fromJSON(object.usernameProofMessage)
        : undefined,
      deletedUsernameProofMessage: isSet(object.deletedUsernameProofMessage)
        ? Message.fromJSON(object.deletedUsernameProofMessage)
        : undefined,
    };
  },

  toJSON(message: MergeUserNameProofBody): unknown {
    const obj: any = {};
    message.usernameProof !== undefined &&
      (obj.usernameProof = message.usernameProof ? UserNameProof.toJSON(message.usernameProof) : undefined);
    message.deletedUsernameProof !== undefined && (obj.deletedUsernameProof = message.deletedUsernameProof
      ? UserNameProof.toJSON(message.deletedUsernameProof)
      : undefined);
    message.usernameProofMessage !== undefined && (obj.usernameProofMessage = message.usernameProofMessage
      ? Message.toJSON(message.usernameProofMessage)
      : undefined);
    message.deletedUsernameProofMessage !== undefined &&
      (obj.deletedUsernameProofMessage = message.deletedUsernameProofMessage
        ? Message.toJSON(message.deletedUsernameProofMessage)
        : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<MergeUserNameProofBody>, I>>(base?: I): MergeUserNameProofBody {
    return MergeUserNameProofBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MergeUserNameProofBody>, I>>(object: I): MergeUserNameProofBody {
    const message = createBaseMergeUserNameProofBody();
    message.usernameProof = (object.usernameProof !== undefined && object.usernameProof !== null)
      ? UserNameProof.fromPartial(object.usernameProof)
      : undefined;
    message.deletedUsernameProof = (object.deletedUsernameProof !== undefined && object.deletedUsernameProof !== null)
      ? UserNameProof.fromPartial(object.deletedUsernameProof)
      : undefined;
    message.usernameProofMessage = (object.usernameProofMessage !== undefined && object.usernameProofMessage !== null)
      ? Message.fromPartial(object.usernameProofMessage)
      : undefined;
    message.deletedUsernameProofMessage =
      (object.deletedUsernameProofMessage !== undefined && object.deletedUsernameProofMessage !== null)
        ? Message.fromPartial(object.deletedUsernameProofMessage)
        : undefined;
    return message;
  },
};

function createBaseHubEvent(): HubEvent {
  return {
    type: 0,
    id: 0,
    mergeMessageBody: undefined,
    pruneMessageBody: undefined,
    revokeMessageBody: undefined,
    mergeUsernameProofBody: undefined,
    mergeOnChainEventBody: undefined,
    mergeFailure: undefined,
    blockConfirmedBody: undefined,
    blockNumber: 0,
    shardIndex: 0,
    timestamp: 0,
  };
}

export const HubEvent = {
  encode(message: HubEvent, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== 0) {
      writer.uint32(8).int32(message.type);
    }
    if (message.id !== 0) {
      writer.uint32(16).uint64(message.id);
    }
    if (message.mergeMessageBody !== undefined) {
      MergeMessageBody.encode(message.mergeMessageBody, writer.uint32(26).fork()).ldelim();
    }
    if (message.pruneMessageBody !== undefined) {
      PruneMessageBody.encode(message.pruneMessageBody, writer.uint32(34).fork()).ldelim();
    }
    if (message.revokeMessageBody !== undefined) {
      RevokeMessageBody.encode(message.revokeMessageBody, writer.uint32(42).fork()).ldelim();
    }
    if (message.mergeUsernameProofBody !== undefined) {
      MergeUserNameProofBody.encode(message.mergeUsernameProofBody, writer.uint32(66).fork()).ldelim();
    }
    if (message.mergeOnChainEventBody !== undefined) {
      MergeOnChainEventBody.encode(message.mergeOnChainEventBody, writer.uint32(90).fork()).ldelim();
    }
    if (message.mergeFailure !== undefined) {
      MergeFailureBody.encode(message.mergeFailure, writer.uint32(106).fork()).ldelim();
    }
    if (message.blockConfirmedBody !== undefined) {
      BlockConfirmedBody.encode(message.blockConfirmedBody, writer.uint32(130).fork()).ldelim();
    }
    if (message.blockNumber !== 0) {
      writer.uint32(96).uint64(message.blockNumber);
    }
    if (message.shardIndex !== 0) {
      writer.uint32(112).uint32(message.shardIndex);
    }
    if (message.timestamp !== 0) {
      writer.uint32(120).uint64(message.timestamp);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): HubEvent {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHubEvent();
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

          message.id = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.mergeMessageBody = MergeMessageBody.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.pruneMessageBody = PruneMessageBody.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.revokeMessageBody = RevokeMessageBody.decode(reader, reader.uint32());
          continue;
        case 8:
          if (tag != 66) {
            break;
          }

          message.mergeUsernameProofBody = MergeUserNameProofBody.decode(reader, reader.uint32());
          continue;
        case 11:
          if (tag != 90) {
            break;
          }

          message.mergeOnChainEventBody = MergeOnChainEventBody.decode(reader, reader.uint32());
          continue;
        case 13:
          if (tag != 106) {
            break;
          }

          message.mergeFailure = MergeFailureBody.decode(reader, reader.uint32());
          continue;
        case 16:
          if (tag != 130) {
            break;
          }

          message.blockConfirmedBody = BlockConfirmedBody.decode(reader, reader.uint32());
          continue;
        case 12:
          if (tag != 96) {
            break;
          }

          message.blockNumber = longToNumber(reader.uint64() as Long);
          continue;
        case 14:
          if (tag != 112) {
            break;
          }

          message.shardIndex = reader.uint32();
          continue;
        case 15:
          if (tag != 120) {
            break;
          }

          message.timestamp = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): HubEvent {
    return {
      type: isSet(object.type) ? hubEventTypeFromJSON(object.type) : 0,
      id: isSet(object.id) ? Number(object.id) : 0,
      mergeMessageBody: isSet(object.mergeMessageBody) ? MergeMessageBody.fromJSON(object.mergeMessageBody) : undefined,
      pruneMessageBody: isSet(object.pruneMessageBody) ? PruneMessageBody.fromJSON(object.pruneMessageBody) : undefined,
      revokeMessageBody: isSet(object.revokeMessageBody)
        ? RevokeMessageBody.fromJSON(object.revokeMessageBody)
        : undefined,
      mergeUsernameProofBody: isSet(object.mergeUsernameProofBody)
        ? MergeUserNameProofBody.fromJSON(object.mergeUsernameProofBody)
        : undefined,
      mergeOnChainEventBody: isSet(object.mergeOnChainEventBody)
        ? MergeOnChainEventBody.fromJSON(object.mergeOnChainEventBody)
        : undefined,
      mergeFailure: isSet(object.mergeFailure) ? MergeFailureBody.fromJSON(object.mergeFailure) : undefined,
      blockConfirmedBody: isSet(object.blockConfirmedBody)
        ? BlockConfirmedBody.fromJSON(object.blockConfirmedBody)
        : undefined,
      blockNumber: isSet(object.blockNumber) ? Number(object.blockNumber) : 0,
      shardIndex: isSet(object.shardIndex) ? Number(object.shardIndex) : 0,
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
    };
  },

  toJSON(message: HubEvent): unknown {
    const obj: any = {};
    message.type !== undefined && (obj.type = hubEventTypeToJSON(message.type));
    message.id !== undefined && (obj.id = Math.round(message.id));
    message.mergeMessageBody !== undefined &&
      (obj.mergeMessageBody = message.mergeMessageBody ? MergeMessageBody.toJSON(message.mergeMessageBody) : undefined);
    message.pruneMessageBody !== undefined &&
      (obj.pruneMessageBody = message.pruneMessageBody ? PruneMessageBody.toJSON(message.pruneMessageBody) : undefined);
    message.revokeMessageBody !== undefined && (obj.revokeMessageBody = message.revokeMessageBody
      ? RevokeMessageBody.toJSON(message.revokeMessageBody)
      : undefined);
    message.mergeUsernameProofBody !== undefined && (obj.mergeUsernameProofBody = message.mergeUsernameProofBody
      ? MergeUserNameProofBody.toJSON(message.mergeUsernameProofBody)
      : undefined);
    message.mergeOnChainEventBody !== undefined && (obj.mergeOnChainEventBody = message.mergeOnChainEventBody
      ? MergeOnChainEventBody.toJSON(message.mergeOnChainEventBody)
      : undefined);
    message.mergeFailure !== undefined &&
      (obj.mergeFailure = message.mergeFailure ? MergeFailureBody.toJSON(message.mergeFailure) : undefined);
    message.blockConfirmedBody !== undefined && (obj.blockConfirmedBody = message.blockConfirmedBody
      ? BlockConfirmedBody.toJSON(message.blockConfirmedBody)
      : undefined);
    message.blockNumber !== undefined && (obj.blockNumber = Math.round(message.blockNumber));
    message.shardIndex !== undefined && (obj.shardIndex = Math.round(message.shardIndex));
    message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
    return obj;
  },

  create<I extends Exact<DeepPartial<HubEvent>, I>>(base?: I): HubEvent {
    return HubEvent.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<HubEvent>, I>>(object: I): HubEvent {
    const message = createBaseHubEvent();
    message.type = object.type ?? 0;
    message.id = object.id ?? 0;
    message.mergeMessageBody = (object.mergeMessageBody !== undefined && object.mergeMessageBody !== null)
      ? MergeMessageBody.fromPartial(object.mergeMessageBody)
      : undefined;
    message.pruneMessageBody = (object.pruneMessageBody !== undefined && object.pruneMessageBody !== null)
      ? PruneMessageBody.fromPartial(object.pruneMessageBody)
      : undefined;
    message.revokeMessageBody = (object.revokeMessageBody !== undefined && object.revokeMessageBody !== null)
      ? RevokeMessageBody.fromPartial(object.revokeMessageBody)
      : undefined;
    message.mergeUsernameProofBody =
      (object.mergeUsernameProofBody !== undefined && object.mergeUsernameProofBody !== null)
        ? MergeUserNameProofBody.fromPartial(object.mergeUsernameProofBody)
        : undefined;
    message.mergeOnChainEventBody =
      (object.mergeOnChainEventBody !== undefined && object.mergeOnChainEventBody !== null)
        ? MergeOnChainEventBody.fromPartial(object.mergeOnChainEventBody)
        : undefined;
    message.mergeFailure = (object.mergeFailure !== undefined && object.mergeFailure !== null)
      ? MergeFailureBody.fromPartial(object.mergeFailure)
      : undefined;
    message.blockConfirmedBody = (object.blockConfirmedBody !== undefined && object.blockConfirmedBody !== null)
      ? BlockConfirmedBody.fromPartial(object.blockConfirmedBody)
      : undefined;
    message.blockNumber = object.blockNumber ?? 0;
    message.shardIndex = object.shardIndex ?? 0;
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
