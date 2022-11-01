import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import { BadRequestError } from '~/utils/errors';
import MessageModel, { FID_BYTES, TARGET_KEY_BYTES, TRUE_VALUE } from '~/storage/flatbuffers/messageModel';
import { ReactionAddModel, ReactionRemoveModel, RootPrefix, UserPostfix } from '~/storage/flatbuffers/types';
import { isReactionAdd, isReactionRemove } from '~/storage/flatbuffers/typeguards';
import { CastID, MessageType, ReactionType } from '~/utils/generated/message_generated';
import { ResultAsync } from 'neverthrow';
import { bytesCompare } from '~/storage/flatbuffers/utils';

/**
 * ReactionSet is a set that keeps track of Reaction Messages using a two phase CRDT set.
 *
 * A Reaction is performed by an fid and has a target (e.g. cast) and a type (e.g. like). Reactions
 * are added with a ReactionAdd and removed with a ReactionRemove. Conflicts between Reaction
 * messages are resolved with Last-Write-Wins + Remove-Wins rules as follows:
 *
 * 1. Highest timestamp wins
 * 2. Highest lexicographic hash wins
 * 3. Remove wins over Adds
 *
 * ReactionMessages are stored ordinally in RocksDB indexed by a unique key `fid:timestampHash`,
 * which makes truncating a user's earliest messages easy. Indices are also build for each phase
 * set (adds, removes) to make lookups easy when checking if a collision exists. An index is also
 * build for the target to make it easy to fetch all reactions for a target. The key-value entries
 * created by the reaction set are:
 *
 * fid:timestampHash -> message
 * fidPrefix:setPrefix:targetCastTimestampHash:reactionType -> fid:timestampHash (Set Index)
 * reactionTargetPrefix:targetCastTimestampHash:reactionType -> fid:timestampHash (Target Index)
 */
