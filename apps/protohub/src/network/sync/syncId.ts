import * as protobufs from '@farcaster/protobufs';
import { makeUserKey } from '~/storage/db/message';
import { UserPostfix } from '~/storage/db/types';

const TIMESTAMP_LENGTH = 10; // 10 bytes for timestamp in decimal
const HASH_LENGTH = 160; // We're using 20 byte blake2b hashes

/**
 * SyncId allows for a stable, time ordered lexicographic sorting of messages across hubs
 * It is a combination of the message's timestamp and hash. This id string is used as the key in
 * the MerkleTrie.
 */
class SyncId {
  private readonly _fid: number;
  private readonly _tsHash: Uint8Array;
  private readonly _timestamp: number;
  private readonly _type: number;

  constructor(message: protobufs.Message) {
    this._fid = message.data?.fid || 0;
    this._tsHash = message.hash;
    this._timestamp = message.data?.timestamp || 0;
    this._type = message.data?.type || 0;
  }

  public idString(): string {
    // For our MerkleTrie, seconds is a good enough resolution
    // We also want to normalize the length to 10 characters, so that the MerkleTrie
    // will always have the same depth for any timestamp (even 0).
    const timestampString = timestampToPaddedTimestampPrefix(this._timestamp);

    const buf = makeMessagePrimaryKey(this._fid, this._type, this._tsHash);
    return timestampString + buf.toString('hex');
  }

  static pkFromIdString(idString: string): Buffer {
    // The first 10 bytes are the timestamp, so we skip them
    const pk = idString.slice(TIMESTAMP_LENGTH);

    return Buffer.from(pk, 'hex');
  }
}

const timestampToPaddedTimestampPrefix = (timestamp: number): string => {
  return Math.floor(timestamp).toString().padStart(TIMESTAMP_LENGTH, '0');
};

const makeMessagePrimaryKey = (fid: number, type: number, hash: Uint8Array): Buffer => {
  return Buffer.concat([makeUserKey(fid), Buffer.from([typeToSetPostfix(type)]), Buffer.from(hash)]);
};

const typeToSetPostfix = (type: protobufs.MessageType): UserPostfix => {
  if (type === protobufs.MessageType.MESSAGE_TYPE_CAST_ADD || type === protobufs.MessageType.MESSAGE_TYPE_CAST_REMOVE) {
    return UserPostfix.CastMessage;
  }

  if (
    type === protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD ||
    type === protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE
  ) {
    return UserPostfix.ReactionMessage;
  }

  if (type === protobufs.MessageType.MESSAGE_TYPE_AMP_ADD || type === protobufs.MessageType.MESSAGE_TYPE_AMP_REMOVE) {
    return UserPostfix.AmpMessage;
  }

  if (
    type === protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS ||
    type === protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE
  ) {
    return UserPostfix.VerificationMessage;
  }

  if (
    type === protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD ||
    type === protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE
  ) {
    return UserPostfix.SignerMessage;
  }

  if (type === protobufs.MessageType.MESSAGE_TYPE_USER_DATA_ADD) {
    return UserPostfix.UserDataMessage;
  }

  throw new Error('invalid type');
};

export { SyncId, timestampToPaddedTimestampPrefix, TIMESTAMP_LENGTH, HASH_LENGTH };
