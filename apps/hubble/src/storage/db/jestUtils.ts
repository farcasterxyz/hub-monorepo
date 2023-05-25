import RocksDB from './rocksdb.js';

/** Temporary binary version */
export const jestRocksDB = (name: string) => {
  const db = new RocksDB(name);

  beforeAll(async () => {
    await expect(db.open()).resolves.not.toThrow();
  });

  afterEach(async () => {
    await expect(db.clear()).resolves.not.toThrow();
  });

  afterAll(async () => {
    await expect(db.close()).resolves.not.toThrow();
    await expect(db.destroy()).resolves.not.toThrow();
  });

  return db;
};
