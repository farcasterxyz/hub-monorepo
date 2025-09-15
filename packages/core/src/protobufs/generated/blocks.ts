/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";
import { FarcasterNetwork, farcasterNetworkFromJSON, farcasterNetworkToJSON, Message } from "./message";
import { OnChainEvent } from "./onchain_event";
import { UserNameProof } from "./username_proof";

/** Consensus messages */
export enum VoteType {
  PREVOTE = 0,
  PRECOMMIT = 1,
}

export function voteTypeFromJSON(object: any): VoteType {
  switch (object) {
    case 0:
    case "PREVOTE":
      return VoteType.PREVOTE;
    case 1:
    case "PRECOMMIT":
      return VoteType.PRECOMMIT;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum VoteType");
  }
}

export function voteTypeToJSON(object: VoteType): string {
  switch (object) {
    case VoteType.PREVOTE:
      return "PREVOTE";
    case VoteType.PRECOMMIT:
      return "PRECOMMIT";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum VoteType");
  }
}

export enum BlockEventType {
  HEARTBEAT = 0,
}

export function blockEventTypeFromJSON(object: any): BlockEventType {
  switch (object) {
    case 0:
    case "BLOCK_EVENT_TYPE_HEARTBEAT":
      return BlockEventType.HEARTBEAT;
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum BlockEventType");
  }
}

export function blockEventTypeToJSON(object: BlockEventType): string {
  switch (object) {
    case BlockEventType.HEARTBEAT:
      return "BLOCK_EVENT_TYPE_HEARTBEAT";
    default:
      throw new tsProtoGlobalThis.Error("Unrecognized enum value " + object + " for enum BlockEventType");
  }
}

export interface Validator {
  fid: number;
  signer: Uint8Array;
  rpcAddress: string;
  shardIndex: number;
  currentHeight: number;
}

export interface ValidatorSet {
  validators: Validator[];
}

export interface Height {
  shardIndex: number;
  blockNumber: number;
}

/** Uniquely identifies a hash within a shard */
export interface ShardHash {
  shardIndex: number;
  hash: Uint8Array;
}

export interface Vote {
  type: VoteType;
  height: Height | undefined;
  round: number;
  value: ShardHash | undefined;
  voter: Uint8Array;
}

export interface CommitSignature {
  signer: Uint8Array;
  signature: Uint8Array;
}

export interface Commits {
  height: Height | undefined;
  round: number;
  value: ShardHash | undefined;
  signatures: CommitSignature[];
}

export interface Proposal {
  height: Height | undefined;
  round: number;
  polRound: number;
  proposer: Uint8Array;
  /**
   * repeated Transaction transactions = 4;  // Transactions for the shard level proposals (submitted by shard leader)
   *  repeated ShardHeader shard_headers = 5; // shard headers for the block level proposal (submitted by the block leader)
   */
  value: ShardHash | undefined;
}

/** TODO: This probably needs a signature? Should we use ConsensusMessage? */
export interface FullProposal {
  height: Height | undefined;
  round: number;
  proposer: Uint8Array;
  block?: Block | undefined;
  shard?: ShardChunk | undefined;
}

export interface DecidedValue {
  block?: Block | undefined;
  shard?: ShardChunk | undefined;
}

export interface ReadNodeMessage {
  decidedValue?: DecidedValue | undefined;
}

export interface ConsensusMessage {
  vote?: Vote | undefined;
  proposal?: Proposal | undefined;
  signature: Uint8Array;
}

export interface HeartbeatEventBody {
}

export interface BlockEventData {
  seqnum: number;
  type: BlockEventType;
  blockNumber: number;
  eventIndex: number;
  blockTimestamp: number;
  heartbeatEventBody?: HeartbeatEventBody | undefined;
}

export interface BlockEvent {
  hash: Uint8Array;
  data: BlockEventData | undefined;
}

/** Block types */
export interface BlockHeader {
  height: Height | undefined;
  timestamp: number;
  version: number;
  chainId: FarcasterNetwork;
  shardWitnessesHash: Uint8Array;
  parentHash: Uint8Array;
  stateRoot: Uint8Array;
  eventsHash: Uint8Array;
}

export interface ShardWitness {
  shardChunkWitnesses: ShardChunkWitness[];
}

export interface ShardChunkWitness {
  height: Height | undefined;
  shardRoot: Uint8Array;
  shardHash: Uint8Array;
}

export interface Block {
  header: BlockHeader | undefined;
  hash: Uint8Array;
  shardWitness: ShardWitness | undefined;
  commits: Commits | undefined;
  transactions: Transaction[];
  events: BlockEvent[];
}

export interface ShardHeader {
  height: Height | undefined;
  timestamp: number;
  parentHash: Uint8Array;
  /** State root for the shard after applying the transactions for the height */
  shardRoot: Uint8Array;
}

export interface ShardChunk {
  header: ShardHeader | undefined;
  hash: Uint8Array;
  transactions: Transaction[];
  commits: Commits | undefined;
}

export interface Transaction {
  fid: number;
  userMessages: Message[];
  systemMessages: ValidatorMessage[];
  /** State root for the account after applying the transaction for the fid */
  accountRoot: Uint8Array;
}

/** Fname transfers */
export interface FnameTransfer {
  id: number;
  fromFid: number;
  proof: UserNameProof | undefined;
}

/** Validator initiated prunes/revokes etc */
export interface ValidatorMessage {
  onChainEvent: OnChainEvent | undefined;
  fnameTransfer: FnameTransfer | undefined;
  blockEvent: BlockEvent | undefined;
}

/** Gossip related messages */
export interface MempoolMessage {
  userMessage?: Message | undefined;
}

export interface StatusMessage {
  peerId: Uint8Array;
  height: Height | undefined;
  minHeight: Height | undefined;
}

export interface SyncValueRequest {
  height: Height | undefined;
}

export interface SyncVoteSetRequest {
  height: Height | undefined;
  round: number;
}

export interface SyncRequest {
  value?: SyncValueRequest | undefined;
  voteSet?: SyncVoteSetRequest | undefined;
}

export interface SyncValueResponse {
  height: Height | undefined;
  fullValue: Uint8Array;
  commits: Commits | undefined;
}

export interface SyncVoteSetResponse {
  height: Height | undefined;
  round: number;
  votes: Vote[];
  signatures: Uint8Array[];
}

export interface SyncResponse {
  value?: SyncValueResponse | undefined;
  voteSet?: SyncVoteSetResponse | undefined;
}

function createBaseValidator(): Validator {
  return { fid: 0, signer: new Uint8Array(), rpcAddress: "", shardIndex: 0, currentHeight: 0 };
}

