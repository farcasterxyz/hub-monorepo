/**
 Remove unpadded fname sync ids from the sync trie
 */

import { logger } from "../../../utils/logger.js";
import RocksDB from "../rocksdb.js";
import { FID_BYTES, RootPrefix } from "../types.js";
import { Result } from "neverthrow";
import { HubError, UserNameProof } from "@farcaster/hub-nodejs";
import { SyncId, TIMESTAMP_LENGTH } from "../../../network/sync/syncId.js";
import { MerkleTrie } from "../../../network/sync/merkleTrie.js";

const log = logger.child({ component: "fnameSyncIds" });

export const fnameSyncIds = async (db: RocksDB): Promise<boolean> => {
  log.info({}, "Starting fnameSyncIds migration");
  const start = Date.now();

  const syncTrie = new MerkleTrie(db);
  await syncTrie.initialize();
  let count = 0;

  await db.forEachIteratorByPrefix(Buffer.from([RootPrefix.FNameUserNameProof]), async (key, value) => {
    const proof = Result.fromThrowable(
      () => UserNameProof.decode(new Uint8Array(value as Buffer)),
      (e) => e as HubError,
    )();
    if (proof.isOk()) {
      try {
        const paddedSyncIdBytes = SyncId.fromFName(proof.value).syncId();
        const nameStartIndex = TIMESTAMP_LENGTH + 1 + FID_BYTES;
        const firstZeroIndex = paddedSyncIdBytes.slice(nameStartIndex).findIndex((byte) => byte === 0);
        if (firstZeroIndex === -1) {
          return;
        }
        const unpaddedBytes = paddedSyncIdBytes.slice(0, nameStartIndex + firstZeroIndex);

        if (await syncTrie.existsByBytes(unpaddedBytes)) {
          count += 1;
          await syncTrie.deleteByBytes([unpaddedBytes]);
        }
      } catch (e) {
        log.error({ err: e }, `Failed to delete fname sync id for fname: ${proof.value.name}`);
      }
    }
  });

  await syncTrie.stop();
  log.info({ duration: Date.now() - start }, `Finished fnameSyncIds migration. Removed ${count} fnames`);
  return true;
};
