import { RPCClient } from '~/network/rpc';
import { logger } from '~/utils/logger';
import { faker } from '@faker-js/faker';
import { IdRegistryEvent, SignerAdd } from '~/types';
import { generateUserInfo, getSignerAdd, UserInfo, getIdRegistryEvent } from '~/storage/engine/mock';
import { submitInBatches, post } from '~/test/perf/utils';
import { sleep } from '~/utils/crypto';

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

/**
 * Sets up a network of Hubs with user registrations
 *
 * For each user, setup will post a IdRegistryEvent and a SignerAdd message.
 * It waits some seconds at each stage to let the network synchronize.
 *
 * @Return A list of UserInfos containing an Eth Signer and a Delegate Signer for each fid
 */
export const setupNetwork = async (rpcClients: RPCClient[], config: SetupConfig) => {
  if (config.users === 0) return [];

  // generate users
  logger.info(`Generating IdRegistry events for ${config.users} users.`);
  const firstUser = faker.datatype.number();
  const idRegistryEvents: IdRegistryEvent[] = [];
  const signerAddEvents: SignerAdd[] = [];
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
  const client = rpcClients[Math.floor(Math.random() * rpcClients.length)];

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
