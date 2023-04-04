/* eslint-disable */
import {
  CallOptions,
  ChannelCredentials,
  Client,
  ClientOptions,
  ClientReadableStream,
  ClientUnaryCall,
  handleServerStreamingCall,
  handleUnaryCall,
  makeGenericClientConstructor,
  Metadata,
  ServiceError,
  UntypedServiceImplementation,
} from '@grpc/grpc-js';
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

export type HubServiceService = typeof HubServiceService;
export const HubServiceService = {
  /** Submit Methods */
  submitMessage: {
    path: '/HubService/SubmitMessage',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: Message) => Buffer.from(Message.encode(value).finish()),
    requestDeserialize: (value: Buffer) => Message.decode(value),
    responseSerialize: (value: Message) => Buffer.from(Message.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Message.decode(value),
  },
  /** Event Methods */
  subscribe: {
    path: '/HubService/Subscribe',
    requestStream: false,
    responseStream: true,
    requestSerialize: (value: SubscribeRequest) => Buffer.from(SubscribeRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SubscribeRequest.decode(value),
    responseSerialize: (value: HubEvent) => Buffer.from(HubEvent.encode(value).finish()),
    responseDeserialize: (value: Buffer) => HubEvent.decode(value),
  },
  getEvent: {
    path: '/HubService/GetEvent',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: EventRequest) => Buffer.from(EventRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => EventRequest.decode(value),
    responseSerialize: (value: HubEvent) => Buffer.from(HubEvent.encode(value).finish()),
    responseDeserialize: (value: Buffer) => HubEvent.decode(value),
  },
  /** Casts */
  getCast: {
    path: '/HubService/GetCast',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: CastId) => Buffer.from(CastId.encode(value).finish()),
    requestDeserialize: (value: Buffer) => CastId.decode(value),
    responseSerialize: (value: Message) => Buffer.from(Message.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Message.decode(value),
  },
  getCastsByFid: {
    path: '/HubService/GetCastsByFid',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getCastsByParent: {
    path: '/HubService/GetCastsByParent',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: CastsByParentRequest) => Buffer.from(CastsByParentRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => CastsByParentRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getCastsByMention: {
    path: '/HubService/GetCastsByMention',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  /** Reactions */
  getReaction: {
    path: '/HubService/GetReaction',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ReactionRequest) => Buffer.from(ReactionRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ReactionRequest.decode(value),
    responseSerialize: (value: Message) => Buffer.from(Message.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Message.decode(value),
  },
  getReactionsByFid: {
    path: '/HubService/GetReactionsByFid',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ReactionsByFidRequest) => Buffer.from(ReactionsByFidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ReactionsByFidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getReactionsByCast: {
    path: '/HubService/GetReactionsByCast',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ReactionsByCastRequest) => Buffer.from(ReactionsByCastRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ReactionsByCastRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  /** User Data */
  getUserData: {
    path: '/HubService/GetUserData',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: UserDataRequest) => Buffer.from(UserDataRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => UserDataRequest.decode(value),
    responseSerialize: (value: Message) => Buffer.from(Message.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Message.decode(value),
  },
  getUserDataByFid: {
    path: '/HubService/GetUserDataByFid',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getNameRegistryEvent: {
    path: '/HubService/GetNameRegistryEvent',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: NameRegistryEventRequest) => Buffer.from(NameRegistryEventRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => NameRegistryEventRequest.decode(value),
    responseSerialize: (value: NameRegistryEvent) => Buffer.from(NameRegistryEvent.encode(value).finish()),
    responseDeserialize: (value: Buffer) => NameRegistryEvent.decode(value),
  },
  /** Verifications */
  getVerification: {
    path: '/HubService/GetVerification',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: VerificationRequest) => Buffer.from(VerificationRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => VerificationRequest.decode(value),
    responseSerialize: (value: Message) => Buffer.from(Message.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Message.decode(value),
  },
  getVerificationsByFid: {
    path: '/HubService/GetVerificationsByFid',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  /** Signer */
  getSigner: {
    path: '/HubService/GetSigner',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: SignerRequest) => Buffer.from(SignerRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SignerRequest.decode(value),
    responseSerialize: (value: Message) => Buffer.from(Message.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Message.decode(value),
  },
  getSignersByFid: {
    path: '/HubService/GetSignersByFid',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getIdRegistryEvent: {
    path: '/HubService/GetIdRegistryEvent',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: IdRegistryEventRequest) => Buffer.from(IdRegistryEventRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => IdRegistryEventRequest.decode(value),
    responseSerialize: (value: IdRegistryEvent) => Buffer.from(IdRegistryEvent.encode(value).finish()),
    responseDeserialize: (value: Buffer) => IdRegistryEvent.decode(value),
  },
  getIdRegistryEventByAddress: {
    path: '/HubService/GetIdRegistryEventByAddress',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: IdRegistryEventByAddressRequest) =>
      Buffer.from(IdRegistryEventByAddressRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => IdRegistryEventByAddressRequest.decode(value),
    responseSerialize: (value: IdRegistryEvent) => Buffer.from(IdRegistryEvent.encode(value).finish()),
    responseDeserialize: (value: Buffer) => IdRegistryEvent.decode(value),
  },
  getFids: {
    path: '/HubService/GetFids',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidsRequest) => Buffer.from(FidsRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidsRequest.decode(value),
    responseSerialize: (value: FidsResponse) => Buffer.from(FidsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => FidsResponse.decode(value),
  },
  /** Bulk Methods */
  getAllCastMessagesByFid: {
    path: '/HubService/GetAllCastMessagesByFid',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getAllReactionMessagesByFid: {
    path: '/HubService/GetAllReactionMessagesByFid',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getAllVerificationMessagesByFid: {
    path: '/HubService/GetAllVerificationMessagesByFid',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getAllSignerMessagesByFid: {
    path: '/HubService/GetAllSignerMessagesByFid',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getAllUserDataMessagesByFid: {
    path: '/HubService/GetAllUserDataMessagesByFid',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  /** Sync Methods */
  getInfo: {
    path: '/HubService/GetInfo',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: Empty) => Buffer.from(Empty.encode(value).finish()),
    requestDeserialize: (value: Buffer) => Empty.decode(value),
    responseSerialize: (value: HubInfoResponse) => Buffer.from(HubInfoResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => HubInfoResponse.decode(value),
  },
  getAllSyncIdsByPrefix: {
    path: '/HubService/GetAllSyncIdsByPrefix',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: TrieNodePrefix) => Buffer.from(TrieNodePrefix.encode(value).finish()),
    requestDeserialize: (value: Buffer) => TrieNodePrefix.decode(value),
    responseSerialize: (value: SyncIds) => Buffer.from(SyncIds.encode(value).finish()),
    responseDeserialize: (value: Buffer) => SyncIds.decode(value),
  },
  getAllMessagesBySyncIds: {
    path: '/HubService/GetAllMessagesBySyncIds',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: SyncIds) => Buffer.from(SyncIds.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SyncIds.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getSyncMetadataByPrefix: {
    path: '/HubService/GetSyncMetadataByPrefix',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: TrieNodePrefix) => Buffer.from(TrieNodePrefix.encode(value).finish()),
    requestDeserialize: (value: Buffer) => TrieNodePrefix.decode(value),
    responseSerialize: (value: TrieNodeMetadataResponse) =>
      Buffer.from(TrieNodeMetadataResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => TrieNodeMetadataResponse.decode(value),
  },
  getSyncSnapshotByPrefix: {
    path: '/HubService/GetSyncSnapshotByPrefix',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: TrieNodePrefix) => Buffer.from(TrieNodePrefix.encode(value).finish()),
    requestDeserialize: (value: Buffer) => TrieNodePrefix.decode(value),
    responseSerialize: (value: TrieNodeSnapshotResponse) =>
      Buffer.from(TrieNodeSnapshotResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => TrieNodeSnapshotResponse.decode(value),
  },
} as const;

export interface HubServiceServer extends UntypedServiceImplementation {
  /** Submit Methods */
  submitMessage: handleUnaryCall<Message, Message>;
  /** Event Methods */
  subscribe: handleServerStreamingCall<SubscribeRequest, HubEvent>;
  getEvent: handleUnaryCall<EventRequest, HubEvent>;
  /** Casts */
  getCast: handleUnaryCall<CastId, Message>;
  getCastsByFid: handleUnaryCall<FidRequest, MessagesResponse>;
  getCastsByParent: handleUnaryCall<CastsByParentRequest, MessagesResponse>;
  getCastsByMention: handleUnaryCall<FidRequest, MessagesResponse>;
  /** Reactions */
  getReaction: handleUnaryCall<ReactionRequest, Message>;
  getReactionsByFid: handleUnaryCall<ReactionsByFidRequest, MessagesResponse>;
  getReactionsByCast: handleUnaryCall<ReactionsByCastRequest, MessagesResponse>;
  /** User Data */
  getUserData: handleUnaryCall<UserDataRequest, Message>;
  getUserDataByFid: handleUnaryCall<FidRequest, MessagesResponse>;
  getNameRegistryEvent: handleUnaryCall<NameRegistryEventRequest, NameRegistryEvent>;
  /** Verifications */
  getVerification: handleUnaryCall<VerificationRequest, Message>;
  getVerificationsByFid: handleUnaryCall<FidRequest, MessagesResponse>;
  /** Signer */
  getSigner: handleUnaryCall<SignerRequest, Message>;
  getSignersByFid: handleUnaryCall<FidRequest, MessagesResponse>;
  getIdRegistryEvent: handleUnaryCall<IdRegistryEventRequest, IdRegistryEvent>;
  getIdRegistryEventByAddress: handleUnaryCall<IdRegistryEventByAddressRequest, IdRegistryEvent>;
  getFids: handleUnaryCall<FidsRequest, FidsResponse>;
  /** Bulk Methods */
  getAllCastMessagesByFid: handleUnaryCall<FidRequest, MessagesResponse>;
  getAllReactionMessagesByFid: handleUnaryCall<FidRequest, MessagesResponse>;
  getAllVerificationMessagesByFid: handleUnaryCall<FidRequest, MessagesResponse>;
  getAllSignerMessagesByFid: handleUnaryCall<FidRequest, MessagesResponse>;
  getAllUserDataMessagesByFid: handleUnaryCall<FidRequest, MessagesResponse>;
  /** Sync Methods */
  getInfo: handleUnaryCall<Empty, HubInfoResponse>;
  getAllSyncIdsByPrefix: handleUnaryCall<TrieNodePrefix, SyncIds>;
  getAllMessagesBySyncIds: handleUnaryCall<SyncIds, MessagesResponse>;
  getSyncMetadataByPrefix: handleUnaryCall<TrieNodePrefix, TrieNodeMetadataResponse>;
  getSyncSnapshotByPrefix: handleUnaryCall<TrieNodePrefix, TrieNodeSnapshotResponse>;
}

export interface HubServiceClient extends Client {
  /** Submit Methods */
  submitMessage(request: Message, callback: (error: ServiceError | null, response: Message) => void): ClientUnaryCall;
  submitMessage(
    request: Message,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Message) => void
  ): ClientUnaryCall;
  submitMessage(
    request: Message,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Message) => void
  ): ClientUnaryCall;
  /** Event Methods */
  subscribe(request: SubscribeRequest, options?: Partial<CallOptions>): ClientReadableStream<HubEvent>;
  subscribe(
    request: SubscribeRequest,
    metadata?: Metadata,
    options?: Partial<CallOptions>
  ): ClientReadableStream<HubEvent>;
  getEvent(request: EventRequest, callback: (error: ServiceError | null, response: HubEvent) => void): ClientUnaryCall;
  getEvent(
    request: EventRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: HubEvent) => void
  ): ClientUnaryCall;
  getEvent(
    request: EventRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: HubEvent) => void
  ): ClientUnaryCall;
  /** Casts */
  getCast(request: CastId, callback: (error: ServiceError | null, response: Message) => void): ClientUnaryCall;
  getCast(
    request: CastId,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Message) => void
  ): ClientUnaryCall;
  getCast(
    request: CastId,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Message) => void
  ): ClientUnaryCall;
  getCastsByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getCastsByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getCastsByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getCastsByParent(
    request: CastsByParentRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getCastsByParent(
    request: CastsByParentRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getCastsByParent(
    request: CastsByParentRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getCastsByMention(
    request: FidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getCastsByMention(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getCastsByMention(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  /** Reactions */
  getReaction(
    request: ReactionRequest,
    callback: (error: ServiceError | null, response: Message) => void
  ): ClientUnaryCall;
  getReaction(
    request: ReactionRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Message) => void
  ): ClientUnaryCall;
  getReaction(
    request: ReactionRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Message) => void
  ): ClientUnaryCall;
  getReactionsByFid(
    request: ReactionsByFidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getReactionsByFid(
    request: ReactionsByFidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getReactionsByFid(
    request: ReactionsByFidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getReactionsByCast(
    request: ReactionsByCastRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getReactionsByCast(
    request: ReactionsByCastRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getReactionsByCast(
    request: ReactionsByCastRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  /** User Data */
  getUserData(
    request: UserDataRequest,
    callback: (error: ServiceError | null, response: Message) => void
  ): ClientUnaryCall;
  getUserData(
    request: UserDataRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Message) => void
  ): ClientUnaryCall;
  getUserData(
    request: UserDataRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Message) => void
  ): ClientUnaryCall;
  getUserDataByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getUserDataByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getUserDataByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getNameRegistryEvent(
    request: NameRegistryEventRequest,
    callback: (error: ServiceError | null, response: NameRegistryEvent) => void
  ): ClientUnaryCall;
  getNameRegistryEvent(
    request: NameRegistryEventRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: NameRegistryEvent) => void
  ): ClientUnaryCall;
  getNameRegistryEvent(
    request: NameRegistryEventRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: NameRegistryEvent) => void
  ): ClientUnaryCall;
  /** Verifications */
  getVerification(
    request: VerificationRequest,
    callback: (error: ServiceError | null, response: Message) => void
  ): ClientUnaryCall;
  getVerification(
    request: VerificationRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Message) => void
  ): ClientUnaryCall;
  getVerification(
    request: VerificationRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Message) => void
  ): ClientUnaryCall;
  getVerificationsByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getVerificationsByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getVerificationsByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  /** Signer */
  getSigner(request: SignerRequest, callback: (error: ServiceError | null, response: Message) => void): ClientUnaryCall;
  getSigner(
    request: SignerRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Message) => void
  ): ClientUnaryCall;
  getSigner(
    request: SignerRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Message) => void
  ): ClientUnaryCall;
  getSignersByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getSignersByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getSignersByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getIdRegistryEvent(
    request: IdRegistryEventRequest,
    callback: (error: ServiceError | null, response: IdRegistryEvent) => void
  ): ClientUnaryCall;
  getIdRegistryEvent(
    request: IdRegistryEventRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: IdRegistryEvent) => void
  ): ClientUnaryCall;
  getIdRegistryEvent(
    request: IdRegistryEventRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: IdRegistryEvent) => void
  ): ClientUnaryCall;
  getIdRegistryEventByAddress(
    request: IdRegistryEventByAddressRequest,
    callback: (error: ServiceError | null, response: IdRegistryEvent) => void
  ): ClientUnaryCall;
  getIdRegistryEventByAddress(
    request: IdRegistryEventByAddressRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: IdRegistryEvent) => void
  ): ClientUnaryCall;
  getIdRegistryEventByAddress(
    request: IdRegistryEventByAddressRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: IdRegistryEvent) => void
  ): ClientUnaryCall;
  getFids(
    request: FidsRequest,
    callback: (error: ServiceError | null, response: FidsResponse) => void
  ): ClientUnaryCall;
  getFids(
    request: FidsRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: FidsResponse) => void
  ): ClientUnaryCall;
  getFids(
    request: FidsRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: FidsResponse) => void
  ): ClientUnaryCall;
  /** Bulk Methods */
  getAllCastMessagesByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllCastMessagesByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllCastMessagesByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllReactionMessagesByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllReactionMessagesByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllReactionMessagesByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllVerificationMessagesByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllVerificationMessagesByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllVerificationMessagesByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllSignerMessagesByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllSignerMessagesByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllSignerMessagesByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllUserDataMessagesByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllUserDataMessagesByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllUserDataMessagesByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  /** Sync Methods */
  getInfo(request: Empty, callback: (error: ServiceError | null, response: HubInfoResponse) => void): ClientUnaryCall;
  getInfo(
    request: Empty,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: HubInfoResponse) => void
  ): ClientUnaryCall;
  getInfo(
    request: Empty,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: HubInfoResponse) => void
  ): ClientUnaryCall;
  getAllSyncIdsByPrefix(
    request: TrieNodePrefix,
    callback: (error: ServiceError | null, response: SyncIds) => void
  ): ClientUnaryCall;
  getAllSyncIdsByPrefix(
    request: TrieNodePrefix,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: SyncIds) => void
  ): ClientUnaryCall;
  getAllSyncIdsByPrefix(
    request: TrieNodePrefix,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: SyncIds) => void
  ): ClientUnaryCall;
  getAllMessagesBySyncIds(
    request: SyncIds,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllMessagesBySyncIds(
    request: SyncIds,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getAllMessagesBySyncIds(
    request: SyncIds,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void
  ): ClientUnaryCall;
  getSyncMetadataByPrefix(
    request: TrieNodePrefix,
    callback: (error: ServiceError | null, response: TrieNodeMetadataResponse) => void
  ): ClientUnaryCall;
  getSyncMetadataByPrefix(
    request: TrieNodePrefix,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: TrieNodeMetadataResponse) => void
  ): ClientUnaryCall;
  getSyncMetadataByPrefix(
    request: TrieNodePrefix,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: TrieNodeMetadataResponse) => void
  ): ClientUnaryCall;
  getSyncSnapshotByPrefix(
    request: TrieNodePrefix,
    callback: (error: ServiceError | null, response: TrieNodeSnapshotResponse) => void
  ): ClientUnaryCall;
  getSyncSnapshotByPrefix(
    request: TrieNodePrefix,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: TrieNodeSnapshotResponse) => void
  ): ClientUnaryCall;
  getSyncSnapshotByPrefix(
    request: TrieNodePrefix,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: TrieNodeSnapshotResponse) => void
  ): ClientUnaryCall;
}

export const HubServiceClient = makeGenericClientConstructor(HubServiceService, 'HubService') as unknown as {
  new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): HubServiceClient;
  service: typeof HubServiceService;
};

export type AdminServiceService = typeof AdminServiceService;
export const AdminServiceService = {
  rebuildSyncTrie: {
    path: '/AdminService/RebuildSyncTrie',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: Empty) => Buffer.from(Empty.encode(value).finish()),
    requestDeserialize: (value: Buffer) => Empty.decode(value),
    responseSerialize: (value: Empty) => Buffer.from(Empty.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Empty.decode(value),
  },
  deleteAllMessagesFromDb: {
    path: '/AdminService/DeleteAllMessagesFromDb',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: Empty) => Buffer.from(Empty.encode(value).finish()),
    requestDeserialize: (value: Buffer) => Empty.decode(value),
    responseSerialize: (value: Empty) => Buffer.from(Empty.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Empty.decode(value),
  },
  submitIdRegistryEvent: {
    path: '/AdminService/SubmitIdRegistryEvent',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: IdRegistryEvent) => Buffer.from(IdRegistryEvent.encode(value).finish()),
    requestDeserialize: (value: Buffer) => IdRegistryEvent.decode(value),
    responseSerialize: (value: IdRegistryEvent) => Buffer.from(IdRegistryEvent.encode(value).finish()),
    responseDeserialize: (value: Buffer) => IdRegistryEvent.decode(value),
  },
  submitNameRegistryEvent: {
    path: '/AdminService/SubmitNameRegistryEvent',
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: NameRegistryEvent) => Buffer.from(NameRegistryEvent.encode(value).finish()),
    requestDeserialize: (value: Buffer) => NameRegistryEvent.decode(value),
    responseSerialize: (value: NameRegistryEvent) => Buffer.from(NameRegistryEvent.encode(value).finish()),
    responseDeserialize: (value: Buffer) => NameRegistryEvent.decode(value),
  },
} as const;

