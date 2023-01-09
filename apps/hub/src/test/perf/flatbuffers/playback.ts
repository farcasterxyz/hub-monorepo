import { Scenario } from '~/test/perf/flatbuffers/scenario';
import { post, shuffleMessages, submitInBatches } from '~/test/perf/utils';
import { logger } from '~/utils/logger';

export enum PlaybackOrder {
  /** Playback messages in order */
  SEQ,
  /** Playback messages in a random order */
  RND,
}

export interface PlaybackConfig {
  /** The order in which the messages should be sent to the Hub */
  order: PlaybackOrder;
}

export const playback = async (scenario: Scenario, config: PlaybackConfig) => {
  let counts;

  for (const task of scenario.tasks) {
    const start = performance.now();
    logger.info(`Using RPC server: ${task.rpcClient.serverMultiaddr} for task playback`);
    switch (config.order) {
      case PlaybackOrder.SEQ:
        counts = await submitInBatches(task.rpcClient, task.messages);
        break;
      case PlaybackOrder.RND:
        counts = await submitInBatches(task.rpcClient, shuffleMessages(task.messages));
        break;
      default:
        throw 'Unknown Message Playback Order';
    }
    const stop = performance.now();
    post(`Submitted ${task.messages.length} messages to ${task.rpcClient.serverMultiaddr}`, start, stop);
  }

  logger.info({ playback: counts, msg: 'Playback completed' });
};
