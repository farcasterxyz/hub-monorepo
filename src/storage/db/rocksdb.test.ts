import { existsSync, rmdirSync, mkdirSync } from 'fs';
import Faker from 'faker';
import { NotFoundError, RocksDBError } from '~/utils/errors';
import RocksDB from '~/storage/db/rocksdb';
import { jestRocksDB } from '~/storage/db/jestUtils';

const randomDbName = () => `rocksdb.test.${Faker.name.lastName().toLowerCase()}`;

describe('open', () => {
  describe('opens db and changes status', () => {
    let db: RocksDB;

    beforeEach(() => {
      db = new RocksDB(randomDbName());
      expect(db.location).toBeTruthy();
    });

    afterEach(async () => {
      await expect(db.open()).resolves.toEqual(undefined);
      expect(db.status).toEqual('open');
      await db.destroy();
    });

    test('when directory does not exist', async () => {
      if (existsSync(db.location)) {
        rmdirSync(db.location);
      }
    });

    test('when directory exists', async () => {
      mkdirSync(db.location, { recursive: true });
    });

    test('when opening twice', async () => {
      await expect(db.open()).resolves.toEqual(undefined);
    });
  });
});

describe('close', () => {
  test('succeeds', async () => {
    const db = new RocksDB(randomDbName());
    expect(db.status).toEqual('new');
    await db.open();
    await expect(db.close()).resolves.toEqual(undefined);
    expect(db.status).toEqual('closed');
    await db.destroy();
  });
});

describe('destroy', () => {
  test('fails when db has never been opened', async () => {
    const db = new RocksDB(randomDbName());
    expect(db.status).toEqual('new');
    await expect(db.destroy()).rejects.toThrow(new RocksDBError('db never opened'));
  });

  test('succeeds when db is open', async () => {
    const db = new RocksDB(randomDbName());
    await db.open();
    await expect(db.destroy()).resolves.toEqual(undefined);
  });

  test('destroys db', async () => {
    const db = new RocksDB(randomDbName());
    await db.open();
    await db.close();
    await expect(db.destroy()).resolves.toEqual(undefined);
  });
});

describe('clear', () => {
  test('succeeds', async () => {
    const db = new RocksDB(randomDbName());
    await db.open();
    await db.put('key', 'value');
    const value = await db.get('key');
    expect(value).toEqual('value');
    await expect(db.clear()).resolves.toEqual(undefined);
    await expect(db.get('key')).rejects.toThrow(NotFoundError);
    await db.destroy();
  });
});

describe('with db', () => {
  const db = jestRocksDB('rocksdb.test');

  describe('get', () => {
    test('gets a value by key', async () => {
      await db.put('foo', 'bar');
      await expect(db.get('foo')).resolves.toEqual('bar');
    });

    test('fails if not found', async () => {
      await expect(db.get('foo')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getMany', () => {
    test('gets multiple values', async () => {
      await db.put('foo', 'bar');
      await db.put('alice', 'bob');
      await db.put('exclude', 'this');
      const res = await db.getMany(['foo', 'alice']);
      expect(res).toEqual(['bar', 'bob']);
    });

    test('succeeds when some keys not found', async () => {
      await db.put('foo', 'bar');
      await expect(db.getMany(['foo', 'alice'])).resolves.toEqual(['bar', undefined]);
    });

    test('succeeds when no keys found', async () => {
      await expect(db.getMany(['foo', 'alice'])).resolves.toEqual([undefined, undefined]);
    });
  });

  describe('put', () => {
    test('puts a value by key', async () => {
      await expect(db.put('foo', 'bar')).resolves.toEqual(undefined);
      await expect(db.get('foo')).resolves.toEqual('bar');
    });
  });

  describe('del', () => {
    test('deletes key', async () => {
      await db.put('foo', 'bar');
      await expect(db.get('foo')).resolves.toEqual('bar');
      await expect(db.del('foo')).resolves.toEqual(undefined);
      await expect(db.get('foo')).rejects.toThrow(NotFoundError);
    });
  });

  describe('batch', () => {
    test('does multiple puts', async () => {
      await expect(
        db.batch([
          { type: 'put', key: 'foo', value: 'bar' },
          { type: 'put', key: 'alice', value: 'bob' },
        ])
      ).resolves.toEqual(undefined);
      const values = await db.getMany(['foo', 'alice']);
      expect(values).toEqual(['bar', 'bob']);
    });

    test('does multiple puts and dels', async () => {
      await db.put('delete', 'me');
      await expect(
        db.batch([
          { type: 'put', key: 'foo', value: 'bar' },
          { type: 'del', key: 'delete' },
        ])
      ).resolves.toEqual(undefined);
      await expect(db.get('delete')).rejects.toThrow();
      await expect(db.get('foo')).resolves.toEqual('bar');
    });
  });

  describe('iteratorByPrefix', () => {
    test('succeeds', async () => {
      await db.put('aliceprefix!b', 'foo');
      await db.put('allison', 'oops');
      await db.put('aliceprefix!a', 'bar');
      await db.put('bobprefix!a', 'bar');
      await db.put('prefix!a', 'bar');
      const output = [];
      for await (const [key, value] of db.iteratorByPrefix('aliceprefix!', {
        keyAsBuffer: false,
        valueAsBuffer: false,
      })) {
        output.push([key, value]);
      }
      expect(output).toEqual([
        ['aliceprefix!a', 'bar'],
        ['aliceprefix!b', 'foo'],
      ]);
    });
  });
});
