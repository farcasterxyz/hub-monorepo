/* eslint-disable */
import { grpc } from '@improbable-eng/grpc-web';
import { BrowserHeaders } from 'browser-headers';
import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';
import { HubEvent } from './hub_event';
import { IdRegistryEvent } from './id_registry_event';
import { CastId, Message } from './message';
import { NameRegistryEvent } from './name_registry_event';
import {
  CastsByParentRequest,
  Empty,
  EventRequest,
  FidRequest,
  FidsRequest,
  FidsResponse,
  HubInfoResponse,
  IdRegistryEventByAddressRequest,
  IdRegistryEventRequest,
  MessagesResponse,
  NameRegistryEventRequest,
  ReactionRequest,
  ReactionsByCastRequest,
  ReactionsByFidRequest,
  SignerRequest,
  SubscribeRequest,
  SyncIds,
  TrieNodeMetadataResponse,
  TrieNodePrefix,
  TrieNodeSnapshotResponse,
  UserDataRequest,
  VerificationRequest,
} from './request_response';

export interface HubService {
  /** Submit Methods */
  SubmitMessage(request: DeepPartial<Message>, metadata?: grpc.Metadata): Promise<Message>;
  /** Event Methods */
  Subscribe(request: DeepPartial<SubscribeRequest>, metadata?: grpc.Metadata): Observable<HubEvent>;
  GetEvent(request: DeepPartial<EventRequest>, metadata?: grpc.Metadata): Promise<HubEvent>;
  /** Casts */
  GetCast(request: DeepPartial<CastId>, metadata?: grpc.Metadata): Promise<Message>;
  GetCastsByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetCastsByParent(request: DeepPartial<CastsByParentRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetCastsByMention(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  /** Reactions */
  GetReaction(request: DeepPartial<ReactionRequest>, metadata?: grpc.Metadata): Promise<Message>;
  GetReactionsByFid(request: DeepPartial<ReactionsByFidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetReactionsByCast(request: DeepPartial<ReactionsByCastRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  /** User Data */
  GetUserData(request: DeepPartial<UserDataRequest>, metadata?: grpc.Metadata): Promise<Message>;
  GetUserDataByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetNameRegistryEvent(
    request: DeepPartial<NameRegistryEventRequest>,
    metadata?: grpc.Metadata
  ): Promise<NameRegistryEvent>;
  /** Verifications */
  GetVerification(request: DeepPartial<VerificationRequest>, metadata?: grpc.Metadata): Promise<Message>;
  GetVerificationsByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  /** Signer */
  GetSigner(request: DeepPartial<SignerRequest>, metadata?: grpc.Metadata): Promise<Message>;
  GetSignersByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetIdRegistryEvent(request: DeepPartial<IdRegistryEventRequest>, metadata?: grpc.Metadata): Promise<IdRegistryEvent>;
  GetIdRegistryEventByAddress(
    request: DeepPartial<IdRegistryEventByAddressRequest>,
    metadata?: grpc.Metadata
  ): Promise<IdRegistryEvent>;
  GetFids(request: DeepPartial<FidsRequest>, metadata?: grpc.Metadata): Promise<FidsResponse>;
  /** Bulk Methods */
  GetAllCastMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetAllReactionMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetAllVerificationMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpc.Metadata
  ): Promise<MessagesResponse>;
  GetAllSignerMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetAllUserDataMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  /** Sync Methods */
  GetInfo(request: DeepPartial<Empty>, metadata?: grpc.Metadata): Promise<HubInfoResponse>;
  GetAllSyncIdsByPrefix(request: DeepPartial<TrieNodePrefix>, metadata?: grpc.Metadata): Promise<SyncIds>;
  GetAllMessagesBySyncIds(request: DeepPartial<SyncIds>, metadata?: grpc.Metadata): Promise<MessagesResponse>;
  GetSyncMetadataByPrefix(
    request: DeepPartial<TrieNodePrefix>,
    metadata?: grpc.Metadata
  ): Promise<TrieNodeMetadataResponse>;
  GetSyncSnapshotByPrefix(
    request: DeepPartial<TrieNodePrefix>,
    metadata?: grpc.Metadata
  ): Promise<TrieNodeSnapshotResponse>;
}

export class HubServiceClientImpl implements HubService {
  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.SubmitMessage = this.SubmitMessage.bind(this);
    this.Subscribe = this.Subscribe.bind(this);
    this.GetEvent = this.GetEvent.bind(this);
    this.GetCast = this.GetCast.bind(this);
    this.GetCastsByFid = this.GetCastsByFid.bind(this);
    this.GetCastsByParent = this.GetCastsByParent.bind(this);
    this.GetCastsByMention = this.GetCastsByMention.bind(this);
    this.GetReaction = this.GetReaction.bind(this);
    this.GetReactionsByFid = this.GetReactionsByFid.bind(this);
    this.GetReactionsByCast = this.GetReactionsByCast.bind(this);
    this.GetUserData = this.GetUserData.bind(this);
    this.GetUserDataByFid = this.GetUserDataByFid.bind(this);
    this.GetNameRegistryEvent = this.GetNameRegistryEvent.bind(this);
    this.GetVerification = this.GetVerification.bind(this);
    this.GetVerificationsByFid = this.GetVerificationsByFid.bind(this);
    this.GetSigner = this.GetSigner.bind(this);
    this.GetSignersByFid = this.GetSignersByFid.bind(this);
    this.GetIdRegistryEvent = this.GetIdRegistryEvent.bind(this);
    this.GetIdRegistryEventByAddress = this.GetIdRegistryEventByAddress.bind(this);
    this.GetFids = this.GetFids.bind(this);
    this.GetAllCastMessagesByFid = this.GetAllCastMessagesByFid.bind(this);
    this.GetAllReactionMessagesByFid = this.GetAllReactionMessagesByFid.bind(this);
    this.GetAllVerificationMessagesByFid = this.GetAllVerificationMessagesByFid.bind(this);
    this.GetAllSignerMessagesByFid = this.GetAllSignerMessagesByFid.bind(this);
    this.GetAllUserDataMessagesByFid = this.GetAllUserDataMessagesByFid.bind(this);
    this.GetInfo = this.GetInfo.bind(this);
    this.GetAllSyncIdsByPrefix = this.GetAllSyncIdsByPrefix.bind(this);
    this.GetAllMessagesBySyncIds = this.GetAllMessagesBySyncIds.bind(this);
    this.GetSyncMetadataByPrefix = this.GetSyncMetadataByPrefix.bind(this);
    this.GetSyncSnapshotByPrefix = this.GetSyncSnapshotByPrefix.bind(this);
  }

  SubmitMessage(request: DeepPartial<Message>, metadata?: grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceSubmitMessageDesc, Message.fromPartial(request), metadata);
  }

  Subscribe(request: DeepPartial<SubscribeRequest>, metadata?: grpc.Metadata): Observable<HubEvent> {
    return this.rpc.invoke(HubServiceSubscribeDesc, SubscribeRequest.fromPartial(request), metadata);
  }

  GetEvent(request: DeepPartial<EventRequest>, metadata?: grpc.Metadata): Promise<HubEvent> {
    return this.rpc.unary(HubServiceGetEventDesc, EventRequest.fromPartial(request), metadata);
  }

  GetCast(request: DeepPartial<CastId>, metadata?: grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetCastDesc, CastId.fromPartial(request), metadata);
  }

  GetCastsByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetCastsByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetCastsByParent(request: DeepPartial<CastsByParentRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetCastsByParentDesc, CastsByParentRequest.fromPartial(request), metadata);
  }

  GetCastsByMention(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetCastsByMentionDesc, FidRequest.fromPartial(request), metadata);
  }

  GetReaction(request: DeepPartial<ReactionRequest>, metadata?: grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetReactionDesc, ReactionRequest.fromPartial(request), metadata);
  }

  GetReactionsByFid(request: DeepPartial<ReactionsByFidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetReactionsByFidDesc, ReactionsByFidRequest.fromPartial(request), metadata);
  }

  GetReactionsByCast(
    request: DeepPartial<ReactionsByCastRequest>,
    metadata?: grpc.Metadata
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetReactionsByCastDesc, ReactionsByCastRequest.fromPartial(request), metadata);
  }

  GetUserData(request: DeepPartial<UserDataRequest>, metadata?: grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetUserDataDesc, UserDataRequest.fromPartial(request), metadata);
  }

  GetUserDataByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetUserDataByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetNameRegistryEvent(
    request: DeepPartial<NameRegistryEventRequest>,
    metadata?: grpc.Metadata
  ): Promise<NameRegistryEvent> {
    return this.rpc.unary(HubServiceGetNameRegistryEventDesc, NameRegistryEventRequest.fromPartial(request), metadata);
  }

  GetVerification(request: DeepPartial<VerificationRequest>, metadata?: grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetVerificationDesc, VerificationRequest.fromPartial(request), metadata);
  }

  GetVerificationsByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetVerificationsByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetSigner(request: DeepPartial<SignerRequest>, metadata?: grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetSignerDesc, SignerRequest.fromPartial(request), metadata);
  }

  GetSignersByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetSignersByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetIdRegistryEvent(request: DeepPartial<IdRegistryEventRequest>, metadata?: grpc.Metadata): Promise<IdRegistryEvent> {
    return this.rpc.unary(HubServiceGetIdRegistryEventDesc, IdRegistryEventRequest.fromPartial(request), metadata);
  }

  GetIdRegistryEventByAddress(
    request: DeepPartial<IdRegistryEventByAddressRequest>,
    metadata?: grpc.Metadata
  ): Promise<IdRegistryEvent> {
    return this.rpc.unary(
      HubServiceGetIdRegistryEventByAddressDesc,
      IdRegistryEventByAddressRequest.fromPartial(request),
      metadata
    );
  }

  GetFids(request: DeepPartial<FidsRequest>, metadata?: grpc.Metadata): Promise<FidsResponse> {
    return this.rpc.unary(HubServiceGetFidsDesc, FidsRequest.fromPartial(request), metadata);
  }

  GetAllCastMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllCastMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetAllReactionMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllReactionMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetAllVerificationMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpc.Metadata
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllVerificationMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetAllSignerMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllSignerMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetAllUserDataMessagesByFid(request: DeepPartial<FidRequest>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllUserDataMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  GetInfo(request: DeepPartial<Empty>, metadata?: grpc.Metadata): Promise<HubInfoResponse> {
    return this.rpc.unary(HubServiceGetInfoDesc, Empty.fromPartial(request), metadata);
  }

  GetAllSyncIdsByPrefix(request: DeepPartial<TrieNodePrefix>, metadata?: grpc.Metadata): Promise<SyncIds> {
    return this.rpc.unary(HubServiceGetAllSyncIdsByPrefixDesc, TrieNodePrefix.fromPartial(request), metadata);
  }

  GetAllMessagesBySyncIds(request: DeepPartial<SyncIds>, metadata?: grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllMessagesBySyncIdsDesc, SyncIds.fromPartial(request), metadata);
  }

  GetSyncMetadataByPrefix(
    request: DeepPartial<TrieNodePrefix>,
    metadata?: grpc.Metadata
  ): Promise<TrieNodeMetadataResponse> {
    return this.rpc.unary(HubServiceGetSyncMetadataByPrefixDesc, TrieNodePrefix.fromPartial(request), metadata);
  }

  GetSyncSnapshotByPrefix(
    request: DeepPartial<TrieNodePrefix>,
    metadata?: grpc.Metadata
  ): Promise<TrieNodeSnapshotResponse> {
    return this.rpc.unary(HubServiceGetSyncSnapshotByPrefixDesc, TrieNodePrefix.fromPartial(request), metadata);
  }
}

