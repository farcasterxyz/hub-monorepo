import {
  Ed25519Signer,
  EthereumSigner,
  IdRegistryEvent,
  SignerAdd,
  VerificationEthereumAddress,
  VerificationRemove,
} from '~/types';
import { Factories } from '~/test/factories';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils/crypto';
import Engine from '~/storage/engine';
import { faker } from '@faker-js/faker';

export type UserInfo = {
  fid: number;
  ethereumSigner: EthereumSigner;
  delegateSigner: Ed25519Signer;
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

const cacheUserInfos = new Array<UserInfo>();
const cacheUserRegistryEvents = new Map<number, IdRegistryEvent>();
const cacheSignerAddEvents = new Map<number, SignerAdd>();

export const populateEngine = async (
  engine: Engine,
  users: number,
  config: EventConfig = {
    Verifications: 1,
    Casts: 10,
    Follows: 50,
    Reactions: 100,
  }
): Promise<UserInfo[]> => {
  let startTime = Date.now();

  // Generates new UserInfos if there aren't enough in the cache
  const newUsersCount = users - cacheUserInfos.length;
  const startingFid = cacheUserInfos.slice(-1)[0]?.fid ?? faker.datatype.number();

  const userInfos: UserInfo[] = await Promise.all(
    [...Array(newUsersCount)].map(async (_value, index) => {
      return generateUserInfo(startingFid + index + 1);
    })
  );

  cacheUserInfos.push(...userInfos);

  const actualUserInfos = cacheUserInfos.slice(0, users);

  await Promise.all(
    actualUserInfos.map(async (userInfo) => {
      const registryEvent = await fetchOrCreateRegistrationEvent(userInfo);
      const delegateSignerMessage = await fetchOrCreateSignerAdd(userInfo);
      // TODO: Takes about 500ms each, slowest part of user generation
      await mergeFidSigners(engine, registryEvent, delegateSignerMessage);
    })
  );

  // create users 964ms (192ms per user, down to 112 when cached)
  console.log(`Populated engine with ${users} users in ${Date.now() - startTime}ms`);
  startTime = Date.now();

  // create verifications: 912 ms (912ms per verification)
  await mockEvents(engine, actualUserInfos, config.Verifications, MockFCEvent.Verification);
  console.log(`Populated engine with verifications in ${Date.now() - startTime}ms`);
  startTime = Date.now();

  // create casts and removes - 196 ms (19.6 per cast pair)
  await mockEvents(engine, actualUserInfos, config.Casts, MockFCEvent.Cast);
  // console.log(`Populated engine with casts in ${Date.now() - startTime}ms`);
  // startTime = Date.now();

  // create follows - 946 ms (20ms per follow pair)
  await mockEvents(engine, actualUserInfos, config.Follows, MockFCEvent.Follow);
  // console.log(`Populated engine with follows in ${Date.now() - startTime}ms`);
  // startTime = Date.now();

  // create reactions
  await mockEvents(engine, actualUserInfos, config.Reactions, MockFCEvent.Reaction);
  // console.log(`Populated engine with reactions in ${Date.now() - startTime}ms`);
  // startTime = Date.now();

  return actualUserInfos;
};

const fetchOrCreateRegistrationEvent = async (userInfo: UserInfo): Promise<IdRegistryEvent> => {
  let registryEvent = cacheUserRegistryEvents.get(userInfo.fid);
  if (!registryEvent) {
    registryEvent = await getIdRegistryEvent(userInfo);
    cacheUserRegistryEvents.set(userInfo.fid, registryEvent);
  }
  return registryEvent;
};

const fetchOrCreateSignerAdd = async (userInfo: UserInfo): Promise<SignerAdd> => {
  let signerAddEvent = cacheSignerAddEvents.get(userInfo.fid);
  if (!signerAddEvent) {
    signerAddEvent = await getSignerAdd(userInfo);
    cacheSignerAddEvents.set(userInfo.fid, signerAddEvent);
  }
  return signerAddEvent;
};

/**
 * Simulate a new user being added to the engine by creating mock on-chain event
 * and off-chain delegate message and merging both with the engine
 */
export const mockFid = async (engine: Engine, fid: number) => {
  // TODO: if the fid is known, we should be able to look it up in the cache and retrieve it from there
  const userInfo = await generateUserInfo(fid);
  await mergeFidSigners(engine, await getIdRegistryEvent(userInfo), await getSignerAdd(userInfo));
  return userInfo;
};

const mergeFidSigners = async (engine: Engine, custodyRegister: IdRegistryEvent, signerAdd: SignerAdd) => {
  let result = await engine.mergeIdRegistryEvent(custodyRegister);
  expect(result.isOk()).toBeTruthy();
  result = await engine.mergeMessage(signerAdd);
  expect(result.isOk()).toBeTruthy();
};

export const generateUserInfo = async (fid: number): Promise<UserInfo> => {
  return {
    fid,
    ethereumSigner: await generateEthereumSigner(),
    delegateSigner: await generateEd25519Signer(),
  };
};

/**
 * Generate an IdRegistryEvent for the given userInfo
 */
export const getIdRegistryEvent = async (userInfo: UserInfo) => {
  const custodyRegister = await Factories.IdRegistryEvent.create({
    args: { to: userInfo.ethereumSigner.signerKey, id: userInfo.fid },
    name: 'Register',
  });
  return custodyRegister;
};

/**
 * Generate a SignerAdd message for this UserInfo's delegate address
 */
export const getSignerAdd = async (userInfo: UserInfo) => {
  const addDelegateSigner = await Factories.SignerAdd.create(
    { data: { fid: userInfo.fid } },
    {
      transient: { signer: userInfo.ethereumSigner, delegateSigner: userInfo.delegateSigner },
    }
  );
  return addDelegateSigner;
};

const cacheUserVerifications = new Map<number, [VerificationEthereumAddress, VerificationRemove][]>();

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
    const now = Date.now();
    const maxDate = new Date(now - 100); // 100 seconds ago, to make sure we're not within the SYNC_THRESHOLD
    // use a relatively tight range for test performance
    const minDate = new Date(maxDate.getTime() - 1000 * 60 * 60 * 24 * 5); // 5 days ago.
    const createOptions = { transient: { signer: userInfo.delegateSigner, minDate: minDate, maxDate: maxDate } };
    let result;

    if (event === MockFCEvent.Verification) {
      const cachedVerifications = cacheUserVerifications.get(userInfo.fid) || [];
      const requiredVerifications = count - cachedVerifications.length;

      if (requiredVerifications > 0) {
        console.log('cache miss');
        const newEntries = new Array<[VerificationEthereumAddress, VerificationRemove]>();

        await Promise.all(
          [...Array(requiredVerifications)].map(async () => {
            const verificationAdd = await Factories.VerificationEthereumAddress.create(createParams, createOptions);
            const verificationRemove = await Factories.VerificationRemove.create(createParams, createOptions);
            newEntries.push([verificationAdd, verificationRemove]);
          })
        );
        cachedVerifications.push(...newEntries);
        cacheUserVerifications.set(userInfo.fid, cachedVerifications);
      }

      const actualVerifications = cachedVerifications.slice(0, count);

      // determine the number of verifications relative to the number we have
      // if greater than zero, generate, add and store, then return the stored verifications

      await Promise.all(
        actualVerifications.flat().map(async (verification) => {
          result = await engine.mergeMessage(verification);
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
