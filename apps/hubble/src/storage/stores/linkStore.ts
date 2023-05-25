import {
  bytesCompare,
  getFarcasterTime,
  HubAsyncResult,
  HubError,
  HubEventType,
  isHubError,
  isLinkAddMessage,
  isLinkRemoveMessage,
  LinkAddMessage,
  LinkRemoveMessage,
  Message,
  MessageType,
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
  makeFidKey,
  makeMessagePrimaryKey,
  makeTsHash,
  makeUserKey,
  putMessageTransaction,
} from '../../storage/db/message.js';
import RocksDB, { Transaction } from '../db/rocksdb.js';
import { RootPrefix, TSHASH_LENGTH, UserPostfix } from '../db/types.js';
import StoreEventHandler, { HubEventArgs } from './storeEventHandler.js';
import { MERGE_TIMEOUT_DEFAULT, MessagesPage, PAGE_SIZE_MAX, PageOptions, StorePruneOptions } from './types.js';
import { logger } from '../../utils/logger.js';

const PRUNE_SIZE_LIMIT_DEFAULT = 2_500;

const makeTargetKey = (target: number): Buffer => {
  return makeFidKey(target);
};

/**
 * Generates a unique key used to store a LinkAdd message key in the LinksAdd Set index
 *
 * @param fid farcaster id of the user who created the link
 * @param type type of link created
 * @param targetId id of the object being reacted to
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<targetKey?>:<type?>
 */
const makeLinkAddsKey = (fid: number, type?: string, target?: number): Buffer => {
  if (target && !type) {
    throw new HubError('bad_request.validation_failure', 'targetId provided without type');
  }

  if (type && (Buffer.from(type).length > 8 || type.length == 0)) {
    throw new HubError('bad_request.validation_failure', 'type must be 1-8 bytes');
  }

  return Buffer.concat([
    makeUserKey(fid), // --------------------------- fid prefix, 33 bytes
    Buffer.from([UserPostfix.LinkAdds]), // -------------- link_adds key, 1 byte
    type ? Buffer.concat([Buffer.from(type)], 8) : Buffer.from(''), //-------- type, 8 bytes
    target ? makeTargetKey(target) : Buffer.from(''), //-- target id, 4 bytes
  ]);
};

/**
 * Generates a unique key used to store a LinkRemove message key in the LinksRemove Set index
 *
 * @param fid farcaster id of the user who created the link
 * @param type type of link created
 * @param targetId id of the object being reacted to
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<targetKey?>:<type?>
 */
const makeLinkRemovesKey = (fid: number, type?: string, target?: number): Buffer => {
  if (target && !type) {
    throw new HubError('bad_request.validation_failure', 'targetId provided without type');
  }

  if (type && (Buffer.from(type).length > 8 || type.length == 0)) {
    throw new HubError('bad_request.validation_failure', 'type must be 1-8 bytes');
  }

  return Buffer.concat([
    makeUserKey(fid), // --------------------------- fid prefix, 33 bytes
    Buffer.from([UserPostfix.LinkRemoves]), // ----------- link_adds key, 1 byte
    type ? Buffer.concat([Buffer.from(type)], 8) : Buffer.from(''), //-------- type, 8 bytes
    target ? makeTargetKey(target) : Buffer.from(''), //-- target id, 4 bytes
  ]);
};

/**
 * Generates a unique key used to store a LinkAdd Message in the LinksByTargetAndType index
 *
 * @param targetId the id of the object being reacted to (currently just cast id)
 * @param fid the fid of the user who created the link
 * @param tsHash the timestamp hash of the link message
 *
 * @returns RocksDB index key of the form <RootPrefix>:<target_key>:<fid?>:<tsHash?>
 */
const makeLinksByTargetKey = (target: number, fid?: number, tsHash?: Uint8Array): Buffer => {
  if (fid && !tsHash) {
    throw new HubError('bad_request.validation_failure', 'fid provided without tsHash');
  }

  if (tsHash && !fid) {
    throw new HubError('bad_request.validation_failure', 'tsHash provided without fid');
  }

  return Buffer.concat([
    Buffer.from([RootPrefix.LinksByTarget]),
    makeTargetKey(target),
    Buffer.from(tsHash ?? ''),
    fid ? makeFidKey(fid) : Buffer.from(''),
  ]);
};

