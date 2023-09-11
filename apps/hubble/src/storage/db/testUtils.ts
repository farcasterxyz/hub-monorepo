import RocksDB from "./rocksdb.js";
import { beforeAll, afterEach, afterAll, expect } from "vitest";

/** Temporary binary version */
export const testRocksDB = (name: string) => {
  const db = new RocksDB(name);

  beforeAll(async () => {
    await expect(db.open()).resolves.not.toThrow();
    console.log(db.status);
  });

  afterEach(async () => {
    await expect(db.clear()).resolves.not.toThrow();
  });

  afterAll(async () => {
    // not sure this is the best fix here, getting:
    // Error: promise rejected "Error: db never opened" instead of resolving
    // at src/storage/jobs/pruneMessagesJob.test.ts

    if (db.status === "open") {
      await expect(db.close()).resolves.not.toThrow();
      await expect(db.destroy()).resolves.not.toThrow();
    }
  });

  return db;
};
