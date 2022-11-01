import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import { BadRequestError } from '~/utils/errors';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { ResultAsync } from 'neverthrow';
import { UserPrefix, VerificationAddEthAddressModel, VerificationRemoveModel } from '~/storage/flatbuffers/types';
import { isVerificationAddEthAddress, isVerificationRemove } from '~/storage/flatbuffers/typeguards';
import { bytesCompare } from '~/storage/flatbuffers/utils';
import { MessageType } from '~/utils/generated/message_generated';

class VerificationSet {
  private _db: RocksDB;

  constructor(db: RocksDB) {
    this._db = db;
  }

  /** RocksDB key of the form <user prefix (1 byte), fid (32 bytes), verification removes key (1 byte), address (variable bytes)> */
  static verificationRemovesKey(fid: Uint8Array, address?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPrefix.VerificationRemoves]),
      address ? Buffer.from(address) : new Uint8Array(),
    ]);
  }

  /** RocksDB key of the form <user prefix (1 byte), fid (32 bytes), verification adds key (1 byte), address (variable bytes)> */
  static verificationAddsKey(fid: Uint8Array, address?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPrefix.VerificationAdds]),
      address ? Buffer.from(address) : new Uint8Array(),
    ]);
  }

  /** Look up VerificationAdd* message by address */
  async getVerificationAdd(fid: Uint8Array, address: Uint8Array): Promise<VerificationAddEthAddressModel> {
    const messageTimestampHash = await this._db.get(VerificationSet.verificationAddsKey(fid, address));
    return MessageModel.get<VerificationAddEthAddressModel>(
      this._db,
      fid,
      UserPrefix.VerificationMessage,
      messageTimestampHash
    );
  }

  /** Look up VerificationRemove message by address */
  async getVerificationRemove(fid: Uint8Array, address: Uint8Array): Promise<VerificationRemoveModel> {
    const messageTimestampHash = await this._db.get(VerificationSet.verificationRemovesKey(fid, address));
    return MessageModel.get<VerificationRemoveModel>(
      this._db,
      fid,
      UserPrefix.VerificationMessage,
      messageTimestampHash
    );
  }

  /** Get all VerificationAdd* messages for an fid */
  async getVerificationAddsByUser(fid: Uint8Array): Promise<VerificationAddEthAddressModel[]> {
    const addsPrefix = VerificationSet.verificationAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<VerificationAddEthAddressModel>(
      this._db,
      fid,
      UserPrefix.VerificationMessage,
      messageKeys
    );
  }

  /** Get all VerificationRemove messages for an fid */
  async getVerificationRemovesByUser(fid: Uint8Array): Promise<VerificationRemoveModel[]> {
    const removesPrefix = VerificationSet.verificationRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(removesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<VerificationRemoveModel>(
      this._db,
      fid,
      UserPrefix.VerificationMessage,
      messageKeys
    );
  }

  /** Merge a VerificationAdd* or VerificationRemove message into the set */
  async merge(message: MessageModel): Promise<void> {
    if (isVerificationRemove(message)) {
      return this.mergeRemove(message);
    }

    if (isVerificationAddEthAddress(message)) {
      return this.mergeAdd(message);
    }

    throw new BadRequestError('invalid message type');
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: VerificationAddEthAddressModel): Promise<void> {
    // Define address for lookups
    const address = message.body().addressArray();
    if (!address) {
      throw new BadRequestError('address is required');
    }

    let tsx = await this.resolveMergeConflicts(this._db.transaction(), address, message);

    // No-op if resolveMergeConflicts did not return a transaction
    if (!tsx) return undefined;

    // Add putVerificationAdd operations to the RocksDB transaction
    tsx = this.putVerificationAddTransaction(tsx, message);

    // Commit the RocksDB transaction
    return this._db.commit(tsx);
  }

  private async mergeRemove(message: VerificationRemoveModel): Promise<void> {
    // Define address for lookups
    const address = message.body().addressArray();
    if (!address) {
      throw new BadRequestError('address is required');
    }

    let tsx = await this.resolveMergeConflicts(this._db.transaction(), address, message);

    // No-op if resolveMergeConflicts did not return a transaction
    if (!tsx) return undefined;

    // Add putVerificationRemove operations to the RocksDB transaction
    tsx = this.putVerificationRemoveTransaction(tsx, message);

    // Commit the RocksDB transaction
    return this._db.commit(tsx);
  }

  private verificationMessageCompare(
    aType: MessageType,
    aTimestampHash: Uint8Array,
    bType: MessageType,
    bTimestampHash: Uint8Array
  ): number {
    const timestampHashOrder = bytesCompare(aTimestampHash, bTimestampHash);
    if (timestampHashOrder !== 0) {
      return timestampHashOrder;
    }

    if (aType === MessageType.VerificationRemove && bType === MessageType.VerificationAddEthAddress) {
      return 1;
    } else if (aType === MessageType.VerificationAddEthAddress && bType === MessageType.VerificationRemove) {
      return -1;
    }

    return 0;
  }

  private async resolveMergeConflicts(
    tsx: Transaction,
    address: Uint8Array,
    message: VerificationAddEthAddressModel | VerificationRemoveModel
  ): Promise<Transaction | undefined> {
    // Look up the remove timestampHash for this address
    const removeTimestampHash = await ResultAsync.fromPromise(
      this._db.get(VerificationSet.verificationRemovesKey(message.fid(), address)),
      () => undefined
    );

    if (removeTimestampHash.isOk()) {
      if (
        this.verificationMessageCompare(
          MessageType.VerificationRemove,
          removeTimestampHash.value,
          message.type(),
          message.timestampHash()
        ) >= 0
      ) {
        // If the existing remove has the same or higher order than the new message, no-op
        return undefined;
      } else {
        // If the existing remove has a lower order than the new message, retrieve the full
        // VerificationRemove message and delete it as part of the RocksDB transaction
        const existingRemove = await MessageModel.get<VerificationRemoveModel>(
          this._db,
          message.fid(),
          UserPrefix.VerificationMessage,
          removeTimestampHash.value
        );
        tsx = this.deleteVerificationRemoveTransaction(tsx, existingRemove);
      }
    }

    // Look up the add timestampHash for this address
    const addTimestampHash = await ResultAsync.fromPromise(
      this._db.get(VerificationSet.verificationAddsKey(message.fid(), address)),
      () => undefined
    );

    if (addTimestampHash.isOk()) {
      if (
        this.verificationMessageCompare(
          MessageType.VerificationAddEthAddress,
          addTimestampHash.value,
          message.type(),
          message.timestampHash()
        ) >= 0
      ) {
        // If the existing add has the same or higher order than the new message, no-op
        return undefined;
      } else {
        // If the existing add has a lower order than the new message, retrieve the full
        // VerificationAdd* message and delete it as part of the RocksDB transaction
        const existingAdd = await MessageModel.get<VerificationAddEthAddressModel>(
          this._db,
          message.fid(),
          UserPrefix.VerificationMessage,
          addTimestampHash.value
        );
        tsx = this.deleteVerificationAddTransaction(tsx, existingAdd);
      }
    }

    return tsx;
  }

  private putVerificationAddTransaction(tsx: Transaction, message: VerificationAddEthAddressModel): Transaction {
    // Put message and index by signer
    tsx = MessageModel.putTransaction(tsx, message);

    // Put verificationAdds index
    tsx = tsx.put(
      VerificationSet.verificationAddsKey(message.fid(), message.body().addressArray() ?? new Uint8Array()),
      Buffer.from(message.timestampHash())
    );

    return tsx;
  }

  private deleteVerificationAddTransaction(tsx: Transaction, message: VerificationAddEthAddressModel): Transaction {
    // Delete from verificationAdds
    tsx = tsx.del(
      VerificationSet.verificationAddsKey(message.fid(), message.body().addressArray() ?? new Uint8Array())
    );

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }

  private putVerificationRemoveTransaction(tsx: Transaction, message: VerificationRemoveModel): Transaction {
    // Add to db
    tsx = MessageModel.putTransaction(tsx, message);

    // Add to verificationRemoves
    tsx = tsx.put(
      VerificationSet.verificationRemovesKey(message.fid(), message.body().addressArray() ?? new Uint8Array()),
      Buffer.from(message.timestampHash())
    );

    return tsx;
  }

  private deleteVerificationRemoveTransaction(tsx: Transaction, message: VerificationRemoveModel): Transaction {
    // Delete from verificationRemoves
    tsx = tsx.del(
      VerificationSet.verificationRemovesKey(message.fid(), message.body().addressArray() ?? new Uint8Array())
    );

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }
}

export default VerificationSet;
