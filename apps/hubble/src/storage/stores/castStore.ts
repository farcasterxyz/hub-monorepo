import {
  CastAddMessage,
  CastId,
  CastRemoveMessage,
  HubAsyncResult,
  HubError,
  MessageType,
  bytesCompare,
  isCastAddMessage,
  isCastRemoveMessage,
} from '@farcaster/hub-nodejs';
import { err, ok, ResultAsync } from 'neverthrow';
import {
  getMessagesPageByPrefix,
  makeCastIdKey,
  makeFidKey,
  makeMessagePrimaryKey,
  makeTsHash,
  makeUserKey,
} from '../db/message.js';
import RocksDB, { Transaction } from '../db/rocksdb.js';
import { RootPrefix, TRUE_VALUE, UserMessagePostfix, UserPostfix } from '../db/types.js';
import { MessagesPage, PageOptions, StorePruneOptions } from '../stores/types.js';
import { Store } from './store.js';
import StoreEventHandler from './storeEventHandler.js';

/**
 * Generates unique keys used to store or fetch CastAdd messages in the adds set index
 *
 * @param fid farcaster id of the user who created the cast
 * @param hash hash of the cast
 * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<tsHash?>
 */
const makeCastAddsKey = (fid: number, hash?: Uint8Array): Buffer => {
  return Buffer.concat([makeUserKey(fid), Buffer.from([UserPostfix.CastAdds]), Buffer.from(hash ?? '')]);
};

/**
 * Generates unique keys used to store or fetch CastAdd messages in the removes set index
 *
 * @param fid farcaster id of the user who created the cast
 * @param hash hash of the cast
 * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<tsHash?>
 */
const makeCastRemovesKey = (fid: number, hash?: Uint8Array): Buffer => {
  return Buffer.concat([makeUserKey(fid), Buffer.from([UserPostfix.CastRemoves]), Buffer.from(hash ?? '')]);
};

// TODO: make parentFid and parentHash fixed size
/**
 * Generates unique keys used to store or fetch CastAdd messages in the byParentKey index
 *
 * @param parentFid the fid of the user who created the parent cast
 * @param parentTsHash the timestamp hash of the parent message
 * @param fid the fid of the user who created the cast
 * @param tsHash the timestamp hash of the cast message
 * @returns RocksDB index key of the form <root_prefix>:<parentFid>:<parentTsHash>:<tsHash?>:<fid?>
 */
const makeCastsByParentKey = (parent: CastId | string, fid?: number, tsHash?: Uint8Array): Buffer => {
  const parentKey = typeof parent === 'string' ? Buffer.from(parent) : makeCastIdKey(parent);
  return Buffer.concat([
    Buffer.from([RootPrefix.CastsByParent]),
    parentKey,
    Buffer.from(tsHash ?? ''),
    fid ? makeFidKey(fid) : Buffer.from(''),
  ]);
};

/**
 * Generates unique keys used to store or fetch CastAdd messages in the byParentKey index
 *
 * @param mentionFid the fid of the user who was mentioned in the cast
 * @param fid the fid of the user who created the cast
 * @param tsHash the timestamp hash of the cast message
 * @returns RocksDB index key of the form <root_prefix>:<mentionFid>:<tsHash?>:<fid?>
 */
const makeCastsByMentionKey = (mentionFid: number, fid?: number, tsHash?: Uint8Array): Buffer => {
  return Buffer.concat([
    Buffer.from([RootPrefix.CastsByMention]),
    makeFidKey(mentionFid),
    Buffer.from(tsHash ?? ''),
    fid ? makeFidKey(fid) : Buffer.from(''),
  ]);
};

