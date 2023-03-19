import { bytesToUtf8String, Factories, HubError, utf8StringToBytes } from '@farcaster/utils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import {
  deleteNameRegistryEvent,
  getNameRegistryEvent,
  getNameRegistryEventsByExpiryIterator,
  getNextNameRegistryEventByExpiry,
  makeNameRegistryEventByExpiryKey,
  makeNameRegistryEventPrimaryKey,
  putNameRegistryEvent,
} from './nameRegistryEvent';

const db = jestRocksDB('storage.db.nameRegistryEvent.test');

const fname = Factories.Fname.build();
const nameRegistryEvent = Factories.NameRegistryEvent.build({ fname });

describe('makeNameRegistryEventPrimaryKey', () => {
  test('orders keys by fname', async () => {
    const names = ['ab', 'abcde', 'ccc', 'z'];
    for (const name of names) {
      const bytes = utf8StringToBytes(name)._unsafeUnwrap();
      const key = makeNameRegistryEventPrimaryKey(bytes);
      await db.put(key, Buffer.from(bytes));
    }
    const orderedValues = [];
    for await (const [, value] of db.iterator({ keys: false, valueAsBuffer: true })) {
      orderedValues.push(bytesToUtf8String(Uint8Array.from(value))._unsafeUnwrap());
    }
    expect(orderedValues).toEqual(names);
  });
});

describe('makeNameRegistryEventByExpiryKey', () => {
  test('orders keys by expiry', async () => {
    const testData: [number, string][] = [
      [100, 'a'],
      [99, 'b'],
      [255, 'c'],
      [256, 'd'],
      [1_000_000, 'e'],
    ];
    for (const [expiry, name] of testData) {
      const bytes = utf8StringToBytes(name)._unsafeUnwrap();
      const key = makeNameRegistryEventByExpiryKey(expiry, bytes);
      await db.put(key, Buffer.from(bytes));
    }
    const orderedValues = [];
    for await (const [, value] of db.iterator({ keys: false, valueAsBuffer: true })) {
      orderedValues.push(bytesToUtf8String(Uint8Array.from(value))._unsafeUnwrap());
    }
    expect(orderedValues).toEqual(['b', 'a', 'c', 'd', 'e']);
  });
});

describe('putNameRegistryEvent', () => {
  test('succeeds', async () => {
    await expect(putNameRegistryEvent(db, nameRegistryEvent)).resolves.toEqual(undefined);
    await expect(getNameRegistryEvent(db, nameRegistryEvent.fname)).resolves.toEqual(nameRegistryEvent);

    const byExpiryIterator = getNameRegistryEventsByExpiryIterator(db);
    const eventByExpiry = await getNextNameRegistryEventByExpiry(byExpiryIterator);
    expect(eventByExpiry).toEqual(nameRegistryEvent);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    byExpiryIterator.end(() => {});
  });
});

describe('deleteNameRegistryEvent', () => {
  test('succeeds', async () => {
    await expect(putNameRegistryEvent(db, nameRegistryEvent)).resolves.toEqual(undefined);
    await expect(getNameRegistryEvent(db, nameRegistryEvent.fname)).resolves.toEqual(nameRegistryEvent);

    await expect(deleteNameRegistryEvent(db, nameRegistryEvent)).resolves.toEqual(undefined);
    await expect(getNameRegistryEvent(db, nameRegistryEvent.fname)).rejects.toThrow();

    const byExpiryIterator = getNameRegistryEventsByExpiryIterator(db);
    await expect(getNextNameRegistryEventByExpiry(byExpiryIterator)).rejects.toEqual(undefined);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    byExpiryIterator.end(() => {});
  });
});

describe('getNameRegistryEvent', () => {
  test('succeeds when event exists', async () => {
    await putNameRegistryEvent(db, nameRegistryEvent);
    await expect(getNameRegistryEvent(db, nameRegistryEvent.fname)).resolves.toEqual(nameRegistryEvent);
  });

  test('fails when event not found', async () => {
    await expect(getNameRegistryEvent(db, nameRegistryEvent.fname)).rejects.toThrow(HubError);
  });
});
