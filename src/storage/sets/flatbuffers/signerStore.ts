import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { ResultAsync, ok } from 'neverthrow';
import { SignerAddModel, UserPostfix, SignerRemoveModel, RootPrefix } from '~/storage/flatbuffers/types';
import { isSignerAdd, isSignerRemove } from '~/storage/flatbuffers/typeguards';
import { bytesCompare } from '~/storage/flatbuffers/utils';
import { MessageType } from '~/utils/generated/message_generated';
import ContractEventModel from '~/storage/flatbuffers/contractEventModel';
import { HubAsyncResult, HubError } from '~/utils/hubErrors';
import StoreEventHandler from '~/storage/sets/flatbuffers/storeEventHandler';

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

  constructor(db: RocksDB, eventHandler: StoreEventHandler) {
    this._db = db;
    this._eventHandler = eventHandler;
  }

  /**
   * Generates a unique key used to store a SignerAdd message key in the SignerAdds set index
   *
   * @param fid farcaster id of the user who created the Signer
   * @param signerPubKey the EdDSA public key of the signer
   *
   * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<signerPubKey?>
   */
  static signerAddsKey(fid: Uint8Array, signerPubKey?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.SignerAdds]),
      signerPubKey ? Buffer.from(signerPubKey) : new Uint8Array(),
    ]);
  }

  /**
   * Generates a unique key used to store a SignerRemove message key in the SignerRemoves set index
   *
   * @param fid farcaster id of the user who created the Signer
   * @param signerPubKey the EdDSA public key of the signer
   *
   * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<signerPubKey?>
   */
  static signerRemovesKey(fid: Uint8Array, signerPubKey?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.SignerRemoves]),
      signerPubKey ? Buffer.from(signerPubKey) : new Uint8Array(),
    ]);
  }

  /** Returns the most recent event from the IdRegistry contract that affected the fid  */
  async getCustodyEvent(fid: Uint8Array): Promise<ContractEventModel> {
    return ContractEventModel.get(this._db, fid);
  }

  /** Returns the custody address that currently owns an fid */
  async getCustodyAddress(fid: Uint8Array): Promise<Uint8Array> {
    const idRegistryEvent = await this.getCustodyEvent(fid);
    return idRegistryEvent.to();
  }

  //TODO: When implementing the Result type consider refactoring these methods into separate ones
  // for active vs. all signers

  /**
   * Finds a SignerAdd Message by checking the adds-set's index for a user's custody address
   *
   * @param fid fid of the user who created the SignerAdd
   * @param signerPubKey the EdDSA public key of the signer
   * @returns the SignerAdd Model if it exists, throws Error otherwise
   */
  async getSignerAdd(fid: Uint8Array, signerPubKey: Uint8Array): Promise<SignerAddModel> {
    const messageTsHash = await this._db.get(SignerStore.signerAddsKey(fid, signerPubKey));
    return MessageModel.get<SignerAddModel>(this._db, fid, UserPostfix.SignerMessage, messageTsHash);
  }

  /**
   * Finds a SignerRemove Message by checking the remove-set's index for a user's custody address
   *
   * @param fid fid of the user who created the SignerRemove
   * @param signer the EdDSA public key of the signer
   * @returns the SignerRemove message if it exists, throws HubError otherwise
   */
  async getSignerRemove(fid: Uint8Array, signer: Uint8Array): Promise<SignerRemoveModel> {
    const messageTsHash = await this._db.get(SignerStore.signerRemovesKey(fid, signer));
    return MessageModel.get<SignerRemoveModel>(this._db, fid, UserPostfix.SignerMessage, messageTsHash);
  }

  //TODO: When implementing the Result type consider refactoring these methods into separate ones
  // for active vs. all signers

  /**
   * Finds all SignerAdd messages for a user's custody address
   *
   * @param fid fid of the user who created the signers
   * @returns the SignerRemove messages if it exists, throws HubError otherwise
   */
  async getSignerAddsByUser(fid: Uint8Array): Promise<SignerAddModel[]> {
    const addsPrefix = SignerStore.signerAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<SignerAddModel>(this._db, fid, UserPostfix.SignerMessage, messageKeys);
  }

  /**
   * Finds all SignerRemove Messages for a user's custody address
   *
   * @param fid fid of the user who created the signers
   * @returns the SignerRemove message if it exists, throws HubError otherwise
   */
  async getSignerRemovesByUser(fid: Uint8Array): Promise<SignerRemoveModel[]> {
    const removesPrefix = SignerStore.signerRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(removesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<SignerRemoveModel>(this._db, fid, UserPostfix.SignerMessage, messageKeys);
  }

  async getFids(): Promise<Uint8Array[]> {
    const prefix = Buffer.from([RootPrefix.CustodyEvent]);
    const fids: Uint8Array[] = [];
    for await (const [key] of this._db.iteratorByPrefix(prefix, { keyAsBuffer: true, values: false })) {
      fids.push(new Uint8Array(key.slice(prefix.length)));
    }
    return fids;
  }

  /**
   * Merges a ContractEvent into the SignerStore, storing the causally latest event at the key:
   * <RootPrefix:User><fid><UserPostfix:IdRegistryEvent>
   */
  async mergeIdRegistryEvent(event: ContractEventModel): Promise<void> {
    // TODO: emit signer change events as a result of ID Registry events
    const existingEvent = await ResultAsync.fromPromise(this.getCustodyEvent(event.fid()), () => undefined);
    if (existingEvent.isOk() && this.eventCompare(existingEvent.value, event) >= 0) {
      return undefined;
    }

    const txn = this._db.transaction();
    txn.put(event.primaryKey(), event.toBuffer());
    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeContractEvent', event);
  }

  /** Merges a SignerAdd or SignerRemove message into the SignerStore */
  async merge(message: MessageModel): Promise<void> {
    if (isSignerRemove(message)) {
      return this.mergeRemove(message);
    }

    if (isSignerAdd(message)) {
      return this.mergeAdd(message);
    }

    throw new HubError('bad_request.validation_failure', 'invalid message type');
  }

  async revokeMessagesBySigner(fid: Uint8Array, signer: Uint8Array): HubAsyncResult<void> {
    // Get all SignerAdd messages signed by signer
    const signerAdds = await MessageModel.getAllBySigner<SignerAddModel>(this._db, fid, signer, MessageType.SignerAdd);

    // Get all SignerRemove messages signed by signer
    const signerRemoves = await MessageModel.getAllBySigner<SignerRemoveModel>(
      this._db,
      fid,
      signer,
      MessageType.SignerRemove
    );

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

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private eventCompare(a: ContractEventModel, b: ContractEventModel): number {
    // Compare blockNumber
    if (a.blockNumber() < b.blockNumber()) {
      return -1;
    } else if (a.blockNumber() > b.blockNumber()) {
      return 1;
    }

    // Cannot happen unless we do not filter out uncle blocks correctly upstream
    if (bytesCompare(a.blockHash(), b.blockHash()) !== 0) {
      throw new HubError('bad_request.validation_failure', 'block hash mismatch');
    }

    // Compare logIndex
    if (a.logIndex() < b.logIndex()) {
      return -1;
    } else if (a.logIndex() > b.logIndex()) {
      return 1;
    }

    // Cannot happen unless we pass in malformed data
    if (bytesCompare(a.transactionHash(), b.transactionHash()) !== 0) {
      throw new HubError('bad_request.validation_failure', 'tx hash mismatch');
    }

    return 0;
  }

  private async mergeAdd(message: SignerAddModel): Promise<void> {
    let txn = await this.resolveMergeConflicts(this._db.transaction(), message);

    // No-op if resolveMergeConflicts did not return a transaction
    if (!txn) return undefined;

    // Add putSignerAdd operations to the RocksDB transaction
    txn = this.putSignerAddTransaction(txn, message);

    // Commit the RocksDB transaction
    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message);
  }

  private async mergeRemove(message: SignerRemoveModel): Promise<void> {
    let txn = await this.resolveMergeConflicts(this._db.transaction(), message);

    // No-op if resolveMergeConflicts did not return a transaction
    if (!txn) return undefined;

    // Add putSignerRemove operations to the RocksDB transaction
    txn = this.putSignerRemoveTransaction(txn, message);

    // Commit the RocksDB transaction
    await this._db.commit(txn);

    // Emit store event
    this._eventHandler.emit('mergeMessage', message);
  }

  private signerMessageCompare(
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

    if (aType === MessageType.SignerRemove && bType === MessageType.SignerAdd) {
      return 1;
    } else if (aType === MessageType.SignerAdd && bType === MessageType.SignerRemove) {
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
  private async resolveMergeConflicts(
    txn: Transaction,
    message: SignerAddModel | SignerRemoveModel
  ): Promise<Transaction | undefined> {
    const signer = message.body().signerArray();
    if (!signer) {
      throw new HubError('bad_request.validation_failure', 'signer was missing');
    }

    // Look up the remove tsHash for this custody address and signer
    const removeTsHash = await ResultAsync.fromPromise(
      this._db.get(SignerStore.signerRemovesKey(message.fid(), signer)),
      () => undefined
    );

    if (removeTsHash.isOk()) {
      if (
        this.signerMessageCompare(MessageType.SignerRemove, removeTsHash.value, message.type(), message.tsHash()) >= 0
      ) {
        // If the existing remove has the same or higher order than the new message, no-op
        return undefined;
      } else {
        // If the existing remove has a lower order than the new message, retrieve the full
        // SignerRemove message and delete it as part of the RocksDB transaction
        const existingRemove = await MessageModel.get<SignerRemoveModel>(
          this._db,
          message.fid(),
          UserPostfix.SignerMessage,
          removeTsHash.value
        );
        txn = this.deleteSignerRemoveTransaction(txn, existingRemove);
      }
    }

    // Look up the add tsHash for this custody address and signer
    const addTsHash = await ResultAsync.fromPromise(
      this._db.get(SignerStore.signerAddsKey(message.fid(), signer)),
      () => undefined
    );

    if (addTsHash.isOk()) {
      if (this.signerMessageCompare(MessageType.SignerAdd, addTsHash.value, message.type(), message.tsHash()) >= 0) {
        // If the existing add has the same or higher order than the new message, no-op
        return undefined;
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // SignerAdd message and delete it as part of the RocksDB transaction
        const existingAdd = await MessageModel.get<SignerAddModel>(
          this._db,
          message.fid(),
          UserPostfix.SignerMessage,
          addTsHash.value
        );
        txn = this.deleteSignerAddTransaction(txn, existingAdd);
      }
    }

    return txn;
  }

  /* Builds a RocksDB transaction to insert a SignerAdd message and construct its indices */
  private putSignerAddTransaction(txn: Transaction, message: SignerAddModel): Transaction {
    // Put message and index by signer
    txn = MessageModel.putTransaction(txn, message);

    // Put signerAdds index
    txn = txn.put(
      SignerStore.signerAddsKey(message.fid(), message.body().signerArray() ?? new Uint8Array()),
      Buffer.from(message.tsHash())
    );

    return txn;
  }

  /* Builds a RocksDB transaction to remove a SignerAdd message and delete its indices */
  private deleteSignerAddTransaction(txn: Transaction, message: SignerAddModel): Transaction {
    // Delete from signerAdds
    txn = txn.del(SignerStore.signerAddsKey(message.fid(), message.body().signerArray() ?? new Uint8Array()));

    // Delete message
    return MessageModel.deleteTransaction(txn, message);
  }

  /* Builds a RocksDB transaction to insert a SignerRemove message and construct its indices */
  private putSignerRemoveTransaction(txn: Transaction, message: SignerRemoveModel): Transaction {
    // Put message and index by signer
    txn = MessageModel.putTransaction(txn, message);

    // Put signerRemoves index
    txn = txn.put(
      SignerStore.signerRemovesKey(message.fid(), message.body().signerArray() ?? new Uint8Array()),
      Buffer.from(message.tsHash())
    );

    return txn;
  }

  /* Builds a RocksDB transaction to remove a SignerRemove message and delete its indices */
  private deleteSignerRemoveTransaction(txn: Transaction, message: SignerRemoveModel): Transaction {
    // Delete from signerRemoves
    txn = txn.del(SignerStore.signerRemovesKey(message.fid(), message.body().signerArray() ?? new Uint8Array()));

    // Delete message
    return MessageModel.deleteTransaction(txn, message);
  }
}

export default SignerStore;
