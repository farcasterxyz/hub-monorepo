import { bytesToUtf8String, Factories, HubError, utf8StringToBytes } from '@farcaster/protoutils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { getNameRegistryEvent, makeNameRegistryEventPrimaryKey, putNameRegistryEvent } from './nameRegistryEvent';

const db = jestRocksDB('storage.db.idRegistryEvent.test');

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

describe('putNameRegistryEvent', () => {
  test('succeeds', async () => {
    await expect(putNameRegistryEvent(db, nameRegistryEvent)).resolves.toEqual(undefined);
    await expect(getNameRegistryEvent(db, nameRegistryEvent.fname)).resolves.toEqual(nameRegistryEvent);
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
