import * as protobufs from '@farcaster/protobufs';
import { bytesCompare, bytesIncrement, HubAsyncResult, HubError, isHubError } from '@farcaster/utils';
import AsyncLock from 'async-lock';
import { err, ok, ResultAsync } from 'neverthrow';
import AbstractRocksDB from 'rocksdb';
import { getIdRegistryEvent, putIdRegistryEventTransaction } from '~/storage/db/idRegistryEvent';
import {
  deleteMessageTransaction,
  getAllMessagesBySigner,
  getMessage,
  getMessagesPageByPrefix,
  getMessagesPruneIterator,
  getNextMessageToPrune,
  makeMessagePrimaryKey,
  makeTsHash,
  makeUserKey,
  putMessageTransaction,
} from '~/storage/db/message';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import { RootPrefix, UserPostfix } from '~/storage/db/types';
import StoreEventHandler, { putEventTransaction } from '~/storage/stores/storeEventHandler';
import {
  MERGE_TIMEOUT_DEFAULT,
  MessagesPage,
  PAGE_SIZE_MAX,
  PageOptions,
  StorePruneOptions,
} from '~/storage/stores/types';
import { eventCompare } from '~/storage/stores/utils';

const PRUNE_SIZE_LIMIT_DEFAULT = 100;

/**
 * Generates a unique key used to store a SignerAdd message key in the SignerAdds set index
 *
 * @param fid farcaster id of the user who created the Signer
 * @param signerPubKey the EdDSA public key of the signer
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<signerPubKey?>
 */
const makeSignerAddsKey = (fid: number, signerPubKey?: Uint8Array): Buffer => {
  return Buffer.concat([
    makeUserKey(fid),
    Buffer.from([UserPostfix.SignerAdds]),
    signerPubKey ? Buffer.from(signerPubKey) : new Uint8Array(),
  ]);
};

/**
 * Generates a unique key used to store a SignerRemove message key in the SignerRemoves set index
 *
 * @param fid farcaster id of the user who created the Signer
 * @param signerPubKey the EdDSA public key of the signer
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<signerPubKey?>
 */
const makeSignerRemovesKey = (fid: number, signerPubKey?: Uint8Array): Buffer => {
  return Buffer.concat([
    makeUserKey(fid),
    Buffer.from([UserPostfix.SignerRemoves]),
    signerPubKey ? Buffer.from(signerPubKey) : new Uint8Array(),
  ]);
};

/**
 * SignerStore persists Signer Messages in RocksDB using a series of two-phase CRDT sets
 * to guarantee eventual consistency.
 *
 * A Signer is an EdDSA key-pair that is authorized to sign Messages on behalf of a user. They can
 * be added with a SignerAdd message that is signed by the user's custody address. Signers that are
 * signed by the custody address that currently holds the fid are considered active. All other
 * Farcaster Messages must be signed by an active signer. Signers can be removed with a
 * SignerRemove message signed by the user's custody address. Removing a signer also removes all
 *  messages signed by it, and should only be invoked if a compromise is suspected.
 *
 * The SignerStore has a two-phase CRDT set for each custody address, which keeps tracks of its
 * signers. It  stores the current custody address as a single key in the database which can be
 * used to look up the two-phase set that corresponds to the active signers. SignerMessages can
 * collide if they have the same user fid, custody address and public key. Collisions between
 * Signer messages are resolved with Last-Write-Wins + Remove-Wins rules as follows:
 *
 * 1. Highest timestamp wins
 * 2. Remove wins over Adds
 * 3. Highest lexicographic hash wins
 *
 * The key-value entries created by the Signer Store are:
 *
 * 1. fid:tsHash -> signer message
 * 2. fid:set:signerAddress -> fid:tsHash (Set Index)
 */
class SignerStore {
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

  /** Returns the most recent event from the IdRegistry contract that affected the fid  */
  async getIdRegistryEvent(fid: number): Promise<protobufs.IdRegistryEvent> {
    return getIdRegistryEvent(this._db, fid);
  }

