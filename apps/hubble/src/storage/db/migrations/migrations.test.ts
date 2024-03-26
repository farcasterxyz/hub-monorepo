import RocksDB from "../rocksdb.js";
import { getDbSchemaVersion, LATEST_DB_SCHEMA_VERSION, performDbMigrations } from "./migrations.js";

const dbName = "migrations.db.test";

describe("migration", () => {
  let db: RocksDB;

  beforeAll(async () => {
    db = new RocksDB(dbName);
    await db.open();
  });

  afterAll(async () => {
    await db.close();
    await db.destroy();
  });

  test("should not fail for an empty database", async () => {
    expect(await getDbSchemaVersion(db)).toBe(0);
    const success = await performDbMigrations(db, 1, LATEST_DB_SCHEMA_VERSION);
    expect(success).toBe(true);
    expect(await getDbSchemaVersion(db)).toBe(LATEST_DB_SCHEMA_VERSION);
  });
});
