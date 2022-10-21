import { JSONRPCError } from 'jayson/promise';
import { Result } from 'neverthrow';
import { RPCClient } from '~/network/rpc';
import { IdRegistryEvent, Message } from '~/types';
import { isIdRegistryEvent, isMessage } from '~/types/typeguards';
import { logger } from '~/utils/logger';

const getCounts = (results: Result<any, any>[]): SubmitCounts => {
  const counts = results
    .map((r) => [Number(r.isOk()), Number(r.isErr())])
    .reduce((results, result) => {
      results[0] += result[0];
      results[1] += result[1];
      return results;
    });
  return {
    success: counts[0],
    fail: counts[1],
  };
};

export type SubmitCounts = {
  success: number;
  fail: number;
};

export const submitInBatches = async (rpcClient: RPCClient, messages: Message[] | IdRegistryEvent[]) => {
  // limits what we try to do in parallel. If this number is too large, we'll run out of sockets to use for tcp
  const BATCH_SIZE = 100;
  let results: Result<void, JSONRPCError>[] = [];
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    const innerRes = await Promise.all(
      batch.map((message) => {
        if (isIdRegistryEvent(message)) {
          return rpcClient.submitIdRegistryEvent(message);
        }
        if (isMessage(message)) {
          return rpcClient.submitMessage(message);
        }
        throw Error('Trying to send invalid message');
      })
    );
    results = results.concat(innerRes);
  }
  return getCounts(results);
};

export const post = (msg: string, start: number, stop: number) => {
  const delta = Number((stop - start) / 1000);
  const time = delta.toFixed(3);
  logger.info({ time, msg });
  return delta;
};

export const shuffleMessages = (messages: Message[]) => {
  const shuffledMessages = [...messages];
  for (let i = shuffledMessages.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line security/detect-object-injection
    [shuffledMessages[i], shuffledMessages[j]] = [shuffledMessages[j], shuffledMessages[i]];
  }
  return shuffledMessages;
};
