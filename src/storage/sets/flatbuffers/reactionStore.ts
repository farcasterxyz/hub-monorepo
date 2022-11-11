import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import MessageModel, { FID_BYTES, TARGET_KEY_BYTES, TRUE_VALUE } from '~/storage/flatbuffers/messageModel';
import { ReactionAddModel, ReactionRemoveModel, RootPrefix, UserPostfix } from '~/storage/flatbuffers/types';
import { isReactionAdd, isReactionRemove } from '~/storage/flatbuffers/typeguards';
import { CastId, MessageType, ReactionType } from '~/utils/generated/message_generated';
import { ResultAsync } from 'neverthrow';
import { bytesCompare } from '~/storage/flatbuffers/utils';
import { HubError } from '~/utils/hubErrors';

/**
 * ReactionStore persists Reaction Messages in RocksDB using a two-phase CRDT set to guarantee
 * eventual consistency.
 *
 * A Reaction is performed by an fid and has a target (e.g. cast) and a type (e.g. like). Reactions
 * are added with a ReactionAdd and removed with a ReactionRemove. Conflicts between Reaction
 * messages are resolved with Last-Write-Wins + Remove-Wins rules as follows:
 *
 * 1. Highest timestamp wins
 * 2. Remove wins over Adds
 * 3. Highest lexicographic hash wins
 *
 * ReactionMessages are stored ordinally in RocksDB indexed by a unique key `fid:tsHash`,
 * which makes truncating a user's earliest messages easy. Indices are also built for each phase
 * set (adds, removes) to make lookups easy when checking if a collision exists. An index is also
 * build for the target to make it easy to fetch all reactions for a target.
 *
 * The key-value entries created by the Reaction Store are:
 *
 * 1. fid:tsHash -> reaction message
 * 2. fid:set:targetCastTsHash:reactionType -> fid:tsHash (Set Index)
 * 3. reactionTarget:reactionType:targetCastTsHash -> fid:tsHash (Target Index)
 */
class ReactionStore {
  private _db: RocksDB;

  constructor(db: RocksDB) {
    this._db = db;
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
      Buffer.from([UserPostfix.ReactionAdds]), // -------------- reaction_adds key, 1 byte
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
      Buffer.from([UserPostfix.ReactionRemoves]), // ----------- reaction_adds key, 1 byte
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

    bytes.set([RootPrefix.ReactionsByTarget], 0);
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
  async getReactionAdd(fid: Uint8Array, type: ReactionType, castId: CastId): Promise<ReactionAddModel> {
    const reactionAddsSetKey = ReactionStore.reactionAddsKey(fid, type, this.targetKeyForCastId(castId));
    const reactionMessageKey = await this._db.get(reactionAddsSetKey);

    return MessageModel.get<ReactionAddModel>(this._db, fid, UserPostfix.ReactionMessage, reactionMessageKey);
  }

  /**
   * Finds a ReactionRemove Message by checking the Remove Set index
   *
   * @param fid fid of the user who created the reaction remove
   * @param type type of reaction that was removed
   * @param castId id of the cast being reacted to
   * @returns the ReactionRemove message if it exists, undefined otherwise
   */
  async getReactionRemove(fid: Uint8Array, type: ReactionType, castId: CastId): Promise<ReactionRemoveModel> {
    const reactionRemovesKey = ReactionStore.reactionRemovesKey(fid, type, this.targetKeyForCastId(castId));
    const reactionMessageKey = await this._db.get(reactionRemovesKey);

    return MessageModel.get<ReactionRemoveModel>(this._db, fid, UserPostfix.ReactionMessage, reactionMessageKey);
  }

  /** Finds all ReactionAdd Messages by iterating through the prefixes */
  async getReactionAddsByUser(fid: Uint8Array): Promise<ReactionAddModel[]> {
    const prefix = ReactionStore.reactionAddsKey(fid);
    const msgKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(prefix, { keys: false, valueAsBuffer: true })) {
      msgKeys.push(value);
    }
    return MessageModel.getManyByUser<ReactionAddModel>(this._db, fid, UserPostfix.ReactionMessage, msgKeys);
  }

