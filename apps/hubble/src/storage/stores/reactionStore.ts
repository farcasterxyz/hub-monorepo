import {
  CastId,
  HubAsyncResult,
  HubError,
  isReactionAddMessage,
  isReactionRemoveMessage,
  MessageType,
  ReactionAddMessage,
  ReactionRemoveMessage,
  ReactionType,
} from '@farcaster/hub-nodejs';
import { err, ok, ResultAsync } from 'neverthrow';
import {
  getManyMessages,
  getPageIteratorByPrefix,
  makeCastIdKey,
  makeFidKey,
  makeMessagePrimaryKey,
  makeTsHash,
  makeUserKey,
} from '../db/message.js';
import RocksDB, { Transaction } from '../db/rocksdb.js';
import { RootPrefix, TSHASH_LENGTH, UserMessagePostfix, UserPostfix } from '../db/types.js';
import StoreEventHandler from '../stores/storeEventHandler.js';
import { MessagesPage, PAGE_SIZE_MAX, PageOptions, StorePruneOptions } from '../stores/types.js';
import { Store } from './store.js';

const PRUNE_SIZE_LIMIT_DEFAULT = 5_000;
const PRUNE_TIME_LIMIT_DEFAULT = 60 * 60 * 24 * 90; // 90 days

const makeTargetKey = (target: CastId | string): Buffer => {
  return typeof target === 'string' ? Buffer.from(target) : makeCastIdKey(target);
};

/**
 * Generates a unique key used to store a ReactionAdd message key in the ReactionsAdd Set index
 *
 * @param fid farcaster id of the user who created the reaction
 * @param type type of reaction created
 * @param targetId id of the object being reacted to
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<targetKey?>:<type?>
 */
const makeReactionAddsKey = (fid: number, type?: ReactionType, target?: CastId | string): Buffer => {
  if (target && !type) {
    throw new HubError('bad_request.validation_failure', 'targetId provided without type');
  }

  return Buffer.concat([
    makeUserKey(fid), // --------------------------- fid prefix, 33 bytes
    Buffer.from([UserPostfix.ReactionAdds]), // -------------- reaction_adds key, 1 byte
    Buffer.from(type ? [type] : ''), //-------- type, 1 byte
    target ? makeTargetKey(target) : Buffer.from(''), //-- target id, 28 bytes
  ]);
};

/**
 * Generates a unique key used to store a ReactionRemove message key in the ReactionsRemove Set index
 *
 * @param fid farcaster id of the user who created the reaction
 * @param type type of reaction created
 * @param targetId id of the object being reacted to
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<targetKey?>:<type?>
 */
const makeReactionRemovesKey = (fid: number, type?: ReactionType, target?: CastId | string): Buffer => {
  if (target && !type) {
    throw new HubError('bad_request.validation_failure', 'targetId provided without type');
  }

  return Buffer.concat([
    makeUserKey(fid), // --------------------------- fid prefix, 33 bytes
    Buffer.from([UserPostfix.ReactionRemoves]), // ----------- reaction_adds key, 1 byte
    Buffer.from(type ? [type] : ''), //-------- type, 1 byte
    target ? makeTargetKey(target) : Buffer.from(''), //-- target id, 28 bytes
  ]);
};

/**
 * Generates a unique key used to store a ReactionAdd Message in the ReactionsByTargetAndType index
 *
 * @param targetId the id of the object being reacted to (currently just cast id)
 * @param fid the fid of the user who created the reaction
 * @param tsHash the timestamp hash of the reaction message
 *
 * @returns RocksDB index key of the form <RootPrefix>:<target_key>:<fid?>:<tsHash?>
 */
const makeReactionsByTargetKey = (target: CastId | string, fid?: number, tsHash?: Uint8Array): Buffer => {
  if (fid && !tsHash) {
    throw new HubError('bad_request.validation_failure', 'fid provided without tsHash');
  }

  if (tsHash && !fid) {
    throw new HubError('bad_request.validation_failure', 'tsHash provided without fid');
  }

  return Buffer.concat([
    Buffer.from([RootPrefix.ReactionsByTarget]),
    makeTargetKey(target),
    Buffer.from(tsHash ?? ''),
    fid ? makeFidKey(fid) : Buffer.from(''),
  ]);
};

