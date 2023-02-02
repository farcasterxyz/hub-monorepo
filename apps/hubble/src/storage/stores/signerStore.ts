import * as protobufs from '@farcaster/grpc';
import { bytesCompare, HubAsyncResult, HubError } from '@farcaster/utils';
import { err, ok, ResultAsync } from 'neverthrow';
import {
  deleteMessageTransaction,
  getAllMessagesBySigner,
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
import { RootPrefix, UserPostfix } from '~/storage/db/types';
import SequentialMergeStore from '~/storage/stores/sequentialMergeStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { StorePruneOptions } from '~/storage/stores/types';
import { getIdRegistryEvent, putIdRegistryEvent } from '../db/idRegistryEvent';
import { eventCompare } from './utils';

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
class SignerStore extends SequentialMergeStore {
  private _db: RocksDB;
  private _eventHandler: StoreEventHandler;
  private _pruneSizeLimit: number;

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    super();

    this._db = db;
    this._eventHandler = eventHandler;
    this._pruneSizeLimit = options.pruneSizeLimit ?? PRUNE_SIZE_LIMIT_DEFAULT;
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
   * @returns the SignerRemove messages if it exists, throws HubError otherwise
   */
  async getSignerAddsByFid(fid: number): Promise<protobufs.SignerAddMessage[]> {
    const addsPrefix = makeSignerAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return getManyMessagesByFid(this._db, fid, UserPostfix.SignerMessage, messageKeys);
  }

  /**
   * Finds all SignerRemove Messages for a user's custody address
   *
   * @param fid fid of the user who created the signers
   * @returns the SignerRemove message if it exists, throws HubError otherwise
   */
  async getSignerRemovesByFid(fid: number): Promise<protobufs.SignerRemoveMessage[]> {
    const removesPrefix = makeSignerRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(removesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return getManyMessagesByFid(this._db, fid, UserPostfix.SignerMessage, messageKeys);
  }

  async getFids(): Promise<number[]> {
    const prefix = Buffer.from([RootPrefix.IdRegistryEvent]);
    const fids: number[] = [];
    for await (const [key] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      fids.push(Number((key as Buffer).readBigUint64BE(1)));
    }
    return fids;
  }

  /**
   * Merges a ContractEvent into the SignerStore, storing the causally latest event at the key:
   * <RootPrefix:User><fid><UserPostfix:IdRegistryEvent>
   */
  async mergeIdRegistryEvent(event: protobufs.IdRegistryEvent): Promise<void> {
    const existingEvent = await ResultAsync.fromPromise(this.getIdRegistryEvent(event.fid), () => undefined);
    if (existingEvent.isOk() && eventCompare(existingEvent.value, event) >= 0) {
      return undefined;
    }

    await putIdRegistryEvent(this._db, event);

    // Emit store event
    this._eventHandler.emit('mergeIdRegistryEvent', event);
  }

  /** Merges a SignerAdd or SignerRemove message into the SignerStore */
  async merge(message: protobufs.Message): Promise<void> {
    if (!protobufs.isSignerAddMessage(message) && !protobufs.isSignerRemoveMessage(message)) {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }

    const mergeResult = await this.mergeSequential(message);
    if (mergeResult.isErr()) {
      throw mergeResult.error;
    }

    return mergeResult.value;
  }

  async revokeMessagesBySigner(fid: number, signer: Uint8Array): HubAsyncResult<void> {
    // Get all SignerAdd messages signed by signer
    const signerAdds = await getAllMessagesBySigner<protobufs.SignerAddMessage>(
      this._db,
      fid,
      signer,
      protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD
    );

    // Get all SignerRemove messages signed by signer
    const signerRemoves = await getAllMessagesBySigner<protobufs.SignerRemoveMessage>(
      this._db,
      fid,
      signer,
      protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE
    );

    // Return if no messages found
    if (signerAdds.length === 0 && signerRemoves.length === 0) {
      return ok(undefined);
    }

    // Create a rocksdb transaction
    let txn = this._db.transaction();

    // Add a delete operation to the transaction for each SignerAdd
    for (const message of signerAdds) {
      txn = this.deleteSignerAddTransaction(txn, message);
    }

    // Add a delete operation to the transaction for each SignerRemove
    for (const message of signerRemoves) {
      txn = this.deleteSignerRemoveTransaction(txn, message);
    }

    await this._db.commit(txn);

    // Emit a revokeMessage event for each message
    for (const message of [...signerAdds, ...signerRemoves]) {
      this._eventHandler.emit('revokeMessage', message);
    }

    return ok(undefined);
  }

  async pruneMessages(fid: number): HubAsyncResult<void> {
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
    const messageToPrune: (protobufs.SignerAddMessage | protobufs.SignerRemoveMessage)[] = [];

    // Create a rocksdb transaction to include all the mutations
    let pruneTsx = this._db.transaction();

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = getMessagesPruneIterator(this._db, fid, UserPostfix.SignerMessage);

    const getNextResult = () => ResultAsync.fromPromise(getNextMessageToPrune(pruneIterator), () => undefined);

    // For each message in order, prune it if the store is over the size limit
    let nextMessage = await getNextResult();
    while (nextMessage.isOk() && sizeToPrune > 0) {
      const message = nextMessage.value;

      // Add a delete operation to the transaction depending on the message type
      if (protobufs.isSignerAddMessage(message)) {
        pruneTsx = this.deleteSignerAddTransaction(pruneTsx, message);
      } else if (protobufs.isSignerRemoveMessage(message)) {
        pruneTsx = this.deleteSignerRemoveTransaction(pruneTsx, message);
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

  protected async mergeFromSequentialQueue(message: protobufs.Message): Promise<void> {
    if (protobufs.isSignerAddMessage(message)) {
      return this.mergeAdd(message);
    } else if (protobufs.isSignerRemoveMessage(message)) {
      return this.mergeRemove(message);
    } else {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: protobufs.SignerAddMessage): Promise<void> {
    const mergeConflicts = await this.getMergeConflicts(message);

    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add putSignerAdd operations to the RocksDB transaction
    txn = this.putSignerAddTransaction(txn, message);

    // Commit the RocksDB transaction
    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message, mergeConflicts.value);
  }

  private async mergeRemove(message: protobufs.SignerRemoveMessage): Promise<void> {
    const mergeConflicts = await this.getMergeConflicts(message);

    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add putSignerRemove operations to the RocksDB transaction
    txn = this.putSignerRemoveTransaction(txn, message);

    // Commit the RocksDB transaction
    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message, mergeConflicts.value);
  }

  private signerMessageCompare(
    aType: protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD | protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE,
    aTsHash: Uint8Array,
    bType: protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD | protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE,
    bTsHash: Uint8Array
  ): number {
    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    if (
      aType === protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE &&
      bType === protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD
    ) {
      return 1;
    } else if (
      aType === protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD &&
      bType === protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE
    ) {
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

    const signer = message.data.signerBody.signer;
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
        protobufs.MessageType.MESSAGE_TYPE_SIGNER_REMOVE,
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
        protobufs.MessageType.MESSAGE_TYPE_SIGNER_ADD,
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
    txn = txn.put(makeSignerAddsKey(message.data.fid, message.data.signerBody.signer), Buffer.from(tsHash.value));

    return txn;
  }

  /* Builds a RocksDB transaction to remove a SignerAdd message and delete its indices */
  private deleteSignerAddTransaction(txn: Transaction, message: protobufs.SignerAddMessage): Transaction {
    // Delete from signerAdds
    txn = txn.del(makeSignerAddsKey(message.data.fid, message.data.signerBody.signer));

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
    txn = txn.put(makeSignerRemovesKey(message.data.fid, message.data.signerBody.signer), Buffer.from(tsHash.value));

    return txn;
  }

  /* Builds a RocksDB transaction to remove a SignerRemove message and delete its indices */
  private deleteSignerRemoveTransaction(txn: Transaction, message: protobufs.SignerRemoveMessage): Transaction {
    // Delete from signerRemoves
    txn = txn.del(makeSignerRemovesKey(message.data.fid, message.data.signerBody.signer));

    // Delete message
    return deleteMessageTransaction(txn, message);
  }
}

export default SignerStore;
