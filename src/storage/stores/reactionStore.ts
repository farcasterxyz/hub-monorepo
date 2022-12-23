import { ok, ResultAsync } from 'neverthrow';
import { CastId, MessageType, ReactionType } from '~/flatbuffers/generated/message_generated';
import MessageModel, { FID_BYTES, TARGET_KEY_BYTES, TRUE_VALUE } from '~/flatbuffers/models/messageModel';
import { isReactionAdd, isReactionRemove } from '~/flatbuffers/models/typeguards';
import * as types from '~/flatbuffers/models/types';
import { bytesCompare } from '~/flatbuffers/utils/bytes';
import { getFarcasterTime } from '~/flatbuffers/utils/time';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { HubAsyncResult, HubError } from '~/utils/hubErrors';

const PRUNE_SIZE_LIMIT_DEFAULT = 5_000;
const PRUNE_TIME_LIMIT_DEFAULT = 60 * 60 * 24 * 90; // 90 days

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

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: types.StorePruneOptions = {}) {
    this._db = db;
    this._eventHandler = eventHandler;
    this._pruneSizeLimit = options.pruneSizeLimit ?? PRUNE_SIZE_LIMIT_DEFAULT;
    this._pruneTimeLimit = options.pruneTimeLimit ?? PRUNE_TIME_LIMIT_DEFAULT;
  }

  /**
   * Generates a unique key used to store a ReactionAdd message key in the ReactionsAdd Set index
   *
   * @param fid farcaster id of the user who created the reaction
   * @param type type of reaction created
   * @param targetKey id of the object being reacted to
   *
   * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<targetKey?>:<type?>
   */
  static reactionAddsKey(fid: Uint8Array, type?: ReactionType, targetKey?: Uint8Array): Buffer {
    if (targetKey && !type) {
      throw new HubError('bad_request.validation_failure', 'targetKey provided without type');
    }

    return Buffer.concat([
      MessageModel.userKey(fid), // --------------------------- fid prefix, 33 bytes
      Buffer.from([types.UserPostfix.ReactionAdds]), // -------------- reaction_adds key, 1 byte
      type ? Buffer.from([type]) : new Uint8Array(), //-------- type, 1 byte
      targetKey ? Buffer.from(targetKey) : new Uint8Array(), //-- target id, variable bytes
    ]);
  }

  /**
   * Generates a unique key used to store a ReactionRemove message key in the ReactionsRemove Set index
   *
   * @param fid farcaster id of the user who created the reaction
   * @param type type of reaction created
   * @param targetKey id of the object being reacted to
   *
   * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<targetKey?>:<type?>
   */
  static reactionRemovesKey(fid: Uint8Array, type?: ReactionType, targetKey?: Uint8Array): Buffer {
    if (targetKey && !type) {
      throw new HubError('bad_request.validation_failure', 'targetKey provided without type');
    }

    return Buffer.concat([
      MessageModel.userKey(fid), // --------------------------- fid prefix, 33 bytes
      Buffer.from([types.UserPostfix.ReactionRemoves]), // ----------- reaction_adds key, 1 byte
      type ? Buffer.from([type]) : new Uint8Array(), //-------- type, 1 byte
      targetKey ? Buffer.from(targetKey) : new Uint8Array(), //-- target id, variable bytes
    ]);
  }

  /**
   * Generates a unique key used to store a ReactionAdd Message in the ReactionsByTargetAndType index
   *
   * @param targetKey the id of the object being reacted to (currently just cast id)
   * @param type the type of reaction
   * @param fid the fid of the user who created the reaction
   * @param tsHash the timestamp hash of the reaction message
   *
   * @returns RocksDB index key of the form <RootPrefix>:<target_key>:<type?>:<fid?>:<tsHash?>
   */
  static reactionsByTargetKey(
    targetKey: Uint8Array,
    type?: ReactionType,
    fid?: Uint8Array,
    tsHash?: Uint8Array
  ): Buffer {
    if (fid && !type) {
      throw new HubError('bad_request.validation_failure', 'fid provided without type');
    }

    if (tsHash && (!type || !fid)) {
      throw new HubError('bad_request.validation_failure', 'tsHash provided without type or fid');
    }

    const bytes = new Uint8Array(
      1 + TARGET_KEY_BYTES + (type ? 1 : 0) + (fid ? FID_BYTES : 0) + (tsHash ? tsHash.length : 0)
    );

    bytes.set([types.RootPrefix.ReactionsByTarget], 0);
    bytes.set(targetKey, 1 + TARGET_KEY_BYTES - targetKey.length); // pad if targetKey.length < targetKey.max_length
    if (type) {
      bytes.set(Buffer.from([type]), 1 + TARGET_KEY_BYTES);
    }
    if (fid) {
      bytes.set(fid, 1 + TARGET_KEY_BYTES + 1 + FID_BYTES - fid.length); // pad if fid.length < fid.max_length
    }
    if (tsHash) {
      bytes.set(tsHash, 1 + TARGET_KEY_BYTES + 1 + FID_BYTES);
    }

    return Buffer.from(bytes);
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
  async getReactionAdd(fid: Uint8Array, type: ReactionType, castId: CastId): Promise<types.ReactionAddModel> {
    const reactionAddsSetKey = ReactionStore.reactionAddsKey(fid, type, this.targetKeyForCastId(castId));
    const reactionMessageKey = await this._db.get(reactionAddsSetKey);

    return MessageModel.get<types.ReactionAddModel>(
      this._db,
      fid,
      types.UserPostfix.ReactionMessage,
      reactionMessageKey
    );
  }

  /**
   * Finds a ReactionRemove Message by checking the Remove Set index
   *
   * @param fid fid of the user who created the reaction remove
   * @param type type of reaction that was removed
   * @param castId id of the cast being reacted to
   * @returns the ReactionRemove message if it exists, undefined otherwise
   */
  async getReactionRemove(fid: Uint8Array, type: ReactionType, castId: CastId): Promise<types.ReactionRemoveModel> {
    const reactionRemovesKey = ReactionStore.reactionRemovesKey(fid, type, this.targetKeyForCastId(castId));
    const reactionMessageKey = await this._db.get(reactionRemovesKey);

    return MessageModel.get<types.ReactionRemoveModel>(
      this._db,
      fid,
      types.UserPostfix.ReactionMessage,
      reactionMessageKey
    );
  }

  /** Finds all ReactionAdd Messages by iterating through the prefixes */
  async getReactionAddsByUser(fid: Uint8Array, type?: ReactionType): Promise<types.ReactionAddModel[]> {
    const prefix = ReactionStore.reactionAddsKey(fid, type);
    const msgKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(prefix, { keys: false, valueAsBuffer: true })) {
      msgKeys.push(value);
    }
    return MessageModel.getManyByUser<types.ReactionAddModel>(
      this._db,
      fid,
      types.UserPostfix.ReactionMessage,
      msgKeys
    );
  }

  /** Finds all ReactionRemove Messages by iterating through the prefixes */
  async getReactionRemovesByUser(fid: Uint8Array): Promise<types.ReactionRemoveModel[]> {
    const prefix = ReactionStore.reactionRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(prefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<types.ReactionRemoveModel>(
      this._db,
      fid,
      types.UserPostfix.ReactionMessage,
      messageKeys
    );
  }

  /** Finds all ReactionAdds that point to a specific target by iterating through the prefixes */
  async getReactionsByTargetCast(castId: CastId, type?: ReactionType): Promise<types.ReactionAddModel[]> {
    const prefix = ReactionStore.reactionsByTargetKey(this.targetKeyForCastId(castId), type);

    // Calculates the positions in the key where the fid and tsHash begin
    const fidOffset = type ? prefix.length : prefix.length + 1; // prefix is 1 byte longer if type was provided
    const tsHashOffset = fidOffset + FID_BYTES;

    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      const fid = Uint8Array.from(key).subarray(fidOffset, tsHashOffset);
      const tsHash = Uint8Array.from(key).subarray(tsHashOffset);
      messageKeys.push(MessageModel.primaryKey(fid, types.UserPostfix.ReactionMessage, tsHash));
    }
    return MessageModel.getMany(this._db, messageKeys);
  }

  /** Merges a ReactionAdd or ReactionRemove message into the ReactionStore */
  async merge(message: MessageModel): Promise<void> {
    if (isReactionAdd(message)) {
      return this.mergeAdd(message);
    }

    if (isReactionRemove(message)) {
      return this.mergeRemove(message);
    }

    throw new HubError('bad_request.validation_failure', 'invalid message type');
  }

  async revokeMessagesBySigner(fid: Uint8Array, signer: Uint8Array): HubAsyncResult<void> {
    // Get all ReactionAdd messages signed by signer
    const reactionAdds = await MessageModel.getAllBySigner<types.ReactionAddModel>(
      this._db,
      fid,
      signer,
      MessageType.ReactionAdd
    );

    // Get all ReactionRemove messages signed by signer
    const reactionRemoves = await MessageModel.getAllBySigner<types.ReactionRemoveModel>(
      this._db,
      fid,
      signer,
      MessageType.ReactionRemove
    );

    // Create a rocksdb transaction
    let txn = this._db.transaction();

    // Add a delete operation to the transaction for each ReactionAdd
    for (const message of reactionAdds) {
      txn = this.deleteReactionAddTransaction(txn, message);
    }

    // Add a delete operation to the transaction for each SignerRemove
    for (const message of reactionRemoves) {
      txn = this.deleteReactionRemoveTransaction(txn, message);
    }

    await this._db.commit(txn);

    // Emit a revokeMessage event for each message
    for (const message of [...reactionAdds, ...reactionRemoves]) {
      this._eventHandler.emit('revokeMessage', message);
    }

    return ok(undefined);
  }

  async pruneMessages(fid: Uint8Array): HubAsyncResult<void> {
    // Count number of ReactionAdd and ReactionRemove messages for this fid
    // TODO: persist this count to avoid having to retrieve it with each call
    const prefix = MessageModel.primaryKey(fid, types.UserPostfix.ReactionMessage);
    let count = 0;
    for await (const [,] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      count = count + 1;
    }

    // Calculate the number of messages that need to be pruned, based on the store's size limit
    let sizeToPrune = count - this._pruneSizeLimit;

    // Calculate the timestamp cut-off to prune
    const timestampToPrune = getFarcasterTime() - this._pruneTimeLimit;

    // Keep track of the messages that get pruned so that we can emit pruneMessage events after the transaction settles
    const messageToPrune: (types.ReactionAddModel | types.ReactionRemoveModel)[] = [];

    // Create a rocksdb transaction to include all the mutations
    let pruneTsx = this._db.transaction();

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = MessageModel.getPruneIterator(this._db, fid, types.UserPostfix.ReactionMessage);

    const getNextResult = () => ResultAsync.fromPromise(MessageModel.getNextToPrune(pruneIterator), () => undefined);

    // For each message in order, prune it if the store is over the size limit or the message was signed
    // before the timestamp cut-off
    let nextMessage = await getNextResult();
    while (nextMessage.isOk() && (sizeToPrune > 0 || nextMessage.value.timestamp() < timestampToPrune)) {
      const message = nextMessage.value;

      // Add a delete operation to the transaction depending on the message type
      if (isReactionAdd(message)) {
        pruneTsx = this.deleteReactionAddTransaction(pruneTsx, message);
      } else if (isReactionRemove(message)) {
        pruneTsx = this.deleteReactionRemoveTransaction(pruneTsx, message);
      } else {
        throw new HubError('unknown', 'invalid message type');
      }

      // Store the message in order to emit the pruneMessage event later, decrement the number of messages
      // yet to prune, and try to get the next message from the iterator
      messageToPrune.push(message);
      sizeToPrune = Math.max(0, sizeToPrune - 1);
      nextMessage = await getNextResult();
    }

    if (messageToPrune.length > 0) {
      // Commit the transaction to rocksdb
      await this._db.commit(pruneTsx);

      // For each of the pruned messages, emit a pruneMessage event
      for (const message of messageToPrune) {
        this._eventHandler.emit('pruneMessage', message);
      }
    }

    return ok(undefined);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: types.ReactionAddModel): Promise<void> {
    const castId = message.body().cast();

    if (!castId) {
      throw new HubError('bad_request.validation_failure', 'castId was missing');
    } else {
      const targetKey = this.targetKeyForCastId(castId);
      let txn = await this.resolveMergeConflicts(this._db.transaction(), targetKey, message);

      if (!txn) return undefined; // Assume no-op if txn was not returned

      // Add ops to store the message by messageKey and index the the messageKey by set and by target
      txn = this.putReactionAddTransaction(txn, message);

      await this._db.commit(txn);

      // Emit store event
      this._eventHandler.emit('mergeMessage', message);
    }
  }

  private async mergeRemove(message: types.ReactionRemoveModel): Promise<void> {
    const castId = message.body().cast();

    if (!castId) {
      throw new HubError('bad_request.validation_failure', 'castId was missing');
    } else {
      const targetKey = this.targetKeyForCastId(castId);
      let txn = await this.resolveMergeConflicts(this._db.transaction(), targetKey, message);

      if (!txn) return undefined; // Assume no-op if txn was not returned

      // Add ops to store the message by messageKey and index the the messageKey by set
      txn = this.putReactionRemoveTransaction(txn, message);

      await this._db.commit(txn);

      // Emit store event
      this._eventHandler.emit('mergeMessage', message);
    }
  }

  private reactionMessageCompare(
    aType: MessageType,
    aTsHash: Uint8Array,
    bType: MessageType,
    bTsHash: Uint8Array
  ): number {
    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    // Compare message types to enforce that RemoveWins in case of LWW ties.
    if (aType === MessageType.ReactionRemove && bType === MessageType.ReactionAdd) {
      return 1;
    } else if (aType === MessageType.ReactionAdd && bType === MessageType.ReactionRemove) {
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
  private async resolveMergeConflicts(
    txn: Transaction,
    targetKey: Uint8Array,
    message: types.ReactionAddModel | types.ReactionRemoveModel
  ): Promise<Transaction | undefined> {
    // Checks if there is a remove timestamp hash for this reaction
    const reactionRemoveTsHash = await ResultAsync.fromPromise(
      this._db.get(ReactionStore.reactionRemovesKey(message.fid(), message.body().type(), targetKey)),
      () => undefined
    );

    if (reactionRemoveTsHash.isOk()) {
      if (
        this.reactionMessageCompare(
          MessageType.ReactionRemove,
          reactionRemoveTsHash.value,
          message.type(),
          message.tsHash()
        ) >= 0
      ) {
        // If the existing remove has the same or higher order than the new message, no-op
        return undefined;
      } else {
        // If the existing remove has a lower order than the new message, retrieve the full
        // ReactionRemove message and delete it as part of the RocksDB transaction
        const existingRemove = await MessageModel.get<types.ReactionRemoveModel>(
          this._db,
          message.fid(),
          types.UserPostfix.ReactionMessage,
          reactionRemoveTsHash.value
        );
        txn = this.deleteReactionRemoveTransaction(txn, existingRemove);
      }
    }

    // Checks if there is an add timestamp hash for this reaction
    const reactionAddTsHash = await ResultAsync.fromPromise(
      this._db.get(ReactionStore.reactionAddsKey(message.fid(), message.body().type(), targetKey)),
      () => undefined
    );

    if (reactionAddTsHash.isOk()) {
      if (
        this.reactionMessageCompare(
          // TODO: this was set to FollowAdd and did not break tests
          MessageType.ReactionAdd,
          reactionAddTsHash.value,
          message.type(),
          message.tsHash()
        ) >= 0
      ) {
        // If the existing add has the same or higher order than the new message, no-op
        return undefined;
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // ReactionAdd message and delete it as part of the RocksDB transaction
        const existingAdd = await MessageModel.get<types.ReactionAddModel>(
          this._db,
          message.fid(),
          types.UserPostfix.ReactionMessage,
          reactionAddTsHash.value
        );
        txn = this.deleteReactionAddTransaction(txn, existingAdd);
      }
    }

    return txn;
  }

  /* Builds a RocksDB transaction to insert a ReactionAdd message and construct its indices */
  private putReactionAddTransaction(txn: Transaction, message: types.ReactionAddModel): Transaction {
    const targetKey = this.targetKeyForMessage(message);

    // Puts the message into the database
    txn = MessageModel.putTransaction(txn, message);

    // Puts the message into the ReactionAdds Set index
    txn = txn.put(
      ReactionStore.reactionAddsKey(message.fid(), message.body().type(), targetKey),
      Buffer.from(message.tsHash())
    );

    // Puts message key into the byTarget index
    txn = txn.put(
      ReactionStore.reactionsByTargetKey(targetKey, message.body().type(), message.fid(), message.tsHash()),
      TRUE_VALUE
    );

    return txn;
  }

  /* Builds a RocksDB transaction to remove a ReactionAdd message and delete its indices */
  private deleteReactionAddTransaction(txn: Transaction, message: types.ReactionAddModel): Transaction {
    const targetKey = this.targetKeyForMessage(message);

    // Delete the message key from byTarget index
    txn = txn.del(
      ReactionStore.reactionsByTargetKey(targetKey, message.body().type(), message.fid(), message.tsHash())
    );

    // Delete the message key from ReactionAdds Set index
    txn = txn.del(ReactionStore.reactionAddsKey(message.fid(), message.body().type(), targetKey));

    // Delete the message
    return MessageModel.deleteTransaction(txn, message);
  }

  /* Builds a RocksDB transaction to insert a ReactionRemove message and construct its indices */
  private putReactionRemoveTransaction(txn: Transaction, message: types.ReactionRemoveModel): Transaction {
    const targetKey = this.targetKeyForMessage(message);

    // Puts the message
    txn = MessageModel.putTransaction(txn, message);

    // Puts message key into the ReactionRemoves Set index
    txn = txn.put(
      ReactionStore.reactionRemovesKey(message.fid(), message.body().type(), targetKey),
      Buffer.from(message.tsHash())
    );

    return txn;
  }

  /* Builds a RocksDB transaction to remove a ReactionRemove message and delete its indices */
  private deleteReactionRemoveTransaction(txn: Transaction, message: types.ReactionRemoveModel): Transaction {
    const targetKey = this.targetKeyForMessage(message);

    // Delete message key from ReactionRemoves Set index
    txn = txn.del(ReactionStore.reactionRemovesKey(message.fid(), message.body().type(), targetKey));

    // Delete the message
    return MessageModel.deleteTransaction(txn, message);
  }

  /* Computes the key for the byTarget index given a Reaction Reaction */
  private targetKeyForMessage(message: types.ReactionAddModel | types.ReactionRemoveModel): Buffer {
    return Buffer.concat([
      message.body().cast()?.fidArray() ?? new Uint8Array(),
      message.body().cast()?.tsHashArray() ?? new Uint8Array(),
    ]);
  }

  /* Computes the key for the byTarget index given a Reaction's CastId */
  private targetKeyForCastId(castId: CastId): Buffer {
    return Buffer.concat([castId.fidArray() || new Uint8Array(), castId.tsHashArray() || new Uint8Array()]);
  }
}

export default ReactionStore;
