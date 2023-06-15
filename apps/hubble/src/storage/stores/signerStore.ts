import {
  HubAsyncResult,
  HubError,
  HubEventType,
  IdRegistryEvent,
  isSignerAddMessage,
  isSignerRemoveMessage,
  MessageType,
  SignerAddMessage,
  SignerRemoveMessage,
} from '@farcaster/hub-nodejs';
import { ok, ResultAsync } from 'neverthrow';
import {
  getIdRegistryEvent,
  getIdRegistryEventByCustodyAddress,
  putIdRegistryEventTransaction,
} from '../db/idRegistryEvent.js';
import { getPageIteratorByPrefix, makeUserKey } from '../db/message.js';
import { Iterator } from '../db/rocksdb.js';
import { RootPrefix, UserMessagePostfix, UserPostfix } from '../db/types.js';
import { MessagesPage, PAGE_SIZE_MAX, PageOptions } from './types.js';
import { eventCompare } from './utils.js';
import { Store } from './store.js';

const PRUNE_SIZE_LIMIT_DEFAULT = 100;

/**
 * Generates a unique key used to store a SignerAdd message key in the SignerAdds set index
 *
 * @param fid farcaster id of the user who created the Signer
 * @param signerPubKey the EdDSA public key of the signer
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<signerPubKey?>
 */
const makeSignerAddsKey = (fid: number, signerPubKey?: Uint8Array): Buffer => {
  return Buffer.concat([
    makeUserKey(fid),
    Buffer.from([UserPostfix.SignerAdds]),
    signerPubKey ? Buffer.from(signerPubKey) : new Uint8Array(),
  ]);
};

/**
 * Generates a unique key used to store a SignerRemove message key in the SignerRemoves set index
 *
 * @param fid farcaster id of the user who created the Signer
 * @param signerPubKey the EdDSA public key of the signer
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<signerPubKey?>
 */
const makeSignerRemovesKey = (fid: number, signerPubKey?: Uint8Array): Buffer => {
  return Buffer.concat([
    makeUserKey(fid),
    Buffer.from([UserPostfix.SignerRemoves]),
    signerPubKey ? Buffer.from(signerPubKey) : new Uint8Array(),
  ]);
};

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
class SignerStore extends Store<SignerAddMessage, SignerRemoveMessage> {
  override _postfix: UserMessagePostfix = UserPostfix.SignerMessage;
  override makeAddKey(msg: SignerAddMessage) {
    return makeSignerAddsKey(msg.data.fid, (msg.data.signerAddBody || msg.data.signerRemoveBody).signer) as Buffer;
  }

  override makeRemoveKey(msg: SignerRemoveMessage) {
    return makeSignerRemovesKey(msg.data.fid, (msg.data.signerAddBody || msg.data.signerRemoveBody).signer);
  }

  override _isAddType = isSignerAddMessage;
  override _isRemoveType = isSignerRemoveMessage;
  override _addMessageType = MessageType.SIGNER_ADD;
  override _removeMessageType = MessageType.SIGNER_REMOVE;
  protected override PRUNE_SIZE_LIMIT_DEFAULT = PRUNE_SIZE_LIMIT_DEFAULT;

  override async findMergeAddConflicts(_message: SignerAddMessage): HubAsyncResult<void> {
    return ok(undefined);
  }
  override async findMergeRemoveConflicts(_message: SignerRemoveMessage): HubAsyncResult<void> {
    return ok(undefined);
  }

  /** Returns the most recent event from the IdRegistry contract that affected the fid  */
  async getIdRegistryEvent(fid: number): Promise<IdRegistryEvent> {
    return getIdRegistryEvent(this._db, fid);
  }

  async getIdRegistryEventByAddress(address: Uint8Array): Promise<IdRegistryEvent> {
    return getIdRegistryEventByCustodyAddress(this._db, address);
  }

