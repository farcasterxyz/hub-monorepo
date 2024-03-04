import RocksDB from "./rocksdb.js";

/** Temporary binary version */
export const jestRocksDB = (name: string) => {
  const db = new RocksDB(name);

  beforeAll(async () => {
    await expect(db.open()).resolves.not.toThrow();
  });

  afterEach(async () => {
    db.clear();
  });

  afterAll(async () => {
    db.close();
    await expect(db.destroy()).resolves.not.toThrow();
  });

  return db;
};
