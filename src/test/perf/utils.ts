import { JSONRPCError } from 'jayson/promise';
import { err, ok, Result } from 'neverthrow';
import { RPCClient } from '~/network/rpc';
import { IdRegistryEvent, Message } from '~/types';
import { isIdRegistryEvent, isMessage } from '~/types/typeguards';
import { logger } from '~/utils/logger';

/** Submits a list of messages to the given RPC client */
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

/** Randomly shuffles a list of messages */
export const shuffleMessages = (messages: Message[]) => {
  const shuffledMessages = [...messages];
  for (let i = shuffledMessages.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // safe to disable because inputs are controlled and known
    // eslint-disable-next-line security/detect-object-injection
    [shuffledMessages[i], shuffledMessages[j]] = [shuffledMessages[j], shuffledMessages[i]];
  }
  return shuffledMessages;
};

/** Compares two sets and returns the items that the left set has and the right set doesn't */
export const ComputeSetDifference = (
  left: Result<Set<number | Message>, JSONRPCError>,
  right: Result<Set<number | Message>, JSONRPCError>
) => {
  if (left.isErr() || right.isErr()) return err('Failed to compare messages');

  // JSON encode set values
  const l = new Set([...left.value].map((i) => JSON.stringify(i)));
  const r = new Set([...right.value].map((i) => JSON.stringify(i)));
  const difference = new Set([...l].filter((item) => !r.has(item)));
  return ok(difference);
};

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
