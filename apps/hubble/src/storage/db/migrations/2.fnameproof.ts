/**
 The FName User Name Proofs did not have an index by fid. In order to support getUserNameProofsByFid being able to return
 fname proofs, we need to add an index by fid. This migration will go over all existing fname proofs and add an index
 */

import { logger } from "../../../utils/logger.js";
import RocksDB from "../rocksdb.js";
import { RootPrefix } from "../types.js";
import { UserNameProof } from "@farcaster/hub-nodejs";
import { makeFNameUserNameProofByFidKey } from "../nameRegistryEvent.js";
import { Result } from "neverthrow";

const log = logger.child({ component: "FNameProofIndexMigration" });

export async function fnameProofIndexMigration(db: RocksDB): Promise<boolean> {
  log.info({}, "Starting fname proof index migration");
  let count = 0;
  const start = Date.now();

  await db.forEachIteratorByPrefix(
    Buffer.from([RootPrefix.FNameUserNameProof]),
    async (key, value) => {
      if (!key || !value) {
        return;
      }

      const proof = Result.fromThrowable(
        () => UserNameProof.decode(new Uint8Array(value)),
        (e) => e,
      )();
      if (proof.isOk() && proof.value.fid) {
        try {
          const secondaryKey = makeFNameUserNameProofByFidKey(proof.value.fid);
          await db.put(secondaryKey, key);
          count += 1;
        } catch (e) {
          log.error({ key: key.toString("hex"), errorStr: JSON.stringify(e) }, "Failed to add fname proof index");
        }
      } else {
        log.error({ key: key.toString("hex"), errorStr: JSON.stringify(proof) }, "Failed to decode fname proof");
      }
    },
    {},
    1 * 60 * 60 * 1000,
  );

  log.info({ count, duration: Date.now() - start }, "Finished fname proof index migration");
  return true;
}
