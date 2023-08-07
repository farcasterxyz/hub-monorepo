import { makeMessagePrimaryKey, typeToSetPostfix } from "../../storage/db/message.js";
import { FID_BYTES, HASH_LENGTH } from "../../storage/db/types.js";
import { Message } from "@farcaster/hub-nodejs";

const TIMESTAMP_LENGTH = 10; // Used to represent a decimal timestamp

/**
 * SyncIds are used to represent a Farcaster Message in the MerkleTrie and are ordered by timestamp
 * followed by lexicographical value of some of the message's properties.
 *
 * They are constructed by prefixing the message's rocks db key (fid, rocks db prefix, tsHash) with
 * its timestamp. Duplicating the timestamp in the prefix is space inefficient, but allows sorting
 * ids by time while also allowing fast lookups using the rocksdb key.
 */
class SyncId {
  private readonly _fid: number;
  private readonly _hash: Uint8Array;
  private readonly _timestamp: number;
  private readonly _type: number;

  constructor(message: Message) {
    this._fid = message.data?.fid || 0;
    this._hash = message.hash;
    this._timestamp = message.data?.timestamp || 0;
    this._type = message.data?.type || 0;
  }

  /** Returns a byte array that represents a SyncId */
  public syncId(): Uint8Array {
    const timestampString = timestampToPaddedTimestampPrefix(this._timestamp);

    // Note: We use the hash directly instead of the tsHash because the "ts" part of the tsHash is
    // just the timestamp, which is already a part of the key (first 10 bytes)
    // When we do the reverse lookup (`pkFromSyncId), we'll remember to add the timestamp back.
    const buf = makeMessagePrimaryKey(this._fid, typeToSetPostfix(this._type), this._hash);

    // Construct and returns the Sync Id by prepending the timestamp to the rocksdb message key
    return Buffer.concat([Buffer.from(timestampString), buf]);
  }

  /** Returns the rocks db primary key used to look up the message */
  static pkFromSyncId(syncId: Uint8Array): Buffer {
    const ts = syncId.slice(0, TIMESTAMP_LENGTH);
    const tsBE = Buffer.alloc(4);
    tsBE.writeUInt32BE(parseInt(ts.toString(), 10), 0);

    const syncIDpart = syncId.slice(TIMESTAMP_LENGTH); // Skips the timestamp

    // We need to add the timestamp back to the primary key so that we can look up the message
    const ts_offset = 1 + FID_BYTES + 1; // 1 byte for the rocksdb prefix, 4 bytes for the fid, 1 byte for the set

    const pk = new Uint8Array(ts_offset + 4 + HASH_LENGTH);

    pk.set(syncIDpart.slice(0, ts_offset), 0); // copy the 1 byte prefix, 4 bytes fid, 1 byte set
    pk.set(tsBE, ts_offset); // 4 bytes timestamp
    pk.set(syncIDpart.slice(ts_offset), ts_offset + 4); // 20 byte hash

    return Buffer.from(pk);
  }

  /** Return the message hash for the SyncID */
  static hashFromSyncId(syncId: Uint8Array): Uint8Array {
    return syncId.slice(TIMESTAMP_LENGTH + 1 + FID_BYTES + 1);
  }
}

/** Normalizes the timestamp in seconds to fixed length to ensure consistent depth in the trie */
const timestampToPaddedTimestampPrefix = (timestamp: number): string => {
  return Math.floor(timestamp).toString().padStart(TIMESTAMP_LENGTH, "0");
};

const prefixToTimestamp = (prefix: string): number => {
  return parseInt(prefix.padEnd(TIMESTAMP_LENGTH, "0"), 10);
};

export { SyncId, timestampToPaddedTimestampPrefix, prefixToTimestamp, TIMESTAMP_LENGTH, HASH_LENGTH };
