/* eslint-disable */
import Long from 'long';
import _m0 from 'protobufjs/minimal';
import { IdRegistryEvent } from './id_registry_event';
import { Message } from './message';
import { NameRegistryEvent } from './name_registry_event';
import { UserNameProof } from './username_proof';

export enum HubEventType {
  NONE = 0,
  MERGE_MESSAGE = 1,
  PRUNE_MESSAGE = 2,
  REVOKE_MESSAGE = 3,
  MERGE_ID_REGISTRY_EVENT = 4,
  MERGE_NAME_REGISTRY_EVENT = 5,
  MERGE_USERNAME_PROOF = 6,
}

export function hubEventTypeFromJSON(object: any): HubEventType {
  switch (object) {
    case 0:
    case 'HUB_EVENT_TYPE_NONE':
      return HubEventType.NONE;
    case 1:
    case 'HUB_EVENT_TYPE_MERGE_MESSAGE':
      return HubEventType.MERGE_MESSAGE;
    case 2:
    case 'HUB_EVENT_TYPE_PRUNE_MESSAGE':
      return HubEventType.PRUNE_MESSAGE;
    case 3:
    case 'HUB_EVENT_TYPE_REVOKE_MESSAGE':
      return HubEventType.REVOKE_MESSAGE;
    case 4:
    case 'HUB_EVENT_TYPE_MERGE_ID_REGISTRY_EVENT':
      return HubEventType.MERGE_ID_REGISTRY_EVENT;
    case 5:
    case 'HUB_EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT':
      return HubEventType.MERGE_NAME_REGISTRY_EVENT;
    case 6:
    case 'HUB_EVENT_TYPE_MERGE_USERNAME_PROOF':
      return HubEventType.MERGE_USERNAME_PROOF;
    default:
      throw new tsProtoGlobalThis.Error('Unrecognized enum value ' + object + ' for enum HubEventType');
  }
}

