import { CastAddMessage, CastRemoveMessage, NobleEd25519Signer, makeCastAdd } from "@farcaster/hub-nodejs";
import * as ed from "@noble/ed25519";
import { DeepPartial, Store } from "./store.js";
import { MessageType, HubAsyncResult } from "@farcaster/hub-nodejs";
import { UserMessagePostfix, UserPostfix } from "../db/types.js";
import { Message } from "@farcaster/hub-nodejs";
import { isCastAddMessage } from "@farcaster/hub-nodejs";
import StoreEventHandler from "./storeEventHandler.js";
import { jestRocksDB } from "../db/jestUtils.js";
import { ResultAsync, err, ok } from "neverthrow";
import { HubError } from "@farcaster/hub-nodejs";
import { Transaction } from "../db/rocksdb.js";
import { Factories } from "@farcaster/hub-nodejs";
import { getFarcasterTime } from "@farcaster/hub-nodejs";
import { putRentRegistryEvent } from "../db/storageRegistryEvent.js";

const db = jestRocksDB("protobufs.generalStore.test");
const eventHandler = new StoreEventHandler(db);

class TestStore extends Store<CastAddMessage, CastRemoveMessage> {
  override makeAddKey(data: DeepPartial<CastAddMessage>) {
    return data.hash as Uint8Array as Buffer;
  }
  override makeRemoveKey(_data: DeepPartial<CastRemoveMessage>): Buffer {
    throw new Error("Method not implemented");
  }
  override _isAddType: (message: Message) => message is CastAddMessage = isCastAddMessage;
  override _isRemoveType: ((message: Message) => message is CastRemoveMessage) | undefined = undefined;
  override _postfix: UserMessagePostfix = UserPostfix.CastMessage;
  override _addMessageType: MessageType = MessageType.CAST_ADD;
  override _removeMessageType: MessageType | undefined = MessageType.CAST_REMOVE;
  override async findMergeAddConflicts(message: CastAddMessage): HubAsyncResult<void> {
    // Look up the add tsHash for this cast
    const castAddTsHash = await ResultAsync.fromPromise(this._db.get(this.makeAddKey(message)), () => undefined);

    // If add tsHash exists, no-op because this cast has already been added
    if (castAddTsHash.isOk()) {
      throw new HubError("bad_request.duplicate", "message has already been merged");
    }

    return ok(undefined);
  }
  override async findMergeRemoveConflicts(_message: CastRemoveMessage): HubAsyncResult<void> {
    throw new Error("Method not implemented");
  }
  override async validateAdd(message: CastAddMessage): HubAsyncResult<void> {
    // Look up the add tsHash for this cast
    const castAddTsHash = await ResultAsync.fromPromise(this._db.get(this.makeAddKey(message)), () => undefined);

    // If add tsHash exists, no-op because this cast has already been added
    if (castAddTsHash.isOk()) {
      throw new HubError("bad_request.duplicate", "message has already been merged");
    }

    return ok(undefined);
  }
  override validateRemove(_remove: CastRemoveMessage): HubAsyncResult<void> {
    throw new Error("Method not implemented.");
  }
  override async buildSecondaryIndices(_txn: Transaction, _add: CastAddMessage): HubAsyncResult<void> {
    return ok(undefined);
  }
  override async deleteSecondaryIndices(_txn: Transaction, _add: CastAddMessage): HubAsyncResult<void> {
    return ok(undefined);
  }
}

describe("store", () => {
  test("creates keys following declared order", async () => {
    const privKey = ed.utils.randomPrivateKey();
    const ed25519Signer = new NobleEd25519Signer(privKey);
    const castAdd = await makeCastAdd(
      {
        text: "",
        embeds: [],
        embedsDeprecated: [],
        mentions: [],
        mentionsPositions: [],
      },
      { fid: 1, network: 2 },
      ed25519Signer,
    );

    const store = new TestStore(db, eventHandler, {
      pruneSizeLimit: 100,
      pruneTimeLimit: 100,
    });
    await store.merge(castAdd._unsafeUnwrap());

    await store.getAdd({ hash: castAdd._unsafeUnwrap().hash, data: { fid: castAdd._unsafeUnwrap().data.fid } });
  });
  test("prunes respected when units are allocated, warned when not", async () => {
    const privKey2 = ed.utils.randomPrivateKey();
    const privKey3 = ed.utils.randomPrivateKey();
    const privKey4 = ed.utils.randomPrivateKey();
    const ed25519Signer2 = new NobleEd25519Signer(privKey2);
    const ed25519Signer3 = new NobleEd25519Signer(privKey3);
    const ed25519Signer4 = new NobleEd25519Signer(privKey4);

    const store = new TestStore(db, eventHandler, {
      pruneSizeLimit: 100,
    });

    const message3 = await Factories.RentRegistryEvent.create({
      fid: 3,
      expiry: getFarcasterTime()._unsafeUnwrap() + 365 * 24 * 60 * 60,
      units: 2,
    });

    const message4 = await Factories.RentRegistryEvent.create({
      fid: 4,
      expiry: getFarcasterTime()._unsafeUnwrap() + 365 * 24 * 60 * 60,
      units: 1,
    });

    await putRentRegistryEvent(db, message3);
    await putRentRegistryEvent(db, message4);
    await eventHandler.syncCache();

    for (let i = 0; i < 200; i++) {
      // don't use fid = 1, will conflict with other test
      const castAddFid2 = await makeCastAdd(
        {
          text: i.toString(),
          embeds: [],
          embedsDeprecated: [],
          mentions: [],
          mentionsPositions: [],
        },
        { fid: 2, network: 2, timestamp: getFarcasterTime()._unsafeUnwrap() + i },
        ed25519Signer2,
      );

      await store.merge(castAddFid2._unsafeUnwrap());

      const castAddFid3 = await makeCastAdd(
        {
          text: i.toString(),
          embeds: [],
          embedsDeprecated: [],
          mentions: [],
          mentionsPositions: [],
        },
        { fid: 3, network: 2, timestamp: getFarcasterTime()._unsafeUnwrap() + i },
        ed25519Signer3,
      );

      await store.merge(castAddFid3._unsafeUnwrap());

      const castAddFid4 = await makeCastAdd(
        {
          text: i.toString(),
          embeds: [],
          embedsDeprecated: [],
          mentions: [],
          mentionsPositions: [],
        },
        { fid: 4, network: 2, timestamp: getFarcasterTime()._unsafeUnwrap() + i },
        ed25519Signer4,
      );

      await store.merge(castAddFid4._unsafeUnwrap());
    }

    // For now, this should match the storage size, we follow existing behavior
    // for users without storage rent. Adjust this later.
    const pruneCount2 = await store.pruneMessages(2);
    expect(pruneCount2._unsafeUnwrap()).toHaveLength(100);

    // This user has two slots, should be double.
    const pruneCount3 = await store.pruneMessages(3);
    expect(pruneCount3._unsafeUnwrap()).toHaveLength(0);

    // This user has one slot, should mirror existing behavior.
    const pruneCount4 = await store.pruneMessages(4);
    expect(pruneCount4._unsafeUnwrap()).toHaveLength(100);
  });
});
