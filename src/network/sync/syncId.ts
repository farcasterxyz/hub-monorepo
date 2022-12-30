import MessageModel from '~/flatbuffers/models/messageModel';

const TIMESTAMP_LENGTH = 10; // 10 bytes for timestamp in decimal
const HASH_LENGTH = 128; // We're using 64 byte blake2b hashes

/**
 * SyncId allows for a stable, time ordered lexicographic sorting of messages across hubs
 * It is a combination of the message's timestamp and hash. This id string is used as the key in
 * the MerkleTrie.
 */
class SyncId {
  private readonly _fid: Uint8Array;
  private readonly _tsHash: Uint8Array;
  private readonly _timestamp: number;
  private readonly _type: number;

  constructor(message: MessageModel) {
    this._fid = message.fid();
    this._tsHash = message.tsHash();
    this._timestamp = message.timestamp();
    this._type = message.type();

    // if (this._tsHash.length !== ID_LENGTH) {
    //   throw new HubError('bad_request.parse_failure', `Invalid hash: ${this._tsHash}`);
    // }
  }

  public idString(): string {
    // For our MerkleTrie, seconds is a good enough resolution
    // We also want to normalize the length to 10 characters, so that the MerkleTrie
    // will always have the same depth for any timestamp (even 0).
    const timestampString = Math.floor(this._timestamp).toString().padStart(TIMESTAMP_LENGTH, '0');

    const buf = MessageModel.primaryKey(this._fid, MessageModel.typeToSetPostfix(this._type), this._tsHash);
    return timestampString + buf.toString('hex');
  }

  public toString(): string {
    return this.idString();
  }

  static pkFromIdString(idString: string): Buffer {
    // The first 10 bytes are the timestamp, so we skip them
    const pk = idString.slice(TIMESTAMP_LENGTH);

    return Buffer.from(pk, 'hex');
  }
}

export { SyncId, TIMESTAMP_LENGTH, HASH_LENGTH };
