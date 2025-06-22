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
} from "@grpc/grpc-js";
import { Block } from "./blocks";
import { HubEvent } from "./hub_event";
import { CastId, Message } from "./message";
import { OnChainEvent } from "./onchain_event";
import {
  BlocksRequest,
  CastsByParentRequest,
  EventRequest,
  EventsRequest,
  EventsResponse,
  FidAddressTypeRequest,
  FidAddressTypeResponse,
  FidRequest,
  FidsRequest,
  FidsResponse,
  FidTimestampRequest,
  GetInfoRequest,
  GetInfoResponse,
  IdRegistryEventByAddressRequest,
  LinkRequest,
  LinksByFidRequest,
  LinksByTargetRequest,
  MessagesResponse,
  OnChainEventRequest,
  OnChainEventResponse,
  ReactionRequest,
  ReactionsByFidRequest,
  ReactionsByTargetRequest,
  ShardChunksRequest,
  ShardChunksResponse,
  SignerRequest,
  StorageLimitsResponse,
  SubscribeRequest,
  TrieNodeMetadataRequest,
  TrieNodeMetadataResponse,
  UserDataRequest,
  UsernameProofRequest,
  UsernameProofsResponse,
  ValidationResponse,
  VerificationRequest,
} from "./request_response";
import { UserNameProof } from "./username_proof";

