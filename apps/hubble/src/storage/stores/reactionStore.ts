import * as protobufs from '@farcaster/protobufs';
import { bytesCompare, bytesIncrement, getFarcasterTime, HubAsyncResult, HubError, isHubError } from '@farcaster/utils';
import AsyncLock from 'async-lock';
import { err, ok, ResultAsync } from 'neverthrow';
import AbstractRocksDB from 'rocksdb';
import {
  deleteMessageTransaction,
  getAllMessagesBySigner,
  getManyMessages,
  getMessage,
  getMessagesPageByPrefix,
  getMessagesPruneIterator,
  getNextMessageToPrune,
  makeCastIdKey,
  makeFidKey,
  makeMessagePrimaryKey,
  makeTsHash,
  makeUserKey,
  putMessageTransaction,
} from '~/storage/db/message';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import { FID_BYTES, RootPrefix, TRUE_VALUE, UserPostfix } from '~/storage/db/types';
import StoreEventHandler, { putEventTransaction } from '~/storage/stores/storeEventHandler';
import {
  MERGE_TIMEOUT_DEFAULT,
  MessagesPage,
  PAGE_SIZE_MAX,
  PageOptions,
  StorePruneOptions,
} from '~/storage/stores/types';

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
const makeReactionAddsKey = (fid: number, type?: protobufs.ReactionType, targetId?: protobufs.CastId): Buffer => {
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
const makeReactionRemovesKey = (fid: number, type?: protobufs.ReactionType, targetId?: protobufs.CastId): Buffer => {
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
 * @param type the type of reaction
 * @param fid the fid of the user who created the reaction
 * @param tsHash the timestamp hash of the reaction message
 *
 * @returns RocksDB index key of the form <RootPrefix>:<target_key>:<type?>:<fid?>:<tsHash?>
 */
const makeReactionsByTargetKey = (
  targetId: protobufs.CastId,
  type?: protobufs.ReactionType,
  fid?: number,
  tsHash?: Uint8Array
): Buffer => {
  if (fid && !type) {
    throw new HubError('bad_request.validation_failure', 'fid provided without type');
  }

  if (tsHash && (!type || !fid)) {
    throw new HubError('bad_request.validation_failure', 'tsHash provided without type or fid');
  }

  return Buffer.concat([
    Buffer.from([RootPrefix.ReactionsByTarget]),
    makeCastIdKey(targetId),
    Buffer.from(type ? [type] : ''),
    fid ? makeFidKey(fid) : Buffer.from(''),
    Buffer.from(tsHash ?? ''),
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
  async getReactionAdd(
    fid: number,
    type: protobufs.ReactionType,
    castId: protobufs.CastId
  ): Promise<protobufs.ReactionAddMessage> {
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
  async getReactionRemove(
    fid: number,
    type: protobufs.ReactionType,
    castId: protobufs.CastId
  ): Promise<protobufs.ReactionRemoveMessage> {
    const reactionRemovesKey = makeReactionRemovesKey(fid, type, castId);
    const reactionMessageKey = await this._db.get(reactionRemovesKey);

    return getMessage(this._db, fid, UserPostfix.ReactionMessage, reactionMessageKey);
  }

  /** Finds all ReactionAdd Messages by iterating through the prefixes */
  async getReactionAddsByFid(
    fid: number,
    type?: protobufs.ReactionType,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<protobufs.ReactionAddMessage>> {
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.ReactionMessage);
    const filter = (message: protobufs.Message): message is protobufs.ReactionAddMessage => {
      return protobufs.isReactionAddMessage(message) && (type ? message.data.reactionBody.type === type : true);
    };
    return getMessagesPageByPrefix(this._db, prefix, filter, pageOptions);
  }

  /** Finds all ReactionRemove Messages by iterating through the prefixes */
  async getReactionRemovesByFid(
    fid: number,
    type?: protobufs.ReactionType,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<protobufs.ReactionRemoveMessage>> {
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.ReactionMessage);
    const filter = (message: protobufs.Message): message is protobufs.ReactionRemoveMessage => {
      return protobufs.isReactionRemoveMessage(message) && (type ? message.data.reactionBody.type === type : true);
    };
    return getMessagesPageByPrefix(this._db, prefix, filter, pageOptions);
  }

  async getAllReactionMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<protobufs.ReactionAddMessage | protobufs.ReactionRemoveMessage>> {
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.ReactionMessage);
    const filter = (
      message: protobufs.Message
    ): message is protobufs.ReactionAddMessage | protobufs.ReactionRemoveMessage => {
      return protobufs.isReactionAddMessage(message) || protobufs.isReactionRemoveMessage(message);
    };
    return getMessagesPageByPrefix(this._db, prefix, filter, pageOptions);
  }

  /** Finds all ReactionAdds that point to a specific target by iterating through the prefixes */
  // TODO: DRY up this method
  async getReactionsByTargetCast(
    castId: protobufs.CastId,
    type?: protobufs.ReactionType,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<protobufs.ReactionAddMessage>> {
    const prefix = makeReactionsByTargetKey(castId, type);

    const startKey = Buffer.concat([prefix, Buffer.from(pageOptions.pageToken ?? '')]);

    if (pageOptions.pageSize && pageOptions.pageSize > PAGE_SIZE_MAX) {
      throw new HubError('bad_request.invalid_param', `pageSize > ${PAGE_SIZE_MAX}`);
    }
    const limit = pageOptions.pageSize || PAGE_SIZE_MAX;

    const endKey = bytesIncrement(Uint8Array.from(prefix));
    if (endKey.isErr()) {
      throw endKey.error;
    }

    const messageKeys: Buffer[] = [];
    const iterator = this._db.iterator({
      gt: startKey,
      lt: Buffer.from(endKey.value),
      keyAsBuffer: true,
      values: false,
    });

    // Custom method to retrieve message key from key
    const getNextIteratorRecord = (iterator: AbstractRocksDB.Iterator): Promise<[Buffer, Buffer]> => {
      return new Promise((resolve, reject) => {
        iterator.next((err: Error | undefined, key: AbstractRocksDB.Bytes, value: AbstractRocksDB.Bytes) => {
          if (err || !value) {
            reject(err);
          } else {
            // Calculates the positions in the key where the fid and tsHash begin
            const fidOffset = prefix.length + (type ? 0 : 1); // compensate for fact that prefix is 1 byte longer if type was provided
            const tsHashOffset = fidOffset + FID_BYTES;

            const fid = Number((key as Buffer).readUint32BE(fidOffset));
            const tsHash = Uint8Array.from(key as Buffer).subarray(tsHashOffset);
            const messagePrimaryKey = makeMessagePrimaryKey(fid, UserPostfix.ReactionMessage, tsHash);

            resolve([key as Buffer, messagePrimaryKey]);
          }
        });
      });
    };

    let iteratorFinished = false;
    let lastPageToken: Uint8Array | undefined;
    do {
      const result = await ResultAsync.fromPromise(getNextIteratorRecord(iterator), (e) => e as HubError);
      if (result.isErr()) {
        iteratorFinished = true;
        break;
      }

      const [key, messageKey] = result.value;
      lastPageToken = Uint8Array.from(key.subarray(prefix.length));
      messageKeys.push(messageKey);
    } while (messageKeys.length < limit);

    const messages = await getManyMessages<protobufs.ReactionAddMessage>(this._db, messageKeys);

    if (!iteratorFinished) {
      return { messages, nextPageToken: lastPageToken };
    } else {
      return { messages, nextPageToken: undefined };
    }
  }

  /** Merges a ReactionAdd or ReactionRemove message into the ReactionStore */
  async merge(message: protobufs.Message): Promise<number> {
    if (!protobufs.isReactionAddMessage(message) && !protobufs.isReactionRemoveMessage(message)) {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }

    return this._mergeLock
      .acquire(
        message.data.fid.toString(),
        async () => {
          if (protobufs.isReactionAddMessage(message)) {
            return this.mergeAdd(message);
          } else if (protobufs.isReactionRemoveMessage(message)) {
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

  async revokeMessagesBySigner(fid: number, signer: Uint8Array): HubAsyncResult<number[]> {
    // Get all ReactionAdd messages signed by signer
    const reactionAdds = await getAllMessagesBySigner<protobufs.ReactionAddMessage>(
      this._db,
      fid,
      signer,
      protobufs.MessageType.REACTION_ADD
    );

    // Get all ReactionRemove messages signed by signer
    const reactionRemoves = await getAllMessagesBySigner<protobufs.ReactionRemoveMessage>(
      this._db,
      fid,
      signer,
      protobufs.MessageType.REACTION_REMOVE
    );

    // Create a rocksdb transaction
    let txn = this._db.transaction();

    // Create list of events to broadcast
    const events: protobufs.RevokeMessageHubEvent[] = [];

    // Add a delete operation to the transaction for each ReactionAdd
    for (const message of reactionAdds) {
      txn = this.deleteReactionAddTransaction(txn, message);

      const event = this._eventHandler.makeRevokeMessage(message);
      if (event.isErr()) {
        throw event.error;
      }

      events.push(event.value);
      txn = putEventTransaction(txn, event.value);
    }

    // Add a delete operation to the transaction for each SignerRemove
    for (const message of reactionRemoves) {
      txn = this.deleteReactionRemoveTransaction(txn, message);

      const event = this._eventHandler.makeRevokeMessage(message);
      if (event.isErr()) {
        throw event.error;
      }

      events.push(event.value);
      txn = putEventTransaction(txn, event.value);
    }

    await this._db.commit(txn);

    // Emit a revokeMessage event for each message
    this._eventHandler.broadcastEvents(events);

    return ok(events.map((event) => event.id));
  }

  async pruneMessages(fid: number): HubAsyncResult<number[]> {
    // Count number of ReactionAdd and ReactionRemove messages for this fid
    // TODO: persist this count to avoid having to retrieve it with each call
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.ReactionMessage);
    let count = 0;
    for await (const [,] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      count = count + 1;
    }

    // Calculate the number of messages that need to be pruned, based on the store's size limit
    let sizeToPrune = count - this._pruneSizeLimit;

    const farcasterTime = getFarcasterTime();
    if (farcasterTime.isErr()) {
      return err(farcasterTime.error);
    }

    // Calculate the timestamp cut-off to prune
    const timestampToPrune = farcasterTime.value - this._pruneTimeLimit;

    // Keep track of the messages that get pruned so that we can emit pruneMessage events after the transaction settles
    const events: protobufs.PruneMessageHubEvent[] = [];

    // Create a rocksdb transaction to include all the mutations
    let pruneTxn = this._db.transaction();

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = getMessagesPruneIterator(this._db, fid, UserPostfix.ReactionMessage);

    const getNextResult = () => ResultAsync.fromPromise(getNextMessageToPrune(pruneIterator), () => undefined);

    // For each message in order, prune it if the store is over the size limit or the message was signed
    // before the timestamp cut-off
    let nextMessage = await getNextResult();
    while (
      nextMessage.isOk() &&
      (sizeToPrune > 0 || (nextMessage.value.data && nextMessage.value.data.timestamp < timestampToPrune))
    ) {
      const message = nextMessage.value;

      // Add a delete operation to the transaction depending on the message type
      if (protobufs.isReactionAddMessage(message)) {
        pruneTxn = this.deleteReactionAddTransaction(pruneTxn, message);
      } else if (protobufs.isReactionRemoveMessage(message)) {
        pruneTxn = this.deleteReactionRemoveTransaction(pruneTxn, message);
      } else {
        throw new HubError('unknown', 'invalid message type');
      }

      // Create prune event and store for broadcasting later
      const pruneEvent = this._eventHandler.makePruneMessage(message);
      if (pruneEvent.isErr()) {
        return err(pruneEvent.error);
      }
      pruneTxn = putEventTransaction(pruneTxn, pruneEvent.value);
      events.push(pruneEvent.value);

      // Decrement the number of messages yet to prune, and try to get the next message from the iterator
      sizeToPrune = Math.max(0, sizeToPrune - 1);
      nextMessage = await getNextResult();
    }

    if (events.length > 0) {
      // Commit the transaction to rocksdb
      await this._db.commit(pruneTxn);

      // Emit prune events
      this._eventHandler.broadcastEvents(events);
    }

    return ok(events.map((event) => event.id));
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: protobufs.ReactionAddMessage): Promise<number> {
    const mergeConflicts = await this.getMergeConflicts(message);
    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add ops to store the message by messageKey and index the the messageKey by set and by target
    txn = this.putReactionAddTransaction(txn, message);

    const hubEvent = this._eventHandler.makeMergeMessage(message, mergeConflicts.value);
    if (hubEvent.isErr()) {
      throw hubEvent.error;
    }
    txn = putEventTransaction(txn, hubEvent.value);

    // Commit the RocksDB transaction
    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.broadcastEvent(hubEvent.value);

    return hubEvent.value.id;
  }

  private async mergeRemove(message: protobufs.ReactionRemoveMessage): Promise<number> {
    const mergeConflicts = await this.getMergeConflicts(message);

    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add ops to store the message by messageKey and index the the messageKey by set
    txn = this.putReactionRemoveTransaction(txn, message);

    const hubEvent = this._eventHandler.makeMergeMessage(message, mergeConflicts.value);
    if (hubEvent.isErr()) {
      throw hubEvent.error;
    }
    txn = putEventTransaction(txn, hubEvent.value);

    // Commit the RocksDB transaction
    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.broadcastEvent(hubEvent.value);

    return hubEvent.value.id;
  }

  private reactionMessageCompare(
    aType: protobufs.MessageType.REACTION_ADD | protobufs.MessageType.REACTION_REMOVE,
    aTsHash: Uint8Array,
    bType: protobufs.MessageType.REACTION_ADD | protobufs.MessageType.REACTION_REMOVE,
    bTsHash: Uint8Array
  ): number {
    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    // Compare message types to enforce that RemoveWins in case of LWW ties.
    if (aType === protobufs.MessageType.REACTION_REMOVE && bType === protobufs.MessageType.REACTION_ADD) {
      return 1;
    } else if (aType === protobufs.MessageType.REACTION_ADD && bType === protobufs.MessageType.REACTION_REMOVE) {
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
    message: protobufs.ReactionAddMessage | protobufs.ReactionRemoveMessage
  ): HubAsyncResult<(protobufs.ReactionAddMessage | protobufs.ReactionRemoveMessage)[]> {
    const castId = message.data.reactionBody.targetCastId;
    if (!castId) {
      throw new HubError('bad_request.validation_failure', 'targetCastId is missing');
    }

    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const conflicts: (protobufs.ReactionAddMessage | protobufs.ReactionRemoveMessage)[] = [];

    // Checks if there is a remove timestamp hash for this reaction
    const reactionRemoveKey = makeReactionRemovesKey(message.data.fid, message.data.reactionBody.type, castId);
    const reactionRemoveTsHash = await ResultAsync.fromPromise(this._db.get(reactionRemoveKey), () => undefined);

    if (reactionRemoveTsHash.isOk()) {
      const removeCompare = this.reactionMessageCompare(
        protobufs.MessageType.REACTION_REMOVE,
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
        const existingRemove = await getMessage<protobufs.ReactionRemoveMessage>(
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
        protobufs.MessageType.REACTION_ADD,
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
        const existingAdd = await getMessage<protobufs.ReactionAddMessage>(
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
    messages: (protobufs.ReactionAddMessage | protobufs.ReactionRemoveMessage)[]
  ): Transaction {
    for (const message of messages) {
      if (protobufs.isReactionAddMessage(message)) {
        txn = this.deleteReactionAddTransaction(txn, message);
      } else if (protobufs.isReactionRemoveMessage(message)) {
        txn = this.deleteReactionRemoveTransaction(txn, message);
      }
    }
    return txn;
  }

  /* Builds a RocksDB transaction to insert a ReactionAdd message and construct its indices */
  private putReactionAddTransaction(txn: Transaction, message: protobufs.ReactionAddMessage): Transaction {
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
    const byTargetKey = makeReactionsByTargetKey(
      castId,
      message.data.reactionBody.type,
      message.data.fid,
      tsHash.value
    );
    txn = txn.put(byTargetKey, TRUE_VALUE);

    return txn;
  }

  /* Builds a RocksDB transaction to remove a ReactionAdd message and delete its indices */
  private deleteReactionAddTransaction(txn: Transaction, message: protobufs.ReactionAddMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const castId = message.data.reactionBody.targetCastId;
    if (!castId) {
      throw new HubError('bad_request.validation_failure', 'targetCastId is missing');
    }

    // Delete the message key from byTarget index
    const byTargetKey = makeReactionsByTargetKey(
      castId,
      message.data.reactionBody.type,
      message.data.fid,
      tsHash.value
    );
    txn = txn.del(byTargetKey);

    // Delete the message key from ReactionAdds Set index
    const addsKey = makeReactionAddsKey(message.data.fid, message.data.reactionBody.type, castId);
    txn = txn.del(addsKey);

    // Delete the message
    return deleteMessageTransaction(txn, message);
  }

  /* Builds a RocksDB transaction to insert a ReactionRemove message and construct its indices */
  private putReactionRemoveTransaction(txn: Transaction, message: protobufs.ReactionRemoveMessage): Transaction {
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
  private deleteReactionRemoveTransaction(txn: Transaction, message: protobufs.ReactionRemoveMessage): Transaction {
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