/**
 * CastStore persists Cast messages in RocksDB using a two-phase CRDT set to guarantee eventual
 * consistency.
 *
 * A Cast is created by a user and contains 320 characters of text and upto two embedded URLs.
 * Casts are added to the Store with a CastAdd and removed with a CastRemove. A CastAdd can be
 * a child to another CastAdd or arbitrary URI.
 *
 * Cast Messages collide if their tsHash (for CastAdds) or targetTsHash (for CastRemoves) are the
 * same for the same fid. Two CastAdds can never collide since any change to message content is
 * guaranteed to result in a unique hash value. CastRemoves can collide with CastAdds and with
 * each other, and such cases are handled with Remove-Wins and Last-Write-Wins rules as follows:
 *
 * 1. Remove wins over Adds
 * 2. Highest timestamp wins
 * 3. Highest lexicographic hash wins
 *
 * CastMessages are stored ordinally in RocksDB indexed by a unique key `fid:tsHash` which makes
 * truncating a user's earliest messages easy. Indices are built to lookup cast adds in the adds
 * set, cast removes in the removes set, cast adds that are the children of a cast add, and cast
 * adds that mention a specific user. The key-value entries created are:
 *
 * 1. fid:tsHash -> cast message
 * 2. fid:set:tsHash -> fid:tsHash (Add Set Index)
 * 3. fid:set:targetTsHash -> fid:tsHash (Remove Set Index)
 * 4. parentFid:parentTsHash:fid:tsHash -> fid:tsHash (Child Set Index)
 * 5. mentionFid:fid:tsHash -> fid:tsHash (Mentions Set Index)
 */
class CastStore extends Store<CastAddMessage, CastRemoveMessage> {
  override _postfix: UserMessagePostfix = UserPostfix.CastMessage;
  override makeAddKey(msg: CastAddMessage) {
    return makeCastAddsKey(
      msg.data.fid,
      msg.data.castAddBody || !msg.data.castRemoveBody ? msg.hash : msg.data.castRemoveBody.targetHash
    ) as Buffer;
  }

  override makeRemoveKey(msg: CastRemoveMessage) {
    return makeCastRemovesKey(
      msg.data.fid,
      msg.data.castAddBody || !msg.data.castRemoveBody ? msg.hash : msg.data.castRemoveBody.targetHash
    );
  }

