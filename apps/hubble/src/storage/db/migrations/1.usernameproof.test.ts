import { faker } from "@faker-js/faker";
import RocksDB from "../rocksdb.js";
import { RootPrefix, UserPostfix } from "../types.js";
import { performDbMigrations } from "./migrations.js";

const dbName = "usernameproof.migration.test.db";

describe("usernameproof migration", () => {
  let db: RocksDB;

  beforeAll(async () => {
    db = new RocksDB(dbName);
    await db.open();
  });

  afterAll(async () => {
    await db.close();
    await db.destroy();
  });

  test("should migrate usernameproof index", async () => {
    // Write a key with the old postfix
    const key = Buffer.concat([
      Buffer.from([RootPrefix.User]),
      Buffer.from([0, 0, 0, 10]), // FID
      Buffer.from([UserPostfix.UsernameProofMessage]), // Postfix = 7
      Buffer.from([10, 20, 30, 40, 50]),
    ]);
    // Create a 24-byte value
    const value = Buffer.from(faker.random.alphaNumeric(24));

    await db.put(key, value);

    const success = await performDbMigrations(db, 0, 1); // Perform migration from 0 to 1
    expect(success).toBe(true);

    // Read the key with the new postfix
    const expectedNewKey = Buffer.concat([
      Buffer.from([RootPrefix.User]),
      Buffer.from([0, 0, 0, 10]), // FID
      Buffer.from([UserPostfix.UserNameProofAdds]), // Postfix = 99
      Buffer.from([10, 20, 30, 40, 50]),
    ]);

    const newValue = await db.get(expectedNewKey);
    expect(newValue).toEqual(value);

    // Make sure the old key is gone. This should throw
    await expect(db.get(key)).rejects.toThrow("NotFound");
  });
});