/**
 * ReactionStore persists Reaction Messages in RocksDB using a two-phase CRDT set to guarantee
 * eventual consistency.
 *
 * A Reaction is created by a user and points at a target (e.g. cast) and has a type (e.g. like).
 * Reactions are added with a ReactionAdd and removed with a ReactionRemove. Reaction messages can
 * collide if two messages have the same user fid, target, and type. Collisions are handled with
 * Last-Write-Wins + Remove-Wins rules as follows:
 *
 * 1. Highest timestamp wins
 * 2. Remove wins over Adds
 * 3. Highest lexicographic hash wins
 *
 * ReactionMessages are stored ordinally in RocksDB indexed by a unique key `fid:tsHash`,
 * which makes truncating a user's earliest messages easy. Indices are built to look up
 * reaction adds in th adds set, reaction removes in the remove set and all reactions
 * for a given target. The key-value entries created by the Reaction Store are:
 *
 * 1. fid:tsHash -> reaction message
 * 2. fid:set:targetCastTsHash:reactionType -> fid:tsHash (Set Index)
 * 3. reactionTarget:reactionType:targetCastTsHash -> fid:tsHash (Target Index)
 */
class ReactionStore extends Store<ReactionAddMessage, ReactionRemoveMessage> {
  override _postfix: UserMessagePostfix = UserPostfix.ReactionMessage;
  override makeAddKey(msg: ReactionAddMessage) {
    return makeReactionAddsKey(
      msg.data.fid,
      msg.data.reactionBody.type,
      msg.data.reactionBody.targetUrl || msg.data.reactionBody.targetCastId
    ) as Buffer;
  }

  override makeRemoveKey(msg: ReactionRemoveMessage) {
    return makeReactionRemovesKey(
      msg.data.fid,
      msg.data.reactionBody.type,
      msg.data.reactionBody.targetUrl || msg.data.reactionBody.targetCastId
    );
  }

