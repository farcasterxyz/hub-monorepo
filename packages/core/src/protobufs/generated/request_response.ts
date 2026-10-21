/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { ShardChunk } from "./blocks";
import { HubEvent, HubEventType, hubEventTypeFromJSON, hubEventTypeToJSON } from "./hub_event";
import {
  CastId,
  CastingMode,
  castingModeFromJSON,
  castingModeToJSON,
  ChannelModerateAction,
  channelModerateActionFromJSON,
  channelModerateActionToJSON,
  FarcasterNetwork,
  farcasterNetworkFromJSON,
  farcasterNetworkToJSON,
  MembershipMode,
  membershipModeFromJSON,
  membershipModeToJSON,
  Message,
  ReactionType,
  reactionTypeFromJSON,
  reactionTypeToJSON,
  StorageUnitType,
  storageUnitTypeFromJSON,
  storageUnitTypeToJSON,
  UserDataType,
  userDataTypeFromJSON,
  userDataTypeToJSON,
} from "./message";
import {
  OnChainEvent,
  OnChainEventType,
  onChainEventTypeFromJSON,
  onChainEventTypeToJSON,
  TierType,
  tierTypeFromJSON,
  tierTypeToJSON,
} from "./onchain_event";
import { UserNameProof } from "./username_proof";

export enum ChannelMemberState {
  NONE = 0,
  MEMBER = 1,
  MODERATOR = 2,
  REMOVED = 3,
  BANNED = 4,
}

export function channelMemberStateFromJSON(object: any): ChannelMemberState {
  switch (object) {
    case 0:
    case "CHANNEL_MEMBER_STATE_NONE":
      return ChannelMemberState.NONE;
    case 1:
    case "CHANNEL_MEMBER_STATE_MEMBER":
      return ChannelMemberState.MEMBER;
    case 2:
    case "CHANNEL_MEMBER_STATE_MODERATOR":
      return ChannelMemberState.MODERATOR;
    case 3:
    case "CHANNEL_MEMBER_STATE_REMOVED":
      return ChannelMemberState.REMOVED;
    case 4:
    case "CHANNEL_MEMBER_STATE_BANNED":
      return ChannelMemberState.BANNED;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum ChannelMemberState");
  }
}

export function channelMemberStateToJSON(object: ChannelMemberState): string {
  switch (object) {
    case ChannelMemberState.NONE:
      return "CHANNEL_MEMBER_STATE_NONE";
    case ChannelMemberState.MEMBER:
      return "CHANNEL_MEMBER_STATE_MEMBER";
    case ChannelMemberState.MODERATOR:
      return "CHANNEL_MEMBER_STATE_MODERATOR";
    case ChannelMemberState.REMOVED:
      return "CHANNEL_MEMBER_STATE_REMOVED";
    case ChannelMemberState.BANNED:
      return "CHANNEL_MEMBER_STATE_BANNED";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum ChannelMemberState");
  }
}

export enum StoreType {
  NONE = 0,
  CASTS = 1,
  LINKS = 2,
  REACTIONS = 3,
  USER_DATA = 4,
  VERIFICATIONS = 5,
  USERNAME_PROOFS = 6,
  STORAGE_LENDS = 7,
}

export function storeTypeFromJSON(object: any): StoreType {
  switch (object) {
    case 0:
    case "STORE_TYPE_NONE":
      return StoreType.NONE;
    case 1:
    case "STORE_TYPE_CASTS":
      return StoreType.CASTS;
    case 2:
    case "STORE_TYPE_LINKS":
      return StoreType.LINKS;
    case 3:
    case "STORE_TYPE_REACTIONS":
      return StoreType.REACTIONS;
    case 4:
    case "STORE_TYPE_USER_DATA":
      return StoreType.USER_DATA;
    case 5:
    case "STORE_TYPE_VERIFICATIONS":
      return StoreType.VERIFICATIONS;
    case 6:
    case "STORE_TYPE_USERNAME_PROOFS":
      return StoreType.USERNAME_PROOFS;
    case 7:
    case "STORE_TYPE_STORAGE_LENDS":
      return StoreType.STORAGE_LENDS;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum StoreType");
  }
}

export function storeTypeToJSON(object: StoreType): string {
  switch (object) {
    case StoreType.NONE:
      return "STORE_TYPE_NONE";
    case StoreType.CASTS:
      return "STORE_TYPE_CASTS";
    case StoreType.LINKS:
      return "STORE_TYPE_LINKS";
    case StoreType.REACTIONS:
      return "STORE_TYPE_REACTIONS";
    case StoreType.USER_DATA:
      return "STORE_TYPE_USER_DATA";
    case StoreType.VERIFICATIONS:
      return "STORE_TYPE_VERIFICATIONS";
    case StoreType.USERNAME_PROOFS:
      return "STORE_TYPE_USERNAME_PROOFS";
    case StoreType.STORAGE_LENDS:
      return "STORE_TYPE_STORAGE_LENDS";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum StoreType");
  }
}

/** Source of a signer record returned by GetSigner / GetSignersByFid. */
export enum SignerSource {
  NONE = 0,
  ONCHAIN = 1,
  /** OFFCHAIN - gasless / KEY_ADD */
  OFFCHAIN = 2,
}

export function signerSourceFromJSON(object: any): SignerSource {
  switch (object) {
    case 0:
    case "SIGNER_SOURCE_NONE":
      return SignerSource.NONE;
    case 1:
    case "SIGNER_SOURCE_ONCHAIN":
      return SignerSource.ONCHAIN;
    case 2:
    case "SIGNER_SOURCE_OFFCHAIN":
      return SignerSource.OFFCHAIN;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum SignerSource");
  }
}

export function signerSourceToJSON(object: SignerSource): string {
  switch (object) {
    case SignerSource.NONE:
      return "SIGNER_SOURCE_NONE";
    case SignerSource.ONCHAIN:
      return "SIGNER_SOURCE_ONCHAIN";
    case SignerSource.OFFCHAIN:
      return "SIGNER_SOURCE_OFFCHAIN";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum SignerSource");
  }
}

/**
 * Where a peer's address/contact data came from. Keeps internally-derived
 * (observed) data from being conflated with peer-attested gossip data.
 */
export enum ContactSource {
  UNKNOWN = 0,
  /** COLLECTED - real ContactInfoBody received over the contact-info topic */
  COLLECTED = 1,
  /** DERIVED - internal: PeerId + observed connection address only */
  DERIVED = 2,
}

export function contactSourceFromJSON(object: any): ContactSource {
  switch (object) {
    case 0:
    case "CONTACT_SOURCE_UNKNOWN":
      return ContactSource.UNKNOWN;
    case 1:
    case "CONTACT_SOURCE_COLLECTED":
      return ContactSource.COLLECTED;
    case 2:
    case "CONTACT_SOURCE_DERIVED":
      return ContactSource.DERIVED;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum ContactSource");
  }
}

export function contactSourceToJSON(object: ContactSource): string {
  switch (object) {
    case ContactSource.UNKNOWN:
      return "CONTACT_SOURCE_UNKNOWN";
    case ContactSource.COLLECTED:
      return "CONTACT_SOURCE_COLLECTED";
    case ContactSource.DERIVED:
      return "CONTACT_SOURCE_DERIVED";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum ContactSource");
  }
}

export enum MeshNodeType {
  UNKNOWN = 0,
  VALIDATOR = 1,
  NON_VALIDATOR = 2,
}

export function meshNodeTypeFromJSON(object: any): MeshNodeType {
  switch (object) {
    case 0:
    case "MESH_NODE_TYPE_UNKNOWN":
      return MeshNodeType.UNKNOWN;
    case 1:
    case "MESH_NODE_TYPE_VALIDATOR":
      return MeshNodeType.VALIDATOR;
    case 2:
    case "MESH_NODE_TYPE_NON_VALIDATOR":
      return MeshNodeType.NON_VALIDATOR;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum MeshNodeType");
  }
}

export function meshNodeTypeToJSON(object: MeshNodeType): string {
  switch (object) {
    case MeshNodeType.UNKNOWN:
      return "MESH_NODE_TYPE_UNKNOWN";
    case MeshNodeType.VALIDATOR:
      return "MESH_NODE_TYPE_VALIDATOR";
    case MeshNodeType.NON_VALIDATOR:
      return "MESH_NODE_TYPE_NON_VALIDATOR";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum MeshNodeType");
  }
}

export interface BlocksRequest {
  startBlockNumber: number;
  stopBlockNumber?: number | undefined;
}

export interface ShardChunksRequest {
  shardId: number;
  startBlockNumber: number;
  stopBlockNumber?: number | undefined;
}

export interface ShardChunksResponse {
  shardChunks: ShardChunk[];
}

export interface SubscribeRequest {
  eventTypes: HubEventType[];
  fromId?:
    | number
    | undefined;
  /** optional uint32 total_shards = 3; // Not required for snapchain */
  shardIndex?: number | undefined;
}

export interface DbStats {
  numMessages: number;
  numFidRegistrations: number;
  approxSize: number;
}

export interface ShardInfo {
  shardId: number;
  maxHeight: number;
  numMessages: number;
  numFidRegistrations: number;
  approxSize: number;
  blockDelay: number;
  mempoolSize: number;
  numOnchainEvents: number;
}

export interface GetInfoRequest {
}

/** Response Types for the Sync RPC Methods */
export interface GetInfoResponse {
  version: string;
  dbStats: DbStats | undefined;
  peerId: string;
  numShards: number;
  shardInfos: ShardInfo[];
  nextEngineVersionTimestamp: number;
}

export interface EventRequest {
  id: number;
  shardIndex: number;
}

