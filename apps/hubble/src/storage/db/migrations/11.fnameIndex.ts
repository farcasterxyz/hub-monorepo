import { UserNameProof, bytesCompare } from "@farcaster/hub-nodejs";
import { logger } from "../../../utils/logger.js";
import RocksDB from "../rocksdb.js";
import { FID_BYTES, RootPrefix } from "../types.js";
import { makeFidKey } from "../message.js";
import { ResultAsync } from "neverthrow";

const log = logger.child({ component: "fnameIndex" });

/**
 * Up untill now, we were accidentally writing the fid index for the fname messages as Little Endian
 * instead of Big Endian in name_registry_events.rs:make_fname_username_proof_by_fid_key.
 * This migration will fix that to be big endian, and also remove the little endian index keys
 */
export const fixFnameIndexLittleEndianToBigEndian = async (db: RocksDB): Promise<boolean> => {
  // Go over the DB to see if there are any old indexes that didn't get migrated
  log.info({}, "Starting fnameIndex migration");

  const start = Date.now();
  // Now count the number of fname messages that and ones that don't have a corresponding index
  let missingIndexes = 0;
  let totalFnames = 0;
  let rightKey = 0;
  let fixedIndexes = 0;

  await db.forEachIteratorByPrefix(Buffer.from([RootPrefix.FNameUserNameProof]), async (key, value) => {
    if (!key || !value) {
      return;
    }

    totalFnames += 1;
    const userNameProof = UserNameProof.decode(value);
    const fid = userNameProof.fid;

    if (totalFnames % 10_000 === 0) {
      log.info({ totalFnames, missingIndexes, rightKey, fixedIndexes }, "Migrating fname index progress...");
    }

    // Check if the index exists
    const indexKey = Buffer.concat([Buffer.from([RootPrefix.FNameUserNameProofByFid]), makeFidKey(fid)]);
    const indexValue = await ResultAsync.fromPromise(db.get(indexKey), (e) => e as Error);

    if (indexValue.isErr() || !indexValue.value || bytesCompare(indexValue.value, key) !== 0) {
      missingIndexes += 1;
      // Write the index correctly
      await db.put(indexKey, key);

      // If the Little endian index exists, delete that one
      const littleEndianFid = Buffer.alloc(FID_BYTES);
      littleEndianFid.writeUint32LE(fid);
      const littleEndianIndexKey = Buffer.concat([Buffer.from([RootPrefix.FNameUserNameProofByFid]), littleEndianFid]);

      // Ignore the error if it doesn't exist
      await ResultAsync.fromPromise(db.del(littleEndianIndexKey), (e) => e as Error);
      fixedIndexes += 1;

      // const name = Buffer.from(userNameProof.name).toString("utf-8");
      // log.info(
      //   { name, fid, key, value, indexValue, indexKey, littleEndianIndexKey },
      //   "Index doesn't exist for fname, fixed",
      // );
    } else {
      rightKey += 1;
    }
  });

  log.info(
    { totalFnames, missingIndexes, fixedIndexes, rightKey, durationMs: Date.now() - start },
    "Checked all fnames",
  );

  return true;
};
