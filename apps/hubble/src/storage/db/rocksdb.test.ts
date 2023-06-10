import { faker } from '@faker-js/faker';
import { HubError } from '@farcaster/hub-nodejs';
import { existsSync, mkdirSync, rmdirSync } from 'fs';
import { jestRocksDB } from './jestUtils.js';
import RocksDB, { MAX_DB_ITERATOR_OPEN_MILLISECONDS } from './rocksdb.js';
import { jest } from '@jest/globals';

//Safety: fs is safe to use in tests
/* eslint-disable security/detect-non-literal-fs-filename */

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
    await expect(db.destroy()).rejects.toThrow(new Error('db never opened'));
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
    await expect(db.get(Buffer.from('key'))).rejects.toThrow(HubError);
    await db.destroy();
  });
});

describe('with db', () => {
  const db = jestRocksDB('binaryrocksdb.test');

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
      await expect(db.get(Buffer.from('foo'))).rejects.toThrow(HubError);
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
      await expect(db.get(Buffer.from('foo'))).rejects.toThrow(HubError);
    });
  });

  describe('iterator', () => {
    test('succeeds', async () => {
      await db.put(Buffer.from('foo'), Buffer.from('bar'));
      await db.put(Buffer.from([1, 2]), Buffer.from([255]));

      const keys = [];
      const values = [];

      const iterator = db.iterator({ keyAsBuffer: true, valueAsBuffer: true });
      expect(iterator.isOpen).toEqual(true);
      for await (const [key, value] of iterator) {
        keys.push(key);
        values.push(value);
      }
      expect(iterator.isOpen).toEqual(false);

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
      for await (const [key, value] of db.iteratorByPrefix(Buffer.from('aliceprefix!'))) {
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
      for await (const [, value] of db.iteratorByPrefix(Buffer.from([1, 255]), { keys: false })) {
        values.push(value);
      }
      expect(values).toEqual([Buffer.from('a'), Buffer.from('b')]);
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
      for await (const [, value] of db.iteratorByPrefix(Buffer.from([255]), { keys: false })) {
        values.push(value);
      }
      expect(values).toEqual([Buffer.from('a'), Buffer.from('b')]);
    });
  });

  describe('compact', () => {
    test('succeeds', async () => {
      await db.put(Buffer.from('foo'), Buffer.from('bar'));
      await expect(db.get(Buffer.from('foo'))).resolves.toEqual(Buffer.from('bar'));
      await expect(db.compact()).resolves.toEqual(undefined);
      await expect(db.get(Buffer.from('foo'))).resolves.toEqual(Buffer.from('bar'));
    });
  });
});

describe('open iterator check', () => {
  let db: RocksDB;

  beforeAll(async () => {
    jest.useFakeTimers();
    // Creating a separate db here so that jest.useFakeTimers takes effect
    // when setInterval is called in the RocksDB constructor
    db = new RocksDB(randomDbName());
    await expect(db.open()).resolves.toEqual(undefined);
  });

  afterAll(async () => {
    expect(db.status).toEqual('open');
    await db.destroy();
    jest.useRealTimers();
  });

  test('warns on open iterators', async () => {
    Date.now = jest.fn(() => 0);
    const closedIterator = db.iterator();
    await closedIterator.end();

    // Create hanging iterator at specified time
    const hangingIterator = db.iterator();

    expect([...db.openIterators].filter((x) => x.iterator === closedIterator).length).toEqual(1);
    expect([...db.openIterators].filter((x) => x.iterator === hangingIterator).length).toEqual(1);
    expect(closedIterator.isOpen).toEqual(false);
    expect(hangingIterator.isOpen).toEqual(true);

    // Move time forward to expire hangingIterator
    Date.now = jest.fn(() => MAX_DB_ITERATOR_OPEN_MILLISECONDS);

    // Hanging iterator should be left beind in list
    jest.advanceTimersByTime(MAX_DB_ITERATOR_OPEN_MILLISECONDS);
    expect([...db.openIterators].filter((x) => x.iterator === closedIterator).length).toEqual(0);
    expect([...db.openIterators].filter((x) => x.iterator === hangingIterator).length).toEqual(1);
  });
});
