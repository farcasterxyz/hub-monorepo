import * as protobufs from '@farcaster/protobufs';
import { bytesCompare, getFarcasterTime, HubAsyncResult, HubError } from '@farcaster/protoutils';
import { err, ok, ResultAsync } from 'neverthrow';
import {
  deleteMessageTransaction,
  getAllMessagesBySigner,
  getManyMessages,
  getManyMessagesByFid,
  getMessage,
  getMessagesPruneIterator,
  getNextMessageToPrune,
  makeMessagePrimaryKey,
  makeTsHash,
  makeUserKey,
  putMessageTransaction,
} from '~/storage/db/message';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import { FID_BYTES, RootPrefix, TRUE_VALUE, UserPostfix } from '~/storage/db/types';
import SequentialMergeStore from '~/storage/stores/sequentialMergeStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { StorePruneOptions } from '~/storage/stores/types';

const PRUNE_SIZE_LIMIT_DEFAULT = 5_000;
const PRUNE_TIME_LIMIT_DEFAULT = 60 * 60 * 24 * 90; // 90 days

type TargetId = protobufs.CastId;

/**
 * Generates a key for referencing a CastId. Packed as <fid, hash>.
 */
const makeTargetKeyFromCastId = (castId: protobufs.CastId): Buffer => {
  const buffer = new ArrayBuffer(FID_BYTES + castId.hash.length);
  const view = new DataView(buffer);

  view.setBigUint64(0, BigInt(castId.fid), false); // Big endian for ordering

  for (let i = 0; i < castId.hash.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, security/detect-object-injection
    view.setUint8(FID_BYTES + i, castId.hash[i]!);
  }

  return Buffer.from(buffer);
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
const makeReactionAddsKey = (fid: number, type?: protobufs.ReactionType, targetId?: TargetId): Buffer => {
  if (targetId && !type) {
    throw new HubError('bad_request.validation_failure', 'targetId provided without type');
  }

  return Buffer.concat([
    makeUserKey(fid), // --------------------------- fid prefix, 33 bytes
    Buffer.from([UserPostfix.ReactionAdds]), // -------------- reaction_adds key, 1 byte
    Buffer.from(type ? [type] : ''), //-------- type, 1 byte
    targetId ? makeTargetKeyFromCastId(targetId) : Buffer.from(''), //-- target id, 28 bytes
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
const makeReactionRemovesKey = (fid: number, type?: protobufs.ReactionType, targetId?: TargetId): Buffer => {
  if (targetId && !type) {
    throw new HubError('bad_request.validation_failure', 'targetId provided without type');
  }

  return Buffer.concat([
    makeUserKey(fid), // --------------------------- fid prefix, 33 bytes
    Buffer.from([UserPostfix.ReactionRemoves]), // ----------- reaction_adds key, 1 byte
    Buffer.from(type ? [type] : ''), //-------- type, 1 byte
    targetId ? makeTargetKeyFromCastId(targetId) : Buffer.from(''), //-- target id, 28 bytes
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
  targetId: TargetId,
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

  let fidBuffer: Buffer;
  if (fid) {
    const buffer = new ArrayBuffer(FID_BYTES);
    const view = new DataView(buffer);
    view.setBigUint64(0, BigInt(fid), false);
    fidBuffer = Buffer.from(buffer);
  } else {
    fidBuffer = Buffer.from('');
  }

  return Buffer.concat([
    Buffer.from([RootPrefix.ReactionsByTarget]),
    makeTargetKeyFromCastId(targetId),
    Buffer.from(type ? [type] : ''),
    fidBuffer,
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
class ReactionStore extends SequentialMergeStore {
  private _db: RocksDB;
  private _eventHandler: StoreEventHandler;
  private _pruneSizeLimit: number;
  private _pruneTimeLimit: number;

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    super();

    this._db = db;
    this._eventHandler = eventHandler;
    this._pruneSizeLimit = options.pruneSizeLimit ?? PRUNE_SIZE_LIMIT_DEFAULT;
    this._pruneTimeLimit = options.pruneTimeLimit ?? PRUNE_TIME_LIMIT_DEFAULT;
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
  async getReactionAddsByFid(fid: number, type?: protobufs.ReactionType): Promise<protobufs.ReactionAddMessage[]> {
    const prefix = makeReactionAddsKey(fid, type);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(prefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return getManyMessagesByFid(this._db, fid, UserPostfix.ReactionMessage, messageKeys);
  }

  /** Finds all ReactionRemove Messages by iterating through the prefixes */
  async getReactionRemovesByFid(fid: number): Promise<protobufs.ReactionRemoveMessage[]> {
    const prefix = makeReactionRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(prefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return getManyMessagesByFid(this._db, fid, UserPostfix.ReactionMessage, messageKeys);
  }

  /** Finds all ReactionAdds that point to a specific target by iterating through the prefixes */
  async getReactionsByTargetCast(
    castId: protobufs.CastId,
    type?: protobufs.ReactionType
  ): Promise<protobufs.ReactionAddMessage[]> {
    const prefix = makeReactionsByTargetKey(castId, type);

    // Calculates the positions in the key where the fid and tsHash begin
    const fidOffset = prefix.length + (type ? 0 : 1); // compensate for fact that prefix is 1 byte longer if type was provided
    const tsHashOffset = fidOffset + FID_BYTES;

    const messageKeys: Buffer[] = [];
    for await (const [key] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      const view = new DataView((key as Buffer).buffer);
      const fid = Number(view.getBigUint64(fidOffset, false));
      const tsHash = Uint8Array.from(key).subarray(tsHashOffset);
      messageKeys.push(makeMessagePrimaryKey(fid, UserPostfix.ReactionMessage, tsHash));
    }
    return getManyMessages(this._db, messageKeys);
  }

  /** Merges a ReactionAdd or ReactionRemove message into the ReactionStore */
  async merge(message: protobufs.Message): Promise<void> {
    if (!protobufs.isReactionAddMessage(message) && !protobufs.isReactionRemoveMessage(message)) {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }

    const mergeResult = await this.mergeSequential(message);
    if (mergeResult.isErr()) {
      throw mergeResult.error;
    }

    return mergeResult.value;
  }

  async revokeMessagesBySigner(fid: number, signer: Uint8Array): HubAsyncResult<void> {
    // Get all ReactionAdd messages signed by signer
    const reactionAdds = await getAllMessagesBySigner<protobufs.ReactionAddMessage>(
      this._db,
      fid,
      signer,
      protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD
    );

    // Get all ReactionRemove messages signed by signer
    const reactionRemoves = await getAllMessagesBySigner<protobufs.ReactionRemoveMessage>(
      this._db,
      fid,
      signer,
      protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE
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

  async pruneMessages(fid: number): HubAsyncResult<void> {
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
    const messageToPrune: (protobufs.ReactionAddMessage | protobufs.ReactionRemoveMessage)[] = [];

    // Create a rocksdb transaction to include all the mutations
    let pruneTsx = this._db.transaction();

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
        pruneTsx = this.deleteReactionAddTransaction(pruneTsx, message);
      } else if (protobufs.isReactionRemoveMessage(message)) {
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
  /*                              Abstract Methods                              */
  /* -------------------------------------------------------------------------- */

  protected async mergeFromSequentialQueue(message: protobufs.Message): Promise<void> {
    if (protobufs.isReactionAddMessage(message)) {
      return this.mergeAdd(message);
    } else if (protobufs.isReactionRemoveMessage(message)) {
      return this.mergeRemove(message);
    } else {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: protobufs.ReactionAddMessage): Promise<void> {
    const mergeConflicts = await this.getMergeConflicts(message);
    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add ops to store the message by messageKey and index the the messageKey by set and by target
    txn = this.putReactionAddTransaction(txn, message);

    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message, mergeConflicts.value);

    return undefined;
  }

  private async mergeRemove(message: protobufs.ReactionRemoveMessage): Promise<void> {
    const mergeConflicts = await this.getMergeConflicts(message);

    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add ops to store the message by messageKey and index the the messageKey by set
    txn = this.putReactionRemoveTransaction(txn, message);

    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message, mergeConflicts.value);

    return undefined;
  }

  private reactionMessageCompare(
    aType: protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD | protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE,
    aTsHash: Uint8Array,
    bType: protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD | protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE,
    bTsHash: Uint8Array
  ): number {
    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    // Compare message types to enforce that RemoveWins in case of LWW ties.
    if (
      aType === protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE &&
      bType === protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD
    ) {
      return 1;
    } else if (
      aType === protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD &&
      bType === protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE
    ) {
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
        protobufs.MessageType.MESSAGE_TYPE_REACTION_REMOVE,
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
        protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD,
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
