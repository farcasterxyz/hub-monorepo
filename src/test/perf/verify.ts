import { JSONRPCError } from 'jayson/promise';
import { Result } from 'neverthrow';
import { RPCClient } from '~/network/rpc';
import { Message } from '~/types';
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

  if (rpcClients.length <= 1) return;
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

const compareMessages = (
  left: Result<Set<number | Message>, JSONRPCError>,
  right: Result<Set<number | Message>, JSONRPCError>
) => {
  // This is hacky and not going to work for very long (FlatBuffs?)
  // TODO Consider pulling in lodash for dev deps
  if (left.isErr() || right.isErr()) return false;
  return JSON.stringify(left.value) === JSON.stringify(right.value);
};

/** Caches information from 1 RPC Client (Hub) and compares it to a list of other RPC Clients (Hubs)  */
const cacheCompareClients = async (sourceRpcClient: RPCClient, networkRpcClients: RPCClient[]) => {
  // Check that the hubs have synchronized
  const userIds = await sourceRpcClient.getUsers();
  if (userIds.isErr()) {
    logger.error(userIds.error, `Unable to get users from ${sourceRpcClient.getServerMultiaddr()}`);
    return false;
  }
  for (const client of networkRpcClients) {
    const clientSet = await client.getUsers();
    if (!compareMessages(clientSet, userIds)) {
      logger.error(`${client.getServerMultiaddr()} fids are not in sync`);
      return false;
    }
  }
  for (const user of userIds.value) {
    const casts = await sourceRpcClient.getAllCastsByUser(user);
    for (const client of networkRpcClients) {
      const clientSet = await client.getAllCastsByUser(user);
      if (!compareMessages(clientSet, casts)) {
        logger.error(`${client.getServerMultiaddr()} casts are not in sync for user ${user}`);
        return false;
      }
    }
    const follows = await sourceRpcClient.getAllFollowsByUser(user);
    for (const client of networkRpcClients) {
      const clientSet = await client.getAllFollowsByUser(user);
      if (!compareMessages(clientSet, follows)) {
        logger.error(`${client.getServerMultiaddr()} follows are not in sync for user ${user}`);
        return false;
      }
    }
    const reactions = await sourceRpcClient.getAllReactionsByUser(user);
    for (const client of networkRpcClients) {
      const clientSet = await client.getAllReactionsByUser(user);
      if (!compareMessages(clientSet, reactions)) {
        logger.error(`${client.getServerMultiaddr()} reactions are not in sync for user ${user}`);
        return false;
      }
    }
    const verifications = await sourceRpcClient.getAllVerificationsByUser(user);
    for (const client of networkRpcClients) {
      const clientSet = await client.getAllVerificationsByUser(user);
      if (!compareMessages(clientSet, verifications)) {
        logger.error(`${client.getServerMultiaddr()} verifications are not in sync for user ${user}`);
        return false;
      }
    }
  }
  return true;
  // Is there RPC to compare the merkle tries ?
};
