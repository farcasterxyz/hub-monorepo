import { IdRegistryEvent, Message } from '@hub/flatbuffers';
import { HubResult } from '@hub/utils';
import { Result } from 'neverthrow';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import HubRpcClient from '~/rpc/client';
import { logger } from '~/utils/logger';

/** Submits a list of flatbuffers messages to the given RPC client */
export const submitInBatches = async (rpcClient: HubRpcClient, messages: MessageModel[] | IdRegistryEventModel[]) => {
  let results: (HubResult<Message> | HubResult<IdRegistryEvent>)[] = [];
  results = await Promise.all(
    messages.map((message) => {
      return message instanceof MessageModel
        ? rpcClient.submitMessage(message.message)
        : rpcClient.submitIdRegistryEvent(message.event);
    })
  );
  return getCounts(results);
};

export const post = (msg: string, start: number, stop: number) => {
  const delta = Number((stop - start) / 1000);
  const time = delta.toFixed(3);
  logger.info({ time, msg });
  return delta;
};

/** Randomly shuffles a list of messages */
export const shuffleMessages = (messages: MessageModel[]) => {
  const shuffledMessages = [...messages];
  for (let i = shuffledMessages.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // safe to disable because inputs are controlled and known
    /* eslint-disable security/detect-object-injection */
    [shuffledMessages[i], shuffledMessages[j]] = [
      shuffledMessages[j] as MessageModel,
      shuffledMessages[i] as MessageModel,
    ];
  }
  return shuffledMessages;
};

const getCounts = (results: Result<any, any>[]): SubmitCounts => {
  const counts = results
    .map((r) => {
      if (r.isErr()) logger.error(r);
      return [Number(r.isOk()), Number(r.isErr())];
    })
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