export const HubServiceDesc = { serviceName: 'HubService' };

export const HubServiceSubmitMessageDesc: UnaryMethodDefinitionish = {
  methodName: 'SubmitMessage',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return Message.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Message.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceSubscribeDesc: UnaryMethodDefinitionish = {
  methodName: 'Subscribe',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: true,
  requestType: {
    serializeBinary() {
      return SubscribeRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = HubEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetEventDesc: UnaryMethodDefinitionish = {
  methodName: 'GetEvent',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return EventRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = HubEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetCastDesc: UnaryMethodDefinitionish = {
  methodName: 'GetCast',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return CastId.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Message.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetCastsByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetCastsByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetCastsByParentDesc: UnaryMethodDefinitionish = {
  methodName: 'GetCastsByParent',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return CastsByParentRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetCastsByMentionDesc: UnaryMethodDefinitionish = {
  methodName: 'GetCastsByMention',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetReactionDesc: UnaryMethodDefinitionish = {
  methodName: 'GetReaction',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ReactionRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Message.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetReactionsByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetReactionsByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ReactionsByFidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetReactionsByCastDesc: UnaryMethodDefinitionish = {
  methodName: 'GetReactionsByCast',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ReactionsByCastRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetUserDataDesc: UnaryMethodDefinitionish = {
  methodName: 'GetUserData',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return UserDataRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Message.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetUserDataByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetUserDataByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetNameRegistryEventDesc: UnaryMethodDefinitionish = {
  methodName: 'GetNameRegistryEvent',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return NameRegistryEventRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = NameRegistryEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetVerificationDesc: UnaryMethodDefinitionish = {
  methodName: 'GetVerification',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return VerificationRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Message.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetVerificationsByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetVerificationsByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetSignerDesc: UnaryMethodDefinitionish = {
  methodName: 'GetSigner',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return SignerRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Message.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetSignersByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetSignersByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetIdRegistryEventDesc: UnaryMethodDefinitionish = {
  methodName: 'GetIdRegistryEvent',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return IdRegistryEventRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = IdRegistryEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetIdRegistryEventByAddressDesc: UnaryMethodDefinitionish = {
  methodName: 'GetIdRegistryEventByAddress',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return IdRegistryEventByAddressRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = IdRegistryEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetFidsDesc: UnaryMethodDefinitionish = {
  methodName: 'GetFids',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidsRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = FidsResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetAllCastMessagesByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetAllCastMessagesByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetAllReactionMessagesByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetAllReactionMessagesByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetAllVerificationMessagesByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetAllVerificationMessagesByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetAllSignerMessagesByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetAllSignerMessagesByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetAllUserDataMessagesByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetAllUserDataMessagesByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetInfoDesc: UnaryMethodDefinitionish = {
  methodName: 'GetInfo',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return Empty.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = HubInfoResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetAllSyncIdsByPrefixDesc: UnaryMethodDefinitionish = {
  methodName: 'GetAllSyncIdsByPrefix',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return TrieNodePrefix.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = SyncIds.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetAllMessagesBySyncIdsDesc: UnaryMethodDefinitionish = {
  methodName: 'GetAllMessagesBySyncIds',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return SyncIds.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetSyncMetadataByPrefixDesc: UnaryMethodDefinitionish = {
  methodName: 'GetSyncMetadataByPrefix',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return TrieNodePrefix.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = TrieNodeMetadataResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetSyncSnapshotByPrefixDesc: UnaryMethodDefinitionish = {
  methodName: 'GetSyncSnapshotByPrefix',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return TrieNodePrefix.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = TrieNodeSnapshotResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export interface AdminService {
  RebuildSyncTrie(request: DeepPartial<Empty>, metadata?: grpc.Metadata): Promise<Empty>;
  DeleteAllMessagesFromDb(request: DeepPartial<Empty>, metadata?: grpc.Metadata): Promise<Empty>;
  SubmitIdRegistryEvent(request: DeepPartial<IdRegistryEvent>, metadata?: grpc.Metadata): Promise<IdRegistryEvent>;
  SubmitNameRegistryEvent(
    request: DeepPartial<NameRegistryEvent>,
    metadata?: grpc.Metadata
  ): Promise<NameRegistryEvent>;
}

export class AdminServiceClientImpl implements AdminService {
  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.RebuildSyncTrie = this.RebuildSyncTrie.bind(this);
    this.DeleteAllMessagesFromDb = this.DeleteAllMessagesFromDb.bind(this);
    this.SubmitIdRegistryEvent = this.SubmitIdRegistryEvent.bind(this);
    this.SubmitNameRegistryEvent = this.SubmitNameRegistryEvent.bind(this);
  }

  RebuildSyncTrie(request: DeepPartial<Empty>, metadata?: grpc.Metadata): Promise<Empty> {
    return this.rpc.unary(AdminServiceRebuildSyncTrieDesc, Empty.fromPartial(request), metadata);
  }

  DeleteAllMessagesFromDb(request: DeepPartial<Empty>, metadata?: grpc.Metadata): Promise<Empty> {
    return this.rpc.unary(AdminServiceDeleteAllMessagesFromDbDesc, Empty.fromPartial(request), metadata);
  }

  SubmitIdRegistryEvent(request: DeepPartial<IdRegistryEvent>, metadata?: grpc.Metadata): Promise<IdRegistryEvent> {
    return this.rpc.unary(AdminServiceSubmitIdRegistryEventDesc, IdRegistryEvent.fromPartial(request), metadata);
  }

  SubmitNameRegistryEvent(
    request: DeepPartial<NameRegistryEvent>,
    metadata?: grpc.Metadata
  ): Promise<NameRegistryEvent> {
    return this.rpc.unary(AdminServiceSubmitNameRegistryEventDesc, NameRegistryEvent.fromPartial(request), metadata);
  }
}

export const AdminServiceDesc = { serviceName: 'AdminService' };

export const AdminServiceRebuildSyncTrieDesc: UnaryMethodDefinitionish = {
  methodName: 'RebuildSyncTrie',
  service: AdminServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return Empty.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Empty.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const AdminServiceDeleteAllMessagesFromDbDesc: UnaryMethodDefinitionish = {
  methodName: 'DeleteAllMessagesFromDb',
  service: AdminServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return Empty.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Empty.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const AdminServiceSubmitIdRegistryEventDesc: UnaryMethodDefinitionish = {
  methodName: 'SubmitIdRegistryEvent',
  service: AdminServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return IdRegistryEvent.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = IdRegistryEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const AdminServiceSubmitNameRegistryEventDesc: UnaryMethodDefinitionish = {
  methodName: 'SubmitNameRegistryEvent',
  service: AdminServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return NameRegistryEvent.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = NameRegistryEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

interface UnaryMethodDefinitionishR extends grpc.UnaryMethodDefinition<any, any> {
  requestStream: any;
  responseStream: any;
}

type UnaryMethodDefinitionish = UnaryMethodDefinitionishR;

interface Rpc {
  unary<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    request: any,
    metadata: grpc.Metadata | undefined
  ): Promise<any>;
  invoke<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    request: any,
    metadata: grpc.Metadata | undefined
  ): Observable<any>;
}

export class GrpcWebImpl {
  private host: string;
  private options: {
    transport?: grpc.TransportFactory;
    streamingTransport?: grpc.TransportFactory;
    debug?: boolean;
    metadata?: grpc.Metadata;
    upStreamRetryCodes?: number[];
  };

  constructor(
    host: string,
    options: {
      transport?: grpc.TransportFactory;
      streamingTransport?: grpc.TransportFactory;
      debug?: boolean;
      metadata?: grpc.Metadata;
      upStreamRetryCodes?: number[];
    }
  ) {
    this.host = host;
    this.options = options;
  }

  unary<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    _request: any,
    metadata: grpc.Metadata | undefined
  ): Promise<any> {
    const request = { ..._request, ...methodDesc.requestType };
    const maybeCombinedMetadata =
      metadata && this.options.metadata
        ? new BrowserHeaders({ ...this.options?.metadata.headersMap, ...metadata?.headersMap })
        : metadata || this.options.metadata;
    return new Promise((resolve, reject) => {
      grpc.unary(methodDesc, {
        request,
        host: this.host,
        metadata: maybeCombinedMetadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (response.status === grpc.Code.OK) {
            resolve(response.message!.toObject());
          } else {
            const err = new GrpcWebError(response.statusMessage, response.status, response.trailers);
            reject(err);
          }
        },
      });
    });
  }

  invoke<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    _request: any,
    metadata: grpc.Metadata | undefined
  ): Observable<any> {
    const upStreamCodes = this.options.upStreamRetryCodes || [];
    const DEFAULT_TIMEOUT_TIME: number = 3_000;
    const request = { ..._request, ...methodDesc.requestType };
    const maybeCombinedMetadata =
      metadata && this.options.metadata
        ? new BrowserHeaders({ ...this.options?.metadata.headersMap, ...metadata?.headersMap })
        : metadata || this.options.metadata;
    return new Observable((observer) => {
      const upStream = () => {
        const client = grpc.invoke(methodDesc, {
          host: this.host,
          request,
          transport: this.options.streamingTransport || this.options.transport,
          metadata: maybeCombinedMetadata,
          debug: this.options.debug,
          onMessage: (next) => observer.next(next),
          onEnd: (code: grpc.Code, message: string, trailers: grpc.Metadata) => {
            if (code === 0) {
              observer.complete();
            } else if (upStreamCodes.includes(code)) {
              setTimeout(upStream, DEFAULT_TIMEOUT_TIME);
            } else {
              const err = new Error(message) as any;
              err.code = code;
              err.metadata = trailers;
              observer.error(err);
            }
          },
        });
        observer.add(() => {
          if (!observer.closed) {
            return client.close();
          }
        });
      };
      upStream();
    }).pipe(share());
  }
}

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

export class GrpcWebError extends tsProtoGlobalThis.Error {
  constructor(message: string, public code: grpc.Code, public metadata: grpc.Metadata) {
    super(message);
  }
}
