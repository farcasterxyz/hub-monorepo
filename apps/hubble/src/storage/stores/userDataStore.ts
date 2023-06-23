import {
  HubAsyncResult,
  HubError,
  HubEventType,
  isUserDataAddMessage,
  MessageType,
  NameRegistryEvent,
  UserNameProof,
  UserDataAddMessage,
  UserDataType,
} from '@farcaster/hub-nodejs';
import { ok, ResultAsync } from 'neverthrow';
import { makeUserKey } from '../db/message.js';
import {
  getNameRegistryEvent,
  putNameRegistryEventTransaction,
  getUserNameProof,
  putUserNameProofTransaction,
  deleteUserNameProofTransaction,
} from '../db/nameRegistryEvent.js';
import { UserMessagePostfix, UserPostfix } from '../db/types.js';
import { MessagesPage, PageOptions } from '../stores/types.js';
import { eventCompare, usernameProofCompare } from '../stores/utils.js';
import { Store } from './store.js';
import { Transaction } from '../db/rocksdb.js';

const PRUNE_SIZE_LIMIT_DEFAULT = 100;

/**
 * Generates unique keys used to store or fetch UserDataAdd messages in the UserDataAdd set index
 *
 * @param fid farcaster id of the user who created the message
 * @param dataType type of data being added
 * @returns RocksDB key of the form <root_prefix>:<fid>:<user_postfix>:<dataType?>
 */
const makeUserDataAddsKey = (fid: number, dataType?: UserDataType): Buffer => {
  return Buffer.concat([
    makeUserKey(fid),
    Buffer.from([UserPostfix.UserDataAdds]),
    dataType ? Buffer.from([dataType]) : Buffer.from(''),
  ]);
};

/**
 * UserDataStore persists UserData messages in RocksDB using a grow-only CRDT set to guarantee
 * eventual consistency.
 *
 * A UserData entry is a key-value pair where the key can be one of a few defined types. They are
 * added and updated with UserDataAdd messages. They cannot be deleted but can be reset to a null
 * value with another UserData add message. UserDataAdd messages collide if the dataType is
 * identical for the same user. Collisions are handled with LWW rules as follows:
 *
 * 1. Highest timestamp wins
 * 2. Highest lexicographic hash wins
 *
 * UserData messages are stored ordinally in RocksDB indexed by a unique key `fid:tsHash` which
 * makes truncating a user's earliest messages easy. Indices are built to look up user data entries
 * in each user's add set. The key value entries created are:
 *
 * 1. fid:tsHash -> cast message
 * 2. fid:set:datatype -> fid:tsHash (adds set index)
 */
class UserDataStore extends Store<UserDataAddMessage, never> {
  override _postfix: UserMessagePostfix = UserPostfix.UserDataMessage;

  override makeAddKey(msg: UserDataAddMessage) {
    return makeUserDataAddsKey(msg.data.fid, msg.data.userDataBody.type) as Buffer;
  }

  override makeRemoveKey(_: never): Buffer {
    throw new Error('removes not supported');
  }

  override async findMergeAddConflicts(_message: UserDataAddMessage): HubAsyncResult<void> {
    return ok(undefined);
  }

  override async findMergeRemoveConflicts(_message: never): HubAsyncResult<void> {
    throw new Error('removes not supported');
  }

  override _isAddType = isUserDataAddMessage;
  override _isRemoveType = undefined;
  override _addMessageType = MessageType.USER_DATA_ADD;
  override _removeMessageType = undefined;
  protected override PRUNE_SIZE_LIMIT_DEFAULT = PRUNE_SIZE_LIMIT_DEFAULT;

  /**
   * Finds a UserDataAdd Message by checking the adds set index
   *
   * @param fid fid of the user who created the user data add
   * @param dataType type of UserData that was added
   * @returns the UserDataAdd Model if it exists, undefined otherwise
   */
  async getUserDataAdd(fid: number, dataType: UserDataType): Promise<UserDataAddMessage> {
    return await this.getAdd({ data: { fid, userDataBody: { type: dataType } } });
  }

  /** Finds all UserDataAdd messages for an fid */
  async getUserDataAddsByFid(fid: number, pageOptions: PageOptions = {}): Promise<MessagesPage<UserDataAddMessage>> {
    return await this.getAddsByFid({ data: { fid } }, pageOptions);
  }

  /** Returns the most recent event from the NameEventRegistry contract for an fname */
  async getNameRegistryEvent(fname: Uint8Array): Promise<NameRegistryEvent> {
    return getNameRegistryEvent(this._db, fname);
  }

  async getUserNameProof(name: Uint8Array): Promise<UserNameProof> {
    return getUserNameProof(this._db, name);
  }

  /**
   * Merges a NameRegistryEvent storing the causally latest event at the key:
   * <name registry root prefix byte, fname>
   */
  async mergeNameRegistryEvent(event: NameRegistryEvent): Promise<number> {
    const existingEvent = await ResultAsync.fromPromise(this.getNameRegistryEvent(event.fname), () => undefined);
    if (existingEvent.isOk() && eventCompare(existingEvent.value, event) >= 0) {
      throw new HubError('bad_request.conflict', 'event conflicts with a more recent NameRegistryEvent');
    }

    const txn = putNameRegistryEventTransaction(this._db.transaction(), event);

    const result = await this._eventHandler.commitTransaction(txn, {
      type: HubEventType.MERGE_NAME_REGISTRY_EVENT,
      mergeNameRegistryEventBody: { nameRegistryEvent: event },
    });

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  }

  async mergeUserNameProof(usernameProof: UserNameProof): Promise<number> {
    const existingProof = await ResultAsync.fromPromise(this.getUserNameProof(usernameProof.name), () => undefined);
    if (existingProof.isOk() && usernameProofCompare(existingProof.value, usernameProof) >= 0) {
      throw new HubError('bad_request.conflict', 'event conflicts with a more recent UserNameProof');
    }

    let txn: Transaction;
    if (usernameProof.fid === 0) {
      txn = deleteUserNameProofTransaction(this._db.transaction(), usernameProof);
    } else {
      txn = putUserNameProofTransaction(this._db.transaction(), usernameProof);
    }

    const result = await this._eventHandler.commitTransaction(txn, {
      type: HubEventType.MERGE_USERNAME_PROOF,
      mergeUsernameProofBody: { usernameProof: usernameProof },
    });

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  }
}

export default UserDataStore;
