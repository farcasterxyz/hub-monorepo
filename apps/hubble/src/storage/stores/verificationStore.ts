import {
  getDefaultStoreLimit,
  HubAsyncResult,
  HubError,
  isVerificationAddAddressMessage,
  isVerificationRemoveMessage,
  Message,
  MessageType,
  StoreType,
  VerificationAddAddressMessage,
  VerificationRemoveMessage,
} from "@farcaster/hub-nodejs";
import { err, ok, Result, ResultAsync } from "neverthrow";
import {
  deleteMessageTransaction,
  makeFidKey,
  makeTsHash,
  makeUserKey,
  messageDecode,
  readFidKey,
} from "../db/message.js";
import { FID_BYTES, RootPrefix, UserMessagePostfix, UserPostfix } from "../db/types.js";
import { MessagesPage, PageOptions } from "./types.js";
import { Store } from "./store.js";
import { Transaction } from "../db/rocksdb.js";
import { logger } from "../../utils/logger.js";

/**
 * Generates a unique key used to store a VerificationAdds message key in the VerificationsAdds
 * set index
 *
 * @param fid farcaster id of the user who created the verification
 * @param address Ethereum address being verified
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<address?>
 */
export const makeVerificationAddsKey = (fid: number, address?: Uint8Array): Buffer => {
  return Buffer.concat([makeUserKey(fid), Buffer.from([UserPostfix.VerificationAdds]), Buffer.from(address ?? "")]);
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
export const makeVerificationRemovesKey = (fid: number, address?: Uint8Array): Buffer => {
  return Buffer.concat([makeUserKey(fid), Buffer.from([UserPostfix.VerificationRemoves]), Buffer.from(address ?? "")]);
};

/**
 * Generates a unique key used to store a VerificationAdd message by address to validate uniqueness
 *
 * @param address Ethereum address being verified
 *
 * @returns RocksDB key of the form <RootPrefix>:<address>
 */
export const makeVerificationByAddressKey = (address: Uint8Array): Buffer => {
  return Buffer.concat([Buffer.from([RootPrefix.VerificationByAddress]), Buffer.from(address)]);
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

class VerificationStore extends Store<VerificationAddAddressMessage, VerificationRemoveMessage> {
  override _postfix: UserMessagePostfix = UserPostfix.VerificationMessage;

  override makeAddKey(msg: VerificationAddAddressMessage) {
    return makeVerificationAddsKey(
      msg.data.fid,
      (msg.data.verificationAddAddressBody || msg.data.verificationRemoveBody).address,
    ) as Buffer;
  }

  override makeRemoveKey(msg: VerificationRemoveMessage) {
    return makeVerificationRemovesKey(
      msg.data.fid,
      (msg.data.verificationAddAddressBody || msg.data.verificationRemoveBody).address,
    );
  }

  override async findMergeAddConflicts(_message: VerificationAddAddressMessage): HubAsyncResult<void> {
    return ok(undefined);
  }

  override async findMergeRemoveConflicts(_message: VerificationRemoveMessage): HubAsyncResult<void> {
    return ok(undefined);
  }

  override _isAddType = isVerificationAddAddressMessage;
  override _isRemoveType = isVerificationRemoveMessage;
  override _addMessageType = MessageType.VERIFICATION_ADD_ETH_ADDRESS;
  override _removeMessageType = MessageType.VERIFICATION_REMOVE;

  protected override get PRUNE_SIZE_LIMIT_DEFAULT() {
    return getDefaultStoreLimit(StoreType.VERIFICATIONS);
  }

  /**
   * Finds a VerificationAdds Message by checking the adds-set's index
   *
   * @param fid fid of the user who created the SignerAdd
   * @param address the address being verified
   *
   * @returns the VerificationAddEthAddressModel if it exists, throws HubError otherwise
   */
  async getVerificationAdd(fid: number, address: Uint8Array): Promise<VerificationAddAddressMessage> {
    return await this.getAdd({
      data: { fid, verificationAddAddressBody: { address } },
    });
  }

  /**
   * Finds a VerificationsRemove Message by checking the remove-set's index
   *
   * @param fid fid of the user who created the SignerAdd
   * @param address the address being verified
   * @returns the VerificationRemoveEthAddress if it exists, throws HubError otherwise
   */
  async getVerificationRemove(fid: number, address: Uint8Array): Promise<VerificationRemoveMessage> {
    return await this.getRemove({
      data: { fid, verificationRemoveBody: { address } },
    });
  }

  /**
   * Finds all VerificationAdds messages for a user
   *
   * @param fid fid of the user who created the signers
   * @returns the VerificationAddEthAddresses if they exists, throws HubError otherwise
   */
  async getVerificationAddsByFid(
    fid: number,
    pageOptions: PageOptions = {},
  ): Promise<MessagesPage<VerificationAddAddressMessage>> {
    return await this.getAddsByFid({ data: { fid } }, pageOptions);
  }

  /**
   * Finds all VerificationRemoves messages for a user
   *
   * @param fid fid of the user who created the signers
   * @returns the VerificationRemoves messages if it exists, throws HubError otherwise
   */
  async getVerificationRemovesByFid(
    fid: number,
    pageOptions: PageOptions = {},
  ): Promise<MessagesPage<VerificationRemoveMessage>> {
    return await this.getRemovesByFid({ data: { fid } }, pageOptions);
  }

  override async buildSecondaryIndices(txn: Transaction, message: VerificationAddAddressMessage): HubAsyncResult<void> {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);

    if (tsHash.isErr()) {
      return err(tsHash.error);
    }

    const address = message.data.verificationAddAddressBody.address;

    if (address.length === 0) {
      return err(new HubError("bad_request.invalid_param", "address empty"));
    }

    // Puts the fid into the byAddress index
    const byAddressKey = makeVerificationByAddressKey(address);
    txn.put(byAddressKey, makeFidKey(message.data.fid));

    return ok(undefined);
  }
  override async deleteSecondaryIndices(
    txn: Transaction,
    message: VerificationAddAddressMessage,
  ): HubAsyncResult<void> {
    const address = message.data.verificationAddAddressBody.address;

    if (address.length === 0) {
      return err(new HubError("bad_request.invalid_param", "address empty"));
    }

    // Delete the message key from byAddress index
    const byAddressKey = makeVerificationByAddressKey(address);
    txn.del(byAddressKey);

    return ok(undefined);
  }

  override async getMergeConflicts(
    message: VerificationAddAddressMessage | VerificationRemoveMessage,
  ): HubAsyncResult<(VerificationAddAddressMessage | VerificationRemoveMessage)[]> {
    const res = await super.getMergeConflicts(message);
    if (res.isErr()) {
      return res;
    }

    if (isVerificationRemoveMessage(message)) {
      return res;
    }

    // For adds, we also need to check for conflicts across all fids (by eth address)
    const conflicts = res.value;

    const byAddressKey = makeVerificationByAddressKey(message.data.verificationAddAddressBody.address);
    const fidResult = await ResultAsync.fromPromise(this._db.get(byAddressKey), () => undefined);
    if (fidResult.isOk()) {
      const fid = readFidKey(fidResult.value);
      // If the existing verification is for a different fid, then we need decide which fids wins based on tsHash
      if (fid !== undefined && fid !== message.data.fid) {
        const existingMessage = await this.getAdd({
          data: {
            fid,
            verificationAddAddressBody: {
              address: message.data.verificationAddAddressBody.address,
            },
          },
        });
        const tsHash = makeTsHash(message.data.timestamp, message.hash);
        const existingTsHash = makeTsHash(existingMessage.data.timestamp, existingMessage.hash);

        if (tsHash.isErr() || existingTsHash.isErr()) {
          throw new HubError("bad_request", "failed to make tsHash");
        }

        const messageCompare = this.messageCompare(
          this._addMessageType,
          existingTsHash.value,
          this._addMessageType,
          tsHash.value,
        );
        if (messageCompare > 0) {
          return err(new HubError("bad_request.conflict", "message conflicts with a more recent add"));
        } else if (messageCompare === 0) {
          return err(new HubError("bad_request.duplicate", "message has already been merged"));
        } else {
          conflicts.push(existingMessage);
        }
      }
    }
    return ok(conflicts);
  }

  async getAllVerificationMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {},
  ): Promise<MessagesPage<VerificationAddAddressMessage | VerificationRemoveMessage>> {
    return await this.getAllMessagesByFid(fid, pageOptions);
  }

  async migrateVerifications(): HubAsyncResult<{ total: number; duplicates: number }> {
    let verificationsCount = 0;
    let duplicatesCount = 0;

    await this._db.forEachIteratorByPrefix(
      Buffer.from([RootPrefix.User]),
      async (key, value) => {
        const postfix = (key as Buffer).readUint8(1 + FID_BYTES);
        if (postfix !== this._postfix) {
          return false; // Ignore non-verification messages
        }
        const message = Result.fromThrowable(
          () => messageDecode(new Uint8Array(value as Buffer)),
          (e) => e,
        )();

        if (message.isErr()) {
          return false; // Ignore invalid messages
        }

        if (!this._isAddType(message.value)) {
          return false; // Ignore non-add messages
        }

        const fid = message.value.data.fid;
        const verificationAdd = message.value.data.verificationAddAddressBody;
        const txn = this._db.transaction();
        const byAddressKey = makeVerificationByAddressKey(message.value.data.verificationAddAddressBody.address);
        const existingFidRes = await ResultAsync.fromPromise(this._db.get(byAddressKey), () => undefined);
        if (existingFidRes.isOk()) {
          const existingFid = readFidKey(existingFidRes.value);
          const existingMessage = await this.getAdd({
            data: {
              fid: existingFid,
              verificationAddAddressBody: {
                address: verificationAdd.address,
              },
            },
          });
          const tsHash = makeTsHash(message.value.data.timestamp, message.value.hash);
          const existingTsHash = makeTsHash(existingMessage.data.timestamp, existingMessage.hash);

          if (tsHash.isErr() || existingTsHash.isErr()) {
            throw new HubError("bad_request", "failed to make tsHash");
          }

          const messageCompare = this.messageCompare(
            this._addMessageType,
            existingTsHash.value,
            this._addMessageType,
            tsHash.value,
          );

          if (messageCompare === 0) {
            logger.info(
              { fid: fid },
              `Unexpected duplicate during migration: ${Buffer.from(verificationAdd.address).toString("hex")}`,
            );
          } else if (messageCompare > 0) {
            logger.info(
              { fid: fid, existingFid: existingFid },
              `Deleting duplicate verification for fid: ${fid} ${Buffer.from(verificationAdd.address).toString("hex")}`,
            );
            deleteMessageTransaction(txn, message.value);
            txn.put(byAddressKey, makeFidKey(existingFid));
            duplicatesCount += 1;
          } else {
            logger.info(
              { fid: existingFid, existingFid: fid },
              `Deleting duplicate verification for fid: ${existingFid} ${Buffer.from(verificationAdd.address).toString(
                "hex",
              )}`,
            );
            deleteMessageTransaction(txn, existingMessage);
            txn.put(byAddressKey, makeFidKey(fid));
            duplicatesCount += 1;
          }
        } else {
          txn.put(byAddressKey, makeFidKey(fid));
        }
        verificationsCount += 1;
        await this._db.commit(txn);

        return false; // Continue iterating
      },
      { valueAsBuffer: true },
      1 * 60 * 60 * 1000, // 1 hour
    );
    return ok({ total: verificationsCount, duplicates: duplicatesCount });
  }
}

export default VerificationStore;