export interface FidRequest {
  fid: number;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface FidTimestampRequest {
  fid: number;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
  startTimestamp?: number | undefined;
  stopTimestamp?: number | undefined;
}

export interface FidsRequest {
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
  shardId: number;
}

export interface FidsResponse {
  fids: number[];
  nextPageToken?: Uint8Array | undefined;
}

export interface MessagesResponse {
  messages: Message[];
  nextPageToken?: Uint8Array | undefined;
}

export interface CastsByParentRequest {
  parentCastId?: CastId | undefined;
  parentUrl?: string | undefined;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface ReactionRequest {
  fid: number;
  reactionType: ReactionType;
  targetCastId?: CastId | undefined;
  targetUrl?: string | undefined;
}

export interface ReactionsByFidRequest {
  fid: number;
  reactionType?: ReactionType | undefined;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface ReactionsByTargetRequest {
  targetCastId?: CastId | undefined;
  targetUrl?: string | undefined;
  reactionType?: ReactionType | undefined;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface UserDataRequest {
  fid: number;
  userDataType: UserDataType;
}

export interface OnChainEventRequest {
  fid: number;
  eventType: OnChainEventType;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface OnChainEventResponse {
  events: OnChainEvent[];
  nextPageToken?: Uint8Array | undefined;
}

export interface ChannelOwnerRequest {
  channelKey: string;
}

export interface ChannelOwnerResponse {
  /**
   * 0 = the owner's verification has not landed on shard 0 yet. A normal state,
   * not an error: the registration exists and owner_address below is known, but
   * nothing binds it to an fid on shard 0. Resolved when the owner submits a
   * post-activation verification of that address, which is REQUIRED even if they
   * verified it before activation — that history is not backfilled. Never a
   * signal that the channel is abandoned. See GetChannelOwner in rpc.proto.
   * Computed at read time, never stored.
   */
  fid: number;
  /** Raw 20-byte EVM address from the channel registry fold. */
  ownerAddress: Uint8Array;
  /**
   * Absolute expiry, unix seconds, as emitted by the registry contract. May be
   * in the past: lapsed registrations are returned until superseded (see
   * GetChannelOwner in rpc.proto).
   */
  expiry: number;
}

export interface ChannelsByAddressRequest {
  /** Raw 20-byte EVM address. */
  ownerAddress: Uint8Array;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface ChannelsByFidRequest {
  fid: number;
  pageSize?:
    | number
    | undefined;
  /**
   * Opaque composite cursor over the fid's verified addresses joined with the
   * channel owner-address index. No reverse cursor (addresses iterate ascending).
   */
  pageToken?: Uint8Array | undefined;
}

export interface ChannelInfo {
  channelKey: string;
  /** Resolved winner; 0 = parked. */
  fid: number;
  ownerAddress: Uint8Array;
  /**
   * Absolute expiry, unix seconds, as emitted by the registry contract. May be
   * in the past: lapsed registrations are listed until superseded (see
   * GetChannelOwner in rpc.proto).
   */
  expiry: number;
}

export interface ChannelsResponse {
  channels: ChannelInfo[];
  nextPageToken?: Uint8Array | undefined;
}

export interface ChannelRequest {
  channelId: Uint8Array;
}

export interface ChannelMemberRequest {
  channelId: Uint8Array;
  fid: number;
}

/**
 * The two fields are paired: CHANNEL_MEMBER_STATE_NONE means the fid has no
 * membership row and `last_action_ts` is absent; any other state always carries
 * the timestamp of the ChannelMember message that produced it. The server never
 * emits the mixed combinations.
 *
 * Unlike ChannelPinResponse this is not nested, because it would not buy the same
 * guarantee — proto3 cannot exclude the zero variant from an enum, so a NONE
 * state inside a present wrapper would remain representable and the pairing would
 * still rest on this comment.
 */
export interface ChannelMemberResponse {
  state: ChannelMemberState;
  lastActionTs?: number | undefined;
}

export interface ChannelMembersRequest {
  channelId: Uint8Array;
  /** Absent OR CHANNEL_MEMBER_STATE_NONE both mean "no filter" (return all states). */
  stateFilter?: ChannelMemberState | undefined;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface ChannelMember {
  fid: number;
  state: ChannelMemberState;
}

export interface ChannelMembersResponse {
  members: ChannelMember[];
  nextPageToken?: Uint8Array | undefined;
}

/**
 * A pinned cast. Both fields are always populated together — a pin cannot exist
 * without the fid that set it.
 */
export interface ChannelPin {
  castHash: Uint8Array;
  authorFid: number;
}

/**
 * `pin` absent means the channel has no pin. That covers a channel that was never
 * pinned and one whose pin was cleared by an unpin (a ChannelPin message with an
 * empty cast_hash); the two are deliberately indistinguishable here.
 *
 * The pair is nested rather than two sibling optionals so a half-populated
 * response — a cast_hash with no author, or an author with no cast_hash — is not
 * representable on the wire.
 */
export interface ChannelPinResponse {
  pin?: ChannelPin | undefined;
}

export interface ChannelModerationsRequest {
  channelId: Uint8Array;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface ChannelModeration {
  castHash: Uint8Array;
  action: ChannelModerateAction;
  authorFid: number;
}

export interface ChannelModerationsResponse {
  moderations: ChannelModeration[];
  nextPageToken?: Uint8Array | undefined;
}

/**
 * The whole-replace fold of the single winning ChannelUpdate (see
 * ChannelUpdateBody). A field absent here reads as unset — it was omitted by the
 * latest update and is never inherited from the update that one superseded. Do
 * NOT treat an absent field as "unchanged": consumers that merge this response
 * into a stored model must clear the fields it omits, or deleted metadata lives
 * forever.
 *
 * casting_mode/membership_mode are the RESOLVED effective policy: for a registered
 * channel with no ChannelUpdate yet, the server returns the restrictive defaults
 * (MEMBERS_ONLY / APPROVAL), never the NONE=0 sentinel. Clients cannot distinguish
 * "never configured" from "explicitly set to the default" here — that is intentional.
 */
export interface ChannelMetadataResponse {
  name?: string | undefined;
  description?: string | undefined;
  imageUrl?: string | undefined;
  header?: string | undefined;
  rules?: string | undefined;
  castingMode: CastingMode;
  membershipMode: MembershipMode;
}

export interface ChannelMembershipsByFidRequest {
  fid: number;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface ChannelMembership {
  channelId: Uint8Array;
  state: ChannelMemberState;
}

export interface ChannelMembershipsResponse {
  memberships: ChannelMembership[];
  nextPageToken?: Uint8Array | undefined;
}

/**
 * `followed_at` is the Farcaster timestamp of the reaction that expressed the
 * follow. A re-follow refreshes it.
 */
export interface ChannelFollower {
  fid: number;
  followedAt: number;
}

export interface ChannelFollowersRequest {
  channelId: Uint8Array;
  /**
   * NOTE: page_size is PER SHARD, unlike the single-shard channel reads. A page
   * may hold up to page_size * num_shards entries.
   */
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface ChannelFollowersResponse {
  followers: ChannelFollower[];
  nextPageToken?: Uint8Array | undefined;
}

export interface ChannelFollowerCountRequest {
  channelId: Uint8Array;
}

export interface ChannelFollowerCountResponse {
  count: number;
}

export interface ChannelFollow {
  channelId: Uint8Array;
  followedAt: number;
}

export interface ChannelFollowsRequest {
  fid: number;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface ChannelFollowsResponse {
  follows: ChannelFollow[];
  nextPageToken?: Uint8Array | undefined;
}

export interface IsFollowingChannelRequest {
  fid: number;
  channelId: Uint8Array;
}

/** `followed_at` is present exactly when `following` is true. */
export interface IsFollowingChannelResponse {
  following: boolean;
  followedAt?: number | undefined;
}

export interface TierDetails {
  tierType: TierType;
  expiresAt: number;
}

export interface StorageLimitsResponse {
  limits: StorageLimit[];
  units: number;
  unitDetails: StorageUnitDetails[];
  tierSubscriptions: TierDetails[];
}

export interface StorageUnitDetails {
  unitType: StorageUnitType;
  unitSize: number;
  purchasedUnitSize: number;
  lentUnitSize: number;
  borrowedUnitSize: number;
}

export interface StorageLimit {
  storeType: StoreType;
  name: string;
  limit: number;
  used: number;
  earliestTimestamp: number;
  earliestHash: Uint8Array;
}

export interface UsernameProofRequest {
  name: Uint8Array;
}

export interface UsernameProofsResponse {
  proofs: UserNameProof[];
}

export interface ValidationResponse {
  valid: boolean;
  message: Message | undefined;
}

export interface VerificationRequest {
  fid: number;
  address: Uint8Array;
}

export interface SignerRequest {
  fid: number;
  signer: Uint8Array;
}

/**
 * Unified per-key record. Optional fields are populated only when carried by
 * the underlying source (on-chain signer event vs. gasless KEY_ADD record).
 */
export interface Signer {
  source: SignerSource;
  /** 32-byte Ed25519 public key */
  key: Uint8Array;
  /** 1 = Ed25519 */
  keyType: number;
  fid: number;
  /**
   * Common metadata. All timestamps are Unix epoch seconds regardless of
   * source; off-chain values that natively live in Farcaster time
   * (MessageData.timestamp, gasless last-used tracking) are converted at the
   * RPC boundary so clients can compare/compute across sources without an
   * epoch table.
   */
  addedAt?:
    | number
    | undefined;
  /** Unix epoch seconds; off-chain only */
  lastUsedAt?:
    | number
    | undefined;
  /** duration in seconds; off-chain only */
  ttl?:
    | number
    | undefined;
  /** Unix epoch seconds; computed as last_used_at + ttl when ttl > 0 */
  expiresAt?:
    | number
    | undefined;
  /** Off-chain–only fields */
  scopes: number[];
  /** verified requestFid from SignedKeyRequestMetadata */
  requestFid?:
    | number
    | undefined;
  /** user nonce on the originating KEY_ADD */
  nonce?:
    | number
    | undefined;
  /**
   * On-chain–only payload — original event for callers that need raw fields
   * (block_hash, transaction_hash, log_index, metadata bytes, etc.).
   */
  onchainEvent?: OnChainEvent | undefined;
}

export interface SignerResponse {
  signer: Signer | undefined;
}

/**
 * Request for GetSignersByFid. Mirrors `FidRequest` but adds an optional list
 * of `requester_fids` so callers can fetch the current app-nonce for one or
 * more requesters alongside the signer list. Used in lieu of `FidRequest` so
 * the shared message stays lean.
 */
export interface SignersByFidRequest {
  fid: number;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?:
    | boolean
    | undefined;
  /**
   * FIDs (verified `requestFid` from SignedKeyRequestMetadata) whose current
   * app-nonce should be included in the response. The response's
   * `requester_fid_nonces` list carries one entry per FID supplied here, in
   * the same order. Empty list ⇒ no app nonces in the response.
   */
  requesterFids: number[];
}

export interface SignersByFidResponse {
  signers: Signer[];
  nextPageToken?:
    | Uint8Array
    | undefined;
  /**
   * Total count of currently-active gasless (off-chain) keys for this FID.
   * Populated from the O(1) per-FID counter maintained alongside the gasless
   * key store, so it stays cheap regardless of the page size.
   */
  gaslessSignerCount: number;
  /**
   * Per-FID cap on active gasless keys (NEYN-10579). Lets clients show
   * "X/Y delegations" without hardcoding the limit on their side.
   */
  gaslessSignerLimit: number;
  /**
   * Current value of the user-nonce counter for this FID, i.e. the highest
   * nonce ever accepted on KEY_ADD or custody-signed KEY_REMOVE for the user.
   * The next valid user-nonce is strictly greater than this value. Returns
   * 0 when no gasless activity has occurred for this FID yet, matching the
   * merge-time validation rule that treats a missing counter as 0.
   */
  currentUserNonce: number;
  /**
   * Current app-nonce counter, keyed by requester FID. Contains one entry
   * per FID supplied in `request.requester_fids`; missing counters are
   * surfaced as 0 so clients can read the map directly without falling back
   * to defaults. The next valid self-revocation nonce for a given requester
   * is strictly greater than the value here.
   */
  requesterFidNonces: { [key: number]: number };
}

export interface SignersByFidResponse_RequesterFidNoncesEntry {
  key: number;
  value: number;
}

export interface LinkRequest {
  fid: number;
  linkType: string;
  targetFid?: number | undefined;
}

export interface LinksByFidRequest {
  fid: number;
  linkType?: string | undefined;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface LinksByTargetRequest {
  targetFid?: number | undefined;
  linkType?: string | undefined;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface IdRegistryEventByAddressRequest {
  address: Uint8Array;
}

export interface SubmitBulkMessagesRequest {
  messages: Message[];
}

export interface MessageError {
  hash: Uint8Array;
  errCode: string;
  message: string;
}

export interface BulkMessageResponse {
  message?: Message | undefined;
  messageError?: MessageError | undefined;
}

export interface SubmitBulkMessagesResponse {
  messages: BulkMessageResponse[];
}

export interface TrieNodeMetadataRequest {
  shardId: number;
  prefix: Uint8Array;
}

export interface TrieNodeMetadataResponse {
  prefix: Uint8Array;
  numMessages: number;
  hash: string;
  children: TrieNodeMetadataResponse[];
}

export interface EventsRequest {
  startId: number;
  shardIndex?: number | undefined;
  stopId?: number | undefined;
  pageSize?: number | undefined;
  pageToken?: Uint8Array | undefined;
  reverse?: boolean | undefined;
}

export interface EventsResponse {
  events: HubEvent[];
  nextPageToken?: Uint8Array | undefined;
}

export interface FidAddressTypeRequest {
  fid: number;
  address: Uint8Array;
}

export interface FidAddressTypeResponse {
  isCustody: boolean;
  isAuth: boolean;
  isVerified: boolean;
}

export interface ContactInfoBody {
  gossipAddress: string;
  peerId: Uint8Array;
  snapchainVersion: string;
  network: FarcasterNetwork;
  timestamp: number;
  announceRpcAddress: string;
}

export interface GetConnectedPeersRequest {
}

export interface GetConnectedPeersResponse {
  contacts: ContactInfoBody[];
  /**
   * Unified, source-tagged view of connected peers. Includes peers we have no
   * collected ContactInfoBody for (e.g. validators) as CONTACT_SOURCE_DERIVED
   * entries built from the live connection — kept distinct from collected data.
   */
  peers: ConnectedPeer[];
}

export interface ConnectedPeer {
  source: ContactSource;
  /** set only when source == COLLECTED */
  contactInfo:
    | ContactInfoBody
    | undefined;
  /** always present (esp. for DERIVED) */
  peerId: Uint8Array;
  /** set for DERIVED: the live-connection address */
  observedAddress: string;
}

export interface GetMeshViewRequest {
  /** default true (applied by the handler) */
  validatorsOnly: boolean;
  /**
   * Reserved for the recursive crawl; ignored by the local view, kept so the
   * wire format doesn't break when a propagating crawl is added later.
   */
  ttl: number;
  visitedPeerIds: Uint8Array[];
}

export interface GossipRate {
  topic: string;
  msgsPerSec: number;
  bytesPerSec: number;
  totalMsgs: number;
  totalBytes: number;
}

export interface TopicMembership {
  topic: string;
  subscribed: boolean;
  /** peer is in OUR gossipsub mesh for this topic */
  inMesh: boolean;
}

export interface MeshSelf {
  peerId: Uint8Array;
  /** node identity key (always present) */
  consensusPublicKey: Uint8Array;
  /** key is in the validator set at current height */
  isValidator: boolean;
  gossipAddress: string;
  rpcAddress: string;
  snapchainVersion: string;
  network: FarcasterNetwork;
  subscribedTopics: string[];
  consensusMeshSize: number;
  currentHeight: number;
}

export interface MeshPeer {
  peerId: Uint8Array;
  nodeType: MeshNodeType;
  /** set iff PeerId matched a validator-set entry */
  consensusPublicKey?: Uint8Array | undefined;
  connected: boolean;
  directPeer: boolean;
  /** COLLECTED vs DERIVED — never conflate the two */
  contactSource: ContactSource;
  /** set only when contact_source == COLLECTED */
  contactInfo:
    | ContactInfoBody
    | undefined;
  /** internal: live-connection addr; not a self-announced IP */
  observedAddress: string;
  topics: TopicMembership[];
  gossipRates: GossipRate[];
}

export interface MeshView {
  /** The responding node. Named `local` (not `self`) to avoid the Rust keyword. */
  local: MeshSelf | undefined;
  peers: MeshPeer[];
  /** unix millis */
  generatedAt: number;
}

/**
 * A validator that the crawl could not query directly. The crawl is
 * connected-only: validators the serving node has no live connection to,
 * or that did not respond in time, are surfaced here rather than dropped.
 */
export interface UnreachableNode {
  peerId: Uint8Array;
  /** set when the missing node is a known validator */
  consensusPublicKey: Uint8Array;
  /** "not_connected" | "timeout" | "error: …" */
  reason: string;
}

/**
 * Network-wide topology assembled by the centralized crawl over the gossip
 * port. `nodes` is one MeshView per responding validator (including self).
 */
export interface MeshTopology {
  nodes: MeshView[];
  unreachable: UnreachableNode[];
  /** unix millis */
  generatedAt: number;
}

function createBaseBlocksRequest(): BlocksRequest {
  return { startBlockNumber: 0, stopBlockNumber: undefined };
}

export const BlocksRequest = {
  encode(message: BlocksRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.startBlockNumber !== 0) {
      writer.uint32(16).uint64(message.startBlockNumber);
    }
    if (message.stopBlockNumber !== undefined) {
      writer.uint32(24).uint64(message.stopBlockNumber);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BlocksRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBlocksRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          if (tag != 16) {
            break;
          }

          message.startBlockNumber = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.stopBlockNumber = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BlocksRequest {
    return {
      startBlockNumber: isSet(object.startBlockNumber) ? Number(object.startBlockNumber) : 0,
      stopBlockNumber: isSet(object.stopBlockNumber) ? Number(object.stopBlockNumber) : undefined,
    };
  },

  toJSON(message: BlocksRequest): unknown {
    const obj: any = {};
    message.startBlockNumber !== undefined && (obj.startBlockNumber = Math.round(message.startBlockNumber));
    message.stopBlockNumber !== undefined && (obj.stopBlockNumber = Math.round(message.stopBlockNumber));
    return obj;
  },

  create<I extends Exact<DeepPartial<BlocksRequest>, I>>(base?: I): BlocksRequest {
    return BlocksRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<BlocksRequest>, I>>(object: I): BlocksRequest {
    const message = createBaseBlocksRequest();
    message.startBlockNumber = object.startBlockNumber ?? 0;
    message.stopBlockNumber = object.stopBlockNumber ?? undefined;
    return message;
  },
};

function createBaseShardChunksRequest(): ShardChunksRequest {
  return { shardId: 0, startBlockNumber: 0, stopBlockNumber: undefined };
}

export const ShardChunksRequest = {
  encode(message: ShardChunksRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.shardId !== 0) {
      writer.uint32(8).uint32(message.shardId);
    }
    if (message.startBlockNumber !== 0) {
      writer.uint32(16).uint64(message.startBlockNumber);
    }
    if (message.stopBlockNumber !== undefined) {
      writer.uint32(24).uint64(message.stopBlockNumber);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ShardChunksRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseShardChunksRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.shardId = reader.uint32();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.startBlockNumber = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.stopBlockNumber = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ShardChunksRequest {
    return {
      shardId: isSet(object.shardId) ? Number(object.shardId) : 0,
      startBlockNumber: isSet(object.startBlockNumber) ? Number(object.startBlockNumber) : 0,
      stopBlockNumber: isSet(object.stopBlockNumber) ? Number(object.stopBlockNumber) : undefined,
    };
  },

  toJSON(message: ShardChunksRequest): unknown {
    const obj: any = {};
    message.shardId !== undefined && (obj.shardId = Math.round(message.shardId));
    message.startBlockNumber !== undefined && (obj.startBlockNumber = Math.round(message.startBlockNumber));
    message.stopBlockNumber !== undefined && (obj.stopBlockNumber = Math.round(message.stopBlockNumber));
    return obj;
  },

  create<I extends Exact<DeepPartial<ShardChunksRequest>, I>>(base?: I): ShardChunksRequest {
    return ShardChunksRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ShardChunksRequest>, I>>(object: I): ShardChunksRequest {
    const message = createBaseShardChunksRequest();
    message.shardId = object.shardId ?? 0;
    message.startBlockNumber = object.startBlockNumber ?? 0;
    message.stopBlockNumber = object.stopBlockNumber ?? undefined;
    return message;
  },
};

function createBaseShardChunksResponse(): ShardChunksResponse {
  return { shardChunks: [] };
}

export const ShardChunksResponse = {
  encode(message: ShardChunksResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.shardChunks) {
      ShardChunk.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ShardChunksResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseShardChunksResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.shardChunks.push(ShardChunk.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ShardChunksResponse {
    return {
      shardChunks: Array.isArray(object?.shardChunks) ? object.shardChunks.map((e: any) => ShardChunk.fromJSON(e)) : [],
    };
  },

  toJSON(message: ShardChunksResponse): unknown {
    const obj: any = {};
    if (message.shardChunks) {
      obj.shardChunks = message.shardChunks.map((e) => e ? ShardChunk.toJSON(e) : undefined);
    } else {
      obj.shardChunks = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ShardChunksResponse>, I>>(base?: I): ShardChunksResponse {
    return ShardChunksResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ShardChunksResponse>, I>>(object: I): ShardChunksResponse {
    const message = createBaseShardChunksResponse();
    message.shardChunks = object.shardChunks?.map((e) => ShardChunk.fromPartial(e)) || [];
    return message;
  },
};

function createBaseSubscribeRequest(): SubscribeRequest {
  return { eventTypes: [], fromId: undefined, shardIndex: undefined };
}

export const SubscribeRequest = {
  encode(message: SubscribeRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    writer.uint32(10).fork();
    for (const v of message.eventTypes) {
      writer.int32(v);
    }
    writer.ldelim();
    if (message.fromId !== undefined) {
      writer.uint32(16).uint64(message.fromId);
    }
    if (message.shardIndex !== undefined) {
      writer.uint32(32).uint32(message.shardIndex);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubscribeRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubscribeRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag == 8) {
            message.eventTypes.push(reader.int32() as any);
            continue;
          }

          if (tag == 10) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.eventTypes.push(reader.int32() as any);
            }

            continue;
          }

          break;
        case 2:
          if (tag != 16) {
            break;
          }

          message.fromId = longToNumber(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.shardIndex = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SubscribeRequest {
    return {
      eventTypes: Array.isArray(object?.eventTypes) ? object.eventTypes.map((e: any) => hubEventTypeFromJSON(e)) : [],
      fromId: isSet(object.fromId) ? Number(object.fromId) : undefined,
      shardIndex: isSet(object.shardIndex) ? Number(object.shardIndex) : undefined,
    };
  },

  toJSON(message: SubscribeRequest): unknown {
    const obj: any = {};
    if (message.eventTypes) {
      obj.eventTypes = message.eventTypes.map((e) => hubEventTypeToJSON(e));
    } else {
      obj.eventTypes = [];
    }
    message.fromId !== undefined && (obj.fromId = Math.round(message.fromId));
    message.shardIndex !== undefined && (obj.shardIndex = Math.round(message.shardIndex));
    return obj;
  },

  create<I extends Exact<DeepPartial<SubscribeRequest>, I>>(base?: I): SubscribeRequest {
    return SubscribeRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubscribeRequest>, I>>(object: I): SubscribeRequest {
    const message = createBaseSubscribeRequest();
    message.eventTypes = object.eventTypes?.map((e) => e) || [];
    message.fromId = object.fromId ?? undefined;
    message.shardIndex = object.shardIndex ?? undefined;
    return message;
  },
};

function createBaseDbStats(): DbStats {
  return { numMessages: 0, numFidRegistrations: 0, approxSize: 0 };
}

export const DbStats = {
  encode(message: DbStats, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.numMessages !== 0) {
      writer.uint32(8).uint64(message.numMessages);
    }
    if (message.numFidRegistrations !== 0) {
      writer.uint32(16).uint64(message.numFidRegistrations);
    }
    if (message.approxSize !== 0) {
      writer.uint32(32).uint64(message.approxSize);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DbStats {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDbStats();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.numMessages = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.numFidRegistrations = longToNumber(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.approxSize = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DbStats {
    return {
      numMessages: isSet(object.numMessages) ? Number(object.numMessages) : 0,
      numFidRegistrations: isSet(object.numFidRegistrations) ? Number(object.numFidRegistrations) : 0,
      approxSize: isSet(object.approxSize) ? Number(object.approxSize) : 0,
    };
  },

  toJSON(message: DbStats): unknown {
    const obj: any = {};
    message.numMessages !== undefined && (obj.numMessages = Math.round(message.numMessages));
    message.numFidRegistrations !== undefined && (obj.numFidRegistrations = Math.round(message.numFidRegistrations));
    message.approxSize !== undefined && (obj.approxSize = Math.round(message.approxSize));
    return obj;
  },

  create<I extends Exact<DeepPartial<DbStats>, I>>(base?: I): DbStats {
    return DbStats.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<DbStats>, I>>(object: I): DbStats {
    const message = createBaseDbStats();
    message.numMessages = object.numMessages ?? 0;
    message.numFidRegistrations = object.numFidRegistrations ?? 0;
    message.approxSize = object.approxSize ?? 0;
    return message;
  },
};

function createBaseShardInfo(): ShardInfo {
  return {
    shardId: 0,
    maxHeight: 0,
    numMessages: 0,
    numFidRegistrations: 0,
    approxSize: 0,
    blockDelay: 0,
    mempoolSize: 0,
    numOnchainEvents: 0,
  };
}

export const ShardInfo = {
  encode(message: ShardInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.shardId !== 0) {
      writer.uint32(8).uint32(message.shardId);
    }
    if (message.maxHeight !== 0) {
      writer.uint32(16).uint64(message.maxHeight);
    }
    if (message.numMessages !== 0) {
      writer.uint32(24).uint64(message.numMessages);
    }
    if (message.numFidRegistrations !== 0) {
      writer.uint32(32).uint64(message.numFidRegistrations);
    }
    if (message.approxSize !== 0) {
      writer.uint32(40).uint64(message.approxSize);
    }
    if (message.blockDelay !== 0) {
      writer.uint32(48).uint64(message.blockDelay);
    }
    if (message.mempoolSize !== 0) {
      writer.uint32(56).uint64(message.mempoolSize);
    }
    if (message.numOnchainEvents !== 0) {
      writer.uint32(64).uint64(message.numOnchainEvents);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ShardInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseShardInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.shardId = reader.uint32();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.maxHeight = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.numMessages = longToNumber(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.numFidRegistrations = longToNumber(reader.uint64() as Long);
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.approxSize = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.blockDelay = longToNumber(reader.uint64() as Long);
          continue;
        case 7:
          if (tag != 56) {
            break;
          }

          message.mempoolSize = longToNumber(reader.uint64() as Long);
          continue;
        case 8:
          if (tag != 64) {
            break;
          }

          message.numOnchainEvents = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ShardInfo {
    return {
      shardId: isSet(object.shardId) ? Number(object.shardId) : 0,
      maxHeight: isSet(object.maxHeight) ? Number(object.maxHeight) : 0,
      numMessages: isSet(object.numMessages) ? Number(object.numMessages) : 0,
      numFidRegistrations: isSet(object.numFidRegistrations) ? Number(object.numFidRegistrations) : 0,
      approxSize: isSet(object.approxSize) ? Number(object.approxSize) : 0,
      blockDelay: isSet(object.blockDelay) ? Number(object.blockDelay) : 0,
      mempoolSize: isSet(object.mempoolSize) ? Number(object.mempoolSize) : 0,
      numOnchainEvents: isSet(object.numOnchainEvents) ? Number(object.numOnchainEvents) : 0,
    };
  },

  toJSON(message: ShardInfo): unknown {
    const obj: any = {};
    message.shardId !== undefined && (obj.shardId = Math.round(message.shardId));
    message.maxHeight !== undefined && (obj.maxHeight = Math.round(message.maxHeight));
    message.numMessages !== undefined && (obj.numMessages = Math.round(message.numMessages));
    message.numFidRegistrations !== undefined && (obj.numFidRegistrations = Math.round(message.numFidRegistrations));
    message.approxSize !== undefined && (obj.approxSize = Math.round(message.approxSize));
    message.blockDelay !== undefined && (obj.blockDelay = Math.round(message.blockDelay));
    message.mempoolSize !== undefined && (obj.mempoolSize = Math.round(message.mempoolSize));
    message.numOnchainEvents !== undefined && (obj.numOnchainEvents = Math.round(message.numOnchainEvents));
    return obj;
  },

  create<I extends Exact<DeepPartial<ShardInfo>, I>>(base?: I): ShardInfo {
    return ShardInfo.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ShardInfo>, I>>(object: I): ShardInfo {
    const message = createBaseShardInfo();
    message.shardId = object.shardId ?? 0;
    message.maxHeight = object.maxHeight ?? 0;
    message.numMessages = object.numMessages ?? 0;
    message.numFidRegistrations = object.numFidRegistrations ?? 0;
    message.approxSize = object.approxSize ?? 0;
    message.blockDelay = object.blockDelay ?? 0;
    message.mempoolSize = object.mempoolSize ?? 0;
    message.numOnchainEvents = object.numOnchainEvents ?? 0;
    return message;
  },
};

function createBaseGetInfoRequest(): GetInfoRequest {
  return {};
}

export const GetInfoRequest = {
  encode(_: GetInfoRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetInfoRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetInfoRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetInfoRequest {
    return {};
  },

  toJSON(_: GetInfoRequest): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<GetInfoRequest>, I>>(base?: I): GetInfoRequest {
    return GetInfoRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetInfoRequest>, I>>(_: I): GetInfoRequest {
    const message = createBaseGetInfoRequest();
    return message;
  },
};

function createBaseGetInfoResponse(): GetInfoResponse {
  return { version: "", dbStats: undefined, peerId: "", numShards: 0, shardInfos: [], nextEngineVersionTimestamp: 0 };
}

export const GetInfoResponse = {
  encode(message: GetInfoResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.version !== "") {
      writer.uint32(10).string(message.version);
    }
    if (message.dbStats !== undefined) {
      DbStats.encode(message.dbStats, writer.uint32(42).fork()).ldelim();
    }
    if (message.peerId !== "") {
      writer.uint32(50).string(message.peerId);
    }
    if (message.numShards !== 0) {
      writer.uint32(64).uint32(message.numShards);
    }
    for (const v of message.shardInfos) {
      ShardInfo.encode(v!, writer.uint32(74).fork()).ldelim();
    }
    if (message.nextEngineVersionTimestamp !== 0) {
      writer.uint32(80).uint64(message.nextEngineVersionTimestamp);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetInfoResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetInfoResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.version = reader.string();
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.dbStats = DbStats.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.peerId = reader.string();
          continue;
        case 8:
          if (tag != 64) {
            break;
          }

          message.numShards = reader.uint32();
          continue;
        case 9:
          if (tag != 74) {
            break;
          }

          message.shardInfos.push(ShardInfo.decode(reader, reader.uint32()));
          continue;
        case 10:
          if (tag != 80) {
            break;
          }

          message.nextEngineVersionTimestamp = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetInfoResponse {
    return {
      version: isSet(object.version) ? String(object.version) : "",
      dbStats: isSet(object.dbStats) ? DbStats.fromJSON(object.dbStats) : undefined,
      peerId: isSet(object.peerId) ? String(object.peerId) : "",
      numShards: isSet(object.numShards) ? Number(object.numShards) : 0,
      shardInfos: Array.isArray(object?.shardInfos) ? object.shardInfos.map((e: any) => ShardInfo.fromJSON(e)) : [],
      nextEngineVersionTimestamp: isSet(object.nextEngineVersionTimestamp)
        ? Number(object.nextEngineVersionTimestamp)
        : 0,
    };
  },

  toJSON(message: GetInfoResponse): unknown {
    const obj: any = {};
    message.version !== undefined && (obj.version = message.version);
    message.dbStats !== undefined && (obj.dbStats = message.dbStats ? DbStats.toJSON(message.dbStats) : undefined);
    message.peerId !== undefined && (obj.peerId = message.peerId);
    message.numShards !== undefined && (obj.numShards = Math.round(message.numShards));
    if (message.shardInfos) {
      obj.shardInfos = message.shardInfos.map((e) => e ? ShardInfo.toJSON(e) : undefined);
    } else {
      obj.shardInfos = [];
    }
    message.nextEngineVersionTimestamp !== undefined &&
      (obj.nextEngineVersionTimestamp = Math.round(message.nextEngineVersionTimestamp));
    return obj;
  },

  create<I extends Exact<DeepPartial<GetInfoResponse>, I>>(base?: I): GetInfoResponse {
    return GetInfoResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetInfoResponse>, I>>(object: I): GetInfoResponse {
    const message = createBaseGetInfoResponse();
    message.version = object.version ?? "";
    message.dbStats = (object.dbStats !== undefined && object.dbStats !== null)
      ? DbStats.fromPartial(object.dbStats)
      : undefined;
    message.peerId = object.peerId ?? "";
    message.numShards = object.numShards ?? 0;
    message.shardInfos = object.shardInfos?.map((e) => ShardInfo.fromPartial(e)) || [];
    message.nextEngineVersionTimestamp = object.nextEngineVersionTimestamp ?? 0;
    return message;
  },
};

function createBaseEventRequest(): EventRequest {
  return { id: 0, shardIndex: 0 };
}

export const EventRequest = {
  encode(message: EventRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== 0) {
      writer.uint32(8).uint64(message.id);
    }
    if (message.shardIndex !== 0) {
      writer.uint32(40).uint32(message.shardIndex);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.id = longToNumber(reader.uint64() as Long);
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.shardIndex = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventRequest {
    return {
      id: isSet(object.id) ? Number(object.id) : 0,
      shardIndex: isSet(object.shardIndex) ? Number(object.shardIndex) : 0,
    };
  },

  toJSON(message: EventRequest): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = Math.round(message.id));
    message.shardIndex !== undefined && (obj.shardIndex = Math.round(message.shardIndex));
    return obj;
  },

  create<I extends Exact<DeepPartial<EventRequest>, I>>(base?: I): EventRequest {
    return EventRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventRequest>, I>>(object: I): EventRequest {
    const message = createBaseEventRequest();
    message.id = object.id ?? 0;
    message.shardIndex = object.shardIndex ?? 0;
    return message;
  },
};

function createBaseFidRequest(): FidRequest {
  return { fid: 0, pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const FidRequest = {
  encode(message: FidRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(16).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(26).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(32).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FidRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFidRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FidRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: FidRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<FidRequest>, I>>(base?: I): FidRequest {
    return FidRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FidRequest>, I>>(object: I): FidRequest {
    const message = createBaseFidRequest();
    message.fid = object.fid ?? 0;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseFidTimestampRequest(): FidTimestampRequest {
  return {
    fid: 0,
    pageSize: undefined,
    pageToken: undefined,
    reverse: undefined,
    startTimestamp: undefined,
    stopTimestamp: undefined,
  };
}

export const FidTimestampRequest = {
  encode(message: FidTimestampRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(16).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(26).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(32).bool(message.reverse);
    }
    if (message.startTimestamp !== undefined) {
      writer.uint32(40).uint64(message.startTimestamp);
    }
    if (message.stopTimestamp !== undefined) {
      writer.uint32(48).uint64(message.stopTimestamp);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FidTimestampRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFidTimestampRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.reverse = reader.bool();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.startTimestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.stopTimestamp = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FidTimestampRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
      startTimestamp: isSet(object.startTimestamp) ? Number(object.startTimestamp) : undefined,
      stopTimestamp: isSet(object.stopTimestamp) ? Number(object.stopTimestamp) : undefined,
    };
  },

  toJSON(message: FidTimestampRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    message.startTimestamp !== undefined && (obj.startTimestamp = Math.round(message.startTimestamp));
    message.stopTimestamp !== undefined && (obj.stopTimestamp = Math.round(message.stopTimestamp));
    return obj;
  },

  create<I extends Exact<DeepPartial<FidTimestampRequest>, I>>(base?: I): FidTimestampRequest {
    return FidTimestampRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FidTimestampRequest>, I>>(object: I): FidTimestampRequest {
    const message = createBaseFidTimestampRequest();
    message.fid = object.fid ?? 0;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    message.startTimestamp = object.startTimestamp ?? undefined;
    message.stopTimestamp = object.stopTimestamp ?? undefined;
    return message;
  },
};

function createBaseFidsRequest(): FidsRequest {
  return { pageSize: undefined, pageToken: undefined, reverse: undefined, shardId: 0 };
}

export const FidsRequest = {
  encode(message: FidsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.pageSize !== undefined) {
      writer.uint32(8).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(18).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(24).bool(message.reverse);
    }
    if (message.shardId !== 0) {
      writer.uint32(32).uint32(message.shardId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FidsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFidsRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.reverse = reader.bool();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.shardId = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FidsRequest {
    return {
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
      shardId: isSet(object.shardId) ? Number(object.shardId) : 0,
    };
  },

  toJSON(message: FidsRequest): unknown {
    const obj: any = {};
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    message.shardId !== undefined && (obj.shardId = Math.round(message.shardId));
    return obj;
  },

  create<I extends Exact<DeepPartial<FidsRequest>, I>>(base?: I): FidsRequest {
    return FidsRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FidsRequest>, I>>(object: I): FidsRequest {
    const message = createBaseFidsRequest();
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    message.shardId = object.shardId ?? 0;
    return message;
  },
};

function createBaseFidsResponse(): FidsResponse {
  return { fids: [], nextPageToken: undefined };
}

export const FidsResponse = {
  encode(message: FidsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    writer.uint32(10).fork();
    for (const v of message.fids) {
      writer.uint64(v);
    }
    writer.ldelim();
    if (message.nextPageToken !== undefined) {
      writer.uint32(18).bytes(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FidsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFidsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag == 8) {
            message.fids.push(longToNumber(reader.uint64() as Long));
            continue;
          }

          if (tag == 10) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.fids.push(longToNumber(reader.uint64() as Long));
            }

            continue;
          }

          break;
        case 2:
          if (tag != 18) {
            break;
          }

          message.nextPageToken = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FidsResponse {
    return {
      fids: Array.isArray(object?.fids) ? object.fids.map((e: any) => Number(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? bytesFromBase64(object.nextPageToken) : undefined,
    };
  },

  toJSON(message: FidsResponse): unknown {
    const obj: any = {};
    if (message.fids) {
      obj.fids = message.fids.map((e) => Math.round(e));
    } else {
      obj.fids = [];
    }
    message.nextPageToken !== undefined &&
      (obj.nextPageToken = message.nextPageToken !== undefined ? base64FromBytes(message.nextPageToken) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<FidsResponse>, I>>(base?: I): FidsResponse {
    return FidsResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FidsResponse>, I>>(object: I): FidsResponse {
    const message = createBaseFidsResponse();
    message.fids = object.fids?.map((e) => e) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    return message;
  },
};

function createBaseMessagesResponse(): MessagesResponse {
  return { messages: [], nextPageToken: undefined };
}

export const MessagesResponse = {
  encode(message: MessagesResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.messages) {
      Message.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== undefined) {
      writer.uint32(18).bytes(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MessagesResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMessagesResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.messages.push(Message.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.nextPageToken = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MessagesResponse {
    return {
      messages: Array.isArray(object?.messages) ? object.messages.map((e: any) => Message.fromJSON(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? bytesFromBase64(object.nextPageToken) : undefined,
    };
  },

  toJSON(message: MessagesResponse): unknown {
    const obj: any = {};
    if (message.messages) {
      obj.messages = message.messages.map((e) => e ? Message.toJSON(e) : undefined);
    } else {
      obj.messages = [];
    }
    message.nextPageToken !== undefined &&
      (obj.nextPageToken = message.nextPageToken !== undefined ? base64FromBytes(message.nextPageToken) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<MessagesResponse>, I>>(base?: I): MessagesResponse {
    return MessagesResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MessagesResponse>, I>>(object: I): MessagesResponse {
    const message = createBaseMessagesResponse();
    message.messages = object.messages?.map((e) => Message.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    return message;
  },
};

function createBaseCastsByParentRequest(): CastsByParentRequest {
  return {
    parentCastId: undefined,
    parentUrl: undefined,
    pageSize: undefined,
    pageToken: undefined,
    reverse: undefined,
  };
}

export const CastsByParentRequest = {
  encode(message: CastsByParentRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.parentCastId !== undefined) {
      CastId.encode(message.parentCastId, writer.uint32(10).fork()).ldelim();
    }
    if (message.parentUrl !== undefined) {
      writer.uint32(42).string(message.parentUrl);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(16).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(26).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(32).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CastsByParentRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCastsByParentRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.parentCastId = CastId.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.parentUrl = reader.string();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): CastsByParentRequest {
    return {
      parentCastId: isSet(object.parentCastId) ? CastId.fromJSON(object.parentCastId) : undefined,
      parentUrl: isSet(object.parentUrl) ? String(object.parentUrl) : undefined,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: CastsByParentRequest): unknown {
    const obj: any = {};
    message.parentCastId !== undefined &&
      (obj.parentCastId = message.parentCastId ? CastId.toJSON(message.parentCastId) : undefined);
    message.parentUrl !== undefined && (obj.parentUrl = message.parentUrl);
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<CastsByParentRequest>, I>>(base?: I): CastsByParentRequest {
    return CastsByParentRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<CastsByParentRequest>, I>>(object: I): CastsByParentRequest {
    const message = createBaseCastsByParentRequest();
    message.parentCastId = (object.parentCastId !== undefined && object.parentCastId !== null)
      ? CastId.fromPartial(object.parentCastId)
      : undefined;
    message.parentUrl = object.parentUrl ?? undefined;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseReactionRequest(): ReactionRequest {
  return { fid: 0, reactionType: 0, targetCastId: undefined, targetUrl: undefined };
}

export const ReactionRequest = {
  encode(message: ReactionRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.reactionType !== 0) {
      writer.uint32(16).int32(message.reactionType);
    }
    if (message.targetCastId !== undefined) {
      CastId.encode(message.targetCastId, writer.uint32(26).fork()).ldelim();
    }
    if (message.targetUrl !== undefined) {
      writer.uint32(34).string(message.targetUrl);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ReactionRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReactionRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.reactionType = reader.int32() as any;
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.targetCastId = CastId.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.targetUrl = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ReactionRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      reactionType: isSet(object.reactionType) ? reactionTypeFromJSON(object.reactionType) : 0,
      targetCastId: isSet(object.targetCastId) ? CastId.fromJSON(object.targetCastId) : undefined,
      targetUrl: isSet(object.targetUrl) ? String(object.targetUrl) : undefined,
    };
  },

  toJSON(message: ReactionRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.reactionType !== undefined && (obj.reactionType = reactionTypeToJSON(message.reactionType));
    message.targetCastId !== undefined &&
      (obj.targetCastId = message.targetCastId ? CastId.toJSON(message.targetCastId) : undefined);
    message.targetUrl !== undefined && (obj.targetUrl = message.targetUrl);
    return obj;
  },

  create<I extends Exact<DeepPartial<ReactionRequest>, I>>(base?: I): ReactionRequest {
    return ReactionRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ReactionRequest>, I>>(object: I): ReactionRequest {
    const message = createBaseReactionRequest();
    message.fid = object.fid ?? 0;
    message.reactionType = object.reactionType ?? 0;
    message.targetCastId = (object.targetCastId !== undefined && object.targetCastId !== null)
      ? CastId.fromPartial(object.targetCastId)
      : undefined;
    message.targetUrl = object.targetUrl ?? undefined;
    return message;
  },
};

function createBaseReactionsByFidRequest(): ReactionsByFidRequest {
  return { fid: 0, reactionType: undefined, pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const ReactionsByFidRequest = {
  encode(message: ReactionsByFidRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.reactionType !== undefined) {
      writer.uint32(16).int32(message.reactionType);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(24).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(34).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(40).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ReactionsByFidRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReactionsByFidRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.reactionType = reader.int32() as any;
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ReactionsByFidRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      reactionType: isSet(object.reactionType) ? reactionTypeFromJSON(object.reactionType) : undefined,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: ReactionsByFidRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.reactionType !== undefined &&
      (obj.reactionType = message.reactionType !== undefined ? reactionTypeToJSON(message.reactionType) : undefined);
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<ReactionsByFidRequest>, I>>(base?: I): ReactionsByFidRequest {
    return ReactionsByFidRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ReactionsByFidRequest>, I>>(object: I): ReactionsByFidRequest {
    const message = createBaseReactionsByFidRequest();
    message.fid = object.fid ?? 0;
    message.reactionType = object.reactionType ?? undefined;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseReactionsByTargetRequest(): ReactionsByTargetRequest {
  return {
    targetCastId: undefined,
    targetUrl: undefined,
    reactionType: undefined,
    pageSize: undefined,
    pageToken: undefined,
    reverse: undefined,
  };
}

export const ReactionsByTargetRequest = {
  encode(message: ReactionsByTargetRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.targetCastId !== undefined) {
      CastId.encode(message.targetCastId, writer.uint32(10).fork()).ldelim();
    }
    if (message.targetUrl !== undefined) {
      writer.uint32(50).string(message.targetUrl);
    }
    if (message.reactionType !== undefined) {
      writer.uint32(16).int32(message.reactionType);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(24).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(34).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(40).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ReactionsByTargetRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReactionsByTargetRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.targetCastId = CastId.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.targetUrl = reader.string();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.reactionType = reader.int32() as any;
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ReactionsByTargetRequest {
    return {
      targetCastId: isSet(object.targetCastId) ? CastId.fromJSON(object.targetCastId) : undefined,
      targetUrl: isSet(object.targetUrl) ? String(object.targetUrl) : undefined,
      reactionType: isSet(object.reactionType) ? reactionTypeFromJSON(object.reactionType) : undefined,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: ReactionsByTargetRequest): unknown {
    const obj: any = {};
    message.targetCastId !== undefined &&
      (obj.targetCastId = message.targetCastId ? CastId.toJSON(message.targetCastId) : undefined);
    message.targetUrl !== undefined && (obj.targetUrl = message.targetUrl);
    message.reactionType !== undefined &&
      (obj.reactionType = message.reactionType !== undefined ? reactionTypeToJSON(message.reactionType) : undefined);
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<ReactionsByTargetRequest>, I>>(base?: I): ReactionsByTargetRequest {
    return ReactionsByTargetRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ReactionsByTargetRequest>, I>>(object: I): ReactionsByTargetRequest {
    const message = createBaseReactionsByTargetRequest();
    message.targetCastId = (object.targetCastId !== undefined && object.targetCastId !== null)
      ? CastId.fromPartial(object.targetCastId)
      : undefined;
    message.targetUrl = object.targetUrl ?? undefined;
    message.reactionType = object.reactionType ?? undefined;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseUserDataRequest(): UserDataRequest {
  return { fid: 0, userDataType: 0 };
}

export const UserDataRequest = {
  encode(message: UserDataRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.userDataType !== 0) {
      writer.uint32(16).int32(message.userDataType);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UserDataRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUserDataRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.userDataType = reader.int32() as any;
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UserDataRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      userDataType: isSet(object.userDataType) ? userDataTypeFromJSON(object.userDataType) : 0,
    };
  },

  toJSON(message: UserDataRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.userDataType !== undefined && (obj.userDataType = userDataTypeToJSON(message.userDataType));
    return obj;
  },

  create<I extends Exact<DeepPartial<UserDataRequest>, I>>(base?: I): UserDataRequest {
    return UserDataRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<UserDataRequest>, I>>(object: I): UserDataRequest {
    const message = createBaseUserDataRequest();
    message.fid = object.fid ?? 0;
    message.userDataType = object.userDataType ?? 0;
    return message;
  },
};

function createBaseOnChainEventRequest(): OnChainEventRequest {
  return { fid: 0, eventType: 0, pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const OnChainEventRequest = {
  encode(message: OnChainEventRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.eventType !== 0) {
      writer.uint32(16).int32(message.eventType);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(24).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(34).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(40).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OnChainEventRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOnChainEventRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.eventType = reader.int32() as any;
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): OnChainEventRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      eventType: isSet(object.eventType) ? onChainEventTypeFromJSON(object.eventType) : 0,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: OnChainEventRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.eventType !== undefined && (obj.eventType = onChainEventTypeToJSON(message.eventType));
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<OnChainEventRequest>, I>>(base?: I): OnChainEventRequest {
    return OnChainEventRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<OnChainEventRequest>, I>>(object: I): OnChainEventRequest {
    const message = createBaseOnChainEventRequest();
    message.fid = object.fid ?? 0;
    message.eventType = object.eventType ?? 0;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseOnChainEventResponse(): OnChainEventResponse {
  return { events: [], nextPageToken: undefined };
}

export const OnChainEventResponse = {
  encode(message: OnChainEventResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.events) {
      OnChainEvent.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== undefined) {
      writer.uint32(18).bytes(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OnChainEventResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOnChainEventResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.events.push(OnChainEvent.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.nextPageToken = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): OnChainEventResponse {
    return {
      events: Array.isArray(object?.events) ? object.events.map((e: any) => OnChainEvent.fromJSON(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? bytesFromBase64(object.nextPageToken) : undefined,
    };
  },

  toJSON(message: OnChainEventResponse): unknown {
    const obj: any = {};
    if (message.events) {
      obj.events = message.events.map((e) => e ? OnChainEvent.toJSON(e) : undefined);
    } else {
      obj.events = [];
    }
    message.nextPageToken !== undefined &&
      (obj.nextPageToken = message.nextPageToken !== undefined ? base64FromBytes(message.nextPageToken) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<OnChainEventResponse>, I>>(base?: I): OnChainEventResponse {
    return OnChainEventResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<OnChainEventResponse>, I>>(object: I): OnChainEventResponse {
    const message = createBaseOnChainEventResponse();
    message.events = object.events?.map((e) => OnChainEvent.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    return message;
  },
};

function createBaseChannelOwnerRequest(): ChannelOwnerRequest {
  return { channelKey: "" };
}

export const ChannelOwnerRequest = {
  encode(message: ChannelOwnerRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.channelKey !== "") {
      writer.uint32(10).string(message.channelKey);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelOwnerRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelOwnerRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.channelKey = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelOwnerRequest {
    return { channelKey: isSet(object.channelKey) ? String(object.channelKey) : "" };
  },

  toJSON(message: ChannelOwnerRequest): unknown {
    const obj: any = {};
    message.channelKey !== undefined && (obj.channelKey = message.channelKey);
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelOwnerRequest>, I>>(base?: I): ChannelOwnerRequest {
    return ChannelOwnerRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelOwnerRequest>, I>>(object: I): ChannelOwnerRequest {
    const message = createBaseChannelOwnerRequest();
    message.channelKey = object.channelKey ?? "";
    return message;
  },
};

function createBaseChannelOwnerResponse(): ChannelOwnerResponse {
  return { fid: 0, ownerAddress: new Uint8Array(), expiry: 0 };
}

export const ChannelOwnerResponse = {
  encode(message: ChannelOwnerResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.ownerAddress.length !== 0) {
      writer.uint32(18).bytes(message.ownerAddress);
    }
    if (message.expiry !== 0) {
      writer.uint32(24).uint64(message.expiry);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelOwnerResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelOwnerResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.ownerAddress = reader.bytes();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.expiry = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelOwnerResponse {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      ownerAddress: isSet(object.ownerAddress) ? bytesFromBase64(object.ownerAddress) : new Uint8Array(),
      expiry: isSet(object.expiry) ? Number(object.expiry) : 0,
    };
  },

  toJSON(message: ChannelOwnerResponse): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.ownerAddress !== undefined &&
      (obj.ownerAddress = base64FromBytes(
        message.ownerAddress !== undefined ? message.ownerAddress : new Uint8Array(),
      ));
    message.expiry !== undefined && (obj.expiry = Math.round(message.expiry));
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelOwnerResponse>, I>>(base?: I): ChannelOwnerResponse {
    return ChannelOwnerResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelOwnerResponse>, I>>(object: I): ChannelOwnerResponse {
    const message = createBaseChannelOwnerResponse();
    message.fid = object.fid ?? 0;
    message.ownerAddress = object.ownerAddress ?? new Uint8Array();
    message.expiry = object.expiry ?? 0;
    return message;
  },
};

function createBaseChannelsByAddressRequest(): ChannelsByAddressRequest {
  return { ownerAddress: new Uint8Array(), pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const ChannelsByAddressRequest = {
  encode(message: ChannelsByAddressRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.ownerAddress.length !== 0) {
      writer.uint32(10).bytes(message.ownerAddress);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(16).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(26).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(32).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelsByAddressRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelsByAddressRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.ownerAddress = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelsByAddressRequest {
    return {
      ownerAddress: isSet(object.ownerAddress) ? bytesFromBase64(object.ownerAddress) : new Uint8Array(),
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: ChannelsByAddressRequest): unknown {
    const obj: any = {};
    message.ownerAddress !== undefined &&
      (obj.ownerAddress = base64FromBytes(
        message.ownerAddress !== undefined ? message.ownerAddress : new Uint8Array(),
      ));
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelsByAddressRequest>, I>>(base?: I): ChannelsByAddressRequest {
    return ChannelsByAddressRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelsByAddressRequest>, I>>(object: I): ChannelsByAddressRequest {
    const message = createBaseChannelsByAddressRequest();
    message.ownerAddress = object.ownerAddress ?? new Uint8Array();
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseChannelsByFidRequest(): ChannelsByFidRequest {
  return { fid: 0, pageSize: undefined, pageToken: undefined };
}

export const ChannelsByFidRequest = {
  encode(message: ChannelsByFidRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(16).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(26).bytes(message.pageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelsByFidRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelsByFidRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelsByFidRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
    };
  },

  toJSON(message: ChannelsByFidRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelsByFidRequest>, I>>(base?: I): ChannelsByFidRequest {
    return ChannelsByFidRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelsByFidRequest>, I>>(object: I): ChannelsByFidRequest {
    const message = createBaseChannelsByFidRequest();
    message.fid = object.fid ?? 0;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    return message;
  },
};

function createBaseChannelInfo(): ChannelInfo {
  return { channelKey: "", fid: 0, ownerAddress: new Uint8Array(), expiry: 0 };
}

export const ChannelInfo = {
  encode(message: ChannelInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.channelKey !== "") {
      writer.uint32(10).string(message.channelKey);
    }
    if (message.fid !== 0) {
      writer.uint32(16).uint64(message.fid);
    }
    if (message.ownerAddress.length !== 0) {
      writer.uint32(26).bytes(message.ownerAddress);
    }
    if (message.expiry !== 0) {
      writer.uint32(32).uint64(message.expiry);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelInfo();
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

          message.fid = longToNumber(reader.uint64() as Long);
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

          message.expiry = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelInfo {
    return {
      channelKey: isSet(object.channelKey) ? String(object.channelKey) : "",
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      ownerAddress: isSet(object.ownerAddress) ? bytesFromBase64(object.ownerAddress) : new Uint8Array(),
      expiry: isSet(object.expiry) ? Number(object.expiry) : 0,
    };
  },

  toJSON(message: ChannelInfo): unknown {
    const obj: any = {};
    message.channelKey !== undefined && (obj.channelKey = message.channelKey);
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.ownerAddress !== undefined &&
      (obj.ownerAddress = base64FromBytes(
        message.ownerAddress !== undefined ? message.ownerAddress : new Uint8Array(),
      ));
    message.expiry !== undefined && (obj.expiry = Math.round(message.expiry));
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelInfo>, I>>(base?: I): ChannelInfo {
    return ChannelInfo.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelInfo>, I>>(object: I): ChannelInfo {
    const message = createBaseChannelInfo();
    message.channelKey = object.channelKey ?? "";
    message.fid = object.fid ?? 0;
    message.ownerAddress = object.ownerAddress ?? new Uint8Array();
    message.expiry = object.expiry ?? 0;
    return message;
  },
};

function createBaseChannelsResponse(): ChannelsResponse {
  return { channels: [], nextPageToken: undefined };
}

export const ChannelsResponse = {
  encode(message: ChannelsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.channels) {
      ChannelInfo.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== undefined) {
      writer.uint32(18).bytes(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.channels.push(ChannelInfo.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.nextPageToken = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelsResponse {
    return {
      channels: Array.isArray(object?.channels) ? object.channels.map((e: any) => ChannelInfo.fromJSON(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? bytesFromBase64(object.nextPageToken) : undefined,
    };
  },

  toJSON(message: ChannelsResponse): unknown {
    const obj: any = {};
    if (message.channels) {
      obj.channels = message.channels.map((e) => e ? ChannelInfo.toJSON(e) : undefined);
    } else {
      obj.channels = [];
    }
    message.nextPageToken !== undefined &&
      (obj.nextPageToken = message.nextPageToken !== undefined ? base64FromBytes(message.nextPageToken) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelsResponse>, I>>(base?: I): ChannelsResponse {
    return ChannelsResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelsResponse>, I>>(object: I): ChannelsResponse {
    const message = createBaseChannelsResponse();
    message.channels = object.channels?.map((e) => ChannelInfo.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    return message;
  },
};

function createBaseChannelRequest(): ChannelRequest {
  return { channelId: new Uint8Array() };
}

export const ChannelRequest = {
  encode(message: ChannelRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.channelId.length !== 0) {
      writer.uint32(10).bytes(message.channelId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.channelId = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelRequest {
    return { channelId: isSet(object.channelId) ? bytesFromBase64(object.channelId) : new Uint8Array() };
  },

  toJSON(message: ChannelRequest): unknown {
    const obj: any = {};
    message.channelId !== undefined &&
      (obj.channelId = base64FromBytes(message.channelId !== undefined ? message.channelId : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelRequest>, I>>(base?: I): ChannelRequest {
    return ChannelRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelRequest>, I>>(object: I): ChannelRequest {
    const message = createBaseChannelRequest();
    message.channelId = object.channelId ?? new Uint8Array();
    return message;
  },
};

function createBaseChannelMemberRequest(): ChannelMemberRequest {
  return { channelId: new Uint8Array(), fid: 0 };
}

export const ChannelMemberRequest = {
  encode(message: ChannelMemberRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.channelId.length !== 0) {
      writer.uint32(10).bytes(message.channelId);
    }
    if (message.fid !== 0) {
      writer.uint32(16).uint64(message.fid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelMemberRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelMemberRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.channelId = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelMemberRequest {
    return {
      channelId: isSet(object.channelId) ? bytesFromBase64(object.channelId) : new Uint8Array(),
      fid: isSet(object.fid) ? Number(object.fid) : 0,
    };
  },

  toJSON(message: ChannelMemberRequest): unknown {
    const obj: any = {};
    message.channelId !== undefined &&
      (obj.channelId = base64FromBytes(message.channelId !== undefined ? message.channelId : new Uint8Array()));
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelMemberRequest>, I>>(base?: I): ChannelMemberRequest {
    return ChannelMemberRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelMemberRequest>, I>>(object: I): ChannelMemberRequest {
    const message = createBaseChannelMemberRequest();
    message.channelId = object.channelId ?? new Uint8Array();
    message.fid = object.fid ?? 0;
    return message;
  },
};

function createBaseChannelMemberResponse(): ChannelMemberResponse {
  return { state: 0, lastActionTs: undefined };
}

export const ChannelMemberResponse = {
  encode(message: ChannelMemberResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.state !== 0) {
      writer.uint32(8).int32(message.state);
    }
    if (message.lastActionTs !== undefined) {
      writer.uint32(16).uint32(message.lastActionTs);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelMemberResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelMemberResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.state = reader.int32() as any;
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.lastActionTs = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelMemberResponse {
    return {
      state: isSet(object.state) ? channelMemberStateFromJSON(object.state) : 0,
      lastActionTs: isSet(object.lastActionTs) ? Number(object.lastActionTs) : undefined,
    };
  },

  toJSON(message: ChannelMemberResponse): unknown {
    const obj: any = {};
    message.state !== undefined && (obj.state = channelMemberStateToJSON(message.state));
    message.lastActionTs !== undefined && (obj.lastActionTs = Math.round(message.lastActionTs));
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelMemberResponse>, I>>(base?: I): ChannelMemberResponse {
    return ChannelMemberResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelMemberResponse>, I>>(object: I): ChannelMemberResponse {
    const message = createBaseChannelMemberResponse();
    message.state = object.state ?? 0;
    message.lastActionTs = object.lastActionTs ?? undefined;
    return message;
  },
};

function createBaseChannelMembersRequest(): ChannelMembersRequest {
  return {
    channelId: new Uint8Array(),
    stateFilter: undefined,
    pageSize: undefined,
    pageToken: undefined,
    reverse: undefined,
  };
}

export const ChannelMembersRequest = {
  encode(message: ChannelMembersRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.channelId.length !== 0) {
      writer.uint32(10).bytes(message.channelId);
    }
    if (message.stateFilter !== undefined) {
      writer.uint32(16).int32(message.stateFilter);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(24).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(34).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(40).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelMembersRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelMembersRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.channelId = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.stateFilter = reader.int32() as any;
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelMembersRequest {
    return {
      channelId: isSet(object.channelId) ? bytesFromBase64(object.channelId) : new Uint8Array(),
      stateFilter: isSet(object.stateFilter) ? channelMemberStateFromJSON(object.stateFilter) : undefined,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: ChannelMembersRequest): unknown {
    const obj: any = {};
    message.channelId !== undefined &&
      (obj.channelId = base64FromBytes(message.channelId !== undefined ? message.channelId : new Uint8Array()));
    message.stateFilter !== undefined &&
      (obj.stateFilter = message.stateFilter !== undefined ? channelMemberStateToJSON(message.stateFilter) : undefined);
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelMembersRequest>, I>>(base?: I): ChannelMembersRequest {
    return ChannelMembersRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelMembersRequest>, I>>(object: I): ChannelMembersRequest {
    const message = createBaseChannelMembersRequest();
    message.channelId = object.channelId ?? new Uint8Array();
    message.stateFilter = object.stateFilter ?? undefined;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseChannelMember(): ChannelMember {
  return { fid: 0, state: 0 };
}

export const ChannelMember = {
  encode(message: ChannelMember, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.state !== 0) {
      writer.uint32(16).int32(message.state);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelMember {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelMember();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.state = reader.int32() as any;
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelMember {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      state: isSet(object.state) ? channelMemberStateFromJSON(object.state) : 0,
    };
  },

  toJSON(message: ChannelMember): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.state !== undefined && (obj.state = channelMemberStateToJSON(message.state));
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelMember>, I>>(base?: I): ChannelMember {
    return ChannelMember.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelMember>, I>>(object: I): ChannelMember {
    const message = createBaseChannelMember();
    message.fid = object.fid ?? 0;
    message.state = object.state ?? 0;
    return message;
  },
};

function createBaseChannelMembersResponse(): ChannelMembersResponse {
  return { members: [], nextPageToken: undefined };
}

export const ChannelMembersResponse = {
  encode(message: ChannelMembersResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.members) {
      ChannelMember.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== undefined) {
      writer.uint32(18).bytes(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelMembersResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelMembersResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.members.push(ChannelMember.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.nextPageToken = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelMembersResponse {
    return {
      members: Array.isArray(object?.members) ? object.members.map((e: any) => ChannelMember.fromJSON(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? bytesFromBase64(object.nextPageToken) : undefined,
    };
  },

  toJSON(message: ChannelMembersResponse): unknown {
    const obj: any = {};
    if (message.members) {
      obj.members = message.members.map((e) => e ? ChannelMember.toJSON(e) : undefined);
    } else {
      obj.members = [];
    }
    message.nextPageToken !== undefined &&
      (obj.nextPageToken = message.nextPageToken !== undefined ? base64FromBytes(message.nextPageToken) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelMembersResponse>, I>>(base?: I): ChannelMembersResponse {
    return ChannelMembersResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelMembersResponse>, I>>(object: I): ChannelMembersResponse {
    const message = createBaseChannelMembersResponse();
    message.members = object.members?.map((e) => ChannelMember.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    return message;
  },
};

function createBaseChannelPin(): ChannelPin {
  return { castHash: new Uint8Array(), authorFid: 0 };
}

export const ChannelPin = {
  encode(message: ChannelPin, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.castHash.length !== 0) {
      writer.uint32(10).bytes(message.castHash);
    }
    if (message.authorFid !== 0) {
      writer.uint32(16).uint64(message.authorFid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelPin {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelPin();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.castHash = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.authorFid = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelPin {
    return {
      castHash: isSet(object.castHash) ? bytesFromBase64(object.castHash) : new Uint8Array(),
      authorFid: isSet(object.authorFid) ? Number(object.authorFid) : 0,
    };
  },

  toJSON(message: ChannelPin): unknown {
    const obj: any = {};
    message.castHash !== undefined &&
      (obj.castHash = base64FromBytes(message.castHash !== undefined ? message.castHash : new Uint8Array()));
    message.authorFid !== undefined && (obj.authorFid = Math.round(message.authorFid));
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelPin>, I>>(base?: I): ChannelPin {
    return ChannelPin.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelPin>, I>>(object: I): ChannelPin {
    const message = createBaseChannelPin();
    message.castHash = object.castHash ?? new Uint8Array();
    message.authorFid = object.authorFid ?? 0;
    return message;
  },
};

function createBaseChannelPinResponse(): ChannelPinResponse {
  return { pin: undefined };
}

export const ChannelPinResponse = {
  encode(message: ChannelPinResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.pin !== undefined) {
      ChannelPin.encode(message.pin, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelPinResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelPinResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.pin = ChannelPin.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelPinResponse {
    return { pin: isSet(object.pin) ? ChannelPin.fromJSON(object.pin) : undefined };
  },

  toJSON(message: ChannelPinResponse): unknown {
    const obj: any = {};
    message.pin !== undefined && (obj.pin = message.pin ? ChannelPin.toJSON(message.pin) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelPinResponse>, I>>(base?: I): ChannelPinResponse {
    return ChannelPinResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelPinResponse>, I>>(object: I): ChannelPinResponse {
    const message = createBaseChannelPinResponse();
    message.pin = (object.pin !== undefined && object.pin !== null) ? ChannelPin.fromPartial(object.pin) : undefined;
    return message;
  },
};

function createBaseChannelModerationsRequest(): ChannelModerationsRequest {
  return { channelId: new Uint8Array(), pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const ChannelModerationsRequest = {
  encode(message: ChannelModerationsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.channelId.length !== 0) {
      writer.uint32(10).bytes(message.channelId);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(16).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(26).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(32).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelModerationsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelModerationsRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.channelId = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelModerationsRequest {
    return {
      channelId: isSet(object.channelId) ? bytesFromBase64(object.channelId) : new Uint8Array(),
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: ChannelModerationsRequest): unknown {
    const obj: any = {};
    message.channelId !== undefined &&
      (obj.channelId = base64FromBytes(message.channelId !== undefined ? message.channelId : new Uint8Array()));
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelModerationsRequest>, I>>(base?: I): ChannelModerationsRequest {
    return ChannelModerationsRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelModerationsRequest>, I>>(object: I): ChannelModerationsRequest {
    const message = createBaseChannelModerationsRequest();
    message.channelId = object.channelId ?? new Uint8Array();
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseChannelModeration(): ChannelModeration {
  return { castHash: new Uint8Array(), action: 0, authorFid: 0 };
}

export const ChannelModeration = {
  encode(message: ChannelModeration, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.castHash.length !== 0) {
      writer.uint32(10).bytes(message.castHash);
    }
    if (message.action !== 0) {
      writer.uint32(16).int32(message.action);
    }
    if (message.authorFid !== 0) {
      writer.uint32(24).uint64(message.authorFid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelModeration {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelModeration();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.castHash = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.action = reader.int32() as any;
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.authorFid = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelModeration {
    return {
      castHash: isSet(object.castHash) ? bytesFromBase64(object.castHash) : new Uint8Array(),
      action: isSet(object.action) ? channelModerateActionFromJSON(object.action) : 0,
      authorFid: isSet(object.authorFid) ? Number(object.authorFid) : 0,
    };
  },

  toJSON(message: ChannelModeration): unknown {
    const obj: any = {};
    message.castHash !== undefined &&
      (obj.castHash = base64FromBytes(message.castHash !== undefined ? message.castHash : new Uint8Array()));
    message.action !== undefined && (obj.action = channelModerateActionToJSON(message.action));
    message.authorFid !== undefined && (obj.authorFid = Math.round(message.authorFid));
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelModeration>, I>>(base?: I): ChannelModeration {
    return ChannelModeration.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelModeration>, I>>(object: I): ChannelModeration {
    const message = createBaseChannelModeration();
    message.castHash = object.castHash ?? new Uint8Array();
    message.action = object.action ?? 0;
    message.authorFid = object.authorFid ?? 0;
    return message;
  },
};

function createBaseChannelModerationsResponse(): ChannelModerationsResponse {
  return { moderations: [], nextPageToken: undefined };
}

export const ChannelModerationsResponse = {
  encode(message: ChannelModerationsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.moderations) {
      ChannelModeration.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== undefined) {
      writer.uint32(18).bytes(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelModerationsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelModerationsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.moderations.push(ChannelModeration.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.nextPageToken = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelModerationsResponse {
    return {
      moderations: Array.isArray(object?.moderations)
        ? object.moderations.map((e: any) => ChannelModeration.fromJSON(e))
        : [],
      nextPageToken: isSet(object.nextPageToken) ? bytesFromBase64(object.nextPageToken) : undefined,
    };
  },

  toJSON(message: ChannelModerationsResponse): unknown {
    const obj: any = {};
    if (message.moderations) {
      obj.moderations = message.moderations.map((e) => e ? ChannelModeration.toJSON(e) : undefined);
    } else {
      obj.moderations = [];
    }
    message.nextPageToken !== undefined &&
      (obj.nextPageToken = message.nextPageToken !== undefined ? base64FromBytes(message.nextPageToken) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelModerationsResponse>, I>>(base?: I): ChannelModerationsResponse {
    return ChannelModerationsResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelModerationsResponse>, I>>(object: I): ChannelModerationsResponse {
    const message = createBaseChannelModerationsResponse();
    message.moderations = object.moderations?.map((e) => ChannelModeration.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    return message;
  },
};

function createBaseChannelMetadataResponse(): ChannelMetadataResponse {
  return {
    name: undefined,
    description: undefined,
    imageUrl: undefined,
    header: undefined,
    rules: undefined,
    castingMode: 0,
    membershipMode: 0,
  };
}

export const ChannelMetadataResponse = {
  encode(message: ChannelMetadataResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== undefined) {
      writer.uint32(10).string(message.name);
    }
    if (message.description !== undefined) {
      writer.uint32(18).string(message.description);
    }
    if (message.imageUrl !== undefined) {
      writer.uint32(26).string(message.imageUrl);
    }
    if (message.header !== undefined) {
      writer.uint32(34).string(message.header);
    }
    if (message.rules !== undefined) {
      writer.uint32(42).string(message.rules);
    }
    if (message.castingMode !== 0) {
      writer.uint32(48).int32(message.castingMode);
    }
    if (message.membershipMode !== 0) {
      writer.uint32(56).int32(message.membershipMode);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelMetadataResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelMetadataResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.name = reader.string();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.description = reader.string();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.imageUrl = reader.string();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.header = reader.string();
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.rules = reader.string();
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.castingMode = reader.int32() as any;
          continue;
        case 7:
          if (tag != 56) {
            break;
          }

          message.membershipMode = reader.int32() as any;
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelMetadataResponse {
    return {
      name: isSet(object.name) ? String(object.name) : undefined,
      description: isSet(object.description) ? String(object.description) : undefined,
      imageUrl: isSet(object.imageUrl) ? String(object.imageUrl) : undefined,
      header: isSet(object.header) ? String(object.header) : undefined,
      rules: isSet(object.rules) ? String(object.rules) : undefined,
      castingMode: isSet(object.castingMode) ? castingModeFromJSON(object.castingMode) : 0,
      membershipMode: isSet(object.membershipMode) ? membershipModeFromJSON(object.membershipMode) : 0,
    };
  },

  toJSON(message: ChannelMetadataResponse): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    message.description !== undefined && (obj.description = message.description);
    message.imageUrl !== undefined && (obj.imageUrl = message.imageUrl);
    message.header !== undefined && (obj.header = message.header);
    message.rules !== undefined && (obj.rules = message.rules);
    message.castingMode !== undefined && (obj.castingMode = castingModeToJSON(message.castingMode));
    message.membershipMode !== undefined && (obj.membershipMode = membershipModeToJSON(message.membershipMode));
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelMetadataResponse>, I>>(base?: I): ChannelMetadataResponse {
    return ChannelMetadataResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelMetadataResponse>, I>>(object: I): ChannelMetadataResponse {
    const message = createBaseChannelMetadataResponse();
    message.name = object.name ?? undefined;
    message.description = object.description ?? undefined;
    message.imageUrl = object.imageUrl ?? undefined;
    message.header = object.header ?? undefined;
    message.rules = object.rules ?? undefined;
    message.castingMode = object.castingMode ?? 0;
    message.membershipMode = object.membershipMode ?? 0;
    return message;
  },
};

function createBaseChannelMembershipsByFidRequest(): ChannelMembershipsByFidRequest {
  return { fid: 0, pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const ChannelMembershipsByFidRequest = {
  encode(message: ChannelMembershipsByFidRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(16).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(26).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(32).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelMembershipsByFidRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelMembershipsByFidRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelMembershipsByFidRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: ChannelMembershipsByFidRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelMembershipsByFidRequest>, I>>(base?: I): ChannelMembershipsByFidRequest {
    return ChannelMembershipsByFidRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelMembershipsByFidRequest>, I>>(
    object: I,
  ): ChannelMembershipsByFidRequest {
    const message = createBaseChannelMembershipsByFidRequest();
    message.fid = object.fid ?? 0;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseChannelMembership(): ChannelMembership {
  return { channelId: new Uint8Array(), state: 0 };
}

export const ChannelMembership = {
  encode(message: ChannelMembership, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.channelId.length !== 0) {
      writer.uint32(10).bytes(message.channelId);
    }
    if (message.state !== 0) {
      writer.uint32(16).int32(message.state);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelMembership {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelMembership();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.channelId = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.state = reader.int32() as any;
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelMembership {
    return {
      channelId: isSet(object.channelId) ? bytesFromBase64(object.channelId) : new Uint8Array(),
      state: isSet(object.state) ? channelMemberStateFromJSON(object.state) : 0,
    };
  },

  toJSON(message: ChannelMembership): unknown {
    const obj: any = {};
    message.channelId !== undefined &&
      (obj.channelId = base64FromBytes(message.channelId !== undefined ? message.channelId : new Uint8Array()));
    message.state !== undefined && (obj.state = channelMemberStateToJSON(message.state));
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelMembership>, I>>(base?: I): ChannelMembership {
    return ChannelMembership.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelMembership>, I>>(object: I): ChannelMembership {
    const message = createBaseChannelMembership();
    message.channelId = object.channelId ?? new Uint8Array();
    message.state = object.state ?? 0;
    return message;
  },
};

function createBaseChannelMembershipsResponse(): ChannelMembershipsResponse {
  return { memberships: [], nextPageToken: undefined };
}

export const ChannelMembershipsResponse = {
  encode(message: ChannelMembershipsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.memberships) {
      ChannelMembership.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== undefined) {
      writer.uint32(18).bytes(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelMembershipsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelMembershipsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.memberships.push(ChannelMembership.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.nextPageToken = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelMembershipsResponse {
    return {
      memberships: Array.isArray(object?.memberships)
        ? object.memberships.map((e: any) => ChannelMembership.fromJSON(e))
        : [],
      nextPageToken: isSet(object.nextPageToken) ? bytesFromBase64(object.nextPageToken) : undefined,
    };
  },

  toJSON(message: ChannelMembershipsResponse): unknown {
    const obj: any = {};
    if (message.memberships) {
      obj.memberships = message.memberships.map((e) => e ? ChannelMembership.toJSON(e) : undefined);
    } else {
      obj.memberships = [];
    }
    message.nextPageToken !== undefined &&
      (obj.nextPageToken = message.nextPageToken !== undefined ? base64FromBytes(message.nextPageToken) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelMembershipsResponse>, I>>(base?: I): ChannelMembershipsResponse {
    return ChannelMembershipsResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelMembershipsResponse>, I>>(object: I): ChannelMembershipsResponse {
    const message = createBaseChannelMembershipsResponse();
    message.memberships = object.memberships?.map((e) => ChannelMembership.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    return message;
  },
};

function createBaseChannelFollower(): ChannelFollower {
  return { fid: 0, followedAt: 0 };
}

export const ChannelFollower = {
  encode(message: ChannelFollower, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.followedAt !== 0) {
      writer.uint32(16).uint32(message.followedAt);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelFollower {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelFollower();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.followedAt = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelFollower {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      followedAt: isSet(object.followedAt) ? Number(object.followedAt) : 0,
    };
  },

  toJSON(message: ChannelFollower): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.followedAt !== undefined && (obj.followedAt = Math.round(message.followedAt));
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelFollower>, I>>(base?: I): ChannelFollower {
    return ChannelFollower.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelFollower>, I>>(object: I): ChannelFollower {
    const message = createBaseChannelFollower();
    message.fid = object.fid ?? 0;
    message.followedAt = object.followedAt ?? 0;
    return message;
  },
};

function createBaseChannelFollowersRequest(): ChannelFollowersRequest {
  return { channelId: new Uint8Array(), pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const ChannelFollowersRequest = {
  encode(message: ChannelFollowersRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.channelId.length !== 0) {
      writer.uint32(10).bytes(message.channelId);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(16).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(26).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(32).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelFollowersRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelFollowersRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.channelId = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelFollowersRequest {
    return {
      channelId: isSet(object.channelId) ? bytesFromBase64(object.channelId) : new Uint8Array(),
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: ChannelFollowersRequest): unknown {
    const obj: any = {};
    message.channelId !== undefined &&
      (obj.channelId = base64FromBytes(message.channelId !== undefined ? message.channelId : new Uint8Array()));
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelFollowersRequest>, I>>(base?: I): ChannelFollowersRequest {
    return ChannelFollowersRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelFollowersRequest>, I>>(object: I): ChannelFollowersRequest {
    const message = createBaseChannelFollowersRequest();
    message.channelId = object.channelId ?? new Uint8Array();
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseChannelFollowersResponse(): ChannelFollowersResponse {
  return { followers: [], nextPageToken: undefined };
}

export const ChannelFollowersResponse = {
  encode(message: ChannelFollowersResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.followers) {
      ChannelFollower.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== undefined) {
      writer.uint32(18).bytes(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelFollowersResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelFollowersResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.followers.push(ChannelFollower.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.nextPageToken = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelFollowersResponse {
    return {
      followers: Array.isArray(object?.followers) ? object.followers.map((e: any) => ChannelFollower.fromJSON(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? bytesFromBase64(object.nextPageToken) : undefined,
    };
  },

  toJSON(message: ChannelFollowersResponse): unknown {
    const obj: any = {};
    if (message.followers) {
      obj.followers = message.followers.map((e) => e ? ChannelFollower.toJSON(e) : undefined);
    } else {
      obj.followers = [];
    }
    message.nextPageToken !== undefined &&
      (obj.nextPageToken = message.nextPageToken !== undefined ? base64FromBytes(message.nextPageToken) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelFollowersResponse>, I>>(base?: I): ChannelFollowersResponse {
    return ChannelFollowersResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelFollowersResponse>, I>>(object: I): ChannelFollowersResponse {
    const message = createBaseChannelFollowersResponse();
    message.followers = object.followers?.map((e) => ChannelFollower.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    return message;
  },
};

function createBaseChannelFollowerCountRequest(): ChannelFollowerCountRequest {
  return { channelId: new Uint8Array() };
}

export const ChannelFollowerCountRequest = {
  encode(message: ChannelFollowerCountRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.channelId.length !== 0) {
      writer.uint32(10).bytes(message.channelId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelFollowerCountRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelFollowerCountRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.channelId = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelFollowerCountRequest {
    return { channelId: isSet(object.channelId) ? bytesFromBase64(object.channelId) : new Uint8Array() };
  },

  toJSON(message: ChannelFollowerCountRequest): unknown {
    const obj: any = {};
    message.channelId !== undefined &&
      (obj.channelId = base64FromBytes(message.channelId !== undefined ? message.channelId : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelFollowerCountRequest>, I>>(base?: I): ChannelFollowerCountRequest {
    return ChannelFollowerCountRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelFollowerCountRequest>, I>>(object: I): ChannelFollowerCountRequest {
    const message = createBaseChannelFollowerCountRequest();
    message.channelId = object.channelId ?? new Uint8Array();
    return message;
  },
};

function createBaseChannelFollowerCountResponse(): ChannelFollowerCountResponse {
  return { count: 0 };
}

export const ChannelFollowerCountResponse = {
  encode(message: ChannelFollowerCountResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.count !== 0) {
      writer.uint32(8).uint64(message.count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelFollowerCountResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelFollowerCountResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.count = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelFollowerCountResponse {
    return { count: isSet(object.count) ? Number(object.count) : 0 };
  },

  toJSON(message: ChannelFollowerCountResponse): unknown {
    const obj: any = {};
    message.count !== undefined && (obj.count = Math.round(message.count));
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelFollowerCountResponse>, I>>(base?: I): ChannelFollowerCountResponse {
    return ChannelFollowerCountResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelFollowerCountResponse>, I>>(object: I): ChannelFollowerCountResponse {
    const message = createBaseChannelFollowerCountResponse();
    message.count = object.count ?? 0;
    return message;
  },
};

function createBaseChannelFollow(): ChannelFollow {
  return { channelId: new Uint8Array(), followedAt: 0 };
}

export const ChannelFollow = {
  encode(message: ChannelFollow, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.channelId.length !== 0) {
      writer.uint32(10).bytes(message.channelId);
    }
    if (message.followedAt !== 0) {
      writer.uint32(16).uint32(message.followedAt);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelFollow {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelFollow();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.channelId = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.followedAt = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelFollow {
    return {
      channelId: isSet(object.channelId) ? bytesFromBase64(object.channelId) : new Uint8Array(),
      followedAt: isSet(object.followedAt) ? Number(object.followedAt) : 0,
    };
  },

  toJSON(message: ChannelFollow): unknown {
    const obj: any = {};
    message.channelId !== undefined &&
      (obj.channelId = base64FromBytes(message.channelId !== undefined ? message.channelId : new Uint8Array()));
    message.followedAt !== undefined && (obj.followedAt = Math.round(message.followedAt));
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelFollow>, I>>(base?: I): ChannelFollow {
    return ChannelFollow.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelFollow>, I>>(object: I): ChannelFollow {
    const message = createBaseChannelFollow();
    message.channelId = object.channelId ?? new Uint8Array();
    message.followedAt = object.followedAt ?? 0;
    return message;
  },
};

function createBaseChannelFollowsRequest(): ChannelFollowsRequest {
  return { fid: 0, pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const ChannelFollowsRequest = {
  encode(message: ChannelFollowsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(16).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(26).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(32).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelFollowsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelFollowsRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelFollowsRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: ChannelFollowsRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelFollowsRequest>, I>>(base?: I): ChannelFollowsRequest {
    return ChannelFollowsRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelFollowsRequest>, I>>(object: I): ChannelFollowsRequest {
    const message = createBaseChannelFollowsRequest();
    message.fid = object.fid ?? 0;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseChannelFollowsResponse(): ChannelFollowsResponse {
  return { follows: [], nextPageToken: undefined };
}

export const ChannelFollowsResponse = {
  encode(message: ChannelFollowsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.follows) {
      ChannelFollow.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== undefined) {
      writer.uint32(18).bytes(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChannelFollowsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChannelFollowsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.follows.push(ChannelFollow.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.nextPageToken = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChannelFollowsResponse {
    return {
      follows: Array.isArray(object?.follows) ? object.follows.map((e: any) => ChannelFollow.fromJSON(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? bytesFromBase64(object.nextPageToken) : undefined,
    };
  },

  toJSON(message: ChannelFollowsResponse): unknown {
    const obj: any = {};
    if (message.follows) {
      obj.follows = message.follows.map((e) => e ? ChannelFollow.toJSON(e) : undefined);
    } else {
      obj.follows = [];
    }
    message.nextPageToken !== undefined &&
      (obj.nextPageToken = message.nextPageToken !== undefined ? base64FromBytes(message.nextPageToken) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ChannelFollowsResponse>, I>>(base?: I): ChannelFollowsResponse {
    return ChannelFollowsResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ChannelFollowsResponse>, I>>(object: I): ChannelFollowsResponse {
    const message = createBaseChannelFollowsResponse();
    message.follows = object.follows?.map((e) => ChannelFollow.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    return message;
  },
};

function createBaseIsFollowingChannelRequest(): IsFollowingChannelRequest {
  return { fid: 0, channelId: new Uint8Array() };
}

export const IsFollowingChannelRequest = {
  encode(message: IsFollowingChannelRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.channelId.length !== 0) {
      writer.uint32(18).bytes(message.channelId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): IsFollowingChannelRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseIsFollowingChannelRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.channelId = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): IsFollowingChannelRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      channelId: isSet(object.channelId) ? bytesFromBase64(object.channelId) : new Uint8Array(),
    };
  },

  toJSON(message: IsFollowingChannelRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.channelId !== undefined &&
      (obj.channelId = base64FromBytes(message.channelId !== undefined ? message.channelId : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<IsFollowingChannelRequest>, I>>(base?: I): IsFollowingChannelRequest {
    return IsFollowingChannelRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<IsFollowingChannelRequest>, I>>(object: I): IsFollowingChannelRequest {
    const message = createBaseIsFollowingChannelRequest();
    message.fid = object.fid ?? 0;
    message.channelId = object.channelId ?? new Uint8Array();
    return message;
  },
};

function createBaseIsFollowingChannelResponse(): IsFollowingChannelResponse {
  return { following: false, followedAt: undefined };
}

export const IsFollowingChannelResponse = {
  encode(message: IsFollowingChannelResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.following === true) {
      writer.uint32(8).bool(message.following);
    }
    if (message.followedAt !== undefined) {
      writer.uint32(16).uint32(message.followedAt);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): IsFollowingChannelResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseIsFollowingChannelResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.following = reader.bool();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.followedAt = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): IsFollowingChannelResponse {
    return {
      following: isSet(object.following) ? Boolean(object.following) : false,
      followedAt: isSet(object.followedAt) ? Number(object.followedAt) : undefined,
    };
  },

  toJSON(message: IsFollowingChannelResponse): unknown {
    const obj: any = {};
    message.following !== undefined && (obj.following = message.following);
    message.followedAt !== undefined && (obj.followedAt = Math.round(message.followedAt));
    return obj;
  },

  create<I extends Exact<DeepPartial<IsFollowingChannelResponse>, I>>(base?: I): IsFollowingChannelResponse {
    return IsFollowingChannelResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<IsFollowingChannelResponse>, I>>(object: I): IsFollowingChannelResponse {
    const message = createBaseIsFollowingChannelResponse();
    message.following = object.following ?? false;
    message.followedAt = object.followedAt ?? undefined;
    return message;
  },
};

function createBaseTierDetails(): TierDetails {
  return { tierType: 0, expiresAt: 0 };
}

export const TierDetails = {
  encode(message: TierDetails, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.tierType !== 0) {
      writer.uint32(8).int32(message.tierType);
    }
    if (message.expiresAt !== 0) {
      writer.uint32(16).uint64(message.expiresAt);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TierDetails {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTierDetails();
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

          message.expiresAt = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TierDetails {
    return {
      tierType: isSet(object.tierType) ? tierTypeFromJSON(object.tierType) : 0,
      expiresAt: isSet(object.expiresAt) ? Number(object.expiresAt) : 0,
    };
  },

  toJSON(message: TierDetails): unknown {
    const obj: any = {};
    message.tierType !== undefined && (obj.tierType = tierTypeToJSON(message.tierType));
    message.expiresAt !== undefined && (obj.expiresAt = Math.round(message.expiresAt));
    return obj;
  },

  create<I extends Exact<DeepPartial<TierDetails>, I>>(base?: I): TierDetails {
    return TierDetails.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TierDetails>, I>>(object: I): TierDetails {
    const message = createBaseTierDetails();
    message.tierType = object.tierType ?? 0;
    message.expiresAt = object.expiresAt ?? 0;
    return message;
  },
};

function createBaseStorageLimitsResponse(): StorageLimitsResponse {
  return { limits: [], units: 0, unitDetails: [], tierSubscriptions: [] };
}

export const StorageLimitsResponse = {
  encode(message: StorageLimitsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.limits) {
      StorageLimit.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.units !== 0) {
      writer.uint32(16).uint32(message.units);
    }
    for (const v of message.unitDetails) {
      StorageUnitDetails.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.tierSubscriptions) {
      TierDetails.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StorageLimitsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStorageLimitsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.limits.push(StorageLimit.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.units = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.unitDetails.push(StorageUnitDetails.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.tierSubscriptions.push(TierDetails.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): StorageLimitsResponse {
    return {
      limits: Array.isArray(object?.limits) ? object.limits.map((e: any) => StorageLimit.fromJSON(e)) : [],
      units: isSet(object.units) ? Number(object.units) : 0,
      unitDetails: Array.isArray(object?.unitDetails)
        ? object.unitDetails.map((e: any) => StorageUnitDetails.fromJSON(e))
        : [],
      tierSubscriptions: Array.isArray(object?.tierSubscriptions)
        ? object.tierSubscriptions.map((e: any) => TierDetails.fromJSON(e))
        : [],
    };
  },

  toJSON(message: StorageLimitsResponse): unknown {
    const obj: any = {};
    if (message.limits) {
      obj.limits = message.limits.map((e) => e ? StorageLimit.toJSON(e) : undefined);
    } else {
      obj.limits = [];
    }
    message.units !== undefined && (obj.units = Math.round(message.units));
    if (message.unitDetails) {
      obj.unitDetails = message.unitDetails.map((e) => e ? StorageUnitDetails.toJSON(e) : undefined);
    } else {
      obj.unitDetails = [];
    }
    if (message.tierSubscriptions) {
      obj.tierSubscriptions = message.tierSubscriptions.map((e) => e ? TierDetails.toJSON(e) : undefined);
    } else {
      obj.tierSubscriptions = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<StorageLimitsResponse>, I>>(base?: I): StorageLimitsResponse {
    return StorageLimitsResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<StorageLimitsResponse>, I>>(object: I): StorageLimitsResponse {
    const message = createBaseStorageLimitsResponse();
    message.limits = object.limits?.map((e) => StorageLimit.fromPartial(e)) || [];
    message.units = object.units ?? 0;
    message.unitDetails = object.unitDetails?.map((e) => StorageUnitDetails.fromPartial(e)) || [];
    message.tierSubscriptions = object.tierSubscriptions?.map((e) => TierDetails.fromPartial(e)) || [];
    return message;
  },
};

function createBaseStorageUnitDetails(): StorageUnitDetails {
  return { unitType: 0, unitSize: 0, purchasedUnitSize: 0, lentUnitSize: 0, borrowedUnitSize: 0 };
}

export const StorageUnitDetails = {
  encode(message: StorageUnitDetails, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.unitType !== 0) {
      writer.uint32(8).int32(message.unitType);
    }
    if (message.unitSize !== 0) {
      writer.uint32(16).uint32(message.unitSize);
    }
    if (message.purchasedUnitSize !== 0) {
      writer.uint32(24).uint32(message.purchasedUnitSize);
    }
    if (message.lentUnitSize !== 0) {
      writer.uint32(32).uint32(message.lentUnitSize);
    }
    if (message.borrowedUnitSize !== 0) {
      writer.uint32(40).uint32(message.borrowedUnitSize);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StorageUnitDetails {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStorageUnitDetails();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.unitType = reader.int32() as any;
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.unitSize = reader.uint32();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.purchasedUnitSize = reader.uint32();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.lentUnitSize = reader.uint32();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.borrowedUnitSize = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): StorageUnitDetails {
    return {
      unitType: isSet(object.unitType) ? storageUnitTypeFromJSON(object.unitType) : 0,
      unitSize: isSet(object.unitSize) ? Number(object.unitSize) : 0,
      purchasedUnitSize: isSet(object.purchasedUnitSize) ? Number(object.purchasedUnitSize) : 0,
      lentUnitSize: isSet(object.lentUnitSize) ? Number(object.lentUnitSize) : 0,
      borrowedUnitSize: isSet(object.borrowedUnitSize) ? Number(object.borrowedUnitSize) : 0,
    };
  },

  toJSON(message: StorageUnitDetails): unknown {
    const obj: any = {};
    message.unitType !== undefined && (obj.unitType = storageUnitTypeToJSON(message.unitType));
    message.unitSize !== undefined && (obj.unitSize = Math.round(message.unitSize));
    message.purchasedUnitSize !== undefined && (obj.purchasedUnitSize = Math.round(message.purchasedUnitSize));
    message.lentUnitSize !== undefined && (obj.lentUnitSize = Math.round(message.lentUnitSize));
    message.borrowedUnitSize !== undefined && (obj.borrowedUnitSize = Math.round(message.borrowedUnitSize));
    return obj;
  },

  create<I extends Exact<DeepPartial<StorageUnitDetails>, I>>(base?: I): StorageUnitDetails {
    return StorageUnitDetails.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<StorageUnitDetails>, I>>(object: I): StorageUnitDetails {
    const message = createBaseStorageUnitDetails();
    message.unitType = object.unitType ?? 0;
    message.unitSize = object.unitSize ?? 0;
    message.purchasedUnitSize = object.purchasedUnitSize ?? 0;
    message.lentUnitSize = object.lentUnitSize ?? 0;
    message.borrowedUnitSize = object.borrowedUnitSize ?? 0;
    return message;
  },
};

function createBaseStorageLimit(): StorageLimit {
  return { storeType: 0, name: "", limit: 0, used: 0, earliestTimestamp: 0, earliestHash: new Uint8Array() };
}

export const StorageLimit = {
  encode(message: StorageLimit, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.storeType !== 0) {
      writer.uint32(8).int32(message.storeType);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.limit !== 0) {
      writer.uint32(24).uint64(message.limit);
    }
    if (message.used !== 0) {
      writer.uint32(32).uint64(message.used);
    }
    if (message.earliestTimestamp !== 0) {
      writer.uint32(40).uint64(message.earliestTimestamp);
    }
    if (message.earliestHash.length !== 0) {
      writer.uint32(50).bytes(message.earliestHash);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StorageLimit {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStorageLimit();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.storeType = reader.int32() as any;
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.name = reader.string();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.limit = longToNumber(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.used = longToNumber(reader.uint64() as Long);
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.earliestTimestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.earliestHash = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): StorageLimit {
    return {
      storeType: isSet(object.storeType) ? storeTypeFromJSON(object.storeType) : 0,
      name: isSet(object.name) ? String(object.name) : "",
      limit: isSet(object.limit) ? Number(object.limit) : 0,
      used: isSet(object.used) ? Number(object.used) : 0,
      earliestTimestamp: isSet(object.earliestTimestamp) ? Number(object.earliestTimestamp) : 0,
      earliestHash: isSet(object.earliestHash) ? bytesFromBase64(object.earliestHash) : new Uint8Array(),
    };
  },

  toJSON(message: StorageLimit): unknown {
    const obj: any = {};
    message.storeType !== undefined && (obj.storeType = storeTypeToJSON(message.storeType));
    message.name !== undefined && (obj.name = message.name);
    message.limit !== undefined && (obj.limit = Math.round(message.limit));
    message.used !== undefined && (obj.used = Math.round(message.used));
    message.earliestTimestamp !== undefined && (obj.earliestTimestamp = Math.round(message.earliestTimestamp));
    message.earliestHash !== undefined &&
      (obj.earliestHash = base64FromBytes(
        message.earliestHash !== undefined ? message.earliestHash : new Uint8Array(),
      ));
    return obj;
  },

  create<I extends Exact<DeepPartial<StorageLimit>, I>>(base?: I): StorageLimit {
    return StorageLimit.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<StorageLimit>, I>>(object: I): StorageLimit {
    const message = createBaseStorageLimit();
    message.storeType = object.storeType ?? 0;
    message.name = object.name ?? "";
    message.limit = object.limit ?? 0;
    message.used = object.used ?? 0;
    message.earliestTimestamp = object.earliestTimestamp ?? 0;
    message.earliestHash = object.earliestHash ?? new Uint8Array();
    return message;
  },
};

function createBaseUsernameProofRequest(): UsernameProofRequest {
  return { name: new Uint8Array() };
}

export const UsernameProofRequest = {
  encode(message: UsernameProofRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name.length !== 0) {
      writer.uint32(10).bytes(message.name);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UsernameProofRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUsernameProofRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.name = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UsernameProofRequest {
    return { name: isSet(object.name) ? bytesFromBase64(object.name) : new Uint8Array() };
  },

  toJSON(message: UsernameProofRequest): unknown {
    const obj: any = {};
    message.name !== undefined &&
      (obj.name = base64FromBytes(message.name !== undefined ? message.name : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<UsernameProofRequest>, I>>(base?: I): UsernameProofRequest {
    return UsernameProofRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<UsernameProofRequest>, I>>(object: I): UsernameProofRequest {
    const message = createBaseUsernameProofRequest();
    message.name = object.name ?? new Uint8Array();
    return message;
  },
};

function createBaseUsernameProofsResponse(): UsernameProofsResponse {
  return { proofs: [] };
}

export const UsernameProofsResponse = {
  encode(message: UsernameProofsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.proofs) {
      UserNameProof.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UsernameProofsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUsernameProofsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.proofs.push(UserNameProof.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UsernameProofsResponse {
    return { proofs: Array.isArray(object?.proofs) ? object.proofs.map((e: any) => UserNameProof.fromJSON(e)) : [] };
  },

  toJSON(message: UsernameProofsResponse): unknown {
    const obj: any = {};
    if (message.proofs) {
      obj.proofs = message.proofs.map((e) => e ? UserNameProof.toJSON(e) : undefined);
    } else {
      obj.proofs = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<UsernameProofsResponse>, I>>(base?: I): UsernameProofsResponse {
    return UsernameProofsResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<UsernameProofsResponse>, I>>(object: I): UsernameProofsResponse {
    const message = createBaseUsernameProofsResponse();
    message.proofs = object.proofs?.map((e) => UserNameProof.fromPartial(e)) || [];
    return message;
  },
};

function createBaseValidationResponse(): ValidationResponse {
  return { valid: false, message: undefined };
}

export const ValidationResponse = {
  encode(message: ValidationResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.valid === true) {
      writer.uint32(8).bool(message.valid);
    }
    if (message.message !== undefined) {
      Message.encode(message.message, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ValidationResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseValidationResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.valid = reader.bool();
          continue;
        case 2:
          if (tag != 18) {
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

  fromJSON(object: any): ValidationResponse {
    return {
      valid: isSet(object.valid) ? Boolean(object.valid) : false,
      message: isSet(object.message) ? Message.fromJSON(object.message) : undefined,
    };
  },

  toJSON(message: ValidationResponse): unknown {
    const obj: any = {};
    message.valid !== undefined && (obj.valid = message.valid);
    message.message !== undefined && (obj.message = message.message ? Message.toJSON(message.message) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ValidationResponse>, I>>(base?: I): ValidationResponse {
    return ValidationResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ValidationResponse>, I>>(object: I): ValidationResponse {
    const message = createBaseValidationResponse();
    message.valid = object.valid ?? false;
    message.message = (object.message !== undefined && object.message !== null)
      ? Message.fromPartial(object.message)
      : undefined;
    return message;
  },
};

function createBaseVerificationRequest(): VerificationRequest {
  return { fid: 0, address: new Uint8Array() };
}

export const VerificationRequest = {
  encode(message: VerificationRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.address.length !== 0) {
      writer.uint32(18).bytes(message.address);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VerificationRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVerificationRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.address = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): VerificationRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      address: isSet(object.address) ? bytesFromBase64(object.address) : new Uint8Array(),
    };
  },

  toJSON(message: VerificationRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.address !== undefined &&
      (obj.address = base64FromBytes(message.address !== undefined ? message.address : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<VerificationRequest>, I>>(base?: I): VerificationRequest {
    return VerificationRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<VerificationRequest>, I>>(object: I): VerificationRequest {
    const message = createBaseVerificationRequest();
    message.fid = object.fid ?? 0;
    message.address = object.address ?? new Uint8Array();
    return message;
  },
};

function createBaseSignerRequest(): SignerRequest {
  return { fid: 0, signer: new Uint8Array() };
}

export const SignerRequest = {
  encode(message: SignerRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.signer.length !== 0) {
      writer.uint32(18).bytes(message.signer);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SignerRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignerRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.signer = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SignerRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      signer: isSet(object.signer) ? bytesFromBase64(object.signer) : new Uint8Array(),
    };
  },

  toJSON(message: SignerRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.signer !== undefined &&
      (obj.signer = base64FromBytes(message.signer !== undefined ? message.signer : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<SignerRequest>, I>>(base?: I): SignerRequest {
    return SignerRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SignerRequest>, I>>(object: I): SignerRequest {
    const message = createBaseSignerRequest();
    message.fid = object.fid ?? 0;
    message.signer = object.signer ?? new Uint8Array();
    return message;
  },
};

function createBaseSigner(): Signer {
  return {
    source: 0,
    key: new Uint8Array(),
    keyType: 0,
    fid: 0,
    addedAt: undefined,
    lastUsedAt: undefined,
    ttl: undefined,
    expiresAt: undefined,
    scopes: [],
    requestFid: undefined,
    nonce: undefined,
    onchainEvent: undefined,
  };
}

export const Signer = {
  encode(message: Signer, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.source !== 0) {
      writer.uint32(8).int32(message.source);
    }
    if (message.key.length !== 0) {
      writer.uint32(18).bytes(message.key);
    }
    if (message.keyType !== 0) {
      writer.uint32(24).uint32(message.keyType);
    }
    if (message.fid !== 0) {
      writer.uint32(32).uint64(message.fid);
    }
    if (message.addedAt !== undefined) {
      writer.uint32(40).uint64(message.addedAt);
    }
    if (message.lastUsedAt !== undefined) {
      writer.uint32(48).uint64(message.lastUsedAt);
    }
    if (message.ttl !== undefined) {
      writer.uint32(56).uint32(message.ttl);
    }
    if (message.expiresAt !== undefined) {
      writer.uint32(64).uint64(message.expiresAt);
    }
    writer.uint32(74).fork();
    for (const v of message.scopes) {
      writer.int32(v);
    }
    writer.ldelim();
    if (message.requestFid !== undefined) {
      writer.uint32(80).uint64(message.requestFid);
    }
    if (message.nonce !== undefined) {
      writer.uint32(88).uint32(message.nonce);
    }
    if (message.onchainEvent !== undefined) {
      OnChainEvent.encode(message.onchainEvent, writer.uint32(98).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Signer {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSigner();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.source = reader.int32() as any;
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.key = reader.bytes();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.keyType = reader.uint32();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.addedAt = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.lastUsedAt = longToNumber(reader.uint64() as Long);
          continue;
        case 7:
          if (tag != 56) {
            break;
          }

          message.ttl = reader.uint32();
          continue;
        case 8:
          if (tag != 64) {
            break;
          }

          message.expiresAt = longToNumber(reader.uint64() as Long);
          continue;
        case 9:
          if (tag == 72) {
            message.scopes.push(reader.int32());
            continue;
          }

          if (tag == 74) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.scopes.push(reader.int32());
            }

            continue;
          }

          break;
        case 10:
          if (tag != 80) {
            break;
          }

          message.requestFid = longToNumber(reader.uint64() as Long);
          continue;
        case 11:
          if (tag != 88) {
            break;
          }

          message.nonce = reader.uint32();
          continue;
        case 12:
          if (tag != 98) {
            break;
          }

          message.onchainEvent = OnChainEvent.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Signer {
    return {
      source: isSet(object.source) ? signerSourceFromJSON(object.source) : 0,
      key: isSet(object.key) ? bytesFromBase64(object.key) : new Uint8Array(),
      keyType: isSet(object.keyType) ? Number(object.keyType) : 0,
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      addedAt: isSet(object.addedAt) ? Number(object.addedAt) : undefined,
      lastUsedAt: isSet(object.lastUsedAt) ? Number(object.lastUsedAt) : undefined,
      ttl: isSet(object.ttl) ? Number(object.ttl) : undefined,
      expiresAt: isSet(object.expiresAt) ? Number(object.expiresAt) : undefined,
      scopes: Array.isArray(object?.scopes) ? object.scopes.map((e: any) => Number(e)) : [],
      requestFid: isSet(object.requestFid) ? Number(object.requestFid) : undefined,
      nonce: isSet(object.nonce) ? Number(object.nonce) : undefined,
      onchainEvent: isSet(object.onchainEvent) ? OnChainEvent.fromJSON(object.onchainEvent) : undefined,
    };
  },

  toJSON(message: Signer): unknown {
    const obj: any = {};
    message.source !== undefined && (obj.source = signerSourceToJSON(message.source));
    message.key !== undefined &&
      (obj.key = base64FromBytes(message.key !== undefined ? message.key : new Uint8Array()));
    message.keyType !== undefined && (obj.keyType = Math.round(message.keyType));
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.addedAt !== undefined && (obj.addedAt = Math.round(message.addedAt));
    message.lastUsedAt !== undefined && (obj.lastUsedAt = Math.round(message.lastUsedAt));
    message.ttl !== undefined && (obj.ttl = Math.round(message.ttl));
    message.expiresAt !== undefined && (obj.expiresAt = Math.round(message.expiresAt));
    if (message.scopes) {
      obj.scopes = message.scopes.map((e) => Math.round(e));
    } else {
      obj.scopes = [];
    }
    message.requestFid !== undefined && (obj.requestFid = Math.round(message.requestFid));
    message.nonce !== undefined && (obj.nonce = Math.round(message.nonce));
    message.onchainEvent !== undefined &&
      (obj.onchainEvent = message.onchainEvent ? OnChainEvent.toJSON(message.onchainEvent) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<Signer>, I>>(base?: I): Signer {
    return Signer.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Signer>, I>>(object: I): Signer {
    const message = createBaseSigner();
    message.source = object.source ?? 0;
    message.key = object.key ?? new Uint8Array();
    message.keyType = object.keyType ?? 0;
    message.fid = object.fid ?? 0;
    message.addedAt = object.addedAt ?? undefined;
    message.lastUsedAt = object.lastUsedAt ?? undefined;
    message.ttl = object.ttl ?? undefined;
    message.expiresAt = object.expiresAt ?? undefined;
    message.scopes = object.scopes?.map((e) => e) || [];
    message.requestFid = object.requestFid ?? undefined;
    message.nonce = object.nonce ?? undefined;
    message.onchainEvent = (object.onchainEvent !== undefined && object.onchainEvent !== null)
      ? OnChainEvent.fromPartial(object.onchainEvent)
      : undefined;
    return message;
  },
};

function createBaseSignerResponse(): SignerResponse {
  return { signer: undefined };
}

export const SignerResponse = {
  encode(message: SignerResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.signer !== undefined) {
      Signer.encode(message.signer, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SignerResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignerResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.signer = Signer.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SignerResponse {
    return { signer: isSet(object.signer) ? Signer.fromJSON(object.signer) : undefined };
  },

  toJSON(message: SignerResponse): unknown {
    const obj: any = {};
    message.signer !== undefined && (obj.signer = message.signer ? Signer.toJSON(message.signer) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SignerResponse>, I>>(base?: I): SignerResponse {
    return SignerResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SignerResponse>, I>>(object: I): SignerResponse {
    const message = createBaseSignerResponse();
    message.signer = (object.signer !== undefined && object.signer !== null)
      ? Signer.fromPartial(object.signer)
      : undefined;
    return message;
  },
};

function createBaseSignersByFidRequest(): SignersByFidRequest {
  return { fid: 0, pageSize: undefined, pageToken: undefined, reverse: undefined, requesterFids: [] };
}

export const SignersByFidRequest = {
  encode(message: SignersByFidRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(16).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(26).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(32).bool(message.reverse);
    }
    writer.uint32(42).fork();
    for (const v of message.requesterFids) {
      writer.uint64(v);
    }
    writer.ldelim();
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SignersByFidRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignersByFidRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.reverse = reader.bool();
          continue;
        case 5:
          if (tag == 40) {
            message.requesterFids.push(longToNumber(reader.uint64() as Long));
            continue;
          }

          if (tag == 42) {
            const end2 = reader.uint32() + reader.pos;
            while (reader.pos < end2) {
              message.requesterFids.push(longToNumber(reader.uint64() as Long));
            }

            continue;
          }

          break;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SignersByFidRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
      requesterFids: Array.isArray(object?.requesterFids) ? object.requesterFids.map((e: any) => Number(e)) : [],
    };
  },

  toJSON(message: SignersByFidRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    if (message.requesterFids) {
      obj.requesterFids = message.requesterFids.map((e) => Math.round(e));
    } else {
      obj.requesterFids = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SignersByFidRequest>, I>>(base?: I): SignersByFidRequest {
    return SignersByFidRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SignersByFidRequest>, I>>(object: I): SignersByFidRequest {
    const message = createBaseSignersByFidRequest();
    message.fid = object.fid ?? 0;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    message.requesterFids = object.requesterFids?.map((e) => e) || [];
    return message;
  },
};

function createBaseSignersByFidResponse(): SignersByFidResponse {
  return {
    signers: [],
    nextPageToken: undefined,
    gaslessSignerCount: 0,
    gaslessSignerLimit: 0,
    currentUserNonce: 0,
    requesterFidNonces: {},
  };
}

export const SignersByFidResponse = {
  encode(message: SignersByFidResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.signers) {
      Signer.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== undefined) {
      writer.uint32(18).bytes(message.nextPageToken);
    }
    if (message.gaslessSignerCount !== 0) {
      writer.uint32(24).uint32(message.gaslessSignerCount);
    }
    if (message.gaslessSignerLimit !== 0) {
      writer.uint32(32).uint32(message.gaslessSignerLimit);
    }
    if (message.currentUserNonce !== 0) {
      writer.uint32(40).uint32(message.currentUserNonce);
    }
    Object.entries(message.requesterFidNonces).forEach(([key, value]) => {
      SignersByFidResponse_RequesterFidNoncesEntry.encode({ key: key as any, value }, writer.uint32(50).fork())
        .ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SignersByFidResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignersByFidResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.signers.push(Signer.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.nextPageToken = reader.bytes();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.gaslessSignerCount = reader.uint32();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.gaslessSignerLimit = reader.uint32();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.currentUserNonce = reader.uint32();
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          const entry6 = SignersByFidResponse_RequesterFidNoncesEntry.decode(reader, reader.uint32());
          if (entry6.value !== undefined) {
            message.requesterFidNonces[entry6.key] = entry6.value;
          }
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SignersByFidResponse {
    return {
      signers: Array.isArray(object?.signers) ? object.signers.map((e: any) => Signer.fromJSON(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? bytesFromBase64(object.nextPageToken) : undefined,
      gaslessSignerCount: isSet(object.gaslessSignerCount) ? Number(object.gaslessSignerCount) : 0,
      gaslessSignerLimit: isSet(object.gaslessSignerLimit) ? Number(object.gaslessSignerLimit) : 0,
      currentUserNonce: isSet(object.currentUserNonce) ? Number(object.currentUserNonce) : 0,
      requesterFidNonces: isObject(object.requesterFidNonces)
        ? Object.entries(object.requesterFidNonces).reduce<{ [key: number]: number }>((acc, [key, value]) => {
          acc[Number(key)] = Number(value);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: SignersByFidResponse): unknown {
    const obj: any = {};
    if (message.signers) {
      obj.signers = message.signers.map((e) => e ? Signer.toJSON(e) : undefined);
    } else {
      obj.signers = [];
    }
    message.nextPageToken !== undefined &&
      (obj.nextPageToken = message.nextPageToken !== undefined ? base64FromBytes(message.nextPageToken) : undefined);
    message.gaslessSignerCount !== undefined && (obj.gaslessSignerCount = Math.round(message.gaslessSignerCount));
    message.gaslessSignerLimit !== undefined && (obj.gaslessSignerLimit = Math.round(message.gaslessSignerLimit));
    message.currentUserNonce !== undefined && (obj.currentUserNonce = Math.round(message.currentUserNonce));
    obj.requesterFidNonces = {};
    if (message.requesterFidNonces) {
      Object.entries(message.requesterFidNonces).forEach(([k, v]) => {
        obj.requesterFidNonces[k] = Math.round(v);
      });
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SignersByFidResponse>, I>>(base?: I): SignersByFidResponse {
    return SignersByFidResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SignersByFidResponse>, I>>(object: I): SignersByFidResponse {
    const message = createBaseSignersByFidResponse();
    message.signers = object.signers?.map((e) => Signer.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    message.gaslessSignerCount = object.gaslessSignerCount ?? 0;
    message.gaslessSignerLimit = object.gaslessSignerLimit ?? 0;
    message.currentUserNonce = object.currentUserNonce ?? 0;
    message.requesterFidNonces = Object.entries(object.requesterFidNonces ?? {}).reduce<{ [key: number]: number }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[Number(key)] = Number(value);
        }
        return acc;
      },
      {},
    );
    return message;
  },
};

function createBaseSignersByFidResponse_RequesterFidNoncesEntry(): SignersByFidResponse_RequesterFidNoncesEntry {
  return { key: 0, value: 0 };
}

export const SignersByFidResponse_RequesterFidNoncesEntry = {
  encode(message: SignersByFidResponse_RequesterFidNoncesEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== 0) {
      writer.uint32(8).uint64(message.key);
    }
    if (message.value !== 0) {
      writer.uint32(16).uint32(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SignersByFidResponse_RequesterFidNoncesEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignersByFidResponse_RequesterFidNoncesEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.key = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.value = reader.uint32();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SignersByFidResponse_RequesterFidNoncesEntry {
    return { key: isSet(object.key) ? Number(object.key) : 0, value: isSet(object.value) ? Number(object.value) : 0 };
  },

  toJSON(message: SignersByFidResponse_RequesterFidNoncesEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = Math.round(message.key));
    message.value !== undefined && (obj.value = Math.round(message.value));
    return obj;
  },

  create<I extends Exact<DeepPartial<SignersByFidResponse_RequesterFidNoncesEntry>, I>>(
    base?: I,
  ): SignersByFidResponse_RequesterFidNoncesEntry {
    return SignersByFidResponse_RequesterFidNoncesEntry.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SignersByFidResponse_RequesterFidNoncesEntry>, I>>(
    object: I,
  ): SignersByFidResponse_RequesterFidNoncesEntry {
    const message = createBaseSignersByFidResponse_RequesterFidNoncesEntry();
    message.key = object.key ?? 0;
    message.value = object.value ?? 0;
    return message;
  },
};

function createBaseLinkRequest(): LinkRequest {
  return { fid: 0, linkType: "", targetFid: undefined };
}

export const LinkRequest = {
  encode(message: LinkRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.linkType !== "") {
      writer.uint32(18).string(message.linkType);
    }
    if (message.targetFid !== undefined) {
      writer.uint32(24).uint64(message.targetFid);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LinkRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLinkRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.linkType = reader.string();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.targetFid = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LinkRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      linkType: isSet(object.linkType) ? String(object.linkType) : "",
      targetFid: isSet(object.targetFid) ? Number(object.targetFid) : undefined,
    };
  },

  toJSON(message: LinkRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.linkType !== undefined && (obj.linkType = message.linkType);
    message.targetFid !== undefined && (obj.targetFid = Math.round(message.targetFid));
    return obj;
  },

  create<I extends Exact<DeepPartial<LinkRequest>, I>>(base?: I): LinkRequest {
    return LinkRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<LinkRequest>, I>>(object: I): LinkRequest {
    const message = createBaseLinkRequest();
    message.fid = object.fid ?? 0;
    message.linkType = object.linkType ?? "";
    message.targetFid = object.targetFid ?? undefined;
    return message;
  },
};

function createBaseLinksByFidRequest(): LinksByFidRequest {
  return { fid: 0, linkType: undefined, pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const LinksByFidRequest = {
  encode(message: LinksByFidRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.linkType !== undefined) {
      writer.uint32(18).string(message.linkType);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(24).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(34).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(40).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LinksByFidRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLinksByFidRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.linkType = reader.string();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LinksByFidRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      linkType: isSet(object.linkType) ? String(object.linkType) : undefined,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: LinksByFidRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.linkType !== undefined && (obj.linkType = message.linkType);
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<LinksByFidRequest>, I>>(base?: I): LinksByFidRequest {
    return LinksByFidRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<LinksByFidRequest>, I>>(object: I): LinksByFidRequest {
    const message = createBaseLinksByFidRequest();
    message.fid = object.fid ?? 0;
    message.linkType = object.linkType ?? undefined;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseLinksByTargetRequest(): LinksByTargetRequest {
  return { targetFid: undefined, linkType: undefined, pageSize: undefined, pageToken: undefined, reverse: undefined };
}

export const LinksByTargetRequest = {
  encode(message: LinksByTargetRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.targetFid !== undefined) {
      writer.uint32(8).uint64(message.targetFid);
    }
    if (message.linkType !== undefined) {
      writer.uint32(18).string(message.linkType);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(24).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(34).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(40).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LinksByTargetRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLinksByTargetRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.targetFid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.linkType = reader.string();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LinksByTargetRequest {
    return {
      targetFid: isSet(object.targetFid) ? Number(object.targetFid) : undefined,
      linkType: isSet(object.linkType) ? String(object.linkType) : undefined,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: LinksByTargetRequest): unknown {
    const obj: any = {};
    message.targetFid !== undefined && (obj.targetFid = Math.round(message.targetFid));
    message.linkType !== undefined && (obj.linkType = message.linkType);
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<LinksByTargetRequest>, I>>(base?: I): LinksByTargetRequest {
    return LinksByTargetRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<LinksByTargetRequest>, I>>(object: I): LinksByTargetRequest {
    const message = createBaseLinksByTargetRequest();
    message.targetFid = object.targetFid ?? undefined;
    message.linkType = object.linkType ?? undefined;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseIdRegistryEventByAddressRequest(): IdRegistryEventByAddressRequest {
  return { address: new Uint8Array() };
}

export const IdRegistryEventByAddressRequest = {
  encode(message: IdRegistryEventByAddressRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address.length !== 0) {
      writer.uint32(10).bytes(message.address);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): IdRegistryEventByAddressRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseIdRegistryEventByAddressRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.address = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): IdRegistryEventByAddressRequest {
    return { address: isSet(object.address) ? bytesFromBase64(object.address) : new Uint8Array() };
  },

  toJSON(message: IdRegistryEventByAddressRequest): unknown {
    const obj: any = {};
    message.address !== undefined &&
      (obj.address = base64FromBytes(message.address !== undefined ? message.address : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<IdRegistryEventByAddressRequest>, I>>(base?: I): IdRegistryEventByAddressRequest {
    return IdRegistryEventByAddressRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<IdRegistryEventByAddressRequest>, I>>(
    object: I,
  ): IdRegistryEventByAddressRequest {
    const message = createBaseIdRegistryEventByAddressRequest();
    message.address = object.address ?? new Uint8Array();
    return message;
  },
};

function createBaseSubmitBulkMessagesRequest(): SubmitBulkMessagesRequest {
  return { messages: [] };
}

export const SubmitBulkMessagesRequest = {
  encode(message: SubmitBulkMessagesRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.messages) {
      Message.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubmitBulkMessagesRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubmitBulkMessagesRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.messages.push(Message.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SubmitBulkMessagesRequest {
    return { messages: Array.isArray(object?.messages) ? object.messages.map((e: any) => Message.fromJSON(e)) : [] };
  },

  toJSON(message: SubmitBulkMessagesRequest): unknown {
    const obj: any = {};
    if (message.messages) {
      obj.messages = message.messages.map((e) => e ? Message.toJSON(e) : undefined);
    } else {
      obj.messages = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SubmitBulkMessagesRequest>, I>>(base?: I): SubmitBulkMessagesRequest {
    return SubmitBulkMessagesRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubmitBulkMessagesRequest>, I>>(object: I): SubmitBulkMessagesRequest {
    const message = createBaseSubmitBulkMessagesRequest();
    message.messages = object.messages?.map((e) => Message.fromPartial(e)) || [];
    return message;
  },
};

function createBaseMessageError(): MessageError {
  return { hash: new Uint8Array(), errCode: "", message: "" };
}

export const MessageError = {
  encode(message: MessageError, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.hash.length !== 0) {
      writer.uint32(10).bytes(message.hash);
    }
    if (message.errCode !== "") {
      writer.uint32(18).string(message.errCode);
    }
    if (message.message !== "") {
      writer.uint32(26).string(message.message);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MessageError {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMessageError();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.hash = reader.bytes();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.errCode = reader.string();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.message = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MessageError {
    return {
      hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(),
      errCode: isSet(object.errCode) ? String(object.errCode) : "",
      message: isSet(object.message) ? String(object.message) : "",
    };
  },

  toJSON(message: MessageError): unknown {
    const obj: any = {};
    message.hash !== undefined &&
      (obj.hash = base64FromBytes(message.hash !== undefined ? message.hash : new Uint8Array()));
    message.errCode !== undefined && (obj.errCode = message.errCode);
    message.message !== undefined && (obj.message = message.message);
    return obj;
  },

  create<I extends Exact<DeepPartial<MessageError>, I>>(base?: I): MessageError {
    return MessageError.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MessageError>, I>>(object: I): MessageError {
    const message = createBaseMessageError();
    message.hash = object.hash ?? new Uint8Array();
    message.errCode = object.errCode ?? "";
    message.message = object.message ?? "";
    return message;
  },
};

function createBaseBulkMessageResponse(): BulkMessageResponse {
  return { message: undefined, messageError: undefined };
}

export const BulkMessageResponse = {
  encode(message: BulkMessageResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.message !== undefined) {
      Message.encode(message.message, writer.uint32(10).fork()).ldelim();
    }
    if (message.messageError !== undefined) {
      MessageError.encode(message.messageError, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BulkMessageResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBulkMessageResponse();
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

          message.messageError = MessageError.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BulkMessageResponse {
    return {
      message: isSet(object.message) ? Message.fromJSON(object.message) : undefined,
      messageError: isSet(object.messageError) ? MessageError.fromJSON(object.messageError) : undefined,
    };
  },

  toJSON(message: BulkMessageResponse): unknown {
    const obj: any = {};
    message.message !== undefined && (obj.message = message.message ? Message.toJSON(message.message) : undefined);
    message.messageError !== undefined &&
      (obj.messageError = message.messageError ? MessageError.toJSON(message.messageError) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<BulkMessageResponse>, I>>(base?: I): BulkMessageResponse {
    return BulkMessageResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<BulkMessageResponse>, I>>(object: I): BulkMessageResponse {
    const message = createBaseBulkMessageResponse();
    message.message = (object.message !== undefined && object.message !== null)
      ? Message.fromPartial(object.message)
      : undefined;
    message.messageError = (object.messageError !== undefined && object.messageError !== null)
      ? MessageError.fromPartial(object.messageError)
      : undefined;
    return message;
  },
};

function createBaseSubmitBulkMessagesResponse(): SubmitBulkMessagesResponse {
  return { messages: [] };
}

export const SubmitBulkMessagesResponse = {
  encode(message: SubmitBulkMessagesResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.messages) {
      BulkMessageResponse.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SubmitBulkMessagesResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubmitBulkMessagesResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.messages.push(BulkMessageResponse.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SubmitBulkMessagesResponse {
    return {
      messages: Array.isArray(object?.messages) ? object.messages.map((e: any) => BulkMessageResponse.fromJSON(e)) : [],
    };
  },

  toJSON(message: SubmitBulkMessagesResponse): unknown {
    const obj: any = {};
    if (message.messages) {
      obj.messages = message.messages.map((e) => e ? BulkMessageResponse.toJSON(e) : undefined);
    } else {
      obj.messages = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SubmitBulkMessagesResponse>, I>>(base?: I): SubmitBulkMessagesResponse {
    return SubmitBulkMessagesResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SubmitBulkMessagesResponse>, I>>(object: I): SubmitBulkMessagesResponse {
    const message = createBaseSubmitBulkMessagesResponse();
    message.messages = object.messages?.map((e) => BulkMessageResponse.fromPartial(e)) || [];
    return message;
  },
};

function createBaseTrieNodeMetadataRequest(): TrieNodeMetadataRequest {
  return { shardId: 0, prefix: new Uint8Array() };
}

export const TrieNodeMetadataRequest = {
  encode(message: TrieNodeMetadataRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.shardId !== 0) {
      writer.uint32(8).uint32(message.shardId);
    }
    if (message.prefix.length !== 0) {
      writer.uint32(18).bytes(message.prefix);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TrieNodeMetadataRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTrieNodeMetadataRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.shardId = reader.uint32();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.prefix = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TrieNodeMetadataRequest {
    return {
      shardId: isSet(object.shardId) ? Number(object.shardId) : 0,
      prefix: isSet(object.prefix) ? bytesFromBase64(object.prefix) : new Uint8Array(),
    };
  },

  toJSON(message: TrieNodeMetadataRequest): unknown {
    const obj: any = {};
    message.shardId !== undefined && (obj.shardId = Math.round(message.shardId));
    message.prefix !== undefined &&
      (obj.prefix = base64FromBytes(message.prefix !== undefined ? message.prefix : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<TrieNodeMetadataRequest>, I>>(base?: I): TrieNodeMetadataRequest {
    return TrieNodeMetadataRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TrieNodeMetadataRequest>, I>>(object: I): TrieNodeMetadataRequest {
    const message = createBaseTrieNodeMetadataRequest();
    message.shardId = object.shardId ?? 0;
    message.prefix = object.prefix ?? new Uint8Array();
    return message;
  },
};

function createBaseTrieNodeMetadataResponse(): TrieNodeMetadataResponse {
  return { prefix: new Uint8Array(), numMessages: 0, hash: "", children: [] };
}

export const TrieNodeMetadataResponse = {
  encode(message: TrieNodeMetadataResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.prefix.length !== 0) {
      writer.uint32(10).bytes(message.prefix);
    }
    if (message.numMessages !== 0) {
      writer.uint32(16).uint64(message.numMessages);
    }
    if (message.hash !== "") {
      writer.uint32(26).string(message.hash);
    }
    for (const v of message.children) {
      TrieNodeMetadataResponse.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TrieNodeMetadataResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTrieNodeMetadataResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.prefix = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.numMessages = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.hash = reader.string();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.children.push(TrieNodeMetadataResponse.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TrieNodeMetadataResponse {
    return {
      prefix: isSet(object.prefix) ? bytesFromBase64(object.prefix) : new Uint8Array(),
      numMessages: isSet(object.numMessages) ? Number(object.numMessages) : 0,
      hash: isSet(object.hash) ? String(object.hash) : "",
      children: Array.isArray(object?.children)
        ? object.children.map((e: any) => TrieNodeMetadataResponse.fromJSON(e))
        : [],
    };
  },

  toJSON(message: TrieNodeMetadataResponse): unknown {
    const obj: any = {};
    message.prefix !== undefined &&
      (obj.prefix = base64FromBytes(message.prefix !== undefined ? message.prefix : new Uint8Array()));
    message.numMessages !== undefined && (obj.numMessages = Math.round(message.numMessages));
    message.hash !== undefined && (obj.hash = message.hash);
    if (message.children) {
      obj.children = message.children.map((e) => e ? TrieNodeMetadataResponse.toJSON(e) : undefined);
    } else {
      obj.children = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<TrieNodeMetadataResponse>, I>>(base?: I): TrieNodeMetadataResponse {
    return TrieNodeMetadataResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TrieNodeMetadataResponse>, I>>(object: I): TrieNodeMetadataResponse {
    const message = createBaseTrieNodeMetadataResponse();
    message.prefix = object.prefix ?? new Uint8Array();
    message.numMessages = object.numMessages ?? 0;
    message.hash = object.hash ?? "";
    message.children = object.children?.map((e) => TrieNodeMetadataResponse.fromPartial(e)) || [];
    return message;
  },
};

function createBaseEventsRequest(): EventsRequest {
  return {
    startId: 0,
    shardIndex: undefined,
    stopId: undefined,
    pageSize: undefined,
    pageToken: undefined,
    reverse: undefined,
  };
}

export const EventsRequest = {
  encode(message: EventsRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.startId !== 0) {
      writer.uint32(8).uint64(message.startId);
    }
    if (message.shardIndex !== undefined) {
      writer.uint32(16).uint32(message.shardIndex);
    }
    if (message.stopId !== undefined) {
      writer.uint32(24).uint64(message.stopId);
    }
    if (message.pageSize !== undefined) {
      writer.uint32(32).uint32(message.pageSize);
    }
    if (message.pageToken !== undefined) {
      writer.uint32(42).bytes(message.pageToken);
    }
    if (message.reverse !== undefined) {
      writer.uint32(48).bool(message.reverse);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventsRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventsRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.startId = longToNumber(reader.uint64() as Long);
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

          message.stopId = longToNumber(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.pageSize = reader.uint32();
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.pageToken = reader.bytes();
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.reverse = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventsRequest {
    return {
      startId: isSet(object.startId) ? Number(object.startId) : 0,
      shardIndex: isSet(object.shardIndex) ? Number(object.shardIndex) : undefined,
      stopId: isSet(object.stopId) ? Number(object.stopId) : undefined,
      pageSize: isSet(object.pageSize) ? Number(object.pageSize) : undefined,
      pageToken: isSet(object.pageToken) ? bytesFromBase64(object.pageToken) : undefined,
      reverse: isSet(object.reverse) ? Boolean(object.reverse) : undefined,
    };
  },

  toJSON(message: EventsRequest): unknown {
    const obj: any = {};
    message.startId !== undefined && (obj.startId = Math.round(message.startId));
    message.shardIndex !== undefined && (obj.shardIndex = Math.round(message.shardIndex));
    message.stopId !== undefined && (obj.stopId = Math.round(message.stopId));
    message.pageSize !== undefined && (obj.pageSize = Math.round(message.pageSize));
    message.pageToken !== undefined &&
      (obj.pageToken = message.pageToken !== undefined ? base64FromBytes(message.pageToken) : undefined);
    message.reverse !== undefined && (obj.reverse = message.reverse);
    return obj;
  },

  create<I extends Exact<DeepPartial<EventsRequest>, I>>(base?: I): EventsRequest {
    return EventsRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventsRequest>, I>>(object: I): EventsRequest {
    const message = createBaseEventsRequest();
    message.startId = object.startId ?? 0;
    message.shardIndex = object.shardIndex ?? undefined;
    message.stopId = object.stopId ?? undefined;
    message.pageSize = object.pageSize ?? undefined;
    message.pageToken = object.pageToken ?? undefined;
    message.reverse = object.reverse ?? undefined;
    return message;
  },
};

function createBaseEventsResponse(): EventsResponse {
  return { events: [], nextPageToken: undefined };
}

export const EventsResponse = {
  encode(message: EventsResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.events) {
      HubEvent.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.nextPageToken !== undefined) {
      writer.uint32(18).bytes(message.nextPageToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EventsResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEventsResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.events.push(HubEvent.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.nextPageToken = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EventsResponse {
    return {
      events: Array.isArray(object?.events) ? object.events.map((e: any) => HubEvent.fromJSON(e)) : [],
      nextPageToken: isSet(object.nextPageToken) ? bytesFromBase64(object.nextPageToken) : undefined,
    };
  },

  toJSON(message: EventsResponse): unknown {
    const obj: any = {};
    if (message.events) {
      obj.events = message.events.map((e) => e ? HubEvent.toJSON(e) : undefined);
    } else {
      obj.events = [];
    }
    message.nextPageToken !== undefined &&
      (obj.nextPageToken = message.nextPageToken !== undefined ? base64FromBytes(message.nextPageToken) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<EventsResponse>, I>>(base?: I): EventsResponse {
    return EventsResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<EventsResponse>, I>>(object: I): EventsResponse {
    const message = createBaseEventsResponse();
    message.events = object.events?.map((e) => HubEvent.fromPartial(e)) || [];
    message.nextPageToken = object.nextPageToken ?? undefined;
    return message;
  },
};

function createBaseFidAddressTypeRequest(): FidAddressTypeRequest {
  return { fid: 0, address: new Uint8Array() };
}

export const FidAddressTypeRequest = {
  encode(message: FidAddressTypeRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.address.length !== 0) {
      writer.uint32(18).bytes(message.address);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FidAddressTypeRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFidAddressTypeRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.fid = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.address = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FidAddressTypeRequest {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      address: isSet(object.address) ? bytesFromBase64(object.address) : new Uint8Array(),
    };
  },

  toJSON(message: FidAddressTypeRequest): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.address !== undefined &&
      (obj.address = base64FromBytes(message.address !== undefined ? message.address : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<FidAddressTypeRequest>, I>>(base?: I): FidAddressTypeRequest {
    return FidAddressTypeRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FidAddressTypeRequest>, I>>(object: I): FidAddressTypeRequest {
    const message = createBaseFidAddressTypeRequest();
    message.fid = object.fid ?? 0;
    message.address = object.address ?? new Uint8Array();
    return message;
  },
};

function createBaseFidAddressTypeResponse(): FidAddressTypeResponse {
  return { isCustody: false, isAuth: false, isVerified: false };
}

export const FidAddressTypeResponse = {
  encode(message: FidAddressTypeResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.isCustody === true) {
      writer.uint32(8).bool(message.isCustody);
    }
    if (message.isAuth === true) {
      writer.uint32(16).bool(message.isAuth);
    }
    if (message.isVerified === true) {
      writer.uint32(24).bool(message.isVerified);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FidAddressTypeResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFidAddressTypeResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.isCustody = reader.bool();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.isAuth = reader.bool();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.isVerified = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FidAddressTypeResponse {
    return {
      isCustody: isSet(object.isCustody) ? Boolean(object.isCustody) : false,
      isAuth: isSet(object.isAuth) ? Boolean(object.isAuth) : false,
      isVerified: isSet(object.isVerified) ? Boolean(object.isVerified) : false,
    };
  },

  toJSON(message: FidAddressTypeResponse): unknown {
    const obj: any = {};
    message.isCustody !== undefined && (obj.isCustody = message.isCustody);
    message.isAuth !== undefined && (obj.isAuth = message.isAuth);
    message.isVerified !== undefined && (obj.isVerified = message.isVerified);
    return obj;
  },

  create<I extends Exact<DeepPartial<FidAddressTypeResponse>, I>>(base?: I): FidAddressTypeResponse {
    return FidAddressTypeResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FidAddressTypeResponse>, I>>(object: I): FidAddressTypeResponse {
    const message = createBaseFidAddressTypeResponse();
    message.isCustody = object.isCustody ?? false;
    message.isAuth = object.isAuth ?? false;
    message.isVerified = object.isVerified ?? false;
    return message;
  },
};

function createBaseContactInfoBody(): ContactInfoBody {
  return {
    gossipAddress: "",
    peerId: new Uint8Array(),
    snapchainVersion: "",
    network: 0,
    timestamp: 0,
    announceRpcAddress: "",
  };
}

export const ContactInfoBody = {
  encode(message: ContactInfoBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.gossipAddress !== "") {
      writer.uint32(10).string(message.gossipAddress);
    }
    if (message.peerId.length !== 0) {
      writer.uint32(18).bytes(message.peerId);
    }
    if (message.snapchainVersion !== "") {
      writer.uint32(26).string(message.snapchainVersion);
    }
    if (message.network !== 0) {
      writer.uint32(32).int32(message.network);
    }
    if (message.timestamp !== 0) {
      writer.uint32(40).uint64(message.timestamp);
    }
    if (message.announceRpcAddress !== "") {
      writer.uint32(50).string(message.announceRpcAddress);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ContactInfoBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseContactInfoBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.gossipAddress = reader.string();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.peerId = reader.bytes();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.snapchainVersion = reader.string();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.network = reader.int32() as any;
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.timestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.announceRpcAddress = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ContactInfoBody {
    return {
      gossipAddress: isSet(object.gossipAddress) ? String(object.gossipAddress) : "",
      peerId: isSet(object.peerId) ? bytesFromBase64(object.peerId) : new Uint8Array(),
      snapchainVersion: isSet(object.snapchainVersion) ? String(object.snapchainVersion) : "",
      network: isSet(object.network) ? farcasterNetworkFromJSON(object.network) : 0,
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      announceRpcAddress: isSet(object.announceRpcAddress) ? String(object.announceRpcAddress) : "",
    };
  },

  toJSON(message: ContactInfoBody): unknown {
    const obj: any = {};
    message.gossipAddress !== undefined && (obj.gossipAddress = message.gossipAddress);
    message.peerId !== undefined &&
      (obj.peerId = base64FromBytes(message.peerId !== undefined ? message.peerId : new Uint8Array()));
    message.snapchainVersion !== undefined && (obj.snapchainVersion = message.snapchainVersion);
    message.network !== undefined && (obj.network = farcasterNetworkToJSON(message.network));
    message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
    message.announceRpcAddress !== undefined && (obj.announceRpcAddress = message.announceRpcAddress);
    return obj;
  },

  create<I extends Exact<DeepPartial<ContactInfoBody>, I>>(base?: I): ContactInfoBody {
    return ContactInfoBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ContactInfoBody>, I>>(object: I): ContactInfoBody {
    const message = createBaseContactInfoBody();
    message.gossipAddress = object.gossipAddress ?? "";
    message.peerId = object.peerId ?? new Uint8Array();
    message.snapchainVersion = object.snapchainVersion ?? "";
    message.network = object.network ?? 0;
    message.timestamp = object.timestamp ?? 0;
    message.announceRpcAddress = object.announceRpcAddress ?? "";
    return message;
  },
};

function createBaseGetConnectedPeersRequest(): GetConnectedPeersRequest {
  return {};
}

export const GetConnectedPeersRequest = {
  encode(_: GetConnectedPeersRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetConnectedPeersRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetConnectedPeersRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetConnectedPeersRequest {
    return {};
  },

  toJSON(_: GetConnectedPeersRequest): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<GetConnectedPeersRequest>, I>>(base?: I): GetConnectedPeersRequest {
    return GetConnectedPeersRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetConnectedPeersRequest>, I>>(_: I): GetConnectedPeersRequest {
    const message = createBaseGetConnectedPeersRequest();
    return message;
  },
};

function createBaseGetConnectedPeersResponse(): GetConnectedPeersResponse {
  return { contacts: [], peers: [] };
}

export const GetConnectedPeersResponse = {
  encode(message: GetConnectedPeersResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.contacts) {
      ContactInfoBody.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.peers) {
      ConnectedPeer.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetConnectedPeersResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetConnectedPeersResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.contacts.push(ContactInfoBody.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.peers.push(ConnectedPeer.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetConnectedPeersResponse {
    return {
      contacts: Array.isArray(object?.contacts) ? object.contacts.map((e: any) => ContactInfoBody.fromJSON(e)) : [],
      peers: Array.isArray(object?.peers) ? object.peers.map((e: any) => ConnectedPeer.fromJSON(e)) : [],
    };
  },

  toJSON(message: GetConnectedPeersResponse): unknown {
    const obj: any = {};
    if (message.contacts) {
      obj.contacts = message.contacts.map((e) => e ? ContactInfoBody.toJSON(e) : undefined);
    } else {
      obj.contacts = [];
    }
    if (message.peers) {
      obj.peers = message.peers.map((e) => e ? ConnectedPeer.toJSON(e) : undefined);
    } else {
      obj.peers = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetConnectedPeersResponse>, I>>(base?: I): GetConnectedPeersResponse {
    return GetConnectedPeersResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetConnectedPeersResponse>, I>>(object: I): GetConnectedPeersResponse {
    const message = createBaseGetConnectedPeersResponse();
    message.contacts = object.contacts?.map((e) => ContactInfoBody.fromPartial(e)) || [];
    message.peers = object.peers?.map((e) => ConnectedPeer.fromPartial(e)) || [];
    return message;
  },
};

function createBaseConnectedPeer(): ConnectedPeer {
  return { source: 0, contactInfo: undefined, peerId: new Uint8Array(), observedAddress: "" };
}

export const ConnectedPeer = {
  encode(message: ConnectedPeer, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.source !== 0) {
      writer.uint32(8).int32(message.source);
    }
    if (message.contactInfo !== undefined) {
      ContactInfoBody.encode(message.contactInfo, writer.uint32(18).fork()).ldelim();
    }
    if (message.peerId.length !== 0) {
      writer.uint32(26).bytes(message.peerId);
    }
    if (message.observedAddress !== "") {
      writer.uint32(34).string(message.observedAddress);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ConnectedPeer {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConnectedPeer();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.source = reader.int32() as any;
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.contactInfo = ContactInfoBody.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.peerId = reader.bytes();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.observedAddress = reader.string();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ConnectedPeer {
    return {
      source: isSet(object.source) ? contactSourceFromJSON(object.source) : 0,
      contactInfo: isSet(object.contactInfo) ? ContactInfoBody.fromJSON(object.contactInfo) : undefined,
      peerId: isSet(object.peerId) ? bytesFromBase64(object.peerId) : new Uint8Array(),
      observedAddress: isSet(object.observedAddress) ? String(object.observedAddress) : "",
    };
  },

  toJSON(message: ConnectedPeer): unknown {
    const obj: any = {};
    message.source !== undefined && (obj.source = contactSourceToJSON(message.source));
    message.contactInfo !== undefined &&
      (obj.contactInfo = message.contactInfo ? ContactInfoBody.toJSON(message.contactInfo) : undefined);
    message.peerId !== undefined &&
      (obj.peerId = base64FromBytes(message.peerId !== undefined ? message.peerId : new Uint8Array()));
    message.observedAddress !== undefined && (obj.observedAddress = message.observedAddress);
    return obj;
  },

  create<I extends Exact<DeepPartial<ConnectedPeer>, I>>(base?: I): ConnectedPeer {
    return ConnectedPeer.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ConnectedPeer>, I>>(object: I): ConnectedPeer {
    const message = createBaseConnectedPeer();
    message.source = object.source ?? 0;
    message.contactInfo = (object.contactInfo !== undefined && object.contactInfo !== null)
      ? ContactInfoBody.fromPartial(object.contactInfo)
      : undefined;
    message.peerId = object.peerId ?? new Uint8Array();
    message.observedAddress = object.observedAddress ?? "";
    return message;
  },
};

function createBaseGetMeshViewRequest(): GetMeshViewRequest {
  return { validatorsOnly: false, ttl: 0, visitedPeerIds: [] };
}

export const GetMeshViewRequest = {
  encode(message: GetMeshViewRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.validatorsOnly === true) {
      writer.uint32(8).bool(message.validatorsOnly);
    }
    if (message.ttl !== 0) {
      writer.uint32(16).uint32(message.ttl);
    }
    for (const v of message.visitedPeerIds) {
      writer.uint32(26).bytes(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GetMeshViewRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetMeshViewRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.validatorsOnly = reader.bool();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.ttl = reader.uint32();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.visitedPeerIds.push(reader.bytes());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GetMeshViewRequest {
    return {
      validatorsOnly: isSet(object.validatorsOnly) ? Boolean(object.validatorsOnly) : false,
      ttl: isSet(object.ttl) ? Number(object.ttl) : 0,
      visitedPeerIds: Array.isArray(object?.visitedPeerIds)
        ? object.visitedPeerIds.map((e: any) => bytesFromBase64(e))
        : [],
    };
  },

  toJSON(message: GetMeshViewRequest): unknown {
    const obj: any = {};
    message.validatorsOnly !== undefined && (obj.validatorsOnly = message.validatorsOnly);
    message.ttl !== undefined && (obj.ttl = Math.round(message.ttl));
    if (message.visitedPeerIds) {
      obj.visitedPeerIds = message.visitedPeerIds.map((e) => base64FromBytes(e !== undefined ? e : new Uint8Array()));
    } else {
      obj.visitedPeerIds = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<GetMeshViewRequest>, I>>(base?: I): GetMeshViewRequest {
    return GetMeshViewRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GetMeshViewRequest>, I>>(object: I): GetMeshViewRequest {
    const message = createBaseGetMeshViewRequest();
    message.validatorsOnly = object.validatorsOnly ?? false;
    message.ttl = object.ttl ?? 0;
    message.visitedPeerIds = object.visitedPeerIds?.map((e) => e) || [];
    return message;
  },
};

function createBaseGossipRate(): GossipRate {
  return { topic: "", msgsPerSec: 0, bytesPerSec: 0, totalMsgs: 0, totalBytes: 0 };
}

export const GossipRate = {
  encode(message: GossipRate, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.topic !== "") {
      writer.uint32(10).string(message.topic);
    }
    if (message.msgsPerSec !== 0) {
      writer.uint32(17).double(message.msgsPerSec);
    }
    if (message.bytesPerSec !== 0) {
      writer.uint32(25).double(message.bytesPerSec);
    }
    if (message.totalMsgs !== 0) {
      writer.uint32(32).uint64(message.totalMsgs);
    }
    if (message.totalBytes !== 0) {
      writer.uint32(40).uint64(message.totalBytes);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): GossipRate {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGossipRate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.topic = reader.string();
          continue;
        case 2:
          if (tag != 17) {
            break;
          }

          message.msgsPerSec = reader.double();
          continue;
        case 3:
          if (tag != 25) {
            break;
          }

          message.bytesPerSec = reader.double();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.totalMsgs = longToNumber(reader.uint64() as Long);
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.totalBytes = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): GossipRate {
    return {
      topic: isSet(object.topic) ? String(object.topic) : "",
      msgsPerSec: isSet(object.msgsPerSec) ? Number(object.msgsPerSec) : 0,
      bytesPerSec: isSet(object.bytesPerSec) ? Number(object.bytesPerSec) : 0,
      totalMsgs: isSet(object.totalMsgs) ? Number(object.totalMsgs) : 0,
      totalBytes: isSet(object.totalBytes) ? Number(object.totalBytes) : 0,
    };
  },

  toJSON(message: GossipRate): unknown {
    const obj: any = {};
    message.topic !== undefined && (obj.topic = message.topic);
    message.msgsPerSec !== undefined && (obj.msgsPerSec = message.msgsPerSec);
    message.bytesPerSec !== undefined && (obj.bytesPerSec = message.bytesPerSec);
    message.totalMsgs !== undefined && (obj.totalMsgs = Math.round(message.totalMsgs));
    message.totalBytes !== undefined && (obj.totalBytes = Math.round(message.totalBytes));
    return obj;
  },

  create<I extends Exact<DeepPartial<GossipRate>, I>>(base?: I): GossipRate {
    return GossipRate.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<GossipRate>, I>>(object: I): GossipRate {
    const message = createBaseGossipRate();
    message.topic = object.topic ?? "";
    message.msgsPerSec = object.msgsPerSec ?? 0;
    message.bytesPerSec = object.bytesPerSec ?? 0;
    message.totalMsgs = object.totalMsgs ?? 0;
    message.totalBytes = object.totalBytes ?? 0;
    return message;
  },
};

function createBaseTopicMembership(): TopicMembership {
  return { topic: "", subscribed: false, inMesh: false };
}

export const TopicMembership = {
  encode(message: TopicMembership, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.topic !== "") {
      writer.uint32(10).string(message.topic);
    }
    if (message.subscribed === true) {
      writer.uint32(16).bool(message.subscribed);
    }
    if (message.inMesh === true) {
      writer.uint32(24).bool(message.inMesh);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TopicMembership {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTopicMembership();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.topic = reader.string();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.subscribed = reader.bool();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.inMesh = reader.bool();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): TopicMembership {
    return {
      topic: isSet(object.topic) ? String(object.topic) : "",
      subscribed: isSet(object.subscribed) ? Boolean(object.subscribed) : false,
      inMesh: isSet(object.inMesh) ? Boolean(object.inMesh) : false,
    };
  },

  toJSON(message: TopicMembership): unknown {
    const obj: any = {};
    message.topic !== undefined && (obj.topic = message.topic);
    message.subscribed !== undefined && (obj.subscribed = message.subscribed);
    message.inMesh !== undefined && (obj.inMesh = message.inMesh);
    return obj;
  },

  create<I extends Exact<DeepPartial<TopicMembership>, I>>(base?: I): TopicMembership {
    return TopicMembership.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<TopicMembership>, I>>(object: I): TopicMembership {
    const message = createBaseTopicMembership();
    message.topic = object.topic ?? "";
    message.subscribed = object.subscribed ?? false;
    message.inMesh = object.inMesh ?? false;
    return message;
  },
};

function createBaseMeshSelf(): MeshSelf {
  return {
    peerId: new Uint8Array(),
    consensusPublicKey: new Uint8Array(),
    isValidator: false,
    gossipAddress: "",
    rpcAddress: "",
    snapchainVersion: "",
    network: 0,
    subscribedTopics: [],
    consensusMeshSize: 0,
    currentHeight: 0,
  };
}

export const MeshSelf = {
  encode(message: MeshSelf, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.peerId.length !== 0) {
      writer.uint32(10).bytes(message.peerId);
    }
    if (message.consensusPublicKey.length !== 0) {
      writer.uint32(18).bytes(message.consensusPublicKey);
    }
    if (message.isValidator === true) {
      writer.uint32(24).bool(message.isValidator);
    }
    if (message.gossipAddress !== "") {
      writer.uint32(34).string(message.gossipAddress);
    }
    if (message.rpcAddress !== "") {
      writer.uint32(42).string(message.rpcAddress);
    }
    if (message.snapchainVersion !== "") {
      writer.uint32(50).string(message.snapchainVersion);
    }
    if (message.network !== 0) {
      writer.uint32(56).int32(message.network);
    }
    for (const v of message.subscribedTopics) {
      writer.uint32(66).string(v!);
    }
    if (message.consensusMeshSize !== 0) {
      writer.uint32(72).uint32(message.consensusMeshSize);
    }
    if (message.currentHeight !== 0) {
      writer.uint32(80).uint64(message.currentHeight);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MeshSelf {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMeshSelf();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.peerId = reader.bytes();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.consensusPublicKey = reader.bytes();
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.isValidator = reader.bool();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.gossipAddress = reader.string();
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.rpcAddress = reader.string();
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.snapchainVersion = reader.string();
          continue;
        case 7:
          if (tag != 56) {
            break;
          }

          message.network = reader.int32() as any;
          continue;
        case 8:
          if (tag != 66) {
            break;
          }

          message.subscribedTopics.push(reader.string());
          continue;
        case 9:
          if (tag != 72) {
            break;
          }

          message.consensusMeshSize = reader.uint32();
          continue;
        case 10:
          if (tag != 80) {
            break;
          }

          message.currentHeight = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MeshSelf {
    return {
      peerId: isSet(object.peerId) ? bytesFromBase64(object.peerId) : new Uint8Array(),
      consensusPublicKey: isSet(object.consensusPublicKey)
        ? bytesFromBase64(object.consensusPublicKey)
        : new Uint8Array(),
      isValidator: isSet(object.isValidator) ? Boolean(object.isValidator) : false,
      gossipAddress: isSet(object.gossipAddress) ? String(object.gossipAddress) : "",
      rpcAddress: isSet(object.rpcAddress) ? String(object.rpcAddress) : "",
      snapchainVersion: isSet(object.snapchainVersion) ? String(object.snapchainVersion) : "",
      network: isSet(object.network) ? farcasterNetworkFromJSON(object.network) : 0,
      subscribedTopics: Array.isArray(object?.subscribedTopics)
        ? object.subscribedTopics.map((e: any) => String(e))
        : [],
      consensusMeshSize: isSet(object.consensusMeshSize) ? Number(object.consensusMeshSize) : 0,
      currentHeight: isSet(object.currentHeight) ? Number(object.currentHeight) : 0,
    };
  },

  toJSON(message: MeshSelf): unknown {
    const obj: any = {};
    message.peerId !== undefined &&
      (obj.peerId = base64FromBytes(message.peerId !== undefined ? message.peerId : new Uint8Array()));
    message.consensusPublicKey !== undefined &&
      (obj.consensusPublicKey = base64FromBytes(
        message.consensusPublicKey !== undefined ? message.consensusPublicKey : new Uint8Array(),
      ));
    message.isValidator !== undefined && (obj.isValidator = message.isValidator);
    message.gossipAddress !== undefined && (obj.gossipAddress = message.gossipAddress);
    message.rpcAddress !== undefined && (obj.rpcAddress = message.rpcAddress);
    message.snapchainVersion !== undefined && (obj.snapchainVersion = message.snapchainVersion);
    message.network !== undefined && (obj.network = farcasterNetworkToJSON(message.network));
    if (message.subscribedTopics) {
      obj.subscribedTopics = message.subscribedTopics.map((e) => e);
    } else {
      obj.subscribedTopics = [];
    }
    message.consensusMeshSize !== undefined && (obj.consensusMeshSize = Math.round(message.consensusMeshSize));
    message.currentHeight !== undefined && (obj.currentHeight = Math.round(message.currentHeight));
    return obj;
  },

  create<I extends Exact<DeepPartial<MeshSelf>, I>>(base?: I): MeshSelf {
    return MeshSelf.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MeshSelf>, I>>(object: I): MeshSelf {
    const message = createBaseMeshSelf();
    message.peerId = object.peerId ?? new Uint8Array();
    message.consensusPublicKey = object.consensusPublicKey ?? new Uint8Array();
    message.isValidator = object.isValidator ?? false;
    message.gossipAddress = object.gossipAddress ?? "";
    message.rpcAddress = object.rpcAddress ?? "";
    message.snapchainVersion = object.snapchainVersion ?? "";
    message.network = object.network ?? 0;
    message.subscribedTopics = object.subscribedTopics?.map((e) => e) || [];
    message.consensusMeshSize = object.consensusMeshSize ?? 0;
    message.currentHeight = object.currentHeight ?? 0;
    return message;
  },
};

function createBaseMeshPeer(): MeshPeer {
  return {
    peerId: new Uint8Array(),
    nodeType: 0,
    consensusPublicKey: undefined,
    connected: false,
    directPeer: false,
    contactSource: 0,
    contactInfo: undefined,
    observedAddress: "",
    topics: [],
    gossipRates: [],
  };
}

export const MeshPeer = {
  encode(message: MeshPeer, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.peerId.length !== 0) {
      writer.uint32(10).bytes(message.peerId);
    }
    if (message.nodeType !== 0) {
      writer.uint32(16).int32(message.nodeType);
    }
    if (message.consensusPublicKey !== undefined) {
      writer.uint32(26).bytes(message.consensusPublicKey);
    }
    if (message.connected === true) {
      writer.uint32(32).bool(message.connected);
    }
    if (message.directPeer === true) {
      writer.uint32(40).bool(message.directPeer);
    }
    if (message.contactSource !== 0) {
      writer.uint32(48).int32(message.contactSource);
    }
    if (message.contactInfo !== undefined) {
      ContactInfoBody.encode(message.contactInfo, writer.uint32(58).fork()).ldelim();
    }
    if (message.observedAddress !== "") {
      writer.uint32(66).string(message.observedAddress);
    }
    for (const v of message.topics) {
      TopicMembership.encode(v!, writer.uint32(74).fork()).ldelim();
    }
    for (const v of message.gossipRates) {
      GossipRate.encode(v!, writer.uint32(82).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MeshPeer {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMeshPeer();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.peerId = reader.bytes();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.nodeType = reader.int32() as any;
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.consensusPublicKey = reader.bytes();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.connected = reader.bool();
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.directPeer = reader.bool();
          continue;
        case 6:
          if (tag != 48) {
            break;
          }

          message.contactSource = reader.int32() as any;
          continue;
        case 7:
          if (tag != 58) {
            break;
          }

          message.contactInfo = ContactInfoBody.decode(reader, reader.uint32());
          continue;
        case 8:
          if (tag != 66) {
            break;
          }

          message.observedAddress = reader.string();
          continue;
        case 9:
          if (tag != 74) {
            break;
          }

          message.topics.push(TopicMembership.decode(reader, reader.uint32()));
          continue;
        case 10:
          if (tag != 82) {
            break;
          }

          message.gossipRates.push(GossipRate.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MeshPeer {
    return {
      peerId: isSet(object.peerId) ? bytesFromBase64(object.peerId) : new Uint8Array(),
      nodeType: isSet(object.nodeType) ? meshNodeTypeFromJSON(object.nodeType) : 0,
      consensusPublicKey: isSet(object.consensusPublicKey) ? bytesFromBase64(object.consensusPublicKey) : undefined,
      connected: isSet(object.connected) ? Boolean(object.connected) : false,
      directPeer: isSet(object.directPeer) ? Boolean(object.directPeer) : false,
      contactSource: isSet(object.contactSource) ? contactSourceFromJSON(object.contactSource) : 0,
      contactInfo: isSet(object.contactInfo) ? ContactInfoBody.fromJSON(object.contactInfo) : undefined,
      observedAddress: isSet(object.observedAddress) ? String(object.observedAddress) : "",
      topics: Array.isArray(object?.topics) ? object.topics.map((e: any) => TopicMembership.fromJSON(e)) : [],
      gossipRates: Array.isArray(object?.gossipRates) ? object.gossipRates.map((e: any) => GossipRate.fromJSON(e)) : [],
    };
  },

  toJSON(message: MeshPeer): unknown {
    const obj: any = {};
    message.peerId !== undefined &&
      (obj.peerId = base64FromBytes(message.peerId !== undefined ? message.peerId : new Uint8Array()));
    message.nodeType !== undefined && (obj.nodeType = meshNodeTypeToJSON(message.nodeType));
    message.consensusPublicKey !== undefined && (obj.consensusPublicKey = message.consensusPublicKey !== undefined
      ? base64FromBytes(message.consensusPublicKey)
      : undefined);
    message.connected !== undefined && (obj.connected = message.connected);
    message.directPeer !== undefined && (obj.directPeer = message.directPeer);
    message.contactSource !== undefined && (obj.contactSource = contactSourceToJSON(message.contactSource));
    message.contactInfo !== undefined &&
      (obj.contactInfo = message.contactInfo ? ContactInfoBody.toJSON(message.contactInfo) : undefined);
    message.observedAddress !== undefined && (obj.observedAddress = message.observedAddress);
    if (message.topics) {
      obj.topics = message.topics.map((e) => e ? TopicMembership.toJSON(e) : undefined);
    } else {
      obj.topics = [];
    }
    if (message.gossipRates) {
      obj.gossipRates = message.gossipRates.map((e) => e ? GossipRate.toJSON(e) : undefined);
    } else {
      obj.gossipRates = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<MeshPeer>, I>>(base?: I): MeshPeer {
    return MeshPeer.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MeshPeer>, I>>(object: I): MeshPeer {
    const message = createBaseMeshPeer();
    message.peerId = object.peerId ?? new Uint8Array();
    message.nodeType = object.nodeType ?? 0;
    message.consensusPublicKey = object.consensusPublicKey ?? undefined;
    message.connected = object.connected ?? false;
    message.directPeer = object.directPeer ?? false;
    message.contactSource = object.contactSource ?? 0;
    message.contactInfo = (object.contactInfo !== undefined && object.contactInfo !== null)
      ? ContactInfoBody.fromPartial(object.contactInfo)
      : undefined;
    message.observedAddress = object.observedAddress ?? "";
    message.topics = object.topics?.map((e) => TopicMembership.fromPartial(e)) || [];
    message.gossipRates = object.gossipRates?.map((e) => GossipRate.fromPartial(e)) || [];
    return message;
  },
};

function createBaseMeshView(): MeshView {
  return { local: undefined, peers: [], generatedAt: 0 };
}

export const MeshView = {
  encode(message: MeshView, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.local !== undefined) {
      MeshSelf.encode(message.local, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.peers) {
      MeshPeer.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.generatedAt !== 0) {
      writer.uint32(24).uint64(message.generatedAt);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MeshView {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMeshView();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.local = MeshSelf.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.peers.push(MeshPeer.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.generatedAt = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MeshView {
    return {
      local: isSet(object.local) ? MeshSelf.fromJSON(object.local) : undefined,
      peers: Array.isArray(object?.peers) ? object.peers.map((e: any) => MeshPeer.fromJSON(e)) : [],
      generatedAt: isSet(object.generatedAt) ? Number(object.generatedAt) : 0,
    };
  },

  toJSON(message: MeshView): unknown {
    const obj: any = {};
    message.local !== undefined && (obj.local = message.local ? MeshSelf.toJSON(message.local) : undefined);
    if (message.peers) {
      obj.peers = message.peers.map((e) => e ? MeshPeer.toJSON(e) : undefined);
    } else {
      obj.peers = [];
    }
    message.generatedAt !== undefined && (obj.generatedAt = Math.round(message.generatedAt));
    return obj;
  },

  create<I extends Exact<DeepPartial<MeshView>, I>>(base?: I): MeshView {
    return MeshView.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MeshView>, I>>(object: I): MeshView {
    const message = createBaseMeshView();
    message.local = (object.local !== undefined && object.local !== null)
      ? MeshSelf.fromPartial(object.local)
      : undefined;
    message.peers = object.peers?.map((e) => MeshPeer.fromPartial(e)) || [];
    message.generatedAt = object.generatedAt ?? 0;
    return message;
  },
};

function createBaseUnreachableNode(): UnreachableNode {
  return { peerId: new Uint8Array(), consensusPublicKey: new Uint8Array(), reason: "" };
}

export const UnreachableNode = {
  encode(message: UnreachableNode, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.peerId.length !== 0) {
      writer.uint32(10).bytes(message.peerId);
    }
    if (message.consensusPublicKey.length !== 0) {
      writer.uint32(18).bytes(message.consensusPublicKey);
    }
    if (message.reason !== "") {
      writer.uint32(26).string(message.reason);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UnreachableNode {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUnreachableNode();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.peerId = reader.bytes();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.consensusPublicKey = reader.bytes();
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

  fromJSON(object: any): UnreachableNode {
    return {
      peerId: isSet(object.peerId) ? bytesFromBase64(object.peerId) : new Uint8Array(),
      consensusPublicKey: isSet(object.consensusPublicKey)
        ? bytesFromBase64(object.consensusPublicKey)
        : new Uint8Array(),
      reason: isSet(object.reason) ? String(object.reason) : "",
    };
  },

  toJSON(message: UnreachableNode): unknown {
    const obj: any = {};
    message.peerId !== undefined &&
      (obj.peerId = base64FromBytes(message.peerId !== undefined ? message.peerId : new Uint8Array()));
    message.consensusPublicKey !== undefined &&
      (obj.consensusPublicKey = base64FromBytes(
        message.consensusPublicKey !== undefined ? message.consensusPublicKey : new Uint8Array(),
      ));
    message.reason !== undefined && (obj.reason = message.reason);
    return obj;
  },

  create<I extends Exact<DeepPartial<UnreachableNode>, I>>(base?: I): UnreachableNode {
    return UnreachableNode.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<UnreachableNode>, I>>(object: I): UnreachableNode {
    const message = createBaseUnreachableNode();
    message.peerId = object.peerId ?? new Uint8Array();
    message.consensusPublicKey = object.consensusPublicKey ?? new Uint8Array();
    message.reason = object.reason ?? "";
    return message;
  },
};

function createBaseMeshTopology(): MeshTopology {
  return { nodes: [], unreachable: [], generatedAt: 0 };
}

export const MeshTopology = {
  encode(message: MeshTopology, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.nodes) {
      MeshView.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    for (const v of message.unreachable) {
      UnreachableNode.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.generatedAt !== 0) {
      writer.uint32(24).uint64(message.generatedAt);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MeshTopology {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMeshTopology();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.nodes.push(MeshView.decode(reader, reader.uint32()));
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.unreachable.push(UnreachableNode.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.generatedAt = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MeshTopology {
    return {
      nodes: Array.isArray(object?.nodes) ? object.nodes.map((e: any) => MeshView.fromJSON(e)) : [],
      unreachable: Array.isArray(object?.unreachable)
        ? object.unreachable.map((e: any) => UnreachableNode.fromJSON(e))
        : [],
      generatedAt: isSet(object.generatedAt) ? Number(object.generatedAt) : 0,
    };
  },

  toJSON(message: MeshTopology): unknown {
    const obj: any = {};
    if (message.nodes) {
      obj.nodes = message.nodes.map((e) => e ? MeshView.toJSON(e) : undefined);
    } else {
      obj.nodes = [];
    }
    if (message.unreachable) {
      obj.unreachable = message.unreachable.map((e) => e ? UnreachableNode.toJSON(e) : undefined);
    } else {
      obj.unreachable = [];
    }
    message.generatedAt !== undefined && (obj.generatedAt = Math.round(message.generatedAt));
    return obj;
  },

  create<I extends Exact<DeepPartial<MeshTopology>, I>>(base?: I): MeshTopology {
    return MeshTopology.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MeshTopology>, I>>(object: I): MeshTopology {
    const message = createBaseMeshTopology();
    message.nodes = object.nodes?.map((e) => MeshView.fromPartial(e)) || [];
    message.unreachable = object.unreachable?.map((e) => UnreachableNode.fromPartial(e)) || [];
    message.generatedAt = object.generatedAt ?? 0;
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

function isObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
