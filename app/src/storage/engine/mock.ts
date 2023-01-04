import { Ed25519Signer, Eip712Signer } from '@hub/utils';

export type UserInfo = {
  fid: number;
  ethereumSigner: Eip712Signer;
  delegateSigner: Ed25519Signer;
};

export enum MockFCEvent {
  Cast,
  Reaction,
  Amp,
  Verification,
}

export type EventConfig = {
  Verifications: number;
  Casts: number;
  Amps: number;
  Reactions: number;
};

// export const populateEngine = async (
//   engine: Engine,
//   users: number,
//   config: EventConfig = {
//     Verifications: 1,
//     Casts: 10,
//     Follows: 50,
//     Reactions: 100,
//   }
// ): Promise<UserInfo[]> => {
//   // create a list of users' credentials
//   const startFid = faker.datatype.number();
//   const userInfos: UserInfo[] = await Promise.all(
//     [...Array(users)].map(async (_value, index) => {
//       return mockFid(engine, startFid + index);
//     })
//   );

//   // create verifications
//   await mockEvents(engine, userInfos, config.Verifications, MockFCEvent.Verification);
//   // create casts and removes
//   await mockEvents(engine, userInfos, config.Casts, MockFCEvent.Cast);
//   // create follows
//   await mockEvents(engine, userInfos, config.Follows, MockFCEvent.Follow);
//   // create reactions
//   await mockEvents(engine, userInfos, config.Reactions, MockFCEvent.Reaction);

//   return userInfos;
// };

// /**
//  * Simulate a new user being added to the engine by creating mock on-chain event
//  * and off-chain delegate message and merging both with the engine
//  */
// export const mockFid = async (engine: Engine, fid: number) => {
//   const userInfo = await generateUserInfo(fid);
//   const custodyRegister = await getIdRegistryEvent(userInfo);
//   const addDelegateSigner = await getSignerAdd(userInfo);
//   // register the user
//   let result = await engine.mergeIdRegistryEvent(custodyRegister);
//   expect(result.isOk()).toBeTruthy();
//   result = await engine.mergeMessage(addDelegateSigner);
//   expect(result.isOk()).toBeTruthy();

//   return userInfo;
// };

// export const generateUserInfo = async (fid: number): Promise<UserInfo> => {
//   return {
//     fid,
//     ethereumSigner: await generateEip712Signer(),
//     delegateSigner: await generateEd25519Signer(),
//   };
// };

// /**
//  * Generate an IdRegistryEvent for the given userInfo
//  */
// export const getIdRegistryEvent = async (userInfo: UserInfo) => {
//   const custodyRegister = await Factories.IdRegistryEvent.create({
//     args: { to: userInfo.ethereumSigner.signerKey, id: userInfo.fid },
//     name: 'Register',
//   });
//   return custodyRegister;
// };

// /**
//  * Generate a SignerAdd message for this UserInfo's delegate address
//  */
// export const getSignerAdd = async (userInfo: UserInfo) => {
//   const addDelegateSigner = await Factories.SignerAdd.create(
//     { data: { fid: userInfo.fid } },
//     {
//       transient: { signer: userInfo.ethereumSigner, delegateSigner: userInfo.delegateSigner },
//     }
//   );
//   return addDelegateSigner;
// };

// /**
//  * Creates and merges a number of add/remove pair Events for the given event type
//  * Each Remove message is intentionally not tied to the Add message so that each set has values in both
//  * the `adds` and `removes` maps.
//  */
// export const mockEvents = async (
//   engine: Engine,
//   userInfos: UserInfo[],
//   count: number,
//   event: MockFCEvent
// ): Promise<void> => {
//   for (const userInfo of userInfos) {
//     const createParams = { data: { fid: userInfo.fid } };
//     const now = Date.now();
//     const maxDate = new Date(now - 100); // 100 seconds ago, to make sure we're not within the SYNC_THRESHOLD
//     // use a relatively tight range for test performance
//     const minDate = new Date(maxDate.getTime() - 1000 * 60 * 60 * 24 * 5); // 5 days ago.
//     const createOptions = { transient: { signer: userInfo.delegateSigner, minDate: minDate, maxDate: maxDate } };
//     let result;

//     if (event === MockFCEvent.Verification) {
//       await Promise.all(
//         [...Array(count)].map(async () => {
//           result = await engine.mergeMessage(
//             await Factories.VerificationEthereumAddress.create(createParams, createOptions)
//           );
//           expect(result.isOk()).toBeTruthy();
//           result = await engine.mergeMessage(await Factories.VerificationRemove.create(createParams, createOptions));
//           expect(result.isOk()).toBeTruthy();
//         })
//       );
//     } else if (event === MockFCEvent.Cast) {
//       await Promise.all(
//         [...Array(count)].map(async () => {
//           result = await engine.mergeMessage(await Factories.CastShort.create(createParams, createOptions));
//           expect(result.isOk).toBeTruthy();
//           result = await engine.mergeMessage(await Factories.CastRemove.create(createParams, createOptions));
//           expect(result.isOk()).toBeTruthy();
//         })
//       );
//     } else if (event === MockFCEvent.Follow) {
//       await Promise.all(
//         [...Array(count)].map(async () => {
//           result = await engine.mergeMessage(await Factories.FollowAdd.create(createParams, createOptions));
//           expect(result.isOk()).toBeTruthy();
//           result = await engine.mergeMessage(await Factories.FollowRemove.create(createParams, createOptions));
//           expect(result.isOk()).toBeTruthy();
//         })
//       );
//     } else if (event === MockFCEvent.Reaction) {
//       await Promise.all(
//         [...Array(count)].map(async () => {
//           result = await engine.mergeMessage(await Factories.ReactionAdd.create(createParams, createOptions));
//           expect(result.isOk()).toBeTruthy();
//           result = await engine.mergeMessage(await Factories.ReactionRemove.create(createParams, createOptions));
//           expect(result.isOk()).toBeTruthy();
//         })
//       );
//     } else {
//       throw new Error('invalid event type');
//     }
//   }
// };
