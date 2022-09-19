import { EthereumSigner, MessageSigner } from '~/types';
import { Factories } from '~/factories';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';
import { Message } from '~/types';
import Engine from '~/engine';
import Faker from 'faker';
import DB from '~/db';

type UserInfo = {
  fid: number;
  ethereumSigner: EthereumSigner;
  delegateSigner: MessageSigner;
};

export enum MockFCEvent {
  Cast = 0,
  Reaction,
  Follow,
  Verification,
}

export type EventConfig = {
  Verifications: number;
  Casts: number;
  Follows: number;
  Reactions: number;
};

export const populateEngine = async (
  engine: Engine,
  users: number,
  config: EventConfig = {
    Verifications: 1,
    Casts: 10,
    Follows: 50,
    Reactions: 100,
  }
) => {
  // create a list of users' credentials
  const startFid = Faker.datatype.number();
  const userInfos: UserInfo[] = await Promise.all(
    [...Array(users)].map(async (_value, index) => {
      return mockFid(engine, startFid + index);
    })
  );

  // create verifications
  await mockEvents(engine, userInfos, config.Verifications, MockFCEvent.Verification);
  // create casts and removes
  await mockEvents(engine, userInfos, config.Casts, MockFCEvent.Cast);
  // create follows
  await mockEvents(engine, userInfos, config.Follows, MockFCEvent.Follow);
  // create reactions
  await mockEvents(engine, userInfos, config.Reactions, MockFCEvent.Reaction);
};

/**
 * Simulate a new user being added to the engine by creating mock on-chain event
 * and off-chain delegate message and merging both with the engine
 */
export const mockFid = async (engine: Engine, fid: number) => {
  const userInfo = {
    fid,
    ethereumSigner: await generateEthereumSigner(),
    delegateSigner: await generateEd25519Signer(),
  };

  const custodyRegister = await Factories.IDRegistryEvent.create({
    args: { to: userInfo.ethereumSigner.signerKey, id: userInfo.fid },
    name: 'Register',
  });

  const addDelegateSigner = await Factories.SignerAdd.create(
    { data: { fid: userInfo.fid } },
    {
      transient: { signer: userInfo.ethereumSigner, delegateSigner: userInfo.delegateSigner },
    }
  );
  // register the user
  await engine.mergeIDRegistryEvent(custodyRegister);
  await engine.mergeMessage(addDelegateSigner);
  return userInfo;
};

/**
 * Creates and merges a number of add/remove pair Events for the given event type
 * Each Remove message is intentionally not tied to the Add message so that each set has values in both
 * the `adds` and `removes` maps.
 */
export const mockEvents = async (engine: Engine, userInfos: UserInfo[], count: number, event: MockFCEvent) => {
  for (const userInfo of userInfos) {
    const createParams = { data: { fid: userInfo.fid } };
    const createOptions = { transient: { signer: userInfo.delegateSigner } };
    let result;
    switch (event) {
      case MockFCEvent.Verification: {
        await Promise.all(
          [...Array(count)].map(async () => {
            result = await engine.mergeMessage(
              await Factories.VerificationEthereumAddress.create(createParams, createOptions)
            );
            expect(result.isOk()).toBeTruthy();
            result = await engine.mergeMessage(await Factories.VerificationRemove.create(createParams, createOptions));
            expect(result.isOk()).toBeTruthy();
          })
        );
        break;
      }
      case MockFCEvent.Cast: {
        await Promise.all(
          [...Array(count)].map(async () => {
            result = await engine.mergeMessage(await Factories.CastShort.create(createParams, createOptions));
            expect(result.isOk).toBeTruthy();
            result = await engine.mergeMessage(await Factories.CastRemove.create(createParams, createOptions));
            expect(result.isOk()).toBeTruthy();
          })
        );
        break;
      }
      case MockFCEvent.Follow: {
        await Promise.all(
          [...Array(count)].map(async () => {
            result = await engine.mergeMessage(await Factories.FollowAdd.create(createParams, createOptions));
            expect(result.isOk()).toBeTruthy();
            result = await engine.mergeMessage(await Factories.FollowRemove.create(createParams, createOptions));
            expect(result.isOk()).toBeTruthy();
          })
        );
        break;
      }
      case MockFCEvent.Reaction: {
        await Promise.all(
          [...Array(count)].map(async () => {
            result = await engine.mergeMessage(await Factories.ReactionAdd.create(createParams, createOptions));
            expect(result.isOk()).toBeTruthy();
            result = await engine.mergeMessage(await Factories.ReactionRemove.create(createParams, createOptions));
            expect(result.isOk()).toBeTruthy();
          })
        );
        break;
      }
      default: {
        throw new Error('Invalid Event type');
      }
    }
  }
};

const testDb = new DB('engine.mock.test');
const engine = new Engine(testDb);

beforeAll(async () => {
  await testDb.open();
});

afterAll(async () => {
  await testDb.close();
});

describe('PopulateEngine', () => {
  beforeEach(async () => {
    engine._reset();
  });

  test('generates a mock event of each type', async () => {
    const fid = Faker.datatype.number();
    const user = await mockFid(engine, fid);
    const users = await engine.getUsers();
    expect(users.size).toEqual(1);

    await mockEvents(engine, [user], 1, MockFCEvent.Cast);
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
