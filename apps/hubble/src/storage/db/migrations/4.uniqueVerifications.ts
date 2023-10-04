/**
 Make verification addresses globally unique
 */

import { logger } from "../../../utils/logger.js";
import RocksDB from "../rocksdb.js";
import StoreEventHandler from "../../stores/storeEventHandler.js";
import VerificationStore from "../../stores/verificationStore.js";

const log = logger.child({ component: "UniqueVerifications" });

export const uniqueVerificationsMigration = async (db: RocksDB): Promise<boolean> => {
  log.info({}, "Starting uniqueVerifications migration");
  const start = Date.now();
  const verificationsStore = new VerificationStore(db, new StoreEventHandler(db));

  const res = await verificationsStore.migrateVerifications();
  if (res.isOk()) {
    log.info(
      { duration: Date.now() - start },
      `Finished uniqueVerifications migration. Total: ${res.value.total}, duplicates: ${res.value.duplicates}`,
    );
    return true;
  } else {
    log.error({ errCode: res.error.errCode, err: res.error }, "Error migrating verifications");
    return false;
  }
};
