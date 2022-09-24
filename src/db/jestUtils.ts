import RocksDB from '~/db/rocksdb';

export const jestRocksDB = (name: string) => {
  const rocksDb = new RocksDB(name);

  beforeAll(async () => {
    await rocksDb.open();
  });

  afterEach(async () => {
    await rocksDb.clear();
  });

  afterAll(async () => {
    await rocksDb.close();
    await rocksDb.destroy();
  });

  return rocksDb;
};