  /**
   * Finds a SignerAdd Message by checking the adds-set's index for a user's custody address
   *
   * @param fid fid of the user who created the SignerAdd
   * @param signerPubKey the EdDSA public key of the signer
   * @returns the SignerAdd Model if it exists, throws Error otherwise
   */
  async getSignerAdd(fid: number, signer: Uint8Array): Promise<protobufs.SignerAddMessage> {
    const addKey = makeSignerAddsKey(fid, signer);
    const messageTsHash = await this._db.get(addKey);
    return getMessage(this._db, fid, UserPostfix.SignerMessage, messageTsHash);
  }

  /**
   * Finds a SignerRemove Message by checking the remove-set's index for a user's custody address
   *
   * @param fid fid of the user who created the SignerRemove
   * @param signer the EdDSA public key of the signer
   * @returns the SignerRemove message if it exists, throws HubError otherwise
   */
  async getSignerRemove(fid: number, signer: Uint8Array): Promise<protobufs.SignerRemoveMessage> {
    const removeKey = makeSignerRemovesKey(fid, signer);
    const messageTsHash = await this._db.get(removeKey);
    return getMessage(this._db, fid, UserPostfix.SignerMessage, messageTsHash);
  }

  /**
   * Finds all SignerAdd messages for a user's custody address
   *
   * @param fid fid of the user who created the signers
   * @returns the SignerAdd messages if it exists, throws HubError otherwise
   */
  async getSignerAddsByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<protobufs.SignerAddMessage>> {
    const signerMessagesPrefix = makeMessagePrimaryKey(fid, UserPostfix.SignerMessage);
    return getMessagesPageByPrefix(this._db, signerMessagesPrefix, protobufs.isSignerAddMessage, pageOptions);
  }

  /**
   * Finds all SignerRemove messages for a user's custody address
   *
   * @param fid fid of the user who created the signers
   * @returns the SignerRemove messages if it exists, throws HubError otherwise
   */
  async getSignerRemovesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<protobufs.SignerRemoveMessage>> {
    const signerMessagesPrefix = makeMessagePrimaryKey(fid, UserPostfix.SignerMessage);
    return getMessagesPageByPrefix(this._db, signerMessagesPrefix, protobufs.isSignerRemoveMessage, pageOptions);
  }

  async getAllSignerMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<protobufs.SignerAddMessage | protobufs.SignerRemoveMessage>> {
    const signerMessagesPrefix = makeMessagePrimaryKey(fid, UserPostfix.SignerMessage);
    const filter = (
      message: protobufs.Message
    ): message is protobufs.SignerAddMessage | protobufs.SignerRemoveMessage => {
      return protobufs.isSignerAddMessage(message) || protobufs.isSignerRemoveMessage(message);
    };
    return getMessagesPageByPrefix(this._db, signerMessagesPrefix, filter, pageOptions);
  }

