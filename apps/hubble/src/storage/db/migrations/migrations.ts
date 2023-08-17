import { ResultAsync } from "neverthrow";
import RocksDB from "../rocksdb.js";
import { usernameProofIndexMigration } from "./1.usernameproof.js";
import { fnameProofIndexMigration } from "./2.fnameproof.js";
import { logger } from "../../../utils/logger.js";

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
    }
  }

  return true;
}
