import { Result, ResultAsync } from "neverthrow";
import RocksDB from "../rocksdb.js";
import { logger } from "../../../utils/logger.js";
import { RootPrefix } from "../types.js";
import rocksdb from "../rocksdb.js";
import { HubAsyncResult, HubError } from "@farcaster/hub-nodejs";
import { usernameProofIndexMigration } from "./1.usernameproof.js";
import { fnameProofIndexMigration } from "./2.fnameproof.js";
import { clearEventsMigration } from "./3.clearEvents.js";
import { uniqueVerificationsMigration } from "./4.uniqueVerifications.js";
import { fnameSyncIds } from "./5.fnameSyncIds.js";
import { oldContractEvents } from "./6.oldContractEvents.js";
import { clearAdminResets } from "./7.clearAdminResets.js";
import { fnameUserNameProofByFidPrefix } from "./9.fnameUserNameProofByFidPrefix.js";
import { fixFnameIndexLittleEndianToBigEndian } from "./11.fnameIndex.js";

type MigrationFunctionType = (db: RocksDB) => Promise<boolean>;
const migrations = new Map<number, MigrationFunctionType>();

const log = logger.child({ component: "DBMigrations" });

// Add all DB Migrations here. The key is the schema version number.
migrations.set(1, async (db: RocksDB) => {
  // Migration to move the postfix for indexes for UserNameProof from `UsernameProofMessage`
  // to `UsernameProofMessageAdd`
  return await usernameProofIndexMigration(db);
});
migrations.set(2, async (db: RocksDB) => {
  return await fnameProofIndexMigration(db);
});
migrations.set(3, async (db: RocksDB) => {
  return await clearEventsMigration(db);
});
migrations.set(4, async (db: RocksDB) => {
  return await uniqueVerificationsMigration(db);
});

migrations.set(5, async (db: RocksDB) => {
  return await fnameSyncIds(db);
});

migrations.set(6, async (db: RocksDB) => {
  return await oldContractEvents(db);
});

migrations.set(7, async (db: RocksDB) => {
  return await clearAdminResets(db);
});

migrations.set(8, async (_db: RocksDB) => {
  /**
   * This is the rust DB migration. There's no actual migration
   * to be done, but we set a new version to mark the migration
   */
  return true;
});

migrations.set(9, async (db: RocksDB) => {
  return await fnameUserNameProofByFidPrefix(db);
});

migrations.set(10, async (_db: RocksDB) => {
  /**
   * This is the snapshot chunking migration. There's no actual migration
   * to be done, but we set a new version to mark the migration so that snapshots
   * will work correctly (i.e. the snapshot metadata will be correctly fetched
   * by compatible versions of the hub)
   */
  return true;
});

migrations.set(11, async (db: RocksDB) => {
  return await fixFnameIndexLittleEndianToBigEndian(db);
});

// To Add a new migration
// migrations.set(<next number>, async (db: RocksDB) => {
//   <call migration script>
//   return true; // or false if migration failed
// });

// The latest code version of the DB schema. This is the version that the DB will be
// migrated to if the DB has an older schema version.
export const LATEST_DB_SCHEMA_VERSION = migrations.size;

export async function performDbMigrations(
  db: RocksDB,
  currentDbSchemaVersion: number,
  toDbSchemaVersion = LATEST_DB_SCHEMA_VERSION,
): Promise<boolean> {
  // Starting at schema version + 1 until LATEST_DB_SCHEMA_VERSION, perform migrations
  // one by one.
  for (let i = currentDbSchemaVersion + 1; i <= toDbSchemaVersion; i++) {
    const migration = migrations.get(i) as MigrationFunctionType;
    const success = await ResultAsync.fromPromise(migration(db), (e) => e);
    if (success.isErr() || success.value === false) {
      log.error({ error: success, i }, "DB migration failed");
      return false;
    } else {
      const res = await setDbSchemaVersion(db, i);
      if (res.isErr()) {
        log.error({ error: res, i }, "Failed to set schema version");
        return false;
      }
    }
  }

  return true;
}

export async function getDbSchemaVersion(db: RocksDB): Promise<number> {
  const dbResult = await ResultAsync.fromPromise(
    db.get(Buffer.from([RootPrefix.DBSchemaVersion])),
    (e) => e as HubError,
  );
  if (dbResult.isErr()) {
    return 0;
  }

  // parse the buffer as an int
  const schemaVersion = Result.fromThrowable(
    () => dbResult.value.readUInt32BE(0),
    (e) => e as HubError,
  )();

  return schemaVersion.unwrapOr(0);
}

async function setDbSchemaVersion(db: rocksdb, version: number): HubAsyncResult<void> {
  const txn = db.transaction();
  const value = Buffer.alloc(4);
  value.writeUInt32BE(version, 0);
  txn.put(Buffer.from([RootPrefix.DBSchemaVersion]), value);

  return ResultAsync.fromPromise(db.commit(txn), (e) => e as HubError);
}