export function hubEventTypeToJSON(object: HubEventType): string {
  switch (object) {
    case HubEventType.NONE:
      return 'HUB_EVENT_TYPE_NONE';
    case HubEventType.MERGE_MESSAGE:
      return 'HUB_EVENT_TYPE_MERGE_MESSAGE';
    case HubEventType.PRUNE_MESSAGE:
      return 'HUB_EVENT_TYPE_PRUNE_MESSAGE';
    case HubEventType.REVOKE_MESSAGE:
      return 'HUB_EVENT_TYPE_REVOKE_MESSAGE';
    case HubEventType.MERGE_ID_REGISTRY_EVENT:
      return 'HUB_EVENT_TYPE_MERGE_ID_REGISTRY_EVENT';
    case HubEventType.MERGE_NAME_REGISTRY_EVENT:
      return 'HUB_EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT';
    case HubEventType.MERGE_USERNAME_PROOF:
      return 'HUB_EVENT_TYPE_MERGE_USERNAME_PROOF';
    default:
      throw new tsProtoGlobalThis.Error('Unrecognized enum value ' + object + ' for enum HubEventType');
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

export interface MergeIdRegistryEventBody {
  idRegistryEvent: IdRegistryEvent | undefined;
}

export interface MergeNameRegistryEventBody {
  nameRegistryEvent: NameRegistryEvent | undefined;
}

export interface MergeUserNameProofBody {
  usernameProof: UserNameProof | undefined;
}

export interface HubEvent {
  type: HubEventType;
  id: number;
  mergeMessageBody?: MergeMessageBody | undefined;
  pruneMessageBody?: PruneMessageBody | undefined;
  revokeMessageBody?: RevokeMessageBody | undefined;
  mergeIdRegistryEventBody?: MergeIdRegistryEventBody | undefined;
  mergeNameRegistryEventBody?: MergeNameRegistryEventBody | undefined;
  mergeUsernameProofBody?: MergeUserNameProofBody | undefined;
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
      obj.deletedMessages = message.deletedMessages.map((e) => (e ? Message.toJSON(e) : undefined));
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
    message.message =
      object.message !== undefined && object.message !== null ? Message.fromPartial(object.message) : undefined;
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
    message.message =
      object.message !== undefined && object.message !== null ? Message.fromPartial(object.message) : undefined;
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
    message.message =
      object.message !== undefined && object.message !== null ? Message.fromPartial(object.message) : undefined;
    return message;
  },
};

function createBaseMergeIdRegistryEventBody(): MergeIdRegistryEventBody {
  return { idRegistryEvent: undefined };
}

export const MergeIdRegistryEventBody = {
  encode(message: MergeIdRegistryEventBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.idRegistryEvent !== undefined) {
      IdRegistryEvent.encode(message.idRegistryEvent, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MergeIdRegistryEventBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMergeIdRegistryEventBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.idRegistryEvent = IdRegistryEvent.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MergeIdRegistryEventBody {
    return {
      idRegistryEvent: isSet(object.idRegistryEvent) ? IdRegistryEvent.fromJSON(object.idRegistryEvent) : undefined,
    };
  },

  toJSON(message: MergeIdRegistryEventBody): unknown {
    const obj: any = {};
    message.idRegistryEvent !== undefined &&
      (obj.idRegistryEvent = message.idRegistryEvent ? IdRegistryEvent.toJSON(message.idRegistryEvent) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<MergeIdRegistryEventBody>, I>>(base?: I): MergeIdRegistryEventBody {
    return MergeIdRegistryEventBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MergeIdRegistryEventBody>, I>>(object: I): MergeIdRegistryEventBody {
    const message = createBaseMergeIdRegistryEventBody();
    message.idRegistryEvent =
      object.idRegistryEvent !== undefined && object.idRegistryEvent !== null
        ? IdRegistryEvent.fromPartial(object.idRegistryEvent)
        : undefined;
    return message;
  },
};

function createBaseMergeNameRegistryEventBody(): MergeNameRegistryEventBody {
  return { nameRegistryEvent: undefined };
}

export const MergeNameRegistryEventBody = {
  encode(message: MergeNameRegistryEventBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.nameRegistryEvent !== undefined) {
      NameRegistryEvent.encode(message.nameRegistryEvent, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MergeNameRegistryEventBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMergeNameRegistryEventBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.nameRegistryEvent = NameRegistryEvent.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MergeNameRegistryEventBody {
    return {
      nameRegistryEvent: isSet(object.nameRegistryEvent)
        ? NameRegistryEvent.fromJSON(object.nameRegistryEvent)
        : undefined,
    };
  },

  toJSON(message: MergeNameRegistryEventBody): unknown {
    const obj: any = {};
    message.nameRegistryEvent !== undefined &&
      (obj.nameRegistryEvent = message.nameRegistryEvent
        ? NameRegistryEvent.toJSON(message.nameRegistryEvent)
        : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<MergeNameRegistryEventBody>, I>>(base?: I): MergeNameRegistryEventBody {
    return MergeNameRegistryEventBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MergeNameRegistryEventBody>, I>>(object: I): MergeNameRegistryEventBody {
    const message = createBaseMergeNameRegistryEventBody();
    message.nameRegistryEvent =
      object.nameRegistryEvent !== undefined && object.nameRegistryEvent !== null
        ? NameRegistryEvent.fromPartial(object.nameRegistryEvent)
        : undefined;
    return message;
  },
};

function createBaseMergeUserNameProofBody(): MergeUserNameProofBody {
  return { usernameProof: undefined };
}

export const MergeUserNameProofBody = {
  encode(message: MergeUserNameProofBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.usernameProof !== undefined) {
      UserNameProof.encode(message.usernameProof, writer.uint32(10).fork()).ldelim();
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
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MergeUserNameProofBody {
    return { usernameProof: isSet(object.usernameProof) ? UserNameProof.fromJSON(object.usernameProof) : undefined };
  },

  toJSON(message: MergeUserNameProofBody): unknown {
    const obj: any = {};
    message.usernameProof !== undefined &&
      (obj.usernameProof = message.usernameProof ? UserNameProof.toJSON(message.usernameProof) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<MergeUserNameProofBody>, I>>(base?: I): MergeUserNameProofBody {
    return MergeUserNameProofBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MergeUserNameProofBody>, I>>(object: I): MergeUserNameProofBody {
    const message = createBaseMergeUserNameProofBody();
    message.usernameProof =
      object.usernameProof !== undefined && object.usernameProof !== null
        ? UserNameProof.fromPartial(object.usernameProof)
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
    mergeIdRegistryEventBody: undefined,
    mergeNameRegistryEventBody: undefined,
    mergeUsernameProofBody: undefined,
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
    if (message.mergeIdRegistryEventBody !== undefined) {
      MergeIdRegistryEventBody.encode(message.mergeIdRegistryEventBody, writer.uint32(50).fork()).ldelim();
    }
    if (message.mergeNameRegistryEventBody !== undefined) {
      MergeNameRegistryEventBody.encode(message.mergeNameRegistryEventBody, writer.uint32(58).fork()).ldelim();
    }
    if (message.mergeUsernameProofBody !== undefined) {
      MergeUserNameProofBody.encode(message.mergeUsernameProofBody, writer.uint32(66).fork()).ldelim();
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
        case 6:
          if (tag != 50) {
            break;
          }

          message.mergeIdRegistryEventBody = MergeIdRegistryEventBody.decode(reader, reader.uint32());
          continue;
        case 7:
          if (tag != 58) {
            break;
          }

          message.mergeNameRegistryEventBody = MergeNameRegistryEventBody.decode(reader, reader.uint32());
          continue;
        case 8:
          if (tag != 66) {
            break;
          }

          message.mergeUsernameProofBody = MergeUserNameProofBody.decode(reader, reader.uint32());
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
      mergeIdRegistryEventBody: isSet(object.mergeIdRegistryEventBody)
        ? MergeIdRegistryEventBody.fromJSON(object.mergeIdRegistryEventBody)
        : undefined,
      mergeNameRegistryEventBody: isSet(object.mergeNameRegistryEventBody)
        ? MergeNameRegistryEventBody.fromJSON(object.mergeNameRegistryEventBody)
        : undefined,
      mergeUsernameProofBody: isSet(object.mergeUsernameProofBody)
        ? MergeUserNameProofBody.fromJSON(object.mergeUsernameProofBody)
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
    message.revokeMessageBody !== undefined &&
      (obj.revokeMessageBody = message.revokeMessageBody
        ? RevokeMessageBody.toJSON(message.revokeMessageBody)
        : undefined);
    message.mergeIdRegistryEventBody !== undefined &&
      (obj.mergeIdRegistryEventBody = message.mergeIdRegistryEventBody
        ? MergeIdRegistryEventBody.toJSON(message.mergeIdRegistryEventBody)
        : undefined);
    message.mergeNameRegistryEventBody !== undefined &&
      (obj.mergeNameRegistryEventBody = message.mergeNameRegistryEventBody
        ? MergeNameRegistryEventBody.toJSON(message.mergeNameRegistryEventBody)
        : undefined);
    message.mergeUsernameProofBody !== undefined &&
      (obj.mergeUsernameProofBody = message.mergeUsernameProofBody
        ? MergeUserNameProofBody.toJSON(message.mergeUsernameProofBody)
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
    message.mergeMessageBody =
      object.mergeMessageBody !== undefined && object.mergeMessageBody !== null
        ? MergeMessageBody.fromPartial(object.mergeMessageBody)
        : undefined;
    message.pruneMessageBody =
      object.pruneMessageBody !== undefined && object.pruneMessageBody !== null
        ? PruneMessageBody.fromPartial(object.pruneMessageBody)
        : undefined;
    message.revokeMessageBody =
      object.revokeMessageBody !== undefined && object.revokeMessageBody !== null
        ? RevokeMessageBody.fromPartial(object.revokeMessageBody)
        : undefined;
    message.mergeIdRegistryEventBody =
      object.mergeIdRegistryEventBody !== undefined && object.mergeIdRegistryEventBody !== null
        ? MergeIdRegistryEventBody.fromPartial(object.mergeIdRegistryEventBody)
        : undefined;
    message.mergeNameRegistryEventBody =
      object.mergeNameRegistryEventBody !== undefined && object.mergeNameRegistryEventBody !== null
        ? MergeNameRegistryEventBody.fromPartial(object.mergeNameRegistryEventBody)
        : undefined;
    message.mergeUsernameProofBody =
      object.mergeUsernameProofBody !== undefined && object.mergeUsernameProofBody !== null
        ? MergeUserNameProofBody.fromPartial(object.mergeUsernameProofBody)
        : undefined;
    return message;
  },
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw 'Unable to locate global object';
})();

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

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new tsProtoGlobalThis.Error('Value is larger than Number.MAX_SAFE_INTEGER');
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
