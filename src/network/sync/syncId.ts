import { Message } from '~/types';
import { HubError } from '~/utils/hubErrors';

const TIMESTAMP_LENGTH = 10;
const HASH_LENGTH = 128; // We're using 64 byte blake2b hashes
const ID_LENGTH = TIMESTAMP_LENGTH + HASH_LENGTH;

/**
 * SyncId allows for a stable, time ordered lexicographic sorting of messages across hubs
 * It is a combination of the message's timestamp and hash. This id string is used as the key in
 * the MerkleTrie.
 */
class SyncId {
  private readonly _timestamp: number;
  private readonly _hash: string;

  constructor(message: Message) {
    this._timestamp = message.data.signedAt;
    this._hash = message.hash;
    // Hashlength +2 to account for the 0x
    if (this._hash.length !== HASH_LENGTH + 2 || !this._hash.startsWith('0x')) {
      throw new HubError('bad_request.parse_failure', `Invalid hash: ${this._hash}`);
    }
    if (this.timestampString.length !== TIMESTAMP_LENGTH) {
      throw new HubError('bad_request.parse_failure', `Invalid timestamp: ${this.timestampString}`);
    }
  }

  public toString(): string {
    return `${this.timestampString}${this.hashString}`;
  }

  public get timestampString(): string {
    // SignedAt is in milliseconds. For our MerkleTrie, seconds is a good enough resolution
    // We also want to normalize the length to 10 characters, so that the MerkleTrie
    // will always have the same depth for any timestamp (even 0).
    return Math.floor(this._timestamp / 1000)
      .toString()
      .padStart(TIMESTAMP_LENGTH, '0');
  }

  public get hashString(): string {
    return this._hash.slice(2);
  }
}

export { SyncId, TIMESTAMP_LENGTH, HASH_LENGTH, ID_LENGTH };
