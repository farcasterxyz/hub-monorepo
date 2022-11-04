import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import { BadRequestError } from '~/utils/errors';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { ResultAsync } from 'neverthrow';
import { SignerAddModel, UserPostfix, SignerRemoveModel } from '~/storage/flatbuffers/types';
import { isSignerAdd, isSignerRemove } from '~/storage/flatbuffers/typeguards';
import { bytesCompare } from '~/storage/flatbuffers/utils';
import { MessageType } from '~/utils/generated/message_generated';
import ContractEventModel from '~/storage/flatbuffers/contractEventModel';

// Research: Model out how safe it is to use a 32-bit hash

class SignerStore {
  private _db: RocksDB;

  constructor(db: RocksDB) {
    this._db = db;
  }

  /**
   * Generates a unique key used to store a SignerAdd message key in the SignerAdds Set index
   *
   * @param fid farcaster id of the user who created the Signer
   * @param custodyAddress the Ethereum address of the secp256k1 key-pair that signed the message
   * @param signer (TODO)
   *
   * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<custodyAddress?>:<signer?>
   */
  static signerAddsKey(fid: Uint8Array, custodyAddress: Uint8Array, signer?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.SignerAdds]),
      Buffer.from(custodyAddress),
      signer ? Buffer.from(signer) : new Uint8Array(),
    ]);
  }

  /**
   * Generates a unique key used to store a SignerRemove message key in the SignerRemoves Set index
   *
   * @param fid farcaster id of the user who created the Signer
   * @param custodyAddress the Ethereum address of the secp256k1 key-pair that signed the message
   * @param signer
   *
   * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<custodyAddress?>:<signer?>
   */
  static signerRemovesKey(fid: Uint8Array, custodyAddress: Uint8Array, signer?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.SignerRemoves]),
      Buffer.from(custodyAddress),
      signer ? Buffer.from(signer) : new Uint8Array(),
    ]);
  }

  /** Returns the most recent event from the IdRegistry contract that moved an fid  */
  async getIdRegistryEvent(fid: Uint8Array): Promise<ContractEventModel> {
    return ContractEventModel.get(this._db, fid);
  }

  /** Returns the custody address that currently owns an fid */
  async getCustodyAddress(fid: Uint8Array): Promise<Uint8Array> {
    const idRegistryEvent = await this.getIdRegistryEvent(fid);
    return idRegistryEvent.to();
  }

  // TODO: consider having a separate get signer add method

  /**
   * Finds a SignerAdd Message by checking the Adds Set index
   *
   * @param fid fid of the user who created the reaction add
   * @param signer type of reaction that was added
   * @param custodyAddress the Ethereum address that currently owns the Farcaster ID
   * @returns the ReactionAdd Model if it exists, throws NotFoundError otherwise
   */
  async getSignerAdd(fid: Uint8Array, signer: Uint8Array, custodyAddress?: Uint8Array): Promise<SignerAddModel> {
    if (!custodyAddress) {
      custodyAddress = await this.getCustodyAddress(fid);
    }

    const messageTsHash = await this._db.get(SignerStore.signerAddsKey(fid, custodyAddress, signer));
    return MessageModel.get<SignerAddModel>(this._db, fid, UserPostfix.SignerMessage, messageTsHash);
  }

  /**
   * Finds a SignerRemove Message by checking the Remove Set index
   *
   * @param fid fid of the user who created the reaction remove
   * @param signer type of reaction that was added
   * @param custodyAddress the Ethereum address that currently owns the Farcaster ID
   * @returns the SignerRemove message if it exists, throws NotFoundError otherwise
   */
  async getSignerRemove(fid: Uint8Array, signer: Uint8Array, custodyAddress?: Uint8Array): Promise<SignerRemoveModel> {
    if (!custodyAddress) {
      custodyAddress = await this.getCustodyAddress(fid);
    }
    const messageTsHash = await this._db.get(SignerStore.signerRemovesKey(fid, custodyAddress, signer));
    return MessageModel.get<SignerRemoveModel>(this._db, fid, UserPostfix.SignerMessage, messageTsHash);
  }

  //TODO: consider having two separate methods, one that requires the param and one that doesnt

  /**
   * Finds all SignerAdd messages for a user's custody address
   *
   * @param fid fid of the user who created the reaction remove
   * @param custodyAddress the Ethereum address that currently owns the fid, defaults to latest address
   * @returns the SignerRemove messages if it exists, throws NotFoundError otherwise
   */
  async getSignerAddsByUser(fid: Uint8Array, custodyAddress?: Uint8Array): Promise<SignerAddModel[]> {
    if (!custodyAddress) {
      custodyAddress = await this.getCustodyAddress(fid);
    }
    const addsPrefix = SignerStore.signerAddsKey(fid, custodyAddress);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<SignerAddModel>(this._db, fid, UserPostfix.SignerMessage, messageKeys);
  }

  /**
   * Finds all SignerRemove Messages for a user
   *
   * @param fid fid of the user who created the reaction remove
   * @param custodyAddress the Ethereum address that currently owns the fid, defaults to latest address
   * @returns the SignerRemove message if it exists, throws NotFoundError otherwise
   */
  async getSignerRemovesByUser(fid: Uint8Array, custodyAddress?: Uint8Array): Promise<SignerRemoveModel[]> {
    if (!custodyAddress) {
      custodyAddress = await this.getCustodyAddress(fid);
    }
    const removesPrefix = SignerStore.signerRemovesKey(fid, custodyAddress);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(removesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<SignerRemoveModel>(this._db, fid, UserPostfix.SignerMessage, messageKeys);
  }

  /**
   * Merges a ContractEvent into the SignerStore, storing the causally latest event at the key:
   * <RootPrefix:User><fid><UserPostfix:IdRegistryEvent>
   *
   * @param event the ContractEventModel to merge
   */
  async mergeIdRegistryEvent(event: ContractEventModel): Promise<void> {
    // TODO: emit signer change events as a result of ID Registry events
    const existingEvent = await ResultAsync.fromPromise(this.getIdRegistryEvent(event.fid()), () => undefined);
    if (existingEvent.isOk() && this.eventCompare(existingEvent.value, event) >= 0) {
      return undefined;
    }

    const txn = this._db.transaction();
    txn.put(event.primaryKey(), event.toBuffer());
    return this._db.commit(txn);
  }

  /** Merge a SignerAdd or SignerRemove message into the SignerStore */
  async merge(message: MessageModel): Promise<void> {
    if (isSignerRemove(message)) {
      return this.mergeRemove(message);
    }

    if (isSignerAdd(message)) {
      return this.mergeAdd(message);
    }

    throw new BadRequestError('invalid message type');
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private eventCompare(a: ContractEventModel, b: ContractEventModel): number {
    // Compare blockNumber
    if (a.blockNumber() < b.blockNumber()) {
      return -1;
    } else if (a.blockNumber > b.blockNumber) {
      return 1;
    }

    // Compare logIndex
    if (a.logIndex() < b.logIndex()) {
      return -1;
    } else if (a.logIndex() > b.logIndex()) {
      return 1;
    }

    // TODO: comparing transaction hash is unnecessary as long as transaction position is also compared.

    // Compare transactionHash (lexicographical order)
    return bytesCompare(a.transactionHash(), b.transactionHash());
  }

  private async mergeAdd(message: SignerAddModel): Promise<void> {
    let txn = await this.resolveMergeConflicts(this._db.transaction(), message);

    // No-op if resolveMergeConflicts did not return a transaction
    if (!txn) return undefined;

    // Add putSignerAdd operations to the RocksDB transaction
    txn = this.putSignerAddTransaction(txn, message);

    // Commit the RocksDB transaction
    return this._db.commit(txn);
  }

  private async mergeRemove(message: SignerRemoveModel): Promise<void> {
    let txn = await this.resolveMergeConflicts(this._db.transaction(), message);

    // No-op if resolveMergeConflicts did not return a transaction
    if (!txn) return undefined;

    // Add putSignerRemove operations to the RocksDB transaction
    txn = this.putSignerRemoveTransaction(txn, message);

    // Commit the RocksDB transaction
    return this._db.commit(txn);
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
      throw new BadRequestError('signer is required');
    }

    // Look up the remove tsHash for this custody address and signer
    const removeTsHash = await ResultAsync.fromPromise(
      this._db.get(SignerStore.signerRemovesKey(message.fid(), message.signer(), signer)),
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
      this._db.get(SignerStore.signerAddsKey(message.fid(), message.signer(), signer)),
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
      SignerStore.signerAddsKey(message.fid(), message.signer(), message.body().signerArray() ?? new Uint8Array()),
      Buffer.from(message.tsHash())
    );

    return txn;
  }

  /* Builds a RocksDB transaction to remove a SignerAdd message and delete its indices */
  private deleteSignerAddTransaction(txn: Transaction, message: SignerAddModel): Transaction {
    // Delete from signerAdds
    txn = txn.del(
      SignerStore.signerAddsKey(message.fid(), message.signer(), message.body().signerArray() ?? new Uint8Array())
    );

    // Delete message
    return MessageModel.deleteTransaction(txn, message);
  }

  /* Builds a RocksDB transaction to insert a SignerRemove message and construct its indices */
  private putSignerRemoveTransaction(txn: Transaction, message: SignerRemoveModel): Transaction {
    // Put message and index by signer
    txn = MessageModel.putTransaction(txn, message);

    // Put signerRemoves index
    txn = txn.put(
      SignerStore.signerRemovesKey(message.fid(), message.signer(), message.body().signerArray() ?? new Uint8Array()),
      Buffer.from(message.tsHash())
    );

    return txn;
  }

  /* Builds a RocksDB transaction to remove a SignerRemove message and delete its indices */
  private deleteSignerRemoveTransaction(txn: Transaction, message: SignerRemoveModel): Transaction {
    // Delete from signerRemoves
    txn = txn.del(
      SignerStore.signerRemovesKey(message.fid(), message.signer(), message.body().signerArray() ?? new Uint8Array())
    );

    // Delete message
    return MessageModel.deleteTransaction(txn, message);
  }
}

export default SignerStore;
