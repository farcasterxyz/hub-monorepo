import DB from '~/db';
import { Factories } from '~/factories';

const testDb = new DB('db.test');

beforeAll(async () => {
  await testDb.open();
});

afterAll(async () => {
  await testDb.close();
});

afterEach(async () => {
  await testDb.clear();
});

describe('getUsers', () => {
  test('returns empty set without fids', async () => {
    const fids = await testDb.getUsers();
    expect(fids).toEqual(new Set());
  });

  test('returns fids', async () => {
    const event1 = await Factories.IDRegistryEvent.create();
    const event2 = await Factories.IDRegistryEvent.create();
    await testDb.custodyEvents.put(`${event1.args.id}`, event1);
    await testDb.custodyEvents.put(`${event2.args.id}`, event2);
    const fids = await testDb.getUsers();
    expect(fids).toEqual(new Set([event1.args.id, event2.args.id]));
  });
});
