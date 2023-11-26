import { makeFidKey, makeMessagePrimaryKey, typeToSetPostfix } from "../../storage/db/message.js";
import { FID_BYTES, HASH_LENGTH, RootPrefix } from "../../storage/db/types.js";
import {
  bytesToUtf8String,
  Message,
  OnChainEvent,
  OnChainEventType,
  toFarcasterTime,
  UserNameProof,
  validations,
} from "@farcaster/hub-nodejs";
import { makeOnChainEventPrimaryKey } from "../../storage/db/onChainEvent.js";

const TIMESTAMP_LENGTH = 10; // Used to represent a decimal timestamp

// Typescript enum for syncid types
export enum SyncIdType {
  Unknown = 0,
  Message = 1,
  FName = 2,
  OnChainEvent = 3,
}

type BaseUnpackedSyncId = {
  fid: number;
  type: SyncIdType;
};

export type UnknownSyncId = BaseUnpackedSyncId & {
  type: SyncIdType.Unknown;
  fid: 0;
};

export type MessageSyncId = BaseUnpackedSyncId & {
  type: SyncIdType.Message;
  primaryKey: Uint8Array;
  hash: Uint8Array;
};

export type FNameSyncId = BaseUnpackedSyncId & {
  type: SyncIdType.FName;
  name: Uint8Array;
  padded: boolean;
};

export type OnChainEventSyncId = BaseUnpackedSyncId & {
  type: SyncIdType.OnChainEvent;
  eventType: OnChainEventType;
  blockNumber: number;
  logIndex: number;
};

export type UnpackedSyncId = UnknownSyncId | MessageSyncId | FNameSyncId | OnChainEventSyncId;

/**
 * SyncIds are used to represent a Farcaster Message, an FName proof or an OnChainEvent in the MerkleTrie
 * and are ordered by timestamp followed by a unique lexicographical identifier based on the type.
 *
 * They are of the format: <timestampstring><root prefix><message_ident|fname_ident|onchainevent_ident> where:
 *   timestampstring: is a 10 digit, 0 leftpadded string representing the timestamp in seconds (farcaster epoch)
 *   root prefix: is a single byte representing the root prefix
 *   message_ident: fid + message postfix + tshash
 *   fname_ident: fid + name
 *   onchainevent_ident: event_type + fid + blocknumber + logindex
 */
class SyncId {
  private readonly _bytes: Uint8Array;

  private constructor(bytes: Uint8Array) {
    this._bytes = bytes;
  }

  static fromMessage(message: Message): SyncId {
    const fid = message.data?.fid || 0;
    const hash = message.hash;
    const timestamp = message.data?.timestamp || 0;
    const type = message.data?.type || 0;

    // Note: We use the hash directly instead of the tsHash because the "ts" part of the tsHash is
    // just the timestamp, which is already a part of the key (first 10 bytes)
    // When we unpack the syncid, we'll remember to add the timestamp back.
    const pkBuf = makeMessagePrimaryKey(fid, typeToSetPostfix(type), hash);

    // Construct and returns the Sync Id by prepending the timestamp to the rocksdb message key
    // Note the first byte of the pk is the RootPrefix
    return SyncId.fromTimestamp(timestamp, pkBuf);
  }

  static fromFName(usernameProof: UserNameProof): SyncId {
    const timestampRes = toFarcasterTime(usernameProof.timestamp * 1000);
    if (timestampRes.isErr()) {
      throw timestampRes.error;
    }
    const nameStrResult = bytesToUtf8String(usernameProof.name);
    if (nameStrResult.isErr()) {
      throw nameStrResult.error;
    }
    // Pad the name with null bytes to ensure all names have the same length. The trie cannot handle entries that are
    // substrings for another (e.g. "net" and "network")
    const paddedName = nameStrResult.value.padEnd(validations.USERNAME_MAX_LENGTH, "\0");
    return SyncId.fromTimestamp(
      timestampRes.value,
      Buffer.concat([
        Buffer.from([RootPrefix.FNameUserNameProof]),
        makeFidKey(usernameProof.fid),
        Buffer.from(paddedName),
      ]),
    );
  }

  static fromOnChainEvent(onChainEvent: OnChainEvent): SyncId {
    const timestampRes = toFarcasterTime(onChainEvent.blockTimestamp * 1000);
    if (timestampRes.isErr()) {
      throw timestampRes.error;
    }
    const eventPk = makeOnChainEventPrimaryKey(
      onChainEvent.type,
      onChainEvent.fid,
      onChainEvent.blockNumber,
      onChainEvent.logIndex,
    );
    return SyncId.fromTimestamp(timestampRes.value, eventPk);
  }

  static fromBytes(bytes: Uint8Array): SyncId {
    return new SyncId(new Uint8Array(bytes));
  }

  /** Returns a byte array that represents a SyncId */
  public syncId(): Uint8Array {
    return this._bytes;
  }

  public unpack(): UnpackedSyncId {
    return SyncId.unpack(this._bytes);
  }

