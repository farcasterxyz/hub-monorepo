import * as protobufs from '@farcaster/grpc';
import { bytesCompare, HubAsyncResult, HubError } from '@farcaster/utils';
import { err, ok, ResultAsync } from 'neverthrow';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import SequentialMergeStore from '~/storage/stores/sequentialMergeStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
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
} from '../db/message';
import { UserPostfix } from '../db/types';
import { StorePruneOptions } from './types';

const PRUNE_SIZE_LIMIT_DEFAULT = 50;

/**
 * Generates a unique key used to store a VerificationAdds message key in the VerificationsAdds
 * set index
 *
 * @param fid farcaster id of the user who created the verification
 * @param address Ethereum address being verified
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<address?>
 */
const makeVerificationAddsKey = (fid: number, address?: Uint8Array): Buffer => {
  return Buffer.concat([makeUserKey(fid), Buffer.from([UserPostfix.VerificationAdds]), Buffer.from(address ?? '')]);
};

/**
 * Generates a unique key used to store a VerificationAdd message key in the VerificationRemoves
 * set index
 *
 * @param fid farcaster id of the user who created the verification
 * @param address Ethereum address being verified
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<targetKey?>:<type?>
 */
const makeVerificationRemovesKey = (fid: number, address?: Uint8Array): Buffer => {
  return Buffer.concat([makeUserKey(fid), Buffer.from([UserPostfix.VerificationRemoves]), Buffer.from(address ?? '')]);
};

/**
 * VerificationStore persists VerificationMessages in RocksDB using a two-phase CRDT set to
 * guarantee eventual consistency.
 *
 * A Verification is performed by an fid on a target (e.g. Ethereum address) and may have an
 * ordinality. Verifications are added with type specific messages like VerificationAddEthAddress
 * but are removed with a generic VerificationRemove message that points to the unique id of the
 * Add.
 *
 * Verification messages can collide if two messages have the same user fid and address. Collisions
 *are resolved with Last-Write-Wins + Remove-Wins rules as follows:
 *
 * 1. Highest timestamp wins
 * 2. Remove wins over Adds
 * 3. Highest lexicographic hash wins
 *
 * VerificationAddEthAddress is currently the only supported Verification type today. The key-value
 * entries created by Verification Store are:
 *
 * 1. fid:tsHash -> verification message
 * 2. fid:set:address -> fid:tsHash (Set Index)
 */

class VerificationStore extends SequentialMergeStore {
  private _db: RocksDB;
  private _eventHandler: StoreEventHandler;
  private _pruneSizeLimit: number;

  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    super();

