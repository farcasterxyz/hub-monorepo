import Engine from '~/storage/engine';
import { faker } from '@faker-js/faker';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { mockEvents, MockFCEvent, mockFid, populateEngine } from '~/storage/engine/mock';

const testDb = jestRocksDB('engine.mock.test');
const engine = new Engine(testDb);

const TEST_TIMEOUT_SHORT = 10 * 1000; // 10 sec timeout
const TEST_TIMEOUT_LONG = 2 * 60 * 1000; // 2 min timeout

beforeEach(async () => {
  await engine._reset();
});

describe('mock engine events', () => {
  test(
    'generates a pair of mock events of each type',
    async () => {
      const fid = faker.datatype.number();
      const user = await mockFid(engine, fid);
      const users = await engine.getUsers();
      expect(users.size).toEqual(1);

      await mockEvents(engine, [user], 1, MockFCEvent.Cast);
      const casts = await engine.getAllCastsByUser(fid);
      expect(casts.size).toEqual(2);

      await mockEvents(engine, [user], 1, MockFCEvent.Follow);
      const follows = await engine.getAllFollowsByUser(fid);
      expect(follows.size).toEqual(2);

      await mockEvents(engine, [user], 1, MockFCEvent.Verification);
      const verifications = await engine.getAllVerificationsByUser(fid);
      expect(verifications.size).toEqual(2);

      await mockEvents(engine, [user], 1, MockFCEvent.Reaction);
      const reactions = await engine.getAllReactionsByUser(fid);
      expect(reactions.size).toEqual(2);
    },
    TEST_TIMEOUT_SHORT
  );

  test(
    'populates an engine with selected config',
    async () => {
      await populateEngine(engine, 5, {
        Verifications: 1,
        Casts: 2,
        Follows: 3,
        Reactions: 4,
      });
      const users = await engine.getUsers();
      expect(users.size).toEqual(5);
      for (const user of users) {
        // check for expected number of add and remove pairs
        const verifications = await engine.getAllVerificationsByUser(user);
        expect(verifications.size).toEqual(1 * 2);
        const casts = await engine.getAllCastsByUser(user);
        expect(casts.size).toEqual(2 * 2);
        const follows = await engine.getAllFollowsByUser(user);
        expect(follows.size).toEqual(3 * 2);
        const reactions = await engine.getAllReactionsByUser(user);
        expect(reactions.size).toEqual(4 * 2);
      }
    },
    TEST_TIMEOUT_LONG
  );
});