/**
 * LinkStore persists Link Messages in RocksDB using a two-phase CRDT set to guarantee
 * eventual consistency.
 *
 * A Link is created by a user and points at a target (e.g. fid) and has a type (e.g. "follow").
 * Links are added with a LinkAdd and removed with a LinkRemove. Link messages can
 * collide if two messages have the same user fid, target, and type. Collisions are handled with
 * Last-Write-Wins + Remove-Wins rules as follows:
 *
 * 1. Highest timestamp wins
 * 2. Remove wins over Adds
 * 3. Highest lexicographic hash wins
 *
 * LinkMessages are stored ordinally in RocksDB indexed by a unique key `fid:tsHash`,
 * which makes truncating a user's earliest messages easy. Indices are built to look up
 * link adds in the adds set, link removes in the remove set and all links
 * for a given target. The key-value entries created by the Link Store are:
 *
 * 1. fid:tsHash -> link message
 * 2. fid:set:targetCastTsHash:linkType -> fid:tsHash (Set Index)
 * 3. linkTarget:linkType:targetCastTsHash -> fid:tsHash (Target Index)
 */
class LinkStore {
  private _db: RocksDB;
  private _eventHandler: StoreEventHandler;
  private _pruneSizeLimit: number;
  private _mergeLock: AsyncLock;

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    this._db = db;
    this._eventHandler = eventHandler;
    this._pruneSizeLimit = options.pruneSizeLimit ?? PRUNE_SIZE_LIMIT_DEFAULT;
    this._mergeLock = new AsyncLock();
  }

  /* -------------------------------------------------------------------------- */
  /*                              Instance Methods                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Finds a LinkAdd Message by checking the Adds Set index
   *
   * @param fid fid of the user who created the link add
   * @param type type of link that was added
   * @param target id of the fid being linked to
   *
   * @returns the LinkAdd Model if it exists, undefined otherwise
   */
  async getLinkAdd(fid: number, type: string, target: number): Promise<LinkAddMessage> {
    const linkAddsSetKey = makeLinkAddsKey(fid, type, target);
    const linkMessageKey = await this._db.get(linkAddsSetKey);

    return getMessage(this._db, fid, UserPostfix.LinkMessage, linkMessageKey);
  }

  /**
   * Finds a LinkRemove Message by checking the Remove Set index
   *
   * @param fid fid of the user who created the link remove
   * @param type type of link that was removed
   * @param target id of the fid being linked to
   * @returns the LinkRemove message if it exists, undefined otherwise
   */
  async getLinkRemove(fid: number, type: string, target: number): Promise<LinkRemoveMessage> {
    const linkRemovesKey = makeLinkRemovesKey(fid, type, target);
    const linkMessageKey = await this._db.get(linkRemovesKey);

    return getMessage(this._db, fid, UserPostfix.LinkMessage, linkMessageKey);
  }

  /** Finds all LinkAdd Messages by iterating through the prefixes */
  async getLinkAddsByFid(
    fid: number,
    type?: string,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<LinkAddMessage>> {
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.LinkMessage);
    const filter = (message: Message): message is LinkAddMessage => {
      return isLinkAddMessage(message) && (type ? message.data.linkBody.type === type : true);
    };
    return getMessagesPageByPrefix(this._db, prefix, filter, pageOptions);
  }

  /** Finds all LinkRemove Messages by iterating through the prefixes */
  async getLinkRemovesByFid(
    fid: number,
    type?: string,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<LinkRemoveMessage>> {
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.LinkMessage);
    const filter = (message: Message): message is LinkRemoveMessage => {
      return isLinkRemoveMessage(message) && (type ? message.data.linkBody.type === type : true);
    };
    return getMessagesPageByPrefix(this._db, prefix, filter, pageOptions);
  }

  async getAllLinkMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<LinkAddMessage | LinkRemoveMessage>> {
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.LinkMessage);
    const filter = (message: Message): message is LinkAddMessage | LinkRemoveMessage => {
      return isLinkAddMessage(message) || isLinkRemoveMessage(message);
    };
    return getMessagesPageByPrefix(this._db, prefix, filter, pageOptions);
  }

  /** Finds all LinkAdds that point to a specific target by iterating through the prefixes */
  async getLinksByTarget(
    target: number,
    type?: string,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<LinkAddMessage>> {
    const prefix = makeLinksByTargetKey(target);

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

      if (type === undefined || (value !== undefined && value.equals(Buffer.from(type)))) {
        // Calculates the positions in the key where the fid and tsHash begin
        const tsHashOffset = prefix.length;
        const fidOffset = tsHashOffset + TSHASH_LENGTH;

        const fid = Number((key as Buffer).readUint32BE(fidOffset));
        const tsHash = Uint8Array.from(key as Buffer).subarray(tsHashOffset, tsHashOffset + TSHASH_LENGTH);
        const messagePrimaryKey = makeMessagePrimaryKey(fid, UserPostfix.LinkMessage, tsHash);

        messageKeys.push(messagePrimaryKey);
      }
    } while (messageKeys.length < limit);

    const messages = await getManyMessages<LinkAddMessage>(this._db, messageKeys);

    if (!iteratorFinished) {
      await iterator.end(); // clear iterator if it has not finished
      return { messages, nextPageToken: lastPageToken };
    } else {
      return { messages, nextPageToken: undefined };
    }
  }

  /** Merges a LinkAdd or LinkRemove message into the LinkStore */
  async merge(message: Message): Promise<number> {
    if (!isLinkAddMessage(message) && !isLinkRemoveMessage(message)) {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }

    return this._mergeLock
      .acquire(
        message.data.fid.toString(),
        async () => {
          const prunableResult = await this._eventHandler.isPrunable(
            message,
            UserPostfix.LinkMessage,
            this._pruneSizeLimit
          );
          if (prunableResult.isErr()) {
            throw prunableResult.error;
          } else if (prunableResult.value) {
            throw new HubError('bad_request.prunable', 'message would be pruned');
          }

          if (isLinkAddMessage(message)) {
            return this.mergeAdd(message);
          } else if (isLinkRemoveMessage(message)) {
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
    if (isLinkAddMessage(message)) {
      txn = this.deleteLinkAddTransaction(txn, message);
    } else if (isLinkRemoveMessage(message)) {
      txn = this.deleteLinkRemoveTransaction(txn, message);
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

    const cachedCount = await this._eventHandler.getCacheMessageCount(fid, UserPostfix.LinkMessage);

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

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = getMessagesPruneIterator(this._db, fid, UserPostfix.LinkMessage);

    const pruneNextMessage = async (): HubAsyncResult<number | undefined> => {
      const nextMessage = await ResultAsync.fromPromise(getNextMessageFromIterator(pruneIterator), () => undefined);
      if (nextMessage.isErr()) {
        return ok(undefined); // Nothing left to prune
      }

      const count = await this._eventHandler.getCacheMessageCount(fid, UserPostfix.LinkMessage);
      if (count.isErr()) {
        return err(count.error);
      }

      if (count.value <= this._pruneSizeLimit) {
        return ok(undefined);
      }

      let txn = this._db.transaction();

      if (isLinkAddMessage(nextMessage.value)) {
        txn = this.deleteLinkAddTransaction(txn, nextMessage.value);
      } else if (isLinkRemoveMessage(nextMessage.value)) {
        txn = this.deleteLinkRemoveTransaction(txn, nextMessage.value);
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
          logger.error({ errCode: e.errCode }, `error pruning link message for fid ${fid}: ${e.message}`);
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

  private async mergeAdd(message: LinkAddMessage): Promise<number> {
    const mergeConflicts = await this.getMergeConflicts(message);
    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add ops to store the message by messageKey and index the the messageKey by set and by target
    txn = this.putLinkAddTransaction(txn, message);

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

  private async mergeRemove(message: LinkRemoveMessage): Promise<number> {
    const mergeConflicts = await this.getMergeConflicts(message);

    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add ops to store the message by messageKey and index the the messageKey by set
    txn = this.putLinkRemoveTransaction(txn, message);

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

  private linkMessageCompare(
    aType: MessageType.LINK_ADD | MessageType.LINK_REMOVE,
    aTsHash: Uint8Array,
    bType: MessageType.LINK_ADD | MessageType.LINK_REMOVE,
    bTsHash: Uint8Array
  ): number {
    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    // Compare message types to enforce that RemoveWins in case of LWW ties.
    if (aType === MessageType.LINK_REMOVE && bType === MessageType.LINK_ADD) {
      return 1;
    } else if (aType === MessageType.LINK_ADD && bType === MessageType.LINK_REMOVE) {
      return -1;
    }

    // Compare hashes (last 4 bytes of tsHash) to break ties between messages of the same type and timestamp
    return bytesCompare(aTsHash.subarray(4), bTsHash.subarray(4));
  }

  /**
   * Determines the RocksDB keys that must be modified to settle merge conflicts as a result of
   * adding a Link to the Store.
   *
   * @returns a RocksDB transaction if keys must be added or removed, undefined otherwise
   */
  private async getMergeConflicts(
    message: LinkAddMessage | LinkRemoveMessage
  ): HubAsyncResult<(LinkAddMessage | LinkRemoveMessage)[]> {
    const target = message.data.linkBody.targetFid;
    if (!target) {
      throw new HubError('bad_request.validation_failure', 'target is missing');
    }

    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const conflicts: (LinkAddMessage | LinkRemoveMessage)[] = [];

    // Checks if there is a remove timestamp hash for this link
    const linkRemoveKey = makeLinkRemovesKey(message.data.fid, message.data.linkBody.type, target);
    const linkRemoveTsHash = await ResultAsync.fromPromise(this._db.get(linkRemoveKey), () => undefined);

    if (linkRemoveTsHash.isOk()) {
      const removeCompare = this.linkMessageCompare(
        MessageType.LINK_REMOVE,
        new Uint8Array(linkRemoveTsHash.value),
        message.data.type,
        tsHash.value
      );
      if (removeCompare > 0) {
        return err(new HubError('bad_request.conflict', 'message conflicts with a more recent LinkRemove'));
      } else if (removeCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing remove has a lower order than the new message, retrieve the full
        // LinkRemove message and delete it as part of the RocksDB transaction
        const existingRemove = await getMessage<LinkRemoveMessage>(
          this._db,
          message.data.fid,
          UserPostfix.LinkMessage,
          linkRemoveTsHash.value
        );
        conflicts.push(existingRemove);
      }
    }

    // Checks if there is an add timestamp hash for this link
    const linkAddKey = makeLinkAddsKey(message.data.fid, message.data.linkBody.type, target);
    const linkAddTsHash = await ResultAsync.fromPromise(this._db.get(linkAddKey), () => undefined);

    if (linkAddTsHash.isOk()) {
      const addCompare = this.linkMessageCompare(
        MessageType.LINK_ADD,
        new Uint8Array(linkAddTsHash.value),
        message.data.type,
        tsHash.value
      );
      if (addCompare > 0) {
        return err(new HubError('bad_request.conflict', 'message conflicts with a more recent LinkAdd'));
      } else if (addCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // LinkAdd message and delete it as part of the RocksDB transaction
        const existingAdd = await getMessage<LinkAddMessage>(
          this._db,
          message.data.fid,
          UserPostfix.LinkMessage,
          linkAddTsHash.value
        );
        conflicts.push(existingAdd);
      }
    }

    return ok(conflicts);
  }

  private deleteManyTransaction(txn: Transaction, messages: (LinkAddMessage | LinkRemoveMessage)[]): Transaction {
    for (const message of messages) {
      if (isLinkAddMessage(message)) {
        txn = this.deleteLinkAddTransaction(txn, message);
      } else if (isLinkRemoveMessage(message)) {
        txn = this.deleteLinkRemoveTransaction(txn, message);
      }
    }
    return txn;
  }

  /* Builds a RocksDB transaction to insert a LinkAdd message and construct its indices */
  private putLinkAddTransaction(txn: Transaction, message: LinkAddMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const target = message.data.linkBody.targetFid;
    if (!target) {
      throw new HubError('bad_request.validation_failure', 'target is missing');
    }

    const type = message.data.linkBody.type;
    if (!type) {
      throw new HubError('bad_request.validation_failure', 'type is missing');
    } else {
      const typeBuffer = Buffer.from(type);
      if (type.length === 0 || typeBuffer.length > 8) {
        throw new HubError('bad_request.validation_failure', 'type must be 1-8 bytes');
      }
    }

    // Puts the message into the database
    txn = putMessageTransaction(txn, message);

    // Puts the message into the LinkAdds Set index
    const addsKey = makeLinkAddsKey(message.data.fid, type, target);
    txn = txn.put(addsKey, Buffer.from(tsHash.value));

    // Puts message key into the byTarget index
    const byTargetKey = makeLinksByTargetKey(target, message.data.fid, tsHash.value);
    txn = txn.put(byTargetKey, Buffer.from(type));

    return txn;
  }

  /* Builds a RocksDB transaction to remove a LinkAdd message and delete its indices */
  private deleteLinkAddTransaction(txn: Transaction, message: LinkAddMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const target = message.data.linkBody.targetFid;
    if (!target) {
      throw new HubError('bad_request.validation_failure', 'target is missing');
    }

    const type = message.data.linkBody.type;
    if (!type) {
      throw new HubError('bad_request.validation_failure', 'type is missing');
    } else {
      const typeBuffer = Buffer.from(type);
      if (type.length === 0 || typeBuffer.length > 8) {
        throw new HubError('bad_request.validation_failure', 'type must be 1-8 bytes');
      }
    }

    // Delete the message key from byTarget index
    const byTargetKey = makeLinksByTargetKey(target, message.data.fid, tsHash.value);
    txn = txn.del(byTargetKey);

    // Delete the message key from LinkAdds Set index
    const addsKey = makeLinkAddsKey(message.data.fid, type, target);
    txn = txn.del(addsKey);

    // Delete the message
    return deleteMessageTransaction(txn, message);
  }

  /* Builds a RocksDB transaction to insert a LinkRemove message and construct its indices */
  private putLinkRemoveTransaction(txn: Transaction, message: LinkRemoveMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const target = message.data.linkBody.targetFid;
    if (!target) {
      throw new HubError('bad_request.validation_failure', 'target is missing');
    }

    const type = message.data.linkBody.type;
    if (!type) {
      throw new HubError('bad_request.validation_failure', 'type is missing');
    } else {
      const typeBuffer = Buffer.from(type);
      if (type.length === 0 || typeBuffer.length > 8) {
        throw new HubError('bad_request.validation_failure', 'type must be 1-8 bytes');
      }
    }

    // Puts the message
    txn = putMessageTransaction(txn, message);

    // Puts message key into the LinkRemoves Set index
    const removesKey = makeLinkRemovesKey(message.data.fid, type, target);
    txn = txn.put(removesKey, Buffer.from(tsHash.value));

    return txn;
  }

  /* Builds a RocksDB transaction to remove a LinkRemove message and delete its indices */
  private deleteLinkRemoveTransaction(txn: Transaction, message: LinkRemoveMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    const target = message.data.linkBody.targetFid;
    if (!target) {
      throw new HubError('bad_request.validation_failure', 'target is missing');
    }

    const type = message.data.linkBody.type;
    if (!type) {
      throw new HubError('bad_request.validation_failure', 'type is missing');
    } else {
      const typeBuffer = Buffer.from(type);
      if (type.length === 0 || typeBuffer.length > 8) {
        throw new HubError('bad_request.validation_failure', 'type must be 1-8 bytes');
      }
    }

    // Delete message key from LinkRemoves Set index
    const removesKey = makeLinkRemovesKey(message.data.fid, type, target);
    txn = txn.del(removesKey);

    // Delete the message
    return deleteMessageTransaction(txn, message);
  }
}

export default LinkStore;
