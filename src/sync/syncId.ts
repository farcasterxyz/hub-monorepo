import { Message } from '~/types';

const TIMESTAMP_LENGTH = 10;
const HASH_LENGTH = 128; // We're using 64 byte blake2b hashes
const ID_LENGTH = TIMESTAMP_LENGTH + HASH_LENGTH;

/**
 * SyncId allows for a stable, time ordered lexicographic sorting of messages across hubs
 * It is a combination of the message's timestamp and hash. This id string is used as the key in
 * the merkle trie.
 */
class SyncId {
  private readonly _timestamp: number;
  private readonly _hash: string;

  constructor(message: Message) {
    this._timestamp = message.data.signedAt;
    this._hash = message.hash;
  }

  public toString(): string {
    return `${this.timestampString}${this.hashString}`;
  }

  public get timestampString(): string {
    // SignedAt is in milliseconds. For our MerkleTrie, seconds is a good enough resolution
    // We also want to normalize the length to 10 characters, so that the bottommost
    // level of the trie represents seconds even if the timestamp of the message is 0.
    return Math.floor(this._timestamp / 1000)
      .toString()
      .padStart(TIMESTAMP_LENGTH, '0');
  }

  public get hashString(): string {
    return this._hash.slice(2);
  }
}

export { SyncId, TIMESTAMP_LENGTH, HASH_LENGTH, ID_LENGTH };
