import { performDbMigrations } from "./migrations.js";
import { Factories, isVerificationAddAddressMessage } from "@farcaster/hub-nodejs";
import { jestRocksDB } from "../jestUtils.js";
import StoreEventHandler from "../../stores/storeEventHandler.js";
import VerificationStore, {
  makeVerificationAddsKey,
  makeVerificationRemovesKey,
} from "../../stores/verificationStore.js";
import { VerificationAddAddressMessage, VerificationRemoveMessage } from "@farcaster/core";
import RocksDB from "../rocksdb.js";
import { makeTsHash, putMessageTransaction } from "../message.js";
import OnChainEventStore from "../../stores/onChainEventStore.js";

const db = jestRocksDB("uniqueverifications.migration.test");

describe("uniqueVerifications migration", () => {
  const putVerificationMessage = async (
    db: RocksDB,
    message: VerificationAddAddressMessage | VerificationRemoveMessage,
  ) => {
    const txn = db.transaction();
    const tsHash = makeTsHash(message.data?.timestamp, message.hash)._unsafeUnwrap();
    putMessageTransaction(txn, message);
    if (isVerificationAddAddressMessage(message)) {
      const addKey = makeVerificationAddsKey(message.data.fid, message.data.verificationAddAddressBody.address);
      txn.put(addKey, Buffer.from(tsHash));
    } else {
      const removeKey = makeVerificationRemovesKey(message.data.fid, message.data.verificationRemoveBody.address);
      txn.put(removeKey, Buffer.from(tsHash));
    }
    await db.commit(txn);
  };

  test("should delete duplicate verifications by address", async () => {
    const fid = Factories.Fid.build();
    const ethSigner = Factories.Eip712Signer.build();
    const ethSignerKey = (await ethSigner.getSignerKey())._unsafeUnwrap();
    const verificationAdd1 = await Factories.VerificationAddEthAddressMessage.create(
      {
        data: { fid, verificationAddAddressBody: { address: ethSignerKey } },
      },
      { transient: { ethSigner } },
    );
    const verificationAdd2 = await Factories.VerificationAddEthAddressMessage.create({
      data: { fid },
    });

    const verificationRemove = await Factories.VerificationRemoveMessage.create({
      data: { fid },
    });
    const olderVerificationAddDifferentFid = await Factories.VerificationAddEthAddressMessage.create({
      data: {
        ...verificationAdd1.data,
        timestamp: verificationAdd1.data.timestamp - 100,
        fid: fid + 1,
      },
    });
    const newerVerificationAddDifferentFid = await Factories.VerificationAddEthAddressMessage.create({
      data: {
        ...verificationAdd2.data,
        timestamp: verificationAdd2.data.timestamp + 2,
        fid: olderVerificationAddDifferentFid.data.fid,
      },
    });

    const onChainEvenStore = new OnChainEventStore(db, new StoreEventHandler(db));
    await onChainEvenStore.mergeOnChainEvent(Factories.IdRegistryOnChainEvent.build({ fid }));
    await onChainEvenStore.mergeOnChainEvent(
      Factories.IdRegistryOnChainEvent.build({ fid: olderVerificationAddDifferentFid.data.fid }),
    );

    await putVerificationMessage(db, verificationAdd1);
    await putVerificationMessage(db, verificationAdd2);
    await putVerificationMessage(db, verificationRemove);
    await putVerificationMessage(db, olderVerificationAddDifferentFid);
    await putVerificationMessage(db, newerVerificationAddDifferentFid);

    const store = new VerificationStore(db, new StoreEventHandler(db));

    expect((await store.getAllVerificationMessagesByFid(verificationAdd1.data.fid)).messages).toHaveLength(3);
    expect(
      (await store.getAllVerificationMessagesByFid(olderVerificationAddDifferentFid.data.fid)).messages,
    ).toHaveLength(2);

    const success = await performDbMigrations(db, 3, 4);
    expect(success).toBe(true);

    expect((await store.getAllVerificationMessagesByFid(verificationAdd1.data.fid)).messages).toHaveLength(2);
    expect(
      (await store.getAllVerificationMessagesByFid(olderVerificationAddDifferentFid.data.fid)).messages,
    ).toHaveLength(1);
    await expect(store.getVerificationAdd(verificationAdd1.data.fid, ethSignerKey)).resolves.toEqual(verificationAdd1);
    await expect(store.getVerificationAdd(olderVerificationAddDifferentFid.data.fid, ethSignerKey)).rejects.toThrow(
      "NotFound",
    );
  });
});
