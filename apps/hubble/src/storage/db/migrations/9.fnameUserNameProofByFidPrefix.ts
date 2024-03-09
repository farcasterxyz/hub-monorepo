/**
 * Up until now, the RootPrefix.FNameUserNameProofByFid and RootPrefix.VerificationByAddress both
 * had the value of 25. This migration will change the value of RootPrefix.FNameUserNameProofByFid to 27
 */

import { logger } from "../../../utils/logger.js";
import RocksDB from "../rocksdb.js";
import { FID_BYTES, RootPrefix } from "../types.js";

const log = logger.child({ component: "FNameUserNameProofByFidPrefixMigration" });

export async function fnameUserNameProofByFidPrefix(db: RocksDB): Promise<boolean> {
  log.info({}, "Starting fname user name proof by fid prefix migration");
  let count = 0;
  const start = Date.now();

  await db.forEachIteratorByPrefix(Buffer.from([25]), async (key, value) => {
    if (!key || !value) {
      return;
    }

    // If the key is exactly 5 bytes long, then that means it was the FnameUserNameProofByFid key
    // and not the VerificationByAddress key
    if (key.length === 1 + FID_BYTES) {
      const newKey = Buffer.from([RootPrefix.FNameUserNameProofByFid, ...new Uint8Array(key).slice(1)]);
      await db.put(newKey, value);
      await db.del(key);

      count += 1;
    }
  });

  log.info({ count, duration: Date.now() - start }, "Finished fname user name proof by fid prefix migration");
  return true;
}
