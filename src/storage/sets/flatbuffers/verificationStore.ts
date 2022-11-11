import RocksDB, { Transaction } from '~/storage/db/binaryrocksdb';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { ResultAsync } from 'neverthrow';
import { UserPostfix, VerificationAddEthAddressModel, VerificationRemoveModel } from '~/storage/flatbuffers/types';
import { isVerificationAddEthAddress, isVerificationRemove } from '~/storage/flatbuffers/typeguards';
import { bytesCompare } from '~/storage/flatbuffers/utils';
import { MessageType } from '~/utils/generated/message_generated';
import { HubError } from '~/utils/hubErrors';

/**
 * VerificationStore persists VerificationMessages in RocksDB using a two-phase CRDT set to
 * guarantee eventual consistency.
 *
 * A Verification is performed by an fid on a target (e.g. Ethereum address) and may have an
 * ordinality. Verifications are added with type specific messages like VerificationAddEthAddress
 * but are removed with a generic VerificationRemove message that points to the unique id of the
 * Add. Conflicts are resolved with Last-Write-Wins + Remove-Wins rules as follows:
 *
 * 1. Highest timestamp wins
 * 2. Remove wins over Adds
 * 3. Highest lexicographic hash wins
 *
 * VerificationAddEthAddress is currently the only supported Verification type today. The key-value
 * entries created by Verification Store are:
 *
 * 1. fid:tsHash -> reaction message
 * 2. fid:set:address -> fid:tsHash (Set Index)
 */

class VerificationStore {
  private _db: RocksDB;

  constructor(db: RocksDB) {
    this._db = db;
  }

