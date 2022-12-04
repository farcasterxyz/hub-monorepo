import { JSONRPCError } from 'jayson/promise';
import { err, ok, Result } from 'neverthrow';
import ProgressBar from 'progress';
import { RPCClient } from '~/network/rpc';
import { Body, IdRegistryEvent, Message, MessageType } from '~/types';
import { logger } from '~/utils/logger';

/** Submits a list of messages to the given RPC client */
export const submitInBatches = async (rpcClient: RPCClient, messages: Message[] | IdRegistryEvent[]) => {
  // limits how many requests we send at a time. If this number is too large, we'll run out memory while just building the requests
  const BATCH_SIZE = 5000;

  const progress = new ProgressBar('   Submitting [:bar] :elapseds :rate messages/s :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: messages.length,
  });
  let results: Result<void, JSONRPCError>[] = [];
  const batches = [];
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    batches.push(rpcClient.submitMessages(batch));
  }
  for (const batch of batches) {
    const innerRes = await batch;
    progress.tick(BATCH_SIZE);
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
    /* eslint-disable security/detect-object-injection */
    [shuffledMessages[i], shuffledMessages[j]] = [
      shuffledMessages[j] as Message<MessageType, Body>,
      shuffledMessages[i] as Message<MessageType, Body>,
    ];
    /* eslint-enable security/detect-object-injection */
  }
  return shuffledMessages;
};

/** Compares two sets and returns the items that the left set has and the right set doesn't */
export const ComputeSetDifference = (
  left: Result<Set<number | Message>, JSONRPCError>,
  right: Result<Set<number | Message>, JSONRPCError>
): Result<Set<string>, string> => {
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
      results[0] += result[0] as number;
      results[1] += result[1] as number;
      return results;
    });
  return {
    success: counts[0] as number,
    fail: counts[1] as number,
  };
};

export type SubmitCounts = {
  success: number;
  fail: number;
};
