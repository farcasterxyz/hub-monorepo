import { IdRegistryEvent, bytesCompare, Factories, HubError } from '@farcaster/hub-nodejs';
import { jestRocksDB } from '~/storage/db/jestUtils';
import {
  getIdRegistryEvent,
  getIdRegistryEventByCustodyAddress,
  makeIdRegistryEventPrimaryKey,
  putIdRegistryEvent,
} from './idRegistryEvent';

const db = jestRocksDB('storage.db.idRegistryEvent.test');
const custodySigner = Factories.Eip712Signer.build();
let custodySignerKey: Uint8Array;
let idRegistryEvent: IdRegistryEvent;

beforeAll(async () => {
  custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  idRegistryEvent = Factories.IdRegistryEvent.build({ to: custodySignerKey });
});

describe('makeIdRegistryEventPrimaryKey', () => {
  test('orders keys by fid', () => {
    const key1 = makeIdRegistryEventPrimaryKey(1_000);
    const key2 = makeIdRegistryEventPrimaryKey(1_001);
    const key3 = makeIdRegistryEventPrimaryKey(1_000_000);
    expect(bytesCompare(key1, key2)).toEqual(-1);
    expect(bytesCompare(key2, key3)).toEqual(-1);
  });
});

describe('putIdRegistryEvent', () => {
  test('succeeds', async () => {
    await expect(putIdRegistryEvent(db, idRegistryEvent)).resolves.toEqual(undefined);
    await expect(getIdRegistryEvent(db, idRegistryEvent.fid)).resolves.toEqual(idRegistryEvent);
  });
});

describe('getIdRegistryEvent', () => {
  test('succeeds when event exists', async () => {
    await putIdRegistryEvent(db, idRegistryEvent);
    await expect(getIdRegistryEvent(db, idRegistryEvent.fid)).resolves.toEqual(idRegistryEvent);
  });

  test('fails when event not found', async () => {
    await expect(getIdRegistryEvent(db, idRegistryEvent.fid)).rejects.toThrow(HubError);
  });
});

describe('getIdRegistryEventByCustodyAddress', () => {
  test('succeeds when event exists', async () => {
    await putIdRegistryEvent(db, idRegistryEvent);
    await expect(getIdRegistryEventByCustodyAddress(db, custodySignerKey)).resolves.toEqual(idRegistryEvent);
  });
});
