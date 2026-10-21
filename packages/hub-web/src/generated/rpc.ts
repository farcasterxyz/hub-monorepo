/* eslint-disable */
import grpcWeb from "@improbable-eng/grpc-web";
import { BrowserHeaders } from "browser-headers";
import { Observable } from "rxjs";
import { share } from "rxjs/operators";
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

export interface HubService {
  /** Write API */
  submitMessage(request: DeepPartial<Message>, metadata?: grpcWeb.grpc.Metadata): Promise<Message>;
  submitBulkMessages(
    request: DeepPartial<SubmitBulkMessagesRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<SubmitBulkMessagesResponse>;
  /** Validation Methods */
  validateMessage(request: DeepPartial<Message>, metadata?: grpcWeb.grpc.Metadata): Promise<ValidationResponse>;
  /** Block API */
  getBlocks(request: DeepPartial<BlocksRequest>, metadata?: grpcWeb.grpc.Metadata): Observable<Block>;
  getShardChunks(request: DeepPartial<ShardChunksRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<ShardChunksResponse>;
  getInfo(request: DeepPartial<GetInfoRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<GetInfoResponse>;
  getFids(request: DeepPartial<FidsRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<FidsResponse>;
  getConnectedPeers(
    request: DeepPartial<GetConnectedPeersRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<GetConnectedPeersResponse>;
  /** Mesh health & topology: this node's local view of the gossip mesh. Admin-gated. */
  getMeshView(request: DeepPartial<GetMeshViewRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MeshView>;
  /**
   * Network-wide topology: centralized crawl of connected validators over the
   * gossip port, aggregating each validator's local mesh view. Admin-gated.
   */
  getMeshTopology(request: DeepPartial<GetMeshViewRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MeshTopology>;
  /** Events */
  subscribe(request: DeepPartial<SubscribeRequest>, metadata?: grpcWeb.grpc.Metadata): Observable<HubEvent>;
  getEvent(request: DeepPartial<EventRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<HubEvent>;
  getEvents(request: DeepPartial<EventsRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<EventsResponse>;
  /** Casts */
  getCast(request: DeepPartial<CastId>, metadata?: grpcWeb.grpc.Metadata): Promise<Message>;
  getCastsByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse>;
  getCastsByParent(request: DeepPartial<CastsByParentRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse>;
  getCastsByMention(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse>;
  /** Reactions */
  getReaction(request: DeepPartial<ReactionRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message>;
  getReactionsByFid(request: DeepPartial<ReactionsByFidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse>;
  /** To be deprecated */
  getReactionsByCast(
    request: DeepPartial<ReactionsByTargetRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse>;
  getReactionsByTarget(
    request: DeepPartial<ReactionsByTargetRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse>;
  /** User Data */
  getUserData(request: DeepPartial<UserDataRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message>;
  getUserDataByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse>;
  /** Username Proof */
  getUsernameProof(request: DeepPartial<UsernameProofRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<UserNameProof>;
  getUserNameProofsByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<UsernameProofsResponse>;
  /** Verifications */
  getVerification(request: DeepPartial<VerificationRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message>;
  getVerificationsByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse>;
  /**
   * OnChain Events
   * DEPRECATED in favor of GetSigner (unified). Returns on-chain signer events
   * only — gasless / off-chain keys are not surfaced through this RPC.
   */
  getOnChainSigner(request: DeepPartial<SignerRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<OnChainEvent>;
  /**
   * DEPRECATED in favor of GetSignersByFid (unified). Returns on-chain signer
   * events only — gasless / off-chain keys are not surfaced through this RPC.
   */
  getOnChainSignersByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<OnChainEventResponse>;
  /** Unified signer surface — returns both on-chain and off-chain (gasless) keys. */
  getSigner(request: DeepPartial<SignerRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<SignerResponse>;
  getSignersByFid(request: DeepPartial<SignersByFidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<SignersByFidResponse>;
  getOnChainEvents(request: DeepPartial<OnChainEventRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<OnChainEventResponse>;
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
  getChannelOwner(request: DeepPartial<ChannelOwnerRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<ChannelOwnerResponse>;
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
    request: DeepPartial<ChannelsByAddressRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelsResponse>;
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
  getChannelsByFid(request: DeepPartial<ChannelsByFidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<ChannelsResponse>;
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
    request: DeepPartial<ChannelMemberRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelMemberResponse>;
  getChannelMembers(
    request: DeepPartial<ChannelMembersRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelMembersResponse>;
  getChannelPin(request: DeepPartial<ChannelRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<ChannelPinResponse>;
  getChannelModerations(
    request: DeepPartial<ChannelModerationsRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelModerationsResponse>;
  getChannelMetadata(request: DeepPartial<ChannelRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<ChannelMetadataResponse>;
  getChannelMembershipsByFid(
    request: DeepPartial<ChannelMembershipsByFidRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelMembershipsResponse>;
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
    request: DeepPartial<ChannelFollowersRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelFollowersResponse>;
  getChannelFollowerCount(
    request: DeepPartial<ChannelFollowerCountRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelFollowerCountResponse>;
  getChannelFollows(
    request: DeepPartial<ChannelFollowsRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelFollowsResponse>;
  isFollowingChannel(
    request: DeepPartial<IsFollowingChannelRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<IsFollowingChannelResponse>;
  getIdRegistryOnChainEvent(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<OnChainEvent>;
  getIdRegistryOnChainEventByAddress(
    request: DeepPartial<IdRegistryEventByAddressRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<OnChainEvent>;
  getCurrentStorageLimitsByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<StorageLimitsResponse>;
  getFidAddressType(
    request: DeepPartial<FidAddressTypeRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<FidAddressTypeResponse>;
  /** Links */
  getLink(request: DeepPartial<LinkRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message>;
  getLinksByFid(request: DeepPartial<LinksByFidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse>;
  getLinksByTarget(request: DeepPartial<LinksByTargetRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse>;
  getLinkCompactStateMessageByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse>;
  /** Bulk Methods */
  getAllCastMessagesByFid(
    request: DeepPartial<FidTimestampRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse>;
  getAllReactionMessagesByFid(
    request: DeepPartial<FidTimestampRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse>;
  getAllVerificationMessagesByFid(
    request: DeepPartial<FidTimestampRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse>;
  getAllUserDataMessagesByFid(
    request: DeepPartial<FidTimestampRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse>;
  getAllLinkMessagesByFid(
    request: DeepPartial<FidTimestampRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse>;
  getAllLendStorageMessagesByFid(
    request: DeepPartial<FidTimestampRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse>;
  getTrieMetadataByPrefix(
    request: DeepPartial<TrieNodeMetadataRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<TrieNodeMetadataResponse>;
}

export class HubServiceClientImpl implements HubService {
  private readonly rpc: Rpc;

  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.submitMessage = this.submitMessage.bind(this);
    this.submitBulkMessages = this.submitBulkMessages.bind(this);
    this.validateMessage = this.validateMessage.bind(this);
    this.getBlocks = this.getBlocks.bind(this);
    this.getShardChunks = this.getShardChunks.bind(this);
    this.getInfo = this.getInfo.bind(this);
    this.getFids = this.getFids.bind(this);
    this.getConnectedPeers = this.getConnectedPeers.bind(this);
    this.getMeshView = this.getMeshView.bind(this);
    this.getMeshTopology = this.getMeshTopology.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.getEvent = this.getEvent.bind(this);
    this.getEvents = this.getEvents.bind(this);
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
    this.getUsernameProof = this.getUsernameProof.bind(this);
    this.getUserNameProofsByFid = this.getUserNameProofsByFid.bind(this);
    this.getVerification = this.getVerification.bind(this);
    this.getVerificationsByFid = this.getVerificationsByFid.bind(this);
    this.getOnChainSigner = this.getOnChainSigner.bind(this);
    this.getOnChainSignersByFid = this.getOnChainSignersByFid.bind(this);
    this.getSigner = this.getSigner.bind(this);
    this.getSignersByFid = this.getSignersByFid.bind(this);
    this.getOnChainEvents = this.getOnChainEvents.bind(this);
    this.getChannelOwner = this.getChannelOwner.bind(this);
    this.getChannelsByAddress = this.getChannelsByAddress.bind(this);
    this.getChannelsByFid = this.getChannelsByFid.bind(this);
    this.getChannelMember = this.getChannelMember.bind(this);
    this.getChannelMembers = this.getChannelMembers.bind(this);
    this.getChannelPin = this.getChannelPin.bind(this);
    this.getChannelModerations = this.getChannelModerations.bind(this);
    this.getChannelMetadata = this.getChannelMetadata.bind(this);
    this.getChannelMembershipsByFid = this.getChannelMembershipsByFid.bind(this);
    this.getChannelFollowers = this.getChannelFollowers.bind(this);
    this.getChannelFollowerCount = this.getChannelFollowerCount.bind(this);
    this.getChannelFollows = this.getChannelFollows.bind(this);
    this.isFollowingChannel = this.isFollowingChannel.bind(this);
    this.getIdRegistryOnChainEvent = this.getIdRegistryOnChainEvent.bind(this);
    this.getIdRegistryOnChainEventByAddress = this.getIdRegistryOnChainEventByAddress.bind(this);
    this.getCurrentStorageLimitsByFid = this.getCurrentStorageLimitsByFid.bind(this);
    this.getFidAddressType = this.getFidAddressType.bind(this);
    this.getLink = this.getLink.bind(this);
    this.getLinksByFid = this.getLinksByFid.bind(this);
    this.getLinksByTarget = this.getLinksByTarget.bind(this);
    this.getLinkCompactStateMessageByFid = this.getLinkCompactStateMessageByFid.bind(this);
    this.getAllCastMessagesByFid = this.getAllCastMessagesByFid.bind(this);
    this.getAllReactionMessagesByFid = this.getAllReactionMessagesByFid.bind(this);
    this.getAllVerificationMessagesByFid = this.getAllVerificationMessagesByFid.bind(this);
    this.getAllUserDataMessagesByFid = this.getAllUserDataMessagesByFid.bind(this);
    this.getAllLinkMessagesByFid = this.getAllLinkMessagesByFid.bind(this);
    this.getAllLendStorageMessagesByFid = this.getAllLendStorageMessagesByFid.bind(this);
    this.getTrieMetadataByPrefix = this.getTrieMetadataByPrefix.bind(this);
  }

  submitMessage(request: DeepPartial<Message>, metadata?: grpcWeb.grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceSubmitMessageDesc, Message.fromPartial(request), metadata);
  }

  submitBulkMessages(
    request: DeepPartial<SubmitBulkMessagesRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<SubmitBulkMessagesResponse> {
    return this.rpc.unary(HubServiceSubmitBulkMessagesDesc, SubmitBulkMessagesRequest.fromPartial(request), metadata);
  }

  validateMessage(request: DeepPartial<Message>, metadata?: grpcWeb.grpc.Metadata): Promise<ValidationResponse> {
    return this.rpc.unary(HubServiceValidateMessageDesc, Message.fromPartial(request), metadata);
  }

  getBlocks(request: DeepPartial<BlocksRequest>, metadata?: grpcWeb.grpc.Metadata): Observable<Block> {
    return this.rpc.invoke(HubServiceGetBlocksDesc, BlocksRequest.fromPartial(request), metadata);
  }

  getShardChunks(request: DeepPartial<ShardChunksRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<ShardChunksResponse> {
    return this.rpc.unary(HubServiceGetShardChunksDesc, ShardChunksRequest.fromPartial(request), metadata);
  }

  getInfo(request: DeepPartial<GetInfoRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<GetInfoResponse> {
    return this.rpc.unary(HubServiceGetInfoDesc, GetInfoRequest.fromPartial(request), metadata);
  }

  getFids(request: DeepPartial<FidsRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<FidsResponse> {
    return this.rpc.unary(HubServiceGetFidsDesc, FidsRequest.fromPartial(request), metadata);
  }

  getConnectedPeers(
    request: DeepPartial<GetConnectedPeersRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<GetConnectedPeersResponse> {
    return this.rpc.unary(HubServiceGetConnectedPeersDesc, GetConnectedPeersRequest.fromPartial(request), metadata);
  }

  getMeshView(request: DeepPartial<GetMeshViewRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MeshView> {
    return this.rpc.unary(HubServiceGetMeshViewDesc, GetMeshViewRequest.fromPartial(request), metadata);
  }

  getMeshTopology(request: DeepPartial<GetMeshViewRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MeshTopology> {
    return this.rpc.unary(HubServiceGetMeshTopologyDesc, GetMeshViewRequest.fromPartial(request), metadata);
  }

  subscribe(request: DeepPartial<SubscribeRequest>, metadata?: grpcWeb.grpc.Metadata): Observable<HubEvent> {
    return this.rpc.invoke(HubServiceSubscribeDesc, SubscribeRequest.fromPartial(request), metadata);
  }

  getEvent(request: DeepPartial<EventRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<HubEvent> {
    return this.rpc.unary(HubServiceGetEventDesc, EventRequest.fromPartial(request), metadata);
  }

  getEvents(request: DeepPartial<EventsRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<EventsResponse> {
    return this.rpc.unary(HubServiceGetEventsDesc, EventsRequest.fromPartial(request), metadata);
  }

  getCast(request: DeepPartial<CastId>, metadata?: grpcWeb.grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetCastDesc, CastId.fromPartial(request), metadata);
  }

  getCastsByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetCastsByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getCastsByParent(request: DeepPartial<CastsByParentRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetCastsByParentDesc, CastsByParentRequest.fromPartial(request), metadata);
  }

  getCastsByMention(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetCastsByMentionDesc, FidRequest.fromPartial(request), metadata);
  }

  getReaction(request: DeepPartial<ReactionRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetReactionDesc, ReactionRequest.fromPartial(request), metadata);
  }

  getReactionsByFid(request: DeepPartial<ReactionsByFidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetReactionsByFidDesc, ReactionsByFidRequest.fromPartial(request), metadata);
  }

  getReactionsByCast(
    request: DeepPartial<ReactionsByTargetRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetReactionsByCastDesc, ReactionsByTargetRequest.fromPartial(request), metadata);
  }

  getReactionsByTarget(
    request: DeepPartial<ReactionsByTargetRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetReactionsByTargetDesc, ReactionsByTargetRequest.fromPartial(request), metadata);
  }

  getUserData(request: DeepPartial<UserDataRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetUserDataDesc, UserDataRequest.fromPartial(request), metadata);
  }

  getUserDataByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetUserDataByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getUsernameProof(request: DeepPartial<UsernameProofRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<UserNameProof> {
    return this.rpc.unary(HubServiceGetUsernameProofDesc, UsernameProofRequest.fromPartial(request), metadata);
  }

  getUserNameProofsByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<UsernameProofsResponse> {
    return this.rpc.unary(HubServiceGetUserNameProofsByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getVerification(request: DeepPartial<VerificationRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetVerificationDesc, VerificationRequest.fromPartial(request), metadata);
  }

  getVerificationsByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetVerificationsByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getOnChainSigner(request: DeepPartial<SignerRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<OnChainEvent> {
    return this.rpc.unary(HubServiceGetOnChainSignerDesc, SignerRequest.fromPartial(request), metadata);
  }

  getOnChainSignersByFid(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<OnChainEventResponse> {
    return this.rpc.unary(HubServiceGetOnChainSignersByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getSigner(request: DeepPartial<SignerRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<SignerResponse> {
    return this.rpc.unary(HubServiceGetSignerDesc, SignerRequest.fromPartial(request), metadata);
  }

  getSignersByFid(request: DeepPartial<SignersByFidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<SignersByFidResponse> {
    return this.rpc.unary(HubServiceGetSignersByFidDesc, SignersByFidRequest.fromPartial(request), metadata);
  }

  getOnChainEvents(request: DeepPartial<OnChainEventRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<OnChainEventResponse> {
    return this.rpc.unary(HubServiceGetOnChainEventsDesc, OnChainEventRequest.fromPartial(request), metadata);
  }

  getChannelOwner(request: DeepPartial<ChannelOwnerRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<ChannelOwnerResponse> {
    return this.rpc.unary(HubServiceGetChannelOwnerDesc, ChannelOwnerRequest.fromPartial(request), metadata);
  }

  getChannelsByAddress(
    request: DeepPartial<ChannelsByAddressRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelsResponse> {
    return this.rpc.unary(HubServiceGetChannelsByAddressDesc, ChannelsByAddressRequest.fromPartial(request), metadata);
  }

  getChannelsByFid(request: DeepPartial<ChannelsByFidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<ChannelsResponse> {
    return this.rpc.unary(HubServiceGetChannelsByFidDesc, ChannelsByFidRequest.fromPartial(request), metadata);
  }

  getChannelMember(
    request: DeepPartial<ChannelMemberRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelMemberResponse> {
    return this.rpc.unary(HubServiceGetChannelMemberDesc, ChannelMemberRequest.fromPartial(request), metadata);
  }

  getChannelMembers(
    request: DeepPartial<ChannelMembersRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelMembersResponse> {
    return this.rpc.unary(HubServiceGetChannelMembersDesc, ChannelMembersRequest.fromPartial(request), metadata);
  }

  getChannelPin(request: DeepPartial<ChannelRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<ChannelPinResponse> {
    return this.rpc.unary(HubServiceGetChannelPinDesc, ChannelRequest.fromPartial(request), metadata);
  }

  getChannelModerations(
    request: DeepPartial<ChannelModerationsRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelModerationsResponse> {
    return this.rpc.unary(
      HubServiceGetChannelModerationsDesc,
      ChannelModerationsRequest.fromPartial(request),
      metadata,
    );
  }

  getChannelMetadata(request: DeepPartial<ChannelRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<ChannelMetadataResponse> {
    return this.rpc.unary(HubServiceGetChannelMetadataDesc, ChannelRequest.fromPartial(request), metadata);
  }

  getChannelMembershipsByFid(
    request: DeepPartial<ChannelMembershipsByFidRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelMembershipsResponse> {
    return this.rpc.unary(
      HubServiceGetChannelMembershipsByFidDesc,
      ChannelMembershipsByFidRequest.fromPartial(request),
      metadata,
    );
  }

  getChannelFollowers(
    request: DeepPartial<ChannelFollowersRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelFollowersResponse> {
    return this.rpc.unary(HubServiceGetChannelFollowersDesc, ChannelFollowersRequest.fromPartial(request), metadata);
  }

  getChannelFollowerCount(
    request: DeepPartial<ChannelFollowerCountRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelFollowerCountResponse> {
    return this.rpc.unary(
      HubServiceGetChannelFollowerCountDesc,
      ChannelFollowerCountRequest.fromPartial(request),
      metadata,
    );
  }

  getChannelFollows(
    request: DeepPartial<ChannelFollowsRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<ChannelFollowsResponse> {
    return this.rpc.unary(HubServiceGetChannelFollowsDesc, ChannelFollowsRequest.fromPartial(request), metadata);
  }

  isFollowingChannel(
    request: DeepPartial<IsFollowingChannelRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<IsFollowingChannelResponse> {
    return this.rpc.unary(HubServiceIsFollowingChannelDesc, IsFollowingChannelRequest.fromPartial(request), metadata);
  }

  getIdRegistryOnChainEvent(request: DeepPartial<FidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<OnChainEvent> {
    return this.rpc.unary(HubServiceGetIdRegistryOnChainEventDesc, FidRequest.fromPartial(request), metadata);
  }

  getIdRegistryOnChainEventByAddress(
    request: DeepPartial<IdRegistryEventByAddressRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<OnChainEvent> {
    return this.rpc.unary(
      HubServiceGetIdRegistryOnChainEventByAddressDesc,
      IdRegistryEventByAddressRequest.fromPartial(request),
      metadata,
    );
  }

  getCurrentStorageLimitsByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<StorageLimitsResponse> {
    return this.rpc.unary(HubServiceGetCurrentStorageLimitsByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getFidAddressType(
    request: DeepPartial<FidAddressTypeRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<FidAddressTypeResponse> {
    return this.rpc.unary(HubServiceGetFidAddressTypeDesc, FidAddressTypeRequest.fromPartial(request), metadata);
  }

  getLink(request: DeepPartial<LinkRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<Message> {
    return this.rpc.unary(HubServiceGetLinkDesc, LinkRequest.fromPartial(request), metadata);
  }

  getLinksByFid(request: DeepPartial<LinksByFidRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetLinksByFidDesc, LinksByFidRequest.fromPartial(request), metadata);
  }

  getLinksByTarget(request: DeepPartial<LinksByTargetRequest>, metadata?: grpcWeb.grpc.Metadata): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetLinksByTargetDesc, LinksByTargetRequest.fromPartial(request), metadata);
  }

  getLinkCompactStateMessageByFid(
    request: DeepPartial<FidRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetLinkCompactStateMessageByFidDesc, FidRequest.fromPartial(request), metadata);
  }

  getAllCastMessagesByFid(
    request: DeepPartial<FidTimestampRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllCastMessagesByFidDesc, FidTimestampRequest.fromPartial(request), metadata);
  }

  getAllReactionMessagesByFid(
    request: DeepPartial<FidTimestampRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse> {
    return this.rpc.unary(
      HubServiceGetAllReactionMessagesByFidDesc,
      FidTimestampRequest.fromPartial(request),
      metadata,
    );
  }

  getAllVerificationMessagesByFid(
    request: DeepPartial<FidTimestampRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse> {
    return this.rpc.unary(
      HubServiceGetAllVerificationMessagesByFidDesc,
      FidTimestampRequest.fromPartial(request),
      metadata,
    );
  }

  getAllUserDataMessagesByFid(
    request: DeepPartial<FidTimestampRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse> {
    return this.rpc.unary(
      HubServiceGetAllUserDataMessagesByFidDesc,
      FidTimestampRequest.fromPartial(request),
      metadata,
    );
  }

  getAllLinkMessagesByFid(
    request: DeepPartial<FidTimestampRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse> {
    return this.rpc.unary(HubServiceGetAllLinkMessagesByFidDesc, FidTimestampRequest.fromPartial(request), metadata);
  }

  getAllLendStorageMessagesByFid(
    request: DeepPartial<FidTimestampRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<MessagesResponse> {
    return this.rpc.unary(
      HubServiceGetAllLendStorageMessagesByFidDesc,
      FidTimestampRequest.fromPartial(request),
      metadata,
    );
  }

  getTrieMetadataByPrefix(
    request: DeepPartial<TrieNodeMetadataRequest>,
    metadata?: grpcWeb.grpc.Metadata,
  ): Promise<TrieNodeMetadataResponse> {
    return this.rpc.unary(
      HubServiceGetTrieMetadataByPrefixDesc,
      TrieNodeMetadataRequest.fromPartial(request),
      metadata,
    );
  }
}

export const HubServiceDesc = { serviceName: "HubService" };

export const HubServiceSubmitMessageDesc: UnaryMethodDefinitionish = {
  methodName: "SubmitMessage",
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

export const HubServiceSubmitBulkMessagesDesc: UnaryMethodDefinitionish = {
  methodName: "SubmitBulkMessages",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return SubmitBulkMessagesRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = SubmitBulkMessagesResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceValidateMessageDesc: UnaryMethodDefinitionish = {
  methodName: "ValidateMessage",
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
      const value = ValidationResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetBlocksDesc: UnaryMethodDefinitionish = {
  methodName: "GetBlocks",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: true,
  requestType: {
    serializeBinary() {
      return BlocksRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = Block.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetShardChunksDesc: UnaryMethodDefinitionish = {
  methodName: "GetShardChunks",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ShardChunksRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = ShardChunksResponse.decode(data);
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
  methodName: "GetInfo",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return GetInfoRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = GetInfoResponse.decode(data);
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
  methodName: "GetFids",
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

export const HubServiceGetConnectedPeersDesc: UnaryMethodDefinitionish = {
  methodName: "GetConnectedPeers",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return GetConnectedPeersRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = GetConnectedPeersResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetMeshViewDesc: UnaryMethodDefinitionish = {
  methodName: "GetMeshView",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return GetMeshViewRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MeshView.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetMeshTopologyDesc: UnaryMethodDefinitionish = {
  methodName: "GetMeshTopology",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return GetMeshViewRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = MeshTopology.decode(data);
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
  methodName: "Subscribe",
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
  methodName: "GetEvent",
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

export const HubServiceGetEventsDesc: UnaryMethodDefinitionish = {
  methodName: "GetEvents",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return EventsRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = EventsResponse.decode(data);
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
  methodName: "GetCast",
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
  methodName: "GetCastsByFid",
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
  methodName: "GetCastsByParent",
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
  methodName: "GetCastsByMention",
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
  methodName: "GetReaction",
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
  methodName: "GetReactionsByFid",
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
  methodName: "GetReactionsByCast",
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
  methodName: "GetReactionsByTarget",
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
  methodName: "GetUserData",
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
  methodName: "GetUserDataByFid",
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

export const HubServiceGetUsernameProofDesc: UnaryMethodDefinitionish = {
  methodName: "GetUsernameProof",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return UsernameProofRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = UserNameProof.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetUserNameProofsByFidDesc: UnaryMethodDefinitionish = {
  methodName: "GetUserNameProofsByFid",
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
      const value = UsernameProofsResponse.decode(data);
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
  methodName: "GetVerification",
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
  methodName: "GetVerificationsByFid",
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

export const HubServiceGetOnChainSignerDesc: UnaryMethodDefinitionish = {
  methodName: "GetOnChainSigner",
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
      const value = OnChainEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetOnChainSignersByFidDesc: UnaryMethodDefinitionish = {
  methodName: "GetOnChainSignersByFid",
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
      const value = OnChainEventResponse.decode(data);
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
  methodName: "GetSigner",
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
      const value = SignerResponse.decode(data);
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
  methodName: "GetSignersByFid",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return SignersByFidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = SignersByFidResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetOnChainEventsDesc: UnaryMethodDefinitionish = {
  methodName: "GetOnChainEvents",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return OnChainEventRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = OnChainEventResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetChannelOwnerDesc: UnaryMethodDefinitionish = {
  methodName: "GetChannelOwner",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ChannelOwnerRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = ChannelOwnerResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetChannelsByAddressDesc: UnaryMethodDefinitionish = {
  methodName: "GetChannelsByAddress",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ChannelsByAddressRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = ChannelsResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetChannelsByFidDesc: UnaryMethodDefinitionish = {
  methodName: "GetChannelsByFid",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ChannelsByFidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = ChannelsResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetChannelMemberDesc: UnaryMethodDefinitionish = {
  methodName: "GetChannelMember",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ChannelMemberRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = ChannelMemberResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetChannelMembersDesc: UnaryMethodDefinitionish = {
  methodName: "GetChannelMembers",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ChannelMembersRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = ChannelMembersResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetChannelPinDesc: UnaryMethodDefinitionish = {
  methodName: "GetChannelPin",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ChannelRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = ChannelPinResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetChannelModerationsDesc: UnaryMethodDefinitionish = {
  methodName: "GetChannelModerations",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ChannelModerationsRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = ChannelModerationsResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetChannelMetadataDesc: UnaryMethodDefinitionish = {
  methodName: "GetChannelMetadata",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ChannelRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = ChannelMetadataResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetChannelMembershipsByFidDesc: UnaryMethodDefinitionish = {
  methodName: "GetChannelMembershipsByFid",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ChannelMembershipsByFidRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = ChannelMembershipsResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetChannelFollowersDesc: UnaryMethodDefinitionish = {
  methodName: "GetChannelFollowers",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ChannelFollowersRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = ChannelFollowersResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetChannelFollowerCountDesc: UnaryMethodDefinitionish = {
  methodName: "GetChannelFollowerCount",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ChannelFollowerCountRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = ChannelFollowerCountResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetChannelFollowsDesc: UnaryMethodDefinitionish = {
  methodName: "GetChannelFollows",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return ChannelFollowsRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = ChannelFollowsResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceIsFollowingChannelDesc: UnaryMethodDefinitionish = {
  methodName: "IsFollowingChannel",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return IsFollowingChannelRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = IsFollowingChannelResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetIdRegistryOnChainEventDesc: UnaryMethodDefinitionish = {
  methodName: "GetIdRegistryOnChainEvent",
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
      const value = OnChainEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetIdRegistryOnChainEventByAddressDesc: UnaryMethodDefinitionish = {
  methodName: "GetIdRegistryOnChainEventByAddress",
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
      const value = OnChainEvent.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetCurrentStorageLimitsByFidDesc: UnaryMethodDefinitionish = {
  methodName: "GetCurrentStorageLimitsByFid",
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
      const value = StorageLimitsResponse.decode(data);
      return {
        ...value,
        toObject() {
          return value;
        },
      };
    },
  } as any,
};

export const HubServiceGetFidAddressTypeDesc: UnaryMethodDefinitionish = {
  methodName: "GetFidAddressType",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidAddressTypeRequest.encode(this).finish();
    },
  } as any,
  responseType: {
    deserializeBinary(data: Uint8Array) {
      const value = FidAddressTypeResponse.decode(data);
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
  methodName: "GetLink",
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
  methodName: "GetLinksByFid",
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
  methodName: "GetLinksByTarget",
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

export const HubServiceGetLinkCompactStateMessageByFidDesc: UnaryMethodDefinitionish = {
  methodName: "GetLinkCompactStateMessageByFid",
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

export const HubServiceGetAllCastMessagesByFidDesc: UnaryMethodDefinitionish = {
  methodName: "GetAllCastMessagesByFid",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidTimestampRequest.encode(this).finish();
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
  methodName: "GetAllReactionMessagesByFid",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidTimestampRequest.encode(this).finish();
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
  methodName: "GetAllVerificationMessagesByFid",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidTimestampRequest.encode(this).finish();
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
  methodName: "GetAllUserDataMessagesByFid",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidTimestampRequest.encode(this).finish();
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
  methodName: "GetAllLinkMessagesByFid",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidTimestampRequest.encode(this).finish();
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

export const HubServiceGetAllLendStorageMessagesByFidDesc: UnaryMethodDefinitionish = {
  methodName: "GetAllLendStorageMessagesByFid",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return FidTimestampRequest.encode(this).finish();
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

export const HubServiceGetTrieMetadataByPrefixDesc: UnaryMethodDefinitionish = {
  methodName: "GetTrieMetadataByPrefix",
  service: HubServiceDesc,
  requestStream: false,
  responseStream: false,
  requestType: {
    serializeBinary() {
      return TrieNodeMetadataRequest.encode(this).finish();
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

interface UnaryMethodDefinitionishR extends grpcWeb.grpc.UnaryMethodDefinition<any, any> {
  requestStream: any;
  responseStream: any;
}

type UnaryMethodDefinitionish = UnaryMethodDefinitionishR;

interface Rpc {
  unary<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    request: any,
    metadata: grpcWeb.grpc.Metadata | undefined,
  ): Promise<any>;
  invoke<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    request: any,
    metadata: grpcWeb.grpc.Metadata | undefined,
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
    },
  ) {
    this.host = host;
    this.options = options;
  }

  unary<T extends UnaryMethodDefinitionish>(
    methodDesc: T,
    _request: any,
    metadata: grpcWeb.grpc.Metadata | undefined,
  ): Promise<any> {
    const request = { ..._request, ...methodDesc.requestType };
    const maybeCombinedMetadata = metadata && this.options.metadata
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
    metadata: grpcWeb.grpc.Metadata | undefined,
  ): Observable<any> {
    const upStreamCodes = this.options.upStreamRetryCodes || [];
    const DEFAULT_TIMEOUT_TIME: number = 3_000;
    const request = { ..._request, ...methodDesc.requestType };
    const maybeCombinedMetadata = metadata && this.options.metadata
      ? new BrowserHeaders({ ...this.options?.metadata.headersMap, ...metadata?.headersMap })
      : metadata || this.options.metadata;
    return new Observable((observer) => {
      const upStream = (() => {
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
      });
      upStream();
    }).pipe(share());
  }
}

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

export class GrpcWebError extends tsProtoGlobalThis.Error {
  constructor(message: string, public code: grpcWeb.grpc.Code, public metadata: grpcWeb.grpc.Metadata) {
    super(message);
  }
}
