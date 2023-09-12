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
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum HubEventType");
  }
}

export interface MergeMessageBody {
  message: Message | undefined;
  deletedMessages: Message[];
}

export interface PruneMessageBody {
  message: Message | undefined;
}

export interface RevokeMessageBody {
  message: Message | undefined;
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
