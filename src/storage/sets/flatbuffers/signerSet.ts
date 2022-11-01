import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import { BadRequestError } from '~/utils/errors';
import MessageModel from '~/storage/flatbuffers/model';
import { ResultAsync } from 'neverthrow';
import { SignerAddModel, UserPrefix, SignerRemoveModel } from '~/storage/flatbuffers/types';
import { isSignerAdd, isSignerRemove } from '~/storage/flatbuffers/typeguards';
import { bytesCompare } from '~/storage/flatbuffers/utils';
import { MessageType } from '~/utils/generated/message_generated';
import ContractEventModel from '~/storage/flatbuffers/contractEventModel';

class SignerSet {
  private _db: RocksDB;

  constructor(db: RocksDB) {
    this._db = db;
  }

  /** RocksDB key of the form <user prefix (1 byte), fid (32 bytes), signer removes key (1 byte), custody address, signer (variable bytes)> */
  static signerRemovesKey(fid: Uint8Array, custodyAddress: Uint8Array, signer?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPrefix.SignerRemoves]),
      Buffer.from(custodyAddress),
      signer ? Buffer.from(signer) : new Uint8Array(),
    ]);
  }

  /** RocksDB key of the form <user prefix (1 byte), fid (32 bytes), signer adds key (1 byte), custody address, signer (variable bytes)> */
  static signerAddsKey(fid: Uint8Array, custodyAddress: Uint8Array, signer?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPrefix.SignerAdds]),
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
    const messageTimestampHash = await this._db.get(SignerSet.signerAddsKey(fid, custodyAddress, signer));
    return MessageModel.get<SignerAddModel>(this._db, fid, UserPrefix.SignerMessage, messageTimestampHash);
  }

  /** Look up SignerRemove message by fid, custody address, and signer */
  async getSignerRemove(fid: Uint8Array, signer: Uint8Array, custodyAddress?: Uint8Array): Promise<SignerRemoveModel> {
    if (!custodyAddress) {
      // Will throw NotFoundError if custody address is missing
      custodyAddress = await this.getCustodyAddress(fid);
    }
    const messageTimestampHash = await this._db.get(SignerSet.signerRemovesKey(fid, custodyAddress, signer));
    return MessageModel.get<SignerRemoveModel>(this._db, fid, UserPrefix.SignerMessage, messageTimestampHash);
  }

  /** Get all SignerAdd messages for an fid and custody address */
  async getSignerAddsByUser(fid: Uint8Array, custodyAddress?: Uint8Array): Promise<SignerAddModel[]> {
    if (!custodyAddress) {
      // Will throw NotFoundError if custody address is missing
      custodyAddress = await this.getCustodyAddress(fid);
    }
    const addsPrefix = SignerSet.signerAddsKey(fid, custodyAddress);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<SignerAddModel>(this._db, fid, UserPrefix.SignerMessage, messageKeys);
  }

  /** Get all Signerremove messages for an fid and custody address */
  async getSignerRemovesByUser(fid: Uint8Array, custodyAddress?: Uint8Array): Promise<SignerRemoveModel[]> {
    if (!custodyAddress) {
      // Will throw NotFoundError if custody address is missing
      custodyAddress = await this.getCustodyAddress(fid);
    }
    const removesPrefix = SignerSet.signerRemovesKey(fid, custodyAddress);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(removesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<SignerRemoveModel>(this._db, fid, UserPrefix.SignerMessage, messageKeys);
  }

  // TODO: emit signer change events as a result of ID Registry events
  async mergeIDRegistryEvent(event: ContractEventModel): Promise<void> {
    const existingEvent = await ResultAsync.fromPromise(this.getIDRegistryEvent(event.fid()), () => undefined);
    if (existingEvent.isOk() && this.eventCompare(existingEvent.value, event) >= 0) {
      return undefined;
    }

    const tsx = this._db.transaction();
    tsx.put(event.primaryKey(), event.toBuffer());
    return this._db.commit(tsx);
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
    let tsx = await this.resolveMergeConflicts(this._db.transaction(), message);

    // No-op if resolveMergeConflicts did not return a transaction
    if (!tsx) return undefined;

    // Add putSignerAdd operations to the RocksDB transaction
    tsx = this.putSignerAddTransaction(tsx, message);

    // Commit the RocksDB transaction
    return this._db.commit(tsx);
  }

  private async mergeRemove(message: SignerRemoveModel): Promise<void> {
    let tsx = await this.resolveMergeConflicts(this._db.transaction(), message);

    // No-op if resolveMergeConflicts did not return a transaction
    if (!tsx) return undefined;

    // Add putSignerRemove operations to the RocksDB transaction
    tsx = this.putSignerRemoveTransaction(tsx, message);

    // Commit the RocksDB transaction
    return this._db.commit(tsx);
  }

  private SignerMessageCompare(
    aType: MessageType,
    aTimestampHash: Uint8Array,
    bType: MessageType,
    bTimestampHash: Uint8Array
  ): number {
    const timestampHashOrder = bytesCompare(aTimestampHash, bTimestampHash);
    if (timestampHashOrder !== 0) {
      return timestampHashOrder;
    }

    if (aType === MessageType.SignerRemove && bType === MessageType.SignerAdd) {
      return 1;
    } else if (aType === MessageType.SignerAdd && bType === MessageType.SignerRemove) {
      return -1;
    }

    return 0;
  }

  private async resolveMergeConflicts(
    tsx: Transaction,
    message: SignerAddModel | SignerRemoveModel
  ): Promise<Transaction | undefined> {
    const signer = message.body().signerArray();
    if (!signer) {
      throw new BadRequestError('signer is required');
    }

    // Look up the remove timestampHash for this custody adddress and signer
    const removeTimestampHash = await ResultAsync.fromPromise(
      this._db.get(SignerSet.signerRemovesKey(message.fid(), message.signer(), signer)),
      () => undefined
    );

    if (removeTimestampHash.isOk()) {
      if (
        this.SignerMessageCompare(
          MessageType.SignerRemove,
          removeTimestampHash.value,
          message.type(),
          message.timestampHash()
        ) >= 0
      ) {
        // If the existing remove has the same or higher order than the new message, no-op
        return undefined;
      } else {
        // If the existing remove has a lower order than the new message, retrieve the full
        // SignerRemove message and delete it as part of the RocksDB transaction
        const existingRemove = await MessageModel.get<SignerRemoveModel>(
          this._db,
          message.fid(),
          UserPrefix.SignerMessage,
          removeTimestampHash.value
        );
        tsx = this.deleteSignerRemoveTransaction(tsx, existingRemove);
      }
    }

    // Look up the add timestampHash for this custody address and signer
    const addTimestampHash = await ResultAsync.fromPromise(
      this._db.get(SignerSet.signerAddsKey(message.fid(), message.signer(), signer)),
      () => undefined
    );

    if (addTimestampHash.isOk()) {
      if (
        this.SignerMessageCompare(
          MessageType.SignerAdd,
          addTimestampHash.value,
          message.type(),
          message.timestampHash()
        ) >= 0
      ) {
        // If the existing add has the same or higher order than the new message, no-op
        return undefined;
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // SignerAdd message and delete it as part of the RocksDB transaction
        const existingAdd = await MessageModel.get<SignerAddModel>(
          this._db,
          message.fid(),
          UserPrefix.SignerMessage,
          addTimestampHash.value
        );
        tsx = this.deleteSignerAddTransaction(tsx, existingAdd);
      }
    }

    return tsx;
  }

  private putSignerAddTransaction(tsx: Transaction, message: SignerAddModel): Transaction {
    // Put message and index by signer
    tsx = MessageModel.putTransaction(tsx, message);

    // Put signerAdds index
    tsx = tsx.put(
      SignerSet.signerAddsKey(message.fid(), message.signer(), message.body().signerArray() ?? new Uint8Array()),
      Buffer.from(message.timestampHash())
    );

    return tsx;
  }

  private deleteSignerAddTransaction(tsx: Transaction, message: SignerAddModel): Transaction {
    // Delete from signerAdds
    tsx = tsx.del(
      SignerSet.signerAddsKey(message.fid(), message.signer(), message.body().signerArray() ?? new Uint8Array())
    );

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }

  private putSignerRemoveTransaction(tsx: Transaction, message: SignerRemoveModel): Transaction {
    // Put message and index by signer
    tsx = MessageModel.putTransaction(tsx, message);

    // Put signerRemoves index
    tsx = tsx.put(
      SignerSet.signerRemovesKey(message.fid(), message.signer(), message.body().signerArray() ?? new Uint8Array()),
      Buffer.from(message.timestampHash())
    );

    return tsx;
  }

  private deleteSignerRemoveTransaction(tsx: Transaction, message: SignerRemoveModel): Transaction {
    // Delete from signerRemoves
    tsx = tsx.del(
      SignerSet.signerRemovesKey(message.fid(), message.signer(), message.body().signerArray() ?? new Uint8Array())
    );

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }
}

export default SignerSet;
