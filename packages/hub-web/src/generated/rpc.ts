/* eslint-disable */
// This must be manually change to a default import right now
import grpcWeb from '@improbable-eng/grpc-web';
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
  HubInfoRequest,
  HubInfoResponse,
  IdRegistryEventByAddressRequest,
  IdRegistryEventRequest,
  LinkRequest,
  LinksByFidRequest,
  LinksByTargetRequest,
  MessagesResponse,
  NameRegistryEventRequest,
  ReactionRequest,
  ReactionsByFidRequest,
  ReactionsByTargetRequest,
  SignerRequest,
  SubscribeRequest,
  SyncIds,
  SyncStatusRequest,
  SyncStatusResponse,
  TrieNodeMetadataResponse,
  TrieNodePrefix,
  TrieNodeSnapshotResponse,
  UserDataRequest,
  VerificationRequest,
} from './request_response';

export interface HubService {
  /** Submit Methods */
  submitMessage(request: DeepPartial<Message>, metadata?: grpcWeb.grpc.Metadata): Promise<Message>;
  /** Event Methods */
  subscribe(request: DeepPartial<SubscribeRequest>, metadata?: grpcWeb.grpc.Metadata): Observable<HubEvent>;
  getEvent(request: DeepPartial<EventRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<HubEvent>;
  /** Casts */
  getCast(request: DeepPartial<CastId>, metadata?: grpcWeb.grpc.Metadata): Promise<Message>;
  getCastsByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse>;
  getCastsByParent(
    request: DeepPartial<CastsByParentRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse>;
  getCastsByMention(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse>;
  /** Reactions */
  getReaction(request: DeepPartial<ReactionRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message>;
  getReactionsByFid(
    request: DeepPartial<ReactionsByFidRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse>;
  /** To be deprecated */
  getReactionsByCast(
    request: DeepPartial<ReactionsByTargetRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse>;
  getReactionsByTarget(
    request: DeepPartial<ReactionsByTargetRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse>;
  /** User Data */
  getUserData(request: DeepPartial<UserDataRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message>;
  getUserDataByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse>;
  getNameRegistryEvent(
    request: DeepPartial<NameRegistryEventRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<NameRegistryEvent>;
  /** Verifications */
  getVerification(request: DeepPartial<VerificationRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message>;
  getVerificationsByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse>;
  /** Signer */
  getSigner(request: DeepPartial<SignerRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message>;
  getSignersByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse>;
  getIdRegistryEvent(
    request: DeepPartial<IdRegistryEventRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<IdRegistryEvent>;
  getIdRegistryEventByAddress(
    request: DeepPartial<IdRegistryEventByAddressRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<IdRegistryEvent>;
  getFids(request: DeepPartial<FidsRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<FidsResponse>;
  /** Links */
  getLink(request: DeepPartial<LinkRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message>;
  getLinksByFid(request: DeepPartial<LinksByFidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse>;
  getLinksByTarget(
    request: DeepPartial<LinksByTargetRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse>;
  /** Bulk Methods */
  getAllCastMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse>;
  getAllReactionMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse>;
  getAllVerificationMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse>;
  getAllSignerMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse>;
  getAllUserDataMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse>;
  getAllLinkMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse>;
  /** Sync Methods */
  getInfo(request: DeepPartial<HubInfoRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<HubInfoResponse>;
  getSyncStatus(request: DeepPartial<SyncStatusRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<SyncStatusResponse>;
  getAllSyncIdsByPrefix(request: DeepPartial<TrieNodePrefix>, metadata?: grpcWeb.grpc.Metadata): Promise<SyncIds>;
  getAllMessagesBySyncIds(request: DeepPartial<SyncIds>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse>;
  getSyncMetadataByPrefix(
    request: DeepPartial<TrieNodePrefix>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<TrieNodeMetadataResponse>;
  getSyncSnapshotByPrefix(
    request: DeepPartial<TrieNodePrefix>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<TrieNodeSnapshotResponse>;
}

export class HubServiceClientImpl implements HubService {
  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.submitMessage = this.submitMessage.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.getEvent = this.getEvent.bind(this);
    this.getCast = this.getCast.bind(this);
    this.getCastsByFid = this.getCastsByFid.bind(this);
    this.getCastsByParent = this.getCastsByParent.bind(this);
    this.getCastsByMention = this.getCastsByMention.bind(this);
    this.getReaction = this.getReaction.bind(this);
    this.getReactionsByFid = this.getReactionsByFid.bind(this);
    this.getReactionsByCast = this.getReactionsByCast.bind(this);
    this.getReactionsByTarget = this.getReactionsByTarget.bind(this);
    this.getUserData = this.getUserData.bind(this);
    this.getUserDataByFid = this.getUserDataByFid.bind(this);
    this.getNameRegistryEvent = this.getNameRegistryEvent.bind(this);
    this.getVerification = this.getVerification.bind(this);
    this.getVerificationsByFid = this.getVerificationsByFid.bind(this);
    this.getSigner = this.getSigner.bind(this);
    this.getSignersByFid = this.getSignersByFid.bind(this);
    this.getIdRegistryEvent = this.getIdRegistryEvent.bind(this);
    this.getIdRegistryEventByAddress = this.getIdRegistryEventByAddress.bind(this);
    this.getFids = this.getFids.bind(this);
    this.getLink = this.getLink.bind(this);
    this.getLinksByFid = this.getLinksByFid.bind(this);
    this.getLinksByTarget = this.getLinksByTarget.bind(this);
    this.getAllCastMessagesByFid = this.getAllCastMessagesByFid.bind(this);
    this.getAllReactionMessagesByFid = this.getAllReactionMessagesByFid.bind(this);
    this.getAllVerificationMessagesByFid = this.getAllVerificationMessagesByFid.bind(this);
    this.getAllSignerMessagesByFid = this.getAllSignerMessagesByFid.bind(this);
    this.getAllUserDataMessagesByFid = this.getAllUserDataMessagesByFid.bind(this);
    this.getAllLinkMessagesByFid = this.getAllLinkMessagesByFid.bind(this);
    this.getInfo = this.getInfo.bind(this);
    this.getSyncStatus = this.getSyncStatus.bind(this);
    this.getAllSyncIdsByPrefix = this.getAllSyncIdsByPrefix.bind(this);
    this.getAllMessagesBySyncIds = this.getAllMessagesBySyncIds.bind(this);
    this.getSyncMetadataByPrefix = this.getSyncMetadataByPrefix.bind(this);
    this.getSyncSnapshotByPrefix = this.getSyncSnapshotByPrefix.bind(this);
  }

  submitMessage(request: DeepPartial<Message>, metadata?: grpcWeb.grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceSubmitMessageDesc, Message.fromPartial(request), metadata);
  }

  subscribe(request: DeepPartial<SubscribeRequest>, metadata?: grpcWeb.grpc.Metadata): Observable<HubEvent> {
    return this.rpc.invoke(HubServiceSubscribeDesc, SubscribeRequest.fromPartial(request), metadata);
  }

  getEvent(request: DeepPartial<EventRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<HubEvent> {
    return this.rpc.unary(HubServiceGetEventDesc, EventRequest.fromPartial(request), metadata);
  }

  getCast(request: DeepPartial<CastId>, metadata?: grpcWeb.grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetCastDesc, CastId.fromPartial(request), metadata);
  }

  getCastsByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetCastsByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getCastsByParent(
    request: DeepPartial<CastsByParentRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetCastsByParentDesc, CastsByParentRequest.fromPartial(request), metadata);
  }

  getCastsByMention(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetCastsByMentionDesc, FidRequest.fromPartial(request), metadata);
  }

  getReaction(request: DeepPartial<ReactionRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetReactionDesc, ReactionRequest.fromPartial(request), metadata);
  }

  getReactionsByFid(
    request: DeepPartial<ReactionsByFidRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetReactionsByFidDesc, ReactionsByFidRequest.fromPartial(request), metadata);
  }

  getReactionsByCast(
    request: DeepPartial<ReactionsByTargetRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetReactionsByCastDesc, ReactionsByTargetRequest.fromPartial(request), metadata);
  }

  getReactionsByTarget(
    request: DeepPartial<ReactionsByTargetRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetReactionsByTargetDesc, ReactionsByTargetRequest.fromPartial(request), metadata);
  }

  getUserData(request: DeepPartial<UserDataRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetUserDataDesc, UserDataRequest.fromPartial(request), metadata);
  }

  getUserDataByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetUserDataByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getNameRegistryEvent(
    request: DeepPartial<NameRegistryEventRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<NameRegistryEvent> {
    return this.rpc.unary(HubServiceGetNameRegistryEventDesc, NameRegistryEventRequest.fromPartial(request), metadata);
  }

  getVerification(request: DeepPartial<VerificationRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetVerificationDesc, VerificationRequest.fromPartial(request), metadata);
  }

  getVerificationsByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetVerificationsByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getSigner(request: DeepPartial<SignerRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetSignerDesc, SignerRequest.fromPartial(request), metadata);
  }

  getSignersByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetSignersByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getIdRegistryEvent(
    request: DeepPartial<IdRegistryEventRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<IdRegistryEvent> {
    return this.rpc.unary(HubServiceGetIdRegistryEventDesc, IdRegistryEventRequest.fromPartial(request), metadata);
  }

  getIdRegistryEventByAddress(
    request: DeepPartial<IdRegistryEventByAddressRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<IdRegistryEvent> {
    return this.rpc.unary(
      HubServiceGetIdRegistryEventByAddressDesc,
      IdRegistryEventByAddressRequest.fromPartial(request),
      metadata
    );
  }

  getFids(request: DeepPartial<FidsRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<FidsResponse> {
    return this.rpc.unary(HubServiceGetFidsDesc, FidsRequest.fromPartial(request), metadata);
  }

  getLink(request: DeepPartial<LinkRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetLinkDesc, LinkRequest.fromPartial(request), metadata);
  }

  getLinksByFid(request: DeepPartial<LinksByFidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetLinksByFidDesc, LinksByFidRequest.fromPartial(request), metadata);
  }

  getLinksByTarget(
    request: DeepPartial<LinksByTargetRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetLinksByTargetDesc, LinksByTargetRequest.fromPartial(request), metadata);
  }

  getAllCastMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllCastMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getAllReactionMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllReactionMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getAllVerificationMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllVerificationMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getAllSignerMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllSignerMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getAllUserDataMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllUserDataMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getAllLinkMessagesByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllLinkMessagesByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getInfo(request: DeepPartial<HubInfoRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<HubInfoResponse> {
    return this.rpc.unary(HubServiceGetInfoDesc, HubInfoRequest.fromPartial(request), metadata);
  }

  getSyncStatus(
    request: DeepPartial<SyncStatusRequest>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<SyncStatusResponse> {
    return this.rpc.unary(HubServiceGetSyncStatusDesc, SyncStatusRequest.fromPartial(request), metadata);
  }

  getAllSyncIdsByPrefix(request: DeepPartial<TrieNodePrefix>, metadata?: grpcWeb.grpc.Metadata): Promise<SyncIds> {
    return this.rpc.unary(HubServiceGetAllSyncIdsByPrefixDesc, TrieNodePrefix.fromPartial(request), metadata);
  }

  getAllMessagesBySyncIds(request: DeepPartial<SyncIds>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllMessagesBySyncIdsDesc, SyncIds.fromPartial(request), metadata);
  }

  getSyncMetadataByPrefix(
    request: DeepPartial<TrieNodePrefix>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<TrieNodeMetadataResponse> {
    return this.rpc.unary(HubServiceGetSyncMetadataByPrefixDesc, TrieNodePrefix.fromPartial(request), metadata);
  }

  getSyncSnapshotByPrefix(
    request: DeepPartial<TrieNodePrefix>,
    metadata?: grpcWeb.grpc.Metadata
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
      return ReactionsByTargetRequest.encode(this).finish();
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

export const HubServiceGetReactionsByTargetDesc: UnaryMethodDefinitionish = {
  methodName: 'GetReactionsByTarget',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ReactionsByTargetRequest.encode(this).finish();
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

export const HubServiceGetLinkDesc: UnaryMethodDefinitionish = {
  methodName: 'GetLink',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return LinkRequest.encode(this).finish();
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

export const HubServiceGetLinksByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetLinksByFid',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return LinksByFidRequest.encode(this).finish();
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

export const HubServiceGetLinksByTargetDesc: UnaryMethodDefinitionish = {
  methodName: 'GetLinksByTarget',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return LinksByTargetRequest.encode(this).finish();
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

export const HubServiceGetAllLinkMessagesByFidDesc: UnaryMethodDefinitionish = {
  methodName: 'GetAllLinkMessagesByFid',
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
      return HubInfoRequest.encode(this).finish();
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

export const HubServiceGetSyncStatusDesc: UnaryMethodDefinitionish = {
  methodName: 'GetSyncStatus',
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return SyncStatusRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = SyncStatusResponse.decode(data);
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
  rebuildSyncTrie(request: DeepPartial<Empty>, metadata?: grpcWeb.grpc.Metadata): Promise<Empty>;
  deleteAllMessagesFromDb(request: DeepPartial<Empty>, metadata?: grpcWeb.grpc.Metadata): Promise<Empty>;
  submitIdRegistryEvent(
    request: DeepPartial<IdRegistryEvent>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<IdRegistryEvent>;
  submitNameRegistryEvent(
    request: DeepPartial<NameRegistryEvent>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<NameRegistryEvent>;
}

export class AdminServiceClientImpl implements AdminService {
  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.rebuildSyncTrie = this.rebuildSyncTrie.bind(this);
    this.deleteAllMessagesFromDb = this.deleteAllMessagesFromDb.bind(this);
    this.submitIdRegistryEvent = this.submitIdRegistryEvent.bind(this);
    this.submitNameRegistryEvent = this.submitNameRegistryEvent.bind(this);
  }

  rebuildSyncTrie(request: DeepPartial<Empty>, metadata?: grpcWeb.grpc.Metadata): Promise<Empty> {
    return this.rpc.unary(AdminServiceRebuildSyncTrieDesc, Empty.fromPartial(request), metadata);
  }

  deleteAllMessagesFromDb(request: DeepPartial<Empty>, metadata?: grpcWeb.grpc.Metadata): Promise<Empty> {
    return this.rpc.unary(AdminServiceDeleteAllMessagesFromDbDesc, Empty.fromPartial(request), metadata);
  }

  submitIdRegistryEvent(
    request: DeepPartial<IdRegistryEvent>,
    metadata?: grpcWeb.grpc.Metadata
  ): Promise<IdRegistryEvent> {
    return this.rpc.unary(AdminServiceSubmitIdRegistryEventDesc, IdRegistryEvent.fromPartial(request), metadata);
  }

  submitNameRegistryEvent(
    request: DeepPartial<NameRegistryEvent>,
    metadata?: grpcWeb.grpc.Metadata
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

interface UnaryMethodDefinitionishR extends grpcWeb.grpc.UnaryMethodDefinition<any, any> {
  requestStream: any;
  responseStream: any;
}

type UnaryMethodDefinitionish = UnaryMethodDefinitionishR;

interface Rpc {
  unary<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    request: any,
    metadata: grpcWeb.grpc.Metadata | undefined
  ): Promise<any>;
  invoke<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    request: any,
    metadata: grpcWeb.grpc.Metadata | undefined
  ): Observable<any>;
}

export class GrpcWebImpl {
  private host: string;
  private options: {
    transport?: grpcWeb.grpc.TransportFactory;
    streamingTransport?: grpcWeb.grpc.TransportFactory;
    debug?: boolean;
    metadata?: grpcWeb.grpc.Metadata;
    upStreamRetryCodes?: number[];
  };

  constructor(
    host: string,
    options: {
      transport?: grpcWeb.grpc.TransportFactory;
      streamingTransport?: grpcWeb.grpc.TransportFactory;
      debug?: boolean;
      metadata?: grpcWeb.grpc.Metadata;
      upStreamRetryCodes?: number[];
    }
  ) {
    this.host = host;
    this.options = options;
  }

  unary<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    _request: any,
    metadata: grpcWeb.grpc.Metadata | undefined
  ): Promise<any> {
    const request = { ..._request, ...methodDesc.requestType };
    const maybeCombinedMetadata =
      metadata && this.options.metadata
        ? new BrowserHeaders({ ...this.options?.metadata.headersMap, ...metadata?.headersMap })
        : metadata || this.options.metadata;
    return new Promise((resolve, reject) => {
      grpcWeb.grpc.unary(methodDesc, {
        request,
        host: this.host,
        metadata: maybeCombinedMetadata,
        transport: this.options.transport,
        debug: this.options.debug,
        onEnd: function (response) {
          if (response.status === grpcWeb.grpc.Code.OK) {
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
    metadata: grpcWeb.grpc.Metadata | undefined
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
        const client = grpcWeb.grpc.invoke(methodDesc, {
          host: this.host,
          request,
          transport: this.options.streamingTransport || this.options.transport,
          metadata: maybeCombinedMetadata,
          debug: this.options.debug,
          onMessage: (next) => observer.next(next),
          onEnd: (code: grpcWeb.grpc.Code, message: string, trailers: grpcWeb.grpc.Metadata) => {
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
  constructor(message: string, public code: grpcWeb.grpc.Code, public metadata: grpcWeb.grpc.Metadata) {
    super(message);
  }
}