  /** Finds all ReactionRemove Messages by iterating through the prefixes */
  async getReactionRemovesByUser(fid: Uint8Array): Promise<ReactionRemoveModel[]> {
    const prefix = ReactionStore.reactionRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(prefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<ReactionRemoveModel>(this._db, fid, UserPostfix.ReactionMessage, messageKeys);
  }

  /** Finds all ReactionAdds that point to a specific target by iterating through the prefixes */
  async getReactionsByTarget(castId: CastId, type?: ReactionType): Promise<ReactionAddModel[]> {
    const prefix = ReactionStore.reactionsByTargetKey(this.targetKeyForCastId(castId), type);

    // Calculates the positions in the key where the fid and tsHash begin
    const fidOffset = type ? prefix.length : prefix.length + 1; // prefix is 1 byte longer if type was provided
    const tsHashOffset = fidOffset + FID_BYTES;

    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      const fid = Uint8Array.from(key).subarray(fidOffset, tsHashOffset);
      const tsHash = Uint8Array.from(key).subarray(tsHashOffset);
      messageKeys.push(MessageModel.primaryKey(fid, UserPostfix.ReactionMessage, tsHash));
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

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: ReactionAddModel): Promise<void> {
    const castId = message.body().cast();

    if (!castId) {
      throw new HubError('bad_request.validation_failure', 'castId was missing');
    } else {
      const targetKey = this.targetKeyForCastId(castId);
      let txn = await this.resolveMergeConflicts(this._db.transaction(), targetKey, message);

      if (!txn) return undefined; // Assume no-op if txn was not returned

      // Add ops to store the message by messageKey and index the the messageKey by set and by target
      txn = this.putReactionAddTransaction(txn, message);

      return this._db.commit(txn);
    }
  }

  private async mergeRemove(message: ReactionRemoveModel): Promise<void> {
    const castId = message.body().cast();

    if (!castId) {
      throw new HubError('bad_request.validation_failure', 'castId was missing');
    } else {
      const targetKey = this.targetKeyForCastId(castId);
      let txn = await this.resolveMergeConflicts(this._db.transaction(), targetKey, message);

      if (!txn) return undefined; // Assume no-op if txn was not returned

      // Add ops to store the message by messageKey and index the the messageKey by set
      txn = this.putReactionRemoveTransaction(txn, message);

      return this._db.commit(txn);
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
    message: ReactionAddModel | ReactionRemoveModel
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
        const existingRemove = await MessageModel.get<ReactionRemoveModel>(
          this._db,
          message.fid(),
          UserPostfix.ReactionMessage,
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
        const existingAdd = await MessageModel.get<ReactionAddModel>(
          this._db,
          message.fid(),
          UserPostfix.ReactionMessage,
          reactionAddTsHash.value
        );
        txn = this.deleteReactionAddTransaction(txn, existingAdd);
      }
    }

    return txn;
  }

  /* Builds a RocksDB transaction to insert a ReactionAdd message and construct its indices */
  private putReactionAddTransaction(txn: Transaction, message: ReactionAddModel): Transaction {
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
  private deleteReactionAddTransaction(txn: Transaction, message: ReactionAddModel): Transaction {
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
  private putReactionRemoveTransaction(txn: Transaction, message: ReactionRemoveModel): Transaction {
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
  private deleteReactionRemoveTransaction(txn: Transaction, message: ReactionRemoveModel): Transaction {
    const targetKey = this.targetKeyForMessage(message);

    // Delete message key from ReactionRemoves Set index
    txn = txn.del(ReactionStore.reactionRemovesKey(message.fid(), message.body().type(), targetKey));

    // Delete the message
    return MessageModel.deleteTransaction(txn, message);
  }

  /* Computes the key for the byTarget index given a Reaction Reaction */
  private targetKeyForMessage(message: ReactionAddModel | ReactionRemoveModel): Buffer {
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