class ReactionSet {
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
      throw new BadRequestError('targetKey provided without type');
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
      throw new BadRequestError('targetKey provided without type');
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
      throw new BadRequestError('fid provided without type');
    }

    if (tsHash && (!type || !fid)) {
      throw new BadRequestError('tsHash provided without type or fid');
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
  async getReactionAdd(fid: Uint8Array, type: ReactionType, castId: CastID): Promise<ReactionAddModel> {
    const reactionAddsSetKey = ReactionSet.reactionAddsKey(fid, type, this.targetKeyForCastId(castId));
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
  async getReactionRemove(fid: Uint8Array, type: ReactionType, castId: CastID): Promise<ReactionRemoveModel> {
    const reactionRemovesKey = ReactionSet.reactionRemovesKey(fid, type, this.targetKeyForCastId(castId));
    const reactionMessageKey = await this._db.get(reactionRemovesKey);

    return MessageModel.get<ReactionRemoveModel>(this._db, fid, UserPostfix.ReactionMessage, reactionMessageKey);
  }

  /** Finds all ReactionAdd Messages by iterating through the prefixes */
  async getReactionAddsByFid(fid: Uint8Array): Promise<ReactionAddModel[]> {
    const prefix = ReactionSet.reactionAddsKey(fid);
    const msgKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(prefix, { keys: false, valueAsBuffer: true })) {
      msgKeys.push(value);
    }
    return MessageModel.getManyByUser<ReactionAddModel>(this._db, fid, UserPostfix.ReactionMessage, msgKeys);
  }

  /** Finds all ReactionRemove Messages by iterating through the prefixes */
  async getReactionRemovesByFid(fid: Uint8Array): Promise<ReactionRemoveModel[]> {
    const prefix = ReactionSet.reactionRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(prefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<ReactionRemoveModel>(this._db, fid, UserPostfix.ReactionMessage, messageKeys);
  }

  /** Finds all ReactionAdds that point to a specific target by iterating through the prefixes */
  async getReactionsByTarget(castId: CastID, type?: ReactionType): Promise<ReactionAddModel[]> {
    const prefix = ReactionSet.reactionsByTargetKey(this.targetKeyForCastId(castId), type);

    // Calculates the positions in the key where the fid and timestampHash begin
    const fidOffset = type ? prefix.length : prefix.length + 1; // prefix is 1 byte longer if type was provided
    const tsHashOffset = fidOffset + FID_BYTES;

    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      const fid = Uint8Array.from(key).subarray(fidOffset, tsHashOffset);
      const timestampHash = Uint8Array.from(key).subarray(tsHashOffset);
      messageKeys.push(MessageModel.primaryKey(fid, UserPostfix.ReactionMessage, timestampHash));
    }
    return MessageModel.getMany(this._db, messageKeys);
  }

  /** Merges a ReactionAdd or ReactionRemove message into the ReactionSet */
  async merge(message: MessageModel): Promise<void> {
    if (isReactionAdd(message)) {
      return this.mergeAdd(message);
    }

    if (isReactionRemove(message)) {
      return this.mergeRemove(message);
    }

    throw new BadRequestError('invalid message type');
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: ReactionAddModel): Promise<void> {
    const castId = message.body().cast();

    if (!castId) {
      throw new BadRequestError('castId is missing');
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
      throw new BadRequestError('castId is missing');
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
    aTimestampHash: Uint8Array,
    bType: MessageType,
    bTimestampHash: Uint8Array
  ): number {
    const timestampHashOrder = bytesCompare(aTimestampHash, bTimestampHash);
    if (timestampHashOrder !== 0) {
      return timestampHashOrder;
    }

    // TODO: Changing these types to FollowRemove and FollowAdd did not break tests
    if (aType === MessageType.ReactionRemove && bType === MessageType.ReactionAdd) {
      return 1;
    } else if (aType === MessageType.ReactionAdd && bType === MessageType.ReactionRemove) {
      return -1;
    }

    return 0;
  }

  /**
   * Determines the RocksDB keys that must be modified to settle merge conflicts as a result of adding a Reaction to the Set.
   *
   * @returns a RocksDB transaction if keys must be added or removed, undefined otherwise
   */
  private async resolveMergeConflicts(
    txn: Transaction,
    targetKey: Uint8Array,
    message: ReactionAddModel | ReactionRemoveModel
  ): Promise<Transaction | undefined> {
    // Checks if there is a remove timestamp hash for this reaction
    const reactionRemoveTimestampHash = await ResultAsync.fromPromise(
      this._db.get(ReactionSet.reactionRemovesKey(message.fid(), message.body().type(), targetKey)),
      () => undefined
    );

    if (reactionRemoveTimestampHash.isOk()) {
      if (
        this.reactionMessageCompare(
          MessageType.ReactionRemove,
          reactionRemoveTimestampHash.value,
          message.type(),
          message.timestampHash()
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
          reactionRemoveTimestampHash.value
        );
        txn = this.deleteReactionRemoveTransaction(txn, existingRemove);
      }
    }

    // Checks if there is an add timestamp hash for this reaction
    const reactionAddTimestampHash = await ResultAsync.fromPromise(
      this._db.get(ReactionSet.reactionAddsKey(message.fid(), message.body().type(), targetKey)),
      () => undefined
    );

    if (reactionAddTimestampHash.isOk()) {
      if (
        this.reactionMessageCompare(
          // TODO: this was set to FollowAdd and did not break tests
          MessageType.ReactionAdd,
          reactionAddTimestampHash.value,
          message.type(),
          message.timestampHash()
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
          reactionAddTimestampHash.value
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
      ReactionSet.reactionAddsKey(message.fid(), message.body().type(), targetKey),
      Buffer.from(message.timestampHash())
    );

    // Puts message key into the byTarget index
    txn = txn.put(
      ReactionSet.reactionsByTargetKey(targetKey, message.body().type(), message.fid(), message.timestampHash()),
      TRUE_VALUE
    );

    return txn;
  }

  /* Builds a RocksDB transaction to remove a ReactionAdd message and delete its indices */
  private deleteReactionAddTransaction(txn: Transaction, message: ReactionAddModel): Transaction {
    const targetKey = this.targetKeyForMessage(message);

    // Delete the message key from byTarget index
    txn = txn.del(
      ReactionSet.reactionsByTargetKey(targetKey, message.body().type(), message.fid(), message.timestampHash())
    );

    // Delete the message key from ReactionAdds Set index
    txn = txn.del(ReactionSet.reactionAddsKey(message.fid(), message.body().type(), targetKey));

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
      ReactionSet.reactionRemovesKey(message.fid(), message.body().type(), targetKey),
      Buffer.from(message.timestampHash())
    );

    return txn;
  }

  /* Builds a RocksDB transaction to remove a ReactionRemove message and delete its indices */
  private deleteReactionRemoveTransaction(txn: Transaction, message: ReactionRemoveModel): Transaction {
    const targetKey = this.targetKeyForMessage(message);

    // Delete message key from ReactionRemoves Set index
    txn = txn.del(ReactionSet.reactionRemovesKey(message.fid(), message.body().type(), targetKey));

    // Delete the message
    return MessageModel.deleteTransaction(txn, message);
  }

  /* Computes the key for the byTarget index given a Reaction Reaction */
  private targetKeyForMessage(message: ReactionAddModel | ReactionRemoveModel): Buffer {
    return Buffer.concat([
      message.body().cast()?.fidArray() ?? new Uint8Array(),
      message.body().cast()?.hashArray() ?? new Uint8Array(),
    ]);
  }

  /* Computes the key for the byTarget index given a Reaction's CastID */
  private targetKeyForCastId(castId: CastID): Buffer {
    return Buffer.concat([castId.fidArray() || new Uint8Array(), castId.hashArray() || new Uint8Array()]);
  }
}

export default ReactionSet;
