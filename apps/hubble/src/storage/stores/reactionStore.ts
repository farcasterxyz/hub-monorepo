import {
  bytesCompare,
  CastId,
  getFarcasterTime,
  HubAsyncResult,
  HubError,
  HubEventType,
  isHubError,
  isReactionAddMessage,
  isReactionRemoveMessage,
  Message,
  MessageType,
  ReactionAddMessage,
  ReactionRemoveMessage,
  ReactionType,
} from '@farcaster/hub-nodejs';
import AsyncLock from 'async-lock';
import { err, ok, ResultAsync } from 'neverthrow';
import {
  deleteMessageTransaction,
  getManyMessages,
  getMessage,
  getMessagesPageByPrefix,
  getMessagesPruneIterator,
  getNextMessageFromIterator,
  getPageIteratorByPrefix,
  makeCastIdKey,
  makeFidKey,
  makeMessagePrimaryKey,
  makeTsHash,
  makeUserKey,
  putMessageTransaction,
} from '~/storage/db/message';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import { RootPrefix, TSHASH_LENGTH, UserPostfix } from '~/storage/db/types';
import StoreEventHandler, { HubEventArgs } from '~/storage/stores/storeEventHandler';
import {
  MERGE_TIMEOUT_DEFAULT,
  MessagesPage,
  PAGE_SIZE_MAX,
  PageOptions,
  StorePruneOptions,
} from '~/storage/stores/types';
import { logger } from '~/utils/logger';

const PRUNE_SIZE_LIMIT_DEFAULT = 5_000;
const PRUNE_TIME_LIMIT_DEFAULT = 60 * 60 * 24 * 90; // 90 days

/**
 * Generates a unique key used to store a ReactionAdd message key in the ReactionsAdd Set index
 *
 * @param fid farcaster id of the user who created the reaction
 * @param type type of reaction created
 * @param targetId id of the object being reacted to
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<targetKey?>:<type?>
 */
