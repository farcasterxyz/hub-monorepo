import Engine from '~/engine';
import { Factories } from '~/factories';
import { Cast, EthereumSigner, MessageSigner } from '~/types';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';
import Faker from 'faker';

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
      return createUser(engine, startFid + index);
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

/** creates a random user and registers thir information with the engine */
export const createUser = async (engine: Engine, fid: number) => {
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

/** creates and merges a number of add/remove pair Events for the given event type */
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
