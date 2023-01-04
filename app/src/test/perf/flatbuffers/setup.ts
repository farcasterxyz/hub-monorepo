import { faker } from '@faker-js/faker';
import { Ed25519Signer, Eip712Signer, Factories } from '@hub/utils';
import { utils } from 'ethers';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import { SignerAddModel } from '~/flatbuffers/models/types';
import HubRpcClient from '~/rpc/client';
import { post, submitInBatches } from '~/test/perf/utils';
import { sleep } from '~/utils/crypto';
import { logger } from '~/utils/logger';

export enum SetupMode {
  /** Pick a Hub at random and perform setup with it */
  RANDOM_SINGLE,
  /** Pick a Hub at random for each stage of the setup it */
  RANDOM_MULTIPLE,
  /** Send all the messages to every Hub manually */
  ALL,
}

export interface SetupConfig {
  mode: SetupMode;
  users: number;
}

export type UserInfo = {
  fid: Uint8Array;
  ethSigner: Eip712Signer;
  signer: Ed25519Signer;
};

/**
 * Sets up a network of Hubs with user registrations
 *
 * For each user, setup will post a IdRegistryEvent and a SignerAdd message.
 * It waits some seconds at each stage to let the network synchronize.
 *
 * @Return A list of UserInfos containing an Eth Signer and a Delegate Signer for each fid
 */
export const setupNetwork = async (rpcClients: HubRpcClient[], config: SetupConfig) => {
  if (config.users === 0) return [];

  // generate users
  logger.info(`Generating IdRegistry events for ${config.users} users.`);
  const firstUser = faker.datatype.number();
  const idRegistryEvents: IdRegistryEventModel[] = [];
  const signerAddEvents: SignerAddModel[] = [];
  let start = performance.now();
  const userInfos: UserInfo[] = await Promise.all(
    [...Array(config.users)].map(async (_value, index) => {
      const info = await generateUserInfo(firstUser + index);
      idRegistryEvents.push(await getIdRegistryEvent(info));
      signerAddEvents.push(await getSignerAdd(info));
      return info;
    })
  );
  let stop = performance.now();
  post(`Generated ${config.users} users. UserInfo has ${userInfos.length} items`, start, stop);

  // pick a random RPC node
  const client = rpcClients[Math.floor(Math.random() * rpcClients.length)] as HubRpcClient;

  // submit users
  start = performance.now();
  const registryResults = await submitInBatches(client, idRegistryEvents);

  stop = performance.now();
  post('IdRegistry Events submitted', start, stop);

  logger.info(`${registryResults.success} events submitted successfully. ${registryResults.fail} events failed.`);
  logger.info('_Waiting a few seconds for the network to synchronize_');
  await sleep(10_000);

  start = performance.now();
  const signerResults = await submitInBatches(client, signerAddEvents);

  stop = performance.now();
  post('Signers submitted', start, stop);

  logger.info(`${signerResults.success} signers submitted successfully. ${signerResults.fail} signers failed.`);

  logger.info('_Waiting a few seconds for the network to synchronize_');
  await sleep(10_000);

  return userInfos;
};

export const generateUserInfo = async (fid: number): Promise<UserInfo> => {
  const fidArray = Factories.FID.build({}, { transient: { fid } });

  return {
    fid: fidArray,
    ethSigner: Factories.Eip712Signer.build(),
    signer: Factories.Ed25519Signer.build(),
  };
};

/**
 * Generate an IdRegistryEvent for the given userInfo
 */
export const getIdRegistryEvent = async (userInfo: UserInfo) => {
  const custodyAddress = utils.arrayify(userInfo.ethSigner.signerKey);
  const custodyEvent = new IdRegistryEventModel(
    await Factories.IdRegistryEvent.create({ fid: Array.from(userInfo.fid), to: Array.from(custodyAddress) })
  );
  return custodyEvent;
};

/**
 * Generate a SignerAdd message for this UserInfo's delegate address
 */
export const getSignerAdd = async (userInfo: UserInfo) => {
  const signerAddData = await Factories.SignerAddData.create({
    fid: Array.from(userInfo.fid),
    body: Factories.SignerBody.build({ signer: Array.from(userInfo.signer.signerKey) }),
  });
  const signerAddMessage = await Factories.Message.create(
    { data: Array.from(signerAddData.bb?.bytes() ?? []) },
    { transient: { ethSigner: userInfo.ethSigner } }
  );
  const signerAdd = new MessageModel(signerAddMessage) as SignerAddModel;
  return signerAdd;
};