export const Validator = {
  encode(message: Validator, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    if (message.signer.length !== 0) {
      writer.uint32(18).bytes(message.signer);
    }
    if (message.rpcAddress !== "") {
      writer.uint32(26).string(message.rpcAddress);
    }
    if (message.shardIndex !== 0) {
      writer.uint32(32).uint32(message.shardIndex);
    }
    if (message.currentHeight !== 0) {
      writer.uint32(40).uint64(message.currentHeight);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Validator {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseValidator();
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
        case 3:
          if (tag != 26) {
            break;
          }

          message.rpcAddress = reader.string();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.shardIndex = reader.uint32();
          continue;
        case 5:
          if (tag != 40) {
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

  fromJSON(object: any): Validator {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      signer: isSet(object.signer) ? bytesFromBase64(object.signer) : new Uint8Array(),
      rpcAddress: isSet(object.rpcAddress) ? String(object.rpcAddress) : "",
      shardIndex: isSet(object.shardIndex) ? Number(object.shardIndex) : 0,
      currentHeight: isSet(object.currentHeight) ? Number(object.currentHeight) : 0,
    };
  },

  toJSON(message: Validator): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    message.signer !== undefined &&
      (obj.signer = base64FromBytes(message.signer !== undefined ? message.signer : new Uint8Array()));
    message.rpcAddress !== undefined && (obj.rpcAddress = message.rpcAddress);
    message.shardIndex !== undefined && (obj.shardIndex = Math.round(message.shardIndex));
    message.currentHeight !== undefined && (obj.currentHeight = Math.round(message.currentHeight));
    return obj;
  },

  create<I extends Exact<DeepPartial<Validator>, I>>(base?: I): Validator {
    return Validator.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Validator>, I>>(object: I): Validator {
    const message = createBaseValidator();
    message.fid = object.fid ?? 0;
    message.signer = object.signer ?? new Uint8Array();
    message.rpcAddress = object.rpcAddress ?? "";
    message.shardIndex = object.shardIndex ?? 0;
    message.currentHeight = object.currentHeight ?? 0;
    return message;
  },
};

function createBaseValidatorSet(): ValidatorSet {
  return { validators: [] };
}

export const ValidatorSet = {
  encode(message: ValidatorSet, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.validators) {
      Validator.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ValidatorSet {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseValidatorSet();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.validators.push(Validator.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ValidatorSet {
    return {
      validators: Array.isArray(object?.validators) ? object.validators.map((e: any) => Validator.fromJSON(e)) : [],
    };
  },

  toJSON(message: ValidatorSet): unknown {
    const obj: any = {};
    if (message.validators) {
      obj.validators = message.validators.map((e) => e ? Validator.toJSON(e) : undefined);
    } else {
      obj.validators = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ValidatorSet>, I>>(base?: I): ValidatorSet {
    return ValidatorSet.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ValidatorSet>, I>>(object: I): ValidatorSet {
    const message = createBaseValidatorSet();
    message.validators = object.validators?.map((e) => Validator.fromPartial(e)) || [];
    return message;
  },
};

function createBaseHeight(): Height {
  return { shardIndex: 0, blockNumber: 0 };
}

export const Height = {
  encode(message: Height, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.shardIndex !== 0) {
      writer.uint32(8).uint32(message.shardIndex);
    }
    if (message.blockNumber !== 0) {
      writer.uint32(16).uint64(message.blockNumber);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Height {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHeight();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.shardIndex = reader.uint32();
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.blockNumber = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Height {
    return {
      shardIndex: isSet(object.shardIndex) ? Number(object.shardIndex) : 0,
      blockNumber: isSet(object.blockNumber) ? Number(object.blockNumber) : 0,
    };
  },

  toJSON(message: Height): unknown {
    const obj: any = {};
    message.shardIndex !== undefined && (obj.shardIndex = Math.round(message.shardIndex));
    message.blockNumber !== undefined && (obj.blockNumber = Math.round(message.blockNumber));
    return obj;
  },

  create<I extends Exact<DeepPartial<Height>, I>>(base?: I): Height {
    return Height.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Height>, I>>(object: I): Height {
    const message = createBaseHeight();
    message.shardIndex = object.shardIndex ?? 0;
    message.blockNumber = object.blockNumber ?? 0;
    return message;
  },
};

function createBaseShardHash(): ShardHash {
  return { shardIndex: 0, hash: new Uint8Array() };
}

export const ShardHash = {
  encode(message: ShardHash, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.shardIndex !== 0) {
      writer.uint32(8).uint32(message.shardIndex);
    }
    if (message.hash.length !== 0) {
      writer.uint32(18).bytes(message.hash);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ShardHash {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseShardHash();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.shardIndex = reader.uint32();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.hash = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ShardHash {
    return {
      shardIndex: isSet(object.shardIndex) ? Number(object.shardIndex) : 0,
      hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(),
    };
  },

  toJSON(message: ShardHash): unknown {
    const obj: any = {};
    message.shardIndex !== undefined && (obj.shardIndex = Math.round(message.shardIndex));
    message.hash !== undefined &&
      (obj.hash = base64FromBytes(message.hash !== undefined ? message.hash : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<ShardHash>, I>>(base?: I): ShardHash {
    return ShardHash.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ShardHash>, I>>(object: I): ShardHash {
    const message = createBaseShardHash();
    message.shardIndex = object.shardIndex ?? 0;
    message.hash = object.hash ?? new Uint8Array();
    return message;
  },
};

function createBaseVote(): Vote {
  return { type: 0, height: undefined, round: 0, value: undefined, voter: new Uint8Array() };
}

export const Vote = {
  encode(message: Vote, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== 0) {
      writer.uint32(8).int32(message.type);
    }
    if (message.height !== undefined) {
      Height.encode(message.height, writer.uint32(18).fork()).ldelim();
    }
    if (message.round !== 0) {
      writer.uint32(24).int64(message.round);
    }
    if (message.value !== undefined) {
      ShardHash.encode(message.value, writer.uint32(34).fork()).ldelim();
    }
    if (message.voter.length !== 0) {
      writer.uint32(42).bytes(message.voter);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Vote {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVote();
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
          if (tag != 18) {
            break;
          }

          message.height = Height.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.round = longToNumber(reader.int64() as Long);
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.value = ShardHash.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.voter = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Vote {
    return {
      type: isSet(object.type) ? voteTypeFromJSON(object.type) : 0,
      height: isSet(object.height) ? Height.fromJSON(object.height) : undefined,
      round: isSet(object.round) ? Number(object.round) : 0,
      value: isSet(object.value) ? ShardHash.fromJSON(object.value) : undefined,
      voter: isSet(object.voter) ? bytesFromBase64(object.voter) : new Uint8Array(),
    };
  },

  toJSON(message: Vote): unknown {
    const obj: any = {};
    message.type !== undefined && (obj.type = voteTypeToJSON(message.type));
    message.height !== undefined && (obj.height = message.height ? Height.toJSON(message.height) : undefined);
    message.round !== undefined && (obj.round = Math.round(message.round));
    message.value !== undefined && (obj.value = message.value ? ShardHash.toJSON(message.value) : undefined);
    message.voter !== undefined &&
      (obj.voter = base64FromBytes(message.voter !== undefined ? message.voter : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<Vote>, I>>(base?: I): Vote {
    return Vote.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Vote>, I>>(object: I): Vote {
    const message = createBaseVote();
    message.type = object.type ?? 0;
    message.height = (object.height !== undefined && object.height !== null)
      ? Height.fromPartial(object.height)
      : undefined;
    message.round = object.round ?? 0;
    message.value = (object.value !== undefined && object.value !== null)
      ? ShardHash.fromPartial(object.value)
      : undefined;
    message.voter = object.voter ?? new Uint8Array();
    return message;
  },
};

function createBaseCommitSignature(): CommitSignature {
  return { signer: new Uint8Array(), signature: new Uint8Array() };
}

export const CommitSignature = {
  encode(message: CommitSignature, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.signer.length !== 0) {
      writer.uint32(10).bytes(message.signer);
    }
    if (message.signature.length !== 0) {
      writer.uint32(18).bytes(message.signature);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CommitSignature {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCommitSignature();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.signer = reader.bytes();
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.signature = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): CommitSignature {
    return {
      signer: isSet(object.signer) ? bytesFromBase64(object.signer) : new Uint8Array(),
      signature: isSet(object.signature) ? bytesFromBase64(object.signature) : new Uint8Array(),
    };
  },

  toJSON(message: CommitSignature): unknown {
    const obj: any = {};
    message.signer !== undefined &&
      (obj.signer = base64FromBytes(message.signer !== undefined ? message.signer : new Uint8Array()));
    message.signature !== undefined &&
      (obj.signature = base64FromBytes(message.signature !== undefined ? message.signature : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<CommitSignature>, I>>(base?: I): CommitSignature {
    return CommitSignature.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<CommitSignature>, I>>(object: I): CommitSignature {
    const message = createBaseCommitSignature();
    message.signer = object.signer ?? new Uint8Array();
    message.signature = object.signature ?? new Uint8Array();
    return message;
  },
};

function createBaseCommits(): Commits {
  return { height: undefined, round: 0, value: undefined, signatures: [] };
}

export const Commits = {
  encode(message: Commits, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.height !== undefined) {
      Height.encode(message.height, writer.uint32(10).fork()).ldelim();
    }
    if (message.round !== 0) {
      writer.uint32(16).int64(message.round);
    }
    if (message.value !== undefined) {
      ShardHash.encode(message.value, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.signatures) {
      CommitSignature.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Commits {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCommits();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.height = Height.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.round = longToNumber(reader.int64() as Long);
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.value = ShardHash.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.signatures.push(CommitSignature.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Commits {
    return {
      height: isSet(object.height) ? Height.fromJSON(object.height) : undefined,
      round: isSet(object.round) ? Number(object.round) : 0,
      value: isSet(object.value) ? ShardHash.fromJSON(object.value) : undefined,
      signatures: Array.isArray(object?.signatures)
        ? object.signatures.map((e: any) => CommitSignature.fromJSON(e))
        : [],
    };
  },

  toJSON(message: Commits): unknown {
    const obj: any = {};
    message.height !== undefined && (obj.height = message.height ? Height.toJSON(message.height) : undefined);
    message.round !== undefined && (obj.round = Math.round(message.round));
    message.value !== undefined && (obj.value = message.value ? ShardHash.toJSON(message.value) : undefined);
    if (message.signatures) {
      obj.signatures = message.signatures.map((e) => e ? CommitSignature.toJSON(e) : undefined);
    } else {
      obj.signatures = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Commits>, I>>(base?: I): Commits {
    return Commits.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Commits>, I>>(object: I): Commits {
    const message = createBaseCommits();
    message.height = (object.height !== undefined && object.height !== null)
      ? Height.fromPartial(object.height)
      : undefined;
    message.round = object.round ?? 0;
    message.value = (object.value !== undefined && object.value !== null)
      ? ShardHash.fromPartial(object.value)
      : undefined;
    message.signatures = object.signatures?.map((e) => CommitSignature.fromPartial(e)) || [];
    return message;
  },
};

function createBaseProposal(): Proposal {
  return { height: undefined, round: 0, polRound: 0, proposer: new Uint8Array(), value: undefined };
}

export const Proposal = {
  encode(message: Proposal, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.height !== undefined) {
      Height.encode(message.height, writer.uint32(10).fork()).ldelim();
    }
    if (message.round !== 0) {
      writer.uint32(16).int64(message.round);
    }
    if (message.polRound !== 0) {
      writer.uint32(24).int64(message.polRound);
    }
    if (message.proposer.length !== 0) {
      writer.uint32(34).bytes(message.proposer);
    }
    if (message.value !== undefined) {
      ShardHash.encode(message.value, writer.uint32(42).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Proposal {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProposal();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.height = Height.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.round = longToNumber(reader.int64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.polRound = longToNumber(reader.int64() as Long);
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.proposer = reader.bytes();
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.value = ShardHash.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Proposal {
    return {
      height: isSet(object.height) ? Height.fromJSON(object.height) : undefined,
      round: isSet(object.round) ? Number(object.round) : 0,
      polRound: isSet(object.polRound) ? Number(object.polRound) : 0,
      proposer: isSet(object.proposer) ? bytesFromBase64(object.proposer) : new Uint8Array(),
      value: isSet(object.value) ? ShardHash.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: Proposal): unknown {
    const obj: any = {};
    message.height !== undefined && (obj.height = message.height ? Height.toJSON(message.height) : undefined);
    message.round !== undefined && (obj.round = Math.round(message.round));
    message.polRound !== undefined && (obj.polRound = Math.round(message.polRound));
    message.proposer !== undefined &&
      (obj.proposer = base64FromBytes(message.proposer !== undefined ? message.proposer : new Uint8Array()));
    message.value !== undefined && (obj.value = message.value ? ShardHash.toJSON(message.value) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<Proposal>, I>>(base?: I): Proposal {
    return Proposal.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Proposal>, I>>(object: I): Proposal {
    const message = createBaseProposal();
    message.height = (object.height !== undefined && object.height !== null)
      ? Height.fromPartial(object.height)
      : undefined;
    message.round = object.round ?? 0;
    message.polRound = object.polRound ?? 0;
    message.proposer = object.proposer ?? new Uint8Array();
    message.value = (object.value !== undefined && object.value !== null)
      ? ShardHash.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseFullProposal(): FullProposal {
  return { height: undefined, round: 0, proposer: new Uint8Array(), block: undefined, shard: undefined };
}

export const FullProposal = {
  encode(message: FullProposal, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.height !== undefined) {
      Height.encode(message.height, writer.uint32(10).fork()).ldelim();
    }
    if (message.round !== 0) {
      writer.uint32(16).int64(message.round);
    }
    if (message.proposer.length !== 0) {
      writer.uint32(26).bytes(message.proposer);
    }
    if (message.block !== undefined) {
      Block.encode(message.block, writer.uint32(34).fork()).ldelim();
    }
    if (message.shard !== undefined) {
      ShardChunk.encode(message.shard, writer.uint32(42).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FullProposal {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFullProposal();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.height = Height.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.round = longToNumber(reader.int64() as Long);
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.proposer = reader.bytes();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.block = Block.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.shard = ShardChunk.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FullProposal {
    return {
      height: isSet(object.height) ? Height.fromJSON(object.height) : undefined,
      round: isSet(object.round) ? Number(object.round) : 0,
      proposer: isSet(object.proposer) ? bytesFromBase64(object.proposer) : new Uint8Array(),
      block: isSet(object.block) ? Block.fromJSON(object.block) : undefined,
      shard: isSet(object.shard) ? ShardChunk.fromJSON(object.shard) : undefined,
    };
  },

  toJSON(message: FullProposal): unknown {
    const obj: any = {};
    message.height !== undefined && (obj.height = message.height ? Height.toJSON(message.height) : undefined);
    message.round !== undefined && (obj.round = Math.round(message.round));
    message.proposer !== undefined &&
      (obj.proposer = base64FromBytes(message.proposer !== undefined ? message.proposer : new Uint8Array()));
    message.block !== undefined && (obj.block = message.block ? Block.toJSON(message.block) : undefined);
    message.shard !== undefined && (obj.shard = message.shard ? ShardChunk.toJSON(message.shard) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<FullProposal>, I>>(base?: I): FullProposal {
    return FullProposal.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FullProposal>, I>>(object: I): FullProposal {
    const message = createBaseFullProposal();
    message.height = (object.height !== undefined && object.height !== null)
      ? Height.fromPartial(object.height)
      : undefined;
    message.round = object.round ?? 0;
    message.proposer = object.proposer ?? new Uint8Array();
    message.block = (object.block !== undefined && object.block !== null) ? Block.fromPartial(object.block) : undefined;
    message.shard = (object.shard !== undefined && object.shard !== null)
      ? ShardChunk.fromPartial(object.shard)
      : undefined;
    return message;
  },
};

function createBaseDecidedValue(): DecidedValue {
  return { block: undefined, shard: undefined };
}

export const DecidedValue = {
  encode(message: DecidedValue, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.block !== undefined) {
      Block.encode(message.block, writer.uint32(18).fork()).ldelim();
    }
    if (message.shard !== undefined) {
      ShardChunk.encode(message.shard, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DecidedValue {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDecidedValue();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          if (tag != 18) {
            break;
          }

          message.block = Block.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.shard = ShardChunk.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DecidedValue {
    return {
      block: isSet(object.block) ? Block.fromJSON(object.block) : undefined,
      shard: isSet(object.shard) ? ShardChunk.fromJSON(object.shard) : undefined,
    };
  },

  toJSON(message: DecidedValue): unknown {
    const obj: any = {};
    message.block !== undefined && (obj.block = message.block ? Block.toJSON(message.block) : undefined);
    message.shard !== undefined && (obj.shard = message.shard ? ShardChunk.toJSON(message.shard) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<DecidedValue>, I>>(base?: I): DecidedValue {
    return DecidedValue.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<DecidedValue>, I>>(object: I): DecidedValue {
    const message = createBaseDecidedValue();
    message.block = (object.block !== undefined && object.block !== null) ? Block.fromPartial(object.block) : undefined;
    message.shard = (object.shard !== undefined && object.shard !== null)
      ? ShardChunk.fromPartial(object.shard)
      : undefined;
    return message;
  },
};

function createBaseReadNodeMessage(): ReadNodeMessage {
  return { decidedValue: undefined };
}

export const ReadNodeMessage = {
  encode(message: ReadNodeMessage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.decidedValue !== undefined) {
      DecidedValue.encode(message.decidedValue, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ReadNodeMessage {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReadNodeMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.decidedValue = DecidedValue.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ReadNodeMessage {
    return { decidedValue: isSet(object.decidedValue) ? DecidedValue.fromJSON(object.decidedValue) : undefined };
  },

  toJSON(message: ReadNodeMessage): unknown {
    const obj: any = {};
    message.decidedValue !== undefined &&
      (obj.decidedValue = message.decidedValue ? DecidedValue.toJSON(message.decidedValue) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ReadNodeMessage>, I>>(base?: I): ReadNodeMessage {
    return ReadNodeMessage.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ReadNodeMessage>, I>>(object: I): ReadNodeMessage {
    const message = createBaseReadNodeMessage();
    message.decidedValue = (object.decidedValue !== undefined && object.decidedValue !== null)
      ? DecidedValue.fromPartial(object.decidedValue)
      : undefined;
    return message;
  },
};

function createBaseConsensusMessage(): ConsensusMessage {
  return { vote: undefined, proposal: undefined, signature: new Uint8Array() };
}

export const ConsensusMessage = {
  encode(message: ConsensusMessage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.vote !== undefined) {
      Vote.encode(message.vote, writer.uint32(10).fork()).ldelim();
    }
    if (message.proposal !== undefined) {
      Proposal.encode(message.proposal, writer.uint32(18).fork()).ldelim();
    }
    if (message.signature.length !== 0) {
      writer.uint32(26).bytes(message.signature);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ConsensusMessage {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseConsensusMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.vote = Vote.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.proposal = Proposal.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.signature = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ConsensusMessage {
    return {
      vote: isSet(object.vote) ? Vote.fromJSON(object.vote) : undefined,
      proposal: isSet(object.proposal) ? Proposal.fromJSON(object.proposal) : undefined,
      signature: isSet(object.signature) ? bytesFromBase64(object.signature) : new Uint8Array(),
    };
  },

  toJSON(message: ConsensusMessage): unknown {
    const obj: any = {};
    message.vote !== undefined && (obj.vote = message.vote ? Vote.toJSON(message.vote) : undefined);
    message.proposal !== undefined && (obj.proposal = message.proposal ? Proposal.toJSON(message.proposal) : undefined);
    message.signature !== undefined &&
      (obj.signature = base64FromBytes(message.signature !== undefined ? message.signature : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<ConsensusMessage>, I>>(base?: I): ConsensusMessage {
    return ConsensusMessage.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ConsensusMessage>, I>>(object: I): ConsensusMessage {
    const message = createBaseConsensusMessage();
    message.vote = (object.vote !== undefined && object.vote !== null) ? Vote.fromPartial(object.vote) : undefined;
    message.proposal = (object.proposal !== undefined && object.proposal !== null)
      ? Proposal.fromPartial(object.proposal)
      : undefined;
    message.signature = object.signature ?? new Uint8Array();
    return message;
  },
};

function createBaseHeartbeatEventBody(): HeartbeatEventBody {
  return {};
}

export const HeartbeatEventBody = {
  encode(_: HeartbeatEventBody, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): HeartbeatEventBody {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHeartbeatEventBody();
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

  fromJSON(_: any): HeartbeatEventBody {
    return {};
  },

  toJSON(_: HeartbeatEventBody): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<HeartbeatEventBody>, I>>(base?: I): HeartbeatEventBody {
    return HeartbeatEventBody.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<HeartbeatEventBody>, I>>(_: I): HeartbeatEventBody {
    const message = createBaseHeartbeatEventBody();
    return message;
  },
};

function createBaseBlockEventData(): BlockEventData {
  return { seqnum: 0, type: 0, blockNumber: 0, eventIndex: 0, blockTimestamp: 0, heartbeatEventBody: undefined };
}

export const BlockEventData = {
  encode(message: BlockEventData, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.seqnum !== 0) {
      writer.uint32(8).uint64(message.seqnum);
    }
    if (message.type !== 0) {
      writer.uint32(16).int32(message.type);
    }
    if (message.blockNumber !== 0) {
      writer.uint32(24).uint64(message.blockNumber);
    }
    if (message.eventIndex !== 0) {
      writer.uint32(32).uint64(message.eventIndex);
    }
    if (message.blockTimestamp !== 0) {
      writer.uint32(40).uint64(message.blockTimestamp);
    }
    if (message.heartbeatEventBody !== undefined) {
      HeartbeatEventBody.encode(message.heartbeatEventBody, writer.uint32(50).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BlockEventData {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBlockEventData();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.seqnum = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.type = reader.int32() as any;
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.blockNumber = longToNumber(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.eventIndex = longToNumber(reader.uint64() as Long);
          continue;
        case 5:
          if (tag != 40) {
            break;
          }

          message.blockTimestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.heartbeatEventBody = HeartbeatEventBody.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BlockEventData {
    return {
      seqnum: isSet(object.seqnum) ? Number(object.seqnum) : 0,
      type: isSet(object.type) ? blockEventTypeFromJSON(object.type) : 0,
      blockNumber: isSet(object.blockNumber) ? Number(object.blockNumber) : 0,
      eventIndex: isSet(object.eventIndex) ? Number(object.eventIndex) : 0,
      blockTimestamp: isSet(object.blockTimestamp) ? Number(object.blockTimestamp) : 0,
      heartbeatEventBody: isSet(object.heartbeatEventBody)
        ? HeartbeatEventBody.fromJSON(object.heartbeatEventBody)
        : undefined,
    };
  },

  toJSON(message: BlockEventData): unknown {
    const obj: any = {};
    message.seqnum !== undefined && (obj.seqnum = Math.round(message.seqnum));
    message.type !== undefined && (obj.type = blockEventTypeToJSON(message.type));
    message.blockNumber !== undefined && (obj.blockNumber = Math.round(message.blockNumber));
    message.eventIndex !== undefined && (obj.eventIndex = Math.round(message.eventIndex));
    message.blockTimestamp !== undefined && (obj.blockTimestamp = Math.round(message.blockTimestamp));
    message.heartbeatEventBody !== undefined && (obj.heartbeatEventBody = message.heartbeatEventBody
      ? HeartbeatEventBody.toJSON(message.heartbeatEventBody)
      : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<BlockEventData>, I>>(base?: I): BlockEventData {
    return BlockEventData.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<BlockEventData>, I>>(object: I): BlockEventData {
    const message = createBaseBlockEventData();
    message.seqnum = object.seqnum ?? 0;
    message.type = object.type ?? 0;
    message.blockNumber = object.blockNumber ?? 0;
    message.eventIndex = object.eventIndex ?? 0;
    message.blockTimestamp = object.blockTimestamp ?? 0;
    message.heartbeatEventBody = (object.heartbeatEventBody !== undefined && object.heartbeatEventBody !== null)
      ? HeartbeatEventBody.fromPartial(object.heartbeatEventBody)
      : undefined;
    return message;
  },
};

function createBaseBlockEvent(): BlockEvent {
  return { hash: new Uint8Array(), data: undefined };
}

export const BlockEvent = {
  encode(message: BlockEvent, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.hash.length !== 0) {
      writer.uint32(10).bytes(message.hash);
    }
    if (message.data !== undefined) {
      BlockEventData.encode(message.data, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BlockEvent {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBlockEvent();
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

          message.data = BlockEventData.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BlockEvent {
    return {
      hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(),
      data: isSet(object.data) ? BlockEventData.fromJSON(object.data) : undefined,
    };
  },

  toJSON(message: BlockEvent): unknown {
    const obj: any = {};
    message.hash !== undefined &&
      (obj.hash = base64FromBytes(message.hash !== undefined ? message.hash : new Uint8Array()));
    message.data !== undefined && (obj.data = message.data ? BlockEventData.toJSON(message.data) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<BlockEvent>, I>>(base?: I): BlockEvent {
    return BlockEvent.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<BlockEvent>, I>>(object: I): BlockEvent {
    const message = createBaseBlockEvent();
    message.hash = object.hash ?? new Uint8Array();
    message.data = (object.data !== undefined && object.data !== null)
      ? BlockEventData.fromPartial(object.data)
      : undefined;
    return message;
  },
};

function createBaseBlockHeader(): BlockHeader {
  return {
    height: undefined,
    timestamp: 0,
    version: 0,
    chainId: 0,
    shardWitnessesHash: new Uint8Array(),
    parentHash: new Uint8Array(),
    stateRoot: new Uint8Array(),
    eventsHash: new Uint8Array(),
  };
}

export const BlockHeader = {
  encode(message: BlockHeader, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.height !== undefined) {
      Height.encode(message.height, writer.uint32(10).fork()).ldelim();
    }
    if (message.timestamp !== 0) {
      writer.uint32(16).uint64(message.timestamp);
    }
    if (message.version !== 0) {
      writer.uint32(24).uint32(message.version);
    }
    if (message.chainId !== 0) {
      writer.uint32(32).int32(message.chainId);
    }
    if (message.shardWitnessesHash.length !== 0) {
      writer.uint32(42).bytes(message.shardWitnessesHash);
    }
    if (message.parentHash.length !== 0) {
      writer.uint32(50).bytes(message.parentHash);
    }
    if (message.stateRoot.length !== 0) {
      writer.uint32(58).bytes(message.stateRoot);
    }
    if (message.eventsHash.length !== 0) {
      writer.uint32(66).bytes(message.eventsHash);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BlockHeader {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBlockHeader();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.height = Height.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.timestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 24) {
            break;
          }

          message.version = reader.uint32();
          continue;
        case 4:
          if (tag != 32) {
            break;
          }

          message.chainId = reader.int32() as any;
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.shardWitnessesHash = reader.bytes();
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.parentHash = reader.bytes();
          continue;
        case 7:
          if (tag != 58) {
            break;
          }

          message.stateRoot = reader.bytes();
          continue;
        case 8:
          if (tag != 66) {
            break;
          }

          message.eventsHash = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BlockHeader {
    return {
      height: isSet(object.height) ? Height.fromJSON(object.height) : undefined,
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      version: isSet(object.version) ? Number(object.version) : 0,
      chainId: isSet(object.chainId) ? farcasterNetworkFromJSON(object.chainId) : 0,
      shardWitnessesHash: isSet(object.shardWitnessesHash)
        ? bytesFromBase64(object.shardWitnessesHash)
        : new Uint8Array(),
      parentHash: isSet(object.parentHash) ? bytesFromBase64(object.parentHash) : new Uint8Array(),
      stateRoot: isSet(object.stateRoot) ? bytesFromBase64(object.stateRoot) : new Uint8Array(),
      eventsHash: isSet(object.eventsHash) ? bytesFromBase64(object.eventsHash) : new Uint8Array(),
    };
  },

  toJSON(message: BlockHeader): unknown {
    const obj: any = {};
    message.height !== undefined && (obj.height = message.height ? Height.toJSON(message.height) : undefined);
    message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
    message.version !== undefined && (obj.version = Math.round(message.version));
    message.chainId !== undefined && (obj.chainId = farcasterNetworkToJSON(message.chainId));
    message.shardWitnessesHash !== undefined &&
      (obj.shardWitnessesHash = base64FromBytes(
        message.shardWitnessesHash !== undefined ? message.shardWitnessesHash : new Uint8Array(),
      ));
    message.parentHash !== undefined &&
      (obj.parentHash = base64FromBytes(message.parentHash !== undefined ? message.parentHash : new Uint8Array()));
    message.stateRoot !== undefined &&
      (obj.stateRoot = base64FromBytes(message.stateRoot !== undefined ? message.stateRoot : new Uint8Array()));
    message.eventsHash !== undefined &&
      (obj.eventsHash = base64FromBytes(message.eventsHash !== undefined ? message.eventsHash : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<BlockHeader>, I>>(base?: I): BlockHeader {
    return BlockHeader.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<BlockHeader>, I>>(object: I): BlockHeader {
    const message = createBaseBlockHeader();
    message.height = (object.height !== undefined && object.height !== null)
      ? Height.fromPartial(object.height)
      : undefined;
    message.timestamp = object.timestamp ?? 0;
    message.version = object.version ?? 0;
    message.chainId = object.chainId ?? 0;
    message.shardWitnessesHash = object.shardWitnessesHash ?? new Uint8Array();
    message.parentHash = object.parentHash ?? new Uint8Array();
    message.stateRoot = object.stateRoot ?? new Uint8Array();
    message.eventsHash = object.eventsHash ?? new Uint8Array();
    return message;
  },
};

function createBaseShardWitness(): ShardWitness {
  return { shardChunkWitnesses: [] };
}

export const ShardWitness = {
  encode(message: ShardWitness, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.shardChunkWitnesses) {
      ShardChunkWitness.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ShardWitness {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseShardWitness();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.shardChunkWitnesses.push(ShardChunkWitness.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ShardWitness {
    return {
      shardChunkWitnesses: Array.isArray(object?.shardChunkWitnesses)
        ? object.shardChunkWitnesses.map((e: any) => ShardChunkWitness.fromJSON(e))
        : [],
    };
  },

  toJSON(message: ShardWitness): unknown {
    const obj: any = {};
    if (message.shardChunkWitnesses) {
      obj.shardChunkWitnesses = message.shardChunkWitnesses.map((e) => e ? ShardChunkWitness.toJSON(e) : undefined);
    } else {
      obj.shardChunkWitnesses = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ShardWitness>, I>>(base?: I): ShardWitness {
    return ShardWitness.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ShardWitness>, I>>(object: I): ShardWitness {
    const message = createBaseShardWitness();
    message.shardChunkWitnesses = object.shardChunkWitnesses?.map((e) => ShardChunkWitness.fromPartial(e)) || [];
    return message;
  },
};

function createBaseShardChunkWitness(): ShardChunkWitness {
  return { height: undefined, shardRoot: new Uint8Array(), shardHash: new Uint8Array() };
}

export const ShardChunkWitness = {
  encode(message: ShardChunkWitness, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.height !== undefined) {
      Height.encode(message.height, writer.uint32(10).fork()).ldelim();
    }
    if (message.shardRoot.length !== 0) {
      writer.uint32(18).bytes(message.shardRoot);
    }
    if (message.shardHash.length !== 0) {
      writer.uint32(26).bytes(message.shardHash);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ShardChunkWitness {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseShardChunkWitness();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.height = Height.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.shardRoot = reader.bytes();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.shardHash = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ShardChunkWitness {
    return {
      height: isSet(object.height) ? Height.fromJSON(object.height) : undefined,
      shardRoot: isSet(object.shardRoot) ? bytesFromBase64(object.shardRoot) : new Uint8Array(),
      shardHash: isSet(object.shardHash) ? bytesFromBase64(object.shardHash) : new Uint8Array(),
    };
  },

  toJSON(message: ShardChunkWitness): unknown {
    const obj: any = {};
    message.height !== undefined && (obj.height = message.height ? Height.toJSON(message.height) : undefined);
    message.shardRoot !== undefined &&
      (obj.shardRoot = base64FromBytes(message.shardRoot !== undefined ? message.shardRoot : new Uint8Array()));
    message.shardHash !== undefined &&
      (obj.shardHash = base64FromBytes(message.shardHash !== undefined ? message.shardHash : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<ShardChunkWitness>, I>>(base?: I): ShardChunkWitness {
    return ShardChunkWitness.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ShardChunkWitness>, I>>(object: I): ShardChunkWitness {
    const message = createBaseShardChunkWitness();
    message.height = (object.height !== undefined && object.height !== null)
      ? Height.fromPartial(object.height)
      : undefined;
    message.shardRoot = object.shardRoot ?? new Uint8Array();
    message.shardHash = object.shardHash ?? new Uint8Array();
    return message;
  },
};

function createBaseBlock(): Block {
  return {
    header: undefined,
    hash: new Uint8Array(),
    shardWitness: undefined,
    commits: undefined,
    transactions: [],
    events: [],
  };
}

export const Block = {
  encode(message: Block, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.header !== undefined) {
      BlockHeader.encode(message.header, writer.uint32(10).fork()).ldelim();
    }
    if (message.hash.length !== 0) {
      writer.uint32(18).bytes(message.hash);
    }
    if (message.shardWitness !== undefined) {
      ShardWitness.encode(message.shardWitness, writer.uint32(26).fork()).ldelim();
    }
    if (message.commits !== undefined) {
      Commits.encode(message.commits, writer.uint32(34).fork()).ldelim();
    }
    for (const v of message.transactions) {
      Transaction.encode(v!, writer.uint32(42).fork()).ldelim();
    }
    for (const v of message.events) {
      BlockEvent.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Block {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBlock();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.header = BlockHeader.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.hash = reader.bytes();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.shardWitness = ShardWitness.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.commits = Commits.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag != 42) {
            break;
          }

          message.transactions.push(Transaction.decode(reader, reader.uint32()));
          continue;
        case 6:
          if (tag != 50) {
            break;
          }

          message.events.push(BlockEvent.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Block {
    return {
      header: isSet(object.header) ? BlockHeader.fromJSON(object.header) : undefined,
      hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(),
      shardWitness: isSet(object.shardWitness) ? ShardWitness.fromJSON(object.shardWitness) : undefined,
      commits: isSet(object.commits) ? Commits.fromJSON(object.commits) : undefined,
      transactions: Array.isArray(object?.transactions)
        ? object.transactions.map((e: any) => Transaction.fromJSON(e))
        : [],
      events: Array.isArray(object?.events) ? object.events.map((e: any) => BlockEvent.fromJSON(e)) : [],
    };
  },

  toJSON(message: Block): unknown {
    const obj: any = {};
    message.header !== undefined && (obj.header = message.header ? BlockHeader.toJSON(message.header) : undefined);
    message.hash !== undefined &&
      (obj.hash = base64FromBytes(message.hash !== undefined ? message.hash : new Uint8Array()));
    message.shardWitness !== undefined &&
      (obj.shardWitness = message.shardWitness ? ShardWitness.toJSON(message.shardWitness) : undefined);
    message.commits !== undefined && (obj.commits = message.commits ? Commits.toJSON(message.commits) : undefined);
    if (message.transactions) {
      obj.transactions = message.transactions.map((e) => e ? Transaction.toJSON(e) : undefined);
    } else {
      obj.transactions = [];
    }
    if (message.events) {
      obj.events = message.events.map((e) => e ? BlockEvent.toJSON(e) : undefined);
    } else {
      obj.events = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Block>, I>>(base?: I): Block {
    return Block.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Block>, I>>(object: I): Block {
    const message = createBaseBlock();
    message.header = (object.header !== undefined && object.header !== null)
      ? BlockHeader.fromPartial(object.header)
      : undefined;
    message.hash = object.hash ?? new Uint8Array();
    message.shardWitness = (object.shardWitness !== undefined && object.shardWitness !== null)
      ? ShardWitness.fromPartial(object.shardWitness)
      : undefined;
    message.commits = (object.commits !== undefined && object.commits !== null)
      ? Commits.fromPartial(object.commits)
      : undefined;
    message.transactions = object.transactions?.map((e) => Transaction.fromPartial(e)) || [];
    message.events = object.events?.map((e) => BlockEvent.fromPartial(e)) || [];
    return message;
  },
};

function createBaseShardHeader(): ShardHeader {
  return { height: undefined, timestamp: 0, parentHash: new Uint8Array(), shardRoot: new Uint8Array() };
}

export const ShardHeader = {
  encode(message: ShardHeader, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.height !== undefined) {
      Height.encode(message.height, writer.uint32(10).fork()).ldelim();
    }
    if (message.timestamp !== 0) {
      writer.uint32(16).uint64(message.timestamp);
    }
    if (message.parentHash.length !== 0) {
      writer.uint32(26).bytes(message.parentHash);
    }
    if (message.shardRoot.length !== 0) {
      writer.uint32(34).bytes(message.shardRoot);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ShardHeader {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseShardHeader();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.height = Height.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.timestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.parentHash = reader.bytes();
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.shardRoot = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ShardHeader {
    return {
      height: isSet(object.height) ? Height.fromJSON(object.height) : undefined,
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      parentHash: isSet(object.parentHash) ? bytesFromBase64(object.parentHash) : new Uint8Array(),
      shardRoot: isSet(object.shardRoot) ? bytesFromBase64(object.shardRoot) : new Uint8Array(),
    };
  },

  toJSON(message: ShardHeader): unknown {
    const obj: any = {};
    message.height !== undefined && (obj.height = message.height ? Height.toJSON(message.height) : undefined);
    message.timestamp !== undefined && (obj.timestamp = Math.round(message.timestamp));
    message.parentHash !== undefined &&
      (obj.parentHash = base64FromBytes(message.parentHash !== undefined ? message.parentHash : new Uint8Array()));
    message.shardRoot !== undefined &&
      (obj.shardRoot = base64FromBytes(message.shardRoot !== undefined ? message.shardRoot : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<ShardHeader>, I>>(base?: I): ShardHeader {
    return ShardHeader.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ShardHeader>, I>>(object: I): ShardHeader {
    const message = createBaseShardHeader();
    message.height = (object.height !== undefined && object.height !== null)
      ? Height.fromPartial(object.height)
      : undefined;
    message.timestamp = object.timestamp ?? 0;
    message.parentHash = object.parentHash ?? new Uint8Array();
    message.shardRoot = object.shardRoot ?? new Uint8Array();
    return message;
  },
};

function createBaseShardChunk(): ShardChunk {
  return { header: undefined, hash: new Uint8Array(), transactions: [], commits: undefined };
}

export const ShardChunk = {
  encode(message: ShardChunk, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.header !== undefined) {
      ShardHeader.encode(message.header, writer.uint32(10).fork()).ldelim();
    }
    if (message.hash.length !== 0) {
      writer.uint32(18).bytes(message.hash);
    }
    for (const v of message.transactions) {
      Transaction.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.commits !== undefined) {
      Commits.encode(message.commits, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ShardChunk {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseShardChunk();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.header = ShardHeader.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.hash = reader.bytes();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.transactions.push(Transaction.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.commits = Commits.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ShardChunk {
    return {
      header: isSet(object.header) ? ShardHeader.fromJSON(object.header) : undefined,
      hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(),
      transactions: Array.isArray(object?.transactions)
        ? object.transactions.map((e: any) => Transaction.fromJSON(e))
        : [],
      commits: isSet(object.commits) ? Commits.fromJSON(object.commits) : undefined,
    };
  },

  toJSON(message: ShardChunk): unknown {
    const obj: any = {};
    message.header !== undefined && (obj.header = message.header ? ShardHeader.toJSON(message.header) : undefined);
    message.hash !== undefined &&
      (obj.hash = base64FromBytes(message.hash !== undefined ? message.hash : new Uint8Array()));
    if (message.transactions) {
      obj.transactions = message.transactions.map((e) => e ? Transaction.toJSON(e) : undefined);
    } else {
      obj.transactions = [];
    }
    message.commits !== undefined && (obj.commits = message.commits ? Commits.toJSON(message.commits) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ShardChunk>, I>>(base?: I): ShardChunk {
    return ShardChunk.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ShardChunk>, I>>(object: I): ShardChunk {
    const message = createBaseShardChunk();
    message.header = (object.header !== undefined && object.header !== null)
      ? ShardHeader.fromPartial(object.header)
      : undefined;
    message.hash = object.hash ?? new Uint8Array();
    message.transactions = object.transactions?.map((e) => Transaction.fromPartial(e)) || [];
    message.commits = (object.commits !== undefined && object.commits !== null)
      ? Commits.fromPartial(object.commits)
      : undefined;
    return message;
  },
};

function createBaseTransaction(): Transaction {
  return { fid: 0, userMessages: [], systemMessages: [], accountRoot: new Uint8Array() };
}

export const Transaction = {
  encode(message: Transaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.fid !== 0) {
      writer.uint32(8).uint64(message.fid);
    }
    for (const v of message.userMessages) {
      Message.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.systemMessages) {
      ValidatorMessage.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.accountRoot.length !== 0) {
      writer.uint32(34).bytes(message.accountRoot);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Transaction {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransaction();
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

          message.userMessages.push(Message.decode(reader, reader.uint32()));
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.systemMessages.push(ValidatorMessage.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.accountRoot = reader.bytes();
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Transaction {
    return {
      fid: isSet(object.fid) ? Number(object.fid) : 0,
      userMessages: Array.isArray(object?.userMessages) ? object.userMessages.map((e: any) => Message.fromJSON(e)) : [],
      systemMessages: Array.isArray(object?.systemMessages)
        ? object.systemMessages.map((e: any) => ValidatorMessage.fromJSON(e))
        : [],
      accountRoot: isSet(object.accountRoot) ? bytesFromBase64(object.accountRoot) : new Uint8Array(),
    };
  },

  toJSON(message: Transaction): unknown {
    const obj: any = {};
    message.fid !== undefined && (obj.fid = Math.round(message.fid));
    if (message.userMessages) {
      obj.userMessages = message.userMessages.map((e) => e ? Message.toJSON(e) : undefined);
    } else {
      obj.userMessages = [];
    }
    if (message.systemMessages) {
      obj.systemMessages = message.systemMessages.map((e) => e ? ValidatorMessage.toJSON(e) : undefined);
    } else {
      obj.systemMessages = [];
    }
    message.accountRoot !== undefined &&
      (obj.accountRoot = base64FromBytes(message.accountRoot !== undefined ? message.accountRoot : new Uint8Array()));
    return obj;
  },

  create<I extends Exact<DeepPartial<Transaction>, I>>(base?: I): Transaction {
    return Transaction.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Transaction>, I>>(object: I): Transaction {
    const message = createBaseTransaction();
    message.fid = object.fid ?? 0;
    message.userMessages = object.userMessages?.map((e) => Message.fromPartial(e)) || [];
    message.systemMessages = object.systemMessages?.map((e) => ValidatorMessage.fromPartial(e)) || [];
    message.accountRoot = object.accountRoot ?? new Uint8Array();
    return message;
  },
};

function createBaseFnameTransfer(): FnameTransfer {
  return { id: 0, fromFid: 0, proof: undefined };
}

export const FnameTransfer = {
  encode(message: FnameTransfer, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== 0) {
      writer.uint32(8).uint64(message.id);
    }
    if (message.fromFid !== 0) {
      writer.uint32(16).uint64(message.fromFid);
    }
    if (message.proof !== undefined) {
      UserNameProof.encode(message.proof, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FnameTransfer {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFnameTransfer();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 8) {
            break;
          }

          message.id = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.fromFid = longToNumber(reader.uint64() as Long);
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.proof = UserNameProof.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FnameTransfer {
    return {
      id: isSet(object.id) ? Number(object.id) : 0,
      fromFid: isSet(object.fromFid) ? Number(object.fromFid) : 0,
      proof: isSet(object.proof) ? UserNameProof.fromJSON(object.proof) : undefined,
    };
  },

  toJSON(message: FnameTransfer): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = Math.round(message.id));
    message.fromFid !== undefined && (obj.fromFid = Math.round(message.fromFid));
    message.proof !== undefined && (obj.proof = message.proof ? UserNameProof.toJSON(message.proof) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<FnameTransfer>, I>>(base?: I): FnameTransfer {
    return FnameTransfer.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<FnameTransfer>, I>>(object: I): FnameTransfer {
    const message = createBaseFnameTransfer();
    message.id = object.id ?? 0;
    message.fromFid = object.fromFid ?? 0;
    message.proof = (object.proof !== undefined && object.proof !== null)
      ? UserNameProof.fromPartial(object.proof)
      : undefined;
    return message;
  },
};

function createBaseValidatorMessage(): ValidatorMessage {
  return { onChainEvent: undefined, fnameTransfer: undefined, blockEvent: undefined };
}

export const ValidatorMessage = {
  encode(message: ValidatorMessage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.onChainEvent !== undefined) {
      OnChainEvent.encode(message.onChainEvent, writer.uint32(10).fork()).ldelim();
    }
    if (message.fnameTransfer !== undefined) {
      FnameTransfer.encode(message.fnameTransfer, writer.uint32(18).fork()).ldelim();
    }
    if (message.blockEvent !== undefined) {
      BlockEvent.encode(message.blockEvent, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ValidatorMessage {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseValidatorMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.onChainEvent = OnChainEvent.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.fnameTransfer = FnameTransfer.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.blockEvent = BlockEvent.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ValidatorMessage {
    return {
      onChainEvent: isSet(object.onChainEvent) ? OnChainEvent.fromJSON(object.onChainEvent) : undefined,
      fnameTransfer: isSet(object.fnameTransfer) ? FnameTransfer.fromJSON(object.fnameTransfer) : undefined,
      blockEvent: isSet(object.blockEvent) ? BlockEvent.fromJSON(object.blockEvent) : undefined,
    };
  },

  toJSON(message: ValidatorMessage): unknown {
    const obj: any = {};
    message.onChainEvent !== undefined &&
      (obj.onChainEvent = message.onChainEvent ? OnChainEvent.toJSON(message.onChainEvent) : undefined);
    message.fnameTransfer !== undefined &&
      (obj.fnameTransfer = message.fnameTransfer ? FnameTransfer.toJSON(message.fnameTransfer) : undefined);
    message.blockEvent !== undefined &&
      (obj.blockEvent = message.blockEvent ? BlockEvent.toJSON(message.blockEvent) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<ValidatorMessage>, I>>(base?: I): ValidatorMessage {
    return ValidatorMessage.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ValidatorMessage>, I>>(object: I): ValidatorMessage {
    const message = createBaseValidatorMessage();
    message.onChainEvent = (object.onChainEvent !== undefined && object.onChainEvent !== null)
      ? OnChainEvent.fromPartial(object.onChainEvent)
      : undefined;
    message.fnameTransfer = (object.fnameTransfer !== undefined && object.fnameTransfer !== null)
      ? FnameTransfer.fromPartial(object.fnameTransfer)
      : undefined;
    message.blockEvent = (object.blockEvent !== undefined && object.blockEvent !== null)
      ? BlockEvent.fromPartial(object.blockEvent)
      : undefined;
    return message;
  },
};

function createBaseMempoolMessage(): MempoolMessage {
  return { userMessage: undefined };
}

export const MempoolMessage = {
  encode(message: MempoolMessage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.userMessage !== undefined) {
      Message.encode(message.userMessage, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MempoolMessage {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMempoolMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.userMessage = Message.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): MempoolMessage {
    return { userMessage: isSet(object.userMessage) ? Message.fromJSON(object.userMessage) : undefined };
  },

  toJSON(message: MempoolMessage): unknown {
    const obj: any = {};
    message.userMessage !== undefined &&
      (obj.userMessage = message.userMessage ? Message.toJSON(message.userMessage) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<MempoolMessage>, I>>(base?: I): MempoolMessage {
    return MempoolMessage.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<MempoolMessage>, I>>(object: I): MempoolMessage {
    const message = createBaseMempoolMessage();
    message.userMessage = (object.userMessage !== undefined && object.userMessage !== null)
      ? Message.fromPartial(object.userMessage)
      : undefined;
    return message;
  },
};

function createBaseStatusMessage(): StatusMessage {
  return { peerId: new Uint8Array(), height: undefined, minHeight: undefined };
}

export const StatusMessage = {
  encode(message: StatusMessage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.peerId.length !== 0) {
      writer.uint32(10).bytes(message.peerId);
    }
    if (message.height !== undefined) {
      Height.encode(message.height, writer.uint32(18).fork()).ldelim();
    }
    if (message.minHeight !== undefined) {
      Height.encode(message.minHeight, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StatusMessage {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStatusMessage();
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

          message.height = Height.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.minHeight = Height.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): StatusMessage {
    return {
      peerId: isSet(object.peerId) ? bytesFromBase64(object.peerId) : new Uint8Array(),
      height: isSet(object.height) ? Height.fromJSON(object.height) : undefined,
      minHeight: isSet(object.minHeight) ? Height.fromJSON(object.minHeight) : undefined,
    };
  },

  toJSON(message: StatusMessage): unknown {
    const obj: any = {};
    message.peerId !== undefined &&
      (obj.peerId = base64FromBytes(message.peerId !== undefined ? message.peerId : new Uint8Array()));
    message.height !== undefined && (obj.height = message.height ? Height.toJSON(message.height) : undefined);
    message.minHeight !== undefined &&
      (obj.minHeight = message.minHeight ? Height.toJSON(message.minHeight) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<StatusMessage>, I>>(base?: I): StatusMessage {
    return StatusMessage.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<StatusMessage>, I>>(object: I): StatusMessage {
    const message = createBaseStatusMessage();
    message.peerId = object.peerId ?? new Uint8Array();
    message.height = (object.height !== undefined && object.height !== null)
      ? Height.fromPartial(object.height)
      : undefined;
    message.minHeight = (object.minHeight !== undefined && object.minHeight !== null)
      ? Height.fromPartial(object.minHeight)
      : undefined;
    return message;
  },
};

function createBaseSyncValueRequest(): SyncValueRequest {
  return { height: undefined };
}

export const SyncValueRequest = {
  encode(message: SyncValueRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.height !== undefined) {
      Height.encode(message.height, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SyncValueRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncValueRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.height = Height.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SyncValueRequest {
    return { height: isSet(object.height) ? Height.fromJSON(object.height) : undefined };
  },

  toJSON(message: SyncValueRequest): unknown {
    const obj: any = {};
    message.height !== undefined && (obj.height = message.height ? Height.toJSON(message.height) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SyncValueRequest>, I>>(base?: I): SyncValueRequest {
    return SyncValueRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SyncValueRequest>, I>>(object: I): SyncValueRequest {
    const message = createBaseSyncValueRequest();
    message.height = (object.height !== undefined && object.height !== null)
      ? Height.fromPartial(object.height)
      : undefined;
    return message;
  },
};

function createBaseSyncVoteSetRequest(): SyncVoteSetRequest {
  return { height: undefined, round: 0 };
}

export const SyncVoteSetRequest = {
  encode(message: SyncVoteSetRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.height !== undefined) {
      Height.encode(message.height, writer.uint32(10).fork()).ldelim();
    }
    if (message.round !== 0) {
      writer.uint32(16).int64(message.round);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SyncVoteSetRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncVoteSetRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.height = Height.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.round = longToNumber(reader.int64() as Long);
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SyncVoteSetRequest {
    return {
      height: isSet(object.height) ? Height.fromJSON(object.height) : undefined,
      round: isSet(object.round) ? Number(object.round) : 0,
    };
  },

  toJSON(message: SyncVoteSetRequest): unknown {
    const obj: any = {};
    message.height !== undefined && (obj.height = message.height ? Height.toJSON(message.height) : undefined);
    message.round !== undefined && (obj.round = Math.round(message.round));
    return obj;
  },

  create<I extends Exact<DeepPartial<SyncVoteSetRequest>, I>>(base?: I): SyncVoteSetRequest {
    return SyncVoteSetRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SyncVoteSetRequest>, I>>(object: I): SyncVoteSetRequest {
    const message = createBaseSyncVoteSetRequest();
    message.height = (object.height !== undefined && object.height !== null)
      ? Height.fromPartial(object.height)
      : undefined;
    message.round = object.round ?? 0;
    return message;
  },
};

function createBaseSyncRequest(): SyncRequest {
  return { value: undefined, voteSet: undefined };
}

export const SyncRequest = {
  encode(message: SyncRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.value !== undefined) {
      SyncValueRequest.encode(message.value, writer.uint32(10).fork()).ldelim();
    }
    if (message.voteSet !== undefined) {
      SyncVoteSetRequest.encode(message.voteSet, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SyncRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.value = SyncValueRequest.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.voteSet = SyncVoteSetRequest.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SyncRequest {
    return {
      value: isSet(object.value) ? SyncValueRequest.fromJSON(object.value) : undefined,
      voteSet: isSet(object.voteSet) ? SyncVoteSetRequest.fromJSON(object.voteSet) : undefined,
    };
  },

  toJSON(message: SyncRequest): unknown {
    const obj: any = {};
    message.value !== undefined && (obj.value = message.value ? SyncValueRequest.toJSON(message.value) : undefined);
    message.voteSet !== undefined &&
      (obj.voteSet = message.voteSet ? SyncVoteSetRequest.toJSON(message.voteSet) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SyncRequest>, I>>(base?: I): SyncRequest {
    return SyncRequest.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SyncRequest>, I>>(object: I): SyncRequest {
    const message = createBaseSyncRequest();
    message.value = (object.value !== undefined && object.value !== null)
      ? SyncValueRequest.fromPartial(object.value)
      : undefined;
    message.voteSet = (object.voteSet !== undefined && object.voteSet !== null)
      ? SyncVoteSetRequest.fromPartial(object.voteSet)
      : undefined;
    return message;
  },
};

function createBaseSyncValueResponse(): SyncValueResponse {
  return { height: undefined, fullValue: new Uint8Array(), commits: undefined };
}

export const SyncValueResponse = {
  encode(message: SyncValueResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.height !== undefined) {
      Height.encode(message.height, writer.uint32(10).fork()).ldelim();
    }
    if (message.fullValue.length !== 0) {
      writer.uint32(18).bytes(message.fullValue);
    }
    if (message.commits !== undefined) {
      Commits.encode(message.commits, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SyncValueResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncValueResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.height = Height.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.fullValue = reader.bytes();
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.commits = Commits.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SyncValueResponse {
    return {
      height: isSet(object.height) ? Height.fromJSON(object.height) : undefined,
      fullValue: isSet(object.fullValue) ? bytesFromBase64(object.fullValue) : new Uint8Array(),
      commits: isSet(object.commits) ? Commits.fromJSON(object.commits) : undefined,
    };
  },

  toJSON(message: SyncValueResponse): unknown {
    const obj: any = {};
    message.height !== undefined && (obj.height = message.height ? Height.toJSON(message.height) : undefined);
    message.fullValue !== undefined &&
      (obj.fullValue = base64FromBytes(message.fullValue !== undefined ? message.fullValue : new Uint8Array()));
    message.commits !== undefined && (obj.commits = message.commits ? Commits.toJSON(message.commits) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SyncValueResponse>, I>>(base?: I): SyncValueResponse {
    return SyncValueResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SyncValueResponse>, I>>(object: I): SyncValueResponse {
    const message = createBaseSyncValueResponse();
    message.height = (object.height !== undefined && object.height !== null)
      ? Height.fromPartial(object.height)
      : undefined;
    message.fullValue = object.fullValue ?? new Uint8Array();
    message.commits = (object.commits !== undefined && object.commits !== null)
      ? Commits.fromPartial(object.commits)
      : undefined;
    return message;
  },
};

function createBaseSyncVoteSetResponse(): SyncVoteSetResponse {
  return { height: undefined, round: 0, votes: [], signatures: [] };
}

export const SyncVoteSetResponse = {
  encode(message: SyncVoteSetResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.height !== undefined) {
      Height.encode(message.height, writer.uint32(10).fork()).ldelim();
    }
    if (message.round !== 0) {
      writer.uint32(16).int64(message.round);
    }
    for (const v of message.votes) {
      Vote.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.signatures) {
      writer.uint32(34).bytes(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SyncVoteSetResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncVoteSetResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.height = Height.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 16) {
            break;
          }

          message.round = longToNumber(reader.int64() as Long);
          continue;
        case 3:
          if (tag != 26) {
            break;
          }

          message.votes.push(Vote.decode(reader, reader.uint32()));
          continue;
        case 4:
          if (tag != 34) {
            break;
          }

          message.signatures.push(reader.bytes());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SyncVoteSetResponse {
    return {
      height: isSet(object.height) ? Height.fromJSON(object.height) : undefined,
      round: isSet(object.round) ? Number(object.round) : 0,
      votes: Array.isArray(object?.votes) ? object.votes.map((e: any) => Vote.fromJSON(e)) : [],
      signatures: Array.isArray(object?.signatures) ? object.signatures.map((e: any) => bytesFromBase64(e)) : [],
    };
  },

  toJSON(message: SyncVoteSetResponse): unknown {
    const obj: any = {};
    message.height !== undefined && (obj.height = message.height ? Height.toJSON(message.height) : undefined);
    message.round !== undefined && (obj.round = Math.round(message.round));
    if (message.votes) {
      obj.votes = message.votes.map((e) => e ? Vote.toJSON(e) : undefined);
    } else {
      obj.votes = [];
    }
    if (message.signatures) {
      obj.signatures = message.signatures.map((e) => base64FromBytes(e !== undefined ? e : new Uint8Array()));
    } else {
      obj.signatures = [];
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SyncVoteSetResponse>, I>>(base?: I): SyncVoteSetResponse {
    return SyncVoteSetResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SyncVoteSetResponse>, I>>(object: I): SyncVoteSetResponse {
    const message = createBaseSyncVoteSetResponse();
    message.height = (object.height !== undefined && object.height !== null)
      ? Height.fromPartial(object.height)
      : undefined;
    message.round = object.round ?? 0;
    message.votes = object.votes?.map((e) => Vote.fromPartial(e)) || [];
    message.signatures = object.signatures?.map((e) => e) || [];
    return message;
  },
};

function createBaseSyncResponse(): SyncResponse {
  return { value: undefined, voteSet: undefined };
}

export const SyncResponse = {
  encode(message: SyncResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.value !== undefined) {
      SyncValueResponse.encode(message.value, writer.uint32(10).fork()).ldelim();
    }
    if (message.voteSet !== undefined) {
      SyncVoteSetResponse.encode(message.voteSet, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SyncResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSyncResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag != 10) {
            break;
          }

          message.value = SyncValueResponse.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag != 18) {
            break;
          }

          message.voteSet = SyncVoteSetResponse.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) == 4 || tag == 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SyncResponse {
    return {
      value: isSet(object.value) ? SyncValueResponse.fromJSON(object.value) : undefined,
      voteSet: isSet(object.voteSet) ? SyncVoteSetResponse.fromJSON(object.voteSet) : undefined,
    };
  },

  toJSON(message: SyncResponse): unknown {
    const obj: any = {};
    message.value !== undefined && (obj.value = message.value ? SyncValueResponse.toJSON(message.value) : undefined);
    message.voteSet !== undefined &&
      (obj.voteSet = message.voteSet ? SyncVoteSetResponse.toJSON(message.voteSet) : undefined);
    return obj;
  },

  create<I extends Exact<DeepPartial<SyncResponse>, I>>(base?: I): SyncResponse {
    return SyncResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SyncResponse>, I>>(object: I): SyncResponse {
    const message = createBaseSyncResponse();
    message.value = (object.value !== undefined && object.value !== null)
      ? SyncValueResponse.fromPartial(object.value)
      : undefined;
    message.voteSet = (object.voteSet !== undefined && object.voteSet !== null)
      ? SyncVoteSetResponse.fromPartial(object.voteSet)
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
