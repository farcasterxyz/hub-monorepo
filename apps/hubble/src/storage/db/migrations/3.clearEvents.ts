/**
 For a period of time, the hubble snapshots had bad on chain event data. So, this migration will clear all onchain
 events and force a fresh re-sync
 */

import { logger } from "../../../utils/logger.js";
import RocksDB from "../rocksdb.js";
import OnChainEventStore from "../../stores/onChainEventStore.js";

const log = logger.child({ component: "ClearEventsMigration" });

export const clearEventsMigration = async (db: RocksDB): Promise<boolean> => {
  if (process.env["SKIP_CLEAR_EVENTS"] === "true") {
    log.info({}, "Skipping clearEvents migration");
    return true;
  }
  log.info({}, "Starting clearEvents migration");
  const start = Date.now();
  await OnChainEventStore.clearEvents(db);
  log.info({ duration: Date.now() - start }, "Finished clearEvents migration");
  return true;
};
