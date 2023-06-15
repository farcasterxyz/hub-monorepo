import { CastAddMessage, CastRemoveMessage, NobleEd25519Signer, makeCastAdd } from '@farcaster/hub-nodejs';
import * as ed from '@noble/ed25519';
import { DeepPartial, Store } from './store.js';
import { MessageType, HubAsyncResult } from '@farcaster/hub-nodejs';
import { UserMessagePostfix, UserPostfix } from '../db/types.js';
import { Message } from '@farcaster/hub-nodejs';
import { isCastAddMessage } from '@farcaster/hub-nodejs';
import { isCastRemoveMessage } from '@farcaster/hub-nodejs';
import StoreEventHandler from './storeEventHandler.js';
import { jestRocksDB } from '../db/jestUtils.js';
import { ResultAsync, ok } from 'neverthrow';
import { HubError } from '@farcaster/hub-nodejs';
import { Transaction } from '../db/rocksdb.js';

const db = jestRocksDB('protobufs.generalStore.test');
const eventHandler = new StoreEventHandler(db);

class TestStore extends Store<CastAddMessage, CastRemoveMessage> {
  override makeAddKey(data: DeepPartial<CastAddMessage>) {
    return data.hash as Uint8Array as Buffer;
  }
  override makeRemoveKey(data: DeepPartial<CastRemoveMessage>) {
    return data.hash as Uint8Array as Buffer;
  }
  override _isAddType: (message: Message) => message is CastAddMessage = isCastAddMessage;
  override _isRemoveType: ((message: Message) => message is CastRemoveMessage) | undefined = isCastRemoveMessage;
  override _postfix: UserMessagePostfix = UserPostfix.CastMessage;
  override _addMessageType: MessageType = MessageType.CAST_ADD;
  override _removeMessageType: MessageType | undefined = MessageType.CAST_REMOVE;
  override async findMergeAddConflicts(message: CastAddMessage): HubAsyncResult<void> {
    // Look up the remove tsHash for this cast
    const castRemoveTsHash = await ResultAsync.fromPromise(
      this._db.get(this.makeRemoveKey(message as unknown as CastRemoveMessage)),
      () => undefined
    );

    // If remove tsHash exists, fail because this cast has already been removed
    if (castRemoveTsHash.isOk()) {
      throw new HubError('bad_request.conflict', 'message conflicts with a CastRemove');
    }

    // Look up the add tsHash for this cast
    const castAddTsHash = await ResultAsync.fromPromise(this._db.get(this.makeAddKey(message)), () => undefined);

    // If add tsHash exists, no-op because this cast has already been added
    if (castAddTsHash.isOk()) {
      throw new HubError('bad_request.duplicate', 'message has already been merged');
    }

    return ok(undefined);
  }
  override async findMergeRemoveConflicts(message: CastRemoveMessage): HubAsyncResult<void> {
    // Look up the remove tsHash for this cast
    const castRemoveTsHash = await ResultAsync.fromPromise(
      this._db.get(this.makeRemoveKey(message as unknown as CastRemoveMessage)),
      () => undefined
    );

    // If remove tsHash exists, fail because this cast has already been removed
    if (castRemoveTsHash.isOk()) {
      throw new HubError('bad_request.conflict', 'message conflicts with a CastRemove');
    }

    return ok(undefined);
  }
  override async validateAdd(message: CastAddMessage): HubAsyncResult<void> {
    // Look up the remove tsHash for this cast
    const castRemoveTsHash = await ResultAsync.fromPromise(
      this._db.get(this.makeRemoveKey(message as unknown as CastRemoveMessage)),
      () => undefined
    );

    // If remove tsHash exists, fail because this cast has already been removed
    if (castRemoveTsHash.isOk()) {
      throw new HubError('bad_request.conflict', 'message conflicts with a CastRemove');
    }

    // Look up the add tsHash for this cast
    const castAddTsHash = await ResultAsync.fromPromise(this._db.get(this.makeAddKey(message)), () => undefined);

    // If add tsHash exists, no-op because this cast has already been added
    if (castAddTsHash.isOk()) {
      throw new HubError('bad_request.duplicate', 'message has already been merged');
    }

    return ok(undefined);
  }
  override validateRemove(_remove: CastRemoveMessage): HubAsyncResult<void> {
    throw new Error('Method not implemented.');
  }
  override async buildSecondaryIndices(_txn: Transaction, _add: CastAddMessage): HubAsyncResult<void> {
    return ok(undefined);
  }
  override async deleteSecondaryIndices(_txn: Transaction, _add: CastAddMessage): HubAsyncResult<void> {
    return ok(undefined);
  }
}

describe('store', () => {
  test('creates keys following declared order', async () => {
    const privKey = ed.utils.randomPrivateKey();
    const ed25519Signer = new NobleEd25519Signer(privKey);
    const castAdd = await makeCastAdd(
      {
        text: '',
        embeds: [],
        embedsDeprecated: [],
        mentions: [],
        mentionsPositions: [],
      },
      { fid: 1, network: 2 },
      ed25519Signer
    );

    const store = new TestStore(db, eventHandler, {
      pruneSizeLimit: 100,
      pruneTimeLimit: 100,
    });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await store.merge(castAdd._unsafeUnwrap());

    await store.getAdd({ hash: castAdd._unsafeUnwrap().hash, data: { fid: castAdd._unsafeUnwrap().data.fid } });
  });
});