    this._db = db;
    this._eventHandler = eventHandler;
    this._pruneSizeLimit = options.pruneSizeLimit ?? PRUNE_SIZE_LIMIT_DEFAULT;
  }

  /**
   * Finds a VerificationAdds Message by checking the adds-set's index
   *
   * @param fid fid of the user who created the SignerAdd
   * @param address the address being verified
   *
   * @returns the VerificationAddEthAddressModel if it exists, throws HubError otherwise
   */
  async getVerificationAdd(fid: number, address: Uint8Array): Promise<protobufs.VerificationAddEthAddressMessage> {
    const addsKey = makeVerificationAddsKey(fid, address);
    const messageTsHash = await this._db.get(addsKey);
    return getMessage<protobufs.VerificationAddEthAddressMessage>(
      this._db,
      fid,
      UserPostfix.VerificationMessage,
      messageTsHash
    );
  }

  /**
   * Finds a VerificationsRemove Message by checking the remove-set's index
   *
   * @param fid fid of the user who created the SignerAdd
   * @param address the address being verified
   * @returns the VerificationRemoveEthAddress if it exists, throws HubError otherwise
   */
  async getVerificationRemove(fid: number, address: Uint8Array): Promise<protobufs.VerificationRemoveMessage> {
    const removesKey = makeVerificationRemovesKey(fid, address);
    const messageTsHash = await this._db.get(removesKey);
    return getMessage<protobufs.VerificationRemoveMessage>(
      this._db,
      fid,
      UserPostfix.VerificationMessage,
      messageTsHash
    );
  }

  /**
   * Finds all VerificationAdds messages for a user
   *
   * @param fid fid of the user who created the signers
   * @returns the VerificationAddEthAddresses if they exists, throws HubError otherwise
   */
  async getVerificationAddsByFid(fid: number): Promise<protobufs.VerificationAddEthAddressMessage[]> {
    const addsPrefix = makeVerificationAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return getManyMessagesByFid<protobufs.VerificationAddEthAddressMessage>(
      this._db,
      fid,
      UserPostfix.VerificationMessage,
      messageKeys
    );
  }

  /**
   * Finds all VerificationRemoves messages for a user
   *
   * @param fid fid of the user who created the signers
   * @returns the VerificationRemoves messages if it exists, throws HubError otherwise
   */
  async getVerificationRemovesByFid(fid: number): Promise<protobufs.VerificationRemoveMessage[]> {
    const removesPrefix = makeVerificationRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(removesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return getManyMessagesByFid<protobufs.VerificationRemoveMessage>(
      this._db,
      fid,
      UserPostfix.VerificationMessage,
      messageKeys
    );
  }

  /** Merge a VerificationAdd or VerificationRemove message into the VerificationStore */
  async merge(message: protobufs.Message): Promise<void> {
    if (!protobufs.isVerificationRemoveMessage(message) && !protobufs.isVerificationAddEthAddressMessage(message)) {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }

    const mergeResult = await this.mergeSequential(message);
    if (mergeResult.isErr()) {
      throw mergeResult.error;
    }

    return mergeResult.value;
  }

  async revokeMessagesBySigner(fid: number, signer: Uint8Array): HubAsyncResult<void> {
    // Get all VerificationAddEthAddress messages signed by signer
    const verificationAdds = await getAllMessagesBySigner<protobufs.VerificationAddEthAddressMessage>(
      this._db,
      fid,
      signer,
      protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS
    );

    // Get all VerificationRemove messages signed by signer
    const castRemoves = await getAllMessagesBySigner<protobufs.VerificationRemoveMessage>(
      this._db,
      fid,
      signer,
      protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE
    );

    // Create a rocksdb transaction
    let txn = this._db.transaction();

    // Add a delete operation to the transaction for each VerificationAddEthAddress
    for (const message of verificationAdds) {
      txn = this.deleteVerificationAddTransaction(txn, message);
    }

    // Add a delete operation to the transaction for each SignerRemove
    for (const message of castRemoves) {
      txn = this.deleteVerificationRemoveTransaction(txn, message);
    }

    await this._db.commit(txn);

    // Emit a revokeMessage event for each message
    for (const message of [...verificationAdds, ...castRemoves]) {
      this._eventHandler.emit('revokeMessage', message);
    }

    return ok(undefined);
  }

  async pruneMessages(fid: number): HubAsyncResult<void> {
    // Count number of verification messages for this fid
    // TODO: persist this count to avoid having to retrieve it with each call
    const prefix = makeMessagePrimaryKey(fid, UserPostfix.VerificationMessage);
    let count = 0;
    for await (const [,] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      count = count + 1;
    }

    // Calculate the number of messages that need to be pruned, based on the store's size limit
    let sizeToPrune = count - this._pruneSizeLimit;

    // Keep track of the messages that get pruned so that we can emit pruneMessage events after the transaction settles
    const messageToPrune: (protobufs.VerificationAddEthAddressMessage | protobufs.VerificationRemoveMessage)[] = [];

    // Create a rocksdb transaction to include all the mutations
    let pruneTsx = this._db.transaction();

    // Create a rocksdb iterator for all messages with the given prefix
    const pruneIterator = getMessagesPruneIterator(this._db, fid, UserPostfix.VerificationMessage);

    const getNextResult = () => ResultAsync.fromPromise(getNextMessageToPrune(pruneIterator), () => undefined);

    // For each message in order, prune it if the store is over the size limit
    let nextMessage = await getNextResult();
    while (nextMessage.isOk() && sizeToPrune > 0) {
      const message = nextMessage.value;

      // Add a delete operation to the transaction depending on the message type
      if (protobufs.isVerificationAddEthAddressMessage(message)) {
        pruneTsx = this.deleteVerificationAddTransaction(pruneTsx, message);
      } else if (protobufs.isVerificationRemoveMessage(message)) {
        pruneTsx = this.deleteVerificationRemoveTransaction(pruneTsx, message);
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
    if (protobufs.isVerificationAddEthAddressMessage(message)) {
      return this.mergeAdd(message);
    } else if (protobufs.isVerificationRemoveMessage(message)) {
      return this.mergeRemove(message);
    } else {
      throw new HubError('bad_request.validation_failure', 'invalid message type');
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: protobufs.VerificationAddEthAddressMessage): Promise<void> {
    // Define address for lookups
    const address = message.data.verificationAddEthAddressBody.address;
    if (!address) {
      throw new HubError('bad_request.validation_failure', 'address was missing');
    }

    const mergeConflicts = await this.getMergeConflicts(address, message);
    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add putVerificationAdd operations to the RocksDB transaction
    txn = this.putVerificationAddTransaction(txn, message);

    // Commit the RocksDB transaction
    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message, mergeConflicts.value);
  }

  private async mergeRemove(message: protobufs.VerificationRemoveMessage): Promise<void> {
    // Define address for lookups
    const address = message.data.verificationRemoveBody.address;
    if (!address) {
      throw new HubError('bad_request.validation_failure', 'address was missing');
    }

    const mergeConflicts = await this.getMergeConflicts(address, message);
    if (mergeConflicts.isErr()) {
      throw mergeConflicts.error;
    }

    // Create rocksdb transaction to delete the merge conflicts
    let txn = this.deleteManyTransaction(this._db.transaction(), mergeConflicts.value);

    // Add putVerificationRemove operations to the RocksDB transaction
    txn = this.putVerificationRemoveTransaction(txn, message);

    // Commit the RocksDB transaction
    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message, mergeConflicts.value);
  }

  private verificationMessageCompare(
    aType:
      | protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS
      | protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE,
    aTsHash: Uint8Array,
    bType:
      | protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS
      | protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE,
    bTsHash: Uint8Array
  ): number {
    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    if (
      aType === protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE &&
      bType === protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS
    ) {
      return 1;
    } else if (
      aType === protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS &&
      bType === protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE
    ) {
      return -1;
    }

    // Compare hashes (last 4 bytes of tsHash) to break ties between messages of the same type and timestamp
    return bytesCompare(aTsHash.subarray(4), bTsHash.subarray(4));
  }

  private async getMergeConflicts(
    address: Uint8Array,
    message: protobufs.VerificationAddEthAddressMessage | protobufs.VerificationRemoveMessage
  ): HubAsyncResult<(protobufs.VerificationAddEthAddressMessage | protobufs.VerificationRemoveMessage)[]> {
    const conflicts: (protobufs.VerificationAddEthAddressMessage | protobufs.VerificationRemoveMessage)[] = [];

    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      return err(tsHash.error);
    }

    // Look up the remove tsHash for this address
    const removeTsHash = await ResultAsync.fromPromise(
      this._db.get(makeVerificationRemovesKey(message.data.fid, address)),
      () => undefined
    );

    if (removeTsHash.isOk()) {
      const removeCompare = this.verificationMessageCompare(
        protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_REMOVE,
        removeTsHash.value,
        message.data.type,
        tsHash.value
      );
      if (removeCompare > 0) {
        return err(new HubError('bad_request.conflict', 'message conflicts with a more recent VerificationRemove'));
      } else if (removeCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing remove has a lower order than the new message, retrieve the full
        // VerificationRemove message and delete it as part of the RocksDB transaction
        const existingRemove = await getMessage<protobufs.VerificationRemoveMessage>(
          this._db,
          message.data.fid,
          UserPostfix.VerificationMessage,
          removeTsHash.value
        );
        conflicts.push(existingRemove);
      }
    }

    // Look up the add tsHash for this address
    const addTsHash = await ResultAsync.fromPromise(
      this._db.get(makeVerificationAddsKey(message.data.fid, address)),
      () => undefined
    );

    if (addTsHash.isOk()) {
      const addCompare = this.verificationMessageCompare(
        protobufs.MessageType.MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS,
        addTsHash.value,
        message.data.type,
        tsHash.value
      );
      if (addCompare > 0) {
        return err(
          new HubError('bad_request.conflict', 'message conflicts with a more recent VerificationAddEthAddress')
        );
      } else if (addCompare === 0) {
        return err(new HubError('bad_request.duplicate', 'message has already been merged'));
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // VerificationAdd* message and delete it as part of the RocksDB transaction
        const existingAdd = await getMessage<protobufs.VerificationAddEthAddressMessage>(
          this._db,
          message.data.fid,
          UserPostfix.VerificationMessage,
          addTsHash.value
        );
        conflicts.push(existingAdd);
      }
    }

    return ok(conflicts);
  }

  private deleteManyTransaction(
    txn: Transaction,
    messages: (protobufs.VerificationAddEthAddressMessage | protobufs.VerificationRemoveMessage)[]
  ): Transaction {
    for (const message of messages) {
      if (protobufs.isVerificationAddEthAddressMessage(message)) {
        txn = this.deleteVerificationAddTransaction(txn, message);
      } else if (protobufs.isVerificationRemoveMessage(message)) {
        txn = this.deleteVerificationRemoveTransaction(txn, message);
      }
    }
    return txn;
  }

  private putVerificationAddTransaction(
    txn: Transaction,
    message: protobufs.VerificationAddEthAddressMessage
  ): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Put message and index by signer
    txn = putMessageTransaction(txn, message);

    // Put verificationAdds index
    txn = txn.put(
      makeVerificationAddsKey(message.data.fid, message.data.verificationAddEthAddressBody.address),
      Buffer.from(tsHash.value)
    );

    return txn;
  }

  private deleteVerificationAddTransaction(
    txn: Transaction,
    message: protobufs.VerificationAddEthAddressMessage
  ): Transaction {
    // Delete from verificationAdds
    txn = txn.del(makeVerificationAddsKey(message.data.fid, message.data.verificationAddEthAddressBody.address));

    // Delete message
    return deleteMessageTransaction(txn, message);
  }

  private putVerificationRemoveTransaction(
    txn: Transaction,
    message: protobufs.VerificationRemoveMessage
  ): Transaction {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);
    if (tsHash.isErr()) {
      throw tsHash.error;
    }

    // Add to db
    txn = putMessageTransaction(txn, message);

    // Add to verificationRemoves
    txn = txn.put(
      makeVerificationRemovesKey(message.data.fid, message.data.verificationRemoveBody.address),
      Buffer.from(tsHash.value)
    );

    return txn;
  }

  private deleteVerificationRemoveTransaction(
    txn: Transaction,
    message: protobufs.VerificationRemoveMessage
  ): Transaction {
    // Delete from verificationRemoves
    txn = txn.del(makeVerificationRemovesKey(message.data.fid, message.data.verificationRemoveBody.address));

    // Delete message
    return deleteMessageTransaction(txn, message);
  }
}

export default VerificationStore;