export interface AdminServiceServer extends UntypedServiceImplementation {
  rebuildSyncTrie: handleUnaryCall<Empty, Empty>;
  deleteAllMessagesFromDb: handleUnaryCall<Empty, Empty>;
  submitIdRegistryEvent: handleUnaryCall<IdRegistryEvent, IdRegistryEvent>;
  submitNameRegistryEvent: handleUnaryCall<NameRegistryEvent, NameRegistryEvent>;
}

export interface AdminServiceClient extends Client {
  rebuildSyncTrie(request: Empty, callback: (error: ServiceError | null, response: Empty) => void): ClientUnaryCall;
  rebuildSyncTrie(
    request: Empty,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Empty) => void
  ): ClientUnaryCall;
  rebuildSyncTrie(
    request: Empty,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Empty) => void
  ): ClientUnaryCall;
  deleteAllMessagesFromDb(
    request: Empty,
    callback: (error: ServiceError | null, response: Empty) => void
  ): ClientUnaryCall;
  deleteAllMessagesFromDb(
    request: Empty,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Empty) => void
  ): ClientUnaryCall;
  deleteAllMessagesFromDb(
    request: Empty,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Empty) => void
  ): ClientUnaryCall;
  submitIdRegistryEvent(
    request: IdRegistryEvent,
    callback: (error: ServiceError | null, response: IdRegistryEvent) => void
  ): ClientUnaryCall;
  submitIdRegistryEvent(
    request: IdRegistryEvent,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: IdRegistryEvent) => void
  ): ClientUnaryCall;
  submitIdRegistryEvent(
    request: IdRegistryEvent,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: IdRegistryEvent) => void
  ): ClientUnaryCall;
  submitNameRegistryEvent(
    request: NameRegistryEvent,
    callback: (error: ServiceError | null, response: NameRegistryEvent) => void
  ): ClientUnaryCall;
  submitNameRegistryEvent(
    request: NameRegistryEvent,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: NameRegistryEvent) => void
  ): ClientUnaryCall;
  submitNameRegistryEvent(
    request: NameRegistryEvent,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: NameRegistryEvent) => void
  ): ClientUnaryCall;
}

export const AdminServiceClient = makeGenericClientConstructor(AdminServiceService, 'AdminService') as unknown as {
  new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): AdminServiceClient;
  service: typeof AdminServiceService;
};
