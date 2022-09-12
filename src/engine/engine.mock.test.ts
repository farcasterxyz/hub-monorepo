import Engine from '~/engine';
import { populateEngine, EventConfig, createUser, mockEvents, MockFCEvent } from '~/engine/engine.mock';
import Faker from 'faker';
import { Message } from '~/types';

const engine = new Engine();

describe('PopulateEngine', () => {
  beforeEach(async () => {
    engine._reset();
  });

  test('Generates a mock event of each type', async () => {
    const fid = Faker.datatype.number();
    const user = await createUser(engine, fid);
    const users = await engine.getUsers();
    expect(users.size).toEqual(1);

    await mockEvents(engine, [user], 1, MockFCEvent.Cast);
    const castadds = engine._getCastAdds(fid);
    let adds: Set<Message> = await engine.getAllCastsByUser(fid);
    expect(adds.size).toEqual(2);

    await mockEvents(engine, [user], 1, MockFCEvent.Follow);
    adds = engine._getFollowAdds(fid);
    expect(adds.size).toEqual(1);

    await mockEvents(engine, [user], 1, MockFCEvent.Verification);
    adds = engine._getVerificationEthereumAddressAdds(fid);
    expect(adds.size).toEqual(1);

    await mockEvents(engine, [user], 1, MockFCEvent.Reaction);
    adds = engine._getReactionAdds(fid);
    expect(adds.size).toEqual(1);
  });

  test('populates an engine with selected config', async () => {
    await populateEngine(engine, 5, {
      Verifications: 1,
      Casts: 2,
      Follows: 3,
      Reactions: 4,
    });
    const users = await engine.getUsers();
    expect(users.size).toEqual(5);
    users.forEach(async (user) => {
      // check for expected number of add and remove pairs
      let result: Set<any> = await engine.getAllVerificationsByUser(user);
      expect(result.size).toEqual(1 * 2);
      result = await engine.getAllCastsByUser(user);
      expect(result.size).toEqual(2 * 2);
      result = await engine.getAllFollowsByUser(user);
      expect(result.size).toEqual(3 * 2);
      result = await engine.getAllReactionsByUser(user);
      expect(result.size).toEqual(4 * 2);
    });
  });
});
