import {
  HubAsyncResult,
  HubError,
  LinkAddMessage,
  LinkRemoveMessage,
  MessageType,
  isLinkAddMessage,
  isLinkRemoveMessage,
} from '@farcaster/hub-nodejs';
import {
  getManyMessages,
  getPageIteratorByPrefix,
  makeFidKey,
  makeMessagePrimaryKey,
  makeTsHash,
  makeUserKey,
} from '../../storage/db/message.js';
import { RootPrefix, TSHASH_LENGTH, UserMessagePostfix, UserPostfix } from '../db/types.js';
import { MessagesPage, PAGE_SIZE_MAX, PageOptions } from './types.js';
import { Store } from './store.js';
import { ResultAsync, err, ok } from 'neverthrow';
import { Transaction } from '../db/rocksdb.js';

const PRUNE_SIZE_LIMIT_DEFAULT = 2_500;

const makeTargetKey = (target: number): Buffer => {
  return makeFidKey(target);
};

/**
 * Generates a unique key used to store a LinkAdd message key in the LinksAdd Set index
 *
 * @param fid farcaster id of the user who created the link
 * @param type type of link created
 * @param targetId id of the object being reacted to
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<targetKey?>:<type?>
 */
const makeLinkAddsKey = (fid: number, type?: string, target?: number): Buffer => {
  if (target && !type) {
    throw new HubError('bad_request.validation_failure', 'targetId provided without type');
  }

  if (type && (Buffer.from(type).length > 8 || type.length == 0)) {
    throw new HubError('bad_request.validation_failure', 'type must be 1-8 bytes');
  }

  return Buffer.concat([
    makeUserKey(fid), // --------------------------- fid prefix, 33 bytes
    Buffer.from([UserPostfix.LinkAdds]), // -------------- link_adds key, 1 byte
    type ? Buffer.concat([Buffer.from(type)], 8) : Buffer.from(''), //-------- type, 8 bytes
    target ? makeTargetKey(target) : Buffer.from(''), //-- target id, 4 bytes
  ]);
};

/**
 * Generates a unique key used to store a LinkRemove message key in the LinksRemove Set index
 *
 * @param fid farcaster id of the user who created the link
 * @param type type of link created
 * @param targetId id of the object being reacted to
 *
 * @returns RocksDB key of the form <RootPrefix>:<fid>:<UserPostfix>:<targetKey?>:<type?>
 */
const makeLinkRemovesKey = (fid: number, type?: string, target?: number): Buffer => {
  if (target && !type) {
    throw new HubError('bad_request.validation_failure', 'targetId provided without type');
  }

  if (type && (Buffer.from(type).length > 8 || type.length == 0)) {
    throw new HubError('bad_request.validation_failure', 'type must be 1-8 bytes');
  }

  return Buffer.concat([
    makeUserKey(fid), // --------------------------- fid prefix, 33 bytes
    Buffer.from([UserPostfix.LinkRemoves]), // ----------- link_adds key, 1 byte
    type ? Buffer.concat([Buffer.from(type)], 8) : Buffer.from(''), //-------- type, 8 bytes
    target ? makeTargetKey(target) : Buffer.from(''), //-- target id, 4 bytes
  ]);
};

/**
 * Generates a unique key used to store a LinkAdd Message in the LinksByTargetAndType index
 *
 * @param targetId the id of the object being reacted to (currently just cast id)
 * @param fid the fid of the user who created the link
 * @param tsHash the timestamp hash of the link message
 *
 * @returns RocksDB index key of the form <RootPrefix>:<target_key>:<fid?>:<tsHash?>
 */
const makeLinksByTargetKey = (target: number, fid?: number, tsHash?: Uint8Array): Buffer => {
  if (fid && !tsHash) {
    throw new HubError('bad_request.validation_failure', 'fid provided without tsHash');
  }

  if (tsHash && !fid) {
    throw new HubError('bad_request.validation_failure', 'tsHash provided without fid');
  }

  return Buffer.concat([
    Buffer.from([RootPrefix.LinksByTarget]),
    makeTargetKey(target),
    Buffer.from(tsHash ?? ''),
    fid ? makeFidKey(fid) : Buffer.from(''),
  ]);
};

/**
 * LinkStore persists Link Messages in RocksDB using a two-phase CRDT set to guarantee
 * eventual consistency.
 *
 * A Link is created by a user and points at a target (e.g. fid) and has a type (e.g. "follow").
 * Links are added with a LinkAdd and removed with a LinkRemove. Link messages can
 * collide if two messages have the same user fid, target, and type. Collisions are handled with
 * Last-Write-Wins + Remove-Wins rules as follows:
 *
 * 1. Highest timestamp wins
 * 2. Remove wins over Adds
 * 3. Highest lexicographic hash wins
 *
 * LinkMessages are stored ordinally in RocksDB indexed by a unique key `fid:tsHash`,
 * which makes truncating a user's earliest messages easy. Indices are built to look up
 * link adds in the adds set, link removes in the remove set and all links
 * for a given target. The key-value entries created by the Link Store are:
 *
 * 1. fid:tsHash -> link message
 * 2. fid:set:targetCastTsHash:linkType -> fid:tsHash (Set Index)
 * 3. linkTarget:linkType:targetCastTsHash -> fid:tsHash (Target Index)
 */
class LinkStore extends Store<LinkAddMessage, LinkRemoveMessage> {
  override _postfix: UserMessagePostfix = UserPostfix.LinkMessage;

  override makeAddKey(msg: LinkAddMessage) {
    return makeLinkAddsKey(msg.data.fid, msg.data.linkBody.type, msg.data.linkBody.targetFid) as Buffer;
  }

