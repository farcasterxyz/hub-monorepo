import { faker } from '@faker-js/faker';
import { NotFoundError, RocksDBError } from '~/utils/errors';
import RocksDB from '~/storage/db/binaryrocksdb';
import { jestBinaryRocksDB } from './jestUtils';
import { existsSync, mkdirSync, rmdirSync } from 'fs';

const randomDbName = () => `rocksdb.test.${faker.name.lastName().toLowerCase()}.${faker.random.alphaNumeric(8)}`;

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
    await db.put(Buffer.from('key'), Buffer.from('value'));
    const value = await db.get(Buffer.from('key'));
    expect(value).toEqual(Buffer.from('value'));
    await expect(db.clear()).resolves.toEqual(undefined);
    await expect(db.get(Buffer.from('key'))).rejects.toThrow(NotFoundError);
    await db.destroy();
  });
});

describe('with db', () => {
  const db = jestBinaryRocksDB('binaryrocksdb.test');

  describe('location', () => {
    test('returns db location', () => {
      expect(db.location).toContain('.rocks/');
    });
  });

  describe('status', () => {
    test('returns db status', () => {
      expect(db.status).toEqual('open');
    });
  });

  describe('get', () => {
    test('gets a value by key', async () => {
      await db.put(Buffer.from('foo'), Buffer.from('bar'));
      await expect(db.get(Buffer.from('foo'))).resolves.toEqual(Buffer.from('bar'));
    });

    test('fails if not found', async () => {
      await expect(db.get(Buffer.from('foo'))).rejects.toThrow(NotFoundError);
    });
  });

  describe('getMany', () => {
    test('gets multiple values', async () => {
      await db.put(Buffer.from('foo'), Buffer.from('bar'));
      await db.put(Buffer.from('alice'), Buffer.from('bob'));
      await db.put(Buffer.from('exclude'), Buffer.from('this'));
      const res = await db.getMany([Buffer.from('foo'), Buffer.from('alice')]);
      expect(res).toEqual([Buffer.from('bar'), Buffer.from('bob')]);
    });

    test('succeeds when some keys not found', async () => {
      await db.put(Buffer.from('foo'), Buffer.from('bar'));
      await expect(db.getMany([Buffer.from('foo'), Buffer.from('alice')])).resolves.toEqual([
        Buffer.from('bar'),
        undefined,
      ]);
    });

    test('succeeds when no keys found', async () => {
      await expect(db.getMany([Buffer.from('foo'), Buffer.from('alice')])).resolves.toEqual([undefined, undefined]);
    });
  });

  describe('put', () => {
    test('puts a value by key', async () => {
      await expect(db.put(Buffer.from('foo'), Buffer.from('bar'))).resolves.toEqual(undefined);
      await expect(db.get(Buffer.from('foo'))).resolves.toEqual(Buffer.from('bar'));
    });
  });

  describe('del', () => {
    test('deletes key', async () => {
      await db.put(Buffer.from('foo'), Buffer.from('bar'));
      await expect(db.get(Buffer.from('foo'))).resolves.toEqual(Buffer.from('bar'));
      await expect(db.del(Buffer.from('foo'))).resolves.toEqual(undefined);
      await expect(db.get(Buffer.from('foo'))).rejects.toThrow(NotFoundError);
    });
  });

  describe('iterator', () => {
    test('succeeds', async () => {
      await db.put(Buffer.from('foo'), Buffer.from('bar'));
      await db.put(Buffer.from([1, 2]), Buffer.from([255]));

      const keys = [];
      const values = [];

      for await (const [key, value] of db.iterator({ keyAsBuffer: true, valueAsBuffer: true })) {
        keys.push(key);
        values.push(value);
      }

      expect(keys).toEqual([Buffer.from([1, 2]), Buffer.from('foo')]);
      expect(values).toEqual([Buffer.from([255]), Buffer.from('bar')]);
    });
  });

  describe('iteratorByPrefix', () => {
    test('succeeds', async () => {
      await db.put(Buffer.from('aliceprefix!b'), Buffer.from('foo'));
      await db.put(Buffer.from('allison'), Buffer.from('oops'));
      await db.put(Buffer.from('aliceprefix!a'), Buffer.from('bar'));
      await db.put(Buffer.from('bobprefix!a'), Buffer.from('bar'));
      await db.put(Buffer.from('prefix!a'), Buffer.from('bar'));
      const output = [];
      for await (const [key, value] of db.iteratorByPrefix(Buffer.from('aliceprefix!'), {
        keyAsBuffer: true,
        valueAsBuffer: true,
      })) {
        output.push([key, value]);
      }
      expect(output).toEqual([
        [Buffer.from('aliceprefix!a'), Buffer.from('bar')],
        [Buffer.from('aliceprefix!b'), Buffer.from('foo')],
      ]);
    });

    test('succeeds with bytes prefix', async () => {
      const tsx = db
        .transaction()
        .put(Buffer.from([1, 255, 1]), Buffer.from('a'))
        .put(Buffer.from([1, 255, 2]), Buffer.from('b'))
        .put(Buffer.from([2, 0, 0]), Buffer.from('c'))
        .put(Buffer.from([1, 0, 0]), Buffer.from('d'))
        .put(Buffer.from([1, 254, 255]), Buffer.from('e'));

      await db.commit(tsx);

      const values = [];
      for await (const [, value] of db.iteratorByPrefix(Buffer.from([1, 255]), { keys: false, valueAsBuffer: false })) {
        values.push(value);
      }
      expect(values).toEqual(['a', 'b']);
    });

    test('succeeds with single byte prefix', async () => {
      const tsx = db
        .transaction()
        .put(Buffer.from([255, 1]), Buffer.from('a'))
        .put(Buffer.from([255, 2]), Buffer.from('b'))
        .put(Buffer.from([2, 0]), Buffer.from('c'))
        .put(Buffer.from([1, 0]), Buffer.from('d'))
        .put(Buffer.from([254, 255]), Buffer.from('e'));

      await db.commit(tsx);

      const values = [];
      for await (const [, value] of db.iteratorByPrefix(Buffer.from([255]), { keys: false, valueAsBuffer: false })) {
        values.push(value);
      }
      expect(values).toEqual(['a', 'b']);
    });
  });
});
