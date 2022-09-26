import RocksDB from '~/db/rocksdb';

/**
 * jestRocksDB instantiates a RocksDB instance and inserts callbacks to start and teardown the
 * instance so that tests don't have to think about doing that.
 */
export const jestRocksDB = (name: string) => {
  const rocksDb = new RocksDB(name);

  beforeAll(async () => {
    await expect(rocksDb.open()).resolves.not.toThrow();
  });

  afterEach(async () => {
    await expect(rocksDb.clear()).resolves.not.toThrow();
  });

  afterAll(async () => {
    await expect(rocksDb.close()).resolves.not.toThrow();
    await expect(rocksDb.destroy()).resolves.not.toThrow();
  });

  return rocksDb;
};