  /**
   * Finds a SignerAdd Message by checking the adds-set's index for a user's custody address
   *
   * @param fid fid of the user who created the SignerAdd
   * @param signerPubKey the EdDSA public key of the signer
   * @returns the SignerAdd Model if it exists, throws Error otherwise
   */
  async getSignerAdd(fid: number, signer: Uint8Array): Promise<SignerAddMessage> {
    return await this.getAdd({ data: { fid, signerAddBody: { signer } } });
  }

  /**
   * Finds a SignerRemove Message by checking the remove-set's index for a user's custody address
   *
   * @param fid fid of the user who created the SignerRemove
   * @param signer the EdDSA public key of the signer
   * @returns the SignerRemove message if it exists, throws HubError otherwise
   */
  async getSignerRemove(fid: number, signer: Uint8Array): Promise<SignerRemoveMessage> {
    return await this.getRemove({ data: { fid, signerRemoveBody: { signer } } });
  }

  /**
   * Finds all SignerAdd messages for a user's custody address
   *
   * @param fid fid of the user who created the signers
   * @returns the SignerAdd messages if it exists, throws HubError otherwise
   */
  async getSignerAddsByFid(fid: number, pageOptions: PageOptions = {}): Promise<MessagesPage<SignerAddMessage>> {
    return await this.getAddsByFid({ data: { fid } }, pageOptions);
  }

  /**
   * Finds all SignerRemove messages for a user's custody address
   *
   * @param fid fid of the user who created the signers
   * @returns the SignerRemove messages if it exists, throws HubError otherwise
   */
  async getSignerRemovesByFid(fid: number, pageOptions: PageOptions = {}): Promise<MessagesPage<SignerRemoveMessage>> {
    return await this.getRemovesByFid({ data: { fid } }, pageOptions);
  }

  async getAllSignerMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<SignerAddMessage | SignerRemoveMessage>> {
    return await this.getAllMessagesByFid(fid, pageOptions);
  }

  async getFids(pageOptions: PageOptions = {}): Promise<{
    fids: number[];
    nextPageToken: Uint8Array | undefined;
  }> {
    const prefix = Buffer.from([RootPrefix.IdRegistryEvent]);

    const iterator = getPageIteratorByPrefix(this._db, prefix, pageOptions);

    const limit = pageOptions.pageSize || PAGE_SIZE_MAX;

    const fids: number[] = [];

    /** Custom to retrieve fid from key */
    const getNextIteratorRecord = async (iterator: Iterator): Promise<[Buffer, number]> => {
      const [key] = await iterator.next();
      return [key as Buffer, Number((key as Buffer).readUint32BE(1))];
    };

    let iteratorFinished = false;
    let lastPageToken: Uint8Array | undefined;
    do {
      const result = await ResultAsync.fromPromise(getNextIteratorRecord(iterator), (e) => e as HubError);
      if (result.isErr()) {
        iteratorFinished = true;
        break;
      }

      const [key, fid] = result.value;
      lastPageToken = Uint8Array.from(key.subarray(prefix.length));
      fids.push(fid);
    } while (fids.length < limit);

    await iterator.end();
    if (!iteratorFinished) {
      return { fids, nextPageToken: lastPageToken };
    } else {
      return { fids, nextPageToken: undefined };
    }
  }

  /**
   * Merges a ContractEvent into the SignerStore, storing the causally latest event at the key:
   * <RootPrefix:User><fid><UserPostfix:IdRegistryEvent>
   */
  async mergeIdRegistryEvent(event: IdRegistryEvent): Promise<number> {
    const existingEvent = await ResultAsync.fromPromise(this.getIdRegistryEvent(event.fid), () => undefined);
    if (existingEvent.isOk() && eventCompare(existingEvent.value, event) >= 0) {
      throw new HubError('bad_request.conflict', 'event conflicts with a more recent IdRegistryEvent');
    }

    const txn = putIdRegistryEventTransaction(this._db.transaction(), event);

    const result = await this._eventHandler.commitTransaction(txn, {
      type: HubEventType.MERGE_ID_REGISTRY_EVENT,
      mergeIdRegistryEventBody: { idRegistryEvent: event },
    });
    if (result.isErr()) {
      throw result.error;
    }
    return result.value;
  }
}

export default SignerStore;
