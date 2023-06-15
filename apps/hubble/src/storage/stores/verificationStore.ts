import {
  HubAsyncResult,
  isVerificationAddEthAddressMessage,
  isVerificationRemoveMessage,
  MessageType,
  VerificationAddEthAddressMessage,
  VerificationRemoveMessage,
} from '@farcaster/hub-nodejs';
import { ok } from 'neverthrow';
import { makeUserKey } from '../db/message.js';
import { UserMessagePostfix, UserPostfix } from '../db/types.js';
import { MessagesPage, PageOptions } from './types.js';
import { Store } from './store.js';

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

class VerificationStore extends Store<VerificationAddEthAddressMessage, VerificationRemoveMessage> {
  override _postfix: UserMessagePostfix = UserPostfix.VerificationMessage;

  override makeAddKey(msg: VerificationAddEthAddressMessage) {
    return makeVerificationAddsKey(
      msg.data.fid,
      (msg.data.verificationAddEthAddressBody || msg.data.verificationRemoveBody).address
    ) as Buffer;
  }

  override makeRemoveKey(msg: VerificationRemoveMessage) {
    return makeVerificationRemovesKey(
      msg.data.fid,
      (msg.data.verificationAddEthAddressBody || msg.data.verificationRemoveBody).address
    );
  }

  override async findMergeAddConflicts(_message: VerificationAddEthAddressMessage): HubAsyncResult<void> {
    return ok(undefined);
  }

  override async findMergeRemoveConflicts(_message: VerificationRemoveMessage): HubAsyncResult<void> {
    return ok(undefined);
  }

  override _isAddType = isVerificationAddEthAddressMessage;
  override _isRemoveType = isVerificationRemoveMessage;
  override _addMessageType = MessageType.VERIFICATION_ADD_ETH_ADDRESS;
  override _removeMessageType = MessageType.VERIFICATION_REMOVE;
  protected override PRUNE_SIZE_LIMIT_DEFAULT = PRUNE_SIZE_LIMIT_DEFAULT;

  /**
   * Finds a VerificationAdds Message by checking the adds-set's index
   *
   * @param fid fid of the user who created the SignerAdd
   * @param address the address being verified
   *
   * @returns the VerificationAddEthAddressModel if it exists, throws HubError otherwise
   */
  async getVerificationAdd(fid: number, address: Uint8Array): Promise<VerificationAddEthAddressMessage> {
    return await this.getAdd({ data: { fid, verificationAddEthAddressBody: { address } } });
  }

  /**
   * Finds a VerificationsRemove Message by checking the remove-set's index
   *
   * @param fid fid of the user who created the SignerAdd
   * @param address the address being verified
   * @returns the VerificationRemoveEthAddress if it exists, throws HubError otherwise
   */
  async getVerificationRemove(fid: number, address: Uint8Array): Promise<VerificationRemoveMessage> {
    return await this.getRemove({ data: { fid, verificationRemoveBody: { address } } });
  }

  /**
   * Finds all VerificationAdds messages for a user
   *
   * @param fid fid of the user who created the signers
   * @returns the VerificationAddEthAddresses if they exists, throws HubError otherwise
   */
  async getVerificationAddsByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<VerificationAddEthAddressMessage>> {
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
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<VerificationRemoveMessage>> {
    return await this.getRemovesByFid({ data: { fid } }, pageOptions);
  }

  async getAllVerificationMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<VerificationAddEthAddressMessage | VerificationRemoveMessage>> {
    return await this.getAllMessagesByFid(fid, pageOptions);
  }
}

export default VerificationStore;