  /**
   * Generates a unique key used to store a VerificationAdds message key in the VerificationsAdds
   * set index
   *
   * @param fid farcaster id of the user who created the verification
   * @param address Ethereum address being verified
   *
   * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<address?>
   */
  static verificationAddsKey(fid: Uint8Array, address?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.VerificationAdds]),
      address ? Buffer.from(address) : new Uint8Array(),
    ]);
  }

  /**
   * Generates a unique key used to store a VerificationAdd message key in the ReactionsRemove
   * set index
   *
   * @param fid farcaster id of the user who created the reaction
   * @param address Ethereum address being verified
   *
   * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<targetKey?>:<type?>
   */
  static verificationRemovesKey(fid: Uint8Array, address?: Uint8Array): Buffer {
    return Buffer.concat([
      MessageModel.userKey(fid),
      Buffer.from([UserPostfix.VerificationRemoves]),
      address ? Buffer.from(address) : new Uint8Array(),
    ]);
  }

  /**
   * Finds a VerificationAdds Message by checking the adds-set's index
   *
   * @param fid fid of the user who created the SignerAdd
   * @param address the address being verified
   *
   * @returns the VerificationAddEthAddressModel if it exists, throws NotFoundError otherwise
   */
  async getVerificationAdd(fid: Uint8Array, address: Uint8Array): Promise<VerificationAddEthAddressModel> {
    const messageTsHash = await this._db.get(VerificationStore.verificationAddsKey(fid, address));
    return MessageModel.get<VerificationAddEthAddressModel>(
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
   * @returns the VerificationRemoveEthAddress if it exists, throws NotFoundError otherwise
   */
  async getVerificationRemove(fid: Uint8Array, address: Uint8Array): Promise<VerificationRemoveModel> {
    const messageTsHash = await this._db.get(VerificationStore.verificationRemovesKey(fid, address));
    return MessageModel.get<VerificationRemoveModel>(this._db, fid, UserPostfix.VerificationMessage, messageTsHash);
  }

  /**
   * Finds all VerificationAdds messages for a user
   *
   * @param fid fid of the user who created the signers
   * @returns the VerificationAddEthAddresses if they exists, throws NotFoundError otherwise
   */
  async getVerificationAddsByUser(fid: Uint8Array): Promise<VerificationAddEthAddressModel[]> {
    const addsPrefix = VerificationStore.verificationAddsKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(addsPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<VerificationAddEthAddressModel>(
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
   * @returns the VerificationRemoves messages if it exists, throws NotFoundError otherwise
   */
  async getVerificationRemovesByUser(fid: Uint8Array): Promise<VerificationRemoveModel[]> {
    const removesPrefix = VerificationStore.verificationRemovesKey(fid);
    const messageKeys: Buffer[] = [];
    for await (const [, value] of this._db.iteratorByPrefix(removesPrefix, { keys: false, valueAsBuffer: true })) {
      messageKeys.push(value);
    }
    return MessageModel.getManyByUser<VerificationRemoveModel>(
      this._db,
      fid,
      UserPostfix.VerificationMessage,
      messageKeys
    );
  }

  /** Merge a VerificationAdd or VerificationRemove message into the VerificationStore */
  async merge(message: MessageModel): Promise<void> {
    if (isVerificationRemove(message)) {
      return this.mergeRemove(message);
    }

    if (isVerificationAddEthAddress(message)) {
      return this.mergeAdd(message);
    }

    throw new HubError('bad_request.validation_failure', 'invalid message type');
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async mergeAdd(message: VerificationAddEthAddressModel): Promise<void> {
    // Define address for lookups
    const address = message.body().addressArray();
    if (!address) {
      throw new HubError('bad_request.validation_failure', 'address was missing');
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
      throw new HubError('bad_request.validation_failure', 'address was missing');
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
    aTsHash: Uint8Array,
    bType: MessageType,
    bTsHash: Uint8Array
  ): number {
    // Compare timestamps (first 4 bytes of tsHash) to enforce Last-Write-Wins
    const timestampOrder = bytesCompare(aTsHash.subarray(0, 4), bTsHash.subarray(0, 4));
    if (timestampOrder !== 0) {
      return timestampOrder;
    }

    if (aType === MessageType.VerificationRemove && bType === MessageType.VerificationAddEthAddress) {
      return 1;
    } else if (aType === MessageType.VerificationAddEthAddress && bType === MessageType.VerificationRemove) {
      return -1;
    }

    // Compare hashes (last 4 bytes of tsHash) to break ties between messages of the same type and timestamp
    return bytesCompare(aTsHash.subarray(4), bTsHash.subarray(4));
  }

  private async resolveMergeConflicts(
    tsx: Transaction,
    address: Uint8Array,
    message: VerificationAddEthAddressModel | VerificationRemoveModel
  ): Promise<Transaction | undefined> {
    // Look up the remove tsHash for this address
    const removeTsHash = await ResultAsync.fromPromise(
      this._db.get(VerificationStore.verificationRemovesKey(message.fid(), address)),
      () => undefined
    );

    if (removeTsHash.isOk()) {
      if (
        this.verificationMessageCompare(
          MessageType.VerificationRemove,
          removeTsHash.value,
          message.type(),
          message.tsHash()
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
          UserPostfix.VerificationMessage,
          removeTsHash.value
        );
        tsx = this.deleteVerificationRemoveTransaction(tsx, existingRemove);
      }
    }

    // Look up the add tsHash for this address
    const addTsHash = await ResultAsync.fromPromise(
      this._db.get(VerificationStore.verificationAddsKey(message.fid(), address)),
      () => undefined
    );

    if (addTsHash.isOk()) {
      if (
        this.verificationMessageCompare(
          MessageType.VerificationAddEthAddress,
          addTsHash.value,
          message.type(),
          message.tsHash()
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
          UserPostfix.VerificationMessage,
          addTsHash.value
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
      VerificationStore.verificationAddsKey(message.fid(), message.body().addressArray() ?? new Uint8Array()),
      Buffer.from(message.tsHash())
    );

    return tsx;
  }

  private deleteVerificationAddTransaction(tsx: Transaction, message: VerificationAddEthAddressModel): Transaction {
    // Delete from verificationAdds
    tsx = tsx.del(
      VerificationStore.verificationAddsKey(message.fid(), message.body().addressArray() ?? new Uint8Array())
    );

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }

  private putVerificationRemoveTransaction(tsx: Transaction, message: VerificationRemoveModel): Transaction {
    // Add to db
    tsx = MessageModel.putTransaction(tsx, message);

    // Add to verificationRemoves
    tsx = tsx.put(
      VerificationStore.verificationRemovesKey(message.fid(), message.body().addressArray() ?? new Uint8Array()),
      Buffer.from(message.tsHash())
    );

    return tsx;
  }

  private deleteVerificationRemoveTransaction(tsx: Transaction, message: VerificationRemoveModel): Transaction {
    // Delete from verificationRemoves
    tsx = tsx.del(
      VerificationStore.verificationRemovesKey(message.fid(), message.body().addressArray() ?? new Uint8Array())
    );

    // Delete message
    return MessageModel.deleteTransaction(tsx, message);
  }
}

export default VerificationStore;