  override _isAddType = isCastAddMessage;
  override _isRemoveType = isCastRemoveMessage;
  override _addMessageType = MessageType.CAST_ADD;
  override _removeMessageType = MessageType.CAST_REMOVE;
  protected override PRUNE_SIZE_LIMIT_DEFAULT = 10_000;
  protected override PRUNE_TIME_LIMIT_DEFAULT = 60 * 60 * 24 * 365; // 1 year

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    super(db, eventHandler, options);
    this._pruneTimeLimit = options.pruneTimeLimit ?? this.PRUNE_TIME_LIMIT_DEFAULT;
  }

  override async buildSecondaryIndices(txn: Transaction, message: CastAddMessage): HubAsyncResult<void> {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);

    if (tsHash.isErr()) {
      return err(tsHash.error);
    }

    // Puts the message key into the ByParent index
    const parent = message.data.castAddBody.parentCastId ?? message.data.castAddBody.parentUrl;
    if (parent) {
      txn = txn.put(makeCastsByParentKey(parent, message.data.fid, tsHash.value), TRUE_VALUE);
    }

    // Puts the message key into the ByMentions index
    for (const mentionFid of message.data.castAddBody.mentions) {
      txn = txn.put(makeCastsByMentionKey(mentionFid, message.data.fid, tsHash.value), TRUE_VALUE);
    }

    return ok(undefined);
  }

  override async deleteSecondaryIndices(txn: Transaction, message: CastAddMessage): HubAsyncResult<void> {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);

    if (tsHash.isErr()) {
      return err(tsHash.error);
    }

    // Delete the message key from the ByMentions index
    for (const mentionFid of message.data.castAddBody.mentions) {
      txn = txn.del(makeCastsByMentionKey(mentionFid, message.data.fid, tsHash.value));
    }

    // Delete the message key from the ByParent index
    const parent = message.data.castAddBody.parentCastId ?? message.data.castAddBody.parentUrl;
    if (parent) {
      txn = txn.del(makeCastsByParentKey(parent, message.data.fid, tsHash.value));
    }

    return ok(undefined);
  }

  override async findMergeAddConflicts(message: CastAddMessage): HubAsyncResult<void> {
    // Look up the remove tsHash for this cast
    const castRemoveTsHash = await ResultAsync.fromPromise(
      this._db.get(makeCastRemovesKey(message.data.fid, message.hash)),
      () => undefined
    );

    // If remove tsHash exists, fail because this cast has already been removed
    if (castRemoveTsHash.isOk()) {
      throw new HubError('bad_request.conflict', 'message conflicts with a CastRemove');
    }

    // Look up the add tsHash for this cast
    const castAddTsHash = await ResultAsync.fromPromise(
      this._db.get(makeCastAddsKey(message.data.fid, message.hash)),
      () => undefined
    );

    // If add tsHash exists, no-op because this cast has already been added
    if (castAddTsHash.isOk()) {
      throw new HubError('bad_request.duplicate', 'message has already been merged');
    }

    return ok(undefined);
  }

  override async findMergeRemoveConflicts(_message: CastRemoveMessage): HubAsyncResult<void> {
    return ok(undefined);
  }

  // RemoveWins + LWW, instead of default
  override messageCompare(aType: MessageType, aTsHash: Uint8Array, bType: MessageType, bTsHash: Uint8Array): number {
    // Compare message types to enforce that RemoveWins in case of LWW ties.
    if (aType === this._removeMessageType && bType === this._addMessageType) {
      return 1;
    } else if (aType === this._addMessageType && bType === this._removeMessageType) {
      return -1;
    }

    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    // Compare hashes (last 4 bytes of tsHash) to break ties between messages of the same type and timestamp
    return bytesCompare(aTsHash.subarray(4), bTsHash.subarray(4));
  }

  /** Looks up CastAdd message by cast tsHash */
  async getCastAdd(fid: number, hash: Uint8Array): Promise<CastAddMessage> {
    return await this.getAdd({ data: { fid }, hash });
  }

  /** Looks up CastRemove message by cast tsHash */
  async getCastRemove(fid: number, hash: Uint8Array): Promise<CastRemoveMessage> {
    return await this.getRemove({ data: { fid }, hash });
  }

  /** Gets all CastAdd messages for an fid */
  async getCastAddsByFid(fid: number, pageOptions: PageOptions = {}): Promise<MessagesPage<CastAddMessage>> {
    return await this.getAddsByFid({ data: { fid } }, pageOptions);
  }

  /** Gets all CastRemove messages for an fid */
  async getCastRemovesByFid(fid: number, pageOptions: PageOptions = {}): Promise<MessagesPage<CastRemoveMessage>> {
    const castMessagesPrefix = makeMessagePrimaryKey(fid, UserPostfix.CastMessage);
    return getMessagesPageByPrefix(this._db, castMessagesPrefix, isCastRemoveMessage, pageOptions);
  }

  async getAllCastMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<CastAddMessage | CastRemoveMessage>> {
    return await this.getAllMessagesByFid(fid, pageOptions);
  }

  /** Gets all CastAdd messages for a parent cast (fid and tsHash) */
  async getCastsByParent(
    parent: CastId | string,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<CastAddMessage>> {
    return await this.getBySecondaryIndex(makeCastsByParentKey(parent), pageOptions);
  }

  /** Gets all CastAdd messages for a mention (fid) */
  async getCastsByMention(mentionFid: number, pageOptions: PageOptions = {}): Promise<MessagesPage<CastAddMessage>> {
    return await this.getBySecondaryIndex(makeCastsByMentionKey(mentionFid), pageOptions);
  }
}

export default CastStore;
