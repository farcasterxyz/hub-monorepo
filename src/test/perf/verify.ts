import { RPCClient } from '~/network/rpc/json';
import { ComputeSetDifference } from '~/test/perf/utils';
import { sleep } from '~/utils/crypto';
import { logger } from '~/utils/logger';

// A 5 minute network sync timer
let syncTimer: NodeJS.Timer;

/** Waits until a network of Hubs synchronizes completely */
export const waitForSync = async (rpcClients: RPCClient[]) => {
  if (!syncTimer) {
    syncTimer = setInterval(async () => {
      throw Error('Sync failure');
    }, 5 * 60 * 1000);
  }

  if (rpcClients.length <= 1) {
    clearInterval(syncTimer);
    return;
  }
  logger.info('Waiting for network to synchronize');

  const lastClient = [...rpcClients].shift();
  if (!lastClient) throw Error('No RPC Clients');
  const result = await cacheCompareClients(lastClient, rpcClients.slice(1));
  if (!result) {
    logger.error(`Network is not in sync yet`);
    await sleep(10 * 1000);
    await waitForSync(rpcClients);
  }
  logger.info('Network is synchronized');
  clearInterval(syncTimer);
};

/** Caches information from 1 RPC Client (Hub) and compares it to a list of other RPC Clients (Hubs)  */
const cacheCompareClients = async (sourceRpcClient: RPCClient, networkRpcClients: RPCClient[]) => {
  // Check that the hubs have synchronized
  const userIds = await sourceRpcClient.getUsers();
  if (userIds.isErr()) {
    logger.error(userIds.error, `Unable to get users from ${sourceRpcClient.serverMultiaddr}`);
    return false;
  }
  for (const client of networkRpcClients) {
    const clientSet = await client.getUsers();
    const difference = ComputeSetDifference(userIds, clientSet);
    if (difference.isErr() || (difference.isOk() && difference.value.size > 0)) {
      logger.error(difference, `${client.serverMultiaddr} fids are not in sync`);
      return false;
    }
  }
  for (const user of userIds.value) {
    const casts = await sourceRpcClient.getAllCastsByUser(user);
    for (const client of networkRpcClients) {
      const clientSet = await client.getAllCastsByUser(user);
      const difference = ComputeSetDifference(casts, clientSet);
      if (difference.isErr() || (difference.isOk() && difference.value.size > 0)) {
        logger.error(difference, `${client.serverMultiaddr} casts are not in sync for user ${user}`);
        return false;
      }
    }
    const follows = await sourceRpcClient.getAllFollowsByUser(user);
    for (const client of networkRpcClients) {
      const clientSet = await client.getAllFollowsByUser(user);
      const difference = ComputeSetDifference(follows, clientSet);
      if (difference.isErr() || (difference.isOk() && difference.value.size > 0)) {
        logger.error(difference, `${client.serverMultiaddr} follows are not in sync for user ${user}`);

        return false;
      }
    }
    const reactions = await sourceRpcClient.getAllReactionsByUser(user);
    for (const client of networkRpcClients) {
      const clientSet = await client.getAllReactionsByUser(user);
      const difference = ComputeSetDifference(reactions, clientSet);
      if (difference.isErr() || (difference.isOk() && difference.value.size > 0)) {
        logger.error(difference, `${client.serverMultiaddr} reactions are not in sync for user ${user}`);
        return false;
      }
    }
    const verifications = await sourceRpcClient.getAllVerificationsByUser(user);
    for (const client of networkRpcClients) {
      const clientSet = await client.getAllVerificationsByUser(user);
      const difference = ComputeSetDifference(verifications, clientSet);
      if (difference.isErr() || (difference.isOk() && difference.value.size > 0)) {
        logger.error(difference, `${client.serverMultiaddr} verifications are not in sync for user ${user}`);
        return false;
      }
    }
  }
  return true;
  // Is there RPC to compare the merkle tries ?
};