  override _isAddType = isReactionAddMessage;
  override _isRemoveType = isReactionRemoveMessage;
  override _addMessageType = MessageType.REACTION_ADD;
  override _removeMessageType = MessageType.REACTION_REMOVE;
  protected override PRUNE_SIZE_LIMIT_DEFAULT = PRUNE_SIZE_LIMIT_DEFAULT;
  protected override PRUNE_TIME_LIMIT_DEFAULT = PRUNE_TIME_LIMIT_DEFAULT;

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    super(db, eventHandler, options);
    this._pruneTimeLimit = options.pruneTimeLimit ?? this.PRUNE_TIME_LIMIT_DEFAULT;
  }

  override async findMergeAddConflicts(_message: ReactionAddMessage): HubAsyncResult<void> {
    return ok(undefined);
  }

  override async findMergeRemoveConflicts(_message: ReactionRemoveMessage): HubAsyncResult<void> {
    return ok(undefined);
  }

  override async buildSecondaryIndices(txn: Transaction, message: ReactionAddMessage): HubAsyncResult<void> {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);

    if (tsHash.isErr()) {
      return err(tsHash.error);
    }

    const target = message.data.reactionBody.targetCastId || message.data.reactionBody.targetUrl;

    if (!target) {
      return err(new HubError('bad_request.invalid_param', 'targetfid null'));
    }

    // Puts message key into the byTarget index
    const byTargetKey = makeReactionsByTargetKey(target, message.data.fid, tsHash.value);
    txn = txn.put(byTargetKey, Buffer.from([message.data.reactionBody.type]));

    return ok(undefined);
  }

  override async deleteSecondaryIndices(txn: Transaction, message: ReactionAddMessage): HubAsyncResult<void> {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);

    if (tsHash.isErr()) {
      return err(tsHash.error);
    }

    const target = message.data.reactionBody.targetCastId || message.data.reactionBody.targetUrl;

    if (!target) {
      return err(new HubError('bad_request.invalid_param', 'targetfid null'));
    }

    // Delete the message key from byTarget index
    const byTargetKey = makeReactionsByTargetKey(target, message.data.fid, tsHash.value);
    txn = txn.del(byTargetKey);

    return ok(undefined);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Instance Methods                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Finds a ReactionAdd Message by checking the Adds Set index
   *
   * @param fid fid of the user who created the reaction add
   * @param type type of reaction that was added
   * @param castId id of the cast being reacted to
   *
   * @returns the ReactionAdd Model if it exists, undefined otherwise
   */
  async getReactionAdd(fid: number, type: ReactionType, target: CastId | string): Promise<ReactionAddMessage> {
    const targetUrl = typeof target === 'string' ? target : undefined;
    const targetCastId = typeof target === 'string' ? undefined : target;
    return await this.getAdd({ data: { fid, reactionBody: { type, targetCastId, targetUrl } } });
  }

  /**
   * Finds a ReactionRemove Message by checking the Remove Set index
   *
   * @param fid fid of the user who created the reaction remove
   * @param type type of reaction that was removed
   * @param castId id of the cast being reacted to
   * @returns the ReactionRemove message if it exists, undefined otherwise
   */
  async getReactionRemove(fid: number, type: ReactionType, target: CastId | string): Promise<ReactionRemoveMessage> {
    const targetUrl = typeof target === 'string' ? target : undefined;
    const targetCastId = typeof target === 'string' ? undefined : target;
    return await this.getRemove({ data: { fid, reactionBody: { type, targetCastId, targetUrl } } });
  }

  /** Finds all ReactionAdd Messages by iterating through the prefixes */
  async getReactionAddsByFid(
    fid: number,
    type?: ReactionType,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<ReactionAddMessage>> {
    return await this.getAddsByFid({ data: { fid, reactionBody: { type: type as ReactionType } } }, pageOptions);
  }

  /** Finds all ReactionRemove Messages by iterating through the prefixes */
  async getReactionRemovesByFid(
    fid: number,
    type?: ReactionType,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<ReactionRemoveMessage>> {
    return await this.getRemovesByFid({ data: { fid, reactionBody: { type: type as ReactionType } } }, pageOptions);
  }

  async getAllReactionMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<ReactionAddMessage | ReactionRemoveMessage>> {
    return await this.getAllMessagesByFid(fid, pageOptions);
  }

  /** Finds all ReactionAdds that point to a specific target by iterating through the prefixes */
  async getReactionsByTarget(
    target: CastId | string,
    type?: ReactionType,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<ReactionAddMessage>> {
    const prefix = makeReactionsByTargetKey(target);

    const iterator = getPageIteratorByPrefix(this._db, prefix, pageOptions);

    const limit = pageOptions.pageSize || PAGE_SIZE_MAX;

    const messageKeys: Buffer[] = [];

    let iteratorFinished = false;
    let lastPageToken: Uint8Array | undefined;
    do {
      const result = await ResultAsync.fromPromise(iterator.next(), (e) => e as HubError);
      if (result.isErr()) {
        iteratorFinished = true;
        break;
      }

      const [key, value] = result.value;

      lastPageToken = Uint8Array.from((key as Buffer).subarray(prefix.length));

      if (type === undefined || (value !== undefined && value.equals(Buffer.from([type])))) {
        // Calculates the positions in the key where the fid and tsHash begin
        const tsHashOffset = prefix.length;
        const fidOffset = tsHashOffset + TSHASH_LENGTH;

        const fid = Number((key as Buffer).readUint32BE(fidOffset));
        const tsHash = Uint8Array.from(key as Buffer).subarray(tsHashOffset, tsHashOffset + TSHASH_LENGTH);
        const messagePrimaryKey = makeMessagePrimaryKey(fid, UserPostfix.ReactionMessage, tsHash);

        messageKeys.push(messagePrimaryKey);
      }
    } while (messageKeys.length < limit);

    const messages = await getManyMessages<ReactionAddMessage>(this._db, messageKeys);

    await iterator.end();
    if (!iteratorFinished) {
      return { messages, nextPageToken: lastPageToken };
    } else {
      return { messages, nextPageToken: undefined };
    }
  }
}

export default ReactionStore;