  override makeRemoveKey(msg: LinkRemoveMessage) {
    return makeLinkRemovesKey(msg.data.fid, msg.data.linkBody.type, msg.data.linkBody.targetFid);
  }

  override async findMergeAddConflicts(_message: LinkAddMessage): HubAsyncResult<void> {
    return ok(undefined);
  }

  override async findMergeRemoveConflicts(_message: LinkRemoveMessage): HubAsyncResult<void> {
    return ok(undefined);
  }

  override _isAddType = isLinkAddMessage;
  override _isRemoveType = isLinkRemoveMessage;
  override _addMessageType = MessageType.LINK_ADD;
  override _removeMessageType = MessageType.LINK_REMOVE;
  protected override PRUNE_SIZE_LIMIT_DEFAULT = PRUNE_SIZE_LIMIT_DEFAULT;

  override async buildSecondaryIndices(txn: Transaction, message: LinkAddMessage): HubAsyncResult<void> {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);

    if (tsHash.isErr()) {
      return err(tsHash.error);
    }

    if (!message.data.linkBody.targetFid) {
      return err(new HubError('bad_request.invalid_param', 'targetfid null'));
    }

    // Puts message key into the byTarget index
    const byTargetKey = makeLinksByTargetKey(message.data.linkBody.targetFid, message.data.fid, tsHash.value);
    txn = txn.put(byTargetKey, Buffer.from(message.data.linkBody.type));

    return ok(undefined);
  }

  override async deleteSecondaryIndices(txn: Transaction, message: LinkAddMessage): HubAsyncResult<void> {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);

    if (tsHash.isErr()) {
      return err(tsHash.error);
    }

    if (!message.data.linkBody.targetFid) {
      return err(new HubError('bad_request.invalid_param', 'targetfid null'));
    }

    // Delete the message key from byTarget index
    const byTargetKey = makeLinksByTargetKey(message.data.linkBody.targetFid, message.data.fid, tsHash.value);
    txn = txn.del(byTargetKey);

    return ok(undefined);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Instance Methods                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Finds a LinkAdd Message by checking the Adds Set index
   *
   * @param fid fid of the user who created the link add
   * @param type type of link that was added
   * @param target id of the fid being linked to
   *
   * @returns the LinkAdd Model if it exists, undefined otherwise
   */
  async getLinkAdd(fid: number, type: string, target: number): Promise<LinkAddMessage> {
    return await this.getAdd({ data: { fid, linkBody: { type, targetFid: target } } });
  }

  /**
   * Finds a LinkRemove Message by checking the Remove Set index
   *
   * @param fid fid of the user who created the link remove
   * @param type type of link that was removed
   * @param target id of the fid being linked to
   * @returns the LinkRemove message if it exists, undefined otherwise
   */
  async getLinkRemove(fid: number, type: string, target: number): Promise<LinkRemoveMessage> {
    return await this.getRemove({ data: { fid, linkBody: { type, targetFid: target } } });
  }

  /** Finds all LinkAdd Messages by iterating through the prefixes */
  async getLinkAddsByFid(
    fid: number,
    type?: string,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<LinkAddMessage>> {
    return await this.getAddsByFid({ data: { fid, linkBody: { type: type as string } } }, pageOptions);
  }

  /** Finds all LinkRemove Messages by iterating through the prefixes */
  async getLinkRemovesByFid(
    fid: number,
    type?: string,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<LinkRemoveMessage>> {
    return await this.getRemovesByFid({ data: { fid, linkBody: { type: type as string } } }, pageOptions);
  }

  async getAllLinkMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<LinkAddMessage | LinkRemoveMessage>> {
    return await this.getAllMessagesByFid(fid, pageOptions);
  }

  /** Finds all LinkAdds that point to a specific target by iterating through the prefixes */
  async getLinksByTarget(
    target: number,
    type?: string,
    pageOptions: PageOptions = {}
  ): Promise<MessagesPage<LinkAddMessage>> {
    const prefix = makeLinksByTargetKey(target);

    const iterator = getPageIteratorByPrefix(this._db, prefix, pageOptions);

    const limit = pageOptions.pageSize || PAGE_SIZE_MAX;

    const messageKeys: Buffer[] = [];

    let iteratorFinished = false;
    let lastPageToken: Uint8Array | undefined;
    do {
      const result = await ResultAsync.fromPromise(iterator.next(), (e) => e as HubError);
      if (result.isErr()) {
        iteratorFinished = true;
        break;
      }

      const [key, value] = result.value;

      lastPageToken = Uint8Array.from((key as Buffer).subarray(prefix.length));

      if (type === undefined || (value !== undefined && value.equals(Buffer.from(type)))) {
        // Calculates the positions in the key where the fid and tsHash begin
        const tsHashOffset = prefix.length;
        const fidOffset = tsHashOffset + TSHASH_LENGTH;

        const fid = Number((key as Buffer).readUint32BE(fidOffset));
        const tsHash = Uint8Array.from(key as Buffer).subarray(tsHashOffset, tsHashOffset + TSHASH_LENGTH);
        const messagePrimaryKey = makeMessagePrimaryKey(fid, UserPostfix.LinkMessage, tsHash);

        messageKeys.push(messagePrimaryKey);
      }
    } while (messageKeys.length < limit);

    const messages = await getManyMessages<LinkAddMessage>(this._db, messageKeys);

    await iterator.end();
    if (!iteratorFinished) {
      return { messages, nextPageToken: lastPageToken };
    } else {
      return { messages, nextPageToken: undefined };
    }
  }
}

export default LinkStore;
