import { ResultAsync } from "neverthrow";
import RocksDB from "../rocksdb.js";
import { usernameProofIndexMigration } from "./1.usernameproof.js";

export const LATEST_DB_SCHEMA_VERSION = 1;

type MigrationFunctionType = (db: RocksDB) => Promise<boolean>;

const migrations = new Map<number, MigrationFunctionType>();

// Add all DB Migrations here. The key is the schema version number.
migrations.set(1, async (db: RocksDB) => {
  // Migration to move the postfix for indexes for UserNameProof from `UsernameProofMessage`
  // to `UsernameProofMessageAdd`
  return await usernameProofIndexMigration(db);
});

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
      return false;
    }
  }

  return true;
}
