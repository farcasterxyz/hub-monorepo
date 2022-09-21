import Faker from 'faker';
import DB from '~/db/rocksdb';

const randomDbName = () => `rocksdb.test.${Faker.name.lastName().toLowerCase()}`;

describe('open', () => {
  test('opens db and changes status', async () => {
    const db = new DB(randomDbName());
    expect(db.status).toEqual('new');
    const res = await db.open();
    expect(res.isOk()).toBeTruthy();
    expect(db.status).toEqual('open');
    await db.destroy();
  });

  test('succeeds if opening twice', async () => {
    const db = new DB(randomDbName());
    await db.open();
    const res = await db.open();
    expect(res.isOk()).toBeTruthy();
    expect(db.status).toEqual('open');
    await db.close();
    await db.destroy();
  });
});

describe('close', () => {
  test('succeeds', async () => {
    const db = new DB(randomDbName());
    expect(db.status).toEqual('new');
    const res = await db.close();
    expect(res.isOk()).toBeTruthy();
    expect(db.status).toEqual('closed');
    await db.destroy();
  });
});

describe('destroy', () => {
  test('fails when db has never been opened', async () => {
    const db = new DB(randomDbName());
    expect(db.status).toEqual('new');
    const res = await db.destroy();
    expect(res.isOk()).toBeFalsy();
  });

  test('destroys db', async () => {
    const db = new DB(randomDbName());
    await db.open();
    await db.close();
    const res = await db.destroy();
    expect(res.isOk()).toBeTruthy();
  });
});

describe('clear', () => {
  test('succeeds', async () => {
    const db = new DB(randomDbName());
    await db.put('key', 'value');
    const value = await db.get('key');
    expect(value._unsafeUnwrap()).toEqual('value');
    const res = await db.clear();
    expect(res.isOk()).toBeTruthy();
    const newValue = await db.get('key');
    expect(newValue.isOk()).toBeFalsy();
    await db.destroy();
  });
});

describe('with db', () => {
  let db: DB;

  beforeAll(() => {
    db = new DB('rocksdb.test');
  });

  afterEach(async () => {
    await db.clear();
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('get', () => {
    test('gets a value by key', async () => {
      await db.put('foo', 'bar');
      const res = await db.get('foo');
      expect(res.isOk()).toBeTruthy();
      expect(res._unsafeUnwrap()).toEqual('bar');
    });

    test('fails if not found', async () => {
      const res = await db.get('foo');
      expect(res.isOk()).toBeFalsy();
    });
  });

  describe('getMany', () => {
    test('gets multiple values', async () => {
      await db.put('foo', 'bar');
      await db.put('alice', 'bob');
      await db.put('exclude', 'this');
      const res = await db.getMany(['foo', 'alice']);
      expect(res.isOk()).toBeTruthy();
      expect(res._unsafeUnwrap()).toEqual(['bar', 'bob']);
    });

    test('succeeds when some keys not found', async () => {
      await db.put('foo', 'bar');
      const res = await db.getMany(['foo', 'alice']);
      expect(res.isOk()).toBeTruthy();
      expect(res._unsafeUnwrap()).toEqual(['bar']);
    });

    test('succeeds when no keys found', async () => {
      const res = await db.getMany(['foo', 'alice']);
      expect(res.isOk()).toBeTruthy();
      expect(res._unsafeUnwrap()).toEqual([]);
    });
  });

  describe('put', () => {
    test('puts a value by key', async () => {
      const res = await db.put('foo', 'bar');
      expect(res.isOk()).toBeTruthy();
      const value = await db.get('foo');
      expect(value._unsafeUnwrap()).toEqual('bar');
    });
  });

  describe('del', () => {
    test('deletes key', async () => {
      await db.put('foo', 'bar');
      const value = await db.get('foo');
      expect(value._unsafeUnwrap()).toEqual('bar');
      const res = await db.del('foo');
      expect(res.isOk()).toBeTruthy();
      const newValue = await db.get('foo');
      expect(newValue.isOk()).toBeFalsy();
    });
  });

  describe('iteratorByPrefix', () => {
    test('succeeds', async () => {
      await db.put('aliceprefix!b', 'foo');
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
