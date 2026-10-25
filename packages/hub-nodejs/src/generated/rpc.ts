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
  ChannelFollowerCountRequest,
  ChannelFollowerCountResponse,
  ChannelFollowersRequest,
  ChannelFollowersResponse,
  ChannelFollowsRequest,
  ChannelFollowsResponse,
  ChannelMemberRequest,
  ChannelMemberResponse,
  ChannelMembershipsByFidRequest,
  ChannelMembershipsResponse,
  ChannelMembersRequest,
  ChannelMembersResponse,
  ChannelMetadataResponse,
  ChannelModerationsRequest,
  ChannelModerationsResponse,
  ChannelOwnerRequest,
  ChannelOwnerResponse,
  ChannelPinResponse,
  ChannelRequest,
  ChannelsByAddressRequest,
  ChannelsByFidRequest,
  ChannelsResponse,
  EventRequest,
  EventsRequest,
  EventsResponse,
  FidAddressTypeRequest,
  FidAddressTypeResponse,
  FidRequest,
  FidsRequest,
  FidsResponse,
  FidTimestampRequest,
  GetConnectedPeersRequest,
  GetConnectedPeersResponse,
  GetInfoRequest,
  GetInfoResponse,
  GetMeshViewRequest,
  IdRegistryEventByAddressRequest,
  IsFollowingChannelRequest,
  IsFollowingChannelResponse,
  LinkRequest,
  LinksByFidRequest,
  LinksByTargetRequest,
  MeshTopology,
  MeshView,
  MessagesResponse,
  OnChainEventRequest,
  OnChainEventResponse,
  ReactionRequest,
  ReactionsByFidRequest,
  ReactionsByTargetRequest,
  ShardChunksRequest,
  ShardChunksResponse,
  SignerRequest,
  SignerResponse,
  SignersByFidRequest,
  SignersByFidResponse,
  StorageLimitsResponse,
  SubmitBulkMessagesRequest,
  SubmitBulkMessagesResponse,
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
  submitBulkMessages: {
    path: "/HubService/SubmitBulkMessages",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: SubmitBulkMessagesRequest) =>
      Buffer.from(SubmitBulkMessagesRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SubmitBulkMessagesRequest.decode(value),
    responseSerialize: (value: SubmitBulkMessagesResponse) =>
      Buffer.from(SubmitBulkMessagesResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => SubmitBulkMessagesResponse.decode(value),
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
  getConnectedPeers: {
    path: "/HubService/GetConnectedPeers",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetConnectedPeersRequest) => Buffer.from(GetConnectedPeersRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetConnectedPeersRequest.decode(value),
    responseSerialize: (value: GetConnectedPeersResponse) =>
      Buffer.from(GetConnectedPeersResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetConnectedPeersResponse.decode(value),
  },
  /** Mesh health & topology: this node's local view of the gossip mesh. Admin-gated. */
  getMeshView: {
    path: "/HubService/GetMeshView",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetMeshViewRequest) => Buffer.from(GetMeshViewRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetMeshViewRequest.decode(value),
    responseSerialize: (value: MeshView) => Buffer.from(MeshView.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MeshView.decode(value),
  },
  /**
   * Network-wide topology: centralized crawl of connected validators over the
   * gossip port, aggregating each validator's local mesh view. Admin-gated.
   */
  getMeshTopology: {
    path: "/HubService/GetMeshTopology",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetMeshViewRequest) => Buffer.from(GetMeshViewRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetMeshViewRequest.decode(value),
    responseSerialize: (value: MeshTopology) => Buffer.from(MeshTopology.encode(value).finish()),
    responseDeserialize: (value: Buffer) => MeshTopology.decode(value),
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
  /**
   * OnChain Events
   * DEPRECATED in favor of GetSigner (unified). Returns on-chain signer events
   * only — gasless / off-chain keys are not surfaced through this RPC.
   */
  getOnChainSigner: {
    path: "/HubService/GetOnChainSigner",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: SignerRequest) => Buffer.from(SignerRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SignerRequest.decode(value),
    responseSerialize: (value: OnChainEvent) => Buffer.from(OnChainEvent.encode(value).finish()),
    responseDeserialize: (value: Buffer) => OnChainEvent.decode(value),
  },
  /**
   * DEPRECATED in favor of GetSignersByFid (unified). Returns on-chain signer
   * events only — gasless / off-chain keys are not surfaced through this RPC.
   */
  getOnChainSignersByFid: {
    path: "/HubService/GetOnChainSignersByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: FidRequest) => Buffer.from(FidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => FidRequest.decode(value),
    responseSerialize: (value: OnChainEventResponse) => Buffer.from(OnChainEventResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => OnChainEventResponse.decode(value),
  },
  /** Unified signer surface — returns both on-chain and off-chain (gasless) keys. */
  getSigner: {
    path: "/HubService/GetSigner",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: SignerRequest) => Buffer.from(SignerRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SignerRequest.decode(value),
    responseSerialize: (value: SignerResponse) => Buffer.from(SignerResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => SignerResponse.decode(value),
  },
  getSignersByFid: {
    path: "/HubService/GetSignersByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: SignersByFidRequest) => Buffer.from(SignersByFidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => SignersByFidRequest.decode(value),
    responseSerialize: (value: SignersByFidResponse) => Buffer.from(SignersByFidResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => SignersByFidResponse.decode(value),
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
  /**
   * Resolves the current channel registry owner address to an fid using the
   * shard-0 verification replica. The owner is the winning verifier of the
   * address in that replica (greatest ts_hash, ties to the lower fid);
   * verifications that exist only in pre-activation data-shard history do not
   * participate. This read is not consensus.
   *
   * An fid of 0 means the owner's verification has not landed on shard 0 yet.
   * It is a normal, expected state — not an error and not a lookup failure. The
   * registration exists and the owner address is known; nothing binds that
   * address to an fid on shard 0 yet, so there is no one to authorize.
   *
   * Two situations produce it: the address was never verified, or it was
   * verified only before activation, which the shard-0 admission timestamp
   * floor deliberately excludes. The node cannot tell them apart — both are the
   * same absent replica row — and does not need to, because the remedy is the
   * same either way. Surface fid 0 as "not yet", never as "abandoned".
   *
   * RE-VERIFICATION IS REQUIRED. There is no backfill of pre-activation
   * verification history into the shard-0 replica, so an owner who verified
   * their address before activation MUST submit a fresh verification of the
   * same address afterwards for their channel to become manageable. Until they
   * do, every permissioned write on the channel is rejected exactly as if it
   * were unclaimed. Clients should present fid 0 as an actionable "verify your
   * address to manage this channel" state rather than an error.
   *
   * Expiry is returned as-is and may be in the past. The registry contract
   * emits no onchain event when a lapsed registration's grace period ends, so
   * this endpoint reports the last known registration (owner address + expiry)
   * until a later registration supersedes it; it never computes grace or
   * release state. Callers interpret `expiry` themselves (e.g. against the
   * deployed grace period). NOT_FOUND is returned only for a channel key with
   * no registration record at all.
   */
  getChannelOwner: {
    path: "/HubService/GetChannelOwner",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ChannelOwnerRequest) => Buffer.from(ChannelOwnerRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ChannelOwnerRequest.decode(value),
    responseSerialize: (value: ChannelOwnerResponse) => Buffer.from(ChannelOwnerResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ChannelOwnerResponse.decode(value),
  },
  /**
   * Lists channels for a raw 20-byte EVM owner address, including lapsed
   * registrations (expiry in the past) until a later registration supersedes
   * them — see GetChannelOwner's expiry note; callers interpret `expiry`
   * themselves. Owner resolution uses the shard-0 verification replica, as in
   * GetChannelOwner.
   * This read is not consensus. `page_token` is opaque bytes; callers page until
   * `next_page_token` is unset, which marks the end of enumeration. A page that
   * lands exactly on the last entry may return a token that yields one final
   * empty page, so a present token means "page again", not "results guaranteed".
   */
  getChannelsByAddress: {
    path: "/HubService/GetChannelsByAddress",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ChannelsByAddressRequest) => Buffer.from(ChannelsByAddressRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ChannelsByAddressRequest.decode(value),
    responseSerialize: (value: ChannelsResponse) => Buffer.from(ChannelsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ChannelsResponse.decode(value),
  },
  /**
   * Lists channels that currently resolve to `fid`, including lapsed
   * registrations (see GetChannelOwner's expiry note). The node must host the
   * fid's home shard to enumerate its verified addresses, following existing
   * fid-routed read behavior. The final owner-winner filter uses the shard-0
   * verification replica, as in GetChannelOwner. This read is not consensus.
   *
   * This is a joined read over the fid's verified EVM addresses and the channel
   * owner-address index. The verified addresses are enumerated in ascending
   * order, making the owner-address index key a globally ordered composite
   * cursor across the join. `page_token` is opaque bytes and the paging contract
   * is identical to GetChannelsByAddress: page until `next_page_token` is unset
   * (a boundary-aligned page may return one final empty page). There is no
   * `reverse` (addresses iterate ascending only).
   */
  getChannelsByFid: {
    path: "/HubService/GetChannelsByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ChannelsByFidRequest) => Buffer.from(ChannelsByFidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ChannelsByFidRequest.decode(value),
    responseSerialize: (value: ChannelsResponse) => Buffer.from(ChannelsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ChannelsResponse.decode(value),
  },
  /**
   * Channel-message reads use shard-0 stores. All channel_id values are the raw
   * 32-byte registry labels; any other width is INVALID_ARGUMENT, not NOT_FOUND.
   *
   * The five channel_id-keyed reads below require a registered channel and
   * return NOT_FOUND otherwise; a registered channel with no matching state
   * returns an empty/default response or page. GetChannelMembershipsByFid is
   * the exception: it is keyed by fid alone, performs no registration check,
   * and therefore never returns NOT_FOUND — it can list memberships for
   * channels the caller cannot look up individually. It and GetChannelMember
   * reject an fid that is zero or exceeds u32 with INVALID_ARGUMENT.
   *
   * Paging on the three list reads follows GetChannelsByAddress: `page_token`
   * is opaque bytes, page until `next_page_token` is unset, and a
   * boundary-aligned page may yield one final empty page. Unlike the reads
   * above, a token is scoped to the index that minted it — passing one channel's
   * token to another channel (or another fid's to GetChannelMembershipsByFid)
   * is INVALID_ARGUMENT rather than a silent cross-channel read. `page_size` is
   * clamped to the server maximum without signalling, and `page_size: 0` is
   * INVALID_ARGUMENT rather than an empty terminal page — omit it for the default.
   */
  getChannelMember: {
    path: "/HubService/GetChannelMember",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ChannelMemberRequest) => Buffer.from(ChannelMemberRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ChannelMemberRequest.decode(value),
    responseSerialize: (value: ChannelMemberResponse) => Buffer.from(ChannelMemberResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ChannelMemberResponse.decode(value),
  },
  getChannelMembers: {
    path: "/HubService/GetChannelMembers",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ChannelMembersRequest) => Buffer.from(ChannelMembersRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ChannelMembersRequest.decode(value),
    responseSerialize: (value: ChannelMembersResponse) => Buffer.from(ChannelMembersResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ChannelMembersResponse.decode(value),
  },
  getChannelPin: {
    path: "/HubService/GetChannelPin",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ChannelRequest) => Buffer.from(ChannelRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ChannelRequest.decode(value),
    responseSerialize: (value: ChannelPinResponse) => Buffer.from(ChannelPinResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ChannelPinResponse.decode(value),
  },
  getChannelModerations: {
    path: "/HubService/GetChannelModerations",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ChannelModerationsRequest) =>
      Buffer.from(ChannelModerationsRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ChannelModerationsRequest.decode(value),
    responseSerialize: (value: ChannelModerationsResponse) =>
      Buffer.from(ChannelModerationsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ChannelModerationsResponse.decode(value),
  },
  getChannelMetadata: {
    path: "/HubService/GetChannelMetadata",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ChannelRequest) => Buffer.from(ChannelRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ChannelRequest.decode(value),
    responseSerialize: (value: ChannelMetadataResponse) => Buffer.from(ChannelMetadataResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ChannelMetadataResponse.decode(value),
  },
  getChannelMembershipsByFid: {
    path: "/HubService/GetChannelMembershipsByFid",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ChannelMembershipsByFidRequest) =>
      Buffer.from(ChannelMembershipsByFidRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ChannelMembershipsByFidRequest.decode(value),
    responseSerialize: (value: ChannelMembershipsResponse) =>
      Buffer.from(ChannelMembershipsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ChannelMembershipsResponse.decode(value),
  },
  /**
   * Channel follows. Unlike everything above, these read DATA SHARDS, not shard 0:
   * a follow is an ordinary reaction living on its author's own shard (see
   * ChannelFollower in request_response.proto for the message shape and for the
   * pruning caveat).
   *
   * No registration check, deliberately, and so NEVER NOT_FOUND for an unknown
   * channel — only INVALID_ARGUMENT for a channel_id that is not 32 bytes.
   * Registration lives on shard 0, which a data-shard-only node need not host, and
   * a follow row can legitimately exist for a tokenId that was never minted;
   * returning NOT_FOUND would make GetChannelFollowerCount disagree with
   * IsFollowingChannel for the same channel. An unfollowed or unknown channel
   * returns an empty page and a count of zero.
   *
   * GetChannelFollowers and GetChannelFollowerCount FAN OUT across every shard,
   * because no single shard holds a channel's whole follower set. Two consequences:
   *
   *   * A node that does not host all shards returns FAILED_PRECONDITION rather
   *     than answering from the shards it has. A partial follower list is
   *     indistinguishable from a small one, so it must not be served silently.
   *   * `page_size` is per shard, so a page may hold up to page_size * num_shards
   *     entries, and `page_token` encodes one cursor per shard. A token is rejected
   *     with INVALID_ARGUMENT if its shard set does not match the node's. Page until
   *     `next_page_token` is unset; a boundary-aligned page may yield one final
   *     empty page. As above, `page_size: 0` is INVALID_ARGUMENT — omit it for the
   *     default.
   *
   * A summed count and an enumerated follower list are read from each shard at
   * slightly different instants, so under concurrent writes they can disagree by a
   * few entries. Neither is stale in itself; there is just no cross-shard snapshot.
   *
   * GetChannelFollows and IsFollowingChannel are keyed by fid, so they answer from
   * that fid's home shard alone and have none of the above caveats.
   */
  getChannelFollowers: {
    path: "/HubService/GetChannelFollowers",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ChannelFollowersRequest) => Buffer.from(ChannelFollowersRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ChannelFollowersRequest.decode(value),
    responseSerialize: (value: ChannelFollowersResponse) =>
      Buffer.from(ChannelFollowersResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ChannelFollowersResponse.decode(value),
  },
  getChannelFollowerCount: {
    path: "/HubService/GetChannelFollowerCount",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ChannelFollowerCountRequest) =>
      Buffer.from(ChannelFollowerCountRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ChannelFollowerCountRequest.decode(value),
    responseSerialize: (value: ChannelFollowerCountResponse) =>
      Buffer.from(ChannelFollowerCountResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ChannelFollowerCountResponse.decode(value),
  },
  getChannelFollows: {
    path: "/HubService/GetChannelFollows",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: ChannelFollowsRequest) => Buffer.from(ChannelFollowsRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => ChannelFollowsRequest.decode(value),
    responseSerialize: (value: ChannelFollowsResponse) => Buffer.from(ChannelFollowsResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => ChannelFollowsResponse.decode(value),
  },
  isFollowingChannel: {
    path: "/HubService/IsFollowingChannel",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: IsFollowingChannelRequest) =>
      Buffer.from(IsFollowingChannelRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => IsFollowingChannelRequest.decode(value),
    responseSerialize: (value: IsFollowingChannelResponse) =>
      Buffer.from(IsFollowingChannelResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => IsFollowingChannelResponse.decode(value),
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
  getAllLendStorageMessagesByFid: {
    path: "/HubService/GetAllLendStorageMessagesByFid",
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
  submitBulkMessages: handleUnaryCall<SubmitBulkMessagesRequest, SubmitBulkMessagesResponse>;
  /** Validation Methods */
  validateMessage: handleUnaryCall<Message, ValidationResponse>;
  /** Block API */
  getBlocks: handleServerStreamingCall<BlocksRequest, Block>;
  getShardChunks: handleUnaryCall<ShardChunksRequest, ShardChunksResponse>;
  getInfo: handleUnaryCall<GetInfoRequest, GetInfoResponse>;
  getFids: handleUnaryCall<FidsRequest, FidsResponse>;
  getConnectedPeers: handleUnaryCall<GetConnectedPeersRequest, GetConnectedPeersResponse>;
  /** Mesh health & topology: this node's local view of the gossip mesh. Admin-gated. */
  getMeshView: handleUnaryCall<GetMeshViewRequest, MeshView>;
  /**
   * Network-wide topology: centralized crawl of connected validators over the
   * gossip port, aggregating each validator's local mesh view. Admin-gated.
   */
  getMeshTopology: handleUnaryCall<GetMeshViewRequest, MeshTopology>;
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
  /**
   * OnChain Events
   * DEPRECATED in favor of GetSigner (unified). Returns on-chain signer events
   * only — gasless / off-chain keys are not surfaced through this RPC.
   */
  getOnChainSigner: handleUnaryCall<SignerRequest, OnChainEvent>;
  /**
   * DEPRECATED in favor of GetSignersByFid (unified). Returns on-chain signer
   * events only — gasless / off-chain keys are not surfaced through this RPC.
   */
  getOnChainSignersByFid: handleUnaryCall<FidRequest, OnChainEventResponse>;
  /** Unified signer surface — returns both on-chain and off-chain (gasless) keys. */
  getSigner: handleUnaryCall<SignerRequest, SignerResponse>;
  getSignersByFid: handleUnaryCall<SignersByFidRequest, SignersByFidResponse>;
  getOnChainEvents: handleUnaryCall<OnChainEventRequest, OnChainEventResponse>;
  /**
   * Resolves the current channel registry owner address to an fid using the
   * shard-0 verification replica. The owner is the winning verifier of the
   * address in that replica (greatest ts_hash, ties to the lower fid);
   * verifications that exist only in pre-activation data-shard history do not
   * participate. This read is not consensus.
   *
   * An fid of 0 means the owner's verification has not landed on shard 0 yet.
   * It is a normal, expected state — not an error and not a lookup failure. The
   * registration exists and the owner address is known; nothing binds that
   * address to an fid on shard 0 yet, so there is no one to authorize.
   *
   * Two situations produce it: the address was never verified, or it was
   * verified only before activation, which the shard-0 admission timestamp
   * floor deliberately excludes. The node cannot tell them apart — both are the
   * same absent replica row — and does not need to, because the remedy is the
   * same either way. Surface fid 0 as "not yet", never as "abandoned".
   *
   * RE-VERIFICATION IS REQUIRED. There is no backfill of pre-activation
   * verification history into the shard-0 replica, so an owner who verified
   * their address before activation MUST submit a fresh verification of the
   * same address afterwards for their channel to become manageable. Until they
   * do, every permissioned write on the channel is rejected exactly as if it
   * were unclaimed. Clients should present fid 0 as an actionable "verify your
   * address to manage this channel" state rather than an error.
   *
   * Expiry is returned as-is and may be in the past. The registry contract
   * emits no onchain event when a lapsed registration's grace period ends, so
   * this endpoint reports the last known registration (owner address + expiry)
   * until a later registration supersedes it; it never computes grace or
   * release state. Callers interpret `expiry` themselves (e.g. against the
   * deployed grace period). NOT_FOUND is returned only for a channel key with
   * no registration record at all.
   */
  getChannelOwner: handleUnaryCall<ChannelOwnerRequest, ChannelOwnerResponse>;
  /**
   * Lists channels for a raw 20-byte EVM owner address, including lapsed
   * registrations (expiry in the past) until a later registration supersedes
   * them — see GetChannelOwner's expiry note; callers interpret `expiry`
   * themselves. Owner resolution uses the shard-0 verification replica, as in
   * GetChannelOwner.
   * This read is not consensus. `page_token` is opaque bytes; callers page until
   * `next_page_token` is unset, which marks the end of enumeration. A page that
   * lands exactly on the last entry may return a token that yields one final
   * empty page, so a present token means "page again", not "results guaranteed".
   */
  getChannelsByAddress: handleUnaryCall<ChannelsByAddressRequest, ChannelsResponse>;
  /**
   * Lists channels that currently resolve to `fid`, including lapsed
   * registrations (see GetChannelOwner's expiry note). The node must host the
   * fid's home shard to enumerate its verified addresses, following existing
   * fid-routed read behavior. The final owner-winner filter uses the shard-0
   * verification replica, as in GetChannelOwner. This read is not consensus.
   *
   * This is a joined read over the fid's verified EVM addresses and the channel
   * owner-address index. The verified addresses are enumerated in ascending
   * order, making the owner-address index key a globally ordered composite
   * cursor across the join. `page_token` is opaque bytes and the paging contract
   * is identical to GetChannelsByAddress: page until `next_page_token` is unset
   * (a boundary-aligned page may return one final empty page). There is no
   * `reverse` (addresses iterate ascending only).
   */
  getChannelsByFid: handleUnaryCall<ChannelsByFidRequest, ChannelsResponse>;
  /**
   * Channel-message reads use shard-0 stores. All channel_id values are the raw
   * 32-byte registry labels; any other width is INVALID_ARGUMENT, not NOT_FOUND.
   *
   * The five channel_id-keyed reads below require a registered channel and
   * return NOT_FOUND otherwise; a registered channel with no matching state
   * returns an empty/default response or page. GetChannelMembershipsByFid is
   * the exception: it is keyed by fid alone, performs no registration check,
   * and therefore never returns NOT_FOUND — it can list memberships for
   * channels the caller cannot look up individually. It and GetChannelMember
   * reject an fid that is zero or exceeds u32 with INVALID_ARGUMENT.
   *
   * Paging on the three list reads follows GetChannelsByAddress: `page_token`
   * is opaque bytes, page until `next_page_token` is unset, and a
   * boundary-aligned page may yield one final empty page. Unlike the reads
   * above, a token is scoped to the index that minted it — passing one channel's
   * token to another channel (or another fid's to GetChannelMembershipsByFid)
   * is INVALID_ARGUMENT rather than a silent cross-channel read. `page_size` is
   * clamped to the server maximum without signalling, and `page_size: 0` is
   * INVALID_ARGUMENT rather than an empty terminal page — omit it for the default.
   */
  getChannelMember: handleUnaryCall<ChannelMemberRequest, ChannelMemberResponse>;
  getChannelMembers: handleUnaryCall<ChannelMembersRequest, ChannelMembersResponse>;
  getChannelPin: handleUnaryCall<ChannelRequest, ChannelPinResponse>;
  getChannelModerations: handleUnaryCall<ChannelModerationsRequest, ChannelModerationsResponse>;
  getChannelMetadata: handleUnaryCall<ChannelRequest, ChannelMetadataResponse>;
  getChannelMembershipsByFid: handleUnaryCall<ChannelMembershipsByFidRequest, ChannelMembershipsResponse>;
  /**
   * Channel follows. Unlike everything above, these read DATA SHARDS, not shard 0:
   * a follow is an ordinary reaction living on its author's own shard (see
   * ChannelFollower in request_response.proto for the message shape and for the
   * pruning caveat).
   *
   * No registration check, deliberately, and so NEVER NOT_FOUND for an unknown
   * channel — only INVALID_ARGUMENT for a channel_id that is not 32 bytes.
   * Registration lives on shard 0, which a data-shard-only node need not host, and
   * a follow row can legitimately exist for a tokenId that was never minted;
   * returning NOT_FOUND would make GetChannelFollowerCount disagree with
   * IsFollowingChannel for the same channel. An unfollowed or unknown channel
   * returns an empty page and a count of zero.
   *
   * GetChannelFollowers and GetChannelFollowerCount FAN OUT across every shard,
   * because no single shard holds a channel's whole follower set. Two consequences:
   *
   *   * A node that does not host all shards returns FAILED_PRECONDITION rather
   *     than answering from the shards it has. A partial follower list is
   *     indistinguishable from a small one, so it must not be served silently.
   *   * `page_size` is per shard, so a page may hold up to page_size * num_shards
   *     entries, and `page_token` encodes one cursor per shard. A token is rejected
   *     with INVALID_ARGUMENT if its shard set does not match the node's. Page until
   *     `next_page_token` is unset; a boundary-aligned page may yield one final
   *     empty page. As above, `page_size: 0` is INVALID_ARGUMENT — omit it for the
   *     default.
   *
   * A summed count and an enumerated follower list are read from each shard at
   * slightly different instants, so under concurrent writes they can disagree by a
   * few entries. Neither is stale in itself; there is just no cross-shard snapshot.
   *
   * GetChannelFollows and IsFollowingChannel are keyed by fid, so they answer from
   * that fid's home shard alone and have none of the above caveats.
   */
  getChannelFollowers: handleUnaryCall<ChannelFollowersRequest, ChannelFollowersResponse>;
  getChannelFollowerCount: handleUnaryCall<ChannelFollowerCountRequest, ChannelFollowerCountResponse>;
  getChannelFollows: handleUnaryCall<ChannelFollowsRequest, ChannelFollowsResponse>;
  isFollowingChannel: handleUnaryCall<IsFollowingChannelRequest, IsFollowingChannelResponse>;
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
  getAllLendStorageMessagesByFid: handleUnaryCall<FidTimestampRequest, MessagesResponse>;
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
  submitBulkMessages(
    request: SubmitBulkMessagesRequest,
    callback: (error: ServiceError | null, response: SubmitBulkMessagesResponse) => void,
  ): ClientUnaryCall;
  submitBulkMessages(
    request: SubmitBulkMessagesRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: SubmitBulkMessagesResponse) => void,
  ): ClientUnaryCall;
  submitBulkMessages(
    request: SubmitBulkMessagesRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: SubmitBulkMessagesResponse) => void,
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
  getConnectedPeers(
    request: GetConnectedPeersRequest,
    callback: (error: ServiceError | null, response: GetConnectedPeersResponse) => void,
  ): ClientUnaryCall;
  getConnectedPeers(
    request: GetConnectedPeersRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetConnectedPeersResponse) => void,
  ): ClientUnaryCall;
  getConnectedPeers(
    request: GetConnectedPeersRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetConnectedPeersResponse) => void,
  ): ClientUnaryCall;
  /** Mesh health & topology: this node's local view of the gossip mesh. Admin-gated. */
  getMeshView(
    request: GetMeshViewRequest,
    callback: (error: ServiceError | null, response: MeshView) => void,
  ): ClientUnaryCall;
  getMeshView(
    request: GetMeshViewRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MeshView) => void,
  ): ClientUnaryCall;
  getMeshView(
    request: GetMeshViewRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MeshView) => void,
  ): ClientUnaryCall;
  /**
   * Network-wide topology: centralized crawl of connected validators over the
   * gossip port, aggregating each validator's local mesh view. Admin-gated.
   */
  getMeshTopology(
    request: GetMeshViewRequest,
    callback: (error: ServiceError | null, response: MeshTopology) => void,
  ): ClientUnaryCall;
  getMeshTopology(
    request: GetMeshViewRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MeshTopology) => void,
  ): ClientUnaryCall;
  getMeshTopology(
    request: GetMeshViewRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: MeshTopology) => void,
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
  /**
   * OnChain Events
   * DEPRECATED in favor of GetSigner (unified). Returns on-chain signer events
   * only — gasless / off-chain keys are not surfaced through this RPC.
   */
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
  /**
   * DEPRECATED in favor of GetSignersByFid (unified). Returns on-chain signer
   * events only — gasless / off-chain keys are not surfaced through this RPC.
   */
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
  /** Unified signer surface — returns both on-chain and off-chain (gasless) keys. */
  getSigner(
    request: SignerRequest,
    callback: (error: ServiceError | null, response: SignerResponse) => void,
  ): ClientUnaryCall;
  getSigner(
    request: SignerRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: SignerResponse) => void,
  ): ClientUnaryCall;
  getSigner(
    request: SignerRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: SignerResponse) => void,
  ): ClientUnaryCall;
  getSignersByFid(
    request: SignersByFidRequest,
    callback: (error: ServiceError | null, response: SignersByFidResponse) => void,
  ): ClientUnaryCall;
  getSignersByFid(
    request: SignersByFidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: SignersByFidResponse) => void,
  ): ClientUnaryCall;
  getSignersByFid(
    request: SignersByFidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: SignersByFidResponse) => void,
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
  /**
   * Resolves the current channel registry owner address to an fid using the
   * shard-0 verification replica. The owner is the winning verifier of the
   * address in that replica (greatest ts_hash, ties to the lower fid);
   * verifications that exist only in pre-activation data-shard history do not
   * participate. This read is not consensus.
   *
   * An fid of 0 means the owner's verification has not landed on shard 0 yet.
   * It is a normal, expected state — not an error and not a lookup failure. The
   * registration exists and the owner address is known; nothing binds that
   * address to an fid on shard 0 yet, so there is no one to authorize.
   *
   * Two situations produce it: the address was never verified, or it was
   * verified only before activation, which the shard-0 admission timestamp
   * floor deliberately excludes. The node cannot tell them apart — both are the
   * same absent replica row — and does not need to, because the remedy is the
   * same either way. Surface fid 0 as "not yet", never as "abandoned".
   *
   * RE-VERIFICATION IS REQUIRED. There is no backfill of pre-activation
   * verification history into the shard-0 replica, so an owner who verified
   * their address before activation MUST submit a fresh verification of the
   * same address afterwards for their channel to become manageable. Until they
   * do, every permissioned write on the channel is rejected exactly as if it
   * were unclaimed. Clients should present fid 0 as an actionable "verify your
   * address to manage this channel" state rather than an error.
   *
   * Expiry is returned as-is and may be in the past. The registry contract
   * emits no onchain event when a lapsed registration's grace period ends, so
   * this endpoint reports the last known registration (owner address + expiry)
   * until a later registration supersedes it; it never computes grace or
   * release state. Callers interpret `expiry` themselves (e.g. against the
   * deployed grace period). NOT_FOUND is returned only for a channel key with
   * no registration record at all.
   */
  getChannelOwner(
    request: ChannelOwnerRequest,
    callback: (error: ServiceError | null, response: ChannelOwnerResponse) => void,
  ): ClientUnaryCall;
  getChannelOwner(
    request: ChannelOwnerRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ChannelOwnerResponse) => void,
  ): ClientUnaryCall;
  getChannelOwner(
    request: ChannelOwnerRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ChannelOwnerResponse) => void,
  ): ClientUnaryCall;
  /**
   * Lists channels for a raw 20-byte EVM owner address, including lapsed
   * registrations (expiry in the past) until a later registration supersedes
   * them — see GetChannelOwner's expiry note; callers interpret `expiry`
   * themselves. Owner resolution uses the shard-0 verification replica, as in
   * GetChannelOwner.
   * This read is not consensus. `page_token` is opaque bytes; callers page until
   * `next_page_token` is unset, which marks the end of enumeration. A page that
   * lands exactly on the last entry may return a token that yields one final
   * empty page, so a present token means "page again", not "results guaranteed".
   */
  getChannelsByAddress(
    request: ChannelsByAddressRequest,
    callback: (error: ServiceError | null, response: ChannelsResponse) => void,
  ): ClientUnaryCall;
  getChannelsByAddress(
    request: ChannelsByAddressRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ChannelsResponse) => void,
  ): ClientUnaryCall;
  getChannelsByAddress(
    request: ChannelsByAddressRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ChannelsResponse) => void,
  ): ClientUnaryCall;
  /**
   * Lists channels that currently resolve to `fid`, including lapsed
   * registrations (see GetChannelOwner's expiry note). The node must host the
   * fid's home shard to enumerate its verified addresses, following existing
   * fid-routed read behavior. The final owner-winner filter uses the shard-0
   * verification replica, as in GetChannelOwner. This read is not consensus.
   *
   * This is a joined read over the fid's verified EVM addresses and the channel
   * owner-address index. The verified addresses are enumerated in ascending
   * order, making the owner-address index key a globally ordered composite
   * cursor across the join. `page_token` is opaque bytes and the paging contract
   * is identical to GetChannelsByAddress: page until `next_page_token` is unset
   * (a boundary-aligned page may return one final empty page). There is no
   * `reverse` (addresses iterate ascending only).
   */
  getChannelsByFid(
    request: ChannelsByFidRequest,
    callback: (error: ServiceError | null, response: ChannelsResponse) => void,
  ): ClientUnaryCall;
  getChannelsByFid(
    request: ChannelsByFidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ChannelsResponse) => void,
  ): ClientUnaryCall;
  getChannelsByFid(
    request: ChannelsByFidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ChannelsResponse) => void,
  ): ClientUnaryCall;
  /**
   * Channel-message reads use shard-0 stores. All channel_id values are the raw
   * 32-byte registry labels; any other width is INVALID_ARGUMENT, not NOT_FOUND.
   *
   * The five channel_id-keyed reads below require a registered channel and
   * return NOT_FOUND otherwise; a registered channel with no matching state
   * returns an empty/default response or page. GetChannelMembershipsByFid is
   * the exception: it is keyed by fid alone, performs no registration check,
   * and therefore never returns NOT_FOUND — it can list memberships for
   * channels the caller cannot look up individually. It and GetChannelMember
   * reject an fid that is zero or exceeds u32 with INVALID_ARGUMENT.
   *
   * Paging on the three list reads follows GetChannelsByAddress: `page_token`
   * is opaque bytes, page until `next_page_token` is unset, and a
   * boundary-aligned page may yield one final empty page. Unlike the reads
   * above, a token is scoped to the index that minted it — passing one channel's
   * token to another channel (or another fid's to GetChannelMembershipsByFid)
   * is INVALID_ARGUMENT rather than a silent cross-channel read. `page_size` is
   * clamped to the server maximum without signalling, and `page_size: 0` is
   * INVALID_ARGUMENT rather than an empty terminal page — omit it for the default.
   */
  getChannelMember(
    request: ChannelMemberRequest,
    callback: (error: ServiceError | null, response: ChannelMemberResponse) => void,
  ): ClientUnaryCall;
  getChannelMember(
    request: ChannelMemberRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ChannelMemberResponse) => void,
  ): ClientUnaryCall;
  getChannelMember(
    request: ChannelMemberRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ChannelMemberResponse) => void,
  ): ClientUnaryCall;
  getChannelMembers(
    request: ChannelMembersRequest,
    callback: (error: ServiceError | null, response: ChannelMembersResponse) => void,
  ): ClientUnaryCall;
  getChannelMembers(
    request: ChannelMembersRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ChannelMembersResponse) => void,
  ): ClientUnaryCall;
  getChannelMembers(
    request: ChannelMembersRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ChannelMembersResponse) => void,
  ): ClientUnaryCall;
  getChannelPin(
    request: ChannelRequest,
    callback: (error: ServiceError | null, response: ChannelPinResponse) => void,
  ): ClientUnaryCall;
  getChannelPin(
    request: ChannelRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ChannelPinResponse) => void,
  ): ClientUnaryCall;
  getChannelPin(
    request: ChannelRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ChannelPinResponse) => void,
  ): ClientUnaryCall;
  getChannelModerations(
    request: ChannelModerationsRequest,
    callback: (error: ServiceError | null, response: ChannelModerationsResponse) => void,
  ): ClientUnaryCall;
  getChannelModerations(
    request: ChannelModerationsRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ChannelModerationsResponse) => void,
  ): ClientUnaryCall;
  getChannelModerations(
    request: ChannelModerationsRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ChannelModerationsResponse) => void,
  ): ClientUnaryCall;
  getChannelMetadata(
    request: ChannelRequest,
    callback: (error: ServiceError | null, response: ChannelMetadataResponse) => void,
  ): ClientUnaryCall;
  getChannelMetadata(
    request: ChannelRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ChannelMetadataResponse) => void,
  ): ClientUnaryCall;
  getChannelMetadata(
    request: ChannelRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ChannelMetadataResponse) => void,
  ): ClientUnaryCall;
  getChannelMembershipsByFid(
    request: ChannelMembershipsByFidRequest,
    callback: (error: ServiceError | null, response: ChannelMembershipsResponse) => void,
  ): ClientUnaryCall;
  getChannelMembershipsByFid(
    request: ChannelMembershipsByFidRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ChannelMembershipsResponse) => void,
  ): ClientUnaryCall;
  getChannelMembershipsByFid(
    request: ChannelMembershipsByFidRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ChannelMembershipsResponse) => void,
  ): ClientUnaryCall;
  /**
   * Channel follows. Unlike everything above, these read DATA SHARDS, not shard 0:
   * a follow is an ordinary reaction living on its author's own shard (see
   * ChannelFollower in request_response.proto for the message shape and for the
   * pruning caveat).
   *
   * No registration check, deliberately, and so NEVER NOT_FOUND for an unknown
   * channel — only INVALID_ARGUMENT for a channel_id that is not 32 bytes.
   * Registration lives on shard 0, which a data-shard-only node need not host, and
   * a follow row can legitimately exist for a tokenId that was never minted;
   * returning NOT_FOUND would make GetChannelFollowerCount disagree with
   * IsFollowingChannel for the same channel. An unfollowed or unknown channel
   * returns an empty page and a count of zero.
   *
   * GetChannelFollowers and GetChannelFollowerCount FAN OUT across every shard,
   * because no single shard holds a channel's whole follower set. Two consequences:
   *
   *   * A node that does not host all shards returns FAILED_PRECONDITION rather
   *     than answering from the shards it has. A partial follower list is
   *     indistinguishable from a small one, so it must not be served silently.
   *   * `page_size` is per shard, so a page may hold up to page_size * num_shards
   *     entries, and `page_token` encodes one cursor per shard. A token is rejected
   *     with INVALID_ARGUMENT if its shard set does not match the node's. Page until
   *     `next_page_token` is unset; a boundary-aligned page may yield one final
   *     empty page. As above, `page_size: 0` is INVALID_ARGUMENT — omit it for the
   *     default.
   *
   * A summed count and an enumerated follower list are read from each shard at
   * slightly different instants, so under concurrent writes they can disagree by a
   * few entries. Neither is stale in itself; there is just no cross-shard snapshot.
   *
   * GetChannelFollows and IsFollowingChannel are keyed by fid, so they answer from
   * that fid's home shard alone and have none of the above caveats.
   */
  getChannelFollowers(
    request: ChannelFollowersRequest,
    callback: (error: ServiceError | null, response: ChannelFollowersResponse) => void,
  ): ClientUnaryCall;
  getChannelFollowers(
    request: ChannelFollowersRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ChannelFollowersResponse) => void,
  ): ClientUnaryCall;
  getChannelFollowers(
    request: ChannelFollowersRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ChannelFollowersResponse) => void,
  ): ClientUnaryCall;
  getChannelFollowerCount(
    request: ChannelFollowerCountRequest,
    callback: (error: ServiceError | null, response: ChannelFollowerCountResponse) => void,
  ): ClientUnaryCall;
  getChannelFollowerCount(
    request: ChannelFollowerCountRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ChannelFollowerCountResponse) => void,
  ): ClientUnaryCall;
  getChannelFollowerCount(
    request: ChannelFollowerCountRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ChannelFollowerCountResponse) => void,
  ): ClientUnaryCall;
  getChannelFollows(
    request: ChannelFollowsRequest,
    callback: (error: ServiceError | null, response: ChannelFollowsResponse) => void,
  ): ClientUnaryCall;
  getChannelFollows(
    request: ChannelFollowsRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: ChannelFollowsResponse) => void,
  ): ClientUnaryCall;
  getChannelFollows(
    request: ChannelFollowsRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: ChannelFollowsResponse) => void,
  ): ClientUnaryCall;
  isFollowingChannel(
    request: IsFollowingChannelRequest,
    callback: (error: ServiceError | null, response: IsFollowingChannelResponse) => void,
  ): ClientUnaryCall;
  isFollowingChannel(
    request: IsFollowingChannelRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: IsFollowingChannelResponse) => void,
  ): ClientUnaryCall;
  isFollowingChannel(
    request: IsFollowingChannelRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: IsFollowingChannelResponse) => void,
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
  getAllLendStorageMessagesByFid(
    request: FidTimestampRequest,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllLendStorageMessagesByFid(
    request: FidTimestampRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: MessagesResponse) => void,
  ): ClientUnaryCall;
  getAllLendStorageMessagesByFid(
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