  async getFids(pageOptions: PageOptions = {}): Promise<{
    fids: number[];
    nextPageToken: Uint8Array | undefined;
  }> {
    const prefix = Buffer.from([RootPrefix.IdRegistryEvent]);

    const startAfterKey = Buffer.concat([prefix, Buffer.from(pageOptions.pageToken ?? '')]);

    if (pageOptions.pageSize && pageOptions.pageSize > PAGE_SIZE_MAX) {
      throw new HubError('bad_request.invalid_param', `pageSize > ${PAGE_SIZE_MAX}`);
    }
    const limit = pageOptions.pageSize || PAGE_SIZE_MAX;

    const endKey = bytesIncrement(Uint8Array.from(prefix));
    if (endKey.isErr()) {
      throw endKey.error;
    }

    const fids: number[] = [];
    const iterator = this._db.iterator({
      gt: startAfterKey,
      lt: Buffer.from(endKey.value),
      keyAsBuffer: true,
      valueAsBuffer: true,
    });

    /** Custom to retrieve fid from key */
    const getNextIteratorRecord = (iterator: AbstractRocksDB.Iterator): Promise<[Buffer, number]> => {
      return new Promise((resolve, reject) => {
        iterator.next((err: Error | undefined, key: AbstractRocksDB.Bytes, value: AbstractRocksDB.Bytes) => {
          if (err || !value) {
            reject(err);
          } else {
            resolve([key as Buffer, Number((key as Buffer).readUint32BE(1))]);
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

      const [key, fid] = result.value;
      lastPageToken = Uint8Array.from(key.subarray(prefix.length));
      fids.push(fid);
    } while (fids.length < limit);

    if (!iteratorFinished) {
      return { fids, nextPageToken: lastPageToken };
    } else {
      return { fids, nextPageToken: undefined };
    }
  }

  /**
   * Merges a ContractEvent into the SignerStore, storing the causally latest event at the key:
   * <RootPrefix:User><fid><UserPostfix:IdRegistryEvent>
   */
  async mergeIdRegistryEvent(event: protobufs.IdRegistryEvent): Promise<number> {
    const existingEvent = await ResultAsync.fromPromise(this.getIdRegistryEvent(event.fid), () => undefined);
    if (existingEvent.isOk() && eventCompare(existingEvent.value, event) >= 0) {
      throw new HubError('bad_request.conflict', 'event conflicts with a more recent IdRegistryEvent');
    }

    let txn = putIdRegistryEventTransaction(this._db.transaction(), event);

    const hubEvent = this._eventHandler.makeMergeIdRegistryEvent(event);
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

  /** Merges a SignerAdd or SignerRemove message into the SignerStore */
  async merge(message: protobufs.Message): Promise<number> {
    if (!protobufs.isSignerAddMessage(message) && !protobufs.isSignerRemoveMessage(message)) {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }

    return this._mergeLock
      .acquire(
        message.data.fid.toString(),
        async () => {
          if (protobufs.isSignerAddMessage(message)) {
            return this.mergeAdd(message);
          } else if (protobufs.isSignerRemoveMessage(message)) {
            return this.mergeRemove(message);
          } else {
            throw new HubError('bad_request.validation_failure', 'invalid message type');
          }
        },
        { timeout: MERGE_TIMEOUT_DEFAULT }
      )
      .catch((e: Error) => {
        throw isHubError(e) ? e : new HubError('unavailable.storage_failure', e.message);
      });
  }

  async revokeMessagesBySigner(fid: number, signer: Uint8Array): HubAsyncResult<number[]> {
    // Get all SignerAdd messages signed by signer
    const signerAdds = await getAllMessagesBySigner<protobufs.SignerAddMessage>(
      this._db,
      fid,
      signer,
      protobufs.MessageType.SIGNER_ADD
    );

    // Get all SignerRemove messages signed by signer
    const signerRemoves = await getAllMessagesBySigner<protobufs.SignerRemoveMessage>(
      this._db,
      fid,
      signer,
      protobufs.MessageType.SIGNER_REMOVE
    );

    // Return if no messages found
    if (signerAdds.length === 0 && signerRemoves.length === 0) {
      return ok([]);
    }

    // Create a rocksdb transaction
    let txn = this._db.transaction();

    // Create list of events to broadcast
    const events: protobufs.RevokeMessageHubEvent[] = [];

    // Add a delete operation to the transaction for each SignerAdd
    for (const message of signerAdds) {
      txn = this.deleteSignerAddTransaction(txn, message);

      const event = this._eventHandler.makeRevokeMessage(message);
      if (event.isErr()) {
        throw event.error;
      }

      events.push(event.value);
      txn = putEventTransaction(txn, event.value);
    }

    // Add a delete operation to the transaction for each SignerRemove
    for (const message of signerRemoves) {
      txn = this.deleteSignerRemoveTransaction(txn, message);

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
    // Count number of SignerAdd and SignerRemove messages for this fid
    // TODO: persist this count to avoid having to retrieve it with each call
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.SignerMessage);
    let count = 0;
    for await (const [,] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      count = count + 1;
    }

    // Calculate the number of messages that need to be pruned, based on the store's size limit
    let sizeToPrune = count - this._pruneSizeLimit;

    // Keep track of the messages that get pruned so that we can emit pruneMessage events after the transaction settles
    const events: protobufs.PruneMessageHubEvent[] = [];

    // Create a rocksdb transaction to include all the mutations
    let pruneTxn = this._db.transaction();

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = getMessagesPruneIterator(this._db, fid, UserPostfix.SignerMessage);

    const getNextResult = () => ResultAsync.fromPromise(getNextMessageToPrune(pruneIterator), () => undefined);

    // For each message in order, prune it if the store is over the size limit
    let nextMessage = await getNextResult();
    while (nextMessage.isOk() && sizeToPrune > 0) {
      const message = nextMessage.value;

      // Add a delete operation to the transaction depending on the message type
      if (protobufs.isSignerAddMessage(message)) {
        pruneTxn = this.deleteSignerAddTransaction(pruneTxn, message);
      } else if (protobufs.isSignerRemoveMessage(message)) {
        pruneTxn = this.deleteSignerRemoveTransaction(pruneTxn, message);
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

      // For each of the pruned messages, emit a pruneMessage event
      this._eventHandler.broadcastEvents(events);
    }

    return ok(events.map((event) => event.id));
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: protobufs.SignerAddMessage): Promise<number> {
    const mergeConflicts = await this.getMergeConflicts(message);

    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add putSignerAdd operations to the RocksDB transaction
    txn = this.putSignerAddTransaction(txn, message);

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

  private async mergeRemove(message: protobufs.SignerRemoveMessage): Promise<number> {
    const mergeConflicts = await this.getMergeConflicts(message);

    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add putSignerRemove operations to the RocksDB transaction
    txn = this.putSignerRemoveTransaction(txn, message);

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

  private signerMessageCompare(
    aType: protobufs.MessageType.SIGNER_ADD | protobufs.MessageType.SIGNER_REMOVE,
    aTsHash: Uint8Array,
    bType: protobufs.MessageType.SIGNER_ADD | protobufs.MessageType.SIGNER_REMOVE,
    bTsHash: Uint8Array
  ): number {
    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    if (aType === protobufs.MessageType.SIGNER_REMOVE && bType === protobufs.MessageType.SIGNER_ADD) {
      return 1;
    } else if (aType === protobufs.MessageType.SIGNER_ADD && bType === protobufs.MessageType.SIGNER_REMOVE) {
      return -1;
    }

    // Compare hashes (last 4 bytes of tsHash) to break ties between messages of the same type and timestamp
    return bytesCompare(aTsHash.subarray(4), bTsHash.subarray(4));
  }

  /**
   * Determines the RocksDB keys that must be modified to settle merge conflicts as a result of adding a Signer to the Store.
   *
   * @returns a RocksDB transaction if keys must be added or removed, undefined otherwise
   */
  private async getMergeConflicts(
    message: protobufs.SignerAddMessage | protobufs.SignerRemoveMessage
  ): HubAsyncResult<(protobufs.SignerAddMessage | protobufs.SignerRemoveMessage)[]> {
    const conflicts: (protobufs.SignerAddMessage | protobufs.SignerRemoveMessage)[] = [];

    const signer = (message.data.signerAddBody ?? message.data.signerRemoveBody)?.signer;
    if (!signer) {
      return err(new HubError('bad_request.validation_failure', 'signer is missing'));
    }

    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Look up the remove tsHash for this signer
    const removeTsHash = await ResultAsync.fromPromise(
      this._db.get(makeSignerRemovesKey(message.data.fid, signer)),
      () => undefined
    );

    if (removeTsHash.isOk()) {
      const removeCompare = this.signerMessageCompare(
        protobufs.MessageType.SIGNER_REMOVE,
        removeTsHash.value,
        message.data.type,
        tsHash.value
      );
      if (removeCompare > 0) {
        return err(new HubError('bad_request.conflict', 'message conflicts with a more recent SignerRemove'));
      } else if (removeCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing remove has a lower order than the new message, retrieve the full
        // SignerRemove message and delete it as part of the RocksDB transaction
        const existingRemove = await getMessage<protobufs.SignerRemoveMessage>(
          this._db,
          message.data.fid,
          UserPostfix.SignerMessage,
          removeTsHash.value
        );
        conflicts.push(existingRemove);
      }
    }

    // Look up the add tsHash for this custody address and signer
    const addTsHash = await ResultAsync.fromPromise(
      this._db.get(makeSignerAddsKey(message.data.fid, signer)),
      () => undefined
    );

    if (addTsHash.isOk()) {
      const addCompare = this.signerMessageCompare(
        protobufs.MessageType.SIGNER_ADD,
        addTsHash.value,
        message.data.type,
        tsHash.value
      );
      if (addCompare > 0) {
        return err(new HubError('bad_request.conflict', 'message conflicts with a more recent SignerAdd'));
      } else if (addCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // SignerAdd message and delete it as part of the RocksDB transaction
        const existingAdd = await getMessage<protobufs.SignerAddMessage>(
          this._db,
          message.data.fid,
          UserPostfix.SignerMessage,
          addTsHash.value
        );
        conflicts.push(existingAdd);
      }
    }

    return ok(conflicts);
  }

  private deleteManyTransaction(
    txn: Transaction,
    messages: (protobufs.SignerAddMessage | protobufs.SignerRemoveMessage)[]
  ): Transaction {
    for (const message of messages) {
      if (protobufs.isSignerAddMessage(message)) {
        txn = this.deleteSignerAddTransaction(txn, message);
      } else if (protobufs.isSignerRemoveMessage(message)) {
        txn = this.deleteSignerRemoveTransaction(txn, message);
      }
    }
    return txn;
  }

  /* Builds a RocksDB transaction to insert a SignerAdd message and construct its indices */
  private putSignerAddTransaction(txn: Transaction, message: protobufs.SignerAddMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Put message and index by signer
    txn = putMessageTransaction(txn, message);

    // Put signerAdds index
    txn = txn.put(makeSignerAddsKey(message.data.fid, message.data.signerAddBody.signer), Buffer.from(tsHash.value));

    return txn;
  }

  /* Builds a RocksDB transaction to remove a SignerAdd message and delete its indices */
  private deleteSignerAddTransaction(txn: Transaction, message: protobufs.SignerAddMessage): Transaction {
    // Delete from signerAdds
    txn = txn.del(makeSignerAddsKey(message.data.fid, message.data.signerAddBody.signer));

    // Delete message
    return deleteMessageTransaction(txn, message);
  }

  /* Builds a RocksDB transaction to insert a SignerRemove message and construct its indices */
  private putSignerRemoveTransaction(txn: Transaction, message: protobufs.SignerRemoveMessage): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Put message and index by signer
    txn = putMessageTransaction(txn, message);

    // Put signerRemoves index
    txn = txn.put(
      makeSignerRemovesKey(message.data.fid, message.data.signerRemoveBody.signer),
      Buffer.from(tsHash.value)
    );

    return txn;
  }

  /* Builds a RocksDB transaction to remove a SignerRemove message and delete its indices */
  private deleteSignerRemoveTransaction(txn: Transaction, message: protobufs.SignerRemoveMessage): Transaction {
    // Delete from signerRemoves
    txn = txn.del(makeSignerRemovesKey(message.data.fid, message.data.signerRemoveBody.signer));

    // Delete message
    return deleteMessageTransaction(txn, message);
  }
}

export default SignerStore;
