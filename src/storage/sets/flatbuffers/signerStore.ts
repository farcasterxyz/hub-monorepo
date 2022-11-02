import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import { BadRequestError } from '~/utils/errors';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { ResultAsync } from 'neverthrow';
import { SignerAddModel, UserPostfix, SignerRemoveModel } from '~/storage/flatbuffers/types';
import { isSignerAdd, isSignerRemove } from '~/storage/flatbuffers/typeguards';
import { bytesCompare } from '~/storage/flatbuffers/utils';
import { MessageType } from '~/utils/generated/message_generated';
import ContractEventModel from '~/storage/flatbuffers/contractEventModel';

class SignerStore {
  private _db: RocksDB;

  constructor(db: RocksDB) {
    this._db = db;
  }

  /** RocksDB key of the form <user prefix (1 byte), fid (32 bytes), signer removes key (1 byte), custody address, signer (variable bytes)> */
  static signerRemovesKey(fid: Uint8Array, custodyAddress: Uint8Array, signer?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.SignerRemoves]),
      Buffer.from(custodyAddress),
      signer ? Buffer.from(signer) : new Uint8Array(),
    ]);
  }

  /** RocksDB key of the form <user prefix (1 byte), fid (32 bytes), signer adds key (1 byte), custody address, signer (variable bytes)> */
  static signerAddsKey(fid: Uint8Array, custodyAddress: Uint8Array, signer?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.SignerAdds]),
      Buffer.from(custodyAddress),
      signer ? Buffer.from(signer) : new Uint8Array(),
    ]);
  }

  async getIDRegistryEvent(fid: Uint8Array): Promise<ContractEventModel> {
    return ContractEventModel.get(this._db, fid);
  }

  async getCustodyAddress(fid: Uint8Array): Promise<Uint8Array> {
    const idRegistryEvent = await this.getIDRegistryEvent(fid);
    return idRegistryEvent.to();
  }

  /** Look up SignerAdd message by fid, custody address, and signer */
  async getSignerAdd(fid: Uint8Array, signer: Uint8Array, custodyAddress?: Uint8Array): Promise<SignerAddModel> {
    if (!custodyAddress) {
      // Will throw NotFoundError if custody address is missing
      custodyAddress = await this.getCustodyAddress(fid);
    }
    const messageTsHash = await this._db.get(SignerStore.signerAddsKey(fid, custodyAddress, signer));
    return MessageModel.get<SignerAddModel>(this._db, fid, UserPostfix.SignerMessage, messageTsHash);
  }

  /** Look up SignerRemove message by fid, custody address, and signer */
  async getSignerRemove(fid: Uint8Array, signer: Uint8Array, custodyAddress?: Uint8Array): Promise<SignerRemoveModel> {
    if (!custodyAddress) {
      // Will throw NotFoundError if custody address is missing
      custodyAddress = await this.getCustodyAddress(fid);
    }
    const messageTsHash = await this._db.get(SignerStore.signerRemovesKey(fid, custodyAddress, signer));
    return MessageModel.get<SignerRemoveModel>(this._db, fid, UserPostfix.SignerMessage, messageTsHash);
  }

  /** Get all SignerAdd messages for an fid and custody address */
  async getSignerAddsByUser(fid: Uint8Array, custodyAddress?: Uint8Array): Promise<SignerAddModel[]> {
    if (!custodyAddress) {
      // Will throw NotFoundError if custody address is missing
      custodyAddress = await this.getCustodyAddress(fid);
    }
    const addsPrefix = SignerStore.signerAddsKey(fid, custodyAddress);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<SignerAddModel>(this._db, fid, UserPostfix.SignerMessage, messageKeys);
  }

  /** Get all Signerremove messages for an fid and custody address */
  async getSignerRemovesByUser(fid: Uint8Array, custodyAddress?: Uint8Array): Promise<SignerRemoveModel[]> {
    if (!custodyAddress) {
      // Will throw NotFoundError if custody address is missing
      custodyAddress = await this.getCustodyAddress(fid);
    }
    const removesPrefix = SignerStore.signerRemovesKey(fid, custodyAddress);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(removesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<SignerRemoveModel>(this._db, fid, UserPostfix.SignerMessage, messageKeys);
  }

  // TODO: emit signer change events as a result of ID Registry events
  async mergeIDRegistryEvent(event: ContractEventModel): Promise<void> {
    const existingEvent = await ResultAsync.fromPromise(this.getIDRegistryEvent(event.fid()), () => undefined);
    if (existingEvent.isOk() && this.eventCompare(existingEvent.value, event) >= 0) {
      return undefined;
    }

    const txn = this._db.transaction();
    txn.put(event.primaryKey(), event.toBuffer());
    return this._db.commit(txn);
  }

  /** Merge a SignerAdd or SignerRemove message into the set */
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

  private SignerMessageCompare(
    aType: MessageType,
    aTsHash: Uint8Array,
    bType: MessageType,
    bTsHash: Uint8Array
  ): number {
    const tsHashOrder = bytesCompare(aTsHash, bTsHash);
    if (tsHashOrder !== 0) {
      return tsHashOrder;
    }

    if (aType === MessageType.SignerRemove && bType === MessageType.SignerAdd) {
      return 1;
    } else if (aType === MessageType.SignerAdd && bType === MessageType.SignerRemove) {
      return -1;
    }

    return 0;
  }

  private async resolveMergeConflicts(
    txn: Transaction,
    message: SignerAddModel | SignerRemoveModel
  ): Promise<Transaction | undefined> {
    const signer = message.body().signerArray();
    if (!signer) {
      throw new BadRequestError('signer is required');
    }

    // Look up the remove tsHash for this custody adddress and signer
    const removeTsHash = await ResultAsync.fromPromise(
      this._db.get(SignerStore.signerRemovesKey(message.fid(), message.signer(), signer)),
      () => undefined
    );

    if (removeTsHash.isOk()) {
      if (
        this.SignerMessageCompare(MessageType.SignerRemove, removeTsHash.value, message.type(), message.tsHash()) >= 0
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
      if (this.SignerMessageCompare(MessageType.SignerAdd, addTsHash.value, message.type(), message.tsHash()) >= 0) {
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

  private deleteSignerAddTransaction(txn: Transaction, message: SignerAddModel): Transaction {
    // Delete from signerAdds
    txn = txn.del(
      SignerStore.signerAddsKey(message.fid(), message.signer(), message.body().signerArray() ?? new Uint8Array())
    );

    // Delete message
    return MessageModel.deleteTransaction(txn, message);
  }

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
