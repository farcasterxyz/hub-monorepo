import * as protobufs from '@farcaster/protobufs';
import { makeMessagePrimaryKey, makeTsHash, typeToSetPostfix } from '~/storage/db/message';

const TIMESTAMP_LENGTH = 10; // Used to represent a decimal timestamp
const HASH_LENGTH = 20; // Used to represent a 160-bit BLAKE3 hash

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

  constructor(message: protobufs.Message) {
    this._fid = message.data?.fid || 0;
    this._hash = message.hash;
    this._timestamp = message.data?.timestamp || 0;
    this._type = message.data?.type || 0;
  }

  /** Returns a byte array that represents a SyncId */
  public syncId(): Uint8Array {
    const timestampString = timestampToPaddedTimestampPrefix(this._timestamp);

    const tsHash = makeTsHash(this._timestamp, this._hash);

    // Construct the rocksdb message key, which contains the fid, rocksdb prefix and hash

    // TODO - Safety: why do we unwrap wrap here instead of handling the error?
    const buf = makeMessagePrimaryKey(this._fid, typeToSetPostfix(this._type), tsHash._unsafeUnwrap());

    // Construct and returns the Sync Id by prepending the timestamp to the rocksdb message key
    return Buffer.concat([Buffer.from(timestampString), buf]);
  }

  /** Returns the rocks db primary key used to look up the message */
  static pkFromSyncId(syncId: Uint8Array): Buffer {
    const pk = syncId.slice(TIMESTAMP_LENGTH); // Skips the timestamp
    return Buffer.from(pk);
  }
}

/** Normalizes the timestamp in seconds to fixed length to ensure consistent depth in the trie */
const timestampToPaddedTimestampPrefix = (timestamp: number): string => {
  return Math.floor(timestamp).toString().padStart(TIMESTAMP_LENGTH, '0');
};

export { SyncId, timestampToPaddedTimestampPrefix, TIMESTAMP_LENGTH, HASH_LENGTH };
