import * as protobufs from '@farcaster/protobufs';
import { makeMessagePrimaryKey, makeTsHash, typeToSetPostfix } from '~/storage/db/message';

const TIMESTAMP_LENGTH = 10; // 10 bytes for timestamp in decimal
const HASH_LENGTH = 20; // We're using 20 byte blake2b hashes

/**
 * SyncId allows for a stable, time ordered lexicographic sorting of messages across hubs
 * It is a combination of the message's timestamp and hash. This id string is used as the key in
 * the MerkleTrie.
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

  public syncId(): Uint8Array {
    // For our MerkleTrie, seconds is a good enough resolution
    // We also want to normalize the length to 10 characters, so that the MerkleTrie
    // will always have the same depth for any timestamp (even 0).
    const timestampString = timestampToPaddedTimestampPrefix(this._timestamp);

    const tsHash = makeTsHash(this._timestamp, this._hash);
    const buf = makeMessagePrimaryKey(this._fid, typeToSetPostfix(this._type), tsHash._unsafeUnwrap());

    // We prepend the timestamp to the hash so that the MerkleTrie is sorted by timestamp
    return Buffer.concat([Buffer.from(timestampString), buf]);
  }

  static pkFromSyncId(syncId: Uint8Array): Buffer {
    // The first 10 bytes are the timestamp, so we skip them
    const pk = syncId.slice(TIMESTAMP_LENGTH);

    return Buffer.from(pk);
  }
}

const timestampToPaddedTimestampPrefix = (timestamp: number): string => {
  return Math.floor(timestamp).toString().padStart(TIMESTAMP_LENGTH, '0');
};

export { SyncId, timestampToPaddedTimestampPrefix, TIMESTAMP_LENGTH, HASH_LENGTH };