export type HubServiceService = typeof HubServiceService;
export const HubServiceService = {
  /** Write API */
  submitMessage: {
    path: "/HubService/SubmitMessage",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: Message) => Buffer.from(Message.encode(value).finish()),
    requestDeserialize: (value: Buffer) => Message.decode(value),
    responseSerialize: (value: Message) => Buffer.from(Message.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Message.decode(value),
  },
  /** Validation Methods */
  validateMessage: {
    path: "/HubService/ValidateMessage",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: Message) => Buffer.from(Message.encode(value).finish()),
    requestDeserialize: (value: Buffer) => Message.decode(value),
    responseSerialize: (value: ValidationResponse) => Buffer.from(ValidationResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ValidationResponse.decode(value),
  },
  /** Block API */
  getBlocks: {
    path: "/HubService/GetBlocks",
    requestStream: false,
    responseStream: true,
    requestSerialize: (value: BlocksRequest) => Buffer.from(BlocksRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => BlocksRequest.decode(value),
    responseSerialize: (value: Block) => Buffer.from(Block.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Block.decode(value),
  },
  getShardChunks: {
    path: "/HubService/GetShardChunks",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ShardChunksRequest) => Buffer.from(ShardChunksRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ShardChunksRequest.decode(value),
    responseSerialize: (value: ShardChunksResponse) => Buffer.from(ShardChunksResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ShardChunksResponse.decode(value),
  },
  getInfo: {
    path: "/HubService/GetInfo",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetInfoRequest) => Buffer.from(GetInfoRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetInfoRequest.decode(value),
    responseSerialize: (value: GetInfoResponse) => Buffer.from(GetInfoResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetInfoResponse.decode(value),
  },
  getFids: {
    path: "/HubService/GetFids",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidsRequest) => Buffer.from(FidsRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidsRequest.decode(value),
    responseSerialize: (value: FidsResponse) => Buffer.from(FidsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => FidsResponse.decode(value),
  },
  /** Events */
  subscribe: {
    path: "/HubService/Subscribe",
    requestStream: false,
    responseStream: true,
    requestSerialize: (value: SubscribeRequest) => Buffer.from(SubscribeRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SubscribeRequest.decode(value),
    responseSerialize: (value: HubEvent) => Buffer.from(HubEvent.encode(value).finish()),
    responseDeserialize: (value: Buffer) => HubEvent.decode(value),
  },
  getEvent: {
    path: "/HubService/GetEvent",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: EventRequest) => Buffer.from(EventRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => EventRequest.decode(value),
    responseSerialize: (value: HubEvent) => Buffer.from(HubEvent.encode(value).finish()),
    responseDeserialize: (value: Buffer) => HubEvent.decode(value),
  },
  getEvents: {
    path: "/HubService/GetEvents",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: EventsRequest) => Buffer.from(EventsRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => EventsRequest.decode(value),
    responseSerialize: (value: EventsResponse) => Buffer.from(EventsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => EventsResponse.decode(value),
  },
  /** Casts */
  getCast: {
    path: "/HubService/GetCast",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: CastId) => Buffer.from(CastId.encode(value).finish()),
    requestDeserialize: (value: Buffer) => CastId.decode(value),
    responseSerialize: (value: Message) => Buffer.from(Message.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Message.decode(value),
  },
  getCastsByFid: {
    path: "/HubService/GetCastsByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getCastsByParent: {
    path: "/HubService/GetCastsByParent",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: CastsByParentRequest) => Buffer.from(CastsByParentRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => CastsByParentRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getCastsByMention: {
    path: "/HubService/GetCastsByMention",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  /** Reactions */
  getReaction: {
    path: "/HubService/GetReaction",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ReactionRequest) => Buffer.from(ReactionRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ReactionRequest.decode(value),
    responseSerialize: (value: Message) => Buffer.from(Message.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Message.decode(value),
  },
  getReactionsByFid: {
    path: "/HubService/GetReactionsByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ReactionsByFidRequest) => Buffer.from(ReactionsByFidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ReactionsByFidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  /** To be deprecated */
  getReactionsByCast: {
    path: "/HubService/GetReactionsByCast",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ReactionsByTargetRequest) => Buffer.from(ReactionsByTargetRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ReactionsByTargetRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getReactionsByTarget: {
    path: "/HubService/GetReactionsByTarget",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ReactionsByTargetRequest) => Buffer.from(ReactionsByTargetRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ReactionsByTargetRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  /** User Data */
  getUserData: {
    path: "/HubService/GetUserData",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: UserDataRequest) => Buffer.from(UserDataRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => UserDataRequest.decode(value),
    responseSerialize: (value: Message) => Buffer.from(Message.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Message.decode(value),
  },
  getUserDataByFid: {
    path: "/HubService/GetUserDataByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  /** Username Proof */
  getUsernameProof: {
    path: "/HubService/GetUsernameProof",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: UsernameProofRequest) => Buffer.from(UsernameProofRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => UsernameProofRequest.decode(value),
    responseSerialize: (value: UserNameProof) => Buffer.from(UserNameProof.encode(value).finish()),
    responseDeserialize: (value: Buffer) => UserNameProof.decode(value),
  },
  getUserNameProofsByFid: {
    path: "/HubService/GetUserNameProofsByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: UsernameProofsResponse) => Buffer.from(UsernameProofsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => UsernameProofsResponse.decode(value),
  },
  /** Verifications */
  getVerification: {
    path: "/HubService/GetVerification",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: VerificationRequest) => Buffer.from(VerificationRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => VerificationRequest.decode(value),
    responseSerialize: (value: Message) => Buffer.from(Message.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Message.decode(value),
  },
  getVerificationsByFid: {
    path: "/HubService/GetVerificationsByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  /** OnChain Events */
  getOnChainSigner: {
    path: "/HubService/GetOnChainSigner",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: SignerRequest) => Buffer.from(SignerRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SignerRequest.decode(value),
    responseSerialize: (value: OnChainEvent) => Buffer.from(OnChainEvent.encode(value).finish()),
    responseDeserialize: (value: Buffer) => OnChainEvent.decode(value),
  },
  getOnChainSignersByFid: {
    path: "/HubService/GetOnChainSignersByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: OnChainEventResponse) => Buffer.from(OnChainEventResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => OnChainEventResponse.decode(value),
  },
  getOnChainEvents: {
    path: "/HubService/GetOnChainEvents",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: OnChainEventRequest) => Buffer.from(OnChainEventRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => OnChainEventRequest.decode(value),
    responseSerialize: (value: OnChainEventResponse) => Buffer.from(OnChainEventResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => OnChainEventResponse.decode(value),
  },
  getIdRegistryOnChainEvent: {
    path: "/HubService/GetIdRegistryOnChainEvent",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: OnChainEvent) => Buffer.from(OnChainEvent.encode(value).finish()),
    responseDeserialize: (value: Buffer) => OnChainEvent.decode(value),
  },
  getIdRegistryOnChainEventByAddress: {
    path: "/HubService/GetIdRegistryOnChainEventByAddress",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: IdRegistryEventByAddressRequest) =>
      Buffer.from(IdRegistryEventByAddressRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => IdRegistryEventByAddressRequest.decode(value),
    responseSerialize: (value: OnChainEvent) => Buffer.from(OnChainEvent.encode(value).finish()),
    responseDeserialize: (value: Buffer) => OnChainEvent.decode(value),
  },
  getCurrentStorageLimitsByFid: {
    path: "/HubService/GetCurrentStorageLimitsByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: StorageLimitsResponse) => Buffer.from(StorageLimitsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => StorageLimitsResponse.decode(value),
  },
  getFidAddressType: {
    path: "/HubService/GetFidAddressType",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidAddressTypeRequest) => Buffer.from(FidAddressTypeRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidAddressTypeRequest.decode(value),
    responseSerialize: (value: FidAddressTypeResponse) => Buffer.from(FidAddressTypeResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => FidAddressTypeResponse.decode(value),
  },
  /** Links */
  getLink: {
    path: "/HubService/GetLink",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: LinkRequest) => Buffer.from(LinkRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => LinkRequest.decode(value),
    responseSerialize: (value: Message) => Buffer.from(Message.encode(value).finish()),
    responseDeserialize: (value: Buffer) => Message.decode(value),
  },
  getLinksByFid: {
    path: "/HubService/GetLinksByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: LinksByFidRequest) => Buffer.from(LinksByFidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => LinksByFidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getLinksByTarget: {
    path: "/HubService/GetLinksByTarget",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: LinksByTargetRequest) => Buffer.from(LinksByTargetRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => LinksByTargetRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getLinkCompactStateMessageByFid: {
    path: "/HubService/GetLinkCompactStateMessageByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  /** Bulk Methods */
  getAllCastMessagesByFid: {
    path: "/HubService/GetAllCastMessagesByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidTimestampRequest) => Buffer.from(FidTimestampRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidTimestampRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getAllReactionMessagesByFid: {
    path: "/HubService/GetAllReactionMessagesByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidTimestampRequest) => Buffer.from(FidTimestampRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidTimestampRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getAllVerificationMessagesByFid: {
    path: "/HubService/GetAllVerificationMessagesByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidTimestampRequest) => Buffer.from(FidTimestampRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidTimestampRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getAllUserDataMessagesByFid: {
    path: "/HubService/GetAllUserDataMessagesByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidTimestampRequest) => Buffer.from(FidTimestampRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidTimestampRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getAllLinkMessagesByFid: {
    path: "/HubService/GetAllLinkMessagesByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidTimestampRequest) => Buffer.from(FidTimestampRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidTimestampRequest.decode(value),
    responseSerialize: (value: MessagesResponse) => Buffer.from(MessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MessagesResponse.decode(value),
  },
  getTrieMetadataByPrefix: {
    path: "/HubService/GetTrieMetadataByPrefix",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: TrieNodeMetadataRequest) => Buffer.from(TrieNodeMetadataRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => TrieNodeMetadataRequest.decode(value),
    responseSerialize: (value: TrieNodeMetadataResponse) =>
      Buffer.from(TrieNodeMetadataResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => TrieNodeMetadataResponse.decode(value),
  },
} as const;

export interface HubServiceServer extends UntypedServiceImplementation {
  /** Write API */
  submitMessage: handleUnaryCall<Message, Message>;
  /** Validation Methods */
  validateMessage: handleUnaryCall<Message, ValidationResponse>;
  /** Block API */
  getBlocks: handleServerStreamingCall<BlocksRequest, Block>;
  getShardChunks: handleUnaryCall<ShardChunksRequest, ShardChunksResponse>;
  getInfo: handleUnaryCall<GetInfoRequest, GetInfoResponse>;
  getFids: handleUnaryCall<FidsRequest, FidsResponse>;
  /** Events */
  subscribe: handleServerStreamingCall<SubscribeRequest, HubEvent>;
  getEvent: handleUnaryCall<EventRequest, HubEvent>;
  getEvents: handleUnaryCall<EventsRequest, EventsResponse>;
  /** Casts */
  getCast: handleUnaryCall<CastId, Message>;
  getCastsByFid: handleUnaryCall<FidRequest, MessagesResponse>;
  getCastsByParent: handleUnaryCall<CastsByParentRequest, MessagesResponse>;
  getCastsByMention: handleUnaryCall<FidRequest, MessagesResponse>;
  /** Reactions */
  getReaction: handleUnaryCall<ReactionRequest, Message>;
  getReactionsByFid: handleUnaryCall<ReactionsByFidRequest, MessagesResponse>;
  /** To be deprecated */
  getReactionsByCast: handleUnaryCall<ReactionsByTargetRequest, MessagesResponse>;
  getReactionsByTarget: handleUnaryCall<ReactionsByTargetRequest, MessagesResponse>;
  /** User Data */
  getUserData: handleUnaryCall<UserDataRequest, Message>;
  getUserDataByFid: handleUnaryCall<FidRequest, MessagesResponse>;
  /** Username Proof */
  getUsernameProof: handleUnaryCall<UsernameProofRequest, UserNameProof>;
  getUserNameProofsByFid: handleUnaryCall<FidRequest, UsernameProofsResponse>;
  /** Verifications */
  getVerification: handleUnaryCall<VerificationRequest, Message>;
  getVerificationsByFid: handleUnaryCall<FidRequest, MessagesResponse>;
  /** OnChain Events */
  getOnChainSigner: handleUnaryCall<SignerRequest, OnChainEvent>;
  getOnChainSignersByFid: handleUnaryCall<FidRequest, OnChainEventResponse>;
  getOnChainEvents: handleUnaryCall<OnChainEventRequest, OnChainEventResponse>;
  getIdRegistryOnChainEvent: handleUnaryCall<FidRequest, OnChainEvent>;
  getIdRegistryOnChainEventByAddress: handleUnaryCall<IdRegistryEventByAddressRequest, OnChainEvent>;
  getCurrentStorageLimitsByFid: handleUnaryCall<FidRequest, StorageLimitsResponse>;
  getFidAddressType: handleUnaryCall<FidAddressTypeRequest, FidAddressTypeResponse>;
  /** Links */
  getLink: handleUnaryCall<LinkRequest, Message>;
  getLinksByFid: handleUnaryCall<LinksByFidRequest, MessagesResponse>;
  getLinksByTarget: handleUnaryCall<LinksByTargetRequest, MessagesResponse>;
  getLinkCompactStateMessageByFid: handleUnaryCall<FidRequest, MessagesResponse>;
  /** Bulk Methods */
  getAllCastMessagesByFid: handleUnaryCall<FidTimestampRequest, MessagesResponse>;
  getAllReactionMessagesByFid: handleUnaryCall<FidTimestampRequest, MessagesResponse>;
  getAllVerificationMessagesByFid: handleUnaryCall<FidTimestampRequest, MessagesResponse>;
  getAllUserDataMessagesByFid: handleUnaryCall<FidTimestampRequest, MessagesResponse>;
  getAllLinkMessagesByFid: handleUnaryCall<FidTimestampRequest, MessagesResponse>;
  getTrieMetadataByPrefix: handleUnaryCall<TrieNodeMetadataRequest, TrieNodeMetadataResponse>;
}

export interface HubServiceClient extends Client {
  /** Write API */
  submitMessage(request: Message, callback: (error: ServiceError | null, response: Message) => void): ClientUnaryCall;
  submitMessage(
    request: Message,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Message) => void,
  ): ClientUnaryCall;
  submitMessage(
    request: Message,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Message) => void,
  ): ClientUnaryCall;
  /** Validation Methods */
  validateMessage(
    request: Message,
    callback: (error: ServiceError | null, response: ValidationResponse) => void,
  ): ClientUnaryCall;
  validateMessage(
    request: Message,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ValidationResponse) => void,
  ): ClientUnaryCall;
  validateMessage(
    request: Message,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ValidationResponse) => void,
  ): ClientUnaryCall;
  /** Block API */
  getBlocks(request: BlocksRequest, options?: Partial<CallOptions>): ClientReadableStream<Block>;
  getBlocks(request: BlocksRequest, metadata?: Metadata, options?: Partial<CallOptions>): ClientReadableStream<Block>;
  getShardChunks(
    request: ShardChunksRequest,
    callback: (error: ServiceError | null, response: ShardChunksResponse) => void,
  ): ClientUnaryCall;
  getShardChunks(
    request: ShardChunksRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ShardChunksResponse) => void,
  ): ClientUnaryCall;
  getShardChunks(
    request: ShardChunksRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ShardChunksResponse) => void,
  ): ClientUnaryCall;
  getInfo(
    request: GetInfoRequest,
    callback: (error: ServiceError | null, response: GetInfoResponse) => void,
  ): ClientUnaryCall;
  getInfo(
    request: GetInfoRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetInfoResponse) => void,
  ): ClientUnaryCall;
  getInfo(
    request: GetInfoRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetInfoResponse) => void,
  ): ClientUnaryCall;
  getFids(
    request: FidsRequest,
    callback: (error: ServiceError | null, response: FidsResponse) => void,
  ): ClientUnaryCall;
  getFids(
    request: FidsRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: FidsResponse) => void,
  ): ClientUnaryCall;
  getFids(
    request: FidsRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: FidsResponse) => void,
  ): ClientUnaryCall;
  /** Events */
  subscribe(request: SubscribeRequest, options?: Partial<CallOptions>): ClientReadableStream<HubEvent>;
  subscribe(
    request: SubscribeRequest,
    metadata?: Metadata,
    options?: Partial<CallOptions>,
  ): ClientReadableStream<HubEvent>;
  getEvent(request: EventRequest, callback: (error: ServiceError | null, response: HubEvent) => void): ClientUnaryCall;
  getEvent(
    request: EventRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: HubEvent) => void,
  ): ClientUnaryCall;
  getEvent(
    request: EventRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: HubEvent) => void,
  ): ClientUnaryCall;
  getEvents(
    request: EventsRequest,
    callback: (error: ServiceError | null, response: EventsResponse) => void,
  ): ClientUnaryCall;
  getEvents(
    request: EventsRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: EventsResponse) => void,
  ): ClientUnaryCall;
  getEvents(
    request: EventsRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: EventsResponse) => void,
  ): ClientUnaryCall;
  /** Casts */
  getCast(request: CastId, callback: (error: ServiceError | null, response: Message) => void): ClientUnaryCall;
  getCast(
    request: CastId,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Message) => void,
  ): ClientUnaryCall;
  getCast(
    request: CastId,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Message) => void,
  ): ClientUnaryCall;
  getCastsByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getCastsByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getCastsByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getCastsByParent(
    request: CastsByParentRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getCastsByParent(
    request: CastsByParentRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getCastsByParent(
    request: CastsByParentRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getCastsByMention(
    request: FidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getCastsByMention(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getCastsByMention(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  /** Reactions */
  getReaction(
    request: ReactionRequest,
    callback: (error: ServiceError | null, response: Message) => void,
  ): ClientUnaryCall;
  getReaction(
    request: ReactionRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Message) => void,
  ): ClientUnaryCall;
  getReaction(
    request: ReactionRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Message) => void,
  ): ClientUnaryCall;
  getReactionsByFid(
    request: ReactionsByFidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getReactionsByFid(
    request: ReactionsByFidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getReactionsByFid(
    request: ReactionsByFidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  /** To be deprecated */
  getReactionsByCast(
    request: ReactionsByTargetRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getReactionsByCast(
    request: ReactionsByTargetRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getReactionsByCast(
    request: ReactionsByTargetRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getReactionsByTarget(
    request: ReactionsByTargetRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getReactionsByTarget(
    request: ReactionsByTargetRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getReactionsByTarget(
    request: ReactionsByTargetRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  /** User Data */
  getUserData(
    request: UserDataRequest,
    callback: (error: ServiceError | null, response: Message) => void,
  ): ClientUnaryCall;
  getUserData(
    request: UserDataRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Message) => void,
  ): ClientUnaryCall;
  getUserData(
    request: UserDataRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Message) => void,
  ): ClientUnaryCall;
  getUserDataByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getUserDataByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getUserDataByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  /** Username Proof */
  getUsernameProof(
    request: UsernameProofRequest,
    callback: (error: ServiceError | null, response: UserNameProof) => void,
  ): ClientUnaryCall;
  getUsernameProof(
    request: UsernameProofRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: UserNameProof) => void,
  ): ClientUnaryCall;
  getUsernameProof(
    request: UsernameProofRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: UserNameProof) => void,
  ): ClientUnaryCall;
  getUserNameProofsByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: UsernameProofsResponse) => void,
  ): ClientUnaryCall;
  getUserNameProofsByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: UsernameProofsResponse) => void,
  ): ClientUnaryCall;
  getUserNameProofsByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: UsernameProofsResponse) => void,
  ): ClientUnaryCall;
  /** Verifications */
  getVerification(
    request: VerificationRequest,
    callback: (error: ServiceError | null, response: Message) => void,
  ): ClientUnaryCall;
  getVerification(
    request: VerificationRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Message) => void,
  ): ClientUnaryCall;
  getVerification(
    request: VerificationRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Message) => void,
  ): ClientUnaryCall;
  getVerificationsByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getVerificationsByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getVerificationsByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  /** OnChain Events */
  getOnChainSigner(
    request: SignerRequest,
    callback: (error: ServiceError | null, response: OnChainEvent) => void,
  ): ClientUnaryCall;
  getOnChainSigner(
    request: SignerRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: OnChainEvent) => void,
  ): ClientUnaryCall;
  getOnChainSigner(
    request: SignerRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: OnChainEvent) => void,
  ): ClientUnaryCall;
  getOnChainSignersByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: OnChainEventResponse) => void,
  ): ClientUnaryCall;
  getOnChainSignersByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: OnChainEventResponse) => void,
  ): ClientUnaryCall;
  getOnChainSignersByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: OnChainEventResponse) => void,
  ): ClientUnaryCall;
  getOnChainEvents(
    request: OnChainEventRequest,
    callback: (error: ServiceError | null, response: OnChainEventResponse) => void,
  ): ClientUnaryCall;
  getOnChainEvents(
    request: OnChainEventRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: OnChainEventResponse) => void,
  ): ClientUnaryCall;
  getOnChainEvents(
    request: OnChainEventRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: OnChainEventResponse) => void,
  ): ClientUnaryCall;
  getIdRegistryOnChainEvent(
    request: FidRequest,
    callback: (error: ServiceError | null, response: OnChainEvent) => void,
  ): ClientUnaryCall;
  getIdRegistryOnChainEvent(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: OnChainEvent) => void,
  ): ClientUnaryCall;
  getIdRegistryOnChainEvent(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: OnChainEvent) => void,
  ): ClientUnaryCall;
  getIdRegistryOnChainEventByAddress(
    request: IdRegistryEventByAddressRequest,
    callback: (error: ServiceError | null, response: OnChainEvent) => void,
  ): ClientUnaryCall;
  getIdRegistryOnChainEventByAddress(
    request: IdRegistryEventByAddressRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: OnChainEvent) => void,
  ): ClientUnaryCall;
  getIdRegistryOnChainEventByAddress(
    request: IdRegistryEventByAddressRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: OnChainEvent) => void,
  ): ClientUnaryCall;
  getCurrentStorageLimitsByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: StorageLimitsResponse) => void,
  ): ClientUnaryCall;
  getCurrentStorageLimitsByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: StorageLimitsResponse) => void,
  ): ClientUnaryCall;
  getCurrentStorageLimitsByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: StorageLimitsResponse) => void,
  ): ClientUnaryCall;
  getFidAddressType(
    request: FidAddressTypeRequest,
    callback: (error: ServiceError | null, response: FidAddressTypeResponse) => void,
  ): ClientUnaryCall;
  getFidAddressType(
    request: FidAddressTypeRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: FidAddressTypeResponse) => void,
  ): ClientUnaryCall;
  getFidAddressType(
    request: FidAddressTypeRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: FidAddressTypeResponse) => void,
  ): ClientUnaryCall;
  /** Links */
  getLink(request: LinkRequest, callback: (error: ServiceError | null, response: Message) => void): ClientUnaryCall;
  getLink(
    request: LinkRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: Message) => void,
  ): ClientUnaryCall;
  getLink(
    request: LinkRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: Message) => void,
  ): ClientUnaryCall;
  getLinksByFid(
    request: LinksByFidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getLinksByFid(
    request: LinksByFidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getLinksByFid(
    request: LinksByFidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getLinksByTarget(
    request: LinksByTargetRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getLinksByTarget(
    request: LinksByTargetRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getLinksByTarget(
    request: LinksByTargetRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getLinkCompactStateMessageByFid(
    request: FidRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getLinkCompactStateMessageByFid(
    request: FidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getLinkCompactStateMessageByFid(
    request: FidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  /** Bulk Methods */
  getAllCastMessagesByFid(
    request: FidTimestampRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllCastMessagesByFid(
    request: FidTimestampRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllCastMessagesByFid(
    request: FidTimestampRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllReactionMessagesByFid(
    request: FidTimestampRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllReactionMessagesByFid(
    request: FidTimestampRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllReactionMessagesByFid(
    request: FidTimestampRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllVerificationMessagesByFid(
    request: FidTimestampRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllVerificationMessagesByFid(
    request: FidTimestampRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllVerificationMessagesByFid(
    request: FidTimestampRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllUserDataMessagesByFid(
    request: FidTimestampRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllUserDataMessagesByFid(
    request: FidTimestampRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllUserDataMessagesByFid(
    request: FidTimestampRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllLinkMessagesByFid(
    request: FidTimestampRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllLinkMessagesByFid(
    request: FidTimestampRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllLinkMessagesByFid(
    request: FidTimestampRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getTrieMetadataByPrefix(
    request: TrieNodeMetadataRequest,
    callback: (error: ServiceError | null, response: TrieNodeMetadataResponse) => void,
  ): ClientUnaryCall;
  getTrieMetadataByPrefix(
    request: TrieNodeMetadataRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: TrieNodeMetadataResponse) => void,
  ): ClientUnaryCall;
  getTrieMetadataByPrefix(
    request: TrieNodeMetadataRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: TrieNodeMetadataResponse) => void,
  ): ClientUnaryCall;
}

export const HubServiceClient = makeGenericClientConstructor(HubServiceService, "HubService") as unknown as {
  new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): HubServiceClient;
  service: typeof HubServiceService;
};