const makeReactionAddsKey = (fid: number, type?: ReactionType, targetId?: CastId): Buffer => {
  if (targetId && !type) {
    throw new HubError('bad_request.validation_failure', 'targetId provided without type');
  }

  return Buffer.concat([
    makeUserKey(fid), // --------------------------- fid prefix, 33 bytes
    Buffer.from([UserPostfix.ReactionAdds]), // -------------- reaction_adds key, 1 byte
    Buffer.from(type ? [type] : ''), //-------- type, 1 byte
    targetId ? makeCastIdKey(targetId) : Buffer.from(''), //-- target id, 28 bytes
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
const makeReactionRemovesKey = (fid: number, type?: ReactionType, targetId?: CastId): Buffer => {
  if (targetId && !type) {
    throw new HubError('bad_request.validation_failure', 'targetId provided without type');
  }

  return Buffer.concat([
    makeUserKey(fid), // --------------------------- fid prefix, 33 bytes
    Buffer.from([UserPostfix.ReactionRemoves]), // ----------- reaction_adds key, 1 byte
    Buffer.from(type ? [type] : ''), //-------- type, 1 byte
    targetId ? makeCastIdKey(targetId) : Buffer.from(''), //-- target id, 28 bytes
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
const makeReactionsByTargetKey = (targetId: CastId, fid?: number, tsHash?: Uint8Array): Buffer => {
  if (fid && !tsHash) {
    throw new HubError('bad_request.validation_failure', 'fid provided without tsHash');
  }

  if (tsHash && !fid) {
    throw new HubError('bad_request.validation_failure', 'tsHash provided without fid');
  }

  return Buffer.concat([
    Buffer.from([RootPrefix.ReactionsByTarget]),
    makeCastIdKey(targetId),
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
class ReactionStore {
  private _db: RocksDB;
  private _eventHandler: StoreEventHandler;
  private _pruneSizeLimit: number;
  private _pruneTimeLimit: number;
  private _mergeLock: AsyncLock;

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    this._db = db;
    this._eventHandler = eventHandler;
    this._pruneSizeLimit = options.pruneSizeLimit ?? PRUNE_SIZE_LIMIT_DEFAULT;
    this._pruneTimeLimit = options.pruneTimeLimit ?? PRUNE_TIME_LIMIT_DEFAULT;
    this._mergeLock = new AsyncLock();
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
  async getReactionAdd(fid: number, type: ReactionType, castId: CastId): Promise<ReactionAddMessage> {
    const reactionAddsSetKey = makeReactionAddsKey(fid, type, castId);
    const reactionMessageKey = await this._db.get(reactionAddsSetKey);

    return getMessage(this._db, fid, UserPostfix.ReactionMessage, reactionMessageKey);
  }

  /**
   * Finds a ReactionRemove Message by checking the Remove Set index
   *
   * @param fid fid of the user who created the reaction remove
   * @param type type of reaction that was removed
   * @param castId id of the cast being reacted to
   * @returns the ReactionRemove message if it exists, undefined otherwise
   */
  async getReactionRemove(fid: number, type: ReactionType, castId: CastId): Promise<ReactionRemoveMessage> {
    const reactionRemovesKey = makeReactionRemovesKey(fid, type, castId);
    const reactionMessageKey = await this._db.get(reactionRemovesKey);

    return getMessage(this._db, fid, UserPostfix.ReactionMessage, reactionMessageKey);
  }

  /** Finds all ReactionAdd Messages by iterating through the prefixes */
  async getReactionAddsByFid(
    fid: number,
    type?: ReactionType,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<ReactionAddMessage>> {
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.ReactionMessage);
    const filter = (message: Message): message is ReactionAddMessage => {
      return isReactionAddMessage(message) && (type ? message.data.reactionBody.type === type : true);
    };
    return getMessagesPageByPrefix(this._db, prefix, filter, pageOptions);
  }

  /** Finds all ReactionRemove Messages by iterating through the prefixes */
  async getReactionRemovesByFid(
    fid: number,
    type?: ReactionType,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<ReactionRemoveMessage>> {
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.ReactionMessage);
    const filter = (message: Message): message is ReactionRemoveMessage => {
      return isReactionRemoveMessage(message) && (type ? message.data.reactionBody.type === type : true);
    };
    return getMessagesPageByPrefix(this._db, prefix, filter, pageOptions);
  }

  async getAllReactionMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<ReactionAddMessage | ReactionRemoveMessage>> {
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.ReactionMessage);
    const filter = (message: Message): message is ReactionAddMessage | ReactionRemoveMessage => {
      return isReactionAddMessage(message) || isReactionRemoveMessage(message);
    };
    return getMessagesPageByPrefix(this._db, prefix, filter, pageOptions);
  }

  /** Finds all ReactionAdds that point to a specific target by iterating through the prefixes */
  async getReactionsByTargetCast(
    castId: CastId,
    type?: ReactionType,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<ReactionAddMessage>> {
    const prefix = makeReactionsByTargetKey(castId);

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

    if (!iteratorFinished) {
      await iterator.end(); // clear iterator if it has not finished
      return { messages, nextPageToken: lastPageToken };
    } else {
      return { messages, nextPageToken: undefined };
    }
  }

  /** Merges a ReactionAdd or ReactionRemove message into the ReactionStore */
  async merge(message: Message): Promise<number> {
    if (!isReactionAddMessage(message) && !isReactionRemoveMessage(message)) {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }

    return this._mergeLock
      .acquire(
        message.data.fid.toString(),
        async () => {
          if (isReactionAddMessage(message)) {
            return this.mergeAdd(message);
          } else if (isReactionRemoveMessage(message)) {
            return this.mergeRemove(message);
          } else {
            throw new HubError('bad_request.validation_failure', 'invalid message type');
          }
        },
        { timeout: MERGE_TIMEOUT_DEFAULT }
      )
      .catch((e: any) => {
        throw isHubError(e) ? e : new HubError('unavailable.storage_failure', 'merge timed out');
      });
  }

  async revoke(message: Message): HubAsyncResult<number> {
    let txn = this._db.transaction();
    if (isReactionAddMessage(message)) {
      txn = this.deleteReactionAddTransaction(txn, message);
    } else if (isReactionRemoveMessage(message)) {
      txn = this.deleteReactionRemoveTransaction(txn, message);
    } else {
      return err(new HubError('bad_request.invalid_param', 'invalid message type'));
    }

    return this._eventHandler.commitTransaction(txn, {
      type: HubEventType.REVOKE_MESSAGE,
      revokeMessageBody: { message },
    });
  }

  async pruneMessages(fid: number): HubAsyncResult<number[]> {
    const commits: number[] = [];

    const cachedCount = this._eventHandler.getCacheMessageCount(fid, UserPostfix.ReactionMessage);

    // Require storage cache to be synced to prune
    if (cachedCount.isErr()) {
      return err(cachedCount.error);
    }

    // Return immediately if there are no messages to prune
    if (cachedCount.value === 0) {
      return ok(commits);
    }

    const farcasterTime = getFarcasterTime();
    if (farcasterTime.isErr()) {
      return err(farcasterTime.error);
    }

    // Calculate the timestamp cut-off to prune
    const timestampToPrune = farcasterTime.value - this._pruneTimeLimit;

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = getMessagesPruneIterator(this._db, fid, UserPostfix.ReactionMessage);

    const pruneNextMessage = async (): HubAsyncResult<number | undefined> => {
      const nextMessage = await ResultAsync.fromPromise(getNextMessageFromIterator(pruneIterator), () => undefined);
      if (nextMessage.isErr()) {
        return ok(undefined); // Nothing left to prune
      }

      const count = this._eventHandler.getCacheMessageCount(fid, UserPostfix.ReactionMessage);
      if (count.isErr()) {
        return err(count.error);
      }

      if (
        count.value <= this._pruneSizeLimit &&
        nextMessage.value.data &&
        nextMessage.value.data.timestamp >= timestampToPrune
      ) {
        return ok(undefined);
      }

      let txn = this._db.transaction();

      if (isReactionAddMessage(nextMessage.value)) {
        txn = this.deleteReactionAddTransaction(txn, nextMessage.value);
      } else if (isReactionRemoveMessage(nextMessage.value)) {
        txn = this.deleteReactionRemoveTransaction(txn, nextMessage.value);
      } else {
        return err(new HubError('unknown', 'invalid message type'));
      }

      return this._eventHandler.commitTransaction(txn, {
        type: HubEventType.PRUNE_MESSAGE,
        pruneMessageBody: { message: nextMessage.value },
      });
    };

    let pruneResult = await pruneNextMessage();
    while (!(pruneResult.isOk() && pruneResult.value === undefined)) {
      pruneResult.match(
        (commit) => {
          if (commit) {
            commits.push(commit);
          }
        },
        (e) => {
          logger.error({ errCode: e.errCode }, `error pruning reaction message for fid ${fid}: ${e.message}`);
        }
      );

      pruneResult = await pruneNextMessage();
    }

    await pruneIterator.end();

    return ok(commits);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: ReactionAddMessage): Promise<number> {
    const mergeConflicts = await this.getMergeConflicts(message);
    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add ops to store the message by messageKey and index the the messageKey by set and by target
    txn = this.putReactionAddTransaction(txn, message);

    const hubEvent: HubEventArgs = {
      type: HubEventType.MERGE_MESSAGE,
      mergeMessageBody: { message, deletedMessages: mergeConflicts.value },
    };

    // Commit the RocksDB transaction
    const result = await this._eventHandler.commitTransaction(txn, hubEvent);
    if (result.isErr()) {
      throw result.error;
    }
    return result.value;
  }

  private async mergeRemove(message: ReactionRemoveMessage): Promise<number> {
    const mergeConflicts = await this.getMergeConflicts(message);

    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add ops to store the message by messageKey and index the the messageKey by set
    txn = this.putReactionRemoveTransaction(txn, message);

    const hubEvent: HubEventArgs = {
      type: HubEventType.MERGE_MESSAGE,
      mergeMessageBody: { message, deletedMessages: mergeConflicts.value },
    };

    // Commit the RocksDB transaction
    const result = await this._eventHandler.commitTransaction(txn, hubEvent);
    if (result.isErr()) {
      throw result.error;
    }
    return result.value;
  }

  private reactionMessageCompare(
    aType: MessageType.REACTION_ADD | MessageType.REACTION_REMOVE,
    aTsHash: Uint8Array,
    bType: MessageType.REACTION_ADD | MessageType.REACTION_REMOVE,
    bTsHash: Uint8Array
  ): number {
    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    // Compare message types to enforce that RemoveWins in case of LWW ties.
    if (aType === MessageType.REACTION_REMOVE && bType === MessageType.REACTION_ADD) {
      return 1;
    } else if (aType === MessageType.REACTION_ADD && bType === MessageType.REACTION_REMOVE) {
      return -1;
    }

    // Compare hashes (last 4 bytes of tsHash) to break ties between messages of the same type and timestamp
    return bytesCompare(aTsHash.subarray(4), bTsHash.subarray(4));
  }

  /**
   * Determines the RocksDB keys that must be modified to settle merge conflicts as a result of
   * adding a Reaction to the Store.
   *
   * @returns a RocksDB transaction if keys must be added or removed, undefined otherwise
   */
  private async getMergeConflicts(
    message: ReactionAddMessage | ReactionRemoveMessage
  ): HubAsyncResult<(ReactionAddMessage | ReactionRemoveMessage)[]> {
    const castId = message.data.reactionBody.targetCastId;
    if (!castId) {
      throw new HubError('bad_request.validation_failure', 'targetCastId is missing');
    }

    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const conflicts: (ReactionAddMessage | ReactionRemoveMessage)[] = [];

    // Checks if there is a remove timestamp hash for this reaction
    const reactionRemoveKey = makeReactionRemovesKey(message.data.fid, message.data.reactionBody.type, castId);
    const reactionRemoveTsHash = await ResultAsync.fromPromise(this._db.get(reactionRemoveKey), () => undefined);

    if (reactionRemoveTsHash.isOk()) {
      const removeCompare = this.reactionMessageCompare(
        MessageType.REACTION_REMOVE,
        new Uint8Array(reactionRemoveTsHash.value),
        message.data.type,
        tsHash.value
      );
      if (removeCompare > 0) {
        return err(new HubError('bad_request.conflict', 'message conflicts with a more recent ReactionRemove'));
      } else if (removeCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing remove has a lower order than the new message, retrieve the full
        // ReactionRemove message and delete it as part of the RocksDB transaction
        const existingRemove = await getMessage<ReactionRemoveMessage>(
          this._db,
          message.data.fid,
          UserPostfix.ReactionMessage,
          reactionRemoveTsHash.value
        );
        conflicts.push(existingRemove);
      }
    }

    // Checks if there is an add timestamp hash for this reaction
    const reactionAddKey = makeReactionAddsKey(message.data.fid, message.data.reactionBody.type, castId);
    const reactionAddTsHash = await ResultAsync.fromPromise(this._db.get(reactionAddKey), () => undefined);

    if (reactionAddTsHash.isOk()) {
      const addCompare = this.reactionMessageCompare(
        MessageType.REACTION_ADD,
        new Uint8Array(reactionAddTsHash.value),
        message.data.type,
        tsHash.value
      );
      if (addCompare > 0) {
        return err(new HubError('bad_request.conflict', 'message conflicts with a more recent ReactionAdd'));
      } else if (addCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // ReactionAdd message and delete it as part of the RocksDB transaction
        const existingAdd = await getMessage<ReactionAddMessage>(
          this._db,
          message.data.fid,
          UserPostfix.ReactionMessage,
          reactionAddTsHash.value
        );
        conflicts.push(existingAdd);
      }
    }

    return ok(conflicts);
  }

  private deleteManyTransaction(
    txn: Transaction,
    messages: (ReactionAddMessage | ReactionRemoveMessage)[]
  ): Transaction {
    for (const message of messages) {
      if (isReactionAddMessage(message)) {
        txn = this.deleteReactionAddTransaction(txn, message);
      } else if (isReactionRemoveMessage(message)) {
        txn = this.deleteReactionRemoveTransaction(txn, message);
      }
    }
    return txn;
  }

  /* Builds a RocksDB transaction to insert a ReactionAdd message and construct its indices */
  private putReactionAddTransaction(txn: Transaction, message: ReactionAddMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const castId = message.data.reactionBody.targetCastId;
    if (!castId) {
      throw new HubError('bad_request.validation_failure', 'targetCastId is missing');
    }

    // Puts the message into the database
    txn = putMessageTransaction(txn, message);

    // Puts the message into the ReactionAdds Set index
    const addsKey = makeReactionAddsKey(
      message.data.fid,
      message.data.reactionBody.type,
      message.data.reactionBody.targetCastId
    );
    txn = txn.put(addsKey, Buffer.from(tsHash.value));

    // Puts message key into the byTarget index
    const byTargetKey = makeReactionsByTargetKey(castId, message.data.fid, tsHash.value);
    txn = txn.put(byTargetKey, Buffer.from([message.data.reactionBody.type]));

    return txn;
  }

  /* Builds a RocksDB transaction to remove a ReactionAdd message and delete its indices */
  private deleteReactionAddTransaction(txn: Transaction, message: ReactionAddMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const castId = message.data.reactionBody.targetCastId;
    if (!castId) {
      throw new HubError('bad_request.validation_failure', 'targetCastId is missing');
    }

    // Delete the message key from byTarget index
    const byTargetKey = makeReactionsByTargetKey(castId, message.data.fid, tsHash.value);
    txn = txn.del(byTargetKey);

    // Delete the message key from ReactionAdds Set index
    const addsKey = makeReactionAddsKey(message.data.fid, message.data.reactionBody.type, castId);
    txn = txn.del(addsKey);

    // Delete the message
    return deleteMessageTransaction(txn, message);
  }

  /* Builds a RocksDB transaction to insert a ReactionRemove message and construct its indices */
  private putReactionRemoveTransaction(txn: Transaction, message: ReactionRemoveMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const castId = message.data.reactionBody.targetCastId;
    if (!castId) {
      throw new HubError('bad_request.validation_failure', 'targetCastId is missing');
    }

    // Puts the message
    txn = putMessageTransaction(txn, message);

    // Puts message key into the ReactionRemoves Set index
    const removesKey = makeReactionRemovesKey(message.data.fid, message.data.reactionBody.type, castId);
    txn = txn.put(removesKey, Buffer.from(tsHash.value));

    return txn;
  }

  /* Builds a RocksDB transaction to remove a ReactionRemove message and delete its indices */
  private deleteReactionRemoveTransaction(txn: Transaction, message: ReactionRemoveMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const castId = message.data.reactionBody.targetCastId;
    if (!castId) {
      throw new HubError('bad_request.validation_failure', 'targetCastId is missing');
    }

    // Delete message key from ReactionRemoves Set index
    const removesKey = makeReactionRemovesKey(message.data.fid, message.data.reactionBody.type, castId);
    txn = txn.del(removesKey);

    // Delete the message
    return deleteMessageTransaction(txn, message);
  }
}

export default ReactionStore;
