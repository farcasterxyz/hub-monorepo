import { EthereumSigner, MessageSigner } from '~/types';
import { Factories } from '~/factories';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';
import Engine from '~/engine';
import Faker from 'faker';

type UserInfo = {
  fid: number;
  ethereumSigner: EthereumSigner;
  delegateSigner: MessageSigner;
};

export enum MockFCEvent {
  Cast,
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
  let result = await engine.mergeIDRegistryEvent(custodyRegister);
  expect(result.isOk()).toBeTruthy();
  result = await engine.mergeMessage(addDelegateSigner);
  expect(result.isOk()).toBeTruthy();
  return userInfo;
};

/**
 * Creates and merges a number of add/remove pair Events for the given event type
 * Each Remove message is intentionally not tied to the Add message so that each set has values in both
 * the `adds` and `removes` maps.
 */
export const mockEvents = async (
  engine: Engine,
  userInfos: UserInfo[],
  count: number,
  event: MockFCEvent
): Promise<void> => {
  for (const userInfo of userInfos) {
    const createParams = { data: { fid: userInfo.fid } };
    const createOptions = { transient: { signer: userInfo.delegateSigner } };
    let result;

    if (event === MockFCEvent.Verification) {
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
    } else if (event === MockFCEvent.Cast) {
      await Promise.all(
        [...Array(count)].map(async () => {
          result = await engine.mergeMessage(await Factories.CastShort.create(createParams, createOptions));
          expect(result.isOk).toBeTruthy();
          result = await engine.mergeMessage(await Factories.CastRemove.create(createParams, createOptions));
          expect(result.isOk()).toBeTruthy();
        })
      );
    } else if (event === MockFCEvent.Follow) {
      await Promise.all(
        [...Array(count)].map(async () => {
          result = await engine.mergeMessage(await Factories.FollowAdd.create(createParams, createOptions));
          expect(result.isOk()).toBeTruthy();
          result = await engine.mergeMessage(await Factories.FollowRemove.create(createParams, createOptions));
          expect(result.isOk()).toBeTruthy();
        })
      );
    } else if (event === MockFCEvent.Reaction) {
      await Promise.all(
        [...Array(count)].map(async () => {
          result = await engine.mergeMessage(await Factories.ReactionAdd.create(createParams, createOptions));
          expect(result.isOk()).toBeTruthy();
          result = await engine.mergeMessage(await Factories.ReactionRemove.create(createParams, createOptions));
          expect(result.isOk()).toBeTruthy();
        })
      );
    } else {
      throw new Error('invalid event type');
    }
  }
};