  public type(): SyncIdType {
    switch (this._bytes[TIMESTAMP_LENGTH]) {
      case RootPrefix.User:
        return SyncIdType.Message;
      case RootPrefix.FNameUserNameProof:
        return SyncIdType.FName;
      case RootPrefix.OnChainEvent:
        return SyncIdType.OnChainEvent;
      default:
        return SyncIdType.Unknown;
    }
  }

  static unpack(syncId: Uint8Array): UnpackedSyncId {
    const rootPrefixOffset = TIMESTAMP_LENGTH;
    const rootPrefix = syncId[rootPrefixOffset];
    const idBuf = Buffer.from(syncId);
    if (rootPrefix === RootPrefix.User) {
      // Message SyncId
      return {
        type: SyncIdType.Message,
        fid: idBuf.readUInt32BE(TIMESTAMP_LENGTH + 1), // 1 byte for the root prefix
        primaryKey: this.pkFromSyncId(syncId),
        hash: syncId.slice(TIMESTAMP_LENGTH + 1 + FID_BYTES + 1), // 1 byte after fid for the set postfix
      };
    } else if (rootPrefix === RootPrefix.FNameUserNameProof) {
      // Name bytes could be zero padded, so we need to trim the null bytes
      const paddedNameBytes = syncId.slice(TIMESTAMP_LENGTH + 1 + FID_BYTES);
      const firstZeroIndex = paddedNameBytes.findIndex((byte) => byte === 0);
      let nameBytes = paddedNameBytes;
      if (firstZeroIndex !== -1) {
        nameBytes = paddedNameBytes.slice(0, firstZeroIndex);
      }
      return {
        type: SyncIdType.FName,
        fid: idBuf.readUInt32BE(TIMESTAMP_LENGTH + 1), // 1 byte for the root prefix
        name: nameBytes,
        padded: firstZeroIndex !== -1,
      };
    } else if (rootPrefix === RootPrefix.OnChainEvent) {
      return {
        type: SyncIdType.OnChainEvent,
        eventType: idBuf.readUInt8(TIMESTAMP_LENGTH + 1 + 1),
        fid: idBuf.readUInt32BE(TIMESTAMP_LENGTH + 1 + 1 + 1), // 1 byte for the root prefix, 1 byte for the postfix, 1 byte for the event type
        blockNumber: idBuf.readUInt32BE(TIMESTAMP_LENGTH + 1 + 1 + 1 + FID_BYTES),
        logIndex: idBuf.readUInt32BE(TIMESTAMP_LENGTH + 1 + 1 + 1 + FID_BYTES + 4),
      };
    }
    return {
      type: SyncIdType.Unknown,
      fid: 0,
    };
  }

  private static fromTimestamp(farcasterTimestamp: number, _buffer: Buffer) {
    return SyncId.fromBytes(
      Buffer.concat([Buffer.from(timestampToPaddedTimestampPrefix(farcasterTimestamp)), _buffer]),
    );
  }

  /** Returns the rocks db primary key used to look up the message */
  private static pkFromSyncId(syncId: Uint8Array): Buffer {
    const ts = syncId.slice(0, TIMESTAMP_LENGTH);
    const tsBE = Buffer.alloc(4);
    tsBE.writeUInt32BE(parseInt(Buffer.from(ts).toString(), 10), 0);

    const syncIDpart = syncId.slice(TIMESTAMP_LENGTH); // Skips the timestamp

    // We need to add the timestamp back to the primary key so that we can look up the message
    const ts_offset = 1 + FID_BYTES + 1; // 1 byte for the rocksdb prefix, 4 bytes for the fid, 1 byte for the set

    const pk = new Uint8Array(ts_offset + 4 + HASH_LENGTH);

    pk.set(syncIDpart.slice(0, ts_offset), 0); // copy the 1 byte prefix, 4 bytes fid, 1 byte set
    pk.set(tsBE, ts_offset); // 4 bytes timestamp
    pk.set(syncIDpart.slice(ts_offset), ts_offset + 4); // 20 byte hash

    return Buffer.from(pk);
  }
}

/** Normalizes the timestamp in seconds to fixed length to ensure consistent depth in the trie */
const timestampToPaddedTimestampPrefix = (timestamp: number): string => {
  return Math.floor(timestamp).toString().padStart(TIMESTAMP_LENGTH, "0");
};

const prefixToTimestamp = (prefix: string): number => {
  return parseInt(prefix.padEnd(TIMESTAMP_LENGTH, "0"), 10);
};

const prettyFormatPrefix = (prefix: Uint8Array): string => {
  const timePart = Buffer.from(prefix.slice(0, TIMESTAMP_LENGTH)).toString();
  const hashPart = Buffer.from(prefix.slice(TIMESTAMP_LENGTH)).toString("hex");

  return `${timePart}${hashPart ? `/${hashPart}` : ""}`;
};

export {
  SyncId,
  timestampToPaddedTimestampPrefix,
  prefixToTimestamp,
  prettyFormatPrefix as formatPrefix,
  TIMESTAMP_LENGTH,
  HASH_LENGTH,
};
