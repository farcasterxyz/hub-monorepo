import { performDbMigrations } from "./migrations.js";
import { jestRocksDB } from "../jestUtils.js";
import { MerkleTrie } from "../../../network/sync/merkleTrie.js";
import { SyncId, TIMESTAMP_LENGTH } from "../../../network/sync/syncId.js";
import { Factories } from "@farcaster/hub-nodejs";
import UserDataStore from "../../stores/userDataStore.js";
import StoreEventHandler from "../../stores/storeEventHandler.js";
import { FID_BYTES } from "../types.js";

const db = jestRocksDB("fnameSyncIds.migration.test");

const TEST_TIMEOUT_LONG = 10_000;

describe("fnameSyncIds migration", () => {
  test(
    "should delete unpaddded fname syncIds",
    async () => {
      const syncTrie = new MerkleTrie(db);
      const trieDb = syncTrie.getDb();
      await syncTrie.initialize();

      const proof1 = Factories.UserNameProof.build({ name: Buffer.from("test") });
      const proof2 = Factories.UserNameProof.build({ name: Buffer.from("somename") });
      const proof3 = Factories.UserNameProof.build({ name: Buffer.from("anothername") });
      const proofStore = new UserDataStore(db, new StoreEventHandler(db));
      await proofStore.mergeUserNameProof(proof1);
      await proofStore.mergeUserNameProof(proof2);
      await proofStore.mergeUserNameProof(proof3);

      const paddedFnameSyncId = SyncId.fromFName(proof1);
      const unpaddedFnameSyncId1 = SyncId.fromFName(proof2).syncId();
      const unpaddedFnameSyncId2 = SyncId.fromFName(proof3).syncId();
      const nameStartIndex = TIMESTAMP_LENGTH + 1 + FID_BYTES;
      const unpaddedFnameSyncId1Bytes = unpaddedFnameSyncId1.slice(
        0,
        nameStartIndex + unpaddedFnameSyncId1.slice(nameStartIndex).findIndex((byte) => byte === 0),
      );
      const unpaddedFnameSyncId2Bytes = unpaddedFnameSyncId2.slice(
        0,
        nameStartIndex + unpaddedFnameSyncId2.slice(nameStartIndex).findIndex((byte) => byte === 0),
      );

      await syncTrie.insert(paddedFnameSyncId);
      await syncTrie.insertBytes([unpaddedFnameSyncId1Bytes]);
      await syncTrie.insertBytes([unpaddedFnameSyncId2Bytes]);

      expect(await syncTrie.existsByBytes(paddedFnameSyncId.syncId())).toBe(true);
      expect(await syncTrie.existsByBytes(unpaddedFnameSyncId1Bytes)).toBe(true);
      expect(await syncTrie.existsByBytes(unpaddedFnameSyncId2Bytes)).toBe(true);

      await syncTrie.stop();

      const success = await performDbMigrations(db, 4, 5);
      expect(success).toBe(true);

      const uncachedSyncTrie = new MerkleTrie(db);
      await uncachedSyncTrie.initialize();
      expect(await uncachedSyncTrie.existsByBytes(paddedFnameSyncId.syncId())).toBe(true);
      expect(await uncachedSyncTrie.existsByBytes(unpaddedFnameSyncId1Bytes)).toBe(false);
      expect(await uncachedSyncTrie.existsByBytes(unpaddedFnameSyncId2Bytes)).toBe(false);
    },
    TEST_TIMEOUT_LONG,
  );
});
