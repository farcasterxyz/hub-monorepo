import Faker from 'faker';
import { NotFoundError } from '~/utils/errors';
import RocksDB from '~/storage/db/binaryrocksdb';

const randomDbName = () => `rocksdb.test.${Faker.name.lastName().toLowerCase()}`;

const db = new RocksDB(randomDbName());

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

describe('get', () => {
  test('gets a value by key', async () => {
    await db.put(Buffer.from('foo'), Buffer.from('bar'));
    await expect(db.get(Buffer.from('foo'))).resolves.toEqual(Buffer.from('bar'));
  });

  test('fails if not found', async () => {
    await expect(db.get(Buffer.from('foo'))).rejects.toThrow(NotFoundError);
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
